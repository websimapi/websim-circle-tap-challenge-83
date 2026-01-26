export class LeaderboardPagination {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.itemsPerPage = 10;
    }

    setItemsPerPage(count) {
        this.itemsPerPage = count;
        // Re-validate current page in case total pages changed
        if (this.totalPages > 0 && this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }
    }

    update(totalItems) {
        this.totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        if (this.currentPage < 1) this.currentPage = 1;
    }

    calculateNewPage(action) {
        let newPage = this.currentPage;
        if (action === 'first') newPage = 1;
        else if (action === 'prev') newPage = Math.max(1, this.currentPage - 1);
        else if (action === 'next') newPage = Math.min(this.totalPages, this.currentPage + 1);
        else if (action === 'last') newPage = this.totalPages;
        return newPage;
    }
    
    setPage(page) {
        this.currentPage = page;
    }
    
    reset() {
        this.currentPage = 1;
    }
}