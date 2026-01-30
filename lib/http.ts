export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const { timeoutMs = Number(process.env.WEBHOOK_TIMEOUT_MS ?? 10000), ...options } = init;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number; retries?: number; backoffMs?: number } = {}
) {
  const { retries = 2, backoffMs = 500, ...options } = init;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchWithTimeout(input, options);
    } catch (error) {
      lastError = error;

      if (attempt >= retries) {
        break;
      }

      const delay = backoffMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
