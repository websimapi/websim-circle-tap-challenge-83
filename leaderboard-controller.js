import { fetchLeaderboard, syncScores, fetchUserProfile } from './leaderboard-api.js';
import { LeaderboardReplayHandler } from './leaderboard-replay-handler.js';
import { LeaderboardPagination } from './leaderboard-pagination.js';
import { LeaderboardUIManager } from './leaderboard-ui-manager.js';

// removed render functions (delegated to LeaderboardUIManager)

export class LeaderboardController {
    constructor(elements, ui, callbacks) {
        this.elements = elements;
        this.ui = ui;
        this.callbacks = callbacks || {}; 
        
        this.replayHandler = new LeaderboardReplayHandler({
            onReplayLoaded: (data) => {
                if (this.callbacks.onReplay) this.callbacks.onReplay(data);
            }
        });

        // Instantiate Helpers
        this.mainPagination = new LeaderboardPagination();
        this.detailPagination = new LeaderboardPagination();
        this.uiManager = new LeaderboardUIManager(elements);

        this.currentDifficulty = 'easy';
        
        this.detailState = {
            active: false,
            data: [], 
            userProfile: null,
            currentUser: null 
        };
        
        this.data = {
            rankedPlayers: [],
            cache: { easy: null, medium: null, hard: null }
        };
        
        this.isMyScoresActive = false;
        this.currentUser = null;
        this.userProfile = null;
        
        this._bindEvents();
    }

