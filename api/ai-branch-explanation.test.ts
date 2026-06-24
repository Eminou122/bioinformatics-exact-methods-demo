import { describe, expect, test, vi } from 'vitest';
import { createBranchExplanation, validateBranchExplanationInput } from './ai-branch-explanation';

const validPayload = {
  currentPath: ['R1'],
  locale: 'en',
  rankedCandidates: [
    { vertex: 'R2', priorityScore: 12, genomicSupportLinks: 2 },
    { vertex: 'R3', priorityScore: 8, genomicSupportLinks: 1 },
  ],
};

describe('ai branch explanation endpoint', () => {
  test('rejects missing malformed and oversized payloads', async () => {
    expect(validateBranchExplanationInput(undefined)).toBeNull();
    expect(validateBranchExplanationInput({})).toBeNull();
    expect(validateBranchExplanationInput('{bad json')).toBeNull();
    expect(validateBranchExplanationInput({ ...validPayload, rankedCandidates: [] })).toBeNull();
    expect(validateBranchExplanationInput({
      ...validPayload,
      rankedCandidates: [
        ...validPayload.rankedCandidates,
        { vertex: 'R4', priorityScore: 7, genomicSupportLinks: 1 },
        { vertex: 'R5', priorityScore: 6, genomicSupportLinks: 1 },
      ],
    })).toBeNull();
    expect(validateBranchExplanationInput({ ...validPayload, currentPath: ['R1'.repeat(2000)] })).toBeNull();

    await expect(createBranchExplanation({}, 'test-key', vi.fn() as unknown as typeof fetch)).resolves.toEqual({
      ok: false,
      provider: 'groq',
      advisory: '',
      errorCode: 'BAD_REQUEST',
    });
  });

  test('rejects valid payloads when server key is missing', async () => {
    await expect(createBranchExplanation(validPayload, '', vi.fn() as unknown as typeof fetch)).resolves.toEqual({
      ok: false,
      provider: 'groq',
      advisory: '',
      errorCode: 'MISSING_KEY',
    });
  });

  test('returns advisory JSON without leaking the provider key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '- R2 ranks first.\n- R3 follows.\n- Solver remains authoritative.' } }],
      }),
    }) as unknown as typeof fetch;

    const result = await createBranchExplanation(validPayload, 'secret-groq-key', fetchMock);

    expect(result).toEqual({
      ok: true,
      provider: 'groq',
      advisory: '- R2 ranks first.\n- R3 follows.\n- Solver remains authoritative.',
      errorCode: null,
    });
    expect(JSON.stringify(result)).not.toContain('secret-groq-key');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse((fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(requestBody.model).toBe('llama-3.1-8b-instant');
    expect(requestBody.max_tokens).toBe(150);
  });
});
