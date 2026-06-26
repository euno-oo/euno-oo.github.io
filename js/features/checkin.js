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
import { refreshFromWellnessData } from '../pet/main.js';

const GRAD_FIELDS = ['stress_level', 'worry_level', 'thought_loop_level', 'energy_level', 'social_connection_level'];
const MAX_EMOTIONS = 3;

const CONDITION_INFO = {
  stress: {
    title: 'Stress',
    body: `<h3>What is Stress?</h3><p>Stress is the feeling of being under pressure or having more demands than you feel able to handle at the moment.</p><h3>Common Signs</h3><ul><li>Feeling overwhelmed</li><li>Difficulty relaxing</li><li>Irritability</li><li>Headaches or muscle tension</li><li>Trouble concentrating</li></ul><h3>Example</h3><p>You have several assignments due this week, a club meeting tomorrow, and an upcoming exam. You feel pressured and worried about finishing everything on time.</p>`
  },
  anxiety: {
    title: 'Anxiety',
    body: `<h3>What is Anxiety?</h3><p>Anxiety is excessive worry, nervousness, or fear about situations that may happen in the future, even when there is no immediate danger.</p><h3>Common Signs</h3><ul><li>Constant worrying</li><li>Feeling nervous</li><li>Racing thoughts</li><li>Difficulty sleeping</li><li>Feeling restless</li></ul><h3>Example</h3><p>An exam is next week. Even though you have prepared, you keep imagining failing and cannot stop worrying about what might happen.</p>`
  },
  burnout: {
    title: 'Burnout',
    body: `<h3>What is Burnout?</h3><p>Burnout is a state of emotional, mental, and physical exhaustion caused by prolonged stress and insufficient recovery or rest.</p><h3>Common Signs</h3><ul><li>Feeling exhausted most of the time</li><li>Lack of motivation</li><li>Reduced productivity</li><li>Feeling emotionally drained</li><li>Losing interest in activities you usually enjoy</li></ul><h3>Example</h3><p>You have been studying, attending activities, and working on projects every day for weeks. Even after resting, you feel tired and struggle to find motivation.</p>`
  },
  overthinking: {
    title: 'Overthinking',
    body: `<h3>What is Overthinking?</h3><p>Overthinking is repeatedly thinking about the same situation, problem, or decision without reaching a solution.</p><h3>Common Signs</h3><ul><li>Replaying conversations in your head</li><li>Difficulty making decisions</li><li>Analyzing every possibility</li><li>Trouble focusing on the present</li></ul><h3>Example</h3><p>After giving a class presentation, you spend hours thinking about every mistake you might have made and wondering what others thought of you.</p>`
  },
  loneliness: {
    title: 'Loneliness',
    body: `<h3>What is Loneliness?</h3><p>Loneliness is the feeling of being disconnected from others or lacking meaningful social connections. It can occur even when you are surrounded by people.</p><h3>Common Signs</h3><ul><li>Feeling isolated</li><li>Feeling left out</li><li>Feeling misunderstood</li><li>Wanting connection but not knowing how to reach out</li></ul><h3>Example</h3><p>You spend time at school with classmates every day, but you feel like nobody truly understands you or knows how you are feeling.</p>`
  }
};

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
      return `<div class="challenge-dim-row condition-capsule" data-condition="${dim}" style="cursor: pointer; position: relative;" tabindex="0" role="button" aria-label="Learn more about ${meta.label}">
        <span class="material-icons-round challenge-dim-icon" aria-hidden="true">${meta.icon}</span>
        <span class="challenge-dim-label">${meta.label}</span>
        <span class="challenge-dim-score">${score}</span>
        <span class="challenge-dim-severity challenge-dim-severity--${sevClass}">${severity}</span>
        <span class="material-icons-round" aria-hidden="true" style="font-size: 16px; margin-left: auto; color: var(--md-outline);">info</span>
      </div>`;
    }).join('');

    if (!challenges.length) {
      alertsEl.innerHTML = `<div class="challenge-alert challenge-alert--ok"><span class="material-icons-round" aria-hidden="true">check_circle</span>No significant challenges detected today.</div>`;
    } else {
      let html = challenges.map(c => {
        const meta = DIMENSION_META[c];
        return `<div class="challenge-alert challenge-alert--warn"><span class="material-icons-round" aria-hidden="true">info</span>${meta.label} challenge detected — consider using wellness tools.</div>`;
      }).join('');
      
      const REC_MAP = {
          'stress': { name: 'Organize the Desk', url: 'games/organize-desk.html', icon: 'inventory_2' },
          'anxiety': { name: 'Control or Let Go', url: 'games/control-or-let-go.html', icon: 'self_improvement' },
          'burnout': { name: 'Recharge the Pet', url: 'games/recharge-pet.html', icon: 'pets' },
          'overthinking': { name: 'Pop the Thought', url: 'games/pop-the-thought.html', icon: 'bubble_chart' },
          'loneliness': { name: 'Grow Friendship Flowers', url: 'games/friendship-flowers.html', icon: 'local_florist' }
      };
      
      const recs = challenges.map(c => REC_MAP[c]).filter(Boolean);
      if (recs.length > 0) {
          html += `<div style="margin-top: 16px;">
              <h3 style="font-size: 1rem; margin-bottom: 8px;">Recommended Activities</h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${recs.map(r => `
                      <a href="${r.url}" class="card" style="text-decoration:none; display:flex; align-items:center; gap:16px; padding:12px; background:var(--md-sys-color-secondary-container, #E8DEF8); color:var(--md-sys-color-on-secondary-container, #1D192B); border-radius:16px;">
                          <span class="material-icons-round" style="font-size:24px;">${r.icon}</span>
                          <span style="font-weight:600;">Play: ${r.name}</span>
                          <span class="material-icons-round" style="margin-left:auto; font-size:16px;">arrow_forward_ios</span>
                      </a>
                  `).join('')}
              </div>
          </div>`;
      }
      alertsEl.innerHTML = html;
    }
  }

  function showConditionInfo(dim) {
    const dialog = document.getElementById('condition-info-dialog');
    const titleEl = document.getElementById('condition-info-title');
    const bodyEl = document.getElementById('condition-info-body');
    if (!dialog || !titleEl || !bodyEl) return;
    
    if (dim === 'full') {
      titleEl.textContent = 'Understanding Your Check-In Results';
      let html = '<p>The daily check-in helps identify common emotional and mental well-being challenges. These results are not a diagnosis and are intended to provide self-awareness and suggest healthy coping activities.</p><hr>';
      const dims = ['stress', 'anxiety', 'burnout', 'overthinking', 'loneliness'];
      dims.forEach(d => {
        html += `<h2>${CONDITION_INFO[d].title}</h2>${CONDITION_INFO[d].body}<hr>`;
      });
      bodyEl.innerHTML = html;
    } else if (CONDITION_INFO[dim]) {
      titleEl.textContent = CONDITION_INFO[dim].title;
      bodyEl.innerHTML = CONDITION_INFO[dim].body;
    } else {
      return;
    }
    
    dialog.style.display = 'flex';
    dialog.classList.add('active');
    dialog.setAttribute('aria-hidden', 'false');

    // Hide the info FAB while overlay is open
    const fab = document.getElementById('full-info-fab');
    if (fab) fab.style.display = 'none';
  }

  window.showConditionInfo = showConditionInfo;

  function hideConditionInfo() {
    const dialog = document.getElementById('condition-info-dialog');
    if (dialog) {
      dialog.style.display = 'none';
      dialog.classList.remove('active');
      dialog.setAttribute('aria-hidden', 'true');
    }

    // Re-show the info FAB when overlay is closed
    const fab = document.getElementById('full-info-fab');
    if (fab) fab.style.display = '';
  }

  const scrim = document.getElementById('condition-info-scrim');
  const closeBtn = document.getElementById('condition-info-close');
  if (scrim) scrim.addEventListener('click', hideConditionInfo);
  if (closeBtn) closeBtn.addEventListener('click', hideConditionInfo);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const dialog = document.getElementById('condition-info-dialog');
      if (dialog && dialog.classList.contains('active')) {
        hideConditionInfo();
      }
    }
  });

  if (dimensionsEl) {
    dimensionsEl.addEventListener('click', (e) => {
      const capsule = e.target.closest('.condition-capsule');
      if (capsule) {
        showConditionInfo(capsule.dataset.condition);
      }
    });
    dimensionsEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const capsule = e.target.closest('.condition-capsule');
        if (capsule) {
          e.preventDefault();
          showConditionInfo(capsule.dataset.condition);
        }
      }
    });
  }

  const fullInfoFab = document.getElementById('full-info-fab');
  if (fullInfoFab) {
    fullInfoFab.addEventListener('click', () => {
      if (typeof window.showConditionInfo === 'function') {
        window.showConditionInfo('full');
      }
    });
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

  const historyEl = document.getElementById('checkin-history');
  if (historyEl) {
    historyEl.addEventListener('click', (e) => {
      const tag = e.target.closest('.checkin-emotion-tag[data-condition]');
      if (tag) {
        if (typeof window.showConditionInfo === 'function') {
          window.showConditionInfo(tag.dataset.condition);
        }
      }
    });
  }

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
    
    const existingRecs = document.getElementById('checkin-recs-card');
    if (existingRecs) existingRecs.remove();

    if (alreadyDone) {
      saveBtn.disabled = true;
      saveBtn.setAttribute('aria-disabled', 'true');
      saveBtn.innerHTML = '<span class="material-icons-round" aria-hidden="true">check_circle</span>Already checked in today';

      const banner = document.createElement('div');
      banner.id = 'checkin-done-banner';
      banner.className = 'checkin-done-banner';
      banner.setAttribute('role', 'status');
      const todayCheckin = checkins.find(c => c.date === todayStr());
      let recsHtml = '';
      if (todayCheckin && todayCheckin.challenges && todayCheckin.challenges.length > 0) {
        const REC_MAP = {
            'stress': { name: 'Organize the Desk', url: 'games/organize-desk.html', icon: 'inventory_2' },
            'anxiety': { name: 'Control or Let Go', url: 'games/control-or-let-go.html', icon: 'self_improvement' },
            'burnout': { name: 'Recharge the Pet', url: 'games/recharge-pet.html', icon: 'pets' },
            'overthinking': { name: 'Pop the Thought', url: 'games/pop-the-thought.html', icon: 'bubble_chart' },
            'loneliness': { name: 'Grow Friendship Flowers', url: 'games/friendship-flowers.html', icon: 'local_florist' }
        };
        const recs = todayCheckin.challenges.map(c => REC_MAP[c]).filter(Boolean);
        if (recs.length > 0) {
            recsHtml = `<div id="checkin-recs-card" class="card" style="margin-top: 16px;">
                <h3 style="font-size: 1.1rem; margin-bottom: 12px; color:var(--md-text-primary);">Recommended Activities</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${recs.map(r => `
                        <a href="${r.url}" class="card" style="text-decoration:none; display:flex; align-items:center; gap:16px; padding:12px; background:var(--md-surface-low); color:var(--md-text-primary); border: 1px solid var(--md-outline-variant); border-radius:16px;">
                            <span class="material-icons-round" style="font-size:24px; color:var(--md-primary);">${r.icon}</span>
                            <span style="font-weight:600;">Play: ${r.name}</span>
                            <span class="material-icons-round" style="margin-left:auto; font-size:16px; color:var(--md-text-secondary);">arrow_forward_ios</span>
                        </a>
                    `).join('')}
                </div>
            </div>`;
        }
      }

      banner.innerHTML = `
        <div style="display:flex; gap:16px;">
            <span class="material-icons-round checkin-done-icon" aria-hidden="true" style="font-size:32px;">check_circle</span>
            <div>
              <strong style="display:block; font-size:1.1rem; margin-bottom:4px;">You've already checked in today!</strong>
              <p style="margin:0;">Come back tomorrow to log your next check-in. Keep the streak going!</p>
            </div>
        </div>
      `;
      saveBtn.parentNode.insertBefore(banner, saveBtn);
      
      if (recsHtml) {
        const div = document.createElement('div');
        div.innerHTML = recsHtml;
        saveBtn.parentNode.insertBefore(div.firstElementChild, saveBtn);
      }
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
    if (typeof refreshFromWellnessData === 'function') {
      refreshFromWellnessData();
    }
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
    const EMOTION_TO_CONDITION = {
      'Stressed': 'stress',
      'Overwhelmed': 'stress',
      'Frustrated': 'stress',
      'Nervous': 'anxiety',
      'Exhausted': 'burnout',
      'Lonely': 'loneliness'
    };
    
    const moodTags = moods.map(m => {
      const opt = EMOTION_OPTIONS.find(e => e.id === m);
      const icon = opt ? opt.icon : 'mood';
      const dim = EMOTION_TO_CONDITION[m];
      const clickAttr = dim ? `data-condition="${dim}"` : '';
      const styleAttr = dim ? 'style="cursor: pointer;" title="Click to learn more"' : '';
      return `<span class="checkin-emotion-tag" ${styleAttr} ${clickAttr}><span class="material-icons-round" aria-hidden="true">${icon}</span>${sanitize(m)}</span>`;
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
