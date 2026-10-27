import { useState, type FormEvent } from 'react';
import { api, can, messageOf, type Member, type Permission, type PortalRole } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import { knownPermissions, permissionLabels } from '@/lib/permissions';
import { buttonClass, dangerClass, eyebrowClass, Feedback, fieldClass, labelClass, Modal, primaryClass, tableClass } from './admin-ui';
import RoleAssignment from './role-assignment';

export default function RolesPanel({ me, roles, loading, error, onReload }: { me: Member; roles?: PortalRole[]; loading: boolean; error?: string; onReload: () => void }) {
  const read = can(me, 'role:read');
  const manage = can(me, 'role:manage');
  const catalog = useResource<Permission[]>(read ? '/permissions' : null);
  const [editor, setEditor] = useState<PortalRole | 'create' | null>(null);
  const [deleting, setDeleting] = useState<PortalRole | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [notice, setNotice] = useState('');
  const filtered = roles?.filter(role => `${role.code} ${role.name}`.toLowerCase().includes(keyword.toLowerCase()));
  return <><div className="flex flex-wrap items-start justify-between gap-4"><div><p className={eyebrowClass}>ACCESS CONTROL</p><h1 className="mt-3 text-3xl font-bold tracking-tight">역할·권한 관리<span className="text-[#8caf44]">.</span></h1><p className="mt-3 text-sm leading-relaxed text-muted">역할에 필요한 권한을 묶고, 구성원에게 부여하세요.</p></div>{manage && <div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={() => setAssigning(true)}>사용자 ID로 역할 부여</button><button className={primaryClass} onClick={() => setEditor('create')}>+ 역할 만들기</button></div>}</div>
    <Feedback message={notice} kind="success" />
    {read ? <><div className="grid grid-cols-3 gap-3">{[{ label: '전체 역할', count: roles?.length }, { label: '시스템 역할', count: roles?.filter(role => role.system).length }, { label: '운영 역할', count: roles?.filter(role => !role.system).length }].map(item => <div key={item.label} className="rounded-xl border border-line bg-white p-4 sm:p-5"><p className="text-xs text-muted">{item.label}</p><p className="mt-3 text-2xl font-bold tracking-tight">{item.count ?? '—'}<small className="ml-1 text-xs font-normal text-muted">개</small></p></div>)}</div>
      <section className="overflow-hidden rounded-xl border border-line bg-white"><div className="flex flex-wrap items-center justify-between gap-3 p-5"><h2 className="font-semibold">역할 목록</h2><div className="flex w-full gap-2 sm:w-auto"><input className={`${fieldClass} min-w-0 sm:w-56`} aria-label="역할 이름 또는 코드 검색" placeholder="역할 이름 또는 코드 검색" value={keyword} onChange={event => setKeyword(event.target.value)} /><button className={`${buttonClass} shrink-0`} disabled={loading} onClick={onReload}>새로고침</button></div></div>
        {error ? <div className="space-y-3 p-6"><Feedback message={error} /><button className={buttonClass} onClick={onReload}>다시 시도</button></div> : loading ? <p role="status" className="p-12 text-center text-sm text-muted">역할을 불러오고 있습니다…</p> : <><div className="overflow-x-auto"><table className={tableClass}><caption className="sr-only">역할과 부여된 세부 권한 목록</caption><thead><tr><th>역할</th><th>구분</th><th>부여된 권한</th><th>작업</th></tr></thead><tbody>{filtered?.map(role => <tr key={role.code} className="hover:bg-paper/60"><td><p className="font-medium">{role.name}</p><code className="mt-1.5 block text-[10px] text-muted">{role.code}</code></td><td><span className={`rounded-md px-2 py-1 text-xs ${role.system ? 'bg-[#f1f0e7] text-[#857249]' : 'bg-[#edf3e9] text-portal-green'}`}>{role.system ? '시스템' : '운영'}</span></td><td className="min-w-60 max-w-md whitespace-normal"><div className="flex flex-wrap gap-1.5">{role.permissions.map(permission => <span key={permission} title={permission} className="rounded-md border border-line px-2 py-1 text-[11px] text-muted">{permissionLabels[permission] ?? permission}</span>)}{role.permissions.length === 0 && <span className="text-xs text-muted">부여된 관리자 권한 없음</span>}</div></td><td><div className="flex gap-3"><button className="cursor-pointer text-xs font-medium text-portal-green hover:underline" aria-label={`${role.name} 상세${manage && !role.system ? ' 및 수정' : ''}`} onClick={() => setEditor(role)}>{manage && !role.system ? '상세·수정' : '상세 보기'}</button>{manage && !role.system && !me.roles.includes(role.code) && <button className="cursor-pointer text-xs text-[#ad4235] hover:underline" aria-label={`${role.name} 삭제`} onClick={() => setDeleting(role)}>삭제</button>}</div></td></tr>)}</tbody></table></div>{filtered?.length === 0 && <p className="p-12 text-center text-sm text-muted">조건에 맞는 역할이 없습니다.</p>}<p className="border-t border-line p-5 text-xs leading-relaxed text-muted">시스템 역할은 변경·삭제할 수 없습니다. 사용자에게 부여된 역할은 회수한 뒤 삭제하세요.</p></>}
      </section>
      <details className="rounded-xl border border-line bg-white p-5" open><summary className="cursor-pointer text-sm font-semibold">권한 카탈로그 <span className="ml-2 font-normal text-muted">{catalog.data?.length ?? '—'}개</span></summary><div className="mt-5 space-y-3"><Feedback message={catalog.error} />{catalog.error && <button className={buttonClass} onClick={catalog.reload}>권한 다시 불러오기</button>}{catalog.loading && <p role="status" className="text-sm text-muted">권한을 불러오고 있습니다…</p>}<div className="grid gap-3 md:grid-cols-2">{catalog.data?.map(permission => <div key={permission.code} className="rounded-lg bg-paper p-4"><p className="text-sm font-medium">{permissionLabels[permission.code] ?? permission.code}</p><p className="mt-2 text-xs leading-relaxed text-muted">{permission.description}</p><code className="mt-3 block text-[11px] text-portal-green">{permission.code}</code></div>)}</div></div></details>
    </> : <section className="rounded-xl border border-line bg-white p-7"><h2 className="font-semibold">역할 목록 조회 권한이 없습니다.</h2><p className="mt-3 text-sm leading-7 text-muted">새 역할을 만들거나 사용자 ID와 역할 코드로 역할을 부여할 수 있습니다. 기존 역할의 상세 조회·수정 화면을 사용하려면 역할·권한 조회 권한을 요청하세요.</p></section>}
    {editor && <RoleEditor key={editor === 'create' ? 'create' : editor.code} role={editor === 'create' ? undefined : editor} me={me} catalog={catalog.data} onClose={() => setEditor(null)} onSaved={role => { setEditor(null); setNotice(`${role.name} 역할을 저장했습니다. 권한이 달라졌다면 이 역할을 부여받은 사용자는 다시 로그인해야 합니다.`); onReload(); }} />}
    {deleting && <DeleteRole role={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); setNotice('역할을 삭제했습니다.'); onReload(); }} />}
    {assigning && <RoleAssignment me={me} roles={roles} onClose={() => setAssigning(false)} onSaved={member => { setAssigning(false); setNotice(`${member.name} 님의 역할을 저장했습니다. 역할이 변경되었다면 다시 로그인해야 합니다.`); }} />}
  </>;
}

