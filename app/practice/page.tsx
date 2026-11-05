'use client';
import { useEffect, useState } from 'react';
import { initPractice } from './engine';
import './practice.css';

type SetInfo = { id: string; title: string; sub: string; n: number; q: number };
type SetData = {
  id: string; kick: string; big: string; title: string; sub: string;
  groups: string[]; spk: Record<string, string>; data: any[]; quiz: any[];
};

function Fonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" />
    </>
  );
}

function SetList({ sets }: { sets: SetInfo[] }) {
  return (
    <div className="wrap">
      <div className="topnav"><a href="/">← SK선경어학원 홈</a></div>
      <header>
        <div className="kick">SK선경어학원 · 2학기 기말고사 대비</div>
        <h1><span>Listening</span> 듣기 · 받아쓰기 연습</h1>
        <div className="sub">연습할 단원을 고르세요</div>
      </header>
      <div className="sets">
        {sets.map(s => (
          <a key={s.id} className="set" href={`/practice?set=${s.id}`}>
            <i>{s.n}문장 · 듣기 평가 {s.q}문항</i>
            <b>{s.title}</b>
            <span>{s.sub}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Practice({ d }: { d: SetData }) {
  useEffect(() => {
    const stop = initPractice({
      data: d.data, quiz: d.quiz, groups: d.groups, spk: d.spk,
      key: 'skp_' + d.id, base: `/practice/${d.id}/`,
    });
    return stop;
  }, [d]);
  return (
    <div className="wrap">
      <div className="topnav"><a href="/practice">← 단원 목록</a></div>
      <header>
        <div className="kick">{d.kick}</div>
        <h1><span>{d.big}</span> {d.title}</h1>
        <div className="sub">{d.sub}</div>
      </header>
      <div className="modes" role="group" aria-label="연습 단계" id="modes"></div>
      <div className="panel" id="pick">
        <div className="row"><span className="lab">범위</span><div className="seg" id="groups"></div></div>
        <div className="row"><span className="lab">단원</span><select id="sec" aria-label="섹션 고르기"></select></div>
        <div className="row"><span className="lab">속도</span><div className="seg" id="rates"></div></div>
      </div>
      <div className="bar"><div className="score" id="score"></div><div className="acts" id="tools"></div></div>
      <div className="note" id="tip"></div>
      <div className="list" id="list"></div>
    </div>
  );
}

export default function PracticePage() {
  const [sets, setSets] = useState<SetInfo[] | null>(null);
  const [data, setData] = useState<SetData | null>(null);
  const [setId, setSetId] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('set');
    setSetId(id);
    if (id) {
      fetch(`/practice/${id}/data.json`).then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(setData).catch(() => setErr('단원을 찾지 못했습니다. 단원 목록에서 다시 골라 주세요.'));
    } else {
      fetch('/practice/sets.json').then(r => r.json()).then(setSets).catch(() => setErr('단원 목록을 불러오지 못했습니다.'));
    }
  }, []);

  return (
    <div className="pp">
      <Fonts />
      {err && <div className="wrap"><div className="topnav"><a href="/practice">← 단원 목록</a></div><p className="err">{err}</p></div>}
      {!err && setId && data && <Practice d={data} />}
      {!err && !setId && sets && <SetList sets={sets} />}
      {!err && !data && !sets && <div className="wrap"><p className="sub">불러오는 중…</p></div>}
    </div>
  );
}
