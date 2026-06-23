import { getStorage } from '../core/storage.js';
import { greetingByTime, todayStr } from '../utils/dateUtils.js';
import { WELLNESS_LEVEL_LABELS } from '../core/constants.js';
import { renderWellnessDot } from '../utils/ui.js';
import { sanitize } from '../utils/helpers.js';
import { getCheckinScores, detectChallenges, getCheckinWellnessLevel } from './checkinScoring.js';
import { getCurrentWeekDates } from '../utils/dateUtils.js';

export function initHome() { updateHomeDashboard(); }

export function updateHomeDashboard() {
  const name = getStorage('profile_name','');
  const gender = getStorage('profile_gender','male');
  const greetEl = document.getElementById('greeting-name');
  const labelEl = document.getElementById('greeting-label-text');
  if (greetEl) {
    if (!name) {
      greetEl.style.display = 'none';
      if (labelEl) labelEl.classList.add('no-name');
    } else {
      greetEl.style.display = '';
      greetEl.textContent = name;
      if (labelEl) labelEl.classList.remove('no-name');
    }
  }
  if (labelEl) labelEl.textContent = greetingByTime();
  const mobileTimeEl = document.getElementById('mobile-greeting-time');
  if (mobileTimeEl) mobileTimeEl.textContent = greetingByTime();
  const mobileNameEl = document.getElementById('mobile-greeting-name');
  if (mobileNameEl) mobileNameEl.textContent = name || '';
  const mobileGreetingWrap = document.getElementById('mobile-home-greeting');
  if (mobileGreetingWrap) {
    if (!name) mobileGreetingWrap.classList.add('no-name');
    else mobileGreetingWrap.classList.remove('no-name');
  }
  const avatarIcon = document.getElementById('avatar-icon');
  if (avatarIcon) avatarIcon.textContent = gender === 'female' ? 'face_3' : 'face';
  const checkins = getStorage('checkins',[]);
  const today = todayStr();
  const todayCheckin = checkins.find(c => c.date === today);
  const streak = calcCheckinStreak(checkins);
  const streakEl = document.getElementById('home-streak');
  if (streakEl) streakEl.textContent = streak + (streak === 1 ? ' day' : ' days');

  const diarys = getStorage('diarys',{});
  const entriesEl = document.getElementById('home-entries');
  if (entriesEl) entriesEl.textContent = Object.keys(diarys).length;

  const themeUnlocked = getStorage('theme_unlocked', false);
  const goldenBadgeEl = document.getElementById('golden-badge');
  const goldenBadgeMobileEl = document.getElementById('golden-badge-mobile');
  if (goldenBadgeEl) goldenBadgeEl.style.display = themeUnlocked ? 'flex' : 'none';
  if (goldenBadgeMobileEl) goldenBadgeMobileEl.style.display = themeUnlocked ? 'flex' : 'none';

  const qaCheckinBtn = document.querySelector('.qa-card[data-page="checkin"] .qa-label');
  if (qaCheckinBtn) qaCheckinBtn.textContent = todayCheckin ? 'Done' : 'Log Mood';

  renderWeekMoodsHome(checkins);
  renderInsightTeaser(checkins);
}

export function calcCheckinStreak(checkins) {
  if (!checkins.length) return 0;
  const dates = [...new Set(checkins.map(c => c.date))].sort().reverse();
  let streak = 0, expected = todayStr();
  for (const d of dates) {
    if (d === expected) { streak++; const dt = new Date(d+'T12:00:00'); dt.setDate(dt.getDate()-1); expected = dt.toISOString().slice(0,10); } else break;
  }
  return streak;
}

function renderWeekMoodsHome(checkins) {
  const el = document.getElementById('week-moods-home');
  if (!el) return;
  const days = getCurrentWeekDates();
  el.innerHTML = days.map(date => {
    const c = checkins.find(x => x.date === date);
    const dt = new Date(date + 'T12:00:00');
    const label = dt.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
    const wellnessLabel = c ? (WELLNESS_LEVEL_LABELS[getCheckinWellnessLevel(c)] || 'Logged') : 'No check-in';
    const dayAria = `${dt.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}: ${wellnessLabel}`;
    return `<div class="week-mood-item" aria-label="${sanitize(dayAria)}">${renderWellnessDot(c || null)}<span class="mood-day">${sanitize(label)}</span></div>`;
  }).join('');
}

function renderInsightTeaser(checkins) {
  const el = document.getElementById('insight-teaser-content');
  if (!el) return;
  if (checkins.length < 3) {
    el.innerHTML = '<span class="material-icons-round insight-icon" aria-hidden="true">auto_graph</span><p class="insight-placeholder">Complete a few days of check-ins to see your wellness insights here.</p>';
    return;
  }
  const last7 = checkins.slice(-7);
  let totalBurden = 0, count = 0, challengeDays = 0, wellnessSum = 0;
  last7.forEach(c => {
    const scores = getCheckinScores(c);
    if (scores) {
      count++;
      wellnessSum += getCheckinWellnessLevel(c);
      if (detectChallenges(scores).length) challengeDays++;
    }
  });
  const avgLevel = count ? Math.round(wellnessSum / count) : 0;
  const avgLabel = WELLNESS_LEVEL_LABELS[avgLevel] || 'Moderate';
  el.innerHTML = `<span class="material-icons-round insight-icon" aria-hidden="true">auto_graph</span><p class="insight-teaser-text">Your average wellness this week is <strong class="insight-teaser-highlight">${sanitize(avgLabel)}</strong>. ${challengeDays} of the last 7 days had challenges detected.</p>`;
}
