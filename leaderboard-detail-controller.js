import { renderDetailHeader, renderDetailList, renderLeaderboardPagination } from './leaderboard-render.js';

export class LeaderboardDetailController {
    constructor(elements, loadReplayCallback) {
        this.elements = elements;
        this.loadReplay = loadReplayCallback;
        
        this.state = {
            active: false,
            data: [], // array of score objects
            currentPage: 1,
            itemsPerPage: 8, 
            userProfile: null,
            currentUser: null 
        };

        this._bindMethods();
        this._addEventListeners();
    }

    _bindMethods() {
        this.handlePaginationClick = this.handlePaginationClick.bind(this);
        this.handleListClick = this.handleListClick.bind(this);
        this.handleBackClick = this.handleBackClick.bind(this);
    }

    _addEventListeners() {
        this.elements.detailBackBtn.addEventListener('click', this.handleBackClick);
        this.elements.detailPagination.addEventListener('click', this.handlePaginationClick);
        this.elements.detailList.addEventListener('click', this.handleListClick);
    }

    show(scores, userProfile, itemsPerPage = 8) {
        this.state.active = true;
        this.state.data = scores;
        this.state.currentPage = 1;
        this.state.itemsPerPage = itemsPerPage;
        this.state.userProfile = userProfile;
        this.state.currentUser = userProfile ? { username: userProfile.username } : null;

        this.elements.leaderboardMainView.classList.add('hidden');
        this.elements.leaderboardDetailView.classList.remove('hidden');
        
        this.elements.detailHeaderContent.innerHTML = renderDetailHeader(userProfile);
        
        this._render();
    }

    hide() {
        this.state.active = false;
        this.state.data = [];
        this.elements.leaderboardDetailView.classList.add('hidden');
        this.elements.leaderboardMainView.classList.remove('hidden');
    }

    setItemsPerPage(count) {
        this.state.itemsPerPage = count;
        if (this.state.active) this._render();
    }

    _render() {
        const { data, currentPage, itemsPerPage } = this.state;
        
        this.elements.detailList.innerHTML = renderDetailList(data, currentPage, itemsPerPage);
        
        const totalPages = Math.ceil(data.length / itemsPerPage);
        if (totalPages > 1) {
            this.elements.detailPagination.innerHTML = renderLeaderboardPagination(totalPages, currentPage, 'detail');
            this.elements.detailPagination.classList.remove('hidden');
        } else {
            this.elements.detailPagination.classList.add('hidden');
        }
    }

    handlePaginationClick(e) {
        if (!e.target.dataset.action) return;
        
        const action = e.target.dataset.action;
        const totalPages = Math.ceil(this.state.data.length / this.state.itemsPerPage);
        let newPage = this.state.currentPage;

        if (action === 'first') newPage = 1;
        else if (action === 'prev') newPage = Math.max(1, newPage - 1);
        else if (action === 'next') newPage = Math.min(totalPages, newPage + 1);
        else if (action === 'last') newPage = totalPages;

        if (newPage !== this.state.currentPage) {
            this.state.currentPage = newPage;
            this._render();
        }
    }

    async handleListClick(e) {
        const watchBtn = e.target.closest('.watch-replay-btn');
        if (watchBtn) {
            e.stopPropagation();
            const scoreIndex = parseInt(watchBtn.dataset.scoreIndex); // Absolute index in the data array
            const gameData = this.state.data[scoreIndex];
            const user = this.state.currentUser;
            
            if (this.loadReplay) {
                await this.loadReplay(gameData, user, watchBtn);
            }
        }
    }

    handleBackClick() {
        this.hide();
    }
}