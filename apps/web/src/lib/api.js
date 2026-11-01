export class ApiError extends Error {
  constructor(message, status, errors, requestId) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.requestId = requestId;
  }
}

function csrfToken() {
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  return value ? decodeURIComponent(value.slice('XSRF-TOKEN='.length)) : '';
}

export async function initializeCsrf() {
  const response = await fetch('/sanctum/csrf-cookie', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok)
    throw new ApiError(
      'Unable to start a secure session. Check that the API is running.',
      response.status,
    );
}

export async function api(path, { method = 'GET', body, signal, key, csrfRetry = true } = {}) {
  if (method !== 'GET' && !csrfToken()) await initializeCsrf();
  const headers = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') {
    headers['X-XSRF-TOKEN'] = csrfToken();
    headers['Idempotency-Key'] = key || crypto.randomUUID();
  }
  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      'Unable to reach the server. Your input has been kept; please try again.',
      0,
    );
  }
  if (response.status === 419 && csrfRetry) {
    await initializeCsrf();
    return api(path, { method, body, signal, key: headers['Idempotency-Key'], csrfRetry: false });
  }
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/v1/me')
      window.dispatchEvent(new Event('flowops:session-expired'));
    const message = payload.errors ? Object.values(payload.errors).flat()[0] : payload.message;
    throw new ApiError(
      message || 'The request could not be completed. Please try again.',
      response.status,
      payload.errors,
      payload.request_id,
    );
  }
  return payload;
}

export const orgPath = (organizationId, path = '') =>
  `/api/v1/organizations/${organizationId}${path}`;
