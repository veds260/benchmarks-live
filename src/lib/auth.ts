const VISITOR_KEY = "bml_visitor_id";
const AUTH_TOKEN_KEY = "bml_auth_token";
const AUTH_EMAIL_KEY = "bml_auth_email";

function generateId(): string {
  return crypto.randomUUID();
}

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export function isSignedUp(): boolean {
  try {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return false;
  }
}

export function getEmail(): string | null {
  try {
    return localStorage.getItem(AUTH_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuth(email: string, token: string) {
  try {
    localStorage.setItem(AUTH_EMAIL_KEY, email);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // storage full or private browsing
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_EMAIL_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}
