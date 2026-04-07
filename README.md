# SK선경어학원 재시험 시스템

> Next.js + Supabase + Vercel 기반 온라인 재시험 플랫폼

---

## 배포 순서 (약 30분 소요)

### STEP 1 — Supabase 설정

1. [supabase.com](https://supabase.com) → **Start your project** → GitHub으로 로그인
2. **New project** 클릭
   - Name: `sk-retest`
   - Database Password: 기억하기 쉬운 비밀번호 입력
   - Region: **Northeast Asia (Seoul)** 선택
3. 프로젝트 생성 완료 후 (1~2분 대기)
4. 왼쪽 메뉴 → **SQL Editor** → `supabase-schema.sql` 파일 내용 전체 붙여넣기 → **Run**
5. 왼쪽 메뉴 → **Settings** → **API** 에서 아래 두 값 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### STEP 2 — Anthropic API 키 발급

1. [console.anthropic.com](https://console.anthropic.com) → 로그인
2. **API Keys** → **Create Key**
3. 생성된 키 복사 → `ANTHROPIC_API_KEY`

> ⚠ API 키는 한 번만 표시됩니다. 반드시 복사해두세요.

---

### STEP 3 — GitHub에 코드 업로드

```bash
# 터미널(맥: Terminal, 윈도우: PowerShell)에서 실행

cd sk-retest

# Git 초기화
git init
git add .
git commit -m "first commit"

# GitHub에서 새 레포지토리 생성 후:
git remote add origin https://github.com/YOUR_USERNAME/sk-retest.git
git push -u origin main
```

> GitHub.com → New repository → `sk-retest` → Create → 위 명령어 실행

---

### STEP 4 — Vercel 배포

1. [vercel.com](https://vercel.com) → **GitHub으로 로그인**
2. **New Project** → `sk-retest` 레포지토리 선택 → **Import**
3. **Environment Variables** 섹션에서 아래 변수 입력:

| 변수명 | 값 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `ANTHROPIC_API_KEY` | Anthropic API 키 |
| `ADMIN_PASSWORD` | `1234` (원하는 비밀번호로 변경) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | `1234` (ADMIN_PASSWORD와 동일) |
| `NEXT_PUBLIC_KAKAO_LINK` | `https://open.kakao.com/o/gX01CYoi` |
| `NEXT_PUBLIC_KAKAO_PASSWORD` | `4321` |

4. **Deploy** 클릭 → 2~3분 후 배포 완료
5. 생성된 URL (예: `sk-retest.vercel.app`) → 학생들에게 공유!

---

### STEP 5 — 로컬 개발 환경 설정 (선택사항)

```bash
# Node.js가 설치되어 있어야 합니다
# https://nodejs.org 에서 설치

cp .env.local.example .env.local
# .env.local 파일을 열어서 각 값 입력

npm install
npm run dev
# http://localhost:3000 에서 확인
```

---

## 이후 운영 방법

### 새 시험 등록
1. 앱 접속 → 관리자 로그인
2. **AI 업로드** 탭
3. HWPX 파일 업로드 → AI 자동 파싱 → 등록

### 학생 결과 확인
1. 관리자 로그인 → **결과 조회** 탭
2. 시험 선택 → 전체 학생 결과 실시간 조회

### 새 기능 추가 시
코드 수정 → GitHub push → Vercel 자동 재배포 (URL 변경 없음!)

---

## 기술 스택

- **Frontend**: Next.js 14, React, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **AI**: Anthropic Claude API
- **비용**: 모두 무료 플랜으로 운영 가능
