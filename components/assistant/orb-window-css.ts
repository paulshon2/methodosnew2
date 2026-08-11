"use client";

/* ══════════════════════════════════════════════════════════════════════
   ove-3 · 오브 대화창 — 기능은 ove-2(플로팅·드래그·리사이즈·바텀시트·음성),
   외형은 ove-1/s-renew-17 CRT(SCHOLAR-DOS) 원형.
   ══════════════════════════════════════════════════════════════════════ */

export const WINDOW_CSS = `
.ra-root{--fw-scale:1}
.ra-win{position:fixed;left:0;top:0;z-index:1250;display:flex;flex-direction:column;
  border-radius:14px;overflow:hidden;background:var(--panelBg);border:1px solid var(--bord);
  box-shadow:0 26px 64px rgba(0,0,0,.55);
  opacity:0;visibility:hidden;pointer-events:none;
  transform:translate3d(var(--wx,0px),var(--wy,0px),0) scale(.96);
  transition:opacity .2s ease,transform .36s cubic-bezier(.22,1,.36,1),
             width .36s cubic-bezier(.22,1,.36,1),height .36s cubic-bezier(.22,1,.36,1),
             border-radius .36s ease,border-color .5s}
.ra-root.ra-open .ra-win{opacity:1;visibility:visible;pointer-events:auto;
  transform:translate3d(var(--wx,0px),var(--wy,0px),0) scale(1)}
.ra-root.ra-term .ra-win{border-color:rgba(255,182,74,.32)}
.ra-win[data-interacting="1"],.ra-win[data-interacting="1"] *{transition:none!important;animation-play-state:paused!important}

/* 헤더 = SCHOLAR-DOS + 상태 + 도구 */
.ra-wh{position:relative;z-index:4;display:flex;align-items:center;gap:8px;
  height:44px;flex:none;padding:0 10px 0 12px;cursor:grab;user-select:none;
  border-bottom:1px solid var(--bord);background:rgba(0,0,0,.22)}
.ra-win[data-dragging="1"] .ra-wh{cursor:grabbing}
.ra-badge{font-family:ui-monospace,Menlo,monospace;font-size:8.5px;letter-spacing:.1em;padding:5px 7px;
  border-radius:4px;border:1px solid var(--bord);color:var(--panelFg);white-space:nowrap;transition:.45s;flex:none}
.ra-root.ra-term .ra-badge,.ra-root.ra-listening .ra-badge{border-color:var(--phDim);color:var(--ph);
  text-shadow:0 0 6px var(--ph);background:rgba(0,0,0,.3)}
.ra-wh-st{flex:1;min-width:0;font-size:calc(11.5px * var(--fw-scale));color:var(--panelFg);opacity:.75;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:.45s}
.ra-root.ra-term .ra-wh-st,.ra-root.ra-listening .ra-wh-st{color:var(--ph);font-family:ui-monospace,Menlo,monospace;
  letter-spacing:.07em;text-transform:uppercase;text-shadow:0 0 7px var(--ph);opacity:1}
.ra-wh-grp{display:flex;align-items:center;gap:2px;flex:none}
.ra-wb{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;
  padding:0 5px;border:0;border-radius:7px;background:transparent;color:var(--panelFg);opacity:.6;
  font-size:12px;line-height:1;cursor:pointer;transition:opacity .15s,background .15s}
.ra-wb:hover{opacity:1;background:rgba(255,255,255,.08)}
.ra-wb:disabled{opacity:.22;cursor:default}
.ra-wb.on{opacity:1;background:rgba(255,182,74,.14);color:var(--ph)}
.ra-wscale{min-width:38px;text-align:center;font-size:11px;font-variant-numeric:tabular-nums;
  color:var(--panelFg);opacity:.55;background:transparent;border:0;cursor:pointer;padding:0}

/* 본문 — CRT 모니터 */
.ra-wbody{position:relative;z-index:3;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:8px;container-type:inline-size;container-name:orbwin}
.ra-mon{width:min(100%,calc(288px + (100cqw - 320px) * .55));max-width:100%;display:flex;flex-direction:column;
  opacity:1;transform:none;pointer-events:auto;min-height:0;flex:1 1 auto}
.ra-win[data-mode="center"] .ra-mon{width:min(92%,720px)}
.ra-bezel{position:relative;padding:11px 11px 13px;border-radius:12px 12px 9px 9px;flex:1 1 auto;min-height:0;
  display:flex;flex-direction:column;
  background:linear-gradient(160deg,var(--caseC),var(--caseA) 34%,var(--caseB));
  box-shadow:0 10px 22px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.1),inset 0 -2px 4px rgba(0,0,0,.5)}
.ra-vent{position:absolute;right:11px;bottom:4px;display:flex;gap:2px}
.ra-vent i{width:2px;height:5px;background:rgba(0,0,0,.45);border-radius:1px;display:block}
.ra-screen{position:relative;width:100%;flex:1 1 auto;min-height:140px;overflow:hidden;border-radius:22px/28px;
  background:radial-gradient(120% 120% at 50% 45%,var(--scr0),var(--scr1) 78%);
  box-shadow:inset 0 0 34px rgba(0,0,0,.9),0 0 0 2px #0d0b08;animation:ra-flick 5.5s steps(1) infinite}
.ra-root.ra-term .ra-screen{animation:ra-flick 5.5s steps(1) infinite,ra-power .55s ease-out 1}
.ra-screen::before{content:"";position:absolute;inset:0;z-index:4;pointer-events:none;
  background:repeating-linear-gradient(rgba(0,0,0,.42) 0 1px,transparent 1px 3px)}
.ra-screen::after{content:"";position:absolute;inset:0;z-index:5;pointer-events:none;border-radius:inherit;
  background:radial-gradient(115% 115% at 50% 42%,transparent 52%,rgba(0,0,0,.5) 88%,rgba(0,0,0,.75)),
    linear-gradient(122deg,rgba(255,255,255,.09) 0 16%,transparent 34%)}
.ra-sweep{position:absolute;left:0;right:0;height:56px;z-index:3;pointer-events:none;
  background:linear-gradient(rgba(255,255,255,0),rgba(255,255,255,.055),rgba(255,255,255,0));
  animation:ra-roll 6.5s linear infinite}
.ra-wscroll{position:absolute;inset:0;z-index:2;overflow-y:auto;overflow-x:hidden;
  padding:11px 12px 22px;font-family:ui-monospace,Menlo,Consolas,monospace;
  font-size:calc(11.5px * var(--fw-scale));line-height:1.5;color:var(--ph);letter-spacing:.02em;
  word-break:break-word;text-shadow:0 0 4px var(--ph),.6px 0 rgba(255,60,0,.28),-.6px 0 rgba(0,150,255,.24)}
.ra-win[data-mode="center"] .ra-wscroll{padding:16px 22px 28px;font-size:calc(13.5px * var(--fw-scale))}
.ra-wscroll::-webkit-scrollbar{width:0}
.ra-msg{margin:0 0 5px;white-space:pre-wrap;max-width:none}
.ra-msg.q{opacity:.86;font-weight:400;color:var(--ph)}
.ra-msg.a{filter:brightness(1.12)}
.ra-msg.sys{color:var(--phDim);text-shadow:0 0 4px var(--phDim);font-size:calc(11px * var(--fw-scale));opacity:1}
.ra-msg.err{color:#ff8f8a;text-shadow:0 0 6px rgba(255,80,80,.45)}
.ra-caret{display:inline-block;width:7px;height:11px;background:var(--ph);vertical-align:-1px;
  margin-left:2px;box-shadow:0 0 8px var(--ph);animation:ra-blink .9s steps(1) infinite}
.ra-pbar{position:absolute;left:11px;right:11px;bottom:9px;height:7px;z-index:3;
  border:1px solid var(--phDim);opacity:0;transition:opacity .25s}
.ra-root.ra-busy .ra-pbar{opacity:1}
.ra-pbar i{display:block;height:100%;width:0;transition:width .12s linear;
  background:repeating-linear-gradient(90deg,var(--ph) 0 3px,transparent 3px 5px)}
.ra-chin{display:flex;align-items:center;gap:6px;margin-top:9px;padding:0 2px;flex:none}
.ra-led{width:6px;height:6px;border-radius:50%;background:#3a1a10;transition:.4s}
.ra-root.ra-term .ra-led,.ra-root.ra-listening .ra-led{background:var(--ph);box-shadow:0 0 8px var(--ph)}
.ra-brand{font-family:ui-monospace,Menlo,monospace;font-size:7px;color:#6b706e;letter-spacing:.14em}
.ra-knob{margin-left:auto;width:9px;height:9px;border-radius:50%;background:linear-gradient(140deg,#4a4f4c,#232624)}

/* 빈 상태 — CRT 힌트 */
.ra-wempty{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:9px;text-align:center;padding:0 28px;color:var(--ph);pointer-events:none}
.ra-wempty h4{margin:0;font-size:calc(13px * var(--fw-scale));font-weight:600;font-family:ui-monospace,Menlo,monospace;
  text-shadow:0 0 6px var(--ph)}
.ra-wempty p{margin:0;font-size:calc(11px * var(--fw-scale));opacity:.7;line-height:1.65;
  font-family:ui-monospace,Menlo,monospace;color:var(--phDim);text-shadow:0 0 4px var(--phDim)}
.ra-wempty .ra-keywarn{pointer-events:auto}

/* 음성 경로 안내 배너 */
.ra-keywarn{margin-top:6px;max-width:90%;border:1px solid rgba(255,182,74,.35);
  background:rgba(255,182,74,.08);color:var(--ph);border-radius:4px;
  padding:8px 12px;font-size:calc(11.5px * var(--fw-scale));line-height:1.55;cursor:pointer;text-align:left;
  font-family:ui-monospace,Menlo,monospace}
.ra-keywarn:hover{background:rgba(255,182,74,.16)}

/* 후보 칩 (되묻기) */
.ra-chips{display:flex;flex-wrap:wrap;gap:6px;padding:6px 4px 2px;width:100%;justify-content:center}
.ra-chip{border:1px solid var(--phDim);background:rgba(0,0,0,.45);color:var(--ph);
  border-radius:3px;padding:5px 12px;font-size:calc(11.5px * var(--fw-scale));cursor:pointer;
  font-family:ui-monospace,Menlo,monospace;text-shadow:0 0 4px var(--ph)}
.ra-chip:hover{background:rgba(255,182,74,.12)}

/* 입력행 — CRT 덱 (마이크 · 웰 · 전송) */
.ra-wft{flex:none;position:relative;z-index:4;display:flex;align-items:stretch;gap:8px;
  padding:10px 11px 11px;border-top:1px solid rgba(0,0,0,.6);
  background:linear-gradient(180deg,var(--caseC),var(--caseA) 40%,var(--caseB));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
.ra-win[data-mode="center"] .ra-wft{padding:12px 16px 14px}
.ra-wtool{flex:none;width:40px;border-radius:5px;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(0,0,0,.7);color:#cfd6d2;cursor:pointer;
  background:linear-gradient(180deg,#4c514e,#333835 48%,#252927);
  box-shadow:0 3px 0 #141715,0 5px 7px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.22);
  transition:transform .06s,box-shadow .06s,color .35s}
.ra-wtool:hover{filter:brightness(1.08)}
.ra-wtool:active{transform:translateY(3px);box-shadow:0 0 0 #141715,inset 0 1px 3px rgba(0,0,0,.6)}
.ra-root.ra-term .ra-wtool{color:var(--ph);filter:drop-shadow(0 0 4px var(--ph))}
.ra-wtool.rec{color:#ff5a5a;filter:drop-shadow(0 0 6px #ff3b3b);
  animation:ra-rec 1.3s ease-in-out infinite}
@keyframes ra-rec{0%,100%{box-shadow:0 3px 0 #141715,0 0 0 0 rgba(255,90,90,.45)}
  50%{box-shadow:0 3px 0 #141715,0 0 0 7px rgba(255,90,90,0)}}
.ra-wtool[disabled]{opacity:.3;cursor:not-allowed}
.ra-wtool svg{width:17px;height:17px;shape-rendering:crispEdges}
.ra-wfield{flex:1;min-width:0;position:relative;display:flex;align-items:flex-start;gap:6px;
  padding:6px 9px;border-radius:3px;overflow:hidden;border:1px solid rgba(0,0,0,.85);
  background:radial-gradient(120% 130% at 50% 40%,var(--scr0),var(--scr1) 85%);
  box-shadow:inset 0 2px 7px rgba(0,0,0,.95),inset 0 0 0 1px var(--phDim)}
.ra-wfield::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(rgba(0,0,0,.34) 0 1px,transparent 1px 3px)}
.ra-win[data-mode="center"] .ra-wfield{border-radius:3px;padding:8px 12px;min-height:44px}
.ra-wfield:focus-within{box-shadow:inset 0 2px 7px rgba(0,0,0,.95),inset 0 0 0 1px var(--ph),0 0 10px rgba(51,255,102,.2)}
.ra-prompt{position:relative;z-index:1;font-family:ui-monospace,Menlo,monospace;font-size:calc(14px * var(--fw-scale));
  line-height:1.5;color:var(--ph);text-shadow:0 0 6px var(--ph);user-select:none}
.ra-wfield textarea{position:relative;z-index:1;flex:1;min-width:0;background:transparent;border:0;outline:none;resize:none;
  height:26px;max-height:calc(4.6em * var(--fw-scale));padding:1px 0 0;
  font-family:ui-monospace,Menlo,monospace;font-size:calc(14px * var(--fw-scale));line-height:1.5;
  color:var(--ph);text-shadow:0 0 6px var(--ph);scrollbar-width:none}
.ra-win[data-mode="center"] .ra-wfield textarea{font-size:calc(15px * var(--fw-scale));height:auto;min-height:28px}
.ra-wfield textarea::-webkit-scrollbar{display:none}
.ra-wfield textarea::placeholder{color:var(--phDim);text-shadow:none}
.ra-wsend{flex:none;width:40px;border-radius:5px;border:1px solid rgba(0,0,0,.7);cursor:pointer;
  display:flex;align-items:center;justify-content:center;color:#cfd6d2;
  background:linear-gradient(180deg,#4c514e,#333835 48%,#252927);
  box-shadow:0 3px 0 #141715,0 5px 7px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.22);
  transition:transform .06s,box-shadow .06s,color .35s}
.ra-wsend:hover{filter:brightness(1.08)}
.ra-wsend:active{transform:translateY(3px);box-shadow:0 0 0 #141715,inset 0 1px 3px rgba(0,0,0,.6)}
.ra-root.ra-term .ra-wsend{color:var(--ph);filter:drop-shadow(0 0 4px var(--ph))}
.ra-win[data-mode="center"] .ra-wsend,.ra-win[data-mode="center"] .ra-wtool{width:44px}
.ra-wsend:disabled{opacity:.35;cursor:default}
.ra-wsend svg{width:17px;height:17px;shape-rendering:crispEdges}

/* 안내 줄 */
.ra-wnote{flex:none;position:relative;z-index:4;padding:4px 12px 6px;min-height:8px;
  font-family:ui-monospace,Menlo,monospace;font-size:calc(11px * var(--fw-scale));
  color:var(--phDim);line-height:1.5;text-align:center;background:var(--caseB)}
.ra-wnote:empty{display:none}
.ra-wnote-act{border:0;background:transparent;color:var(--ph);text-decoration:underline;cursor:pointer;
  font-size:inherit;padding:0;text-shadow:0 0 4px var(--ph)}

/* 설정 패널 */
.ra-settings{position:absolute;left:10px;right:10px;bottom:8px;z-index:6;max-height:82%;overflow-y:auto;
  padding:12px 13px;border-radius:10px;background:#0a0f0c;border:1px solid rgba(51,255,102,.22);
  box-shadow:0 18px 44px rgba(0,0,0,.6);color:var(--ph)}
.ra-mini{font-size:11.5px;padding:4px 9px;border-radius:4px;cursor:pointer;
  border:1px solid rgba(51,255,102,.28);background:rgba(0,0,0,.4);color:var(--ph)}
.ra-mini:hover{background:rgba(255,182,74,.12)}
.ra-mini:disabled{opacity:.4;cursor:default}

/* 리사이즈 손잡이 — 헤더와 겹치지 않도록 상단 44px 를 비운다 */
.ra-rs{position:absolute;z-index:5;touch-action:none}
.ra-rs.e{top:44px;right:0;bottom:20px;width:6px;cursor:ew-resize}
.ra-rs.s{left:0;right:20px;bottom:0;height:6px;cursor:ns-resize}
.ra-rs.se{right:0;bottom:0;width:20px;height:20px;cursor:nwse-resize}
.ra-rs.se::after{content:"";position:absolute;right:4px;bottom:4px;width:9px;height:9px;opacity:.45;
  background:linear-gradient(135deg,transparent 46%,currentColor 46%,currentColor 54%,transparent 54%),
             linear-gradient(135deg,transparent 68%,currentColor 68%,currentColor 76%,transparent 76%);
  color:var(--ph);transition:opacity .12s}
.ra-rs.se:hover::after{opacity:1}

@container orbwin (max-width: 560px){
  .ra-wscroll{padding:10px 11px 18px}
  .ra-wtool,.ra-wsend{width:36px}
}

/* ══════════════════════════════════════════════════════════════════
   renew-18 · 오브 크기·위치
   · 홈(center): 제목과 겹치지 않게 슬롯 중심에 정확히 배치 + 선명
   · 메뉴(dock): 점선 가이드처럼 왼쪽·크게(192) · 캡션 가독성
   ══════════════════════════════════════════════════════════════════ */
.ra-root.ra-center{left:calc(var(--ra-sidebar,0px) + (100vw - var(--ra-sidebar,0px)) / 2);
  right:auto;bottom:auto;top:auto}
.ra-orbanchor{position:relative}
/* 슬롯 중심에 맞춤 — 위로 끌어올리면 제목과 겹침 */
.ra-root.ra-slot .ra-orbanchor{transform:translate(-50%,-50%)}
.ra-root.ra-center:not(.ra-slot) .ra-orbanchor{transform:translateX(-50%)}
.ra-root.ra-center .ra-orbwrap,.ra-root.ra-center .ra-orb{width:192px;height:192px}
.ra-root.ra-dock .ra-orbwrap,.ra-root.ra-dock .ra-orb{width:192px;height:192px}
.ra-root.ra-open .ra-orbwrap{transform:scale(.9);opacity:1;pointer-events:auto}
.ra-root.ra-open.ra-center .ra-orbwrap{transform:scale(.82);opacity:.96}

/* renew-18 · 선명도 — 윤곽·대비 강화 */
.ra-orb{filter:drop-shadow(0 0 10px rgba(120,180,255,.45)) drop-shadow(0 0 22px rgba(80,140,230,.28))}
.ra-orb::before{display:none}
.ra-root.ra-center .ra-orb::after{inset:6%;border-width:1.5px;border-color:rgba(170,215,255,.55);
  box-shadow:inset 0 0 18px rgba(90,150,240,.22),0 0 20px rgba(70,130,220,.28)}
.ra-root.ra-dock .ra-orb::after{inset:5%;border-width:1.75px;border-color:rgba(180,220,255,.62);
  box-shadow:inset 0 0 22px rgba(100,160,255,.28),0 0 26px rgba(80,140,240,.36)}
.ra-orb:hover{filter:drop-shadow(0 0 14px rgba(140,200,255,.55)) drop-shadow(0 0 28px rgba(90,150,240,.36))}
.ra-root.ra-center .ra-orb:focus-visible,.ra-root.ra-dock .ra-orb:focus-visible{
  outline:2px solid rgba(160,210,255,.9);outline-offset:6px;border-radius:50%}

.ra-cap{position:absolute;left:50%;bottom:-32px;transform:translateX(-50%);white-space:nowrap;
  font-size:13px;letter-spacing:.02em;color:rgba(232,234,240,.72);pointer-events:auto;
  display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;cursor:pointer;
  padding:5px 12px;border-radius:999px}
.ra-root.ra-dock .ra-cap{bottom:-34px;font-size:12.5px;max-width:220px;overflow:visible;text-overflow:clip;
  color:rgba(232,234,240,.78);white-space:nowrap}
.ra-cap:hover{color:rgba(190,210,255,.98);background:rgba(108,140,255,.12)}
.ra-cap b{color:rgba(190,210,255,.95);font-weight:700}
.ra-root.ra-open .ra-cap{opacity:0;pointer-events:none;transition:opacity .2s}
.ra-root.ra-listening .ra-cap{color:#ff9d9d}

.ra-ring{position:absolute;inset:0;border-radius:50%;pointer-events:none;z-index:1;
  border:2px solid rgba(108,140,255,.0);transition:border-color .2s}
.ra-root.ra-listening .ra-ring{border-color:rgba(255,120,120,.75);
  box-shadow:0 0 0 calc(6px * var(--lvl,0)) rgba(255,120,120,.16),
             0 0 26px rgba(255,120,120,.35)}

/* ══════════════════════════════════════════════════════════════════
   ove-3 · 모바일(안드로이드) — CRT 스킨 유지 + 바텀시트 동작(ove-2)
   ══════════════════════════════════════════════════════════════════ */
@media (max-width:767px){
  .ra-win{
    left:0!important;right:0!important;top:auto!important;
    bottom:calc(var(--kb,0px))!important;
    width:100vw!important;max-width:100vw;
    height:var(--sheet-h,52dvh)!important;
    transform:translateY(18px)!important;
    border-radius:16px 16px 0 0;
    border-left:0;border-right:0;border-bottom:0;
    box-shadow:0 -14px 40px rgba(0,0,0,.55);
    transition:opacity .2s ease,transform .3s cubic-bezier(.22,1,.36,1),
               height .3s cubic-bezier(.22,1,.36,1),bottom .2s ease}
  .ra-root.ra-open .ra-win{transform:none!important;z-index:7600}
  .ra-win[data-interacting="1"]{transition:none!important}

  .ra-wh{height:46px;padding:9px 6px 0 12px;cursor:grab;touch-action:none}
  .ra-wh::before{content:"";position:absolute;left:50%;top:7px;width:38px;height:4px;margin-left:-19px;
    border-radius:3px;background:rgba(255,182,74,.35)}
  .ra-win[data-dragging="1"] .ra-wh::before{background:rgba(255,182,74,.75)}
  .ra-wh-st{font-size:12.5px;padding-top:7px}
  .ra-wh-grp{padding-top:7px;gap:0}
  .ra-wb{min-width:36px;height:36px;border-radius:7px;font-size:12.5px}
  .ra-wscale{min-width:44px;font-size:12px}
  .ra-wb[data-desktop-only]{display:none}

  .ra-mon{width:min(300px,86vw)}
  .ra-wscroll{padding:12px 14px 20px;font-size:calc(13px * var(--fw-scale))}
  .ra-msg{max-width:100%}
  .ra-wempty{padding:10px 20px;gap:5px}
  .ra-wempty h4{font-size:calc(13px * var(--fw-scale))}
  .ra-wempty p{font-size:calc(11.5px * var(--fw-scale))}

  .ra-chips{padding:4px 8px 8px;gap:8px}
  .ra-chip{padding:9px 14px;font-size:calc(13px * var(--fw-scale))}

  .ra-wft{padding:8px 10px calc(8px + env(safe-area-inset-bottom,0px));gap:8px}
  .ra-wtool,.ra-wsend{width:46px;min-height:46px;border-radius:5px}
  .ra-wfield{border-radius:3px;padding:8px 12px;min-height:46px}
  .ra-wfield textarea,.ra-prompt{font-size:16px}
  .ra-wfield textarea{max-height:4.2em}

  .ra-settings{left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));
    max-height:78%;padding:14px}
  .ra-mini{font-size:13px;padding:8px 12px;border-radius:6px}
  .ra-settings select,.ra-settings input[type="checkbox"]{min-height:34px}

  .ra-rs{display:none}

  /* 모바일 — 홈·메뉴 모두 선명하게, 슬롯 중심 유지 */
  .ra-root.ra-center .ra-orbwrap,.ra-root.ra-center .ra-orb{width:144px;height:144px}
  .ra-root.ra-dock .ra-orbwrap,.ra-root.ra-dock .ra-orb{width:136px;height:136px}
  .ra-root.ra-open .ra-orbwrap{transform:scale(.62);opacity:.55}
  .ra-root.ra-center.ra-slot .ra-orbanchor{transform:translate(-50%,-50%)}
  .ra-root.ra-dock{bottom:calc(var(--imm-tabbar,62px) + env(safe-area-inset-bottom,0px) + 96px)!important;right:48px!important}
  .ra-cap{bottom:-30px;max-width:min(92vw,280px);white-space:normal;text-align:center;line-height:1.25}
}

/* renew-18 · 메뉴 도킹: 점선 위치로 왼쪽 이동 + 위로 */
@media (min-width:768px){
  .ra-root.ra-dock{
    bottom:max(150px, calc(24vh + 56px))!important;
    right:max(110px, calc((100vw - var(--ra-sidebar,0px) - var(--ra-maxw,100vw)) / 2 + 110px))!important;
  }
  .ra-root.ra-dock[data-page-top="settings"]{
    bottom:max(160px, calc(26vh + 48px))!important;
    right:max(110px, calc((100vw - var(--ra-sidebar,0px) - var(--ra-maxw,100vw)) / 2 + 110px))!important;
  }
}

@media (max-width:359px){
  .ra-wh-st{display:none}
  .ra-badge{font-size:7.5px;padding:4px 5px}
  .ra-wtool,.ra-wsend{width:42px;min-height:42px}
}

@media (max-width:900px) and (max-height:480px) and (orientation:landscape){
  .ra-win{height:min(92dvh,340px)!important}
  .ra-wh{height:44px}
}

@media (prefers-reduced-motion:reduce){
  .ra-win{transition:opacity .12s linear!important}
  .ra-orb{filter:none}
  .ra-wtool.rec{animation:none}
  .ra-screen,.ra-sweep,.ra-caret{animation:none!important}
  .menu-card{animation:none}
}
`;
