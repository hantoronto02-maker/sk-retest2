// @ts-nocheck
/* 받아쓰기·듣기 연습 화면 동작 (claude.ai 듣기 연습 페이지와 같은 코드) */
export function initPractice(cfg) {

const GROUPS = cfg.groups;
const DATA = cfg.data;
const QUIZ = cfg.quiz;
const SPK = {N:"",W:"여자",M:"남자",G:"여학생",BOY:"남학생",A:"A",BB:"B",ANS:"답",OLIVIA:"Olivia",DOMINGO:"Domingo",EMMA:"Emma",MINSU:"Minsu",NIRAN:"Niran",HANA:"Hana",HENRY:"Henry",SALLY:"Sally", ...(cfg.spk||{})};
const MODES = [
  {id:"listen", step:"1단계", t:"듣고 따라 읽기", s:"문장을 듣고 소리 내어 읽기"},
  {id:"blank", step:"2단계", t:"빈칸 받아쓰기", s:"핵심 낱말만 써 보기"},
  {id:"full", step:"3단계", t:"문장 받아쓰기", s:"문장 전체를 듣고 쓰기"},
  {id:"test", step:"4단계", t:"듣기 평가", s:"내신 듣기처럼 풀기"}];
const TIPS = {
  listen:"▶를 눌러 듣고 바로 따라 읽어 보세요. 익숙해지면 '영어 가리기'를 켜고 듣기만으로 뜻을 떠올려 보세요.",
  blank:"▶로 들으면서 빈칸에 들어갈 낱말을 쓰세요. 대소문자와 문장부호는 채점하지 않습니다. 다 쓰면 '모두 채점'을 누르세요.",
  full:"▶로 들은 문장을 그대로 쓰고 Enter(또는 확인)를 누르세요. 틀린 낱말은 빨간색, 빠진 낱말은 밑줄로 표시됩니다. 잘 안 들리면 속도를 0.8배로 낮춰 보세요.",
  test:"실제 듣기 평가처럼 문항마다 두 번까지만 들을 수 있습니다. 모두 고른 뒤 '채점하기'를 누르면 정답과 대본을 볼 수 있습니다."};
const ST = load(); if (!GROUPS.includes(ST.group)) { ST.group = GROUPS[0]; ST.sec = -1; }
function load(){ try{ return Object.assign({mode:"listen",group:GROUPS[0],sec:-1,rate:1,hideEn:false,showKo:false}, JSON.parse(localStorage.getItem(cfg.key)||"{}")); }catch(e){ return {mode:"listen",group:GROUPS[0],sec:-1,rate:1,hideEn:false,showKo:false}; } }
function save(){ try{ localStorage.setItem(cfg.key, JSON.stringify({mode:ST.mode,group:ST.group,sec:ST.sec,rate:ST.rate,hideEn:ST.hideEn,showKo:ST.showKo})); }catch(e){} }
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const BYID = {}; DATA.forEach(s => s.items.forEach(it => BYID[it[0]] = {id:it[0],spk:it[1],en:it[2],ko:it[3]}));
const ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>';
const ICON_STOP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5h9v9h-9z"/></svg>';

/* ── 오디오 ── */
const audio = new Audio(); audio.preload = "auto";
let playToken = 0;
function playOne(id){
  return new Promise(res => {
    audio.src = cfg.base + "audio/" + id + ".mp3"; audio.playbackRate = ST.rate;
    audio.onended = () => res(true); audio.onerror = () => { flashErr(); res(false); };
    audio.play().catch(() => res(false));
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));
async function playSeq(ids, onEach){
  const tok = ++playToken;
  for (const id of ids){
    if (tok !== playToken) return false;
    onEach && onEach(id);
    await playOne(id);
    if (tok !== playToken) return false;
    await wait(550 / ST.rate);
  }
  onEach && onEach(null);
  return tok === playToken;
}
function stopAll(){ playToken++; audio.pause(); document.querySelectorAll(".play.playing").forEach(b => { b.classList.remove("playing"); b.innerHTML = ICON_PLAY; }); document.querySelectorAll(".item.now").forEach(e => e.classList.remove("now")); }
function flashErr(){ const t = $("#tip"); if (!t.dataset.err){ t.dataset.err = 1; t.insertAdjacentHTML("beforeend", '<div class="err">음성 파일을 불러오지 못했습니다. 잠시 뒤 다시 눌러 보세요.</div>'); } }
async function playBtn(btn, ids){
  if (btn.classList.contains("playing")){ stopAll(); return; }
  stopAll(); btn.classList.add("playing"); btn.innerHTML = ICON_STOP;
  await playSeq(ids);
  btn.classList.remove("playing"); btn.innerHTML = ICON_PLAY;
}

/* ── 채점 도구 ── */
const norm = s => s.toLowerCase().replace(/[’‘`]/g,"'").replace(/[^a-z0-9' ]+/g," ").replace(/\s+/g," ").trim();
const words = s => norm(s).split(" ").filter(Boolean);
function lcs(a, b){
  const n=a.length, m=b.length, T=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--) T[i][j] = a[i]===b[j] ? T[i+1][j+1]+1 : Math.max(T[i+1][j],T[i][j+1]);
  const out=[]; let i=0,j=0;
  while(i<n&&j<m){ if(a[i]===b[j]){out.push(["g",b[j]]);i++;j++;} else if(T[i+1][j]>=T[i][j+1]){out.push(["x",a[i]]);i++;} else {out.push(["m",b[j]]);j++;} }
  while(i<n) out.push(["x",a[i++]]); while(j<m) out.push(["m",b[j++]]);
  return out;
}
const STOP = new Set("the a an and but or so to of in on at for with from by is are was were be been am i you he she it we they me my your his her its our their this that these those there here what which who when where why how do does did don't didn't can can't will i'll not no yes very just also then than too into out up all some any".split(" "));
function blankIdx(text){
  const toks = text.split(/(\s+)/);
  const cand = [];
  toks.forEach((t,i) => { const w = norm(t); if (w && w.length >= 4 && !STOP.has(w)) cand.push(i); });
  if (!cand.length) return {toks, idx:[]};
  let idx = cand.length <= 2 ? [cand.reduce((a,b) => norm(toks[b]).length > norm(toks[a]).length ? b : a)] : cand.filter((_,k) => k % 2 === 0).slice(0,3);
  return {toks, idx};
}

/* ── 화면 ── */
function itemsInScope(){
  const secs = DATA.map((s,i) => ({s,i})).filter(x => x.s.g === ST.group);
  return ST.sec >= 0 ? secs.filter(x => x.i === ST.sec) : secs;
}
function renderModes(){
  $("#modes").innerHTML = MODES.map(m => `<button type="button" id="mode-${m.id}" aria-pressed="${ST.mode===m.id}" data-m="${m.id}"><i>${m.step}</i><b>${m.t}</b><small>${m.s}</small></button>`).join("");
  $("#modes").querySelectorAll("button").forEach(b => b.onclick = () => { stopAll(); ST.mode = b.dataset.m; save(); render(); });
}
function renderPick(){
  $("#pick").hidden = ST.mode === "test" ? false : false;
  $("#groups").innerHTML = GROUPS.map(g => `<button type="button" aria-pressed="${ST.group===g}" data-g="${g}">${g}</button>`).join("");
  $("#groups").querySelectorAll("button").forEach(b => b.onclick = () => { stopAll(); ST.group = b.dataset.g; ST.sec = -1; save(); render(); });
  const opts = DATA.map((s,i) => ({s,i})).filter(x => x.s.g === ST.group);
  $("#sec").innerHTML = `<option value="-1">${ST.group} 전체 (${opts.reduce((a,x)=>a+x.s.items.length,0)}문장)</option>` + opts.map(x => `<option value="${x.i}" ${ST.sec===x.i?"selected":""}>${esc(x.s.t)} · ${x.s.items.length}문장</option>`).join("");
  $("#sec").value = String(ST.sec);
  $("#sec").onchange = e => { stopAll(); ST.sec = +e.target.value; save(); render(); };
  $("#rates").innerHTML = [0.8,1,1.2].map(r => `<button type="button" aria-pressed="${ST.rate===r}" data-r="${r}">${r}배</button>`).join("");
  $("#rates").querySelectorAll("button").forEach(b => b.onclick = () => { ST.rate = +b.dataset.r; audio.playbackRate = ST.rate; save(); renderPick(); });
  $("#pick").querySelectorAll(".row")[0].hidden = $("#pick").querySelectorAll(".row")[1].hidden = ST.mode === "test";
}
function head(it, n){ const sp = SPK[it.spk]; return `<div class="meta"><span>${n}</span>${sp?`<span class="spk">${esc(sp)}</span>`:""}</div>`; }
function secHead(s){ return `<div class="sec-h">${esc(s.k)}<span>${esc(s.t.replace(/\s*\(.*?\)\s*$/,""))}</span></div>`; }

function renderListen(){
  const scope = itemsInScope(); let html = ""; let all = [];
  scope.forEach(({s}) => { html += secHead(s); s.items.forEach(r => { const it = BYID[r[0]]; all.push(it.id);
    html += `<div class="item" id="it-${it.id}"><button type="button" class="play" data-id="${it.id}" aria-label="듣기">${ICON_PLAY}</button><div class="body">${head(it,it.id.slice(1)*1)}<div class="en ${ST.hideEn?"hide":""}">${esc(it.en)}</div>${ST.showKo?`<div class="ko">${esc(it.ko)}</div>`:""}</div></div>`; }); });
  $("#list").innerHTML = html;
  $("#tools").innerHTML = `<button type="button" class="btn leaf" id="playall">▶ 전체 듣기</button><button type="button" class="btn ghost" id="hideen" aria-pressed="${ST.hideEn}">${ST.hideEn?"영어 보이기":"영어 가리기"}</button><button type="button" class="btn ghost" id="showko">${ST.showKo?"해석 숨기기":"해석 보기"}</button>`;
  $("#score").innerHTML = `<b>${all.length}</b> 문장`;
  $("#list").querySelectorAll(".play").forEach(b => b.onclick = () => playBtn(b, [b.dataset.id]));
  $("#list").querySelectorAll(".en.hide").forEach(e => e.onclick = () => e.classList.remove("hide"));
  $("#hideen").onclick = () => { ST.hideEn = !ST.hideEn; save(); renderListen(); };
  $("#showko").onclick = () => { ST.showKo = !ST.showKo; save(); renderListen(); };
  $("#playall").onclick = async e => {
    const b = e.currentTarget; if (b.dataset.on){ stopAll(); b.dataset.on = ""; b.textContent = "▶ 전체 듣기"; return; }
    stopAll(); b.dataset.on = 1; b.textContent = "■ 멈추기";
    await playSeq(all, id => { document.querySelectorAll(".item.now").forEach(x => x.classList.remove("now")); if (id){ const el = $("#it-"+id); el.classList.add("now"); el.scrollIntoView({block:"nearest",behavior:"smooth"}); } });
    b.dataset.on = ""; b.textContent = "▶ 전체 듣기";
  };
}

function renderBlank(){
  const scope = itemsInScope(); let html = ""; let tot = 0;
  scope.forEach(({s}) => { html += secHead(s); s.items.forEach(r => { const it = BYID[r[0]]; const {toks, idx} = blankIdx(it.en);
    const line = toks.map((t,i) => { if (!idx.includes(i)) return esc(t); tot++;
      const m = t.match(/^([^A-Za-z0-9']*)(.*?)([^A-Za-z0-9']*)$/);
      return `${esc(m[1])}<input class="blank" data-ans="${esc(norm(t))}" aria-label="빈칸" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:${Math.max(4,m[2].length+2)}ch">${esc(m[3])}`; }).join("");
    html += `<div class="item" id="it-${it.id}"><button type="button" class="play" data-id="${it.id}" aria-label="듣기">${ICON_PLAY}</button><div class="body">${head(it,it.id.slice(1)*1)}<div class="en">${line}</div><div class="ko" hidden>${esc(it.ko)}</div></div></div>`; }); });
  $("#list").innerHTML = html;
  $("#tools").innerHTML = `<button type="button" class="btn leaf" id="checkall">모두 채점</button><button type="button" class="btn ghost" id="reset">다시 풀기</button>`;
  $("#score").innerHTML = `빈칸 <b>${tot}</b>개`;
  $("#list").querySelectorAll(".play").forEach(b => b.onclick = () => playBtn(b, [b.dataset.id]));
  $("#list").querySelectorAll(".blank").forEach(inp => inp.addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); const all=[...document.querySelectorAll(".blank")]; const k=all.indexOf(inp); (all[k+1]||inp).focus(); } }));
  $("#checkall").onclick = () => { let ok = 0;
    document.querySelectorAll(".blank").forEach(inp => { inp.nextElementSibling?.classList?.contains("fix") && inp.nextElementSibling.remove();
      const good = norm(inp.value) === inp.dataset.ans; inp.classList.toggle("ok", good); inp.classList.toggle("bad", !good); if (good) ok++;
      else inp.insertAdjacentHTML("afterend", `<span class="fix">${esc(inp.dataset.ans)}</span>`); });
    document.querySelectorAll(".item .ko").forEach(k => k.hidden = false);
    $("#score").innerHTML = `<b>${ok}</b> / ${tot} 정답 · ${tot?Math.round(ok/tot*100):0}점`; };
  $("#reset").onclick = () => renderBlank();
}

