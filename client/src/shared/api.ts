export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

let accessToken: string | null = null;
type Session = {
  accessToken: string;
  user: { id: string | number; email: string; role: string };
};

let refreshRequest: Promise<Session | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const refreshSession = async (): Promise<Session | null> => {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (response.status === 204 || !response.ok) return null;
        const data = await response.json();
        if (
          typeof data.accessToken !== "string" ||
          !data.user ||
          !["string", "number"].includes(typeof data.user.id) ||
          typeof data.user.email !== "string" ||
          typeof data.user.role !== "string"
        ) {
          throw new Error("Сервер вернул некорректный ответ авторизации");
        }
        const session: Session = {
          accessToken: data.accessToken,
          user: data.user,
        };
        setAccessToken(session.accessToken);
        return session;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
};

export const apiFetch = async (
  path: string,
  init: RequestInit = {},
): Promise<Response> => {
  const sendRequest = () => {
    const headers = new Headers(init.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  };

  let response = await sendRequest();
  if (response.status === 401 && !path.startsWith("/api/auth/")) {
    const session = await refreshSession();
    if (session) response = await sendRequest();
  }
  return response;
};
