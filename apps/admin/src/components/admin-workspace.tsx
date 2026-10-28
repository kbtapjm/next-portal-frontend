'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, can, login, logout, messageOf, refreshSession, SessionExpiredError, type Member, type PortalRole } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import { permissionDescriptions, permissionLabels } from '@/lib/permissions';
import { buttonClass, eyebrowClass, Feedback, fieldClass, labelClass, primaryClass, RoleBadges } from './admin-ui';
import MembersPanel from './members-panel';
import RolesPanel from './roles-panel';

type Screen = 'members' | 'roles' | 'account';

export default function AdminWorkspace() {
  const [me, setMe] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const authenticated = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const expired = () => {
      setMe(null);
      if (authenticated.current) setError(new SessionExpiredError().message);
      authenticated.current = false;
    };
    window.addEventListener('portal:session-expired', expired);
    void refreshSession().then(() => api<Member>('/auth/me')).then(member => {
      if (!cancelled) { authenticated.current = true; setMe(member); }
    }).catch(error => {
      if (!cancelled && !(error instanceof SessionExpiredError)) setError(messageOf(error));
    }).finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; window.removeEventListener('portal:session-expired', expired); };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get('email')), String(form.get('password')));
      const member = await api<Member>('/auth/me');
      authenticated.current = true; setMe(member);
    } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError('');
    try { await logout(); authenticated.current = false; setMe(null); }
    catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  if (!ready) return <main className="grid min-h-screen place-items-center text-muted" role="status">관리자 세션을 확인하고 있습니다…</main>;
  if (!me) return <main className="grid min-h-screen md:grid-cols-2">
    <section className="flex flex-col justify-between bg-ink px-8 py-8 text-white md:min-h-screen md:p-12 xl:p-16">
      <span className="text-sm font-bold tracking-widest">N<span className="text-3xl text-accent">.</span> / NEXT PORTAL</span>
      <div className="py-8 md:py-16"><p className="text-[10px] font-bold tracking-[2px] text-accent">DATA OPERATIONS</p><h1 className="mt-5 text-3xl leading-snug font-bold tracking-tight md:text-4xl xl:text-5xl">데이터의 시작,<br />좋은 관리에서.</h1><p className="mt-6 text-sm leading-7 text-[#b8c9bf]">구성원과 역할, 필요한 접근 권한까지.<br />포털 운영을 하나의 공간에서 관리하세요.</p></div>
      <span className="hidden text-[10px] tracking-[2px] text-[#a8b9af] md:block">NEXT PORTAL · ADMIN WORKSPACE</span>
    </section>
    <section className="grid place-items-center px-7 py-12"><form className="w-full max-w-sm space-y-5" onSubmit={signIn}>
      <div className="mb-8"><p className={eyebrowClass}>WELCOME BACK</p><h2 className="mt-3 text-3xl font-bold tracking-tight">관리자 로그인</h2><p className="mt-3 text-sm leading-6 text-muted">관리자 시스템 접근 권한이 있는 계정으로 시작하세요.</p></div>
      <label className={labelClass}>이메일<input className={fieldClass} name="email" type="email" autoComplete="username" placeholder="admin@example.com" required maxLength={254} disabled={busy} /></label>
      <label className={labelClass}>비밀번호<input className={fieldClass} name="password" type="password" autoComplete="current-password" required maxLength={72} disabled={busy} /></label>
      <Feedback message={error} /><button className={`${primaryClass} w-full py-3.5`} disabled={busy}>{busy ? '로그인 중…' : '로그인 →'}</button>
    </form></section>
  </main>;
  return <Workspace me={me} onMeChange={setMe} onLogout={signOut} busy={busy} error={error} />;
}

