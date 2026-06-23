const CONFIG = {
    totalCells: 9,
    prompts: [
        { id: 1, text: "Send a supportive message to a colleague", icon: "chat_bubble", level: 5 },
        { id: 2, text: "Thank someone who helped you recently", icon: "handshake", level: 4 },
        { id: 3, text: "Reach out to an old friend or contact", icon: "call", level: 5 },
        { id: 4, text: "Offer help with a small task", icon: "volunteer_activism", level: 4 },
        { id: 5, text: "Compliment a peer on their work", icon: "workspace_premium", level: 5 },
        { id: 6, text: "Share a fond memory with family", icon: "history", level: 5 },
        { id: 7, text: "Listen fully without interrupting", icon: "hearing", level: 4 },
        { id: 8, text: "Write a heartfelt note of appreciation", icon: "description", level: 4 },
        { id: 9, text: "Invite someone for a casual coffee break", icon: "coffee", level: 4 }
    ],
    flowerIcons: ["local_florist", "yard", "nature", "psychology", "filter_vintage"]
};

let state = {
    completedActions: [],
    selectedPromptId: null,
    theme: 'light',
    activeCarouselIndex: 0
};

const el = {
    promptsList: document.getElementById('prompts-list'),
    gardenGrid: document.getElementById('garden-grid'),
    actionBtn: document.getElementById('action-btn'),
    resetBtn: document.getElementById('reset-btn'),
    progressBar: document.getElementById('progress-indicator'),
    progressText: document.getElementById('progress-text'),
    progressTrack: document.getElementById('progress-bar-container'),

    completionOverlay: document.getElementById('completion-overlay'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    carouselTrack: document.getElementById('carousel-track'),
    carouselDots: document.getElementById('carousel-dots')
};

function isMobile() {
    return window.innerWidth < 768;
}

function initializeApp() {
    renderGardenGrid();
    renderCarousel();
    renderPrompts();
    setupEventListeners();
    
}

function renderGardenGrid() {
    el.gardenGrid.innerHTML = '';
    for (let i = 0; i < CONFIG.totalCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('garden-cell');
        cell.setAttribute('data-index', i);
        cell.setAttribute('role', 'img');
        cell.setAttribute('aria-label', `Patch ${i + 1}: empty`);
        cell.innerHTML = `
            <div class="flower-container">
                <div class="flower-stem"></div>
                <span class="material-symbols-outlined flower-head" aria-hidden="true"></span>
            </div>
            <div class="cell-meta"></div>
        `;
        el.gardenGrid.appendChild(cell);
    }
}

function renderCarousel() {
    el.carouselTrack.innerHTML = '';
    el.carouselDots.innerHTML = '';

    for (let i = 0; i < CONFIG.totalCells; i++) {
        const action = state.completedActions[i];
        const prompt = action ? CONFIG.prompts.find(p => p.id === action) : null;

        const card = document.createElement('div');
        card.classList.add('carousel-card');
        card.setAttribute('data-index', i);
        card.setAttribute('role', 'img');

        if (prompt) {
            card.classList.add('occupied');
            const icon = CONFIG.flowerIcons[i % CONFIG.flowerIcons.length];
            const colorVar = `--lvl-${prompt.level}`;
            card.setAttribute('aria-label', `Patch ${i + 1}: ${prompt.text}`);
            card.innerHTML = `
                <div class="flower-container">
                    <div class="flower-stem"></div>
                    <span class="material-symbols-outlined flower-head" aria-hidden="true" style="color:var(${colorVar})">${icon}</span>
                </div>
                <div class="cell-meta">${prompt.text}</div>
            `;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    card.classList.add('bloomed');
                });
            });
        } else {
            card.classList.add('empty-slot');
            card.setAttribute('aria-label', `Patch ${i + 1}: empty`);
            card.innerHTML = `
                <div class="flower-container">
                    <div class="flower-stem"></div>
                    <span class="material-symbols-outlined flower-head" aria-hidden="true"></span>
                </div>
                <div class="cell-meta"></div>
            `;
        }

        el.carouselTrack.appendChild(card);

        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Go to patch ${i + 1}`);
        dot.setAttribute('aria-selected', 'false');
        dot.setAttribute('data-dot-index', i);
        dot.addEventListener('click', () => scrollCarouselTo(i));
        el.carouselDots.appendChild(dot);
    }

    updateCarouselDots(state.activeCarouselIndex);
}

function scrollCarouselTo(index) {
    const cards = el.carouselTrack.querySelectorAll('.carousel-card');
    if (cards[index]) {
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    state.activeCarouselIndex = index;
    updateCarouselDots(index);
}

function updateCarouselDots(activeIndex) {
    const dots = el.carouselDots.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
        const isActive = i === activeIndex;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
}

function renderPrompts() {
    el.promptsList.innerHTML = '';
    CONFIG.prompts.forEach(prompt => {
        const isCompleted = state.completedActions.includes(prompt.id);
        const isSelected = state.selectedPromptId === prompt.id;

        const card = document.createElement('button');
        card.type = 'button';
        card.classList.add('prompt-card');
        if (isSelected) card.classList.add('selected');
        card.disabled = isCompleted;
        card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        card.setAttribute('data-id', prompt.id);
        card.setAttribute('aria-label', `${prompt.text}${isCompleted ? ' (completed)' : ''}`);

        card.innerHTML = `
            <span class="material-symbols-outlined prompt-icon" aria-hidden="true">${prompt.icon}</span>
            <span class="body-medium">${prompt.text}</span>
            ${isCompleted ? '<span class="material-symbols-outlined" aria-hidden="true" style="margin-left:auto;color:var(--md-success);font-size:18px;flex-shrink:0;">check_circle</span>' : ''}
        `;

        card.addEventListener('click', () => handleSelectPrompt(prompt.id));
        el.promptsList.appendChild(card);
    });
}

function handleSelectPrompt(id) {
    if (state.completedActions.includes(id)) return;
    state.selectedPromptId = id;
    renderPrompts();
    el.actionBtn.disabled = false;
}

function handleExecuteAction() {
    if (!state.selectedPromptId) return;

    const currentId = state.selectedPromptId;
    state.completedActions.push(currentId);
    state.selectedPromptId = null;
    el.actionBtn.disabled = true;

    const targetIndex = state.completedActions.length - 1;
    const dynamicPrompt = CONFIG.prompts.find(p => p.id === currentId);

    const targetCell = el.gardenGrid.querySelector(`[data-index="${targetIndex}"]`);
    if (targetCell && dynamicPrompt) {
        targetCell.classList.add('occupied');
        targetCell.setAttribute('aria-label', `Patch ${targetIndex + 1}: ${dynamicPrompt.text}`);

        const flowerHead = targetCell.querySelector('.flower-head');
        const metaArea = targetCell.querySelector('.cell-meta');
        const icon = CONFIG.flowerIcons[targetIndex % CONFIG.flowerIcons.length];

        flowerHead.textContent = icon;
        flowerHead.style.color = `var(--lvl-${dynamicPrompt.level})`;
        metaArea.textContent = dynamicPrompt.text;

        setTimeout(() => targetCell.classList.add('bloomed'), 50);
    }

    if (isMobile()) {
        state.activeCarouselIndex = targetIndex;
        renderCarousel();
        setTimeout(() => scrollCarouselTo(targetIndex), 80);
    }

    updateProgressIndicators();
    renderPrompts();
    checkWinCondition();
}

function updateProgressIndicators() {
    const pct = Math.round((state.completedActions.length / CONFIG.totalCells) * 100);
    el.progressBar.style.width = `${pct}%`;
    el.progressText.textContent = `${pct}%`;
    el.progressTrack.setAttribute('aria-valuenow', pct);
}

function checkWinCondition() {
    if (activeFlowers.every(f => f >= 100)) {
        setTimeout(() => {
            let msg = "Garden flourishing! All parameters are stable. Connection metrics complete.";
            if (window.EunoGameUtils) {
                const earned = window.EunoGameUtils.awardStudyCoins(10, 'Completed Friendship Flowers');
                
                const currentHighscore = window.EunoGameUtils.getHighScore('friendship_flowers');
                window.EunoGameUtils.saveHighScore('friendship_flowers', currentHighscore + 1);
                msg += `\n\n+${earned} StudyCoins Earned! (Total Completions: ${currentHighscore + 1})`;
            }
            alert(msg);
            handleReset();
        }, 300);
    }
}

function handleReset() {
    if (!confirm('Reset the garden and start over?')) return;
    state.completedActions = [];
    state.selectedPromptId = null;
    state.activeCarouselIndex = 0;
    el.actionBtn.disabled = true;
    updateProgressIndicators();
    renderGardenGrid();
    renderCarousel();
    renderPrompts();
}



function setupEventListeners() {
    el.actionBtn.addEventListener('click', handleExecuteAction);
    el.resetBtn.addEventListener('click', handleReset);


    el.modalCloseBtn.addEventListener('click', () => {
        el.completionOverlay.classList.add('hidden');
        el.actionBtn.focus();
    });

    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !el.completionOverlay.classList.contains('hidden')) {
            el.completionOverlay.classList.add('hidden');
            el.actionBtn.focus();
        }
    });

    let scrollTimer;
    el.carouselTrack.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            const cards = el.carouselTrack.querySelectorAll('.carousel-card');
            const center = el.carouselTrack.scrollLeft + el.carouselTrack.offsetWidth / 2;
            let closest = 0;
            let minDist = Infinity;
            cards.forEach((card, i) => {
                const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                const dist = Math.abs(center - cardCenter);
                if (dist < minDist) { minDist = dist; closest = i; }
            });
            state.activeCarouselIndex = closest;
            updateCarouselDots(closest);
        }, 80);
    });

    window.addEventListener('resize', () => {
        if (!isMobile()) renderGardenGrid();
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);