function renderFull(){
  const scope = itemsInScope(); let html = ""; const ids = [];
  scope.forEach(({s}) => { html += secHead(s); s.items.forEach(r => { const it = BYID[r[0]]; ids.push(it.id);
    html += `<div class="item" id="it-${it.id}"><button type="button" class="play" data-id="${it.id}" aria-label="듣기">${ICON_PLAY}</button><div class="body">${head(it,it.id.slice(1)*1)}<textarea id="ta-${it.id}" rows="1" placeholder="들은 문장을 쓰세요" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea><div class="acts"><button type="button" class="btn ghost" data-chk="${it.id}">확인</button><span class="small" id="pc-${it.id}"></span></div><div id="rs-${it.id}"></div></div></div>`; }); });
  $("#list").innerHTML = html;
  $("#tools").innerHTML = `<button type="button" class="btn ghost" id="reset">다시 풀기</button>`;
  const done = {};
  const upd = () => { const v = Object.values(done); const ok = v.filter(Boolean).length; $("#score").innerHTML = `<b>${ok}</b> / ${ids.length} 문장 완벽 · 확인한 문장 ${v.length}개`; };
  upd();
  const plays = {};
  $("#list").querySelectorAll(".play").forEach(b => b.onclick = () => { const id = b.dataset.id; plays[id] = (plays[id]||0) + 1; $("#pc-"+id).textContent = `${plays[id]}번 들음`; playBtn(b, [id]); });
  const check = id => { const it = BYID[id]; const mine = $("#ta-"+id).value; if (!mine.trim()) { $("#ta-"+id).focus(); return; }
    const a = words(mine), b = words(it.en); const d = lcs(a, b); const good = d.every(x => x[0]==="g");
    const hit = d.filter(x => x[0]==="g").length;
    $("#rs-"+id).innerHTML = `<div class="res ${good?"ok":"bad"}">${good?"완벽합니다!":`낱말 ${hit} / ${b.length}개 맞음`}</div>${good?"":`<div class="diff">${d.map(x => `<span class="w ${x[0]}">${esc(x[1])}</span>`).join(" ")}</div><div class="small">초록 = 맞은 낱말 · 빨간 밑줄 = 빠뜨렸거나 틀린 낱말(정답) · 회색 줄 = 정답에 없는 낱말</div>`}<div class="en" style="font-size:15px">${esc(it.en)}</div><div class="ko">${esc(it.ko)}</div>`;
    $("#it-"+id).classList.toggle("ok", good); $("#it-"+id).classList.toggle("bad", !good); done[id] = good; upd(); };
  $("#list").querySelectorAll("[data-chk]").forEach(b => b.onclick = () => check(b.dataset.chk));
  $("#list").querySelectorAll("textarea").forEach(t => t.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey){ e.preventDefault(); check(t.id.slice(3)); const k = ids.indexOf(t.id.slice(3)); const nx = ids[k+1]; if (nx) $("#ta-"+nx).focus(); } }));
  $("#reset").onclick = () => renderFull();
}

