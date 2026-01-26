import { generateHeartSVG } from './utils.js';

export class HUDController {
    constructor(elements) {
        this.elements = elements;
        this.levelFadeTimeout = null;
    }

    updateScore(score) {
        if (!this.elements.scoreDisplay.classList.contains('hidden')) {
            this.elements.scoreEl.textContent = score;
        }
        // Always update player VS score just in case
        const playerVsScore = document.getElementById('player-vs-score');
        if (playerVsScore) {
            playerVsScore.textContent = `Score: ${score}`;
        }
    }

    updateLives(lives) {
        const livesDisplay = document.getElementById('lives-display');
        const livesCount = document.getElementById('lives-count');
        if (livesDisplay && livesCount) {
            if (lives === undefined || lives === null) {
                livesDisplay.classList.add('hidden');
            } else {
                livesDisplay.classList.remove('hidden');
                livesCount.textContent = lives === 999 ? '∞' : lives;
            }
        }
    }

    updateLevel(level, isInitial = false) {
        const levelDisplay = this.elements.levelDisplay;
        
        if (isInitial) {
            levelDisplay.classList.remove('hidden'); // Ensure it's visible
            levelDisplay.textContent = level;
            levelDisplay.classList.remove('level-in', 'level-out');
            // Force reflow
            void levelDisplay.offsetWidth;
            setTimeout(() => {
                levelDisplay.classList.add('level-in');
            }, 50);
            return;
        }

        levelDisplay.classList.remove('level-in');
        levelDisplay.classList.add('level-out');

        const onOutAnimationEnd = () => {
            levelDisplay.removeEventListener('animationend', onOutAnimationEnd);
            levelDisplay.textContent = level;
            levelDisplay.classList.remove('level-out');
            levelDisplay.classList.add('level-in');

            const onInAnimationEnd = () => {
                levelDisplay.removeEventListener('animationend', onInAnimationEnd);
                levelDisplay.classList.remove('level-in');
            };
            levelDisplay.addEventListener('animationend', onInAnimationEnd, { once: true });
        };
        levelDisplay.addEventListener('animationend', onOutAnimationEnd, { once: true });
    }

    updateDifficulty(difficulty) {
        // Update top-right indicator
        const indicator = document.getElementById('difficulty-indicator');
        if (indicator) {
            indicator.setAttribute('data-difficulty', difficulty);
            indicator.title = `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
            
            // Handle Custom Icon toggle
            const icon = indicator.querySelector('.custom-icon');
            const bars = indicator.querySelectorAll('.bar');
            
            if (difficulty === 'custom') {
                if(icon) icon.classList.remove('hidden');
                bars.forEach(b => b.classList.add('hidden'));
            } else {
                if(icon) icon.classList.add('hidden');
                bars.forEach(b => b.classList.remove('hidden'));
            }
        }

        // Update buttons
        const allDiffBtns = document.querySelectorAll('.diff-btn');
        allDiffBtns.forEach(btn => {
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    setupCustomHearts(useDrain) {
        const customHearts = document.getElementById('custom-hearts-container');
        if (useDrain) {
            if (customHearts) {
                customHearts.classList.remove('hidden');
                customHearts.innerHTML = '';
                for(let i=0; i<3; i++) {
                    customHearts.innerHTML += generateHeartSVG('custom', i);
                }
                this.animateHearts(300, 'custom');
            }
        } else {
            if (customHearts) customHearts.classList.add('hidden');
        }
    }

    animateHearts(health, prefix) {
         // Reusing logic from VS controller essentially, but keeping separate for HUD specific contexts
        for (let i = 0; i < 3; i++) {
            const heartHealth = Math.max(0, Math.min(100, health - (i * 100)));
            const percentage = heartHealth / 100;
            
            const fillRect = document.querySelector(`#${prefix}-clip-${i} rect`);
            const wrapper = document.querySelector(`#${prefix}-heart-${i}`);
            
            if (fillRect) {
                const y = 24 * (1 - percentage);
                fillRect.setAttribute('y', y);
            }

            if (wrapper) {
                if (percentage === 1) {
                    wrapper.classList.add('heart-pulsing');
                    wrapper.style.filter = '';
                } else if (percentage === 0) {
                    wrapper.classList.remove('heart-pulsing');
                    wrapper.style.filter = 'grayscale(1) brightness(0.5)';
                } else {
                    wrapper.classList.remove('heart-pulsing');
                    wrapper.style.filter = '';
                }
            }
        }
    }

    clearTimeouts() {
        if (this.levelFadeTimeout) {
            clearTimeout(this.levelFadeTimeout);
            this.levelFadeTimeout = null;
        }
    }
}