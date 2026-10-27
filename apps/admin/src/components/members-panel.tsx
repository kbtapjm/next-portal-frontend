import { useState, type FormEvent } from 'react';
import { api, can, messageOf, type Member, type MemberPage, type PortalRole } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import { buttonClass, eyebrowClass, Feedback, fieldClass, labelClass, Modal, primaryClass, RoleBadges, RolePicker, tableClass } from './admin-ui';
import RoleAssignment from './role-assignment';

export default function MembersPanel({ me, roles, rolesError, onMeChange }: { me: Member; roles?: PortalRole[]; rolesError?: string; onMeChange: (member: Member) => void }) {
  const [filters, setFilters] = useState({ keyword: '', roleCode: '', status: '' });
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Member | 'create' | null>(null);
  const [assignment, setAssignment] = useState<Member | null>(null);
  const [notice, setNotice] = useState('');
  const read = can(me, 'user:read');
  const write = can(me, 'user:write');
  const manage = can(me, 'role:manage');
  const params = new URLSearchParams({ page: String(page), size: '10' });
  Object.entries(filters).filter(([, value]) => value).forEach(([key, value]) => params.set(key, value));
  const members = useResource<MemberPage>(read ? `/users?${params}` : null);
  function changed(member: Member, roleChange = false) {
    setEditor(null); setAssignment(null); setPage(0); members.reload();
    if (member.id === me.id) onMeChange(member);
    setNotice(roleChange ? `${member.name} 님의 역할을 저장했습니다. 역할이 변경되었다면 다시 로그인해야 합니다.` : `${member.name} 님의 정보를 저장했습니다.`);
  }
  return <><div className="flex flex-wrap items-start justify-between gap-4"><div><p className={eyebrowClass}>MEMBER DIRECTORY</p><h1 className="mt-3 text-3xl font-bold tracking-tight">사용자 관리<span className="text-[#8caf44]">.</span></h1><p className="mt-3 text-sm leading-relaxed text-muted">포털 구성원을 조회하고, 정보와 접근 역할을 관리하세요.</p></div>{write && <button className={primaryClass} onClick={() => { setEditor('create'); setNotice(''); }}>+ 사용자 등록</button>}</div>
    <Feedback kind="success" message={notice} />
    {!read ? <section className="rounded-xl border border-line bg-white p-8"><h2 className="font-semibold">사용자 목록 조회 권한이 없습니다.</h2><p className="mt-3 text-sm leading-7 text-muted">사용자는 등록할 수 있습니다. 목록을 확인하려면 사용자 조회 권한을 요청하세요.</p></section>
      : <section className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5"><div className="flex items-center gap-3"><h2 className="font-semibold">사용자 목록</h2><span className="rounded-full bg-paper px-2.5 py-1 text-xs text-muted">{members.data ? `${members.data.totalElements}명` : '확인 중'}</span>{!write && <span className="text-xs text-portal-green">조회 전용</span>}</div><button className={buttonClass} disabled={members.loading} onClick={members.reload}>새로고침</button></div>
        <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); setFilters({ keyword: String(form.get('keyword')).trim(), roleCode: String(form.get('roleCode')).trim(), status: String(form.get('status')) }); setPage(0); setNotice(''); }}
          className="grid gap-3 border-t border-line bg-paper/70 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(160px,1fr)_180px_130px_auto]">
          <label className="sr-only" htmlFor="member-search">이름 또는 이메일 검색</label><input id="member-search" className={fieldClass} name="keyword" placeholder="이름 또는 이메일 검색" maxLength={100} />
          {roles ? <select aria-label="역할 필터" className={fieldClass} name="roleCode"><option value="">모든 역할</option>{roles.map(role => <option key={role.code} value={role.code}>{role.name}</option>)}</select>
            : <input aria-label="역할 코드 필터" className={fieldClass} name="roleCode" placeholder="역할 코드 (선택)" maxLength={50} pattern="[A-Z][A-Z0-9_]{0,49}" />}
          <select aria-label="상태 필터" className={fieldClass} name="status"><option value="">모든 상태</option><option value="ACTIVE">활성</option><option value="DISABLED">비활성</option></select><button className={buttonClass}>검색</button>
        </form>
        {members.error ? <div className="space-y-3 p-6"><Feedback message={members.error} /><button className={buttonClass} onClick={members.reload}>다시 시도</button></div>
          : members.loading ? <p role="status" className="p-12 text-center text-sm text-muted">사용자를 불러오고 있습니다…</p>
            : <><div className="overflow-x-auto"><table className={tableClass}><caption className="sr-only">사용자 목록과 부여된 역할</caption><thead><tr><th>사용자</th><th>이메일</th><th>역할</th><th>상태</th><th>등록일</th><th>작업</th></tr></thead><tbody>{members.data?.content.map(member => <tr key={member.id} className="hover:bg-paper/60">
              <td><p className="font-medium">{member.name}{member.id === me.id && <span className="ml-2 text-[10px] text-portal-green">내 계정</span>}</p><p className="mt-1.5 text-[10px] text-muted">ID {member.id}</p></td><td className="text-muted">{member.email}</td><td className="min-w-40 whitespace-normal"><RoleBadges codes={member.roles} roles={roles} /></td><td><span className={`text-xs ${member.status === 'ACTIVE' ? 'text-[#3a855e]' : 'text-muted'}`}>● {member.status === 'ACTIVE' ? '활성' : '비활성'}</span></td><td className="text-xs text-muted">{new Date(member.createdAt).toLocaleDateString('ko-KR')}</td>
              <td><div className="flex gap-3">{write && (!member.permissions.includes('role:manage') || manage) && <button className="cursor-pointer text-xs font-medium hover:underline" aria-label={`${member.name} 정보 수정`} onClick={() => setEditor(member)}>정보 수정</button>}{manage && member.id !== me.id && <button className="cursor-pointer text-xs font-medium text-portal-green hover:underline" aria-label={`${member.name} 역할 부여`} onClick={() => setAssignment(member)}>역할 부여</button>}{(!write || (member.permissions.includes('role:manage') && !manage)) && (!manage || member.id === me.id) && <span className="text-xs text-muted">—</span>}</div></td>
            </tr>)}</tbody></table></div>{members.data?.content.length === 0 && <p className="p-12 text-center text-sm text-muted">조건에 맞는 사용자가 없습니다.</p>}
            <footer className="flex flex-wrap items-center justify-between gap-3 p-5 text-xs text-muted"><span>검색 결과 {members.data?.totalElements ?? 0}명 · {page + 1} / {Math.max(members.data?.totalPages ?? 1, 1)} 페이지</span><div className="flex gap-2"><button className={buttonClass} disabled={page === 0} onClick={() => setPage(value => value - 1)}>← 이전</button><button className={buttonClass} disabled={!members.data || page + 1 >= members.data.totalPages} onClick={() => setPage(value => value + 1)}>다음 →</button></div></footer></>}
      </section>}
    {editor && <MemberEditor key={editor === 'create' ? 'create' : editor.id} member={editor === 'create' ? undefined : editor} me={me} roles={roles} rolesError={rolesError} onClose={() => setEditor(null)} onSaved={changed} />}
    {assignment && <RoleAssignment me={me} member={assignment} roles={roles} onClose={() => setAssignment(null)} onSaved={member => changed(member, true)} />}
  </>;
}

