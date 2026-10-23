import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CliError } from '../utils/errors.js';
import { TDP_HOST } from '../utils/tdp-host.js';

const execFileAsync = promisify(execFile);

const A365_PACKAGE_ID = 'Microsoft.Agents.A365.DevTools.Cli';
const GENERATED_CONFIG_FILENAME = 'a365.generated.config.json';
/** Config/secret file `a365 setup all` writes that should never be committed. */
export const A365_CONFIG_FILENAME = 'a365.config.json';

/** One entry of `AgentGeneratedConfig.resourceConsents` — per-resource admin consent status. */
export interface ResourceConsent {
  resourceName: string;
  resourceAppId: string;
  consentGranted: boolean;
  consentTimestamp?: string;
  scopes?: string[];
  inheritablePermissionsConfigured?: boolean;
  inheritablePermissionsAlreadyExist?: boolean;
}

/** Shape of `a365.generated.config.json`, written by `a365 setup all`. */
export interface AgentGeneratedConfig {
  agentBlueprintId: string;
  agentBlueprintObjectId: string;
  /** Object ID of the blueprint's service principal — the managed identity used for the agent. */
  agentBlueprintServicePrincipalObjectId: string;
  agentBlueprintClientSecret?: string;
  agentBlueprintClientSecretProtected?: boolean;
  botId?: string;
  botMsaAppId?: string;
  messagingEndpoint?: string;
  resourceConsents: ResourceConsent[];
  completed: boolean;
  completedAt?: string;
  cliVersion?: string;
  /** Present when admin consent is still pending; not part of the documented schema but surfaced defensively. */
  consentUrl?: string;
}

export interface A365SetupOptions {
  agentName: string;
  /** Working directory to run `a365` in; also where the generated config is read from. */
  cwd: string;
  /** Called with raw stdout/stderr chunks as they arrive, tagged by stream. */
  onOutput?: (chunk: string, stream: 'stdout' | 'stderr') => void;
}

