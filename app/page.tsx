'use client';
import { useState, useEffect, useRef } from 'react';
import type { Exam, Question, Result, ResultDetail } from '@/lib/supabase';

const KAKAO_LINK = process.env.NEXT_PUBLIC_KAKAO_LINK || 'https://open.kakao.com/o/gX01CYoi';
const KAKAO_PW = process.env.NEXT_PUBLIC_KAKAO_PASSWORD || '4321';

const C = {
  primary: '#1A56DB', primaryDk: '#1345B5', primaryPl: '#EBF2FF',
  dark: '#0F172A', mid: '#475569', muted: '#94A3B8',
  bg: '#F8FAFF', card: '#FFFFFF', border: '#DBEAFE',
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
  warning: '#D97706', warningBg: '#FFFBEB',
};

// ── 채점 ──────────────────────────────────────────────────────────────────
function gradeAnswers(questions: Question[], answers: Record<string, any>) {
  let total = 0;
  const maxScore = questions.reduce((s, q) => s + (q.points || 0), 0);
  const details: ResultDetail[] = questions.map(q => {
    const ua = answers[q.id];
    let correct = false;
    if (q.type === 'multiple') correct = Number(ua) === q.answer;
    else if (q.type === 'fill') {
      const ok = q.acceptedAnswers || [q.answer as string];
      correct = ok.some(a => a?.toLowerCase().trim() === String(ua || '').toLowerCase().trim());
    } else if (q.type === 'short') {
      const a = String(ua || '').toLowerCase();
      correct = (q.keywords || []).some(kw => a.includes(kw.toLowerCase()));
    }
    if (correct) total += q.points;
    return { id: q.id, correct, points: correct ? q.points : 0 };
  });
  return { total, maxScore, details };
}

// ── SK 로고 ───────────────────────────────────────────────────────────────
function SKLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm'
    ? { box: 28, font: 10, text: 13 }
    : { box: 40, font: 14, text: 18 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.box * 0.28 }}>
      <div style={{ width: s.box, height: s.box, background: C.primary, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: s.font, fontFamily: 'Georgia,serif' }}>SK</span>
      </div>
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: s.text, fontWeight: 700, color: C.dark }}>선경어학원</div>
        {size !== 'sm' && <div style={{ fontSize: s.text * 0.52, color: C.muted, letterSpacing: '0.5px', marginTop: 1 }}>SUNKYUNG ENGLISH ACADEMY</div>}
      </div>
    </div>
  );
}

