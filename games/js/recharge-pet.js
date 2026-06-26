const MASTER_CARDS = [
    { name: 'Sleep', delta: 25, icon: 'bedtime' },
    { name: 'Exercise', delta: -15, icon: 'fitness_center' },
    { name: 'Study', delta: -10, icon: 'menu_book' },
    { name: 'Scroll Social Media', delta: -20, icon: 'phonelink_erase' },
    { name: 'Eat Healthy Food', delta: 20, icon: 'restaurant' },
    { name: 'Drink Water', delta: 15, icon: 'water_drop' }
];

const START_ENERGY = 30;
const MIN_ENERGY = 0;
const MAX_ENERGY = 100;

let currentEnergy = START_ENERGY;
let turnCount = 0;
let lastFocusedElement = null;

const elGrid = document.getElementById('activity-grid');
const elProgressBar = document.getElementById('progress-bar-fill');
const elProgressPercent = document.getElementById('progress-percentage');
const elActionCount = document.getElementById('action-count');
const elHighscoreSummaryVal = document.getElementById('highscore-summary-val');
const elPetContainer = document.getElementById('axolotl-pet');
const elPetFaceCurrent = document.getElementById('pet-face-current');
const elPetStatusBadge = document.getElementById('pet-status-badge');
const elHitContainer = document.getElementById('combat-text-container');

const elModal = document.getElementById('modal-overlay');
const elModalIconWrapper = elModal.querySelector('.dialog-icon-wrapper');
const elModalIcon = document.getElementById('modal-icon');
const elModalTitle = document.getElementById('modal-title');
const elModalDesc = document.getElementById('modal-description');
const elModalStatsTurns = document.getElementById('modal-stats-turns');
const elHighscoreValue = document.getElementById('highscore-value');
const elRestartBtn = document.getElementById('restart-btn');

const PET_FACE_SRC = {
    low: '../images/Burnout.avif',
    medium: '../images/Final.avif',
    high: '../images/Default.avif'
};

const PET_FACE_ALT = {
    low: 'Burnout expression Euno',
    medium: 'Neutral flat-smile Euno',
    high: 'Happy Euno'
};

function init() {
    setupEventListeners();
    
    resetGame();
}

function setupEventListeners() {
    elGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.list-item');
        if (!card) return;

        const delta = parseInt(card.dataset.delta, 10);
        processTurn(delta);
    });

    
    elRestartBtn.addEventListener('click', resetGame);
    elModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') resetGame();
    });
}



function generateChoices() {
    const shuffled = [...MASTER_CARDS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    elGrid.innerHTML = selected.map(card => `
      <button class="list-item" data-delta="${card.delta}">
        <div class="list-item__leading">
          <span class="material-symbols-outlined">${card.icon}</span>
        </div>
        <span class="list-item__text">${card.name}</span>
        <div class="list-item__trailing">
          <span class="material-symbols-outlined">arrow_forward_ios</span>
        </div>
      </button>
    `).join('');
}

function processTurn(delta) {
    currentEnergy = Math.max(MIN_ENERGY, Math.min(MAX_ENERGY, currentEnergy + delta));
    turnCount++;

    triggerFeedback(delta);
    updateUI();

    if (currentEnergy === MAX_ENERGY) {
        endGame(true);
    } else if (currentEnergy === MIN_ENERGY) {
        endGame(false);
    } else {
        generateChoices();
    }
}

function triggerFeedback(delta) {
    const hitTxt = document.createElement('div');
    hitTxt.className = `pop-text ${delta >= 0 ? 'text-gain' : 'text-lose'}`;
    hitTxt.textContent = `${delta >= 0 ? '+' : ''}${delta}`;

    elHitContainer.appendChild(hitTxt);
    setTimeout(() => hitTxt.remove(), 750);
}

function setPetFace(state) {
    const nextSrc = PET_FACE_SRC[state];
    if (!nextSrc || elPetFaceCurrent.getAttribute('src') === nextSrc) return;

    elPetFaceCurrent.src = nextSrc;
    elPetFaceCurrent.alt = PET_FACE_ALT[state];
}

function setPetStateClass(stateClass) {
    elPetContainer.classList.remove('state-low', 'state-medium', 'state-high');
    elPetContainer.classList.add(stateClass);
}

function updateUI() {
    elProgressBar.style.width = `${currentEnergy}%`;
    elProgressBar.setAttribute('aria-valuenow', currentEnergy);
    elProgressPercent.textContent = `${currentEnergy}%`;
    elActionCount.textContent = turnCount;

    elProgressBar.className = 'linear-progress__indicator';

    if (currentEnergy < 40) {
        elProgressBar.classList.add('color-state-danger');
        setPetStateClass('state-low');
        setPetFace('low');
        elPetStatusBadge.textContent = 'Tired';
        elPetStatusBadge.className = 'badge badge--danger pet-status-chip';
    } else if (currentEnergy < 75) {
        elProgressBar.classList.add('color-state-warning');
        setPetStateClass('state-medium');
        setPetFace('medium');
        elPetStatusBadge.textContent = 'Stable';
        elPetStatusBadge.className = 'badge badge--warning pet-status-chip';
    } else {
        elProgressBar.classList.add('color-state-success');
        setPetStateClass('state-high');
        setPetFace('high');
        elPetStatusBadge.textContent = 'Happy';
        elPetStatusBadge.className = 'badge badge--success pet-status-chip';
    }

    const storedBest = window.EunoGameUtils
        ? window.EunoGameUtils.getHighScore('recharge_pet')
        : Number.parseInt(localStorage.getItem('highscore_recharge_pet') || '0', 10);
    elHighscoreSummaryVal.textContent = storedBest ? `${storedBest} t` : '--';
}

function endGame(isWin) {
    lastFocusedElement = document.activeElement;
    elModalStatsTurns.textContent = turnCount;

    if (isWin) {
        elModalIconWrapper.className = 'dialog-icon-wrapper';
        elModalIcon.textContent = 'task_alt';
        elModalTitle.textContent = 'Energy Restored';
        elModalDesc.textContent = 'The pet was successfully managed to optimal structural baseline levels.';

        if (window.EunoGameUtils) {
            let currentHighscore = window.EunoGameUtils.getHighScore('recharge_pet');
            if (currentHighscore === 0 || turnCount < currentHighscore) {
                localStorage.setItem('highscore_recharge_pet', JSON.stringify(turnCount));
                elModalDesc.innerHTML += '<br><strong>New Best Time!</strong>';
            }
        }
    } else {
        elModalIconWrapper.className = 'dialog-icon-wrapper fail';
        elModalIcon.textContent = 'block';
        elModalTitle.textContent = 'System Depleted';
        elModalDesc.textContent = 'Critical threshold reached. Energy exhaustion sequence terminated life metrics.';
    }

    const storedBest = window.EunoGameUtils
        ? window.EunoGameUtils.getHighScore('recharge_pet')
        : Number.parseInt(localStorage.getItem('highscore_recharge_pet') || '0', 10);
    elHighscoreValue.textContent = storedBest ? `${storedBest} turns` : '--';

    elModal.classList.remove('hidden');
    elRestartBtn.focus();
}

function resetGame() {
    currentEnergy = START_ENERGY;
    turnCount = 0;
    elPetContainer.classList.remove('is-changing-expression');
    elHitContainer.innerHTML = '';
    elModal.classList.add('hidden');
    updateUI();
    generateChoices();

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

document.addEventListener('DOMContentLoaded', init);
