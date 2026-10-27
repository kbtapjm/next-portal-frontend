import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { PortalRole } from '@/lib/api';
import { roleLabels } from '@/lib/permissions';

export const buttonClass = 'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-portal-green hover:bg-paper disabled:cursor-not-allowed disabled:opacity-45';
export const primaryClass = 'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-portal-green bg-portal-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-portal-green-hover disabled:cursor-not-allowed disabled:opacity-45';
export const dangerClass = 'inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#ad4235] bg-[#ad4235] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45';
export const fieldClass = 'w-full rounded-lg border border-[#dbe2da] bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-2 focus:outline-offset-2 focus:outline-[#9abdb0] disabled:bg-paper disabled:text-muted';
export const labelClass = 'grid gap-2 text-sm font-medium';
export const eyebrowClass = 'text-[10px] font-bold tracking-[2px] text-muted';
export const tableClass = 'w-full border-collapse text-left whitespace-nowrap [&_th]:border-y [&_th]:border-line [&_th]:bg-paper [&_th]:px-5 [&_th]:py-3.5 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted [&_td]:border-b [&_td]:border-line [&_td]:px-5 [&_td]:py-4 [&_td]:text-sm';

export function Feedback({ message, kind = 'error' }: { message?: string; kind?: 'error' | 'success' }) {
  if (!message) return null;
  return <p role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${kind === 'error' ? 'border-[#f6d6d0] bg-[#fff0ee] text-[#ad4235]' : 'border-[#dce7d0] bg-[#edf5e4] text-portal-green'}`}>{message}</p>;
}

export function RoleBadges({ codes, roles }: { codes: string[]; roles?: PortalRole[] }) {
  return <div className="flex flex-wrap gap-1.5">{codes.map(code => <span key={code} title={code} className={`rounded-md border px-2 py-1 text-xs ${code === 'ADMIN' ? 'border-[#d9e6c8] bg-[#f0f5e8] text-[#527043]' : 'border-line bg-paper text-ink'}`}>{roles?.find(role => role.code === code)?.name ?? roleLabels[code] ?? code}</span>)}</div>;
}

export function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-auto rounded-2xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-[#11271c]/45">
    <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5"><h2 id={titleId} className="text-xl font-bold tracking-tight">{title}</h2><button type="button" className="cursor-pointer rounded-lg px-2 py-1 text-xl text-muted hover:bg-paper disabled:opacity-40" aria-label="닫기" disabled={busy} onClick={onClose}>×</button></div>
    <div className="p-6">{children}</div>
  </dialog>;
}

export function RolePicker({ selected, onChange, roles, disabled = false }: { selected: string[]; onChange: (codes: string[]) => void; roles?: PortalRole[]; disabled?: boolean }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const options = roles ?? selected.map(value => ({ code: value, name: roleLabels[value] ?? value }));
  const remaining = selected.filter(value => !options.some(role => role.code === value));
  function add() {
    if (!/^[A-Z][A-Z0-9_]{0,49}$/.test(code)) { setError('역할 코드는 대문자로 시작하는 대문자·숫자·밑줄 50자 이내로 입력하세요.'); return; }
    onChange([...new Set([...selected, code])]); setCode(''); setError('');
  }
  return <fieldset disabled={disabled} className="space-y-3"><legend className="mb-2 text-sm font-semibold">부여할 역할</legend>
    <div className="grid gap-2 sm:grid-cols-2">{[...options, ...remaining.map(value => ({ code: value, name: roleLabels[value] ?? value }))].map(role => <label key={role.code} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-disabled:cursor-default ${selected.includes(role.code) ? 'border-[#a7c6b4] bg-[#f0f6ee]' : 'border-line'}`}>
      <input type="checkbox" className="size-4 shrink-0 accent-portal-green" checked={selected.includes(role.code)} onChange={event => onChange(event.target.checked ? [...selected, role.code] : selected.filter(value => value !== role.code))} />
      <span>{role.name}<small className="mt-1 block text-[10px] text-muted">{role.code}</small></span>
    </label>)}</div>
    {!roles && <><p className="text-xs leading-relaxed text-muted">역할 목록을 조회할 수 없어 코드로 부여합니다. 역할 코드는 권한 관리자에게 확인하세요.</p><div className="flex gap-2"><input aria-label="추가할 역할 코드" className={fieldClass} placeholder="예: USER_VIEWER" value={code} maxLength={50} onChange={event => setCode(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} /><button type="button" className={buttonClass} onClick={add}>추가</button></div></>}
    <Feedback message={error} />
    <p className="text-xs text-muted">여러 역할을 선택할 수 있으며, 최소 한 개가 필요합니다.</p>
  </fieldset>;
}
