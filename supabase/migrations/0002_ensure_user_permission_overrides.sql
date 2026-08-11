-- 0002_ensure_user_permission_overrides.sql
--
-- 목적: 관리자 페이지에서 "메뉴 권한(연구방법/데이터 시각화 허용·잠김)" 저장 시
--   Could not find the table 'public.user_permission_overrides' in the schema cache
-- 오류가 발생하는 문제를 해결한다.
--
-- 원인: 0001_profiles.sql 에 테이블 정의가 포함되어 있었지만, 실제 운영 Supabase
--   프로젝트에 이 마이그레이션이 (전체 또는 이 테이블 부분만) 적용되지 않았거나,
--   테이블 생성 이후 PostgREST가 스키마 캐시를 아직 갱신하지 못한 상태였다.
--
-- 적용 방법 (Supabase 대시보드 → SQL Editor 에 아래 전체를 붙여넣고 Run):
--   1) 이 파일 내용을 그대로 실행 — 테이블이 없으면 새로 만들고, 있으면 그대로 둔다(안전/멱등).
--   2) 마지막 NOTIFY 로 PostgREST 스키마 캐시를 즉시 갱신한다(재배포/재시작 불필요).
--
-- 참고: 앱 코드는 이 테이블이 아직 없어도 자동으로 Clerk 메타데이터로 폴백하도록
--   패치되어 있어(lib/perm-overrides.ts) 이 마이그레이션을 적용하지 않아도 기능은
--   정상 동작한다. 다만 다중 기기/세션 간 일관된 클라우드 저장을 위해서는 아래
--   마이그레이션을 적용하는 것을 권장한다.

create table if not exists public.profiles (
  id               text primary key,
  email            text,
  name             text,
  image_url        text,
  plan             text not null default 'free',
  role             text not null default 'student',
  approval_status  text not null default 'pending'
                     check (approval_status in ('pending','approved','rejected')),
  is_special_member boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_approval_idx on public.profiles(approval_status);

create table if not exists public.user_permission_overrides (
  user_id text not null references public.profiles(id) on delete cascade,
  permission_code text not null,
  allowed boolean,
  updated_at timestamptz not null default now(),
  primary key (user_id, permission_code)
);

create index if not exists user_permission_overrides_user_idx
  on public.user_permission_overrides(user_id);

-- PostgREST 스키마 캐시 즉시 갱신 (이게 없으면 테이블을 만든 직후에도
-- "Could not find the table ... in the schema cache" 오류가 잠시/계속 발생할 수 있다)
notify pgrst, 'reload schema';
