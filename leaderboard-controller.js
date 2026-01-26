import { fetchLeaderboard, syncScores, fetchUserProfile } from './leaderboard-api.js';
import { renderLeaderboardList, renderLeaderboardPagination, renderMyScores } from './leaderboard-render.js';
import { LeaderboardDetailController } from './leaderboard-detail-controller.js';

export class LeaderboardController {
    constructor(elements, ui, callbacks) {
        this.elements = elements;
        this.ui = ui;
        this.callbacks = callbacks || {}; 
        
        this.state = {
            currentPage: 1,
            totalPages: 1,
            itemsPerPage: 10,
            currentDifficulty: 'easy'
        };

        this.data = {
            rankedPlayers: [],
            cache: { easy: null, medium: null, hard: null }
        };
        
        this.isMyScoresActive = false;
        this.currentUser = null;
        this.userProfile = null;
        
        // Delegated Controller
        this.detailController = new LeaderboardDetailController(elements, (gameData, user, btn) => this._loadReplay(gameData, user, btn));

        this._bindMethods();
        this._addEventListeners();
    }

    _bindMethods() {
        this.handleFilterClick = this.handleFilterClick.bind(this);
        this.handlePaginationClick = this.handlePaginationClick.bind(this);
        this.handleListClick = this.handleListClick.bind(this);
    }

    _addEventListeners() {
        this.elements.leaderboardDifficultyFilters.addEventListener('click', this.handleFilterClick);
        this.elements.leaderboardPagination.addEventListener('click', this.handlePaginationClick);
        this.elements.leaderboardList.addEventListener('click', this.handleListClick);
    }

    async show(difficulty = 'easy') {
        if (this.callbacks.onInteraction) this.callbacks.onInteraction();

        syncScores();
        this.detailController.hide();
        
        this.ui.showLeaderboardView(); 
        this._updateItemsPerPage();

        if (!this._resizeHandler) {
            this._resizeHandler = () => {
                this._updateItemsPerPage();
                if (this.detailController.state.active) {
                    // Just triggering re-render if active through resize
                    // detailController handles its own state
                } else {
                    this._render();
                }
            };
            window.addEventListener('resize', this._resizeHandler);
        }

        this.loadLeaderboard(difficulty);
    }

    _updateItemsPerPage() {
        const containerHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        if (this.elements.leaderboardView) {
            this.elements.leaderboardView.style.height = `${containerHeight}px`;
        }

        const rootStyles = getComputedStyle(document.documentElement);
        const uiScale = parseFloat(rootStyles.getPropertyValue('--ui-scale')) || 1;
        
        const headerEstimatedHeight = 130 * uiScale; 
        const paginationHeight = 80; 
        const safetyBuffer = 20;
        const availableListHeight = Math.max(0, containerHeight - headerEstimatedHeight - paginationHeight - safetyBuffer);
        const itemBaseHeight = 65 * uiScale; 

        let calculatedItems = Math.floor(availableListHeight / itemBaseHeight);
        calculatedItems = Math.max(3, calculatedItems);
        calculatedItems = Math.min(calculatedItems, 8);

        this.state.itemsPerPage = calculatedItems;
        this.detailController.setItemsPerPage(calculatedItems);
    }

