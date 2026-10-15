# Design: Agentic Identity Setup in `teams` CLI

## Status
Draft — not yet implemented.

## Problem
Microsoft Agent 365 introduces "agentic identity" (Entra Agent ID blueprints) as a
prerequisite for Register, Work IQ, and AI teammate capabilities. Setting it up today
requires installing and driving a separate .NET global tool (`a365`), understanding
blueprint/agent-identity/agent-user-account concepts, and manually reading a generated
JSON config. We want `teams` CLI users to get an agent identity with one simple command,
consistent with our existing UX (spinners, `--json`, `--yes`, `CliError`).

## Background: how Agent 365 setup works today
- Tool: `a365` (dotnet global tool, package `Microsoft.Agents.A365.DevTools.Cli`,
  requires .NET 8+).
- Auth: Microsoft-managed Entra enterprise app `Agent 365 CLI`
  (client ID `f54280f4-395e-4ea8-9e48-bf2d4952aa14`), falls back to a tenant-owned app
  of the same name. This is **different** from our CLI's own MSAL client
  (`7ea7c24c-b1f6-4a20-9d11-9ae12e9e7ac0`).
- Core command: `a365 setup all [--agent-name <name>] [--m365] [--aiteammate]`.
  - Creates Azure resource group, App Service Plan, Web App (system-assigned managed
    identity).
  - Registers an **agent blueprint** in Entra (app registration + service principal,
    `managerApplications` set, Graph/Messaging Bot API/Power Platform permission
    grants).
  - `--m365` additionally registers the messaging endpoint via MCP Platform (for
    Teams/Copilot agents).
  - `--aiteammate` switches to AI teammate mode (requires Frontier preview; needs a
    manually authored `a365.config.json`, unlike plain agent mode).
  - Writes `a365.generated.config.json` to the working directory with
    `agentBlueprintId`, `agentBlueprintObjectId`, `agentBlueprintServicePrincipalObjectId`,
    `agentBlueprintClientSecret` (masked/protected), `managedIdentityPrincipalId`,
    `botId`, `botMsaAppId`, `messagingEndpoint`, `resourceConsents[]`, `completed`,
    `completedAt`, `cliVersion`.
- Permissions: caller needs Global Administrator **or** Agent ID Developer role, plus
  Azure subscription contributor-level access.
  - As Global Administrator: setup completes fully, including OAuth2 `AllPrincipals`
    consent grants (browser consent popup may appear).
  - As Agent ID Developer: everything completes **except** the OAuth2 delegated
    permission grants. The CLI prints a consent URL that a Global Administrator must
    open separately. `resourceConsents` stays empty and `completed: false` until that
    happens.
- Custom permissions: `a365 setup permissions custom --resource-app-id <id> --scopes <a,b,c>`
  applies additional inline Graph scopes to an existing blueprint.
- Cloud variants: `prod` (default), `gcc`, `gcc-high`, `dod`, configured via
  `a365.config.json` fields or `A365_*` environment variables.

## Why wrap, not reimplement
- The agent blueprint/agent-identity model has no TDP equivalent; Graph's
  `agentIdentity` surface is new/evolving (preview, Frontier program gating).
- Reimplementing blueprint creation + Azure provisioning + consent flows in our own
  code would duplicate a whole product surface and require tracking Microsoft's
  changes to a preview API independently.
- The officially sanctioned dev path (`agent365-skills`) itself just orchestrates the
  `a365` CLI — there is no lower-level REST API meant for direct third-party use.
- Precedent in this repo: we already special-case TDP vs. Graph specifically to avoid
  reimplementing server-side logic TDP owns (see AAD App Creation convention in
  `packages/cli/AGENTS.md`). The same reasoning applies here, one level up: `a365`
  owns this logic, we orchestrate it.

## Goals
1. One command creates a working agent identity with minimal required input.
2. Output and errors match our existing CLI conventions (`logger`, `CliError`,
   `createSilentSpinner`, `--json`, `--yes`).
3. Clear, actionable messaging when a Global Administrator step is still required
   (not treated as a failure).
4. No duplicate business logic between an interactive menu entry and the scripted
   command (per Code Reuse convention).

## Non-goals (v1)
- Custom Azure infra options (SKU, region, custom resource group) — use `a365`
  defaults.
- GCC/GCC-High/DoD cloud support — v1 targets commercial cloud only.
- Managing/rotating blueprint credentials, deleting blueprints, or custom permission
  management (`setup permissions custom`) — candidates for fast-follow commands, not
  bundled into `create`.

## Proposed command

```
teams agent create [name] [--m365] [--azure] [--yes] [--json] [--verbose]
```

| Flag | Behavior |
| --- | --- |
| `name` (positional) | Agent name. Prompted if omitted and not `--yes`/`--json`; required otherwise. |
| `--m365` | [OPTIONAL] Registers the messaging endpoint for Teams/Copilot (passes `--m365` to `a365`). Default: off (plain blueprint agent). |
| `--aiteammate` | [OPTIONAL] Creates an **Agentic User** (AI teammate account) instead of an identity-only blueprint agent. **Required** before the agent can be installed/used from Teams, Copilot, or Copilot Studio — a plain blueprint agent only registers the identity and has no account that any surface can install. `teams app create --agent` always passes this, since it's specifically building a Teams-usable agent. |
| `--azure` | [OPTIONAL] Reserved placeholder for future custom infra flags (SKU/region); no-op in v1, or omitted entirely from the first cut. |
| `--yes` / `-y` | Skip confirmation prompts; use defaults (existing global flag). |
| `--json` | Emit `AgentCreateOutput` instead of human-readable text (existing global flag). |
| `--verbose` | Stream raw `a365` CLI output instead of suppressing it behind the spinner. |

