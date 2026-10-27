import type { Permission } from './api';

export const permissionLabels: Record<string, string> = {
  'admin:access': '관리자 시스템 접근', 'user:read': '사용자 조회', 'user:write': '사용자 생성·수정',
  'role:read': '역할·권한 조회', 'role:manage': '역할 관리·부여',
};
export const permissionDescriptions: Record<string, string> = {
  'admin:access': '관리자 로그인과 내 정보 확인', 'user:read': '사용자 목록과 상세 정보 조회',
  'user:write': '사용자 생성, 이름 및 활성 상태 변경', 'role:read': '역할 목록과 권한 카탈로그 조회',
  'role:manage': '역할 생성·변경·삭제와 사용자 역할 부여',
};
export const knownPermissions: Permission[] = Object.entries(permissionDescriptions).map(([code, description]) => ({ code, description }));
export const roleLabels: Record<string, string> = { ADMIN: '시스템 관리자', USER: '일반 사용자', USER_VIEWER: '사용자 조회 담당자', USER_MANAGER: '사용자 관리 담당자' };
