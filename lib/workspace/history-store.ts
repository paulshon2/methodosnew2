/** no-op — RDOS 작업 히스토리 대신 MethodOS 는 프로젝트 스토어를 쓴다 */
export async function touchSession(_: {
  href: string;
  taskId: string;
  title: string;
}): Promise<void> {
  /* noop */
}
