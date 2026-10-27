export type PermissionCode = 'admin:access' | 'user:read' | 'user:write' | 'role:read' | 'role:manage';
export type MemberStatus = 'ACTIVE' | 'DISABLED';
export type Member = { id: number; email: string; name: string; status: MemberStatus; createdAt: string; roles: string[]; permissions: string[] };
export type MemberPage = { content: Member[]; page: number; size: number; totalElements: number; totalPages: number };
export type PortalRole = { code: string; name: string; system: boolean; permissionRevision: number; permissions: string[] };
export type Permission = { code: string; description: string };
type Token = { accessToken: string; expiresIn: number; tokenType: 'Bearer' };

let accessToken: string | null = null;
let refreshing: Promise<void> | null = null;
let sessionGeneration = 0;

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}
export class SessionExpiredError extends ApiError {
  constructor() { super('세션이 만료되었거나 권한이 변경되었습니다. 다시 로그인해주세요.', 401); }
}
export const can = (member: Member, permission: PermissionCode) => member.permissions.includes(permission);
export const messageOf = (error: unknown) => error instanceof Error ? error.message : '요청 중 오류가 발생했습니다.';

async function detail(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => ({}));
  const fallback = response.status === 403 ? '이 작업을 수행할 권한이 없습니다.' : `요청을 처리하지 못했습니다. (${response.status})`;
  const fields = Array.isArray(body.errors) ? body.errors.map((field: { field: string; message: string }) => `${field.field}: ${field.message}`).join(' / ') : '';
  return new ApiError(fields || body.detail || fallback, response.status);
}

function expireSession(generation: number) {
  if (generation !== sessionGeneration) return;
  accessToken = null;
  sessionGeneration += 1;
  window.dispatchEvent(new Event('portal:session-expired'));
}

export async function refreshSession(): Promise<void> {
  if (refreshing) return refreshing;
  const generation = sessionGeneration;
  refreshing = (async () => {
    const response = await fetch('/api/admin/auth/refresh', { method: 'POST', credentials: 'include', cache: 'no-store' });
    if (generation !== sessionGeneration) throw new SessionExpiredError();
    if (!response.ok) {
      if (response.status === 401) { expireSession(generation); throw new SessionExpiredError(); }
      throw await detail(response);
    }
    const token = await response.json() as Token;
    if (generation !== sessionGeneration) throw new SessionExpiredError();
    accessToken = token.accessToken;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch('/api/admin/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', cache: 'no-store',
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await detail(response);
  const token = await response.json() as Token;
  sessionGeneration += 1;
  accessToken = token.accessToken;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const generation = sessionGeneration;
  const sentToken = accessToken;
  const headers = new Headers(init.headers);
  if (sentToken) headers.set('Authorization', `Bearer ${sentToken}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api/admin${path}`, { ...init, headers, credentials: 'include', cache: 'no-store' });
  if (generation !== sessionGeneration) throw new SessionExpiredError();
  if (response.status === 401) {
    if (!retry) { expireSession(generation); throw new SessionExpiredError(); }
    // Another request may already have rotated the token while this response was in flight.
    if (accessToken === sentToken) await refreshSession();
    return api<T>(path, init, false);
  }
  if (!response.ok) throw await detail(response);
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export async function logout(): Promise<void> {
  await api<void>('/auth/logout', { method: 'POST' });
  sessionGeneration += 1;
  accessToken = null;
}
