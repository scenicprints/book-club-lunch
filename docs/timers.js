// Kitchen timers. They live in their own strip (#timers); the tick only
// updates the numbers, so nothing under your finger gets rebuilt. End times
// are saved, so reloading the iPad doesn't lose a timer. A finished timer
// keeps ringing until it's tapped.
import { ring } from './bell.js?v=5';

const KEY = 'kitchen:timers';
const el = document.getElementById('timers');
let list = load();

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ } }

const left = (t) => Math.max(0, Math.ceil((t.end - Date.now()) / 1000));
export const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

el.innerHTML = `
  <div class="chips"></div>
  <label class="timer timer-add"><span>+ Timer</span><select data-preset aria-label="Start a timer"></select></label>`;
const chips = el.querySelector('.chips');
const picker = el.querySelector('[data-preset]');
let presets = [];

export function startTimer(label, seconds) {
  list = list.filter((t) => t.label !== label); // restarting replaces the old one
  list.push({ id: `${Date.now()}${Math.random()}`, label, end: Date.now() + seconds * 1000 });
  save();
  drawChips();
}

export function stopTimer(label) {
  list = list.filter((t) => t.label !== label);
  save();
  drawChips();
}

// [label, seconds] pairs offered under "+ Timer".
export function setPresets(p) {
  presets = p;
  picker.innerHTML = `<option value="">+ Timer</option>${
    p.map(([label, secs], i) => `<option value="${i}">${label} · ${fmt(secs)}</option>`).join('')}`;
}

function drawChips() {
  chips.innerHTML = list.map((t) => `
    <button class="timer" data-timer="${t.id}">
      <span>${t.label}</span><b></b><i aria-hidden="true"></i>
    </button>`).join('');
  tick();
}

function tick() {
  for (const b of chips.querySelectorAll('[data-timer]')) {
    const t = list.find((x) => x.id === b.dataset.timer);
    if (!t) continue;
    const s = left(t);
    b.classList.toggle('ringing', s === 0);
    b.querySelector('b').textContent = s ? fmt(s) : 'Done!';
    b.querySelector('i').textContent = s ? '✕' : '✓';
    b.setAttribute('aria-label', s ? `Cancel ${t.label} timer` : `Stop ${t.label} alarm`);
  }
  // Big countdowns elsewhere on the page: <b data-countdown="Label"></b>
  for (const n of document.querySelectorAll('[data-countdown]')) {
    const t = list.find((x) => x.label === n.dataset.countdown);
    n.textContent = t ? (left(t) ? fmt(left(t)) : 'Now!') : '';
    n.classList.toggle('now', !!t && !left(t));
  }
}
export { tick as paintCountdowns };

chips.addEventListener('click', (e) => {
  const b = e.target.closest('[data-timer]');
  if (!b) return;
  list = list.filter((t) => t.id !== b.dataset.timer);
  save();
  drawChips();
});
picker.addEventListener('change', () => {
  if (picker.value === '') return;
  const [label, secs] = presets[+picker.value];
  picker.value = '';
  startTimer(label, secs);
});

let lastRing = 0;
setInterval(() => {
  if (list.some((t) => !left(t)) && Date.now() - lastRing > 4000) { ring(); lastRing = Date.now(); }
  tick();
}, 500);

drawChips();
