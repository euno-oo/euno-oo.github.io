import { getStorage } from '../core/storage.js';
import { openOverlayDialog, closeOverlayDialog } from '../utils/ui.js';

let streakCalMonth = new Date().getMonth();
let streakCalYear = new Date().getFullYear();

export function initStreakCalendar() {
  const btn = document.getElementById('streak-cal-btn');
  btn && btn.addEventListener('click', (e) => openStreakCalendar(e.currentTarget));

  const desktopBtn = document.getElementById('streak-cal-btn-desktop');
  desktopBtn && desktopBtn.addEventListener('click', (e) => openStreakCalendar(e.currentTarget));

  const closeBtn = document.getElementById('streak-cal-close');
  closeBtn && closeBtn.addEventListener('click', closeStreakCalendar);

  const scrim = document.getElementById('streak-cal-scrim');
  scrim && scrim.addEventListener('click', closeStreakCalendar);

  const prevBtn = document.getElementById('streak-cal-prev');
  prevBtn && prevBtn.addEventListener('click', () => {
    streakCalMonth--;
    if (streakCalMonth < 0) { streakCalMonth = 11; streakCalYear--; }
    renderStreakCalendar();
  });

  const nextBtn = document.getElementById('streak-cal-next');
  nextBtn && nextBtn.addEventListener('click', () => {
    streakCalMonth++;
    if (streakCalMonth > 11) { streakCalMonth = 0; streakCalYear++; }
    renderStreakCalendar();
  });
}

export function openStreakCalendar(triggerEl) {
  streakCalMonth = new Date().getMonth();
  streakCalYear = new Date().getFullYear();
  const dialog = document.getElementById('streak-calendar-dialog');
  if (!dialog) return;
  openOverlayDialog(dialog, triggerEl);
  renderStreakCalendar();
}

export function closeStreakCalendar() {
  const dialog = document.getElementById('streak-calendar-dialog');
  closeOverlayDialog(dialog);
}

function renderStreakCalendar() {
  const checkins = getStorage('checkins', []);
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...checkins].map(c => c.date).sort().reverse();
  
  // Calculate current streak
  let current = 0;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (sorted.length > 0 && (sorted[0] === today || sorted[0] === yesterday)) {
    current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i-1]);
      const cur = new Date(sorted[i]);
      const diff = (prev - cur) / (1000 * 60 * 60 * 24);
      if (diff === 1) current++;
      else break;
    }
  }
  
  // Calculate longest streak
  let longest = 0;
  let streak = 0;
  let prevDate = null;
  for (const date of sorted) {
    if (prevDate === null) {
      streak = 1;
    } else {
      const prev = new Date(prevDate);
      const cur = new Date(date);
      const diff = (prev - cur) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else streak = 1;
    }
    prevDate = date;
    longest = Math.max(longest, streak);
  }
  
  const checkDates = new Set(checkins.map(c => c.date));

  const curEl = document.getElementById('streak-cal-current');
  if (curEl) curEl.textContent = current;
  const longestEl = document.getElementById('streak-cal-longest');
  if (longestEl) longestEl.textContent = longest;

  const monthLabel = document.getElementById('streak-cal-month-label');
  const monthName = new Date(streakCalYear, streakCalMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  if (monthLabel) monthLabel.textContent = monthName;

  const daysEl = document.getElementById('streak-cal-days');
  if (!daysEl) return;


  const firstDay = new Date(streakCalYear, streakCalMonth, 1).getDay();
  const daysInMonth = new Date(streakCalYear, streakCalMonth + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div class="streak-cal-day"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${streakCalYear}-${String(streakCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = ds === today;
    const isChecked = checkDates.has(ds);
    const isFuture = ds > today;
    let cls = 'streak-cal-day';
    if (isChecked) cls += ' checked';
    if (isToday) cls += ' today';
    if (isFuture) cls += ' future';
    const title = isChecked ? 'Checked in' : '';
    html += `<div class="${cls}" title="${title}">${d}</div>`;
  }
  daysEl.innerHTML = html;
}
