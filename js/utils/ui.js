import { sanitize } from './helpers.js';
import { MOOD_ICONS, MOOD_LABELS, WELLNESS_LEVEL_LABELS } from '../core/constants.js';
import { getCheckinWellnessLevel } from '../features/checkinScoring.js';

let overlayReturnFocus = null;

export function renderMoodDot(mood) {
  if (!mood) return `<div class="mood-dot mood-dot--empty" aria-label="No mood logged"><span class="material-icons-round" aria-hidden="true">radio_button_unchecked</span></div>`;
  return `<div class="mood-dot mood-dot--${mood}" title="${sanitize(MOOD_LABELS[mood])}" aria-label="${sanitize(MOOD_LABELS[mood])}"><span class="material-icons-round" aria-hidden="true">${sanitize(MOOD_ICONS[mood])}</span></div>`;
}

export function renderWellnessDot(checkin) {
  if (!checkin) {
    return `<div class="mood-dot mood-dot--empty" aria-label="No check-in"><span class="material-icons-round" aria-hidden="true">radio_button_unchecked</span></div>`;
  }
  const level = getCheckinWellnessLevel(checkin);
  if (!level) {
    return `<div class="mood-dot mood-dot--empty" aria-label="No check-in"><span class="material-icons-round" aria-hidden="true">radio_button_unchecked</span></div>`;
  }
  const label = WELLNESS_LEVEL_LABELS[level] || '';
  return `<div class="mood-dot mood-dot--${level}" title="${sanitize(label)}" aria-label="${sanitize(label)}"><span class="material-icons-round" aria-hidden="true">${sanitize(MOOD_ICONS[level])}</span></div>`;
}

function getDialogFocusables(dialog) {
  return [...dialog.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(el => el.offsetParent !== null || el === document.activeElement);
}

function bindDialogFocusTrap(dialog) {
  if (dialog._focusTrapBound) return;
  dialog._focusTrapHandler = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = getDialogFocusables(dialog);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  dialog.addEventListener('keydown', dialog._focusTrapHandler);
  dialog._focusTrapBound = true;
}

function unbindDialogFocusTrap(dialog) {
  if (!dialog || !dialog._focusTrapHandler) return;
  dialog.removeEventListener('keydown', dialog._focusTrapHandler);
  dialog._focusTrapHandler = null;
  dialog._focusTrapBound = false;
}

export function openOverlayDialog(dialog, returnFocusEl) {
  if (!dialog) return;
  overlayReturnFocus = returnFocusEl || document.activeElement;
  dialog.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const surface = dialog.querySelector('.picker-surface, .streak-cal-surface');
  if (surface && !surface.hasAttribute('tabindex')) surface.setAttribute('tabindex', '-1');
  bindDialogFocusTrap(dialog);
  const focusable = getDialogFocusables(dialog);
  const focusTarget = focusable[0] || surface;
  requestAnimationFrame(() => focusTarget && focusTarget.focus());
}

export function closeOverlayDialog(dialog) {
  if (!dialog) return;
  dialog.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  unbindDialogFocusTrap(dialog);
  if (overlayReturnFocus && typeof overlayReturnFocus.focus === 'function') {
    overlayReturnFocus.focus();
  }
  overlayReturnFocus = null;
}

export function isOverlayOpen(dialog) {
  return dialog && dialog.getAttribute('aria-hidden') === 'false';
}
