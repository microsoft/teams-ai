import { describe, it, expect } from 'vitest';
import { parseScopesInput } from '../src/commands/app/update.js';

describe('parseScopesInput', () => {
  it('splits comma-separated scopes', () => {
    expect(parseScopesInput('team,groupChat')).toEqual(['team', 'groupChat']);
  });

  it('splits space-separated scopes (PowerShell unquoted array)', () => {
    expect(parseScopesInput('team groupChat')).toEqual(['team', 'groupChat']);
  });

  it('handles mixed commas and whitespace', () => {
    expect(parseScopesInput(' team, groupChat ,copilot ')).toEqual(['team', 'groupChat', 'copilot']);
  });

  it('returns empty array for blank input', () => {
    expect(parseScopesInput(' , ')).toEqual([]);
  });
});