export async function isDotnetInstalled(): Promise<boolean> {
  try {
    await execFileAsync('dotnet', ['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function isA365CliInstalled(): Promise<boolean> {
  try {
    await execFileAsync('a365', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Install the Agent 365 CLI as a .NET global tool.
 * Throws CliError('AGENT_365_CLI_INSTALL_FAILED', ...) on failure.
 */
export async function installA365Cli(): Promise<void> {
  try {
    await execFileAsync('dotnet', ['tool', 'install', '--global', A365_PACKAGE_ID]);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    throw new CliError(
      'AGENT_365_CLI_INSTALL_FAILED',
      `Failed to install the Agent 365 CLI: ${reason}`,
      `Try manually: dotnet tool install --global ${A365_PACKAGE_ID}`
    );
  }
}

/**
 * Run `a365 setup all` to create (or update) an agent blueprint and its
 * Azure infrastructure. Streams output via onOutput; throws
 * CliError('AGENT_SETUP_FAILED', ...) on non-zero exit.
 */
export async function runA365SetupAll(options: A365SetupOptions): Promise<void> {
  // Always create an Agentic User (AI teammate) — a plain blueprint agent
  // only registers the identity and can never be installed/used from Teams
  // or Copilot. The messaging endpoint is left unset here (an interactive
  // run still prompts for it); set/change it later via
  // `teams agent endpoint`.
  const args = ['setup', 'all', '--agent-name', options.agentName, '--aiteammate'];

  await new Promise<void>((resolvePromise, reject) => {
    // Inherit stdin: `a365` prompts interactively for its own steps (e.g.
    // "Assign this application permission now? [y/N]:"), and without a real
    // terminal stdin those prompts can never receive a keystroke.
    const child = spawn('a365', args, { cwd: options.cwd, stdio: ['inherit', 'pipe', 'pipe'] });

    let stderrTail = '';
    child.stdout?.on('data', (chunk: Buffer) => options.onOutput?.(chunk.toString(), 'stdout'));
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-4000);
      options.onOutput?.(text, 'stderr');
    });

    child.on('error', (error) => {
      reject(
        new CliError(
          'AGENT_SETUP_FAILED',
          `Failed to run the Agent 365 CLI: ${error.message}`,
          'Verify `a365` is on your PATH, then try again.'
        )
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new CliError(
          'AGENT_SETUP_FAILED',
          `\`a365 setup all\` exited with code ${code ?? 'unknown'}.`,
          stderrTail.trim() || undefined
        )
      );
    });
  });
}

/**
 * Parse `a365 setup all`'s streamed output for a messaging endpoint it
 * registered during this run. Needed because `a365.generated.config.json`
 * does not reliably persist `messagingEndpoint` back (observed empty even
 * right after a successful "Registered successfully" run), so this is the
 * only way to detect "already set, don't prompt again" without re-querying
 * `a365` itself.
 */
export function extractRegisteredMessagingEndpoint(output: string): string | undefined {
  const summaryMatch = output.match(/Messaging endpoint\s+registered\s+'([^']+)'/i);
  if (summaryMatch) return summaryMatch[1];

  const inlineMatch = output.match(/^\s*Messaging Endpoint:\s*(\S+)\s*$/im);
  return inlineMatch?.[1];
}

export interface A365PublishOptions {
  cwd: string;
  /**
   * Agent name. Only needed when publishing outside a folder that already
   * has a config file (`a365.generated.config.json`/`a365.config.json`).
   * Passing this switches `a365` to its "no config file required" lookup
   * path, which ignores the on-disk `aiTeammate` field and otherwise
   * defaults to blueprint-only -- so `--aiteammate` is always forced on
   * alongside it to keep behavior consistent with the config-driven path.
   */
  agentName?: string;
  /** Called with raw stdout/stderr chunks as they arrive, tagged by stream. */
  onOutput?: (chunk: string, stream: 'stdout' | 'stderr') => void;
}

/**
 * Run `a365 publish` to update `manifest.json` with the blueprint ID and
 * package it (with icons) into `manifest/manifest.zip`, ready for manual
 * upload to the Microsoft 365 admin center. Streams output via onOutput;
 * throws CliError('AGENT_PUBLISH_FAILED', ...) on non-zero exit.
 */
export async function runA365Publish(options: A365PublishOptions): Promise<void> {
  // With no arguments, `a365 publish` reads `aiTeammate`/the agent name
  // straight from `a365.generated.config.json`/`a365.config.json` in cwd
  // (written by `setup all`) -- the default, and the only path that needs
  // no extra flags. When an agent name is explicitly passed instead, force
  // `--aiteammate` alongside it so `a365` doesn't fall back to its
  // blueprint-only default ("Nothing to publish for blueprint-based
  // agents").
  const args = options.agentName ? ['publish', '--agent-name', options.agentName, '--aiteammate'] : ['publish'];

  await new Promise<void>((resolvePromise, reject) => {
    // Inherit stdin for the same reason as `runA365SetupAll` — `a365` can
    // prompt interactively here too.
    const child = spawn('a365', args, { cwd: options.cwd, stdio: ['inherit', 'pipe', 'pipe'] });

    let stderrTail = '';
    child.stdout?.on('data', (chunk: Buffer) => options.onOutput?.(chunk.toString(), 'stdout'));
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-4000);
      options.onOutput?.(text, 'stderr');
    });

    child.on('error', (error) => {
      reject(
        new CliError(
          'AGENT_PUBLISH_FAILED',
          `Failed to run the Agent 365 CLI: ${error.message}`,
          'Verify `a365` is on your PATH, then try again.'
        )
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new CliError(
          'AGENT_PUBLISH_FAILED',
          `\`a365 publish\` exited with code ${code ?? 'unknown'}.`,
          stderrTail.trim() || undefined
        )
      );
    });
  });
}

/** Absolute paths to the manifest files `a365 publish` writes into `cwd`. */
export interface ManifestPaths {
  manifestJsonPath: string;
  manifestZipPath: string;
}

export function getManifestPaths(cwd: string): ManifestPaths {
  return {
    manifestJsonPath: join(cwd, 'manifest', 'manifest.json'),
    manifestZipPath: join(cwd, 'manifest', 'manifest.zip'),
  };
}

/**
 * Confirm `a365 publish` actually wrote the manifest files it claimed to.
 * Throws CliError('AGENT_MANIFEST_NOT_FOUND', ...) if either is missing.
 */
