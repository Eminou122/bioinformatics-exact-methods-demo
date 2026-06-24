type Locale = 'fr' | 'en' | 'ar';

type BranchCandidate = {
  vertex: string;
  priorityScore: number;
  genomicSupportLinks: number;
};

type BranchExplanationInput = {
  currentPath: string[];
  rankedCandidates: BranchCandidate[];
  locale: Locale;
};

type BranchExplanationResult = {
  ok: boolean;
  provider: 'groq';
  advisory: string;
  errorCode: string | null;
};

type JsonResponse = {
  status(statusCode: number): JsonResponse;
  json(body: BranchExplanationResult): void;
  setHeader?(name: string, value: string): void;
};

type JsonRequest = {
  method?: string;
  body?: unknown;
};

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_TIMEOUT_MS = 8000;
const MAX_BODY_CHARS = 3000;
const MAX_CANDIDATES = 3;
const MAX_ADVISORY_CHARS = 900;

function safeResult(errorCode: string): BranchExplanationResult {
  return { ok: false, provider: 'groq', advisory: '', errorCode };
}

function isShortToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 32 && /^[\p{L}\p{N}_ .:-]+$/u.test(value);
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export function validateBranchExplanationInput(body: unknown): BranchExplanationInput | null {
  const parsed = parseBody(body);
  if (!parsed || typeof parsed !== 'object') return null;
  if (JSON.stringify(parsed).length > MAX_BODY_CHARS) return null;

  const record = parsed as {
    currentPath?: unknown;
    rankedCandidates?: unknown;
    locale?: unknown;
  };

  if (!Array.isArray(record.currentPath) || record.currentPath.length > 12 || !record.currentPath.every(isShortToken)) return null;
  if (record.locale !== 'fr' && record.locale !== 'en' && record.locale !== 'ar') return null;
  if (!Array.isArray(record.rankedCandidates) || record.rankedCandidates.length < 1 || record.rankedCandidates.length > MAX_CANDIDATES) return null;

  const rankedCandidates = record.rankedCandidates.map((candidate) => {
    if (!candidate || typeof candidate !== 'object') return null;
    const candidateRecord = candidate as { vertex?: unknown; priorityScore?: unknown; genomicSupportLinks?: unknown };
    if (!isShortToken(candidateRecord.vertex)) return null;
    if (typeof candidateRecord.priorityScore !== 'number' || !Number.isFinite(candidateRecord.priorityScore)) return null;
    if (typeof candidateRecord.genomicSupportLinks !== 'number' || !Number.isInteger(candidateRecord.genomicSupportLinks)) return null;
    if (candidateRecord.genomicSupportLinks < 0 || candidateRecord.genomicSupportLinks > 100) return null;
    return {
      vertex: candidateRecord.vertex,
      priorityScore: candidateRecord.priorityScore,
      genomicSupportLinks: candidateRecord.genomicSupportLinks,
    };
  });

  if (rankedCandidates.some((candidate) => candidate === null)) return null;

  return {
    currentPath: record.currentPath,
    rankedCandidates: rankedCandidates as BranchCandidate[],
    locale: record.locale,
  };
}

function buildPrompt(input: BranchExplanationInput): string {
  return [
    `Locale: ${input.locale}`,
    `Current path: ${input.currentPath.length ? input.currentPath.join(' -> ') : 'empty'}`,
    'Ranked candidate branches:',
    ...input.rankedCandidates.map((candidate) => (
      `${candidate.vertex}: deterministicScore=${candidate.priorityScore}, genomicSupportCount=${candidate.genomicSupportLinks}`
    )),
    'Write exactly 3 concise bullets explaining this ranking.',
  ].join('\n');
}

function readGroqAdvisory(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return null;
  const content = (choices[0] as { message?: { content?: unknown } } | undefined)?.message?.content;
  if (typeof content !== 'string' || !content.trim()) return null;
  return content.trim().slice(0, MAX_ADVISORY_CHARS);
}

export async function createBranchExplanation(
  body: unknown,
  apiKey = process.env.GROQ_API_KEY,
  fetchImpl: typeof fetch = fetch
): Promise<BranchExplanationResult> {
  const input = validateBranchExplanationInput(body);
  if (!input) return safeResult('BAD_REQUEST');
  if (!apiKey) return safeResult('MISSING_KEY');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetchImpl(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 150,
        messages: [
          {
            role: 'system',
            content: [
              'You explain deterministic branch ranking for a teaching demo.',
              'Advisory only.',
              'Do not claim proof, validity, optimality, biological discovery, or superior performance.',
              'The deterministic exact solver remains authoritative.',
            ].join(' '),
          },
          {
            role: 'user',
            content: buildPrompt(input),
          },
        ],
      }),
    });

    if (!response.ok) return safeResult('PROVIDER_UNAVAILABLE');
    const advisory = readGroqAdvisory(await response.json());
    if (!advisory) return safeResult('PROVIDER_UNAVAILABLE');
    return { ok: true, provider: 'groq', advisory, errorCode: null };
  } catch {
    return safeResult('PROVIDER_UNAVAILABLE');
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: JsonRequest, res: JsonResponse) {
  res.setHeader?.('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json(safeResult('METHOD_NOT_ALLOWED'));
    return;
  }

  const result = await createBranchExplanation(req.body);
  res.status(result.ok ? 200 : result.errorCode === 'BAD_REQUEST' ? 400 : 503).json(result);
}
