import { renderLeaderboardList, renderLeaderboardPagination, renderMyScores, renderDetailList, renderDetailHeader } from './leaderboard-render.js';

export class LeaderboardUIManager {
    constructor(elements) {
        this.elements = elements;
    }

    calculateItemsPerPage() {
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
        
        // Base item height is approx 65px (padding + content) * uiScale
        const itemBaseHeight = 65 * uiScale; 

        let calculatedItems = Math.floor(availableListHeight / itemBaseHeight);
        
        // Clamp: Min 3 items to be usable, max 8 for aesthetics
        calculatedItems = Math.max(3, calculatedItems);
        calculatedItems = Math.min(calculatedItems, 8);

        return calculatedItems;
    }

    showMainView() {
        this.elements.leaderboardDetailView.classList.add('hidden');
        this.elements.leaderboardMainView.classList.remove('hidden');
    }

    showDetailView(userProfile) {
        this.elements.leaderboardMainView.classList.add('hidden');
        this.elements.leaderboardDetailView.classList.remove('hidden');
        this.elements.detailHeaderContent.innerHTML = renderDetailHeader(userProfile);
    }

    setLoading(message) {
        this.elements.leaderboardList.innerHTML = `<p>${message}</p>`;
        this.hideMainPagination();
    }

    setTitle(text) {
        const h2 = this.elements.leaderboardView.querySelector('h2');
        if (h2) h2.textContent = text || "Leaderboard";
    }

    updateFilterButtons(activeDifficulty, isMyScores) {
        if (activeDifficulty === 'custom_map') {
            this.elements.leaderboardFilterBtns.forEach(btn => btn.classList.remove('active'));
            const myScoresBtn = document.getElementById('my-scores-btn');
            if (myScoresBtn) myScoresBtn.classList.remove('active');
            return;
        }

        this.elements.leaderboardFilterBtns.forEach(btn => {
            btn.classList.toggle('active', !isMyScores && btn.dataset.difficulty === activeDifficulty);
        });
        
        const myScoresBtn = document.getElementById('my-scores-btn');
        if (myScoresBtn) {
            if (isMyScores) myScoresBtn.classList.add('active');
            else myScoresBtn.classList.remove('active');
        }
    }

    renderMainList(data, pagination, isMyScores, userProfile) {
        // Reset scaling
        this.elements.leaderboardList.style.transform = '';
        this.elements.leaderboardList.style.transformOrigin = 'top center';
        this.elements.leaderboardList.style.width = '100%';
        this.elements.leaderboardList.style.height = ''; 
        this.elements.leaderboardList.style.display = 'flex';
        this.elements.leaderboardList.style.flexDirection = 'column';

        if (isMyScores) {
            this.elements.leaderboardList.innerHTML = renderMyScores(userProfile);
            this.hideMainPagination();
            this._autoScaleList();
        } else {
            const { currentPage, itemsPerPage } = pagination;
            this.elements.leaderboardList.innerHTML = renderLeaderboardList(data, currentPage, itemsPerPage);
            
            if (pagination.totalPages > 1) {
                this.elements.leaderboardPagination.innerHTML = renderLeaderboardPagination(pagination.totalPages, currentPage, 'main');
                this.showMainPagination();
            } else {
                this.hideMainPagination();
            }
        }
    }

    renderDetailList(data, pagination) {
        const { currentPage, itemsPerPage } = pagination;
        this.elements.detailList.innerHTML = renderDetailList(data, currentPage, itemsPerPage);
        
        if (pagination.totalPages > 1) {
            this.elements.detailPagination.innerHTML = renderLeaderboardPagination(pagination.totalPages, currentPage, 'detail');
            this.elements.detailPagination.classList.remove('hidden');
        } else {
            this.elements.detailPagination.classList.add('hidden');
        }
    }

    _autoScaleList() {
        // Auto-scale "My Scores" if it overflows
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
    }

    showMainPagination() {
        this.elements.leaderboardPagination.classList.remove('hidden');
    }

    hideMainPagination() {
        this.elements.leaderboardPagination.classList.add('hidden');
    }
}