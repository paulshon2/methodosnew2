/** MethodOS · 오브/음성 네비 — renew-15 에서 RDOS 권한 훅 대체 */
export function usePermissions() {
  return { can: (_perm?: string) => true };
}