### Flow
1. **Resolve name.** Prompt via `input()` if missing and not auto-confirm/JSON; else
   require the positional arg (`CliError("AGENT_NAME_REQUIRED", ...)` in JSON/`--yes`
   mode with no value).
2. **Preflight (spinner: "Checking Agent 365 CLI...").**
   - Detect `dotnet` on PATH; if missing, `CliError("DOTNET_REQUIRED", ...,
     "Install .NET 8+: https://dotnet.microsoft.com/download")`.
   - Detect `a365` on PATH / installed dotnet tool list. If missing: auto-install via
     `dotnet tool install --global Microsoft.Agents.A365.DevTools.Cli` (prompt unless
     `--yes`). If present but outdated vs. latest NuGet version (best-effort, skip
     check if offline): `dotnet tool update --global ...`.
3. **Tenant check.** Reuse existing MSAL `account` + `ensureTenantMatch(account.tenantId)`
   from `src/utils/az-prompts.ts` so a tenant mismatch fails fast, before a multi-minute
   Azure provisioning run starts.
4. **Run setup (spinner: "Creating agent identity...").**
   - Shell out: `a365 setup all --agent-name "<name>" [--m365]`, cwd = current working
     directory (same place `a365.generated.config.json` lands).
   - Buffer stdout/stderr; only print live if `--verbose`.
   - Non-zero exit → parse known `a365` failure patterns where possible, else wrap
     raw stderr tail into `CliError("AGENT_SETUP_FAILED", ...)`.
5. **Read result.** Parse `a365.generated.config.json` from cwd into a typed
   `AgentGeneratedConfig` interface.
6. **Report.**
   - Human mode: print agent identity essentials (`AGENT_ID`, blueprint ID, messaging
     endpoint if `--m365`) using existing credential-output styling conventions
     (`pc.bold(pc.green(...))` for success values, `pc.dim(...)` for labels).
   - If `completed === false` / `resourceConsents` empty → `pc.yellow(...)` block:
     "Admin consent required" + the consent URL `a365` printed, with instructions to
     share it with a Global Administrator. This is a **warning**, not a thrown error —
     command still exits 0.
   - `--json` mode: emit `AgentCreateOutput` (see below), still exit 0 for the
     pending-consent case, with `status: "pending_admin_consent"` vs. `"completed"`.

### Output shape

```typescript
interface AgentCreateOutput {
  status: "completed" | "pending_admin_consent";
  agentBlueprintId: string;
  agentBlueprintObjectId: string;
  managedIdentityPrincipalId: string;
  messagingEndpoint?: string; // present when --m365
  consentUrl?: string; // present when status === "pending_admin_consent"
  generatedConfigPath: string; // absolute path to a365.generated.config.json
}
```

## Error handling
All failure paths throw `CliError` with a stable code, human message, and a
remediation hint, per existing convention:

| Code | Trigger |
| --- | --- |
| `DOTNET_REQUIRED` | `dotnet` not found on PATH. |
| `AGENT_365_CLI_INSTALL_FAILED` | `dotnet tool install` for `a365` fails. |
| `AGENT_NAME_REQUIRED` | No name given and prompting unavailable (`--yes`/`--json` without positional arg). |
| `TENANT_MISMATCH` | Reused from `ensureTenantMatch` — MSAL tenant ≠ `az account show` tenant. |
| `AGENT_SETUP_FAILED` | `a365 setup all` exits non-zero. |
| `AGENT_CONFIG_NOT_FOUND` | `a365.generated.config.json` missing/unreadable after a reported success. |

## Layering (per repo conventions)
- `src/apps/agent365.ts` (new): shared, non-logging helpers — `isA365CliInstalled()`,
  `installA365Cli()`, `runA365SetupAll(options)`, `readGeneratedConfig(cwd)`. No
  `logger` calls here (per AGENTS.md rule for API/service helper modules).
- `src/commands/agent/create.ts` (new): Commander action, prompts, spinner,
  `logger`/`outputJson` calls, `wrapAction()`-wrapped.
- `src/commands/agent/index.ts` (new): registers `agent` command group (so future
  `agent status`, `agent permissions` subcommands have a home).
- Reuse `ensureTenantMatch` from `src/utils/az-prompts.ts` as-is.
- No business logic duplicated between an interactive menu entry (if/when added) and
  the scripted command — both call the `src/apps/agent365.ts` helpers.

## Open questions
1. Should `teams agent create` auto-run `dotnet tool install` without prompting even
   outside `--yes`, given it's a one-time, low-risk global tool install? (Leaning:
   still prompt once, like other first-run installs in this CLI.)
2. Do we surface a `teams agent status` companion command in the same PR, or treat it
   as fast-follow? (Leaning: fast-follow, keep first PR scoped to `create`.)
3. Where should docs live — new `teams.md/docs/cli/commands/agent/` tree, mirroring
   existing `commands/app/` structure? (Assumed yes, matching existing doc layout.)
4. Timeout/retry policy for `a365 setup all` (observed to take 3-5 minutes) — do we
   need a configurable timeout distinct from other CLI commands?

## Rollout plan
1. Implement `src/apps/agent365.ts` + `src/commands/agent/create.ts` per spec above.
2. Unit tests: dotnet/`a365` detection branching, generated-config parsing, pending
   vs. completed status output, `--json` shape.
3. Agentic smoke test added to `agentic-tests.md` (requires a real Agent 365-enabled
   tenant + .NET — likely manual/opt-in rather than CI-gated).
4. Docs: `teams.md/docs/cli/commands/agent/create.md` + update
   `commands/index.md` and top-level feature list.
5. Fast-follow candidates: `teams agent status`, `teams agent permissions custom`,
   GCC/GCC-High/DoD support.
