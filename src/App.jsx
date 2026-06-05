import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList
} from 'recharts';
import { Crown, Check, Plus, Trash2, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Moon, Smile, RotateCcw, Pencil, Download, Upload, Palette, RefreshCw } from 'lucide-react';
import pkg from '../package.json';

/* ---------------- helpers ---------------- */
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const today0 = () => { const x = new Date(); x.setHours(0, 0, 0, 0); return x; };
const KWD = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const EMOJIS = ['⏰', '🏃', '📚', '🗒️', '💻', '🚫', '🧘', '🤸', '💧', '🥗', '🌙', '🚿', '📓', '🎯', '🙏', '📵', '💰', '🎨', '🌱', '🚀', '💡', '❤️', '🎓', '🏆', '💪', '🚴', '🏊', '🚶', '⚽', '🧗', '🍎', '🥦', '🍳', '☕', '🍵', '🚭', '🪥', '💊', '🧴', '😴', '🎵', '✍️', '🗣️', '📷', '📅', '📈', '🧹', '🛒'];
const PROJECT_COLORS = ['#2f9e6f', '#5b7fb9', '#c98b2e', '#b5566a', '#7d6bc9', '#3aa6a0', '#d97757', '#558b2f'];
const HORIZONS = ['장기', '중기', '단기'];
const HORIZON_ORDER = { '장기': 0, '중기': 1, '단기': 2 };
const STORAGE_KEY = 'habit-game-dashboard-v2';

// 색상 테마 (강조색만 바꾸는 라이트 기반). primary=짙은 브랜드색, accent=밝은 포인트색.
const THEMES = {
  green:  { name: '포레스트', primary: '#163a30', primary2: '#1f4d40', accent: '#8ed14f', accent2: '#b6e077', page: '#e7eae1', wknd: '#f1f3eb', today: 'rgba(142,209,79,.2)' },
  blue:   { name: '오션',     primary: '#143a4a', primary2: '#1d5066', accent: '#46b3d4', accent2: '#84d3e6', page: '#e5ecef', wknd: '#eef3f5', today: 'rgba(70,179,212,.2)' },
  purple: { name: '그레이프', primary: '#2d2150', primary2: '#3f3070', accent: '#9d7fd6', accent2: '#c1a8ea', page: '#eae7f1', wknd: '#f1eef7', today: 'rgba(157,127,214,.2)' },
  amber:  { name: '선셋',     primary: '#4a3115', primary2: '#6b481f', accent: '#e0982f', accent2: '#efbd6b', page: '#efe9e0', wknd: '#f5f0e7', today: 'rgba(224,152,47,.2)' },
  rose:   { name: '로즈',     primary: '#4a1d2c', primary2: '#6b2c42', accent: '#d65583', accent2: '#ec84ab', page: '#efe6ea', wknd: '#f6eef2', today: 'rgba(214,85,131,.2)' },
};

// 같은 밀리초에 연속으로 추가해도 충돌하지 않는 고유 id (prefix + 시각 + 카운터)
let uidCounter = 0;
const uid = (prefix) => `${prefix}${Date.now().toString(36)}${(uidCounter++).toString(36)}`;

const SEED_PROJECTS = [
  { id: 'p1', name: '건강 체질 만들기', emoji: '🌱', color: '#2f9e6f', horizon: '장기' },
  { id: 'p2', name: '커리어 성장', emoji: '🚀', color: '#5b7fb9', horizon: '중기' },
  { id: 'p3', name: '마음 관리', emoji: '🧘', color: '#c98b2e', horizon: '단기' },
];
const SEED_HABITS = [
  { id: 'h1', name: '5시 기상', emoji: '⏰', projectId: 'p1', p: 0.70 },
  { id: 'h2', name: '운동', emoji: '🏃', projectId: 'p1', p: 0.60 },
  { id: 'h3', name: '스트레칭', emoji: '🤸', projectId: 'p1', p: 0.95 },
  { id: 'h4', name: '냉수 샤워', emoji: '🚿', projectId: 'p1', p: 0.50 },
  { id: 'h5', name: '독서 / 공부', emoji: '📚', projectId: 'p2', p: 0.82 },
  { id: 'h6', name: '집중 작업', emoji: '💻', projectId: 'p2', p: 0.66 },
  { id: 'h7', name: '하루 계획', emoji: '🗒️', projectId: 'p2', p: 0.88 },
  { id: 'h8', name: '명상', emoji: '🧘', projectId: 'p3', p: 0.55 },
  { id: 'h9', name: '금주', emoji: '🚫', projectId: 'p3', p: 0.92 },
  { id: 'h10', name: '목표 일기', emoji: '📓', projectId: 'p3', p: 0.70 },
];

const seedData = () => {
  const t = today0(), y = t.getFullYear(), m = t.getMonth();
  const comp = {}, well = {};
  SEED_HABITS.forEach((h) => { comp[h.id] = {}; });
  for (let d = 1; d <= t.getDate(); d++) {
    const k = keyOf(y, m, d);
    SEED_HABITS.forEach((h) => { if (Math.random() < h.p) comp[h.id][k] = true; });
    well[k] = { mood: 3 + Math.round(Math.random() * 2), sleep: +(6 + Math.random() * 2.4).toFixed(1) };
  }
  return { projects: SEED_PROJECTS, habits: SEED_HABITS.map(({ p, ...r }) => r), completions: comp, wellness: well };
};

const isDone = (c, id, k) => !!(c[id] && c[id][k]);

const CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');

.hg-page *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
.hg-page{
  --green:#163a30;--green2:#1f4d40;--lime:#8ed14f;--lime2:#b6e077;
  --page:#e7eae1;--card:#ffffff;--ink:#13201b;--muted:#586259;--faint:#7a847b;
  --line:#e0e3da;--line2:#c4cabd;--wknd:#f1f3eb;--todaycol:rgba(142,209,79,.2);
  --ui:'Pretendard','Apple SD Gothic Neo','Malgun Gothic',-apple-system,sans-serif;
  font-family:var(--ui);background:var(--page);color:var(--ink);min-height:100vh;width:100%;letter-spacing:-.01em;padding:24px;font-size:15px;
}
.hg-wrap{max-width:1360px;margin:0 auto;}

