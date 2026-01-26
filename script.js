import { Game } from './game.js';
import { UIController } from './ui.js';
import { submitScore, migrateUserScores } from './leaderboard-api.js';
import { showReplay, hideReplay } from './replay.js';
import { playBackgroundMusic, fadeInMusic, fadeOutMusic, stopMusicForReplay, setMusicMuted, setSFXMuted } from './audio.js';
import { LeaderboardController } from './leaderboard-controller.js';
import { InputController } from './input-controller.js';
import { VSManager } from './vs-manager.js';
import { CustomLevelCreator } from './custom-level-creator.js';
import { saveCustomMapScore } from './custom-maps-api.js';
import { CustomMapsBrowser } from './custom-maps-browser.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    let hasInteracted = false;

    const handleFirstInteraction = () => {
        if (!hasInteracted) {
            hasInteracted = true;
            playBackgroundMusic();
        }
    };
    
    // UI Elements map
    const elements = {
        scoreDisplay: document.getElementById('score-display'),
        scoreEl: document.getElementById('score'),
        levelDisplay: document.getElementById('level-display'),
        startMenu: document.getElementById('start-menu'),
        gameOverMenu: document.getElementById('game-over-menu'),
        finalScoreEl: document.getElementById('final-score'),
        homeBtn: document.getElementById('home-btn'),
        difficultyBtns: document.querySelectorAll('.difficulty-btn'),
        replayBtn: document.getElementById('replay-btn'),
        replayContainer: document.getElementById('replay-container'),
        closeReplayBtn: document.getElementById('close-replay-btn'),
        submitScoreBtn: document.getElementById('submit-score-btn'),
        leaderboardBtn: document.getElementById('leaderboard-btn'),
        leaderboardView: document.getElementById('leaderboard-view'),
        closeLeaderboardBtn: document.getElementById('close-leaderboard-btn'),
        leaderboardMainView: document.getElementById('leaderboard-main-view'),
        leaderboardList: document.getElementById('leaderboard-list'),
        leaderboardDifficultyFilters: document.getElementById('leaderboard-difficulty-filters'),
        leaderboardFilterBtns: document.querySelectorAll('.leaderboard-filter-btn'),
        leaderboardPagination: document.getElementById('leaderboard-pagination'),
        
        leaderboardDetailView: document.getElementById('leaderboard-detail-view'),
        detailList: document.getElementById('detail-list'),
        detailPagination: document.getElementById('detail-pagination'),
        detailBackBtn: document.getElementById('detail-back-btn'),
        detailHeaderContent: document.getElementById('detail-header-content'),

        musicToggleBtn: document.getElementById('music-toggle-btn'),
        tapToRestart: document.getElementById('tap-to-restart'),

        // VS Elements
        vsBackBtn: document.getElementById('vs-back-btn'),
        vsModeBtn: document.getElementById('vs-mode-btn'),
        playerHeartsContainer: document.getElementById('player-hearts-container'),
        playerHearts: document.getElementById('player-hearts'),
        opponentView: document.getElementById('opponent-view'),
        difficultyIndicator: document.getElementById('difficulty-indicator'),
        vsStatusDisplay: document.getElementById('vs-status-display'),

        // About view
        aboutBtn: document.getElementById('about-btn'),
        aboutView: document.getElementById('about-view'),
        closeAboutBtn: document.getElementById('close-about-btn')
    };

    const game = new Game(canvas);
    const ui = new UIController(elements);
    const vsManager = new VSManager(game, ui);
    const customCreator = new CustomLevelCreator(ui);

    // Link game to VS manager
    game.vsManagerUpdate = (dt) => vsManager.updateGameLoop(dt);
    
    let replayOrigin = 'gameover'; // 'gameover' or 'leaderboard'
    let leaderboardOrigin = 'start';
    let currentDifficulty = 'easy';

    // Initialize Controllers
    const leaderboardController = new LeaderboardController(elements, ui, {
        onReplay: (replayData) => {
            replayOrigin = 'leaderboard';
            stopMusicForReplay(); // Instant stop
            elements.leaderboardView.classList.add('hidden');
            ui.showReplayContainer();
            showReplay(replayData);
        },
        onInteraction: handleFirstInteraction
    });

    const customBrowser = new CustomMapsBrowser(elements, ui, game, customCreator, leaderboardController, handleFirstInteraction);

    const inputController = new InputController(game, handleFirstInteraction);
    inputController.init();

    // Set up game callbacks
    game.onScoreUpdate = (score) => ui.updateScore(score);
    game.onLivesUpdate = (lives) => ui.updateLives(lives);
    game.onLevelUp = (level, isInitial) => {
        ui.updateLevel(level, isInitial);
    };
    
    // Hook for VS/Custom health updates
    const originalGameLoop = game.gameLoop.bind(game);
    game.gameLoop = (t) => {
        originalGameLoop(t);
        if (game.mode === 'vs' || game.mode === 'custom') {
            ui.updatePlayerHearts(game.health);
        }
    };

    game.onGameOver = (gameData) => {
        if (gameData.mode === 'vs') {
            const resultText = gameData.result === 'win' ? 'VICTORY' : 'DEFEAT';
            ui.showGameOverMenu(resultText);
            elements.finalScoreEl.textContent = resultText;
            elements.finalScoreEl.style.color = gameData.result === 'win' ? 'var(--success-color)' : 'var(--fail-color)';
        } else {
            ui.showGameOverMenu(gameData.score);
            elements.finalScoreEl.style.color = '';
        }
    };

    // --- EVENT LISTENERS ---

    // Difficulty Selection
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            handleFirstInteraction(); 
            const difficulty = btn.dataset.difficulty;
            currentDifficulty = difficulty;
            ui.updateDifficulty(difficulty);
            game.setDifficulty(difficulty);
        });
    });

    // VS Mode Interactions
    if (elements.vsModeBtn) {
        elements.vsModeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleFirstInteraction();
            vsManager.startSeeking();
            ui.showVSZenScreen();
            game.start('easy'); 
        });
    }

    const vsLobbyPreview = document.getElementById('vs-lobby-preview');
    if (vsLobbyPreview) {
        vsLobbyPreview.addEventListener('click', (e) => {
            const wrapper = e.target.closest('.lobby-avatar-container');
            if (wrapper && wrapper.dataset.clientId) {
                e.stopPropagation();
                handleFirstInteraction();
                
                const success = vsManager.directChallenge(wrapper.dataset.clientId);
                if (success) {
                    ui.showVSZenScreen();
                    game.start('easy'); 
                } else {
                    // Feedback
                    const tts = document.getElementById('tap-to-start');
                    if (tts) {
                        const originalText = tts.innerText;
                        tts.innerText = "PLAYER BUSY";
                        tts.style.color = 'var(--fail-color)';
                        tts.classList.remove('blink');
                        setTimeout(() => {
                            tts.innerText = originalText;
                            tts.style.color = '';
                            tts.classList.add('blink');
                        }, 1500);
                    }
                }
            }
        });
    }

    if (elements.vsBackBtn) {
        elements.vsBackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleFirstInteraction();
            if (game.mode === 'zen') {
                vsManager.cancelSeeking();
                ui.showStartMenu();
                game.setMode('standard');
                game.reset();
            }
        });
    }

    // --- Custom Map Events handled by CustomMapsBrowser class ---
    // Listen for custom leaderboard requests
    window.addEventListener('openCustomLeaderboard', (e) => {
        leaderboardOrigin = e.detail.origin;
        leaderboardController.show('custom_map');
        leaderboardController.loadLeaderboard('custom_map', e.detail.scores, e.detail.title);
    });

    // Tap to Start
    elements.startMenu.addEventListener('click', (e) => {
        if (e.target.closest('.difficulty-selector') || e.target.closest('.vs-btn')) return;
        
        handleFirstInteraction();
        game.start(currentDifficulty);
        ui.showGameScreen();
    });

    // Game Over Menu Tap to Restart
    elements.gameOverMenu.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('.difficulty-selector')) return;
        if (elements.tapToRestart && elements.tapToRestart.style.opacity === '0') return;

        ui.clearTimeouts();
        game.reset();
        
        if (game.mode === 'vs') {
             ui.showStartMenu(); 
        } else {
            ui.showGameScreen();
            game.start(currentDifficulty);
        }
    });

    // Home button
    elements.homeBtn.addEventListener('click', () => {
        if (game.mode === 'zen' || game.mode === 'vs') {
            vsManager.cancelSeeking();
        }
        if (game.mode === 'custom') {
            game.setMode('standard');
            ui.updateLives(null);
        }
        
        ui.clearTimeouts();
        game.setMode('standard');
        game.reset();
        ui.showStartMenu();
    });

    // Replay button
    elements.replayBtn.addEventListener('click', async () => {
        handleFirstInteraction();
        replayOrigin = 'gameover';
        stopMusicForReplay(); 
        ui.showReplayContainer();
        
        if (!game.replayConfig.currentUser) {
            try {
                const currentUser = await window.websim.getCurrentUser();
                game.replayConfig.currentUser = currentUser;
            } catch (error) {
                game.replayConfig.currentUser = null;
            }
        }

        showReplay({
            frames: game.replayFrames,
            config: game.replayConfig
        });
    });

    elements.closeReplayBtn.addEventListener('click', () => {
        ui.hideReplayContainer(replayOrigin);
        hideReplay();
        fadeInMusic();
    });

    // Submit score button
    elements.submitScoreBtn.addEventListener('click', async () => {
        ui.setSubmitButtonState('disabled', 'Submitting...');
        const data = game.lastGameData;

        // Custom Map Score Submission
        if (data.mode === 'custom' && game.customMapData) {
            try {
                let replayUrl = null;
                if (data.replayData) {
                     const replayJson = JSON.stringify(data.replayData);
                     const replayBlob = new Blob([replayJson], { type: 'application/json' });
                     const replayFile = new File([replayBlob], 'replay.json');
                     replayUrl = await window.websim.upload(replayFile);
                }

                await saveCustomMapScore(game.customMapData.id, {
                    score: data.score,
                    level: data.level,
                    timestamp: data.timestamp,
                    replayDataUrl: replayUrl
                });
                ui.setSubmitButtonState('disabled', 'Submitted!');
            } catch (e) {
                ui.setSubmitButtonState('disabled', 'Error!');
                setTimeout(() => { ui.setSubmitButtonState('enabled', 'Submit Score'); }, 2000);
            }
            return;
        }

        // Standard Submission
        await submitScore(
            data,
            () => ui.setSubmitButtonState('disabled', 'Submitted!'),
            () => {
                ui.setSubmitButtonState('disabled', 'Error!');
                setTimeout(() => {
                    ui.setSubmitButtonState('enabled', 'Submit Score');
                }, 2000);
            }
        );
    });

    // Audio Toggle
    let audioState = 0; 
    elements.musicToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleFirstInteraction();
        
        audioState = (audioState + 1) % 3;
        
        const onIcon = elements.musicToggleBtn.querySelector('.audio-on');
        const musicOffIcon = elements.musicToggleBtn.querySelector('.music-off');
        const allOffIcon = elements.musicToggleBtn.querySelector('.audio-off');
        
        if (audioState === 0) {
            setMusicMuted(false);
            setSFXMuted(false);
            onIcon.classList.remove('hidden');
            musicOffIcon.classList.add('hidden');
            allOffIcon.classList.add('hidden');
            elements.musicToggleBtn.style.color = '';
        } else if (audioState === 1) {
            setMusicMuted(true);
            setSFXMuted(false);
            onIcon.classList.add('hidden');
            musicOffIcon.classList.remove('hidden');
            allOffIcon.classList.add('hidden');
            elements.musicToggleBtn.style.color = 'var(--fail-color)';
        } else {
            setMusicMuted(true);
            setSFXMuted(true);
            onIcon.classList.add('hidden');
            musicOffIcon.classList.add('hidden');
            allOffIcon.classList.remove('hidden');
            elements.musicToggleBtn.style.color = '';
        }
    });

    // Leaderboard button
    elements.leaderboardBtn.addEventListener('click', () => {
        leaderboardOrigin = 'gameover';
        leaderboardController.show('easy');
    });

    const startLeaderboardBtn = document.getElementById('start-leaderboard-btn');
    if (startLeaderboardBtn) {
        startLeaderboardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            leaderboardOrigin = 'start';
            leaderboardController.show('easy');
        });
    }

    // About Button
    if (elements.aboutBtn) {
        elements.aboutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            ui.showAbout();
        });
    }

    if (elements.closeAboutBtn) {
        elements.closeAboutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            ui.hideAbout();
        });
    }

    elements.closeLeaderboardBtn.addEventListener('click', () => {
        ui.hideLeaderboardView(leaderboardOrigin);
        leaderboardController.close();
        if (leaderboardOrigin === 'custom-browser') {
            document.getElementById('custom-browser-view').classList.remove('hidden');
        }
    });

    // Responsive UI Scaling
    const updateUIScale = () => {
        const minDim = Math.min(window.innerWidth, window.innerHeight);
        const scale = Math.min(Math.max(minDim / 450, 0.6), 1.2);
        document.documentElement.style.setProperty('--ui-scale', scale);
    };

    window.addEventListener('resize', () => {
        game.resizeCanvas();
        updateUIScale();
        ui.handleResize();
    });

    // Initial setup
    updateUIScale();
    game.reset();
    ui.updateDifficulty(currentDifficulty);
    game.setDifficulty(currentDifficulty);
    migrateUserScores();
});

// removed custom maps browser inline logic - moved to custom-maps-browser.js
```Summary: Refactored `script.js`, `ui.js`, and `leaderboard-controller.js` by breaking them down into modular controllers. Created `ui-hud-controller.js`, `ui-vs-controller.js`, `leaderboard-detail-controller.js`, and `custom-maps-browser.js` to handle specific logic for HUD, VS UI, Leaderboard Details, and Custom Map browsing respectively. Updates the main files to delegate to these new classes, reducing file size and improving maintainability.