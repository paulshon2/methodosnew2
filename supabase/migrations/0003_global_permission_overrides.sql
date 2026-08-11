-- 0003_global_permission_overrides.sql
--
-- 목적: 관리자 "전체 메뉴(잠김/허용)" 화면에서 회원 개별이 아니라 전체 사용자에게
--   공통으로 적용되는 메뉴/연구방법/데이터 시각화 잠김·허용 값을 저장한다.
--
-- 배경: 기존 user_permission_overrides(0001/0002)는 회원 1명 단위 설정만 저장했다.
--   관리자가 "연구방법 메뉴 자체를 전체 회원에게 잠근다/연다"처럼 사이트 전체
--   기본값을 한 번에 제어할 저장소가 없었다.
--
-- 참고: 앱 코드는 이 테이블이 없거나 Supabase 미설정이어도 서버 메모리(프로세스 수명)
--   저장소로 자동 폴백하도록 되어 있어(lib/global-perm-overrides.ts) 이 마이그레이션을
--   적용하지 않아도 기능은 정상 동작한다. 다만 다중 인스턴스/재배포 간에도 값이
--   유지되도록 하려면 아래 마이그레이션 적용을 권장한다.

create table if not exists public.global_permission_overrides (
  permission_code text primary key,
  allowed boolean,
  updated_at timestamptz not null default now()
);

notify pgrst, 'reload schema';