export function assertManifestPublished(cwd: string): ManifestPaths {
  const paths = getManifestPaths(cwd);
  if (!existsSync(paths.manifestJsonPath) || !existsSync(paths.manifestZipPath)) {
    throw new CliError(
      'AGENT_MANIFEST_NOT_FOUND',
      'manifest/manifest.json or manifest/manifest.zip was not found after publish completed.',
      `Check for errors above, or inspect the output of \`a365 publish\` in ${cwd}.`
    );
  }
  return paths;
}

/**
 * Best-effort fallback for the blueprint ID when `a365.generated.config.json`
 * doesn't exist (e.g. `publish` run name-only, outside a `setup all`
 * folder — `publish` never writes that config itself). `a365 publish`
 * stamps the blueprint's AAD app ID into the manifest it generates as
 * `bots[0].botId`, so read it from there instead. Returns undefined rather
 * than throwing — this is a nice-to-have for display, not required for
 * publish to have succeeded.
 */
export function tryReadBlueprintIdFromManifest(manifestJsonPath: string): string | undefined {
  try {
    const raw = readFileSync(manifestJsonPath, 'utf-8');
    const manifest = JSON.parse(raw) as { bots?: Array<{ botId?: string }> };
    const botId = manifest.bots?.[0]?.botId;
    return typeof botId === 'string' && botId.length > 0 ? botId : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build the Teams Developer Portal URL for configuring an agent blueprint's
 * messaging infrastructure (Agent Type + Notification URL) — the manual step
 * `create-instance` docs otherwise ask you to assemble by hand from
 * `agentBlueprintId`. Agent 365 blueprint tooling only exists on dev-int
 * right now (not yet shipped to prod), so this is only correct when
 * `TEAMS_DEV_API=1` is set -- callers should check `isDevApiEnabled()` and
 * tell the user to set it first, same as other dev-int-only TDP features.
 */
export function buildDeveloperPortalConfigUrl(agentBlueprintId: string): string {
  return `${TDP_HOST}/tools/agent-blueprint/${agentBlueprintId}/configuration`;
}

/** Microsoft 365 admin center page for uploading/listing published agents. */
export const M365_ADMIN_CENTER_AGENTS_URL = 'https://admin.cloud.microsoft/?#/agents/all';

/**
 * Parse `a365 setup blueprint --show-secret`'s stdout for the plaintext
 * client secret. `a365` prints it as a labeled line (e.g. `Client Secret:
 * <value>`); fall back to the last non-empty line if no label is found, in
 * case a future version prints the bare value.
 */
export function extractBlueprintSecret(output: string): string | undefined {
  const labeledMatch = output.match(/(?:Client\s*)?Secret\s*:\s*(\S+)\s*$/im);
  if (labeledMatch) return labeledMatch[1];

  const lastLine = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .pop();
  return lastLine && !lastLine.includes(' ') ? lastLine : undefined;
}

export interface A365ShowSecretOptions {
  cwd: string;
}

/**
 * Run `a365 setup blueprint --show-secret` to retrieve the blueprint's
 * client secret in plaintext. The value `a365.generated.config.json` writes
 * for `agentBlueprintClientSecret` is DPAPI-protected ciphertext on Windows
 * (not usable directly as a `CLIENT_SECRET`), so this is the only reliable
 * way to get the real secret for `.env`. No setup steps are performed, so
 * this never prompts -- stdin doesn't need to be inherited.
 *
 * Throws CliError('AGENT_SECRET_RETRIEVE_FAILED', ...) on non-zero exit or
 * if the secret can't be parsed from the output.
 */
export async function runA365ShowSecret(options: A365ShowSecretOptions): Promise<string> {
  const args = ['setup', 'blueprint', '--show-secret'];

  const stdout = await new Promise<string>((resolvePromise, reject) => {
    const child = spawn('a365', args, { cwd: options.cwd, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdoutText = '';
    let stderrTail = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutText += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-4000);
    });

    child.on('error', (error) => {
      reject(
        new CliError(
          'AGENT_SECRET_RETRIEVE_FAILED',
          `Failed to run the Agent 365 CLI: ${error.message}`,
          'Verify `a365` is on your PATH, then try again.'
        )
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise(stdoutText);
        return;
      }
      reject(
        new CliError(
          'AGENT_SECRET_RETRIEVE_FAILED',
          `\`a365 setup blueprint --show-secret\` exited with code ${code ?? 'unknown'}.`,
          stderrTail.trim() || undefined
        )
      );
    });
  });

  const secret = extractBlueprintSecret(stdout);
  if (!secret) {
    throw new CliError(
      'AGENT_SECRET_RETRIEVE_FAILED',
      'Could not parse the client secret from `a365 setup blueprint --show-secret` output.',
      'Run `a365 setup blueprint --show-secret` manually from the project folder to retrieve it.'
    );
  }
  return secret;
}

export interface A365UpdateEndpointOptions {
  /** HTTPS URL to register as the messaging endpoint. */
  endpoint: string;
  cwd: string;
  /** Called with raw stdout/stderr chunks as they arrive, tagged by stream. */
  onOutput?: (chunk: string, stream: 'stdout' | 'stderr') => void;
}

/**
 * Run `a365 setup blueprint --endpoint-only --messaging-endpoint <url>` to
 * (re)register the messaging endpoint on an existing agent blueprint (e.g.
 * after a new devtunnel/ngrok session). Streams output via onOutput; throws
 * CliError('AGENT_ENDPOINT_UPDATE_FAILED', ...) on non-zero exit.
 *
 * Unlike `publish`/`cleanup`, `--endpoint-only` has no `--agent-name`
 * lookup path in `a365` itself: its requirements check resolves the agent
 * via `--agent-name` when given, but the actual endpoint registration call
 * always reads `a365.config.json`/`a365.generated.config.json` straight
 * from `cwd`, ignoring that resolved name entirely. So an `--agent-name`
 * flag here would be silently discarded -- callers must run this from a
 * folder that already has the config file (see `assertGeneratedConfigExists`
 * in `commands/agent/update-endpoint.ts`).
 */
export async function runA365UpdateEndpoint(options: A365UpdateEndpointOptions): Promise<void> {
  const args = ['setup', 'blueprint', '--endpoint-only', '--messaging-endpoint', options.endpoint];

  await new Promise<void>((resolvePromise, reject) => {
    // Inherit stdin for the same reason as `runA365SetupAll` — `a365` can
    // prompt interactively here too.
    const child = spawn('a365', args, { cwd: options.cwd, stdio: ['inherit', 'pipe', 'pipe'] });

    let stderrTail = '';
    child.stdout?.on('data', (chunk: Buffer) => options.onOutput?.(chunk.toString(), 'stdout'));
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-4000);
      options.onOutput?.(text, 'stderr');
    });

    child.on('error', (error) => {
      reject(
        new CliError(
          'AGENT_ENDPOINT_UPDATE_FAILED',
          `Failed to run the Agent 365 CLI: ${error.message}`,
          'Verify `a365` is on your PATH, then try again.'
        )
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new CliError(
          'AGENT_ENDPOINT_UPDATE_FAILED',
          `\`a365 setup blueprint --endpoint-only\` exited with code ${code ?? 'unknown'}.`,
          stderrTail.trim() || undefined
        )
      );
    });
  });
}

