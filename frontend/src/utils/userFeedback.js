export const getFriendlyErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const status = Number(error?.response?.status);
  const rawMessage = error?.response?.data?.message || error?.response?.data?.error;
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';

  if (!message || status >= 500) return fallback;
  if (/e11000|duplicate key/i.test(message)) {
    return 'That username, email, or item is already in use.';
  }

  const technicalMessage = /\bapi\b|\broute\b|\bendpoint\b|request failed|status code|internal server|stack trace|econn|mongoose|mongodb|mongo server|cast(?:error| to objectid)|validationerror|\bjwt\b|(?:access|refresh|bearer) token|token expired|authorization header|network error|failed to fetch|axios|e11000|duplicate key|cannot\s+(?:get|post|put|patch|delete)\b/i;
  if (technicalMessage.test(message)) return fallback;

  const withoutStatusCode = message.replace(/^(?:(?:error|http(?:\/[\d.]+)?)\s*:?\s*)?[1-5]\d{2}\s*[:\-]?\s*/i, '').trim();
  if (!withoutStatusCode || /^(?:[1-5]\d{2})(?:\s|$)/.test(withoutStatusCode)) return fallback;

  return withoutStatusCode;
};