function MemberEditor({ member, me, roles, rolesError, onClose, onSaved }: { member?: Member; me: Member; roles?: PortalRole[]; rolesError?: string; onClose: () => void; onSaved: (member: Member) => void }) {
  const [selected, setSelected] = useState(['USER']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const manage = can(me, 'role:manage');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    if (!member && new TextEncoder().encode(password).length > 72) { setError('비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.'); return; }
    if (!member && (selected.length === 0 || selected.length > 20)) { setError('역할은 1개 이상, 20개 이하로 선택하세요.'); return; }
    setBusy(true);
    try {
      const body = member ? { name: String(form.get('name')), status: form.get('status') ?? member.status }
        : { name: String(form.get('name')), email: String(form.get('email')), password, roles: manage ? selected : ['USER'] };
      onSaved(await api<Member>(member ? `/users/${member.id}` : '/users', { method: member ? 'PUT' : 'POST', body: JSON.stringify(body) }));
    } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <Modal title={member ? '사용자 정보 수정' : '사용자 등록'} busy={busy} onClose={onClose}><form className="space-y-5" onSubmit={submit}>
    <label className={labelClass}>이름<input className={fieldClass} name="name" defaultValue={member?.name} required maxLength={100} disabled={busy} /></label>
    {!member && <><label className={labelClass}>이메일<input className={fieldClass} name="email" type="email" autoComplete="off" required maxLength={254} disabled={busy} /></label><label className={labelClass}>초기 비밀번호<input className={fieldClass} name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} disabled={busy} /><small className="font-normal text-muted">12자 이상, UTF-8 기준 72바이트 이하</small></label>
      {manage ? <><Feedback message={rolesError} /><RolePicker selected={selected} onChange={setSelected} roles={roles} disabled={busy} /></> : <p className="rounded-lg bg-paper p-3 text-sm text-muted">일반 사용자 역할로 등록합니다. 추가 역할은 권한 관리자에게 요청하세요.</p>}</>}
    {member && <><label className={labelClass}>상태<select className={fieldClass} name="status" defaultValue={member.status} disabled={busy || member.id === me.id}><option value="ACTIVE">활성</option><option value="DISABLED">비활성</option></select>{member.id === me.id && <small className="font-normal text-muted">본인 계정은 비활성화할 수 없습니다.</small>}</label><div className="space-y-2"><p className="text-sm font-medium">현재 역할</p><RoleBadges codes={member.roles} roles={roles} /><p className="text-xs text-muted">역할은 목록의 ‘역할 부여’에서 별도로 변경합니다.</p></div></>}
    <Feedback message={error} /><div className="flex justify-end gap-2"><button type="button" className={buttonClass} disabled={busy} onClick={onClose}>취소</button><button className={primaryClass} disabled={busy || (!member && manage && selected.length === 0)}>{busy ? '저장 중…' : '저장'}</button></div>
  </form></Modal>;
}