/* topbar */
.hg-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:14px;}
.hg-brand{display:flex;align-items:center;gap:13px;}
.hg-logo{width:50px;height:50px;border-radius:14px;background:var(--green);display:grid;place-items:center;}
.hg-bname{font-size:25px;font-weight:800;line-height:.95;letter-spacing:-.04em;}
.hg-bname small{display:block;font-size:11.5px;font-weight:600;letter-spacing:.16em;color:var(--muted);margin-top:5px;}
.hg-upd-btn{display:inline-flex;align-items:center;gap:4px;margin-left:10px;padding:2px 9px;border:1px solid var(--line2);border-radius:99px;background:var(--card);color:var(--muted);font-size:10px;font-weight:700;letter-spacing:.02em;cursor:pointer;vertical-align:middle;transition:border-color .15s,color .15s;}
.hg-upd-btn:hover:not(:disabled){border-color:var(--green);color:var(--green);}
.hg-upd-btn:disabled{cursor:default;opacity:.85;}
.hg-spin{animation:hg-spin .9s linear infinite;}
@keyframes hg-spin{to{transform:rotate(360deg);}}
.hg-topctl{display:flex;align-items:center;gap:10px;}
.hg-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:12px;border:1px solid var(--line2);background:var(--card);color:var(--ink);font-size:14.5px;font-weight:700;font-family:var(--ui);cursor:pointer;transition:.18s;}
.hg-btn:hover{background:#f4f6ef;border-color:var(--green);}
.hg-btn:disabled{opacity:.4;cursor:default;}
.hg-btn.primary{background:var(--green);color:#fff;border-color:var(--green);}
.hg-btn.primary:hover{background:var(--green2);}
.hg-btn.ghost{border-color:var(--line2);color:var(--muted);}

/* projects navigator */
.hg-nav{display:flex;gap:11px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px;}
.hg-navcard{flex:0 0 206px;min-width:206px;border-radius:14px;padding:13px 14px;cursor:pointer;transition:.16s;position:relative;text-align:left;font-family:var(--ui);}
.hg-navcard:hover{box-shadow:0 8px 20px -12px rgba(0,0,0,.3);}
.hg-nc-top{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
.hg-nc-em{font-size:19px;}
.hg-nc-nm{font-size:15.5px;font-weight:800;letter-spacing:-.02em;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hg-nc-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.hg-nc-badge{font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:99px;}
.hg-nc-pct{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums;}
.hg-nc-bar{height:7px;border-radius:99px;background:var(--line);overflow:hidden;}
.hg-nc-fill{height:100%;border-radius:99px;transition:width .6s cubic-bezier(.3,.7,.3,1);}
.hg-nc-cnt{font-size:12.5px;color:var(--muted);font-weight:600;margin-top:8px;}
.hg-nc-actions{position:absolute;top:9px;right:9px;display:flex;gap:4px;opacity:0;transition:.15s;}
.hg-navcard:hover .hg-nc-actions{opacity:1;}
.hg-nc-act{width:24px;height:24px;border-radius:7px;border:none;background:rgba(255,255,255,.88);color:var(--muted);cursor:pointer;display:grid;place-items:center;}
.hg-nc-act:hover{background:#fff;color:var(--ink);}
.hg-navadd{flex:0 0 122px;min-width:122px;border-radius:14px;border:1.5px dashed var(--line2);background:transparent;color:var(--muted);font-size:14px;font-weight:700;font-family:var(--ui);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:.16s;}
.hg-navadd:hover{border-color:var(--green);color:var(--green);background:rgba(22,58,48,.04);}

/* rows / cards */
.hg-row{display:flex;gap:14px;margin-bottom:14px;align-items:stretch;flex-wrap:wrap;}
.hg-card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;}
.hg-head{background:var(--green);color:#fff;font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:11px 15px;display:flex;align-items:center;justify-content:space-between;gap:8px;}
.hg-head .hg-hsub{font-weight:500;letter-spacing:.01em;opacity:.78;text-transform:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hg-body{padding:15px;flex:1;}

.hg-set{color:#fff;min-width:220px;flex:0 0 220px;border-radius:14px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;transition:background .3s;}
.hg-set-t{font-size:12.5px;letter-spacing:.12em;font-weight:700;opacity:.72;}
.hg-set-m{font-size:38px;font-weight:800;letter-spacing:-.03em;line-height:1;margin:8px 0 3px;}
.hg-set-y{font-size:14px;opacity:.82;font-weight:600;}
.hg-ystep{display:flex;align-items:center;gap:10px;margin-top:18px;background:rgba(255,255,255,.13);border-radius:12px;padding:8px;}
.hg-ystep button{width:34px;height:34px;border-radius:9px;border:none;background:rgba(255,255,255,.18);color:#fff;cursor:pointer;display:grid;place-items:center;transition:.18s;}
.hg-ystep button:hover{background:rgba(255,255,255,.32);}
.hg-ystep button:disabled{opacity:.3;cursor:default;}
.hg-ystep button:disabled:hover{background:rgba(255,255,255,.18);}
.hg-ystep .v{flex:1;text-align:center;font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;}

.hg-statcol{flex:0 0 264px;min-width:240px;}
.hg-tiles{display:flex;gap:9px;padding:15px 15px 0;}
.hg-tile{flex:1;border:1px solid var(--line);border-radius:12px;padding:11px 8px;text-align:center;}
.hg-tile .l{font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:700;}
.hg-tile .v{font-size:23px;font-weight:800;margin-top:5px;font-variant-numeric:tabular-nums;}
.hg-donut-wrap{position:relative;display:grid;place-items:center;padding:8px 0 14px;}
.hg-donut-c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.hg-donut-c .p{font-size:34px;font-weight:800;font-variant-numeric:tabular-nums;}
.hg-donut-c .l{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:2px;}

.hg-chart{flex:1;min-width:250px;}

/* grid */
.hg-gridcard{flex:1;min-width:0;}
.hg-scroll{overflow-x:auto;}
.hg-grid-head,.hg-grid-row,.hg-grp-head{display:grid;align-items:center;}
.hg-grid-head{background:var(--green);position:sticky;top:0;z-index:3;}
.hg-gh-corner{position:sticky;left:0;z-index:4;background:var(--green);color:#fff;font-size:12.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:11px 13px;display:flex;align-items:center;height:100%;}
.hg-gh-day{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:7px 0;color:#fff;}
.hg-gh-day.wknd{color:var(--lime2);}
.hg-gh-wd{font-size:10.5px;font-weight:600;opacity:.8;}
.hg-gh-dn{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;margin-top:2px;}
.hg-gh-day.today .hg-gh-dn{background:var(--lime);color:var(--green);border-radius:7px;padding:1px 3px;min-width:21px;text-align:center;}
.hg-grp-head{border-bottom:1px solid var(--line);}
.hg-grp-name{position:sticky;left:0;z-index:2;background:#fff;height:36px;display:flex;align-items:center;gap:9px;padding:0 13px;border-right:1px solid var(--line);}
.hg-grp-em{font-size:16px;}
.hg-grp-nm{font-size:14px;font-weight:800;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hg-grp-badge{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;white-space:nowrap;position:relative;z-index:1;}
.hg-grp-pct{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;position:relative;z-index:1;}
.hg-grp-meta{grid-column:2 / -1;position:relative;min-width:0;overflow:hidden;}
.hg-grp-fill{position:absolute;left:0;top:0;bottom:0;opacity:.2;transition:width .6s cubic-bezier(.3,.7,.3,1);pointer-events:none;}
.hg-grp-label{position:absolute;top:0;bottom:0;display:flex;align-items:center;gap:8px;padding-left:8px;white-space:nowrap;transition:left .6s cubic-bezier(.3,.7,.3,1);}
.hg-grid-row{border-bottom:1px solid var(--line);}
.hg-grid-row:last-child{border-bottom:none;}
.hg-gr-name{position:sticky;left:0;z-index:2;background:var(--card);padding:0 13px;height:42px;display:flex;align-items:center;gap:9px;border-right:1px solid var(--line);}
.hg-grid-row:hover .hg-gr-name{background:#f7f9f2;}
.hg-gr-em{font-size:17px;flex-shrink:0;}
.hg-gr-nm{font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
.hg-gr-nm.hg-clickable{cursor:pointer;}
.hg-grid-row:hover .hg-gr-nm.hg-clickable{color:var(--green);}
.hg-gr-acts{position:absolute;right:6px;top:0;height:100%;display:flex;align-items:center;gap:3px;opacity:0;transition:.15s;padding-left:22px;background:linear-gradient(90deg,rgba(247,249,242,0),#f7f9f2 42%);}
.hg-grid-row:hover .hg-gr-acts{opacity:1;}
.hg-gr-actbtn{border:none;background:none;cursor:pointer;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:var(--faint);transition:.14s;}
.hg-gr-actbtn.edit:hover{background:#eaf2e0;color:var(--green);}
.hg-gr-actbtn.del:hover{background:#fbe3e3;color:#cf4f52;}
.hg-gr-actbtn:disabled{opacity:.25;cursor:default;}
.hg-gr-actbtn:disabled:hover{background:none;color:var(--faint);}
.hg-cellwrap{display:grid;place-items:center;height:42px;}
.hg-cellwrap.wknd{background:var(--wknd);}
.hg-cellwrap.today{background:var(--todaycol);}
.hg-cell{width:24px;height:24px;border-radius:7px;border:2px solid var(--line2);background:var(--card);cursor:pointer;display:grid;place-items:center;transition:.14s;}
.hg-cell:hover:not(:disabled){border-color:var(--green);}
.hg-cell.on{background:var(--green);border-color:var(--green);}
.hg-cell:disabled{opacity:.32;cursor:default;}

/* analysis */
.hg-anacol{flex:0 0 300px;min-width:260px;}
.hg-ana-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);}
.hg-ana-row:last-child{border-bottom:none;}
.hg-ana-dot{width:9px;height:9px;border-radius:99px;flex-shrink:0;}
.hg-ana-em{font-size:16px;width:20px;text-align:center;flex-shrink:0;}
.hg-ana-nm{font-size:14px;font-weight:600;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hg-ana-bar{width:80px;height:9px;border-radius:99px;background:var(--line);overflow:hidden;flex-shrink:0;}
.hg-ana-fill{height:100%;border-radius:99px;transition:width .7s cubic-bezier(.3,.7,.3,1);}
.hg-ana-pct{font-size:13.5px;font-weight:800;width:42px;text-align:right;font-variant-numeric:tabular-nums;flex-shrink:0;}
.hg-ana-streak{font-size:11.5px;font-weight:800;color:#d97757;flex-shrink:0;font-variant-numeric:tabular-nums;letter-spacing:-.02em;}

/* wellness */
.hg-wellcard{flex:1;min-width:270px;}
.hg-welllog{display:flex;align-items:center;gap:20px;padding:13px 15px;border-top:1px solid var(--line);flex-wrap:wrap;}
.hg-wl-grp{display:flex;align-items:center;gap:9px;}
.hg-wl-lab{font-size:12.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;display:inline-flex;align-items:center;gap:5px;}
.hg-wl-sel{padding:8px 11px;border-radius:10px;border:1px solid var(--line2);background:var(--card);font-size:14px;font-weight:600;font-family:var(--ui);color:var(--ink);cursor:pointer;outline:none;}
.hg-mood{display:flex;gap:5px;}
.hg-mood button{width:34px;height:34px;border-radius:9px;border:1px solid var(--line);background:var(--card);font-size:17px;cursor:pointer;transition:.15s;display:grid;place-items:center;}
.hg-mood button:hover{background:#f4f6ef;}
.hg-mood button.on{background:#eaf2e0;border-color:var(--green);transform:scale(1.08);}
.hg-sleep{display:flex;align-items:center;gap:7px;}
.hg-sleep button{width:32px;height:32px;border-radius:9px;border:1px solid var(--line2);background:var(--card);cursor:pointer;font-size:18px;font-weight:700;color:var(--green);display:grid;place-items:center;transition:.15s;}
.hg-sleep button:hover{background:#f4f6ef;}
.hg-sleep .v{font-size:17px;font-weight:800;width:56px;text-align:center;font-variant-numeric:tabular-nums;}

/* top habits */
.hg-topcol{flex:0 0 300px;min-width:260px;}
.hg-toprow{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid var(--line);}
.hg-toprow:last-child{border-bottom:none;}
.hg-rank{width:25px;height:25px;border-radius:8px;background:var(--line);color:var(--muted);font-size:13px;font-weight:800;display:grid;place-items:center;flex-shrink:0;font-variant-numeric:tabular-nums;}
.hg-toprow:nth-child(1) .hg-rank,.hg-toprow:nth-child(2) .hg-rank,.hg-toprow:nth-child(3) .hg-rank{background:var(--green);color:#fff;}
.hg-top-dot{width:9px;height:9px;border-radius:99px;flex-shrink:0;}
.hg-top-nm{font-size:14.5px;font-weight:600;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hg-top-v{font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;}

/* month tabs */
.hg-tabs{display:flex;gap:6px;background:var(--card);border:1px solid var(--line);border-radius:13px;padding:7px;flex-wrap:wrap;}
.hg-mtab{flex:1;min-width:70px;border:none;background:none;cursor:pointer;padding:11px 4px;border-radius:10px;font-size:14.5px;font-weight:700;font-family:var(--ui);color:var(--muted);transition:.16s;}
.hg-mtab:hover{background:#f4f6ef;}
.hg-mtab.on{background:var(--green);color:#fff;}

/* tooltip */
.hg-tip{background:#fff;border:1px solid var(--green);border-radius:10px;padding:8px 12px;font-size:13px;font-weight:600;box-shadow:0 8px 22px -8px rgba(0,0,0,.25);font-variant-numeric:tabular-nums;}
.hg-tip .d{color:var(--muted);font-size:12px;margin-bottom:3px;}
.hg-tip b{color:var(--green);}

/* modal */
.hg-ov{position:fixed;inset:0;z-index:60;background:rgba(20,30,25,.42);backdrop-filter:blur(5px);display:grid;place-items:center;padding:20px;animation:hgFade .2s ease;overflow-y:auto;}
.hg-modal{width:100%;max-width:470px;background:#fff;border-radius:22px;padding:26px;animation:hgPop .3s cubic-bezier(.2,.8,.2,1);box-shadow:0 30px 70px -20px rgba(0,0,0,.4);margin:auto;}
.hg-mh{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;}
.hg-mt{font-size:20px;font-weight:800;letter-spacing:-.02em;}
.hg-mx{width:36px;height:36px;border-radius:11px;border:1px solid var(--line);background:#f4f6ef;color:var(--muted);cursor:pointer;display:grid;place-items:center;transition:.18s;}
.hg-mx:hover{background:#e8ebe2;}
.hg-ml{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;}
.hg-mi{width:100%;padding:14px 16px;border-radius:13px;border:1px solid var(--line2);background:#fafbf7;color:var(--ink);font-size:16px;font-family:var(--ui);font-weight:600;outline:none;transition:.18s;margin-bottom:20px;}
.hg-mi:focus{border-color:var(--green);background:#fff;}
.hg-emg{display:grid;grid-template-columns:repeat(8,1fr);gap:7px;margin-bottom:20px;}
.hg-emc{aspect-ratio:1;border-radius:11px;border:1px solid var(--line);background:#fafbf7;font-size:19px;cursor:pointer;display:grid;place-items:center;transition:.14s;}
.hg-emc:hover{background:#f0f3ea;}
.hg-emc.on{border-color:var(--green);background:#eaf2e0;transform:scale(1.06);}
.hg-colrow{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.hg-col{width:34px;height:34px;border-radius:50%;cursor:pointer;transition:.16s;border:2px solid transparent;}
.hg-col.on{transform:scale(1.15);box-shadow:0 0 0 2px #fff,0 0 0 4px currentColor;}
.hg-seg{display:flex;gap:8px;margin-bottom:24px;}
.hg-seg button{flex:1;padding:12px 0;border-radius:12px;border:1px solid var(--line2);background:#fafbf7;font-size:15.5px;font-weight:700;font-family:var(--ui);color:var(--muted);cursor:pointer;transition:.16s;}
.hg-seg button.on{background:var(--green);border-color:var(--green);color:#fff;}
.hg-projsel{display:flex;flex-direction:column;gap:8px;margin-bottom:24px;}
.hg-pchip{display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:13px;border:1px solid var(--line2);background:#fafbf7;font-size:15px;font-weight:600;font-family:var(--ui);color:var(--ink);cursor:pointer;transition:.16s;text-align:left;}
.hg-pchip:hover{background:#f0f3ea;}
.hg-pchip .dot{width:12px;height:12px;border-radius:99px;flex-shrink:0;}
.hg-pchip .bdg{margin-left:auto;font-size:11.5px;font-weight:700;color:var(--muted);}
.hg-themegrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
.hg-themecard{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:13px;border:1px solid var(--line2);background:#fafbf7;cursor:pointer;font-family:var(--ui);transition:.16s;text-align:left;}
.hg-themecard:hover{background:#f0f3ea;}
.hg-themecard.on{border-color:var(--green);background:#eaf2e0;}
.hg-themeswatch{display:flex;flex-shrink:0;}
.hg-themeswatch span{width:22px;height:22px;border-radius:99px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.15);}
.hg-themeswatch span:last-child{margin-left:-9px;}
.hg-themename{font-size:14.5px;font-weight:700;color:var(--ink);}

@keyframes hgFade{from{opacity:0;}to{opacity:1;}}
@keyframes hgPop{from{opacity:0;transform:translateY(16px) scale(.98);}to{opacity:1;transform:none;}}
@media(max-width:720px){.hg-page{padding:14px;}}
`;

function ChartTip({ active, payload, label, suffix }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="hg-tip">
      <div className="d">{label}</div>
      {payload.map((p, i) => (<div key={i}>{p.name ? p.name + ' ' : ''}<b>{p.value}</b>{suffix || ''}</div>))}
    </div>
  );
}

export default function HabitGameDashboard() {
  const [projects, setProjects] = useState([]);
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [wellness, setWellness] = useState({});
  const [loaded, setLoaded] = useState(false);
  const t = today0();
  const [year, setYear] = useState(t.getFullYear());
  const [month, setMonth] = useState(t.getMonth());
  const [active, setActive] = useState('all');
  const [logDay, setLogDay] = useState(t.getDate());

  const [addingHabit, setAddingHabit] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [hName, setHName] = useState('');
  const [hEmoji, setHEmoji] = useState(EMOJIS[0]);
  const [hProject, setHProject] = useState(null);
  const [projModal, setProjModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pName, setPName] = useState('');
  const [pEmoji, setPEmoji] = useState('🌱');
  const [pColor, setPColor] = useState(PROJECT_COLORS[0]);
  const [pHorizon, setPHorizon] = useState('장기');
  const fileInputRef = useRef(null);
  const [dialog, setDialog] = useState(null); // 커스텀 확인/알림 모달 (네이티브 confirm/alert가 Electron 입력 포커스를 깨뜨리는 문제 회피)
  const [theme, setTheme] = useState('green');
  const [themeModal, setThemeModal] = useState(false);
  const [updMsg, setUpdMsg] = useState('');      // 업데이트 확인 상태 텍스트
  const [updBusy, setUpdBusy] = useState(false); // 확인/다운로드 중
  const updUserRef = useRef(false);              // 사용자가 직접 '확인'을 눌렀는지(자동 백그라운드 체크는 조용히)
  const canUpdate = typeof window !== 'undefined' && !!window.habitUpdater; // 데스크탑(Electron)에서만 버튼 노출
  const th = THEMES[theme] || THEMES.green;
  const pageStyle = { '--green': th.primary, '--green2': th.primary2, '--lime': th.accent, '--lime2': th.accent2, '--page': th.page, '--wknd': th.wknd, '--todaycol': th.today };

  // Desktop app: data lives in a real file (window.habitStore via Electron),
  // which survives browser/cookie clearing. Falls back to localStorage on the web.
  useEffect(() => {
    let dead = false;
    (async () => {
      let d = null;
      try {
        if (window.habitStore) d = await window.habitStore.load();
        else { const v = localStorage.getItem(STORAGE_KEY); d = v ? JSON.parse(v) : null; }
      } catch (e) { d = null; }
      if (dead) return;
      if (d && Array.isArray(d.habits) && Array.isArray(d.projects)) {
        setProjects(d.projects); setHabits(d.habits); setCompletions(d.completions || {}); setWellness(d.wellness || {});
        if (d.theme && THEMES[d.theme]) setTheme(d.theme);
      } else { const s = seedData(); setProjects(s.projects); setHabits(s.habits); setCompletions(s.completions); setWellness(s.wellness); }
      setLoaded(true);
    })();
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const data = { projects, habits, completions, wellness, theme };
    try {
      if (window.habitStore) window.habitStore.save(data);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }, [projects, habits, completions, wellness, theme, loaded]);

  // ESC 로 열려 있는 모달 닫기
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setAddingHabit(false); setEditingHabitId(null); setProjModal(false); setDialog(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 업데이트 상태를 메인 프로세스에서 받아 헤더 버튼에 표시.
  // checking/latest/error 는 사용자가 직접 누른 경우에만 표시(자동 백그라운드 확인은 조용히),
  // available/downloading/downloaded 는 실제 업데이트 진행이라 항상 표시.
  useEffect(() => {
    if (!window.habitUpdater || !window.habitUpdater.onStatus) return;
    return window.habitUpdater.onStatus((s) => {
      if (s.state === 'checking') { if (updUserRef.current) { setUpdBusy(true); setUpdMsg('확인 중…'); } }
      else if (s.state === 'available') { setUpdBusy(true); setUpdMsg(`새 버전 v${s.version || ''} 받는 중…`); }
      else if (s.state === 'downloading') { setUpdBusy(true); setUpdMsg(`받는 중 ${s.percent ?? 0}%`); }
      else if (s.state === 'downloaded') { setUpdBusy(false); setUpdMsg('재시작하면 적용돼요 ✓'); updUserRef.current = false; }
      else if (s.state === 'latest') { if (updUserRef.current) { setUpdBusy(false); setUpdMsg('이미 최신 버전이에요 ✓'); } updUserRef.current = false; }
      else if (s.state === 'error') { if (updUserRef.current) { setUpdBusy(false); setUpdMsg('확인 실패 — 잠시 후 다시'); } updUserRef.current = false; }
    });
  }, []);

  // 안내 문구(최신/실패)는 잠시 후 자동으로 지워 버튼을 기본 상태로 되돌림
  useEffect(() => {
    if (!updMsg || updBusy || updMsg.indexOf('재시작') >= 0) return;
    const id = setTimeout(() => setUpdMsg(''), 4000);
    return () => clearTimeout(id);
  }, [updMsg, updBusy]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1, wd = new Date(year, month, d).getDay();
    return { d, wd, key: keyOf(year, month, d), weekend: wd === 0 || wd === 6, isToday: year === t.getFullYear() && month === t.getMonth() && d === t.getDate(), future: new Date(year, month, d) > t };
  }), [year, month, daysInMonth]);

  const getProject = (id) => projects.find((p) => p.id === id);
  const habitColor = (h) => { const p = getProject(h.projectId); return p ? p.color : '#9aa49c'; };
  const sortedProjects = projects; // 사용자가 정한 순서(배열 순서) 그대로 — ◀▶ 로 재정렬

  const statsFor = (list) => {
    const goal = list.length * daysInMonth;
    const completed = list.reduce((a, h) => a + days.filter((d) => isDone(completions, h.id, d.key)).length, 0);
    return { goal, completed, left: Math.max(0, goal - completed), pct: goal ? Math.round((completed / goal) * 100) : 0 };
  };

  // 오늘(또는 어제)부터 거슬러 올라가며 연속으로 체크한 날 수. 오늘 아직 체크 안 했으면 어제부터 계산.
  const streakOf = (id) => {
    const c = today0();
    const done = () => isDone(completions, id, keyOf(c.getFullYear(), c.getMonth(), c.getDate()));
    if (!done()) c.setDate(c.getDate() - 1);
    let n = 0;
    while (done()) { n++; c.setDate(c.getDate() - 1); }
    return n;
  };

  const visibleHabits = active === 'all' ? habits : habits.filter((h) => h.projectId === active);
  const stats = statsFor(visibleHabits);
  const activeColor = active === 'all' ? th.primary : (getProject(active)?.color || th.primary);

  const dailyData = useMemo(() => {
    const hc = visibleHabits.length;
    return days.map((d) => {
      const done = visibleHabits.filter((h) => isDone(completions, h.id, d.key)).length;
      return { label: String(d.d), v: hc ? Math.round((done / hc) * 100) : 0 };
    });
  }, [days, visibleHabits, completions]);
  const weeklyData = useMemo(() => {
    const sums = [], cnts = []; let wi = 0;
    days.forEach((d, idx) => { if (idx > 0 && d.wd === 1) wi++; if (sums[wi] === undefined) { sums[wi] = 0; cnts[wi] = 0; } sums[wi] += visibleHabits.filter((h) => isDone(completions, h.id, d.key)).length; cnts[wi] += 1; });
    const hc = visibleHabits.length;
    return sums.map((s, i) => ({ label: `${i + 1}주`, v: hc ? Math.round((s / (hc * cnts[i])) * 100) : 0 }));
  }, [days, visibleHabits, completions]);
  const analysis = useMemo(() => visibleHabits.map((h) => {
    const actual = days.filter((d) => isDone(completions, h.id, d.key)).length;
    return { ...h, actual, streak: streakOf(h.id), pct: daysInMonth ? Math.round((actual / daysInMonth) * 100) : 0, color: habitColor(h) };
  }), [visibleHabits, completions, days, daysInMonth, projects]);
  const ranked = useMemo(() => [...analysis].sort((a, b) => b.pct - a.pct || b.actual - a.actual).slice(0, 10), [analysis]);

  const wellData = useMemo(() => days.map((d) => { const w = wellness[d.key] || {}; return { label: String(d.d), mood: w.mood ?? null, sleep: w.sleep ?? null }; }), [days, wellness]);
  const donutData = [{ name: '완료', value: stats.completed }, { name: '남음', value: stats.goal === 0 ? 1 : stats.left }];

  const groups = useMemo(() => {
    if (active !== 'all') return [{ project: getProject(active), habits: visibleHabits }];
    const g = sortedProjects.map((p) => ({ project: p, habits: habits.filter((h) => h.projectId === p.id) }));
    const orphans = habits.filter((h) => !projects.some((p) => p.id === h.projectId));
    if (orphans.length) g.push({ project: null, habits: orphans });
    return g.filter((x) => x.habits.length > 0);
  }, [active, sortedProjects, habits, projects]);

  const toggle = (id, k, future) => { if (future) return; setCompletions((p) => { const h = { ...(p[id] || {}) }; if (h[k]) delete h[k]; else h[k] = true; return { ...p, [id]: h }; }); };
  const openAddHabit = () => { setEditingHabitId(null); setHName(''); setHEmoji(EMOJIS[0]); setHProject(active !== 'all' ? active : (sortedProjects[0]?.id || null)); setAddingHabit(true); };
  const openEditHabit = (h) => { setEditingHabitId(h.id); setHName(h.name); setHEmoji(h.emoji); setHProject(h.projectId || null); setAddingHabit(true); };
  const saveHabit = () => {
    if (!hName.trim()) return;
    if (editingHabitId) setHabits((p) => p.map((h) => h.id === editingHabitId ? { ...h, name: hName.trim(), emoji: hEmoji, projectId: hProject } : h));
    else { if (!hProject) return; setHabits((p) => [...p, { id: uid('h'), name: hName.trim(), emoji: hEmoji, projectId: hProject }]); }
    setAddingHabit(false); setEditingHabitId(null);
  };
  const delHabit = (id) => {
    const h = habits.find((x) => x.id === id);
    askConfirm(`“${h ? h.name : '이 습관'}”을(를) 삭제할까요? 체크 기록도 함께 지워지고 되돌릴 수 없어요.`, () => {
      setHabits((p) => p.filter((x) => x.id !== id));
      setCompletions((p) => { const c = { ...p }; delete c[id]; return c; });
    });
  };
  // 같은 계획 안에서 습관 순서를 위/아래로 이동 (dir: -1 위, +1 아래)
  const moveHabit = (id, dir) => setHabits((hs) => {
    const idx = hs.findIndex((h) => h.id === id);
    if (idx < 0) return hs;
    const pid = hs[idx].projectId;
    let j = idx + dir;
    while (j >= 0 && j < hs.length && hs[j].projectId !== pid) j += dir;
    if (j < 0 || j >= hs.length) return hs;
    const next = [...hs];
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });
  // 계획(프로젝트) 순서를 앞/뒤로 이동 (dir: -1 앞, +1 뒤)
  const moveProject = (id, dir) => setProjects((ps) => {
    const i = ps.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ps.length) return ps;
    const next = [...ps];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const openAddProject = () => { setEditId(null); setPName(''); setPEmoji('🌱'); setPColor(PROJECT_COLORS[projects.length % PROJECT_COLORS.length]); setPHorizon('장기'); setProjModal(true); };
  const openEditProject = (p) => { setEditId(p.id); setPName(p.name); setPEmoji(p.emoji); setPColor(p.color); setPHorizon(p.horizon); setProjModal(true); };
  const saveProject = () => {
    if (!pName.trim()) return;
    if (editId) setProjects((ps) => ps.map((p) => p.id === editId ? { ...p, name: pName.trim(), emoji: pEmoji, color: pColor, horizon: pHorizon } : p));
    else setProjects((ps) => [...ps, { id: uid('p'), name: pName.trim(), emoji: pEmoji, color: pColor, horizon: pHorizon }]);
    setProjModal(false);
  };
  // Electron에선 네이티브 confirm/alert가 이후 입력 포커스를 깨뜨려서(초기화·삭제 뒤 입력 안 되는 버그) 커스텀 모달로 대체.
  const askConfirm = (message, onConfirm, confirmLabel = '삭제') => setDialog({ message, onConfirm, confirmLabel });
  const showAlert = (message) => setDialog({ message, alert: true });

  // 헤더의 '업데이트 확인' 버튼 → 메인 프로세스에 즉시 확인 요청. 결과는 onStatus 이벤트가 이어받음.
  const checkUpdate = async () => {
    if (!window.habitUpdater || updBusy) return;
    updUserRef.current = true;
    setUpdBusy(true); setUpdMsg('확인 중…');
    try {
      const r = await window.habitUpdater.check();
      if (r && r.mac) { updUserRef.current = false; setUpdBusy(false); setUpdMsg(''); showAlert('맥은 자동 업데이트가 지원되지 않아요. 릴리스 페이지에서 최신 .dmg를 받아 설치해 주세요.'); }
      else if (r && r.ok === false) { updUserRef.current = false; setUpdBusy(false); setUpdMsg('확인 실패 — 잠시 후 다시'); }
      // ok=true 인 경우는 onStatus 이벤트(checking→latest/available…)가 메시지를 이어받음
    } catch (e) { updUserRef.current = false; setUpdBusy(false); setUpdMsg('확인 실패 — 잠시 후 다시'); }
  };
  const delProject = (id) => askConfirm('이 계획을 삭제할까요? 포함된 습관은 “미분류”로 이동돼요.', () => {
    setProjects((ps) => ps.filter((p) => p.id !== id));
    setHabits((hs) => hs.map((h) => h.projectId === id ? { ...h, projectId: null } : h));
    if (active === id) setActive('all');
  });
  const reset = () => askConfirm('모든 계획·습관·기록을 삭제할까요? 되돌릴 수 없어요.', () => { setProjects([]); setHabits([]); setCompletions({}); setWellness({}); setActive('all'); });

  const exportData = () => {
    const data = { version: 1, exportedAt: new Date().toISOString(), projects, habits, completions, wellness, theme };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-game-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (!Array.isArray(d.habits) || !Array.isArray(d.projects)) { showAlert('올바른 백업 파일이 아니에요.'); return; }
        askConfirm('지금 기록을 이 백업 파일 내용으로 덮어쓸까요? 되돌릴 수 없어요.', () => {
          setProjects(d.projects); setHabits(d.habits); setCompletions(d.completions || {}); setWellness(d.wellness || {}); if (d.theme && THEMES[d.theme]) setTheme(d.theme); setActive('all');
        }, '덮어쓰기');
      } catch (err) { showAlert('파일을 읽을 수 없어요.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const logKey = keyOf(year, month, Math.min(logDay, daysInMonth));
  const curLog = wellness[logKey] || {};
  const setMood = (v) => setWellness((p) => ({ ...p, [logKey]: { ...p[logKey], mood: v } }));
  const setSleep = (delta) => setWellness((p) => { const cur = (p[logKey] && p[logKey].sleep) ?? 7; const v = Math.max(0, Math.min(14, +(cur + delta).toFixed(1))); return { ...p, [logKey]: { ...p[logKey], sleep: v } }; });
  const MOODS = ['😞', '😕', '🙂', '😀', '🤩'];
  const dayCol = `198px repeat(${daysInMonth}, 30px)`;
  // B(하단 탭) = 연도 선택. 올해 기준 범위에 현재 선택 연도를 항상 포함.
  const years = (() => {
    const base = t.getFullYear();
    const s = new Set([year]);
    for (let yy = base - 4; yy <= base + 1; yy++) s.add(yy);
    return [...s].sort((a, b) => a - b);
  })();

  const navStyle = (color, on) => ({
    borderTop: on ? `1.5px solid ${color}` : '1px solid var(--line)',
    borderRight: on ? `1.5px solid ${color}` : '1px solid var(--line)',
    borderBottom: on ? `1.5px solid ${color}` : '1px solid var(--line)',
    borderLeft: `5px solid ${color}`,
    background: on ? color + '0d' : '#fff',
  });

  const habitRow = (h, color) => {
    const c = color || habitColor(h);
    const siblings = habits.filter((x) => x.projectId === h.projectId);
    const si = siblings.findIndex((x) => x.id === h.id);
    return (
      <div key={h.id} className="hg-grid-row" style={{ gridTemplateColumns: dayCol }}>
        <div className="hg-gr-name" style={{ borderLeft: `4px solid ${c}` }}>
          <span className="hg-gr-em">{h.emoji}</span>
          <span className="hg-gr-nm hg-clickable" onClick={() => openEditHabit(h)} title="이름·아이콘·계획 편집">{h.name}</span>
          <span className="hg-gr-acts">
            <button className="hg-gr-actbtn" onClick={() => moveHabit(h.id, -1)} disabled={si <= 0} aria-label="위로 이동"><ChevronUp size={14} /></button>
            <button className="hg-gr-actbtn" onClick={() => moveHabit(h.id, 1)} disabled={si >= siblings.length - 1} aria-label="아래로 이동"><ChevronDown size={14} /></button>
            <button className="hg-gr-actbtn edit" onClick={() => openEditHabit(h)} aria-label="편집"><Pencil size={14} /></button>
            <button className="hg-gr-actbtn del" onClick={() => delHabit(h.id)} aria-label="삭제"><Trash2 size={14} /></button>
          </span>
        </div>
        {days.map((d) => {
          const on = isDone(completions, h.id, d.key);
          return (
            <div key={d.d} className={`hg-cellwrap ${d.weekend ? 'wknd' : ''} ${d.isToday ? 'today' : ''}`}>
              <button className={`hg-cell ${on ? 'on' : ''}`} disabled={d.future} onClick={() => toggle(h.id, d.key, d.future)} aria-label={`${h.name} ${d.key}`}>
                {on && <Check size={15} strokeWidth={3.4} color="#fff" />}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="hg-page" style={pageStyle}>
      <style>{CSS}</style>
      <div className="hg-wrap">
        <div className="hg-top">
          <div className="hg-brand">
            <div className="hg-logo"><Crown size={26} color={th.accent} fill={th.accent} /></div>
            <div className="hg-bname">HABIT GAME<small>PLAN-BASED HABIT TRACKER · v{pkg.version}
              {canUpdate && (
                <button className="hg-upd-btn" onClick={checkUpdate} disabled={updBusy} title="새 버전이 있는지 지금 확인">
                  <RefreshCw size={12} className={updBusy ? 'hg-spin' : ''} />{updMsg || '업데이트 확인'}
                </button>
              )}
            </small></div>
          </div>
          <div className="hg-topctl">
            <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={importData} />
            <button className="hg-btn ghost" onClick={() => fileInputRef.current && fileInputRef.current.click()} title="백업 파일 불러오기"><Download size={16} />가져오기</button>
            <button className="hg-btn ghost" onClick={exportData} title="기록을 파일로 저장"><Upload size={16} />내보내기</button>
            <button className="hg-btn ghost" onClick={() => setThemeModal(true)} title="색상 테마"><Palette size={16} />테마</button>
            <button className="hg-btn ghost" onClick={reset}><RotateCcw size={16} />초기화</button>
            <button className="hg-btn primary" onClick={openAddHabit}><Plus size={18} />습관 추가</button>
          </div>
        </div>

        <div className="hg-nav">
          <button className="hg-navcard" style={navStyle(th.primary, active === 'all')} onClick={() => setActive('all')}>
            <div className="hg-nc-top"><span className="hg-nc-em">📊</span><span className="hg-nc-nm">전체</span></div>
            <div className="hg-nc-meta"><span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>모든 계획</span><span className="hg-nc-pct" style={{ color: th.primary }}>{statsFor(habits).pct}%</span></div>
            <div className="hg-nc-bar"><div className="hg-nc-fill" style={{ width: `${statsFor(habits).pct}%`, background: th.primary }} /></div>
            <div className="hg-nc-cnt">{habits.length}개 습관 · {projects.length}개 계획</div>
          </button>

          {sortedProjects.map((p, idx) => {
            const ps = statsFor(habits.filter((h) => h.projectId === p.id));
            const cnt = habits.filter((h) => h.projectId === p.id).length;
            return (
              <div key={p.id} className="hg-navcard" style={navStyle(p.color, active === p.id)} onClick={() => setActive(p.id)} role="button">
                <div className="hg-nc-actions">
                  {idx > 0 && <span className="hg-nc-act" onClick={(e) => { e.stopPropagation(); moveProject(p.id, -1); }} title="앞으로 이동"><ChevronLeft size={13} /></span>}
                  {idx < sortedProjects.length - 1 && <span className="hg-nc-act" onClick={(e) => { e.stopPropagation(); moveProject(p.id, 1); }} title="뒤로 이동"><ChevronRight size={13} /></span>}
                  <span className="hg-nc-act" onClick={(e) => { e.stopPropagation(); openEditProject(p); }}><Pencil size={13} /></span>
                  <span className="hg-nc-act" onClick={(e) => { e.stopPropagation(); delProject(p.id); }}><Trash2 size={13} /></span>
                </div>
                <div className="hg-nc-top"><span className="hg-nc-em">{p.emoji}</span><span className="hg-nc-nm">{p.name}</span></div>
                <div className="hg-nc-meta"><span className="hg-nc-badge" style={{ background: p.color + '1e', color: p.color }}>{p.horizon}</span><span className="hg-nc-pct" style={{ color: p.color }}>{ps.pct}%</span></div>
                <div className="hg-nc-bar"><div className="hg-nc-fill" style={{ width: `${ps.pct}%`, background: p.color }} /></div>
                <div className="hg-nc-cnt">{cnt}개 습관</div>
              </div>
            );
          })}
          <button className="hg-navadd" onClick={openAddProject}><Plus size={17} />계획</button>
        </div>

        <div className="hg-row">
          <div className="hg-set" style={{ background: th.primary }}>
            <div>
              <div className="hg-set-t">{active === 'all' ? 'ALL PLANS' : getProject(active)?.horizon + ' 계획'}</div>
              <div className="hg-set-m">{MONTHS[month]}</div>
              <div className="hg-set-y">{year}년 · {active === 'all' ? '전체' : getProject(active)?.name} · {visibleHabits.length}개</div>
            </div>
            <div className="hg-ystep">
              <button onClick={() => setMonth((m) => Math.max(0, m - 1))} disabled={month === 0} aria-label="이전 달"><ChevronLeft size={18} /></button>
              <span className="v">{MONTHS[month]}</span>
              <button onClick={() => setMonth((m) => Math.min(11, m + 1))} disabled={month === 11} aria-label="다음 달"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="hg-card hg-chart">
            <div className="hg-head">Daily Progress <span className="hg-hsub">일별 달성률</span></div>
            <div className="hg-body" style={{ height: 158, padding: '12px 8px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 16, right: 2, left: 2, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: '#6b766d', fontSize: 11 }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip cursor={{ fill: 'rgba(22,58,48,.06)' }} content={<ChartTip suffix="%" />} />
                  <Bar dataKey="v" fill={activeColor} radius={[3, 3, 0, 0]} maxBarSize={13} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="hg-card hg-chart" style={{ flex: '0 0 210px', minWidth: 190 }}>
            <div className="hg-head">Weekly <span className="hg-hsub">주별 달성률</span></div>
            <div className="hg-body" style={{ height: 158, padding: '12px 8px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 16, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: '#6b766d', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip cursor={{ fill: 'rgba(22,58,48,.06)' }} content={<ChartTip suffix="%" />} />
                  <Bar dataKey="v" fill={activeColor} radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="v" position="top" formatter={(v) => (v > 0 ? v + '%' : '')} fontSize={11} fill="#586259" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="hg-card hg-statcol">
            <div className="hg-head">Overall Stats</div>
            <div className="hg-tiles">
              <div className="hg-tile"><div className="l">Goal</div><div className="v">{stats.goal}</div></div>
              <div className="hg-tile"><div className="l">Done</div><div className="v">{stats.completed}</div></div>
              <div className="hg-tile"><div className="l">Left</div><div className="v">{stats.left}</div></div>
            </div>
            <div className="hg-donut-wrap">
              <ResponsiveContainer width={158} height={138}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={44} outerRadius={61} startAngle={90} endAngle={-270} stroke="none">
                    <Cell fill={activeColor} /><Cell fill="#e3e6dd" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="hg-donut-c"><span className="p" style={{ color: activeColor }}>{stats.pct}%</span><span className="l">달성률</span></div>
            </div>
          </div>
        </div>

        <div className="hg-row">
          <div className="hg-card hg-gridcard">
            <div className="hg-head">My Habits <span className="hg-hsub">{active === 'all' ? '계획별 보기' : getProject(active)?.name} · 이름 클릭 시 편집</span></div>
            <div className="hg-scroll">
              {visibleHabits.length === 0 ? (
                <div style={{ padding: 44, textAlign: 'center', color: 'var(--muted)', fontWeight: 600, fontSize: 15 }}>
                  습관이 없어요. 오른쪽 위 “습관 추가”로 시작하세요.
                </div>
              ) : (
                <div style={{ minWidth: 198 + daysInMonth * 30 }}>
                  <div className="hg-grid-head" style={{ gridTemplateColumns: dayCol }}>
                    <div className="hg-gh-corner">습관</div>
                    {days.map((d) => (
                      <div key={d.d} className={`hg-gh-day ${d.weekend ? 'wknd' : ''} ${d.isToday ? 'today' : ''}`}>
                        <span className="hg-gh-wd">{KWD[d.wd]}</span><span className="hg-gh-dn">{d.d}</span>
                      </div>
                    ))}
                  </div>
                  {groups.map((g) => {
                    const col = g.project ? g.project.color : '#9aa49c';
                    const gs = statsFor(g.habits);
                    return (
                      <React.Fragment key={g.project ? g.project.id : 'none'}>
                        {active === 'all' && (
                          <div className="hg-grp-head" style={{ gridTemplateColumns: dayCol, background: col + '0c' }}>
                            <div className="hg-grp-name" style={{ borderLeft: `5px solid ${col}` }}>
                              <span className="hg-grp-em">{g.project ? g.project.emoji : '📁'}</span>
                              <span className="hg-grp-nm">{g.project ? g.project.name : '미분류'}</span>
                            </div>
                            <div className="hg-grp-meta">
                              <div className="hg-grp-fill" style={{ width: `${gs.pct}%`, background: col }} />
                              <div className="hg-grp-label" style={{ left: `min(${gs.pct}%, calc(100% - 96px))` }}>
                                {g.project && <span className="hg-grp-badge" style={{ background: col + '1e', color: col }}>{g.project.horizon}</span>}
                                <span className="hg-grp-pct" style={{ color: col }}>{gs.pct}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {g.habits.map((h) => habitRow(h, col))}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="hg-card hg-anacol">
            <div className="hg-head">Analysis <span className="hg-hsub">습관별 달성</span></div>
            <div className="hg-body">
              {analysis.length === 0 ? <div style={{ color: 'var(--faint)', fontSize: 14, textAlign: 'center', padding: 22 }}>—</div> :
                analysis.map((a) => (
                  <div key={a.id} className="hg-ana-row">
                    <span className="hg-ana-dot" style={{ background: a.color }} />
                    <span className="hg-ana-em">{a.emoji}</span>
                    <span className="hg-ana-nm">{a.name}</span>
                    {a.streak >= 2 && <span className="hg-ana-streak" title={`${a.streak}일 연속 달성 중`}>🔥{a.streak}</span>}
                    <span className="hg-ana-bar"><span className="hg-ana-fill" style={{ width: `${a.pct}%`, background: a.color }} /></span>
                    <span className="hg-ana-pct">{a.pct}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="hg-row">
          <div className="hg-card hg-wellcard">
            <div className="hg-head">Overall Wellness <span className="hg-hsub">무드 · 수면</span></div>
            <div className="hg-body" style={{ height: 182, padding: '14px 8px 4px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wellData} margin={{ top: 6, right: 8, left: 2, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: '#6b766d', fontSize: 11 }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis yAxisId="s" domain={[0, 14]} hide /><YAxis yAxisId="m" domain={[0, 5]} hide />
                  <Tooltip content={<ChartTip />} />
                  <Line yAxisId="m" type="monotone" dataKey="mood" name="무드" stroke={th.accent} strokeWidth={3} dot={false} connectNulls />
                  <Line yAxisId="s" type="monotone" dataKey="sleep" name="수면" stroke={th.primary} strokeWidth={3} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="hg-welllog">
              <div className="hg-wl-grp">
                <span className="hg-wl-lab">기록일</span>
                <select className="hg-wl-sel" value={Math.min(logDay, daysInMonth)} onChange={(e) => setLogDay(+e.target.value)}>
                  {days.map((d) => <option key={d.d} value={d.d}>{month + 1}월 {d.d}일 ({KWD[d.wd]})</option>)}
                </select>
              </div>
              <div className="hg-wl-grp">
                <span className="hg-wl-lab"><Smile size={14} /> 무드</span>
                <div className="hg-mood">{MOODS.map((e, i) => (<button key={i} className={curLog.mood === i + 1 ? 'on' : ''} onClick={() => setMood(i + 1)}>{e}</button>))}</div>
              </div>
              <div className="hg-wl-grp">
                <span className="hg-wl-lab"><Moon size={14} /> 수면</span>
                <div className="hg-sleep"><button onClick={() => setSleep(-0.5)}>−</button><span className="v">{(curLog.sleep ?? 7)}h</span><button onClick={() => setSleep(0.5)}>+</button></div>
              </div>
            </div>
          </div>

          <div className="hg-card hg-topcol">
            <div className="hg-head">Top 10 Habits</div>
            <div className="hg-body">
              {ranked.length === 0 ? <div style={{ color: 'var(--faint)', fontSize: 14, textAlign: 'center', padding: 22 }}>—</div> :
                ranked.map((a, i) => (
                  <div key={a.id} className="hg-toprow">
                    <span className="hg-rank">{i + 1}</span>
                    <span className="hg-top-dot" style={{ background: a.color }} />
                    <span className="hg-gr-em" style={{ fontSize: 16 }}>{a.emoji}</span>
                    <span className="hg-top-nm">{a.name}</span>
                    <span className="hg-top-v" style={{ color: a.color }}>{a.pct}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="hg-tabs">
          {years.map((y) => (<button key={y} className={`hg-mtab ${year === y ? 'on' : ''}`} onClick={() => setYear(y)}>{y}년</button>))}
        </div>
      </div>

      {addingHabit && (
        <div className="hg-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) { setAddingHabit(false); setEditingHabitId(null); } }}>
          <div className="hg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hg-mh"><div className="hg-mt">{editingHabitId ? '습관 편집' : '새 습관 추가'}</div><button className="hg-mx" onClick={() => { setAddingHabit(false); setEditingHabitId(null); }}><X size={19} /></button></div>
            {!editingHabitId && sortedProjects.length === 0 ? (
              <div>
                <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600, marginBottom: 18, lineHeight: 1.55 }}>먼저 계획(프로젝트)을 하나 추가해야 해요. 습관은 계획 안에 들어갑니다.</div>
                <button className="hg-btn primary" style={{ width: '100%', justifyContent: 'center', padding: 15 }} onClick={() => { setAddingHabit(false); openAddProject(); }}><Plus size={18} />계획 먼저 만들기</button>
              </div>
            ) : (
              <>
                {sortedProjects.length > 0 && (
                  <>
                    <div className="hg-ml">어떤 계획에 속하나요?</div>
                    <div className="hg-projsel">
                      {sortedProjects.map((p) => (
                        <button key={p.id} className="hg-pchip" style={hProject === p.id ? { borderColor: p.color, background: p.color + '14' } : {}} onClick={() => setHProject(p.id)}>
                          <span className="dot" style={{ background: p.color }} /> {p.emoji} {p.name} <span className="bdg">{p.horizon}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="hg-ml">이름</div>
                <input className="hg-mi" value={hName} onChange={(e) => setHName(e.target.value)} placeholder="예: 아침 스트레칭" onKeyDown={(e) => e.key === 'Enter' && saveHabit()} maxLength={20} autoFocus />
                <div className="hg-ml">아이콘</div>
                <div className="hg-emg">{EMOJIS.map((e) => <button key={e} className={`hg-emc ${hEmoji === e ? 'on' : ''}`} onClick={() => setHEmoji(e)}>{e}</button>)}</div>
                <button className="hg-btn primary" style={{ width: '100%', justifyContent: 'center', padding: 15, fontSize: 16 }} onClick={saveHabit} disabled={!hName.trim() || (!editingHabitId && !hProject)}>{editingHabitId ? '저장하기' : <><Plus size={19} />추가하기</>}</button>
              </>
            )}
          </div>
        </div>
      )}

      {projModal && (
        <div className="hg-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) setProjModal(false); }}>
          <div className="hg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hg-mh"><div className="hg-mt">{editId ? '계획 편집' : '새 계획 추가'}</div><button className="hg-mx" onClick={() => setProjModal(false)}><X size={19} /></button></div>
            <div className="hg-ml">계획 이름</div>
            <input className="hg-mi" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="예: 올해 건강 만들기" onKeyDown={(e) => e.key === 'Enter' && saveProject()} maxLength={24} autoFocus />
            <div className="hg-ml">기간 · 규모</div>
            <div className="hg-seg">{HORIZONS.map((h) => <button key={h} className={pHorizon === h ? 'on' : ''} onClick={() => setPHorizon(h)}>{h}</button>)}</div>
            <div className="hg-ml">아이콘</div>
            <div className="hg-emg">{EMOJIS.map((e) => <button key={e} className={`hg-emc ${pEmoji === e ? 'on' : ''}`} onClick={() => setPEmoji(e)}>{e}</button>)}</div>
            <div className="hg-ml">색상</div>
            <div className="hg-colrow">{PROJECT_COLORS.map((c) => <button key={c} className={`hg-col ${pColor === c ? 'on' : ''}`} style={{ background: c, color: c }} onClick={() => setPColor(c)} />)}</div>
            <button className="hg-btn primary" style={{ width: '100%', justifyContent: 'center', padding: 15, fontSize: 16 }} onClick={saveProject} disabled={!pName.trim()}>{editId ? '저장하기' : <><Plus size={19} />계획 추가</>}</button>
          </div>
        </div>
      )}

      {dialog && (
        <div className="hg-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) setDialog(null); }}>
          <div className="hg-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="hg-mt" style={{ marginBottom: 14 }}>{dialog.alert ? '알림' : '확인'}</div>
            <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600, lineHeight: 1.6, marginBottom: 24, whiteSpace: 'pre-wrap' }}>{dialog.message}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {!dialog.alert && <button className="hg-btn ghost" style={{ flex: 1, justifyContent: 'center', padding: 13 }} onClick={() => setDialog(null)}>취소</button>}
              <button className="hg-btn primary" style={{ flex: 1, justifyContent: 'center', padding: 13 }} onClick={() => { const cb = dialog.onConfirm; setDialog(null); if (cb) cb(); }}>{dialog.alert ? '확인' : (dialog.confirmLabel || '확인')}</button>
            </div>
          </div>
        </div>
      )}

      {themeModal && (
        <div className="hg-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) setThemeModal(false); }}>
          <div className="hg-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="hg-mh"><div className="hg-mt">색상 테마</div><button className="hg-mx" onClick={() => setThemeModal(false)}><X size={19} /></button></div>
            <div className="hg-themegrid">
              {Object.entries(THEMES).map(([k, tm]) => (
                <button key={k} className={`hg-themecard ${theme === k ? 'on' : ''}`} onClick={() => { setTheme(k); setThemeModal(false); }}>
                  <span className="hg-themeswatch"><span style={{ background: tm.primary }} /><span style={{ background: tm.accent }} /></span>
                  <span className="hg-themename">{tm.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
