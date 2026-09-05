export const roleLabels: Record<string, string> = { Admin: "시스템 관리자", PropertyManager: "부동산 매니저", Finance: "재무 담당자", Inspector: "점검 담당자" };
export const permissionLabels: Record<string, string> = {
  "portfolio:read": "자산 조회", "property:manage": "자산 관리", "tenant:manage": "임차인 관리",
  "contract:manage": "계약 관리", "payment:manage": "수납 관리", "billing:manage": "청구 관리",
  "maintenance:manage": "유지보수 관리", "inspection:manage": "점검 관리", "user:manage": "사용자 관리", "report:read": "보고서 조회",
};