    _bindEvents() {
        this.elements.leaderboardDifficultyFilters.addEventListener('click', (e) => this.handleFilterClick(e));
        
        this.elements.leaderboardPagination.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if(action) {
                const newPage = this.mainPagination.calculateNewPage(action);
                if(newPage !== this.mainPagination.currentPage) {
                    this.mainPagination.setPage(newPage);
                    this._render();
                }
            }
        });

        this.elements.leaderboardList.addEventListener('click', (e) => this.handleListClick(e));
        
        this.elements.detailBackBtn.addEventListener('click', () => this.hideDetailView());
        
        this.elements.detailPagination.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if(action) {
                const newPage = this.detailPagination.calculateNewPage(action);
                if(newPage !== this.detailPagination.currentPage) {
                    this.detailPagination.setPage(newPage);
                    this._renderDetail();
                }
            }
        });

        this.elements.detailList.addEventListener('click', (e) => this.handleDetailListClick(e));
    }

    async show(difficulty = 'easy') {
        if (this.callbacks.onInteraction) this.callbacks.onInteraction();

        syncScores();
        this.hideDetailView(); 
        
        this.ui.showLeaderboardView(); 
        this._updateLayout();

        if (!this._resizeHandler) {
            this._resizeHandler = () => {
                this._updateLayout();
                if (this.detailState.active) {
                    this._renderDetail();
                } else {
                    this._render();
                }
            };
            window.addEventListener('resize', this._resizeHandler);
        }

        this.loadLeaderboard(difficulty);
    }

    _updateLayout() {
        const items = this.uiManager.calculateItemsPerPage();
        this.mainPagination.setItemsPerPage(items);
        this.detailPagination.setItemsPerPage(items);
    }
    // removed _updateItemsPerPage (moved to uiManager.calculateItemsPerPage)

    async loadLeaderboard(difficulty, customData = null, customTitle = null) {
        this.currentDifficulty = difficulty;
        this.isMyScoresActive = false;
        this.mainPagination.reset();
        
        this.uiManager.setLoading('Loading scores...');
        this.data.rankedPlayers = [];
        
        this.uiManager.setTitle(customTitle || "Leaderboard");
        this.uiManager.updateFilterButtons(difficulty, false);

        try {
            if (customData) {
                // Flatten custom scores into ranked players structure if needed, or simply render them.
                // Reusing renderMainList logic expects aggregated player data.
                const players = {};
                customData.forEach(score => {
                    if (!players[score.username]) {
                        players[score.username] = { username: score.username, allScores: [] };
                    }
                    players[score.username].allScores.push(score);
                });
                
                this.data.rankedPlayers = Object.values(players).map(p => {
                    const best = p.allScores.reduce((b, c) => c.score > b.score ? c : b, p.allScores[0]);
                    return {
                        username: p.username,
                        highestScore: best.score,
                        bestLevel: best.level || 1,
                        gamesPlayed: p.allScores.length,
                        bestGameData: best,
                        allScores: p.allScores
                    };
                }).sort((a,b) => b.highestScore - a.highestScore);
                
            } else {
                if (this.data.cache[difficulty]) {
                    this.data.rankedPlayers = this.data.cache[difficulty];
                } else {
                    this.data.rankedPlayers = await fetchLeaderboard(difficulty);
                    this.data.cache[difficulty] = this.data.rankedPlayers;
                }
            }
            
            this.mainPagination.update(this.data.rankedPlayers.length);

            if (this.data.rankedPlayers.length === 0) {
                this.uiManager.setLoading('No scores recorded yet.');
            } else {
                this._render();
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            this.uiManager.setLoading('Could not load leaderboard.');
        }
    }
    
    // removed _updateFilterButtons (moved to uiManager)

    async handleFilterClick(e) {
        const targetBtn = e.target.closest('.leaderboard-filter-btn');
        if (!targetBtn || targetBtn.classList.contains('active')) return;
        
        const difficulty = targetBtn.dataset.difficulty;

        if (difficulty === 'mine') {
            await this._switchToMyScores(targetBtn);
        } else {
            this.loadLeaderboard(difficulty);
        }
    }

    async _switchToMyScores(targetBtn) {
        this.isMyScoresActive = true;
        this.mainPagination.reset();
        
        this.uiManager.updateFilterButtons(null, true); // Highlights My Scores button
        
        this.uiManager.setLoading('Loading your profile...');

        if (!this.currentUser) {
            try {
                this.currentUser = await window.websim.getCurrentUser();
            } catch {
                 this.uiManager.setLoading('Could not verify user.');
                 return;
            }
        }

        try {
            this.userProfile = await fetchUserProfile(this.currentUser.username);
            this._render();
        } catch (e) {
            console.error("Error fetching user profile", e);
            this.uiManager.setLoading('Error loading profile.');
        }
    }

    _render() {
        this.uiManager.renderMainList(
            this.data.rankedPlayers,
            this.mainPagination,
            this.isMyScoresActive,
            this.userProfile
        );
    }
    
    // removed handlePaginationClick (event logic in constructor, calculation in pagination class)

    // --- Detail View Logic ---

    showDetailView(scores, userProfile) {
        this.detailState.active = true;
        this.detailState.data = scores;
        this.detailPagination.reset();
        this.detailPagination.update(scores.length);
        
        this.detailState.userProfile = userProfile;
        this.detailState.currentUser = userProfile ? { username: userProfile.username } : null;

        this.uiManager.showDetailView(userProfile);
        this._renderDetail();
    }

    hideDetailView() {
        this.detailState.active = false;
        this.detailState.data = [];
        this.uiManager.showMainView();
    }

    _renderDetail() {
        this.uiManager.renderDetailList(this.detailState.data, this.detailPagination);
    }

    // removed handleDetailPaginationClick

    async handleListClick(e) {
        const watchBtn = e.target.closest('.watch-replay-btn');
        const entry = e.target.closest('.leaderboard-entry');
        const myScoreCard = e.target.closest('.my-score-entry');

        if (watchBtn) {
            e.stopPropagation();
            const index = watchBtn.dataset.index;
            const playerData = this.data.rankedPlayers[index];
            const user = { username: playerData.username };
            const gameData = playerData.bestGameData;
            
            await this.replayHandler.handleReplayClick(watchBtn, gameData, user);
            return;
        } 

        if (entry) {
            const index = entry.dataset.index;
            const player = this.data.rankedPlayers[index];
            if (player) {
                try {
                    // Slight hack to update header while loading
                    // In a real app we might add a specific UI manager method for "Loading Profile..."
                    
                    const profile = await fetchUserProfile(player.username);
                    const userProfile = profile || { username: player.username };
                    this.showDetailView(player.allScores, userProfile);
                } catch (e) {
                    console.error("Error fetching detail profile", e);
                    this.showDetailView(player.allScores, { username: player.username });
                }
            }
        }
        
        if (myScoreCard) {
            const diff = myScoreCard.dataset.difficulty;
            const scores = (this.userProfile && this.userProfile[diff]) ? this.userProfile[diff] : [];
            scores.sort((a,b) => b.score - a.score);
            this.showDetailView(scores, this.userProfile);
        }
    }

    async handleDetailListClick(e) {
        const watchBtn = e.target.closest('.watch-replay-btn');
        if (watchBtn) {
            e.stopPropagation();
            const scoreIndex = parseInt(watchBtn.dataset.scoreIndex);
            const gameData = this.detailState.data[scoreIndex];
            const user = this.detailState.currentUser;
            
            await this.replayHandler.handleReplayClick(watchBtn, gameData, user);
        }
    }

    // removed handleBackClick (inline in constructor)

    close() {
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
    }
}