function rangeIds(a, b){ const all = Object.keys(BYID); return all.slice(all.indexOf(a), all.indexOf(b) + 1); }
function renderTest(){
  const left = QUIZ.map(() => 2); let html = "";
  QUIZ.forEach((q, k) => { html += `<div class="q" id="q${k}"><div class="qh"><div class="qn">${k+1}</div><div><div class="qt">${esc(q.q)}</div><div class="qsrc">${esc(q.sec)}</div></div></div>
    <div class="acts"><button type="button" class="play" data-q="${k}" aria-label="들려주기">${ICON_PLAY}</button><span class="left" id="lf${k}">남은 듣기 2번</span></div>
    <div class="ch" role="radiogroup">${q.c.map((c,j) => `<label id="l${k}_${j}"><input type="radio" name="q${k}" value="${j}">${"①②③④⑤"[j]} ${esc(c)}</label>`).join("")}</div><div id="sc${k}" hidden></div></div>`; });
  $("#list").innerHTML = html;
  $("#tools").innerHTML = `<button type="button" class="btn leaf" id="grade">채점하기</button><button type="button" class="btn ghost" id="reset">다시 풀기</button>`;
  $("#score").innerHTML = `<b>${QUIZ.length}</b> 문항`;
  $("#list").querySelectorAll(".play").forEach(b => b.onclick = () => { const k = +b.dataset.q;
    if (b.classList.contains("playing")){ stopAll(); return; }
    if (left[k] <= 0 && !b.dataset.free) return;
    if (!b.dataset.free){ left[k]--; $("#lf"+k).textContent = left[k] ? `남은 듣기 ${left[k]}번` : "듣기 끝"; }
    playBtn(b, rangeIds(QUIZ[k].ids[0], QUIZ[k].ids[1])); });
  $("#grade").onclick = () => { let ok = 0;
    QUIZ.forEach((q, k) => { const sel = document.querySelector(`input[name="q${k}"]:checked`); const v = sel ? +sel.value : -1;
      q.c.forEach((_, j) => { const l = $(`#l${k}_${j}`); l.classList.toggle("right", j === q.a); l.classList.toggle("wrong", j === v && v !== q.a); });
      if (v === q.a) ok++;
      const sc = $("#sc"+k); sc.hidden = false;
      sc.innerHTML = `<div class="res ${v===q.a?"ok":"bad"}">${v===q.a?"정답":"오답"} · 정답 ${"①②③④⑤"[q.a]}</div><div class="script">${rangeIds(q.ids[0],q.ids[1]).map(id => { const it = BYID[id]; const sp = SPK[it.spk]; return `<div>${sp?`<span class="spk">${esc(sp)}</span>`:""}${esc(it.en)}</div>`; }).join("")}</div>`;
      const pb = document.querySelector(`.play[data-q="${k}"]`); pb.dataset.free = 1; $("#lf"+k).textContent = "채점 후에는 몇 번이든 들을 수 있습니다"; });
    $("#score").innerHTML = `<b>${ok}</b> / ${QUIZ.length} 정답 · ${Math.round(ok/QUIZ.length*100)}점`;
    window.scrollTo({top:0,behavior:"smooth"}); };
  $("#reset").onclick = () => renderTest();
}

function render(){
  renderModes(); renderPick();
  const t = $("#tip"); t.textContent = TIPS[ST.mode]; delete t.dataset.err;
  ({listen:renderListen, blank:renderBlank, full:renderFull, test:renderTest})[ST.mode]();
}
render();

  return () => { try { stopAll(); } catch (e) {} };
}
