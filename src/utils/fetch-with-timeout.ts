const REQUEST_TIMEOUT = 1000;

export const fetchWithTimeout = async (
  url: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
  timeout: number = REQUEST_TIMEOUT,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
