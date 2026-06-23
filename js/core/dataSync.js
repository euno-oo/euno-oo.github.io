import { getStorage, setStorage } from './storage.js';
import { todayStr } from '../utils/dateUtils.js';

export const DATA_KEYS = [
  'checkins',
  'habits',
  'diarys',
  'diary_meta',
  'notes',
  'todos',
  'calendarEvents',
  'pomodoro_sessions',
  'gratitude_entries',
  'flashcard_decks',
  'profile_name',
  'profile_gender',
  'profile_prompt_shown',
  'theme',
  'onboarding_done',
  'coins_balance',
  'coins_history',
  'inventory',
  'streak_freezes',
  'double_coins_active',
  'theme_unlocked',
  'focus_boost_unlocked'
];

const MAX_IMPORT_BYTES = 25 * 1024 * 1024;
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype', '_euno']);

function collectSessionKeys() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (isSafeKey(key)) keys.push(key);
    }
  } catch {}
  return keys;
}

export function exportAllData() {
  const data = { _euno: { version: 2, exported: todayStr(), mode: 'full-session' } };
  collectSessionKeys().forEach((key) => {
    const value = getStorage(key, null);
    if (value !== null) data[key] = value;
  });
  return data;
}

export function downloadBackup() {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `euno-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isSafeKey(key) {
  if (typeof key !== 'string' || BLOCKED_KEYS.has(key)) return false;
  return key.length > 0 && key.length <= 120;
}

function clampNum(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function sanitizeImportedValue(key, value) {
  if (value === null || value === undefined) return null;

  if (key === 'profile_name') {
    return typeof value === 'string' ? value.slice(0, 100) : '';
  }
  if (key === 'profile_gender') {
    return ['male', 'female', 'other'].includes(value) ? value : 'male';
  }
  if (key === 'theme') {
    return ['light', 'dark', 'system'].includes(value) ? value : 'system';
  }
  if (key === 'profile_prompt_shown' || key === 'onboarding_done' || key === 'theme_unlocked' || key === 'focus_boost_unlocked') {
    return Boolean(value);
  }
  if (key === 'coins_balance') {
    return clampNum(value, 0, 999999);
  }
  if (key === 'double_coins_active') {
    return typeof value === 'string' ? value.slice(0, 10) : null;
  }
  if (key === 'checkins' || key === 'habits' || key === 'coins_history' || key === 'streak_freezes' ||
      key === 'pomodoro_sessions' || key === 'gratitude_entries' || key === 'flashcard_decks' ||
      key === 'notes' || key === 'todos' || key === 'calendarEvents') {
    return Array.isArray(value) ? value.slice(0, 5000) : [];
  }
  if (key === 'diarys' || key === 'diary_meta' || key === 'inventory') {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  if (key.startsWith('diary_draft_')) {
    return typeof value === 'string' ? value.slice(0, 500000) : '';
  }
  if (key.startsWith('highscore_')) {
    return clampNum(value, 0, 999999999);
  }
  return value;
}

export function importAllData(rawText) {
  if (typeof rawText !== 'string' || rawText.length > MAX_IMPORT_BYTES) {
    throw new Error('Backup file is too large or invalid.');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Could not read backup file. Make sure it is valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Backup file format is not recognized.');
  }

  const keys = Object.keys(parsed).filter((k) => isSafeKey(k));
  if (!keys.length) {
    throw new Error('No compatible data found in this backup.');
  }

  keys.forEach((key) => {
    setStorage(key, sanitizeImportedValue(key, parsed[key]));
  });

  return keys.length;
}

export async function importBackupFile(file) {
  if (!file) throw new Error('No file selected.');
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error('Backup file is too large.');
  }
  const text = await file.text();
  return importAllData(text);
}
