const DEFAULT_ORIGIN = "http://localhost:5173";

export const getAllowedOrigins = () =>
  (process.env.CORS_ORIGIN || DEFAULT_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
