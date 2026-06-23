

function getStorage(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : def;
  } catch (e) {
    return def;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}


function saveHighScore(gameKey, score) {
  const currentHigh = getStorage('highscore_' + gameKey, 0);
  if (score > currentHigh) {
    setStorage('highscore_' + gameKey, score);
    return true;
  }
  return false;
}


function getHighScore(gameKey) {
  return getStorage('highscore_' + gameKey, 0);
}


function awardStudyCoins(amount, reason) {
  const doubleActive = getStorage('double_coins_active') === new Date().toLocaleDateString('en-CA');
  const finalAmount = doubleActive ? amount * 2 : amount;

  const currentBal = getStorage('coins_balance', 0);
  const newBal = Math.max(0, currentBal + finalAmount);
  setStorage('coins_balance', newBal);

  const hist = getStorage('coins_history', []);
  hist.unshift({
    amount: finalAmount,
    reason: reason,
    timestamp: Date.now()
  });
  setStorage('coins_history', hist.slice(0, 100));

  return finalAmount;
}


window.EunoGameUtils = {
  saveHighScore,
  getHighScore,
  awardStudyCoins
};


function syncGlobalTheme() {
  const t = getStorage('theme', 'system');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = t === 'dark' || (t === 'system' && prefersDark);
  
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-theme');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-theme');
  }

  
  document.querySelectorAll('#theme-toggle .material-symbols-outlined, #theme-toggle .material-symbols-rounded, .theme-toggle .material-symbols-outlined, .theme-toggle .material-symbols-rounded').forEach(icon => {
    icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  });
}

function toggleGlobalTheme() {
  const t = getStorage('theme', 'system');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = t === 'dark' || (t === 'system' && prefersDark);
  const newTheme = isDark ? 'light' : 'dark';
  setStorage('theme', newTheme);
  syncGlobalTheme();
}


syncGlobalTheme();
function initGameIcons() {
  const root = document.documentElement;
  const ready = () => root.classList.add('icons-ready');
  if (!document.fonts || !document.fonts.load) {
    ready();
    return;
  }
  Promise.race([
    Promise.allSettled([
      document.fonts.load('24px "Material Icons Round"'),
      document.fonts.load('24px "Material Symbols Outlined"'),
      document.fonts.load('24px "Material Symbols Rounded"')
    ]),
    new Promise((resolve) => setTimeout(resolve, 1200))
  ]).then(ready);
}

function initGameUtils() {
  initGameIcons();
  syncGlobalTheme();
  const toggles = document.querySelectorAll('#theme-toggle, .theme-toggle');
  toggles.forEach(btn => btn.addEventListener('click', toggleGlobalTheme));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGameUtils);
} else {
  initGameUtils();
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getStorage('theme', 'system') === 'system') syncGlobalTheme();
});

window.addEventListener('storage', (e) => {
  if (e.key === 'theme') syncGlobalTheme();
});
