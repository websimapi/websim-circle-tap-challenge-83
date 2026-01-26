import { getCustomMaps, deleteCustomMap, getCustomMapLeaderboard } from './custom-maps-api.js';

export class CustomMapsBrowser {
    constructor(elements, ui, game, customLevelCreator, leaderboardController, callbacks) {
        this.elements = elements;
        this.ui = ui;
        this.game = game;
        this.customLevelCreator = customLevelCreator;
        this.leaderboardController = leaderboardController;
        this.callbacks = callbacks || {}; // { onInteraction: () => {} }
        
        this.currentTab = 'browse';
        this.currentSort = 'recent';
        this.maps = [];
        
        this._bindEvents();
    }

    _bindEvents() {
        // Tab switching
        const tabBtns = this.elements.customBrowserView.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.dataset.tab;
                this.loadMaps();
            });
        });

        // Sorting
        const sortSelect = document.getElementById('browser-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadMaps();
            });
        }

        // Close button
        const closeBtn = document.getElementById('close-browser-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Custom Mode Button (Opener)
        const openBtn = document.getElementById('custom-mode-btn');
        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.show();
            });
        }
        
        // Refresh event from creator
        window.addEventListener('refreshCustomMaps', () => {
            if (!this.elements.customBrowserView.classList.contains('hidden')) {
                this.loadMaps();
            }
        });
    }

    show() {
        this.elements.customBrowserView.classList.remove('hidden');
        // Sync sort state with UI
        const sortSelect = document.getElementById('browser-sort-select');
        if (sortSelect) {
            this.currentSort = sortSelect.value;
        }
        this.loadMaps();
    }

    hide() {
        this.elements.customBrowserView.classList.add('hidden');
    }

    async loadMaps() {
        const list = document.getElementById('custom-maps-list');
        list.innerHTML = '<p style="text-align:center; padding:20px;">Loading maps...</p>';
        try {
            this.maps = await getCustomMaps(this.currentTab, this.currentSort);
            this.renderList();
        } catch(e) {
            console.error(e);
            list.innerHTML = '<p style="text-align:center; padding:20px;">Error loading maps.</p>';
        }
    }

    _generatePreviewSvg(points) {
        if (!points || points.length === 0) return '';
        
        // Normalized points are roughly -0.42 to 0.42 centered.
        // Viewbox -0.5 -0.5 1 1 covers it.
        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        
        // Color hash based on shape roughly, or just rainbow
        return `
            <svg viewBox="-0.5 -0.5 1 1" class="map-preview-svg">
                <path d="${pathData}" stroke="white" stroke-width="0.08" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `;
    }

    renderList() {
        const list = document.getElementById('custom-maps-list');
        const isMine = this.currentTab === 'mine';
        
        if (this.maps.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">No maps found.</p>';
            return;
        }

        list.innerHTML = this.maps.map(map => {
            const svgPreview = this._generatePreviewSvg(map.points);
            const playCount = map.playCount || 0;
            
            return `
            <div class="map-card">
                <div class="map-preview-container">
                    ${svgPreview}
                </div>
                <div class="map-content">
                    <div class="map-info">
                        <h3>${map.name}</h3>
                        <div class="meta">
                            <span>by ${map.creator_username}</span>
                            <span>${new Date(map.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="stats">
                             <span class="stat-badge">▶ ${playCount}</span>
                             <span class="stat-badge">❤️ ${map.lives || 3}</span>
                             ${map.drainEnabled ? '<span class="stat-badge drain">⚡</span>' : ''}
                        </div>
                    </div>
                    <div class="map-actions">
                        <button class="play-map-btn" data-id="${map.id}">Play</button>
                        <button class="menu-btn leaderboard-map-btn icon-only" data-id="${map.id}" title="Leaderboard">
                             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h3v7H3v-7zm5-2h3v9H8v-9zm5-6h3v15h-3V5z"></path></svg>
                        </button>
                        ${isMine ? `
                            <button class="edit-map-btn icon-only" data-id="${map.id}" title="Edit/Remix">✏️</button>
                            <button class="delete-map-btn icon-only" data-id="${map.id}" title="Delete">🗑️</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `}).join('');

        this._bindListEvents(list, isMine);
    }

    _bindListEvents(list, isMine) {
        // Play
        list.querySelectorAll('.play-map-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(this.callbacks.onInteraction) this.callbacks.onInteraction();
                const mapId = e.target.dataset.id;
                const map = this.maps.find(m => m.id === mapId);
                this.startCustomGame(map);
            });
        });

        // Leaderboard
        list.querySelectorAll('.leaderboard-map-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const btnEl = e.target.closest('.leaderboard-map-btn');
                const mapId = btnEl.dataset.id;
                const map = this.maps.find(m => m.id === mapId);
                
                this.hide();
                
                // Signal script that origin was custom browser? 
                // We handle this via callback or direct state in script, 
                // but here we just invoke the controller.
                
                // Ideally script.js sets a flag, but we can pass a callback for "back" logic
                // For now, script.js handles the "back" button logic based on global state variables.
                // We'll dispatch an event or just let it happen.
                
                if(this.callbacks.onLeaderboardOpen) this.callbacks.onLeaderboardOpen();

                const scores = await getCustomMapLeaderboard(mapId);
                this.leaderboardController.show('custom_map'); 
                this.leaderboardController.loadLeaderboard('custom_map', scores, `Leaderboard: ${map.name}`);
            });
        });

        if (isMine) {
            // Delete
            list.querySelectorAll('.delete-map-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const btnEl = e.target.closest('.delete-map-btn');
                    const id = btnEl.dataset.id;
                    if(confirm('Delete this map? This cannot be undone.')) {
                        await deleteCustomMap(id);
                        this.loadMaps();
                    }
                });
            });

            // Edit
            list.querySelectorAll('.edit-map-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnEl = e.target.closest('.edit-map-btn');
                    const id = btnEl.dataset.id;
                    const map = this.maps.find(m => m.id === id);
                    this.customLevelCreator.loadForEditing(map);
                });
            });
        }
    }

    startCustomGame(map) {
        this.hide();
        this.game.setMode('custom', map);
        this.game.start('easy'); 
        this.ui.showGameScreen('custom', map);
        this.ui.updateDifficulty('custom');
    }
}