export interface A365CleanupOptions {
  /** Agent base name. Optional when `a365.generated.config.json` exists in `cwd`. */
  agentName?: string;
  /** Show what would be deleted without making any changes. */
  dryRun?: boolean;
  cwd: string;
  /** Called with raw stdout/stderr chunks as they arrive, tagged by stream. */
  onOutput?: (chunk: string, stream: 'stdout' | 'stderr') => void;
}

/**
 * Run `a365 cleanup` to remove ALL resources for an agent (Entra ID
 * blueprint + service principal, instance identity/user, and Azure
 * resources). Always passes `-y`: confirmation is handled up front by the
 * caller (`teams agent cleanup`) instead, so `a365` doesn't prompt a second
 * time. Streams output via onOutput; throws
 * CliError('AGENT_CLEANUP_FAILED', ...) on non-zero exit.
 */
export async function runA365Cleanup(options: A365CleanupOptions): Promise<void> {
  const args = ['cleanup', '-y'];
  if (options.agentName) args.push('--agent-name', options.agentName);
  if (options.dryRun) args.push('--dry-run');

  await new Promise<void>((resolvePromise, reject) => {
    // Inherit stdin for the same reason as `runA365SetupAll` — `a365` can
    // prompt interactively here too.
    const child = spawn('a365', args, { cwd: options.cwd, stdio: ['inherit', 'pipe', 'pipe'] });

    let stderrTail = '';
    child.stdout?.on('data', (chunk: Buffer) => options.onOutput?.(chunk.toString(), 'stdout'));
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-4000);
      options.onOutput?.(text, 'stderr');
    });

    child.on('error', (error) => {
      reject(
        new CliError(
          'AGENT_CLEANUP_FAILED',
          `Failed to run the Agent 365 CLI: ${error.message}`,
          'Verify `a365` is on your PATH, then try again.'
        )
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new CliError(
          'AGENT_CLEANUP_FAILED',
          `\`a365 cleanup\` exited with code ${code ?? 'unknown'}.`,
          stderrTail.trim() || undefined
        )
      );
    });
  });
}

