import { useState, type FormEvent } from 'react';
import { api, messageOf, type Member, type PortalRole } from '@/lib/api';
import { buttonClass, Feedback, fieldClass, labelClass, Modal, primaryClass, RolePicker } from './admin-ui';

export default function RoleAssignment({ me, member, roles, onClose, onSaved }: { me: Member; member?: Member; roles?: PortalRole[]; onClose: () => void; onSaved: (member: Member) => void }) {
  const [selected, setSelected] = useState<string[]>(member?.roles ?? ['USER']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const id = member?.id ?? Number(new FormData(event.currentTarget).get('memberId'));
    if (!Number.isSafeInteger(id) || id <= 0) { setError('올바른 사용자 ID를 입력하세요.'); return; }
    if (id === me.id) { setError('본인 역할은 다른 권한 관리자에게 변경을 요청하세요.'); return; }
    if (selected.length === 0 || selected.length > 20) { setError('역할은 1개 이상, 20개 이하로 선택하세요.'); return; }
    setBusy(true);
    try { onSaved(await api<Member>(`/users/${id}/roles`, { method: 'PUT', body: JSON.stringify({ roles: selected }) })); }
    catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <Modal title="사용자 역할 부여" onClose={onClose} busy={busy}><form onSubmit={submit} className="space-y-5">
    {member ? <div className="rounded-lg bg-paper p-4"><p className="font-semibold">{member.name} <span className="ml-2 text-xs font-normal text-muted">ID {member.id}</span></p><p className="mt-2 text-sm text-muted">{member.email}</p></div>
      : <label className={labelClass}>사용자 ID<input className={fieldClass} name="memberId" type="number" min={1} step={1} max={Number.MAX_SAFE_INTEGER} required disabled={busy} /><small className="font-normal leading-relaxed text-muted">변경할 계정의 ID를 확인하고 입력하세요. 본인 역할은 변경할 수 없습니다.</small></label>}
    <RolePicker selected={selected} onChange={setSelected} roles={roles} disabled={busy} />
    <p className="rounded-lg bg-paper p-3 text-xs leading-relaxed text-muted">선택한 역할로 기존 역할 전체를 교체합니다. 역할이 달라지면 해당 사용자는 다시 로그인해야 합니다.</p>
    <Feedback message={error} /><div className="flex justify-end gap-2"><button type="button" className={buttonClass} disabled={busy} onClick={onClose}>취소</button><button className={primaryClass} disabled={busy || selected.length === 0}>{busy ? '저장 중…' : '역할 저장'}</button></div>
  </form></Modal>;
}
