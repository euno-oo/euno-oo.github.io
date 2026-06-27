class ThoughtEngine {
  constructor() {
    this.score = 0;
    this.lives = 5;
    this.isRunning = false;
    this.isPaused = false;
    this.elements = [];
    this.bestScore = 0;
    this.thoughtsPassed = 0;

    this.initialSpawnInterval = 1500;
    this.currentSpawnInterval = 1500;
    this.minimumSpawnInterval = 450;
    this.baseSpeedFactor = 1.6;
    this.accelerationRate = 0.05;
    this.difficultyStepMultiplier = 0.94;
    this.positiveSpawnChance = 0.3;
    this.maxPositiveChance = 0.45;

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

    this.negativeThoughts = [
      { text: "What if I fail?", icon: "warning" },
      { text: "Everyone is judging me.", icon: "visibility" },
      { text: "I'm not good enough.", icon: "thumb_down" },
      { text: "I'll never get this right.", icon: "block" },
      { text: "They probably don't like me.", icon: "mood_bad" },
      { text: "I always mess things up.", icon: "error" },
      { text: "I'm going to embarrass myself.", icon: "sentiment_dissatisfied" },
      { text: "I'll never be as good as them.", icon: "trending_down" },
      { text: "Something bad will happen.", icon: "dangerous" },
      { text: "I can't do anything right.", icon: "cancel" }
    ];

    this.positiveThoughts = [
      { text: "I can do my best.", icon: "check_circle" },
      { text: "Everyone makes mistakes.", icon: "group" },
      { text: "One step at a time.", icon: "footprint" },
      { text: "I am learning and improving.", icon: "trending_up" },
      { text: "I don't have to be perfect.", icon: "spa" },
      { text: "I've handled difficult things before.", icon: "shield" },
      { text: "It's okay to ask for help.", icon: "handshake" },
      { text: "I am enough.", icon: "favorite" },
      { text: "This feeling will pass.", icon: "sunny" },
      { text: "I can try again tomorrow.", icon: "restart_alt" }
    ];

    this.loadBestScore();
    this.bindEvents();

    if (this.helpFab) this.helpFab.classList.add('is-hidden');
  }

  pickRandomThought() {
    const usePositive = Math.random() < this.positiveSpawnChance;
    const pool = usePositive ? this.positiveThoughts : this.negativeThoughts;
    const entry = pool[Math.floor(Math.random() * pool.length)];
    return {
      text: entry.text,
      icon: entry.icon,
      isPositive: usePositive
    };
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

  openHelp() {
    if (!this.isRunning) return;
    this.isPaused = true;
    if (this.helpFab) this.helpFab.classList.add('is-hidden');
    this.helpScreen.classList.add('active');
    if (this.helpClose) this.helpClose.focus();
  }

  closeHelp() {
    this.helpScreen.classList.remove('active');
    this.isPaused = false;
    if (this.isRunning) {
      if (this.helpFab) this.helpFab.classList.remove('is-hidden');
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
    this.baseSpeedFactor = 1.6;
    this.positiveSpawnChance = 0.3;
    this.thoughtsPassed = 0;
    this.elements = [];
    this.canvas.querySelectorAll('.thought-balloon').forEach(b => b.remove());

    this.startScreen.classList.remove('active');
    this.gameOverScreen.classList.remove('active');
    if (this.helpScreen) this.helpScreen.classList.remove('active');
    if (this.helpFab) this.helpFab.classList.remove('is-hidden');

    this.isRunning = true;
    this.isPaused = false;
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
    const thought = this.pickRandomThought();

    const node = document.createElement('div');
    node.className = `thought-balloon ${thought.isPositive ? 'positive' : 'negative'}`;
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.setAttribute('aria-label', `${thought.isPositive ? 'Positive' : 'Negative'} thought: ${thought.text} — ${thought.isPositive ? 'let it pass, do not pop' : 'tap or press Space to dismiss'}`);

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined thought-icon';
    icon.textContent = thought.icon;
    icon.setAttribute('aria-hidden', 'true');
    node.appendChild(icon);

    const label = document.createElement('span');
    label.className = 'thought-text';
    label.textContent = thought.text;
    node.appendChild(label);

    const maxLeft = Math.max(0, this.canvas.clientWidth - 180);
    node.style.left = `${Math.random() * maxLeft}px`;

    this.canvas.appendChild(node);

    const speed = this.baseSpeedFactor + Math.random() * 1.0;
    const obj = { domNode: node, y: -130, velocity: speed, isPositive: thought.isPositive };

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

      if (t.y > this.canvas.clientHeight + 130) {
        if (t.domNode.parentNode) this.canvas.removeChild(t.domNode);
        this.elements.splice(i, 1);
        if (!t.isPositive) {
          this.loseLife();
        }
      }
    }
  }

  popThought(obj) {
    if (obj.isPositive) {
      this.triggerWrongPop(obj);
    } else {
      this.triggerCorrectPop(obj);
    }
  }

  triggerCorrectPop(obj) {
    this.setScore(this.score + 100);
    this.thoughtsPassed++;

    if (this.thoughtsPassed % 5 === 0) {
      this.positiveSpawnChance = Math.min(this.maxPositiveChance, this.positiveSpawnChance + 0.02);
    }

    const node = obj.domNode;
    node.style.animation = 'popCorrect 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    node.style.pointerEvents = 'none';

    if (document.activeElement === node) this.canvas.focus();
    setTimeout(() => {
      if (node.parentNode) this.canvas.removeChild(node);
      const idx = this.elements.indexOf(obj);
      if (idx > -1) this.elements.splice(idx, 1);
    }, 300);
  }

  triggerWrongPop(obj) {
    this.loseLife();

    const node = obj.domNode;
    node.style.animation = 'popWrong 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    node.style.pointerEvents = 'none';

    if (document.activeElement === node) this.canvas.focus();
    setTimeout(() => {
      if (node.parentNode) this.canvas.removeChild(node);
      const idx = this.elements.indexOf(obj);
      if (idx > -1) this.elements.splice(idx, 1);
    }, 400);
  }

  loseLife() {
    this.setLives(this.lives - 1);
    if (this.lives <= 0) this.haltEngine();
  }

  haltEngine() {
    this.isRunning = false;
    this.isPaused = false;
    this.finalScoreDisplay.textContent = this.score;
    this.gameOverScreen.classList.add('active');
    if (this.helpFab) this.helpFab.classList.add('is-hidden');

    const isNew = this.saveBestScore(this.score);
    if (this.rewardMsg) {
      if (this.score > 0) {
        this.rewardMsg.innerHTML = isNew
          ? '<span class="reward-highlight">New personal best!</span>'
          : '';
      } else {
        this.rewardMsg.innerHTML = '';
      }
    }

    this.restartBtn.focus();
  }
}

window.addEventListener('DOMContentLoaded', () => new ThoughtEngine());