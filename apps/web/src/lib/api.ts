export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new ApiError(
      'The server is taking a little break. Please try again in a moment.',
      response.ok ? 502 : response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      Array.isArray(data.message)
        ? data.message.join(' ')
        : data.message || 'Something went wrong. Please try again.',
      response.status,
    );
  return data;
}
export function mutation(
  csrf: string,
  body?: unknown,
  method = 'POST',
): RequestInit {
  return {
    method,
    headers: { 'X-CSRF-Token': csrf, 'Idempotency-Key': crypto.randomUUID() },
    body: body ? JSON.stringify(body) : undefined,
  };
}
export type Pot = {
  id: string;
  code: string;
  name: string;
  story: string;
  cover: number;
  status: string;
  suspended: boolean;
  targetMinor: number | null;
  deadlineAt: string | null;
  payoutMode: 'INSTANT' | 'SCHEDULED' | 'ON_CLOSE';
  payoutAt: string | null;
  payoutAccountName: string;
  minContributionMinor: number;
  showAmountsPublicly: boolean;
  allowAnonymous: boolean;
  thankYouMessage: string;
  unrecovered: boolean;
  currency: string;
  demo: boolean;
  mode: 'mock' | 'sandbox' | 'live';
  totalMinor: number;
  count: number;
  organizer: { name: string; verified: boolean };
  donors: {
    id: string;
    name: string;
    amountMinor: number | null;
    message: string | null;
    at: string;
    status: string;
  }[];
  balanceMinor?: number;
};