/**
 * Read and parse `a365.generated.config.json` from the given directory.
 * Throws CliError('AGENT_CONFIG_NOT_FOUND', ...) if missing or unreadable.
 */
export function readGeneratedConfig(cwd: string): AgentGeneratedConfig {
  const path = join(cwd, GENERATED_CONFIG_FILENAME);

  if (!existsSync(path)) {
    throw new CliError(
      'AGENT_CONFIG_NOT_FOUND',
      `${GENERATED_CONFIG_FILENAME} was not found after setup completed.`,
      `Check for errors above, or inspect the output of \`a365 setup all\` in ${cwd}.`
    );
  }

  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as AgentGeneratedConfig;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    throw new CliError(
      'AGENT_CONFIG_NOT_FOUND',
      `Failed to read ${GENERATED_CONFIG_FILENAME}: ${reason}`
    );
  }
}

export function getGeneratedConfigPath(cwd: string): string {
  return join(cwd, GENERATED_CONFIG_FILENAME);
}

/** Config/secret files `a365 setup all` writes that should never be committed. */
export const A365_GITIGNORE_ENTRIES = [A365_CONFIG_FILENAME, GENERATED_CONFIG_FILENAME];

/**
 * Append any of `entries` missing from `cwd`'s `.gitignore` (created if
 * absent). Used so the a365-generated config/secret files - and the .env
 * Teams SDK credentials merged alongside them - never get committed.
 */
export function ensureGitignoreEntries(cwd: string, entries: string[]): void {
  const gitignorePath = join(cwd, '.gitignore');
  const existing = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf-8') : '';
  const existingLines = new Set(existing.split('\n').map((line) => line.trim()));

  const missing = entries.filter((entry) => !existingLines.has(entry));
  if (missing.length === 0) return;

  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  writeFileSync(gitignorePath, `${existing}${prefix}${missing.join('\n')}\n`);
}

/**
 * `a365 setup all` writes its own `.env` with dotnet Agent SDK configuration
 * keys (e.g. `CONNECTIONS__SERVICE_CONNECTION__SETTINGS__CLIENTID`,
 * `AGENTAPPLICATION__...`, `AGENT365OBSERVABILITY__...`) regardless of the
 * target project's language. These are meaningless outside a dotnet Agent
 * SDK host and shouldn't leak into a TypeScript/Python/C# Teams SDK project
 * that only expects CLIENT_ID/CLIENT_SECRET/TENANT_ID.
 */
const A365_ENV_KEY_PATTERNS = [
  /^CONNECTIONS__/,
  /^CONNECTIONSMAP__/,
  /^AGENTAPPLICATION__/,
  /^AGENT365OBSERVABILITY__/,
  /^ENABLE_A365_OBSERVABILITY_EXPORTER$/,
  /^AGENT_ID$/,
];

/**
 * Remove any lines in `cwd`'s `.env` matching `A365_ENV_KEY_PATTERNS`,
 * written there by `a365 setup all`. Called before merging in the Teams
 * SDK's own CLIENT_ID/CLIENT_SECRET/TENANT_ID so the resulting file only
 * contains keys the Teams SDK expects. No-op if `.env` doesn't exist.
 */
export function stripA365EnvEntries(cwd: string): void {
  const envPath = join(cwd, '.env');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const filtered = lines.filter((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) return true;
    return !A365_ENV_KEY_PATTERNS.some((pattern) => pattern.test(match[1]));
  });

  if (filtered.length === lines.length) return;
  writeFileSync(envPath, filtered.join('\n').replace(/\n{3,}/g, '\n\n'));
}