// ── 결과 화면 ─────────────────────────────────────────────────────────────
function ResultScreen({ exam, result, name, onHome }: { exam: Exam; result: any; name: string; onHome: () => void }) {
  const resultRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  const resultText = [
    `[SK선경어학원 재시험 결과]`,
    `이름: ${name}`,
    `시험: ${exam.title}`,
    `점수: ${result.total}점 / ${result.maxScore}점`,
    `결과: ${result.passed ? '✅ 합격' : '❌ 불합격'} (커트라인 ${exam.passing_score}점)`,
    `제출: ${new Date().toLocaleString('ko-KR')}`,
    '',
    '문항별:',
    ...result.details.map((d: ResultDetail, i: number) => `  Q${i + 1}: ${d.correct ? `정답 (+${d.points}점)` : '오답'}`),
  ].join('\n');

  function copyText() {
    navigator.clipboard.writeText(resultText).catch(() => {
      const t = document.createElement('textarea');
      t.value = resultText; document.body.appendChild(t); t.select();
      document.execCommand('copy'); document.body.removeChild(t);
    });
    setTextCopied(true); setTimeout(() => setTextCopied(false), 3000);
  }

  async function captureImage() {
    setCapturing(true);
    try {
      if (!(window as any).html2canvas) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
      }
      const canvas = await (window as any).html2canvas(resultRef.current, { scale: 2, backgroundColor: C.bg });
      const a = document.createElement('a');
      a.download = `재시험결과_${name}_${exam.code}.png`;
      a.href = canvas.toDataURL('image/png'); a.click();
    } catch {
      const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.download = `재시험결과_${name}_${exam.code}.txt`;
      a.href = URL.createObjectURL(blob); a.click();
    }
    setCapturing(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center' }}>
        <SKLogo size="sm" />
      </header>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
        <div ref={resultRef} style={{ background: C.bg, paddingBottom: 16 }}>
          <div style={{ background: result.passed ? C.success : C.danger, borderRadius: 18, padding: '28px 22px', textAlign: 'center', color: '#fff', marginBottom: 16 }}>
            <div style={{ fontSize: 10, opacity: .8, letterSpacing: '1px', marginBottom: 8 }}>SK선경어학원 재시험</div>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{result.passed ? '🎉' : '😓'}</div>
            <div style={{ fontSize: 13, opacity: .85, marginBottom: 4 }}>{name} · {exam.title}</div>
            <h2 style={{ margin: '4px 0', fontSize: 36, fontWeight: 800 }}>{result.total}점</h2>
            <div style={{ fontSize: 13, opacity: .8 }}>총 {result.maxScore}점 | 커트라인 {exam.passing_score}점</div>
            <div style={{ marginTop: 14, display: 'inline-block', background: 'rgba(255,255,255,0.22)', borderRadius: 20, padding: '6px 22px', fontSize: 15, fontWeight: 700 }}>
              {result.passed ? '합격 ✓' : '불합격 — 재도전 필요'}
            </div>
          </div>
          <div style={{ background: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: C.mid }}>문항별 결과</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {result.details.map((d: ResultDetail, i: number) => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 9, background: d.correct ? C.successBg : C.dangerBg }}>
                  <span style={{ color: C.dark, fontWeight: 500, fontSize: 13 }}>Q{i + 1}</span>
                  <span style={{ fontWeight: 700, color: d.correct ? C.success : C.danger, fontSize: 13 }}>{d.correct ? `+${d.points}점` : '오답'}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: C.mid }}>정답 {result.details.filter((d: ResultDetail) => d.correct).length}개 / 오답 {result.details.filter((d: ResultDetail) => !d.correct).length}개</span>
              <span style={{ fontWeight: 700, color: C.dark }}>{result.total}점</span>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 10 }}>제출: {new Date().toLocaleString('ko-KR')}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          {/* 카카오톡 2단계 */}
          <div style={{ background: C.warningBg, border: `1px solid #FCD34D`, borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#92400E' }}>💬 카카오톡으로 선생님께 결과 전송</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={copyText} style={{ width: '100%', padding: '11px', background: textCopied ? C.success : C.primary, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {textCopied ? '✅ 복사됨! 아래 링크를 탭하세요' : '① 결과 텍스트 복사하기'}
              </button>
              <a href={KAKAO_LINK} target="_blank" rel="noopener noreferrer" style={{ width: '100%', padding: '11px', background: '#FEE500', color: '#3C1E1E', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
                💬 ② 오픈채팅방 입장 (비밀번호: {KAKAO_PW})
              </a>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>채팅방 입장 후 입력창을 길게 눌러 <strong>붙여넣기</strong>하세요.</p>
          </div>

          {/* 이미지 저장 */}
          <button onClick={captureImage} disabled={capturing} style={{ width: '100%', padding: '14px', background: C.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: capturing ? .7 : 1 }}>
            📸 {capturing ? '저장 중...' : '결과 이미지 저장'}
          </button>

          <div style={{ background: C.dangerBg, border: `1px solid #FCA5A5`, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: C.danger, textAlign: 'center' }}>
            ⚠ 이 시험은 <strong>1회만 응시</strong>할 수 있습니다. 반드시 결과를 전송하거나 저장하세요.
          </div>

          <button onClick={onHome} style={{ width: '100%', padding: '12px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', color: C.mid }}>
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 학생 응시 ─────────────────────────────────────────────────────────────
function StudentView({ exams, onBack }: { exams: Exam[]; onBack: () => void }) {
  const [step, setStep] = useState<'login' | 'already' | 'test' | 'result'>('login');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showPassage, setShowPassage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const completed = exam ? exam.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length : 0;

  async function handleStart() {
    const found = exams.find(e => e.code === code.trim().toUpperCase());
    if (!name.trim()) { setError('이름을 입력하세요.'); return; }
    if (!found) { setError(`"${code}" 코드의 시험을 찾을 수 없습니다.`); return; }

    // 서버에서 중복 제출 확인
    const res = await fetch(`/api/results?examCode=${found.code}`);
    const results = await res.json();
    const already = results.find((r: Result) => r.student_name === name.trim());
    if (already) { setExam(found); setStep('already'); return; }

    setExam(found); setStep('test'); setError('');
  }

  async function handleSubmit() {
    if (!exam) return;
    setSubmitting(true);
    const r = gradeAnswers(exam.questions, answers);
    const finalResult = { ...r, passed: r.total >= exam.passing_score };

    // 서버에 결과 저장
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam_code: exam.code, student_name: name.trim(), ...finalResult }),
    });

    if (res.status === 409) {
      setStep('already'); setSubmitting(false); return;
    }

    setResult(finalResult);
    setStep('result');
    setSubmitting(false);
  }

  if (step === 'already') return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SKLogo size="sm" />
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13 }}>← 홈</button>
      </header>
      <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: '0 0 10px' }}>이미 제출한 시험입니다</h2>
        <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.7, margin: '0 0 24px' }}>
          <strong>{name}</strong>님은 이미 제출하셨습니다.<br />재응시는 불가합니다. 결과는 선생님께 문의하세요.
        </p>
        <button onClick={onBack} style={{ padding: '12px 28px', background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>홈으로</button>
      </div>
    </div>
  );

  if (step === 'result' && exam && result) return (
    <ResultScreen exam={exam} result={result} name={name} onHome={() => { setStep('login'); setAnswers({}); setResult(null); setName(''); setCode(''); }} />
  );

  if (step === 'login') return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SKLogo size="sm" />
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13 }}>← 홈</button>
      </header>
      <div style={{ maxWidth: 440, margin: '48px auto 0', padding: '0 20px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: C.dark }}>재시험 응시</h2>
        <p style={{ margin: '0 0 28px', color: C.muted, fontSize: 14 }}>이름과 시험 코드를 입력하세요</p>
        <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
          {error && <div style={{ background: C.dangerBg, borderRadius: 9, padding: '10px 14px', marginBottom: 14, color: C.danger, fontSize: 14 }}>{error}</div>}
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: 13, color: C.mid }}>이름</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" style={{ marginBottom: 16 }} />
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: 13, color: C.mid }}>시험 코드</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="1P01" onKeyDown={e => e.key === 'Enter' && handleStart()} style={{ marginBottom: 22, fontFamily: 'monospace' }} />
          <button onClick={handleStart} style={{ width: '100%', padding: '13px', background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            시험 시작 →
          </button>
        </div>
        {exams.length > 0 && (
          <div style={{ marginTop: 16, background: C.primaryPl, borderRadius: 12, padding: '14px 16px', border: `1px solid ${C.border}` }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: C.primary, fontWeight: 600 }}>등록된 시험</p>
            {exams.map(e => (
              <div key={e.id} style={{ fontSize: 13, color: C.dark, padding: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
                <span>{e.title}</span>
                <strong style={{ fontFamily: 'monospace', color: C.primary }}>{e.code}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 시험 화면
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <header style={{ background: C.primary, padding: '14px 20px 16px' }}>
        <SKLogo size="sm" />
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>{exam!.title}</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>커트라인 {exam!.passing_score}점 | 총 {exam!.questions.reduce((s, q) => s + q.points, 0)}점</p>
        </div>
        <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 5 }}>
          <div style={{ height: '100%', background: '#fff', borderRadius: 4, width: `${(completed / exam!.questions.length) * 100}%`, transition: 'width .3s' }} />
        </div>
        <p style={{ margin: '5px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{completed}/{exam!.questions.length} 완료</p>
      </header>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
        {exam!.passage && (
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setShowPassage(v => !v)} style={{ background: C.primaryPl, border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px 14px', color: C.primary, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
              📖 지문 {showPassage ? '접기 ▲' : '보기 ▼'}
            </button>
            {showPassage && (
              <div style={{ background: C.primaryPl, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', fontSize: 14, lineHeight: 1.85, color: C.dark, whiteSpace: 'pre-line' }}>
                {exam!.passage}
              </div>
            )}
          </div>
        )}
        {exam!.questions.map((q, i) => (
          <div key={q.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 11 }}>
            <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
              <span style={{ background: C.primary, color: '#fff', borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>Q{i + 1}</span>
              <span style={{ background: C.primaryPl, color: C.primary, borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>{q.points}점</span>
            </div>
            <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, lineHeight: 1.7, color: C.dark, whiteSpace: 'pre-line' }}>{q.text}</p>
            {q.type === 'multiple' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(q.options || []).map((opt, oi) => (
                  <label key={oi} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 13px', borderRadius: 9, border: `1.5px solid ${answers[q.id] === oi ? C.primary : C.border}`, background: answers[q.id] === oi ? C.primaryPl : '#FAFBFF', cursor: 'pointer', fontSize: 13.5, lineHeight: 1.5 }}>
                    <input type="radio" name={q.id} checked={answers[q.id] === oi} onChange={() => setAnswers(p => ({ ...p, [q.id]: oi }))} style={{ marginTop: 2, accentColor: C.primary, flexShrink: 0, width: 'auto', padding: 0, border: 'none' }} />
                    <span style={{ color: answers[q.id] === oi ? C.primary : C.dark }}>{'①②③④'[oi]} {opt}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'fill' && (
              <input value={answers[q.id] || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))} placeholder="답을 입력하세요" />
            )}
            {q.type === 'short' && (
              <textarea value={answers[q.id] || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
            )}
          </div>
        ))}
        <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: '14px', background: completed < exam!.questions.length ? '#64748B' : C.success, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer', opacity: submitting ? .7 : 1 }}>
          {submitting ? '제출 중...' : completed < exam!.questions.length ? `미답 ${exam!.questions.length - completed}문항 — 제출` : '✓ 최종 제출하기'}
        </button>
      </div>
    </div>
  );
}

// ── 관리자 ────────────────────────────────────────────────────────────────
function AdminView({ exams, onBack, onRefresh }: { exams: Exam[]; onBack: () => void; onRefresh: () => void }) {
  const [tab, setTab] = useState<'list' | 'upload' | 'results'>('list');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [jsonInput, setJsonInput] = useState('');
  const [uploadStep, setUploadStep] = useState<'idle' | 'parsing' | 'preview' | 'error'>('idle');
  const [preview, setPreview] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const adminPw = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234';

  async function loadResults(examCode: string) {
    const res = await fetch(`/api/results?examCode=${examCode}`);
    const data = await res.json();
    setResults(data);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadStep('parsing');
    setErrorMsg('');

    // HWPX → 텍스트 추출
    let text = '';
    try {
      if (!(window as any).JSZip) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
      }
      const zip = await (window as any).JSZip.loadAsync(file);
      const allFiles = Object.keys(zip.files);
      const targets = allFiles.filter((n: string) => /section/i.test(n) && n.endsWith('.xml'));
      const files = targets.length ? targets : allFiles.filter((n: string) => n.endsWith('.xml')).slice(0, 6);
      const parts: string[] = [];
      for (const f of files) {
        const xml = await zip.files[f].async('string');
        const t = xml.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (t.length > 30) parts.push(t);
      }
      text = parts.join('\n\n').slice(0, 8000);
    } catch (err) {
      setErrorMsg('파일 추출 실패. HWPX 형식인지 확인하세요.'); setUploadStep('error'); return;
    }

    // 서버 API로 AI 파싱 (Anthropic API 서버사이드 호출)
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName: file.name }),
      });
      const parsed = await res.json();
      if (!res.ok) throw new Error(parsed.error || 'AI 파싱 실패');
      setPreview({ ...parsed, passing_score: parsed.passingScore || parsed.passing_score || 80 });
      setUploadStep('preview');
    } catch (err: any) {
      setErrorMsg(err.message); setUploadStep('error');
    }
  }

  async function confirmJSONUpload() {
    setErrorMsg('');
    try {
      const cleaned = jsonInput.replace(/```json?/g, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('JSON 형식 오류');
      const parsed = JSON.parse(match[0]);
      parsed.passing_score = parsed.passingScore || parsed.passing_score || 80;
      parsed.id = parsed.code;
      setPreview(parsed); setUploadStep('preview');
    } catch (err: any) { setErrorMsg(err.message); }
  }

  async function registerExam() {
    if (!preview) return;
    setUploading(true);
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...preview, adminPassword: adminPw }),
    });
    if (res.ok) {
      onRefresh(); setUploadStep('idle'); setPreview(null); setJsonInput(''); setTab('list');
      alert(`✅ "${preview.title}" 등록 완료!`);
    } else {
      const d = await res.json(); setErrorMsg(d.error || '등록 실패');
    }
    setUploading(false);
  }

  async function deleteExam(code: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/exams?code=${code}`, { method: 'DELETE', headers: { 'x-admin-password': adminPw } });
    onRefresh();
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SKLogo size="sm" />
        <button onClick={onBack} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: C.mid, fontSize: 13 }}>로그아웃</button>
      </header>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: 20 }}>
        <h2 style={{ margin: '20px 0 16px', fontSize: 18, fontWeight: 700, color: C.dark }}>관리자 대시보드</h2>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
          {([['list', `시험 목록 (${exams.length})`], ['upload', 'AI 업로드'], ['results', '결과 조회']] as [string, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t as any)} style={{ padding: '9px 18px', background: 'transparent', color: tab === t ? C.primary : C.muted, border: 'none', borderBottom: tab === t ? `2.5px solid ${C.primary}` : '2.5px solid transparent', borderRadius: 0, cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 700 : 400 }}>{label}</button>
          ))}
        </div>

        {/* 시험 목록 */}
        {tab === 'list' && (
          exams.length === 0
            ? <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>
              <p style={{ fontSize: 32, margin: '0 0 10px' }}>📭</p>
              <p>등록된 시험이 없습니다.</p>
              <button onClick={() => setTab('upload')} style={{ marginTop: 12, background: C.primary, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', cursor: 'pointer', fontWeight: 600 }}>AI 업로드로 추가</button>
            </div>
            : exams.map(e => (
              <div key={e.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: '16px 20px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: C.dark }}>{e.title}</h3>
                    <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                      코드: <strong style={{ color: C.primary, fontFamily: 'monospace' }}>{e.code}</strong> · 커트라인 {e.passing_score}점 · {e.questions.length}문제
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setSelectedExam(e); loadResults(e.code); setTab('results'); }} style={{ fontSize: 13, padding: '5px 11px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'none', cursor: 'pointer', color: C.mid }}>결과</button>
                    <button onClick={() => deleteExam(e.code)} style={{ fontSize: 13, padding: '5px 11px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'none', cursor: 'pointer', color: C.danger }}>삭제</button>
                  </div>
                </div>
              </div>
            ))
        )}

        {/* AI 업로드 */}
        {tab === 'upload' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
            {uploadStep === 'idle' && (
              <>
                <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.dark }}>📄 HWPX 또는 JSON으로 시험 등록</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: C.mid }}>방법 1 — HWPX 파일 업로드 (AI 자동 파싱)</p>
                    <input ref={fileRef} type="file" accept=".hwpx,.hwp" onChange={handleFileUpload} style={{ display: 'none' }} />
                    <button onClick={() => fileRef.current?.click()} style={{ padding: '10px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>📁 HWPX 파일 선택</button>
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: C.mid }}>방법 2 — JSON 직접 붙여넣기</p>
                    <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder={'{ "title": "...", "code": "1P01", "questions": [...] }'} rows={6} style={{ marginBottom: 10, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
                    <button onClick={confirmJSONUpload} disabled={!jsonInput.trim()} style={{ padding: '9px 18px', background: C.primary, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: jsonInput.trim() ? 1 : .4 }}>확인 →</button>
                  </div>
                </div>
              </>
            )}
            {uploadStep === 'parsing' && (
              <div style={{ textAlign: 'center', padding: 40, color: C.mid }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                <p style={{ fontSize: 15 }}>AI가 시험지를 분석 중입니다...</p>
                <p style={{ fontSize: 13, marginTop: 6, color: C.muted }}>잠시만 기다려주세요 (10~20초)</p>
              </div>
            )}
            {uploadStep === 'error' && (
              <div>
                <div style={{ background: C.dangerBg, borderRadius: 9, padding: '12px 16px', marginBottom: 14, color: C.danger }}>❌ {errorMsg}</div>
                <button onClick={() => { setUploadStep('idle'); setErrorMsg(''); }} style={{ padding: '9px 18px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 9, cursor: 'pointer', color: C.mid }}>다시 시도</button>
              </div>
            )}
            {uploadStep === 'preview' && preview && (
              <div>
                <div style={{ background: C.successBg, border: '1px solid #6EE7B7', borderRadius: 9, padding: '11px 15px', marginBottom: 14, fontSize: 13, color: C.success }}>
                  ✅ <strong>{preview.title}</strong> — {preview.questions?.length}문항 / 커트라인 {preview.passing_score}점
                </div>
                <div style={{ background: '#F8FAFF', borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}`, marginBottom: 14, maxHeight: 220, overflowY: 'auto' }}>
                  {preview.questions?.map((q: Question, i: number) => (
                    <div key={q.id} style={{ display: 'flex', gap: 7, padding: '6px 0', borderBottom: i < preview.questions.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <span style={{ background: C.primary, color: '#fff', borderRadius: 5, padding: '1px 7px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>Q{i + 1}</span>
                      <span style={{ fontSize: 12, color: C.dark }}>{q.text?.split('\n')[0].slice(0, 55)}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted, flexShrink: 0 }}>{q.points}점</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 9 }}>
                  <button onClick={registerExam} disabled={uploading} style={{ padding: '10px 22px', background: C.success, color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: uploading ? .7 : 1 }}>
                    {uploading ? '등록 중...' : '✓ 시험 등록하기'}
                  </button>
                  <button onClick={() => setUploadStep('idle')} style={{ padding: '10px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 14, cursor: 'pointer', color: C.mid }}>← 다시</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 결과 조회 */}
        {tab === 'results' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginRight: 10 }}>시험 선택:</label>
              <select
                value={selectedExam?.code || ''}
                onChange={e => {
                  const found = exams.find(ex => ex.code === e.target.value);
                  if (found) { setSelectedExam(found); loadResults(found.code); }
                }}
                style={{ width: 'auto', padding: '8px 12px', fontSize: 14 }}
              >
                <option value="">-- 시험 선택 --</option>
                {exams.map(e => <option key={e.id} value={e.code}>{e.title}</option>)}
              </select>
            </div>
            {selectedExam && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    ['전체 응시', results.length + '명'],
                    ['합격', results.filter(r => r.passed).length + '명'],
                    ['불합격', results.filter(r => !r.passed).length + '명'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: C.muted }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.dark }}>{val}</p>
                    </div>
                  ))}
                </div>
                {results.length === 0
                  ? <p style={{ color: C.muted, textAlign: 'center', padding: 32 }}>아직 응시자가 없습니다.</p>
                  : results.map(r => (
                    <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <strong style={{ fontSize: 15, color: C.dark }}>{r.student_name}</strong>
                          <span style={{ marginLeft: 10, fontSize: 12, color: C.muted }}>{new Date(r.submitted_at || '').toLocaleString('ko-KR')}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: r.passed ? C.success : C.danger }}>{r.total}점 {r.passed ? '합격' : '불합격'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {r.details.map((d, di) => (
                          <span key={di} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: d.correct ? C.successBg : C.dangerBg, color: d.correct ? C.success : C.danger }}>
                            Q{di + 1} {d.correct ? '✓' : '✗'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 홈 ───────────────────────────────────────────────────────────────────
function HomeScreen({ exams, onStudent, onAdmin }: { exams: Exam[]; onStudent: () => void; onAdmin: () => void }) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');

  function adminLogin() {
    const correct = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234';
    if (pw === correct) { onAdmin(); setPwErr(''); }
    else setPwErr('비밀번호가 올바르지 않습니다.');
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SKLogo size="sm" />
        <button onClick={() => setShowAdmin(v => !v)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, padding: '6px 10px' }}>관리자</button>
      </header>

      <div style={{ background: 'linear-gradient(135deg,#1A56DB 0%,#2563EB 50%,#1345B5 100%)', padding: '56px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 20, letterSpacing: '0.5px' }}>ONLINE RETEST PLATFORM</div>
          <h1 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>재시험 응시 시스템</h1>
          <p style={{ margin: '0 0 36px', fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>시험 코드를 입력하고 재시험을 응시하세요</p>
          <button onClick={onStudent} style={{ background: '#fff', color: C.primary, border: 'none', borderRadius: 12, padding: '15px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            📝 재시험 응시하기
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 24px', maxWidth: 560, width: '100%', margin: '0 auto', flex: 1 }}>
        {exams.length > 0 && (
          <>
            <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: C.muted, letterSpacing: '0.5px' }}>진행 중인 시험</p>
            {exams.map(e => (
              <div key={e.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: 10 }} onClick={onStudent}>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: C.dark }}>{e.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{e.subject}</p>
                </div>
                <span style={{ background: C.primaryPl, color: C.primary, borderRadius: 7, padding: '4px 11px', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{e.code}</span>
              </div>
            ))}
          </>
        )}
        <div style={{ marginTop: 16, background: C.primaryPl, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: C.primary }}>응시 방법</p>
          {[['1', "위 '재시험 응시하기' 버튼을 탭하세요"], ['2', '이름과 시험 코드를 입력하세요'], ['3', '문제를 풀고 결과를 선생님께 전송하세요']].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{n}</div>
              <span style={{ fontSize: 13, color: C.mid }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {showAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowAdmin(false)}>
          <div style={{ background: C.card, borderRadius: '20px 20px 0 0', padding: '28px 24px 36px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 24px' }} />
            <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.dark }}>🔒 관리자 로그인</p>
            {pwErr && <div style={{ background: C.dangerBg, borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: C.danger, fontSize: 13 }}>{pwErr}</div>}
            <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && adminLogin()} style={{ marginBottom: 12 }} />
            <button onClick={adminLogin} style={{ width: '100%', padding: '13px', background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>로그인</button>
            <button onClick={() => { setShowAdmin(false); setPw(''); setPwErr(''); }} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer' }}>취소</button>
          </div>
        </div>
      )}

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '16px 24px', textAlign: 'center' }}>
        <SKLogo size="sm" />
        <p style={{ margin: '8px 0 0', fontSize: 11, color: C.muted }}>© 2025 SK선경어학원 · Retest Platform</p>
      </footer>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<'home' | 'student' | 'admin'>('home');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadExams() {
    const res = await fetch('/api/exams');
    const data = await res.json();
    setExams(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadExams(); }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center', color: C.muted }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
        <p>로딩 중...</p>
      </div>
    </div>
  );

  if (screen === 'student') return <StudentView exams={exams} onBack={() => setScreen('home')} />;
  if (screen === 'admin') return <AdminView exams={exams} onBack={() => setScreen('home')} onRefresh={loadExams} />;
  return <HomeScreen exams={exams} onStudent={() => setScreen('student')} onAdmin={() => setScreen('admin')} />;
}
