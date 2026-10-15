import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CliError } from '../utils/errors.js';
import { runAz } from '../utils/az.js';

const execFileAsync = promisify(execFile);

const A365_PACKAGE_ID = 'Microsoft.Agents.A365.DevTools.Cli';
const GENERATED_CONFIG_FILENAME = 'a365.generated.config.json';

/** Shape of `a365.generated.config.json`, written by `a365 setup all`. */
export interface AgentGeneratedConfig {
  managedIdentityPrincipalId: string;
  agentBlueprintId: string;
  agentBlueprintObjectId: string;
  agentBlueprintServicePrincipalObjectId: string;
  agentBlueprintClientSecret?: string;
  agentBlueprintClientSecretProtected?: boolean;
  botId?: string;
  botMsaAppId?: string;
  messagingEndpoint?: string;
  resourceConsents: string[];
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
  /** Called with raw stdout/stderr chunks as they arrive, for --verbose streaming. */
  onOutput?: (chunk: string) => void;
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
  // Always create an Agentic User (AI teammate) — a plain blueprint agent only
  // registers the identity and can never be installed/used from Teams or Copilot.
  // The messaging endpoint is always deferred (a365 prompts/defers it regardless
  // of --m365 when no --messaging-endpoint is supplied); set it later via
  // `teams agent update-endpoint`.
  const args = ['setup', 'all', '--agent-name', options.agentName, '--aiteammate'];

  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn('a365', args, { cwd: options.cwd });

    let stderrTail = '';
    child.stdout?.on('data', (chunk: Buffer) => options.onOutput?.(chunk.toString()));
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-4000);
      options.onOutput?.(text);
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

export interface A365UpdateEndpointOptions {
  /** Agent base name. Optional when `a365.generated.config.json` exists in `cwd`. */
  agentName?: string;
  /** HTTPS URL to delete the old messaging endpoint and register in its place. */
  endpoint: string;
  cwd: string;
  onOutput?: (chunk: string) => void;
}

/**
 * Run `a365 setup blueprint --update-endpoint <url>` to replace the
 * messaging endpoint on an existing agent blueprint (e.g. after a new
 * devtunnel/ngrok session). Streams output via onOutput; throws
 * CliError('AGENT_ENDPOINT_UPDATE_FAILED', ...) on non-zero exit.
 */
export async function runA365UpdateEndpoint(options: A365UpdateEndpointOptions): Promise<void> {
  const args = ['setup', 'blueprint', '--update-endpoint', options.endpoint];
  if (options.agentName) args.push('--agent-name', options.agentName);

  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn('a365', args, { cwd: options.cwd });

    let stderrTail = '';
    child.stdout?.on('data', (chunk: Buffer) => options.onOutput?.(chunk.toString()));
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-4000);
      options.onOutput?.(text);
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
          `\`a365 setup blueprint --update-endpoint\` exited with code ${code ?? 'unknown'}.`,
          stderrTail.trim() || undefined
        )
      );
    });
  });
}

/**
 * Compute the Teams-valid SSO identifier URI for a bot registration.
 * Teams requires the `api://botid-{botId}` prefix; omitting it is a common
 * manual mistake when running `az ad app update --identifier-uris` by hand.
 */
export function computeBotIdentifierUri(botId: string): string {
  return `api://botid-${botId}`;
}

/**
 * Update the bot's AAD app registration identifier URI (SSO URI) to the
 * Teams-required `api://botid-{botId}` format via Azure CLI.
 * Throws CliError('AGENT_IDENTIFIER_UPDATE_FAILED', ...) on failure.
 */
export async function runUpdateBotIdentifierUri(
  botAppId: string,
  identifierUri: string
): Promise<void> {
  try {
    await runAz(['ad', 'app', 'update', '--id', botAppId, '--identifier-uris', identifierUri]);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    throw new CliError(
      'AGENT_IDENTIFIER_UPDATE_FAILED',
      `Failed to update the bot's identifier URI: ${reason}`,
      `Try manually: az ad app update --id ${botAppId} --identifier-uris ${identifierUri}`
    );
  }
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
