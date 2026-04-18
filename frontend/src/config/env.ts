function requireViteEnv(key: string): string {
  const value = (import.meta.env as Record<string, unknown>)[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing Vite env var: ${key}`);
  }
  return value;
}

export const API_BASE_URL = requireViteEnv("VITE_API_BASE_URL").replace(
  /\/+$/,
  ""
);
export const API_URL = `${API_BASE_URL}/api`;

export const FRONTEND_URL = (() => {
  const value = (import.meta.env as Record<string, unknown>)[
    "VITE_FRONTEND_URL"
  ];
  return typeof value === "string" && value.trim()
    ? value.replace(/\/+$/, "")
    : undefined;
})();
