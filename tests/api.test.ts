import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

const originalFetch = globalThis.fetch;
let events: EventTarget;
let moduleNumber = 0;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const token = (accessToken: string) => json({ accessToken, tokenType: 'Bearer', expiresIn: 900 });
const authorization = (init?: RequestInit) => new Headers(init?.headers).get('Authorization');
async function client() {
  const url = new URL('../apps/admin/src/lib/api.ts', import.meta.url);
  url.searchParams.set('case', String(++moduleNumber));
  return await import(url.href) as typeof import('../apps/admin/src/lib/api.ts');
}
beforeEach(() => { events = new EventTarget(); Object.defineProperty(globalThis, 'window', { configurable: true, value: events }); });
afterEach(() => { globalThis.fetch = originalFetch; Reflect.deleteProperty(globalThis, 'window'); });

test('concurrent 401 responses share one refresh and retry with the rotated token', async () => {
  const api = await client();
  let refreshes = 0;
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith('/login')) return token('initial');
    if (String(input).endsWith('/refresh')) { refreshes++; await new Promise(resolve => setImmediate(resolve)); return token('rotated'); }
    return authorization(init) === 'Bearer rotated' ? json({ ok: true }) : new Response(null, { status: 401 });
  };
  await api.login('test@example.com', 'fake-test-password');
  const values = await Promise.all([api.api('/users'), api.api('/roles')]);
  assert.deepEqual(values, [{ ok: true }, { ok: true }]);
  assert.equal(refreshes, 1);
});

test('a late 401 for the previous token does not rotate the new token again', async () => {
  const api = await client();
  let refreshes = 0;
  let release!: (response: Response) => void;
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith('/login')) return token('initial');
    if (String(input).endsWith('/refresh')) { refreshes++; return token('rotated'); }
    if (authorization(init) === 'Bearer rotated') return json({ ok: true });
    if (String(input).endsWith('/late')) return new Promise<Response>(resolve => { release = resolve; });
    return new Response(null, { status: 401 });
  };
  await api.login('test@example.com', 'fake-test-password');
  const late = api.api('/late');
  await api.api('/users');
  release(new Response(null, { status: 401 }));
  assert.deepEqual(await late, { ok: true });
  assert.equal(refreshes, 1);
});

test('revoked refresh expires the session once for concurrent requests', async () => {
  const api = await client();
  let expired = 0;
  events.addEventListener('portal:session-expired', () => expired++);
  globalThis.fetch = async input => {
    if (String(input).endsWith('/login')) return token('initial');
    if (String(input).endsWith('/refresh')) await new Promise(resolve => setImmediate(resolve));
    return new Response(null, { status: 401 });
  };
  await api.login('test@example.com', 'fake-test-password');
  const results = await Promise.allSettled([api.api('/users'), api.api('/roles')]);
  assert.equal(results.filter(value => value.status === 'rejected' && value.reason instanceof api.SessionExpiredError).length, 2);
  assert.equal(expired, 1);
});

test('403 preserves the session and never retries a mutation', async () => {
  const api = await client();
  let mutations = 0;
  let refreshes = 0;
  globalThis.fetch = async input => {
    if (String(input).endsWith('/login')) return token('initial');
    if (String(input).endsWith('/refresh')) { refreshes++; return token('unexpected'); }
    mutations++; return new Response(null, { status: 403 });
  };
  await api.login('test@example.com', 'fake-test-password');
  await assert.rejects(api.api('/roles', { method: 'POST', body: '{}' }), error => error instanceof api.ApiError && error.status === 403);
  assert.equal(mutations, 1);
  assert.equal(refreshes, 0);
});

test('a second 401 after a successful refresh ends the session without looping', async () => {
  const api = await client();
  let refreshes = 0;
  let expired = 0;
  events.addEventListener('portal:session-expired', () => expired++);
  globalThis.fetch = async input => {
    if (String(input).endsWith('/login')) return token('initial');
    if (String(input).endsWith('/refresh')) { refreshes++; return token('rotated'); }
    return new Response(null, { status: 401 });
  };
  await api.login('test@example.com', 'fake-test-password');
  await assert.rejects(api.api('/users'), api.SessionExpiredError);
  assert.equal(refreshes, 1);
  assert.equal(expired, 1);
});

test('an older refresh cannot overwrite or sign out a newly logged in session', async () => {
  const api = await client();
  let release!: (response: Response) => void;
  let expired = 0;
  events.addEventListener('portal:session-expired', () => expired++);
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith('/refresh')) return new Promise<Response>(resolve => { release = resolve; });
    if (String(input).endsWith('/login')) return token('new-session');
    return json({ authorization: authorization(init) });
  };
  const restore = api.refreshSession();
  await api.login('test@example.com', 'fake-test-password');
  release(token('old-session'));
  await assert.rejects(restore, api.SessionExpiredError);
  assert.deepEqual(await api.api('/auth/me'), { authorization: 'Bearer new-session' });
  assert.equal(expired, 0);
});
