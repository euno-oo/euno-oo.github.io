class ThoughtEngine {
  constructor() {
    this.score = 0;
    this.lives = 5;
    this.isRunning = false;
    this.isPaused = false;
    this.elements = [];
    this.bestScore = 0;

    this.initialSpawnInterval = 2200;
    this.currentSpawnInterval = 2200;
    this.minimumSpawnInterval = 750;
    this.baseSpeedFactor = 1.3;
    this.accelerationRate = 0.035;
    this.difficultyStepMultiplier = 0.96;

    this.canvas = document.getElementById('canvas');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.helpScreen = document.getElementById('help-screen');
    this.finalScoreDisplay = document.getElementById('final-score');
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.helpFab = document.getElementById('help-fab');
    this.helpClose = document.getElementById('help-close');
    this.helpResumeBtn = document.getElementById('help-resume-btn');
    this.themeToggle = document.getElementById('theme-toggle');
    this.rewardMsg = document.getElementById('pt-reward-msg');
    this.bestScoreEl = document.getElementById('best-score');

    this.scoreEl = document.getElementById('score-count');
    this.livesEl = document.getElementById('lives-count');

    this.previousFrameTime = 0;
    this.accumulatedSpawnTime = 0;

    this.thoughtPool = [
      "What if I fail?",
      "What if they dislike me?",
      "What if I embarrass myself?",
      "What if something goes wrong?",
      "What if I make a mistake?",
      "Am I falling behind?",
      "I should be doing more.",
      "What if this isn't enough?",
      "Am I ready for this?",
      "Unresolved priorities exist."
    ];

    this.loadBestScore();
    this.bindEvents();
  }

  loadBestScore() {
    const saved = parseInt(localStorage.getItem('thought-best'), 10);
    if (!isNaN(saved) && saved > 0) {
      this.bestScore = saved;
      if (this.bestScoreEl) this.bestScoreEl.textContent = saved;
    }
  }

  saveBestScore(score) {
    if (score > this.bestScore) {
      this.bestScore = score;
      localStorage.setItem('thought-best', score);
      if (this.bestScoreEl) this.bestScoreEl.textContent = score;
      return true;
    }
    return false;
  }

  setScore(val) {
    this.score = val;
    if (this.scoreEl) this.scoreEl.textContent = val;
    const desktopScore = document.getElementById('score-count-desktop');
    if (desktopScore) desktopScore.textContent = val;
  }

  setLives(val) {
    this.lives = val;
    if (this.livesEl) this.livesEl.textContent = val;
    const desktopLives = document.getElementById('lives-count-desktop');
    if (desktopLives) desktopLives.textContent = val;
  }

  setStatus(running) {
    
  }

  openHelp() {
    if (!this.isRunning) return;
    this.isPaused = true;
    this.setStatus(false);
    this.helpScreen.classList.add('active');
    if (this.helpClose) this.helpClose.focus();
  }

  closeHelp() {
    this.helpScreen.classList.remove('active');
    this.isPaused = false;
    if (this.isRunning) {
      this.setStatus(true);
      if (this.helpFab) this.helpFab.focus();
      this.previousFrameTime = performance.now();
      requestAnimationFrame(ts => this.executionLoop(ts));
    }
  }

  bindEvents() {
    this.startBtn.addEventListener('click', () => this.bootEngine());
    this.restartBtn.addEventListener('click', () => this.bootEngine());

    if (this.helpFab) {
      this.helpFab.addEventListener('click', () => this.openHelp());
    }
    if (this.helpClose) {
      this.helpClose.addEventListener('click', () => this.closeHelp());
    }
    if (this.helpResumeBtn) {
      this.helpResumeBtn.addEventListener('click', () => this.closeHelp());
    }

    if (this.helpScreen) {
      this.helpScreen.addEventListener('pointerdown', e => {
        if (e.target === this.helpScreen) this.closeHelp();
      });
    }

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (this.helpScreen && this.helpScreen.classList.contains('active')) {
          this.closeHelp();
        } else if (this.isRunning) {
          this.haltEngine();
        }
      }
    });
  }

  bootEngine() {
    this.setScore(0);
    this.setLives(5);
    this.currentSpawnInterval = this.initialSpawnInterval;
    this.baseSpeedFactor = 1.3;
    this.elements = [];
    this.canvas.querySelectorAll('.thought-balloon').forEach(b => b.remove());

    this.startScreen.classList.remove('active');
    this.gameOverScreen.classList.remove('active');
    if (this.helpScreen) this.helpScreen.classList.remove('active');
    if (this.helpFab) this.helpFab.style.display = '';

    this.isRunning = true;
    this.isPaused = false;
    this.setStatus(true);
    this.previousFrameTime = performance.now();
    this.accumulatedSpawnTime = 0;

    this.canvas.focus();
    requestAnimationFrame(ts => this.executionLoop(ts));
  }

  executionLoop(timestamp) {
    if (!this.isRunning || this.isPaused) return;

    const delta = timestamp - this.previousFrameTime;
    this.previousFrameTime = timestamp;

    this.accumulatedSpawnTime += delta;
    if (this.accumulatedSpawnTime >= this.currentSpawnInterval) {
      this.spawnThought();
      this.accumulatedSpawnTime = 0;
      this.currentSpawnInterval = Math.max(
        this.minimumSpawnInterval,
        this.currentSpawnInterval * this.difficultyStepMultiplier
      );
      this.baseSpeedFactor += this.accelerationRate;
    }

    this.tickMotion(delta);
    requestAnimationFrame(ts => this.executionLoop(ts));
  }

  spawnThought() {
    const text = this.thoughtPool[Math.floor(Math.random() * this.thoughtPool.length)];

    const node = document.createElement('div');
    node.className = 'thought-balloon';
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.setAttribute('aria-label', `${text} — tap or press Space to dismiss`);

    const label = document.createElement('span');
    label.className = 'thought-text';
    label.textContent = text;
    node.appendChild(label);

    const maxLeft = Math.max(0, this.canvas.clientWidth - 168);
    node.style.left = `${Math.random() * maxLeft}px`;

    this.canvas.appendChild(node);

    const speed = this.baseSpeedFactor + Math.random() * 0.8;
    const obj = { domNode: node, y: -110, velocity: speed };

    node.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.popThought(obj);
    });

    node.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.popThought(obj);
      }
    });

    this.elements.push(obj);
  }

  tickMotion(delta) {
    const step = delta * 0.06;

    for (let i = this.elements.length - 1; i >= 0; i--) {
      const t = this.elements[i];
      t.y += t.velocity * step;
      t.domNode.style.transform = `translateY(${-t.y}px)`;

      if (t.y > this.canvas.clientHeight + 120) {
        if (t.domNode.parentNode) this.canvas.removeChild(t.domNode);
        this.elements.splice(i, 1);
        this.loseLife();
      }
    }
  }

  popThought(obj) {
    this.setScore(this.score + 100);
    if (document.activeElement === obj.domNode) this.canvas.focus();
    if (obj.domNode.parentNode) this.canvas.removeChild(obj.domNode);
    const idx = this.elements.indexOf(obj);
    if (idx > -1) this.elements.splice(idx, 1);
  }

  loseLife() {
    this.setLives(this.lives - 1);
    if (this.lives <= 0) this.haltEngine();
  }

  haltEngine() {
    this.isRunning = false;
    this.isPaused = false;
    this.setStatus(false);
    this.finalScoreDisplay.textContent = this.score;
    this.gameOverScreen.classList.add('active');
    if (this.helpFab) this.helpFab.style.display = 'none';

    const isNew = this.saveBestScore(this.score);

    if (this.rewardMsg) {
      if (this.score > 0) {
        this.rewardMsg.innerHTML = isNew
          ? '<span class="reward-highlight">New personal best!</span>'
          : '';
        if (window.EunoGameUtils) {
          const earned = window.EunoGameUtils.awardStudyCoins(10, 'Played Pop The Thought');
          this.rewardMsg.innerHTML += ` <span class="reward-highlight">+${earned} StudyCoins</span>`;
        }
      } else {
        this.rewardMsg.innerHTML = '';
      }
    }

    this.restartBtn.focus();
  }
}

window.addEventListener('DOMContentLoaded', () => new ThoughtEngine());