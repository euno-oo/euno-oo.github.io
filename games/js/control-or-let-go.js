(function () {
    'use strict';

    const RUNTIME_INPUT_DATA = [
        { id: 1, text: "Studying tonight", isControl: true },
        { id: 2, text: "Setting an alarm to wake up early", isControl: true },
        { id: 3, text: "How I react when I get frustrated", isControl: true },
        { id: 4, text: "Choosing to apologize when wrong", isControl: true },
        { id: 5, text: "Taking deep breaths to calm down", isControl: true },
        { id: 6, text: "What I choose to post on social media", isControl: true },
        { id: 7, text: "How much effort I put into my work", isControl: true },
        { id: 8, text: "Asking for help when I am stuck", isControl: true },
        { id: 9, text: "Limiting my daily screen time", isControl: true },
        { id: 10, text: "Deciding to eat a balanced meal", isControl: true },
        { id: 11, text: "Tomorrow's exam", isControl: false },
        { id: 12, text: "What someone thinks of me", isControl: false },
        { id: 13, text: "The weather tomorrow", isControl: false },
        { id: 14, text: "A mistake I made three years ago", isControl: false },
        { id: 15, text: "Whether a university accepts my application", isControl: false },
        { id: 16, text: "The traffic conditions on the highway", isControl: false },
        { id: 17, text: "An unexpected delay on my flight", isControl: false },
        { id: 18, text: "How other people choose to behave", isControl: false },
        { id: 19, text: "Changes in the global economy", isControl: false },
        { id: 20, text: "The tone of voice someone else used", isControl: false }
    ];

    let appPool = [];
    let currentActiveNode = null;
    let score = 0;
    let lives = 3;
    let isEvaluating = false;

    let touchActive = false;
    let originX = 0, originY = 0;
    let elementX = 0, elementY = 0;

    const spawnerSlot = document.getElementById('thoughtSpawner');
    const liveAnnouncer = document.getElementById('deck-live-announcement');
    const txtScore = document.getElementById('scoreValue');
    const txtLives = document.getElementById('livesValue');
    const txtRemaining = document.getElementById('remainingValue');
    const endBackdrop = document.getElementById('endScreen');
    const endIcon = document.getElementById('modalIcon');
    const endTitle = document.getElementById('dialogTitle');
    const endMessage = document.getElementById('screenMessage');
    const btnRestart = document.getElementById('btnRestart');
    const ctrlZone = document.getElementById('zone-control');
    const noCtrlZone = document.getElementById('zone-nocontrol');
    const actionBtnCtrl = document.getElementById('btnSortControl');
    const actionBtnNoCtrl = document.getElementById('btnSortNoControl');

    function initializeApplication() {
        score = 0;
        lives = 3;
        isEvaluating = false;
        appPool = shuffle([...RUNTIME_INPUT_DATA]);

        endBackdrop.classList.add('hidden');
        spawnerSlot.innerHTML = '';

        bindDropTargets();
        mountNextCard();
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function syncInstrumentationDisplays() {
        txtScore.textContent = score < 10 ? `0${score}` : score;
        txtLives.textContent = lives < 10 ? `0${lives}` : lives;
        txtRemaining.textContent = appPool.length + (currentActiveNode ? 1 : 0);
    }

    function mountNextCard() {
        if (appPool.length === 0) {
            currentActiveNode = null;
            syncInstrumentationDisplays();
            terminateRun(true);
            return;
        }

        isEvaluating = false;
        const cardData = appPool.pop();
        syncInstrumentationDisplays();

        const element = document.createElement('div');
        element.className = 'm3-interactive-item-node';
        element.textContent = cardData.text;
        element.setAttribute('draggable', 'true');
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');

        element.setAttribute('aria-label', `Statement: ${cardData.text}. Use arrow keys to route.`);
        element.dataset.isControl = cardData.isControl;

        element.addEventListener('dragstart', (e) => {
            if (isEvaluating) { e.preventDefault(); return; }
            e.dataTransfer.setData('text/plain', 'active');
        });

        element.addEventListener('touchstart', onTouchStart, { passive: false });
        element.addEventListener('touchmove', onTouchMove, { passive: false });
        element.addEventListener('touchend', onTouchEnd);
        element.addEventListener('keydown', onKeyboardInput);

        spawnerSlot.appendChild(element);
        currentActiveNode = element;

        liveAnnouncer.textContent = `New card active: ${cardData.text}`;

        setTimeout(() => element.focus(), 50);
    }

    function bindDropTargets() {
        [ctrlZone, noCtrlZone].forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!isEvaluating) zone.classList.add('drag-over');
            });
            zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                if (currentActiveNode && !isEvaluating) processEvaluation(zone.dataset.zone);
            });
        });
    }

    function onTouchStart(e) {
        if (isEvaluating) return;
        const t = e.touches[0];
        touchActive = true;
        originX = t.clientX;
        originY = t.clientY;
        const rect = currentActiveNode.getBoundingClientRect();
        const parentRect = spawnerSlot.getBoundingClientRect();
        elementX = rect.left - parentRect.left;
        elementY = rect.top - parentRect.top;
    }

    function onTouchMove(e) {
        if (!touchActive || isEvaluating) return;
        e.preventDefault();
        const t = e.touches[0];
        currentActiveNode.style.position = 'absolute';
        currentActiveNode.style.left = `${elementX + (t.clientX - originX)}px`;
        currentActiveNode.style.top = `${elementY + (t.clientY - originY)}px`;
    }

    function onTouchEnd(e) {
        if (!touchActive) return;
        touchActive = false;
        if (isEvaluating) return;

        const t = e.changedTouches[0];
        const targetZoneId = checkIntersection(t.clientX, t.clientY);

        if (targetZoneId) {
            processEvaluation(targetZoneId);
        } else {
            resetNodeStyles();
        }
    }

    function checkIntersection(x, y) {
        const rCtrl = ctrlZone.getBoundingClientRect();
        const rNoCtrl = noCtrlZone.getBoundingClientRect();
        if (x >= rCtrl.left && x <= rCtrl.right && y >= rCtrl.top && y <= rCtrl.bottom) return 'control';
        if (x >= rNoCtrl.left && x <= rNoCtrl.right && y >= rNoCtrl.top && y <= rNoCtrl.bottom) return 'nocontrol';
        return null;
    }

    function onKeyboardInput(e) {
        if (isEvaluating) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            processEvaluation('control');
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            processEvaluation('nocontrol');
        }
    }

    actionBtnCtrl.addEventListener('click', () => { if (!isEvaluating) processEvaluation('control'); });
    actionBtnNoCtrl.addEventListener('click', () => { if (!isEvaluating) processEvaluation('nocontrol'); });

    function resetNodeStyles() {
        if (currentActiveNode) {
            currentActiveNode.style.position = '';
            currentActiveNode.style.left = '';
            currentActiveNode.style.top = '';
        }
    }

    function processEvaluation(selectedZone) {
        if (!currentActiveNode || isEvaluating) return;
        isEvaluating = true;

        const zoneMatchesControl = (selectedZone === 'control');
        const itemIsActuallyControl = (currentActiveNode.dataset.isControl === 'true');
        const referenceNode = currentActiveNode;

        if (zoneMatchesControl === itemIsActuallyControl) {
            score++;
            liveAnnouncer.textContent = "Correct sort placement configuration.";
            referenceNode.className = 'm3-interactive-item-node success-flash';
            currentActiveNode = null;
            setTimeout(() => {
                referenceNode.remove();
                mountNextCard();
            }, 200);
        } else {
            lives--;
            liveAnnouncer.textContent = `Incorrect configuration assignment. Remaining lives: ${lives}`;
            syncInstrumentationDisplays();
            referenceNode.className = 'm3-interactive-item-node error-flash';

            if (lives <= 0) {
                setTimeout(() => terminateRun(false), 350);
            } else {
                setTimeout(() => {
                    referenceNode.className = 'm3-interactive-item-node';
                    resetNodeStyles();
                    isEvaluating = false;
                    referenceNode.focus();
                }, 350);
            }
        }
    }

    function terminateRun(isWin) {
        if (isWin) {
            endIcon.textContent = 'verified';
            endIcon.className = 'material-symbols-outlined m3-dialog-icon';
            endTitle.textContent = "Run Config Successful";
            endMessage.textContent = "Cognitive restructuring parameters completed successfully. By intentionally choosing to isolate focus metrics inside your personal sphere of influence, you prevent structural executive strain.";
            
            if (window.EunoGameUtils) {
                const newHigh = window.EunoGameUtils.saveHighScore('control_or_let_go', score);
                endMessage.innerHTML = endMessage.textContent + `<br><br><strong style="color:var(--md-sys-color-primary)">Final Score: ${score}</strong>` + (newHigh ? " <em>(New Highscore!)</em>" : "");
            }
        } else {
            endIcon.textContent = 'report';
            endIcon.className = 'material-symbols-outlined m3-dialog-icon err';
            endTitle.textContent = "Run Failure Countered";
            endMessage.textContent = "Task execution disrupted by unhandled external variables. Allocating system processing focus onto unalterable conditions causes framework limits to exceed stable thresholds.";
        }
        endBackdrop.classList.remove('hidden');

        btnRestart.focus();
        endBackdrop.addEventListener('keydown', handleModalFocusTrap);
    }

    function handleModalFocusTrap(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            btnRestart.focus();
        }
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !endBackdrop.classList.contains('hidden')) {
            endBackdrop.removeEventListener('keydown', handleModalFocusTrap);
            initializeApplication();
        }
    });

    btnRestart.addEventListener('click', () => {
        endBackdrop.removeEventListener('keydown', handleModalFocusTrap);
        initializeApplication();
    });

    window.addEventListener('DOMContentLoaded', initializeApplication);
}());
