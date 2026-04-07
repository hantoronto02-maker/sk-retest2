-- =============================================
-- SK선경어학원 재시험 시스템 — Supabase 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 시험 테이블
create table if not exists exams (
  id text primary key,
  code text unique not null,
  title text not null,
  subject text,
  passing_score int default 80,
  passage text,
  questions jsonb not null default '[]',
  created_at timestamptz default now()
);

-- 결과 테이블
create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  exam_code text not null references exams(code) on delete cascade,
  student_name text not null,
  total int not null,
  max_score int not null,
  passed boolean not null,
  details jsonb not null default '[]',
  submitted_at timestamptz default now(),
  -- 같은 학생이 같은 시험에 한 번만 제출 가능
  unique(exam_code, student_name)
);

-- Row Level Security 활성화
alter table exams enable row level security;
alter table results enable row level security;

-- 시험 정책: 누구나 읽기 가능
create policy "exams_select" on exams
  for select using (true);

-- 시험 정책: 서비스 롤만 쓰기 가능 (API Route에서 처리)
create policy "exams_insert" on exams
  for insert with check (true);

create policy "exams_delete" on exams
  for delete using (true);

-- 결과 정책: 누구나 제출 가능
create policy "results_insert" on results
  for insert with check (true);

-- 결과 정책: 누구나 읽기 가능 (관리자 인증은 앱에서)
create policy "results_select" on results
  for select using (true);

-- 인덱스
create index if not exists results_exam_code_idx on results(exam_code);
create index if not exists results_student_idx on results(exam_code, student_name);
