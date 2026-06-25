import axios from "axios";

const DEFAULT_API_HOST = import.meta.env.VITE_API_URL || (() => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
})();

export const apiClient = axios.create({
  baseURL: DEFAULT_API_HOST,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Cache CSRF token for the session — token is HMAC-based so stays valid
let csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await axios.get<{ token: string }>(`${DEFAULT_API_HOST}/csrf-token`, {
    withCredentials: true,
  });
  csrfToken = res.data.token;
  return csrfToken;
}

const MUTATION_METHODS = ["post", "put", "patch", "delete"];

apiClient.interceptors.request.use(async (config) => {
  if (MUTATION_METHODS.includes(config.method?.toLowerCase() ?? "")) {
    try {
      const token = await fetchCsrfToken();
      config.headers["X-CSRF-Token"] = token;
    } catch {
      // If CSRF fetch fails, proceed anyway — server will reject if needed
    }
  }
  return config;
});
