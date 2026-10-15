import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIsInteractive = vi.fn();
vi.mock('../src/utils/interactive.js', () => ({
  isInteractive: mockIsInteractive,
  confirmAction: vi.fn(),
}));

const mockSelect = vi.fn();
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: mockSelect,
}));

describe('shouldCreateAgent', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns true when --agent flag is passed, without prompting', async () => {
    const { shouldCreateAgent } = await import('../src/commands/app/create.js');
    const result = await shouldCreateAgent({ agent: true });
    expect(result).toBe(true);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('returns false when --azure is passed, without prompting', async () => {
    mockIsInteractive.mockReturnValue(true);
    const { shouldCreateAgent } = await import('../src/commands/app/create.js');
    const result = await shouldCreateAgent({ azure: true });
    expect(result).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('returns false when --teams-managed is passed, without prompting', async () => {
    mockIsInteractive.mockReturnValue(true);
    const { shouldCreateAgent } = await import('../src/commands/app/create.js');
    const result = await shouldCreateAgent({ teamsManaged: true });
    expect(result).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('returns false without prompting in non-interactive mode', async () => {
    mockIsInteractive.mockReturnValue(false);
    const { shouldCreateAgent } = await import('../src/commands/app/create.js');
    const result = await shouldCreateAgent({});
    expect(result).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('returns false without prompting in JSON mode', async () => {
    mockIsInteractive.mockReturnValue(true);
    const { shouldCreateAgent } = await import('../src/commands/app/create.js');
    const result = await shouldCreateAgent({ json: true });
    expect(result).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('prompts interactively and returns true when user picks the agent option', async () => {
    mockIsInteractive.mockReturnValue(true);
    mockSelect.mockResolvedValueOnce('agent');
    const { shouldCreateAgent } = await import('../src/commands/app/create.js');
    const result = await shouldCreateAgent({});
    expect(result).toBe(true);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('What do you want to create'),
      })
    );
  });

  it('prompts interactively and returns false when user picks the bot option', async () => {
    mockIsInteractive.mockReturnValue(true);
    mockSelect.mockResolvedValueOnce('bot');
    const { shouldCreateAgent } = await import('../src/commands/app/create.js');
    const result = await shouldCreateAgent({});
    expect(result).toBe(false);
  });
});
