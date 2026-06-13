import { getStorage, setStorage } from '../core/storage.js';
import { todayStr, formatDateDisplay } from '../utils/dateUtils.js';
import { showToast } from '../utils/notifications.js';
import { sanitize, sanitizeNum } from '../utils/helpers.js';
import { WELLNESS_LEVEL_LABELS } from '../core/constants.js';
import { updateHomeDashboard } from './home.js';
import { addCoins } from '../shop/shop.js';
import { renderInsights } from '../insights/insights.js';
import {
  calculateScores,
  detectChallenges,
  getSeverity,
  DIMENSION_META,
  EMOTION_OPTIONS
} from './checkinScoring.js';
import { renderWellnessDot } from '../utils/ui.js';

const GRAD_FIELDS = ['stress_level', 'worry_level', 'thought_loop_level', 'energy_level', 'social_connection_level'];
const MAX_EMOTIONS = 3;

export function initCheckin() {
  const state = {
    moods: [],
    stress_level: 0,
    worry_level: 0,
    thought_loop_level: 0,
    energy_level: 0,
    social_connection_level: 0
  };

  const emotionGrid = document.getElementById('emotion-chip-grid');
  const emotionHint = document.getElementById('emotion-hint');
  const preview = document.getElementById('challenge-preview');
  const dimensionsEl = document.getElementById('challenge-dimensions');
  const alertsEl = document.getElementById('challenge-alerts');
  const saveBtn = document.getElementById('save-checkin');

  function updateEmotionHint() {
    if (!emotionHint) return;
    const count = state.moods.length;
    if (!count) emotionHint.textContent = 'Select 1 to 3 emotions';
    else if (count < MAX_EMOTIONS) emotionHint.textContent = `${count} selected — up to ${MAX_EMOTIONS} allowed`;
    else emotionHint.textContent = `${MAX_EMOTIONS} emotions selected`;
  }

  function isFormComplete() {
    return state.moods.length >= 1
      && state.stress_level >= 1
      && state.worry_level >= 1
      && state.thought_loop_level >= 1
      && state.energy_level >= 1
      && state.social_connection_level >= 1;
  }

  function updatePreview() {
    if (!preview || !dimensionsEl || !alertsEl) return;
    if (!isFormComplete()) {
      preview.style.display = 'none';
      return;
    }
    const scores = calculateScores(state);
    const challenges = detectChallenges(scores);
    preview.style.display = '';

    const dims = ['stress', 'anxiety', 'burnout', 'overthinking', 'loneliness'];
    dimensionsEl.innerHTML = dims.map(dim => {
      const key = dim + '_score';
      const score = scores[key];
      const severity = getSeverity(score, dim);
      const meta = DIMENSION_META[dim];
      const sevClass = severity.toLowerCase();
      return `<div class="challenge-dim-row">
        <span class="material-icons-round challenge-dim-icon" aria-hidden="true">${meta.icon}</span>
        <span class="challenge-dim-label">${meta.label}</span>
        <span class="challenge-dim-score">${score}</span>
        <span class="challenge-dim-severity challenge-dim-severity--${sevClass}">${severity}</span>
      </div>`;
    }).join('');

    if (!challenges.length) {
      alertsEl.innerHTML = `<div class="challenge-alert challenge-alert--ok"><span class="material-icons-round" aria-hidden="true">check_circle</span>No significant challenges detected today.</div>`;
    } else {
      alertsEl.innerHTML = challenges.map(c => {
        const meta = DIMENSION_META[c];
        return `<div class="challenge-alert challenge-alert--warn"><span class="material-icons-round" aria-hidden="true">info</span>${meta.label} challenge detected — consider using wellness tools.</div>`;
      }).join('');
    }
  }

  emotionGrid && emotionGrid.querySelectorAll('[data-emotion]').forEach(btn => {
    btn.addEventListener('click', () => {
      const emotion = btn.dataset.emotion;
      const idx = state.moods.indexOf(emotion);
      if (idx >= 0) {
        state.moods.splice(idx, 1);
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        if (state.moods.length >= MAX_EMOTIONS) {
          showToast(`You can select up to ${MAX_EMOTIONS} emotions.`, 'error');
          return;
        }
        state.moods.push(emotion);
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
      updateEmotionHint();
      updatePreview();
    });
  });

  document.querySelectorAll('.grad-btn-group').forEach(group => {
    const field = group.dataset.field;
    if (!GRAD_FIELDS.includes(field)) return;

    function selectGradBtn(btn) {
      group.querySelectorAll('.grad-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      state[field] = parseInt(btn.dataset.value, 10);
      updatePreview();
    }

    group.querySelectorAll('.grad-btn').forEach(btn => {
      const lbl = btn.querySelector('.grad-btn-lbl');
      if (lbl) btn.setAttribute('aria-label', lbl.textContent.trim());

      btn.addEventListener('click', () => selectGradBtn(btn));
    });

    group.addEventListener('keydown', (e) => {
      const buttons = [...group.querySelectorAll('.grad-btn')];
      const idx = buttons.indexOf(document.activeElement);
      if (idx < 0) return;
      let next = idx;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(idx + 1, buttons.length - 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(idx - 1, 0);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = buttons.length - 1;
      else return;
      e.preventDefault();
      selectGradBtn(buttons[next]);
      buttons[next].focus();
    });
  });

  if (emotionGrid) {
    emotionGrid.addEventListener('keydown', (e) => {
      const buttons = [...emotionGrid.querySelectorAll('[data-emotion]')];
      const idx = buttons.indexOf(document.activeElement);
      if (idx < 0) return;
      let next = idx;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(idx + 1, buttons.length - 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(idx - 1, 0);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = buttons.length - 1;
      else return;
      e.preventDefault();
      buttons[next].focus();
    });
  }

  function applyCheckinLock() {
    const checkins = getStorage('checkins', []);
    const alreadyDone = checkins.some(c => c.date === todayStr());
    if (!saveBtn) return;

    const existingBanner = document.getElementById('checkin-done-banner');
    if (existingBanner) existingBanner.remove();

    if (alreadyDone) {
      saveBtn.disabled = true;
      saveBtn.setAttribute('aria-disabled', 'true');
      saveBtn.innerHTML = '<span class="material-icons-round" aria-hidden="true">check_circle</span>Already checked in today';

      const banner = document.createElement('div');
      banner.id = 'checkin-done-banner';
      banner.className = 'checkin-done-banner';
      banner.setAttribute('role', 'status');
      banner.innerHTML = `
        <span class="material-icons-round checkin-done-icon" aria-hidden="true">check_circle</span>
        <div>
          <strong>You've already checked in today!</strong>
          <p>Come back tomorrow to log your next check-in. Keep the streak going!</p>
        </div>`;
      saveBtn.parentNode.insertBefore(banner, saveBtn);
    } else {
      saveBtn.disabled = false;
      saveBtn.removeAttribute('aria-disabled');
      saveBtn.innerHTML = '<span class="material-icons-round" aria-hidden="true">save</span>Save Check-In';
    }
  }

  function resetForm() {
    state.moods = [];
    GRAD_FIELDS.forEach(f => { state[f] = 0; });
    emotionGrid && emotionGrid.querySelectorAll('[data-emotion]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    document.querySelectorAll('.grad-btn-group').forEach(group => {
      group.querySelectorAll('.grad-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
    });
    if (preview) preview.style.display = 'none';
    updateEmotionHint();
  }

  applyCheckinLock();

  saveBtn && saveBtn.addEventListener('click', () => {
    const checkins0 = getStorage('checkins', []);
    if (checkins0.some(c => c.date === todayStr())) {
      showToast('You\'ve already checked in today. Come back tomorrow!', 'error');
      return;
    }
    if (state.moods.length < 1) { showToast('Please select at least one emotion.', 'error'); return; }
    if (!state.stress_level) { showToast('Please answer the stress question.', 'error'); return; }
    if (!state.worry_level) { showToast('Please answer the worry question.', 'error'); return; }
    if (!state.thought_loop_level) { showToast('Please answer the thought loop question.', 'error'); return; }
    if (!state.energy_level) { showToast('Please answer the energy question.', 'error'); return; }
    if (!state.social_connection_level) { showToast('Please answer the social connection question.', 'error'); return; }

    const scores = calculateScores(state);
    const challenges = detectChallenges(scores);
    const entry = {
      date: todayStr(),
      moods: [...state.moods],
      stress_level: sanitizeNum(state.stress_level, 1, 5),
      worry_level: sanitizeNum(state.worry_level, 1, 5),
      thought_loop_level: sanitizeNum(state.thought_loop_level, 1, 5),
      energy_level: sanitizeNum(state.energy_level, 1, 5),
      social_connection_level: sanitizeNum(state.social_connection_level, 1, 5),
      scores,
      challenges,
      timestamp: Date.now()
    };

    const checkins = getStorage('checkins', []);
    checkins.push(entry);
    setStorage('checkins', checkins);
    addCoins(10, 'Daily Check-In');
    showToast('Check-in saved! Great job keeping your streak!', 'success');
    resetForm();
    renderCheckinHistory();
    updateHomeDashboard();
    renderInsights();
    applyCheckinLock();
  });

  renderCheckinHistory();
}

function renderCheckinHistory() {
  const el = document.getElementById('checkin-history');
  if (!el) return;
  const checkins = getStorage('checkins', []).slice(-10).reverse();
  if (!checkins.length) {
    el.innerHTML = '<p style="color:var(--md-on-surface-variant);font-size:0.875rem;">No check-ins yet. Start your first one above!</p>';
    return;
  }
  el.innerHTML = checkins.map(c => {
    const moods = c.moods || [];
    const moodTags = moods.map(m => {
      const opt = EMOTION_OPTIONS.find(e => e.id === m);
      const icon = opt ? opt.icon : 'mood';
      return `<span class="checkin-emotion-tag"><span class="material-icons-round" aria-hidden="true">${icon}</span>${sanitize(m)}</span>`;
    }).join('');
    const challengeCount = (c.challenges || []).length;
    const summary = challengeCount
      ? `${challengeCount} challenge${challengeCount > 1 ? 's' : ''} detected`
      : 'No challenges detected';
    return `<div class="checkin-item">
      <div class="checkin-emoji">${renderWellnessDot(c)}</div>
      <div class="checkin-info">
        <div class="checkin-date">${sanitize(formatDateDisplay(c.date))}</div>
        <div class="checkin-mood-tags">${moodTags}</div>
        <div class="checkin-summary">${sanitize(summary)}</div>
      </div>
    </div>`;
  }).join('');
}
