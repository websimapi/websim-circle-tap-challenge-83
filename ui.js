import { generateHeartSVG } from './utils.js';
import { VSUIHandler } from './vs-ui-handler.js';

export class UIController {
    constructor(elements) {
        this.elements = elements;
        this.levelFadeTimeout = null;
        this.gameOverButtonTimeout = null;
        this.restartTextTimeout = null;
        
        this.vsHandler = new VSUIHandler(elements);
    }

    showAbout() {
        if(this.elements.aboutView) {
            this.elements.aboutView.classList.remove('hidden');
            // Defer measurement to ensure layout is ready
            requestAnimationFrame(() => {
                this.fitAboutContent();
            });
        }
    }

    fitAboutContent() {
        const content = this.elements.aboutView.querySelector('.about-content');
        if (!content) return;
        
        // Reset to measure natural size while keeping position
        content.style.transform = 'translate(-50%, -50%) scale(1)';
        
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        
        // Safety margin
        const marginY = 40; 
        const marginX = 20;

        const availableHeight = viewportHeight - marginY;
        const availableWidth = viewportWidth - marginX;
        
        const contentHeight = content.offsetHeight; 
        const contentWidth = content.offsetWidth;
        
        let scale = 1;
        
        if (contentHeight > availableHeight) {
            scale = Math.min(scale, availableHeight / contentHeight);
        }
        
        if (contentWidth > availableWidth) {
            scale = Math.min(scale, availableWidth / contentWidth);
        }

        // Apply scale combined with centering translate
        content.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    hideAbout() {
        if(this.elements.aboutView) this.elements.aboutView.classList.add('hidden');
    }

    showStartMenu() {
        this.elements.startMenu.classList.remove('hidden');
        this.elements.gameOverMenu.classList.add('hidden');
        this.elements.scoreDisplay.classList.add('hidden');
        this.elements.levelDisplay.classList.add('hidden');
        this.elements.vsStatusDisplay.classList.add('hidden');
        if(this.elements.aboutView) this.elements.aboutView.classList.add('hidden');
        const customBrowser = document.getElementById('custom-browser-view');
        if (customBrowser) customBrowser.classList.add('hidden');
        this.resetVSUI();
        this.clearTimeouts(); 
        this.elements.submitScoreBtn.disabled = false;
        this.elements.submitScoreBtn.textContent = 'Submit Score';
    }

    async showGameScreen(mode = 'standard', customSettings = null) {
        this.elements.startMenu.classList.add('hidden');
        this.elements.gameOverMenu.classList.add('hidden');
        this.elements.scoreDisplay.classList.remove('hidden');
        this.elements.levelDisplay.classList.remove('level-out', 'level-in');
        this.elements.difficultyIndicator.classList.remove('hidden');
        
        const hudPfp = document.getElementById('hud-pfp');
        const customHearts = document.getElementById('custom-hearts-container');
        const livesDisplay = document.getElementById('lives-display');
        
        if (mode === 'custom') {
            // New Custom HUD Logic
            this.elements.playerHeartsContainer.classList.add('hidden'); // Use new container instead
            
            const useDrain = customSettings?.drainEnabled !== false;

            if (useDrain) {
                 if (livesDisplay) livesDisplay.classList.add('hidden');
                 if (customHearts) {
                    customHearts.classList.remove('hidden');
                    customHearts.innerHTML = '';
                    for(let i=0; i<3; i++) {
                        customHearts.innerHTML += generateHeartSVG('custom', i);
                    }
                    this.animateHearts(300, 'custom');
                }
            } else {
                if (livesDisplay) livesDisplay.classList.remove('hidden');
                if (customHearts) customHearts.classList.add('hidden');
            }
            
            if (hudPfp) {
                hudPfp.classList.remove('hidden');
                try {
                    const user = await window.websim.getCurrentUser();
                    hudPfp.src = user.avatarUrl || `https://images.websim.com/avatar/${user.username}`;
                } catch(e) {
                    hudPfp.classList.add('hidden');
                }
            }

        } else {
            // Standard Mode
            this.elements.playerHeartsContainer.classList.add('hidden');
            if (hudPfp) hudPfp.classList.add('hidden');
            if (customHearts) customHearts.classList.add('hidden');
            if (livesDisplay) livesDisplay.classList.remove('hidden');
        }

        // Force reflow
        void this.elements.levelDisplay.offsetWidth;
        setTimeout(() => {
            this.elements.levelDisplay.classList.add('level-in');
        }, 50);
    }

    showVSZenScreen() {
        this.elements.startMenu.classList.add('hidden');
        this.elements.gameOverMenu.classList.add('hidden');
        this.elements.scoreDisplay.classList.remove('hidden');
        this.elements.levelDisplay.classList.remove('hidden');
        this.elements.vsStatusDisplay.classList.remove('hidden');
        if (this.elements.vsBackBtn) this.elements.vsBackBtn.classList.remove('hidden');
    }

    showGameOverMenu(score) {
        this.elements.startMenu.classList.add('hidden');
        this.elements.gameOverMenu.classList.remove('hidden');
        this.elements.scoreDisplay.classList.add('hidden');
        this.elements.levelDisplay.classList.remove('level-in', 'level-out');
        this.elements.finalScoreEl.textContent = score;
        
        const gameOverButtons = this.elements.gameOverMenu.querySelectorAll('button');
        gameOverButtons.forEach(btn => btn.disabled = true);

        // Reset submit button text before it appears
        this.elements.submitScoreBtn.textContent = 'Submit Score';

        // Delay Tap to Restart appearance
        if (this.elements.tapToRestart) {
            this.elements.tapToRestart.style.opacity = '0';
            this.elements.tapToRestart.classList.remove('blink');
            
            this.restartTextTimeout = setTimeout(() => {
                this.elements.tapToRestart.style.transition = 'opacity 0.5s ease-in';
                this.elements.tapToRestart.style.opacity = '1';
                
                // Resume blinking after fade in
                this.restartTextTimeout = setTimeout(() => {
                    this.elements.tapToRestart.style.transition = '';
                    this.elements.tapToRestart.style.opacity = '';
                    this.elements.tapToRestart.classList.add('blink');
                    this.restartTextTimeout = null;
                }, 500);
            }, 500);
        }
        
        this.gameOverButtonTimeout = setTimeout(() => {
            gameOverButtons.forEach(btn => btn.disabled = false);
        }, 800); // 0.8 second delay

        this.levelFadeTimeout = setTimeout(() => {
            this.elements.levelDisplay.classList.add('hidden');
        }, 3000);
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

    updateOpponentScore(score) {
        this.vsHandler.updateOpponentScore(score);
    }

    updateOpponentLevel(level) {
        this.vsHandler.updateOpponentLevel(level);
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

    showReplayContainer() {
        this.elements.replayContainer.classList.remove('hidden');
        this.elements.gameOverMenu.classList.add('hidden');
    }

    hideReplayContainer(origin = 'gameover') {
        this.elements.replayContainer.classList.add('hidden');
        if (origin === 'leaderboard') {
            this.elements.leaderboardView.classList.remove('hidden');
        } else {
            this.elements.gameOverMenu.classList.remove('hidden');
        }
    }

    showLeaderboardView() {
        this.elements.startMenu.classList.add('hidden');
        this.elements.gameOverMenu.classList.add('hidden');
        this.elements.leaderboardView.classList.remove('hidden');
    }

    hideLeaderboardView(origin = 'start') {
        this.elements.leaderboardView.classList.add('hidden');
        if (origin === 'gameover') {
            this.elements.gameOverMenu.classList.remove('hidden');
        } else {
            this.elements.startMenu.classList.remove('hidden');
        }
    }

    showPagination() {
        this.elements.leaderboardPagination.classList.remove('hidden');
    }

    hidePagination() {
        this.elements.leaderboardPagination.classList.add('hidden');
    }

    setSubmitButtonState(state, text) {
        this.elements.submitScoreBtn.disabled = state === 'disabled';
        this.elements.submitScoreBtn.textContent = text;
    }

    handleResize() {
        if (this.elements.aboutView && !this.elements.aboutView.classList.contains('hidden')) {
            requestAnimationFrame(() => this.fitAboutContent());
        }
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

    // VS Mode UI Methods
    updateVSLobbyPreview(users) {
        this.vsHandler.updateLobbyPreview(users);
    }

    updateVSStatus(text, show) {
        this.vsHandler.updateStatus(text, show);
    }

    setupVSMatch(opponent) {
        this.vsHandler.setupMatch(opponent);
    }

    updatePlayerHearts(health) {
        this.vsHandler.updatePlayerHearts(health);
    }

    updateOpponentHearts(health) {
        this.vsHandler.updateOpponentHearts(health);
    }

    animateHearts(health, prefix) {
        this.vsHandler.animateHearts(health, prefix);
    }

    resetVSUI() {
        this.vsHandler.reset();
    }
    
    // removed updateVSLobbyPreview() logic
    // removed updateVSStatus() logic
    // removed setupVSMatch() logic
    // removed updatePlayerHearts() logic
    // removed updateOpponentHearts() logic
    // removed animateHearts() logic
    // removed resetVSUI() logic

    clearTimeouts() {
        if (this.levelFadeTimeout) {
            clearTimeout(this.levelFadeTimeout);
            this.levelFadeTimeout = null;
        }
        if (this.gameOverButtonTimeout) {
            clearTimeout(this.gameOverButtonTimeout);
            this.gameOverButtonTimeout = null;
        }
        if (this.restartTextTimeout) {
            clearTimeout(this.restartTextTimeout);
            this.restartTextTimeout = null;
        }
    }
}