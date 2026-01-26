import { HUDController } from './ui-hud-controller.js';
import { VSUIController } from './ui-vs-controller.js';

export class UIController {
    constructor(elements) {
        this.elements = elements;
        
        // Initialize Sub-Controllers
        this.hud = new HUDController(elements);
        this.vs = new VSUIController(elements);

        this.gameOverButtonTimeout = null;
        this.restartTextTimeout = null;
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
                 this.hud.setupCustomHearts(true);
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

        this.hud.levelFadeTimeout = setTimeout(() => {
            this.elements.levelDisplay.classList.add('hidden');
        }, 3000);
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

    clearTimeouts() {
        this.hud.clearTimeouts();
        if (this.gameOverButtonTimeout) {
            clearTimeout(this.gameOverButtonTimeout);
            this.gameOverButtonTimeout = null;
        }
        if (this.restartTextTimeout) {
            clearTimeout(this.restartTextTimeout);
            this.restartTextTimeout = null;
        }
    }

    // Delegation to Sub-Controllers
    
    // HUD
    updateScore(score) { this.hud.updateScore(score); }
    updateLives(lives) { this.hud.updateLives(lives); }
    updateLevel(level, isInitial) { this.hud.updateLevel(level, isInitial); }
    updateDifficulty(diff) { this.hud.updateDifficulty(diff); }
    updatePlayerHearts(health) { 
        // Handles both VS and Custom Mode container updates if needed
        this.vs.updatePlayerHearts(health); 
        this.hud.animateHearts(health, 'custom');
    }

    // VS
    updateVSLobbyPreview(users) { this.vs.updateVSLobbyPreview(users); }
    updateVSStatus(text, show) { this.vs.updateVSStatus(text, show); }
    setupVSMatch(opponent) { this.vs.setupVSMatch(opponent); }
    updateOpponentHearts(health) { this.vs.updateOpponentHearts(health); }
    updateOpponentScore(score) { this.vs.updateOpponentScore(score); }
    updateOpponentLevel(level) { this.vs.updateOpponentLevel(level); }
    resetVSUI() { 
        this.vs.resetVSUI(); 
        // Ensure main score is visible if not in menu
        if (this.elements.startMenu.classList.contains('hidden') && this.elements.gameOverMenu.classList.contains('hidden')) {
            this.elements.scoreDisplay.classList.remove('hidden');
        }
    }

    // removed generateHeartSVG usage - moved to utils/controllers
    // removed animateHearts() - moved to controllers
}