    async loadLeaderboard(difficulty, customData = null, customTitle = null) {
        this.state.currentDifficulty = difficulty;
        this.isMyScoresActive = false;
        this.state.currentPage = 1;
        
        this.elements.leaderboardList.innerHTML = '<p>Loading scores...</p>';
        this.ui.hidePagination();
        this.data.rankedPlayers = [];
        
        if (difficulty === 'custom_map') {
            this.elements.leaderboardFilterBtns.forEach(btn => btn.classList.remove('active'));
            if(customTitle && this.elements.leaderboardView.querySelector('h2')) {
                this.elements.leaderboardView.querySelector('h2').textContent = customTitle;
            }
        } else {
             this._updateFilterButtons(difficulty);
             if(this.elements.leaderboardView.querySelector('h2')) {
                this.elements.leaderboardView.querySelector('h2').textContent = "Leaderboard";
            }
        }

        try {
            if (customData) {
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
            
            this.state.totalPages = Math.ceil(this.data.rankedPlayers.length / this.state.itemsPerPage);

            if (this.data.rankedPlayers.length === 0) {
                this.elements.leaderboardList.innerHTML = `<p>No scores recorded yet.</p>`;
                this.ui.hidePagination();
            } else {
                this._render();
                this.ui.showPagination();
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            this.elements.leaderboardList.innerHTML = '<p>Could not load leaderboard.</p>';
            this.ui.hidePagination();
        }
    }

    _updateFilterButtons(activeDifficulty) {
        this.elements.leaderboardFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === activeDifficulty);
        });
        const myScoresBtn = document.getElementById('my-scores-btn');
        if (myScoresBtn) myScoresBtn.classList.remove('active');
    }

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
        this.state.currentPage = 1;
        
        this.elements.leaderboardFilterBtns.forEach(btn => btn.classList.remove('active'));
        targetBtn.classList.add('active');
        
        this.elements.leaderboardList.innerHTML = '<p>Loading your profile...</p>';
        this.ui.hidePagination();

        if (!this.currentUser) {
            try {
                this.currentUser = await window.websim.getCurrentUser();
            } catch {
                 this.elements.leaderboardList.innerHTML = `<p>Could not verify user. Please try again.</p>`;
                 return;
            }
        }

        try {
            this.userProfile = await fetchUserProfile(this.currentUser.username);
            this._render();
        } catch (e) {
            console.error("Error fetching user profile", e);
            this.elements.leaderboardList.innerHTML = `<p>Error loading profile.</p>`;
        }
    }

    _render() {
        this.elements.leaderboardList.style.transform = '';
        this.elements.leaderboardList.style.transformOrigin = 'top center';
        this.elements.leaderboardList.style.width = '100%';
        this.elements.leaderboardList.style.height = ''; 
        this.elements.leaderboardList.style.display = 'flex';
        this.elements.leaderboardList.style.flexDirection = 'column';

        if (this.isMyScoresActive) {
            this.elements.leaderboardList.innerHTML = renderMyScores(this.userProfile);
            this.ui.hidePagination();
            
            setTimeout(() => {
                const container = this.elements.leaderboardList;
                const availableHeight = container.offsetHeight;
                const contentHeight = container.scrollHeight;
                if (contentHeight > availableHeight + 2 && availableHeight > 0) {
                     const scale = (availableHeight - 10) / contentHeight; 
                     container.style.transform = `scale(${scale})`;
                     container.style.width = `${100 / scale}%`; 
                }
            }, 50);
            return;
        }

        const { currentPage, itemsPerPage } = this.state;
        let dataToRender = this.data.rankedPlayers;
        
        this.elements.leaderboardList.innerHTML = renderLeaderboardList(dataToRender, currentPage, itemsPerPage);
        
        const totalPages = Math.ceil(dataToRender.length / itemsPerPage);
        this.state.totalPages = totalPages;

        if (totalPages > 1) {
            this.elements.leaderboardPagination.innerHTML = renderLeaderboardPagination(totalPages, currentPage, 'main');
            this.ui.showPagination();
        } else {
            this.ui.hidePagination();
        }
    }

    handlePaginationClick(e) {
        if (!e.target.dataset.action) return;
        
        const action = e.target.dataset.action;
        const { currentPage, totalPages } = this.state;
        let newPage = currentPage;
        
        if (action === 'first') newPage = 1;
        else if (action === 'prev') newPage = Math.max(1, currentPage - 1);
        else if (action === 'next') newPage = Math.min(totalPages, currentPage + 1);
        else if (action === 'last') newPage = totalPages;

        if (newPage !== currentPage) {
            this.state.currentPage = newPage;
            this._render();
        }
    }

    async handleListClick(e) {
        const watchBtn = e.target.closest('.watch-replay-btn');
        const entry = e.target.closest('.leaderboard-entry');
        const myScoreCard = e.target.closest('.my-score-entry');

        if (watchBtn) {
            e.stopPropagation();
            await this._handleReplayClick(watchBtn);
            return;
        } 

        if (entry) {
            const index = entry.dataset.index;
            const player = this.data.rankedPlayers[index];
            if (player) {
                try {
                    this.elements.detailHeaderContent.innerHTML = '<div style="font-size:0.8rem;">Loading profile...</div>';
                    
                    const profile = await fetchUserProfile(player.username);
                    const userProfile = profile || { username: player.username };
                    this.detailController.show(player.allScores, userProfile, this.state.itemsPerPage);
                } catch (e) {
                    console.error("Error fetching detail profile", e);
                    this.detailController.show(player.allScores, { username: player.username }, this.state.itemsPerPage);
                }
            }
        }
        
        if (myScoreCard) {
            const diff = myScoreCard.dataset.difficulty;
            const scores = (this.userProfile && this.userProfile[diff]) ? this.userProfile[diff] : [];
            scores.sort((a,b) => b.score - a.score);
            this.detailController.show(scores, this.userProfile, this.state.itemsPerPage);
        }
    }

    close() {
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
    }

    async _handleReplayClick(watchBtn) {
        const index = watchBtn.dataset.index;
        const playerData = this.data.rankedPlayers[index];
        const user = { username: playerData.username };
        const gameData = playerData.bestGameData;

        await this._loadReplay(gameData, user, watchBtn);
    }

    async _loadReplay(gameData, user, btn) {
        if (!gameData || !gameData.replayDataUrl) return;

        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span style="font-size: 0.6rem;">...</span>'; 
        btn.disabled = true;

        try {
            const response = await fetch(gameData.replayDataUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const replayData = await response.json();

            if (!replayData.config.currentUser) {
                replayData.config.currentUser = {
                    username: user.username,
                    avatar_url: `https://images.websim.com/avatar/${user.username}`
                };
            }

            if (this.callbacks.onReplay) {
                this.callbacks.onReplay(replayData);
            }
        } catch (fetchError) {
            console.error("Error fetching replay data:", fetchError);
            alert("Could not load replay.");
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }

    // removed Detail State management - moved to leaderboard-detail-controller.js
    // removed Detail Event Handlers - moved to leaderboard-detail-controller.js
}