function RoleEditor({ role, me, catalog, onClose, onSaved }: { role?: PortalRole; me: Member; catalog?: Permission[]; onClose: () => void; onSaved: (role: PortalRole) => void }) {
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? ['admin:access']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editable = can(me, 'role:manage') && !role?.system;
  const own = role ? me.roles.includes(role.code) : false;
  const options = catalog ?? knownPermissions;
  const extra = selected.filter(code => !options.some(permission => permission.code === code)).map(code => ({ code, description: code }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const body = { ...(!role ? { code: String(form.get('code')).trim() } : {}), name: String(form.get('name')), permissions: selected };
    try { onSaved(await api<PortalRole>(role ? `/roles/${encodeURIComponent(role.code)}` : '/roles', { method: role ? 'PUT' : 'POST', body: JSON.stringify(body) })); }
    catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <Modal title={!role ? '역할 만들기' : editable ? '역할 상세·수정' : '역할 상세'} onClose={onClose} busy={busy}><form onSubmit={submit} className="space-y-5">
    {!role ? <label className={labelClass}>역할 코드<input className={fieldClass} name="code" placeholder="예: AUDITOR" pattern="[A-Z][A-Z0-9_]{0,49}" maxLength={50} required disabled={busy} /><small className="font-normal leading-relaxed text-muted">대문자로 시작하는 대문자·숫자·밑줄. 생성 후 변경할 수 없습니다.</small></label> : <div className="rounded-lg bg-paper p-3 text-sm"><span className="text-muted">역할 코드</span><code className="ml-3">{role.code}</code>{role.system && <span className="ml-3 text-xs text-muted">시스템 역할 · 변경 불가</span>}</div>}
    <label className={labelClass}>역할 이름<input className={fieldClass} name="name" defaultValue={role?.name} required maxLength={100} disabled={busy || !editable} /></label>
    <fieldset disabled={busy || !editable || own} className="space-y-2"><legend className="mb-3 text-sm font-semibold">세부 권한 <span className="ml-2 font-normal text-muted">{selected.length}개 선택</span></legend>{[...options, ...extra].map(permission => <label key={permission.code} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-disabled:cursor-default ${selected.includes(permission.code) ? 'border-[#a7c6b4] bg-[#f0f6ee]' : 'border-line'}`}><input className="mt-0.5 size-4 shrink-0 accent-portal-green" type="checkbox" checked={selected.includes(permission.code)} onChange={event => setSelected(event.target.checked ? [...selected, permission.code] : selected.filter(code => code !== permission.code))} /><span><span className="text-sm font-medium">{permissionLabels[permission.code] ?? permission.code}</span><small className="mt-1 block text-xs leading-relaxed text-muted">{permission.description}</small><code className="mt-1.5 block text-[10px] text-muted">{permission.code}</code></span></label>)}</fieldset>
    {own && editable && <p className="rounded-lg bg-paper p-3 text-xs leading-relaxed text-muted">본인에게 부여된 역할입니다. 이름만 수정할 수 있으며 권한 변경은 다른 권한 관리자에게 요청하세요.</p>}
    {!selected.includes('admin:access') && <p className="text-xs leading-relaxed text-muted">이 역할만 부여된 계정은 관리자 시스템에 로그인할 수 없습니다.</p>}
    {editable && !own && <p className="text-xs leading-relaxed text-muted">권한을 변경하면 이 역할을 부여받은 모든 사용자가 다시 로그인해야 합니다.</p>}
    <Feedback message={error} /><div className="flex justify-end gap-2"><button className={buttonClass} type="button" disabled={busy} onClick={onClose}>{editable ? '취소' : '닫기'}</button>{editable && <button className={primaryClass} disabled={busy}>{busy ? '저장 중…' : '역할 저장'}</button>}</div>
  </form></Modal>;
}

function DeleteRole({ role, onClose, onDeleted }: { role: PortalRole; onClose: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <Modal title="역할 삭제" onClose={onClose} busy={busy}><div className="space-y-5"><p className="text-sm leading-7"><strong>{role.name}</strong> ({role.code}) 역할을 삭제합니다. 사용자에게 부여되어 있다면 먼저 해당 역할을 회수해야 합니다.</p><Feedback message={error} /><div className="flex justify-end gap-2"><button className={buttonClass} disabled={busy} onClick={onClose}>취소</button><button className={dangerClass} disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await api<void>(`/roles/${encodeURIComponent(role.code)}`, { method: 'DELETE' }); onDeleted(); } catch (error) { setError(messageOf(error)); } finally { setBusy(false); } }}>{busy ? '삭제 중…' : '역할 삭제'}</button></div></div></Modal>;
}