function Workspace({ me, onMeChange, onLogout, busy, error }: { me: Member; onMeChange: (member: Member) => void; onLogout: () => void; busy: boolean; error: string }) {
  const memberAccess = can(me, 'user:read') || can(me, 'user:write');
  const roleAccess = can(me, 'role:read') || can(me, 'role:manage');
  const [screen, setScreen] = useState<Screen>(() => memberAccess ? 'members' : roleAccess ? 'roles' : 'account');
  const roles = useResource<PortalRole[]>(can(me, 'role:read') ? '/roles' : null);
  const navigation: { id: Exclude<Screen, 'account'>; label: string; number: string; enabled: boolean }[] = [
    { id: 'members', label: '사용자 관리', number: '01', enabled: memberAccess },
    { id: 'roles', label: '역할·권한 관리', number: '02', enabled: roleAccess },
  ];
  const title = screen === 'account' ? '내 정보' : navigation.find(item => item.id === screen)?.label;
  const menu = navigation.filter(item => item.enabled).map(item => <button type="button" key={item.id} aria-current={screen === item.id ? 'page' : undefined} onClick={() => setScreen(item.id)}
    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3.5 text-left text-sm transition-colors ${screen === item.id ? 'bg-[#edf3e9] font-semibold text-portal-green' : 'text-muted hover:bg-paper hover:text-ink'}`}><span className="text-[10px] opacity-65">{item.number}</span>{item.label}</button>);
  return <div className="min-h-screen">
    <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">본문으로 이동</a>
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-white p-6 lg:flex">
      <span className="text-sm font-bold tracking-widest">N<span className="text-3xl text-[#a0c845]">.</span> / PORTAL</span>
      <p className="mt-8 text-[9px] tracking-[2px] text-muted">ADMIN WORKSPACE</p><nav aria-label="관리자 메뉴" className="mt-5 grid gap-1">{menu}</nav>
      <div className="mt-auto border-t border-line pt-5"><div className="mb-3 flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sm text-white">{me.name.slice(0, 1)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{me.name}</p><p className="mt-1 truncate text-[11px] text-muted">{me.email}</p></div></div><RoleBadges codes={me.roles} roles={roles.data} /></div>
    </aside>
    <div className="lg:ml-60"><header className="flex min-h-18 items-center justify-between gap-3 border-b border-line bg-white px-5 py-3 md:px-9"><p className="min-w-0 text-xs"><span className="hidden text-muted sm:inline">워크스페이스</span><span className="mx-3 hidden text-[#bcc6bd] sm:inline">/</span>{title}</p><div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-current={screen === 'account' ? 'page' : undefined} disabled={busy} onClick={() => setScreen('account')}
          className={`inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portal-green disabled:opacity-40 ${screen === 'account' ? 'bg-[#edf3e9] font-semibold text-portal-green' : 'hover:bg-paper'}`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>
          내 정보
        </button>
        <button type="button" className="cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs hover:bg-paper disabled:opacity-40" disabled={busy} onClick={onLogout}>{busy ? '로그아웃 중…' : '로그아웃 ↗'}</button>
      </div></header>
      {menu.length > 0 && <nav aria-label="모바일 관리자 메뉴" className="flex gap-1 overflow-x-auto border-b border-line bg-white px-3 lg:hidden">{menu}</nav>}
      <main id="admin-content" className="mx-auto max-w-[1440px] space-y-6 px-5 py-8 md:px-9 md:py-10"><Feedback message={error} />
        {screen === 'members' && memberAccess && <MembersPanel me={me} roles={roles.data} rolesError={roles.error} onMeChange={onMeChange} />}
        {screen === 'roles' && roleAccess && <RolesPanel me={me} roles={roles.data} loading={roles.loading} error={roles.error} onReload={roles.reload} />}
        {screen === 'account' && <AccountPanel me={me} roles={roles.data} onChange={onMeChange} />}
        <footer className="flex justify-between gap-4 border-t border-line pt-6 text-[9px] tracking-widest text-muted"><span>NEXT PORTAL</span><span className="hidden tracking-normal sm:block">작은 시작에서, 더 넓은 데이터로.</span></footer>
      </main>
    </div>
  </div>;
}

function AccountPanel({ me, roles, onChange }: { me: Member; roles?: PortalRole[]; onChange: (member: Member) => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <><div className="flex flex-wrap items-start justify-between gap-4"><div><p className={eyebrowClass}>MY WORKSPACE</p><h1 className="mt-3 text-3xl font-bold tracking-tight">내 정보·권한<span className="text-[#8caf44]">.</span></h1><p className="mt-3 text-sm text-muted">현재 계정에 부여된 역할과 사용할 수 있는 기능을 확인하세요.</p></div><button className={buttonClass} disabled={busy} onClick={async () => { setBusy(true); setError(''); try { onChange(await api<Member>('/auth/me')); } catch (error) { setError(messageOf(error)); } finally { setBusy(false); } }}>{busy ? '확인 중…' : '내 정보 새로고침'}</button></div>
    <Feedback message={error} /><section className="rounded-xl border border-line bg-white p-6"><h2 className="text-lg font-semibold">{me.name}</h2><p className="mt-2 text-sm text-muted">{me.email}</p><div className="mt-5"><RoleBadges codes={me.roles} roles={roles} /></div><p className="mt-4 text-xs text-muted">가입일 {new Date(me.createdAt).toLocaleDateString('ko-KR')} · {me.status === 'ACTIVE' ? '활성 계정' : '비활성 계정'}</p></section>
    <section className="rounded-xl border border-line bg-white p-6"><h2 className="text-lg font-semibold">사용 가능한 권한 <span className="ml-2 text-sm font-normal text-muted">{me.permissions.length}개</span></h2><div className="mt-5 grid gap-3 md:grid-cols-2">{me.permissions.map(permission => <div key={permission} className="rounded-lg border border-line bg-paper p-4"><p className="text-sm font-semibold">{permissionLabels[permission] ?? permission}</p><p className="mt-2 text-xs leading-relaxed text-muted">{permissionDescriptions[permission] ?? '이 계정에 부여된 권한입니다.'}</p><code className="mt-3 block text-[11px] text-portal-green">{permission}</code></div>)}</div></section>
  </>;
}
