import { getCustomMaps, deleteCustomMap, getCustomMapLeaderboard } from './custom-maps-api.js';

export class CustomMapsBrowser {
    constructor(elements, ui, game, customCreator, leaderboardController, onInteraction) {
        this.elements = elements; // Needed for specific IDs
        this.ui = ui;
        this.game = game;
        this.customCreator = customCreator;
        this.leaderboardController = leaderboardController;
        this.onInteraction = onInteraction;
        
        this.view = document.getElementById('custom-browser-view');
        this.listContainer = document.getElementById('custom-maps-list');
        this.currentTab = 'browse';
        
        this._bindEvents();
    }

    _bindEvents() {
        // Mode Button (Entry Point)
        const customModeBtn = document.getElementById('custom-mode-btn');
        if (customModeBtn) {
            customModeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.view.classList.remove('hidden');
                this.loadCustomMaps(this.currentTab);
            });
        }

        // Close Button
        const closeBtn = document.getElementById('close-browser-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.view.classList.add('hidden');
            });
        }

        // Tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.dataset.tab;
                this.loadCustomMaps(this.currentTab);
            });
        });

        // Global refresh event
        window.addEventListener('refreshCustomMaps', () => {
            if (!this.view.classList.contains('hidden')) {
                this.loadCustomMaps(this.currentTab);
            }
        });
    }

    async loadCustomMaps(filter) {
        this.listContainer.innerHTML = '<p>Loading maps...</p>';
        try {
            const maps = await getCustomMaps(filter);
            this.renderCustomMapsList(maps, filter === 'mine');
        } catch(e) {
            this.listContainer.innerHTML = '<p>Error loading maps.</p>';
        }
    }

    renderCustomMapsList(maps, isMine) {
        if (maps.length === 0) {
            this.listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">No maps found.</p>';
            return;
        }

        this.listContainer.innerHTML = maps.map(map => `
            <div class="map-card">
                <div class="map-info">
                    <h3>${map.name}</h3>
                    <div class="meta">
                        <span>by ${map.creator_username}</span>
                        <span>• ${new Date(map.created_at).toLocaleDateString()}</span>
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
        `).join('');

        this._bindCardEvents(maps, isMine);
    }

    _bindCardEvents(maps, isMine) {
        this.listContainer.querySelectorAll('.play-map-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(this.onInteraction) this.onInteraction(); 
                const mapId = e.target.dataset.id;
                const map = maps.find(m => m.id === mapId);
                this.startCustomGame(map);
            });
        });

        this.listContainer.querySelectorAll('.leaderboard-map-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const btnEl = e.target.closest('.leaderboard-map-btn');
                const mapId = btnEl.dataset.id;
                const map = maps.find(m => m.id === mapId);
                
                this.view.classList.add('hidden');
                
                // Load Custom Leaderboard
                // We access the leaderboardController's show method, but need to indicate origin
                // Note: The script.js handles the 'close' event to re-show browser if needed
                
                const scores = await getCustomMapLeaderboard(mapId);
                // We need to signal to script.js or leaderboard controller that we are in custom-browser mode
                // This is slightly tricky with strict encapsulation.
                // script.js manages 'leaderboardOrigin' var.
                // We can fire a custom event or use a callback in constructor. 
                
                // Hack: We set a property on the controller instance if we want, or rely on script.js handling
                // Ideally, script.js should handle this logic, but we moved it here.
                
                // Let's emit an event that script.js listens to
                const event = new CustomEvent('openCustomLeaderboard', { 
                    detail: { 
                        origin: 'custom-browser',
                        scores: scores,
                        title: `Leaderboard: ${map.name}`
                    }
                });
                window.dispatchEvent(event);
            });
        });

        if (isMine) {
            this.listContainer.querySelectorAll('.delete-map-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const btnEl = e.target.closest('.delete-map-btn');
                    const id = btnEl.dataset.id;
                    if(confirm('Delete this map? This cannot be undone.')) {
                        await deleteCustomMap(id);
                        this.loadCustomMaps('mine');
                    }
                });
            });

            this.listContainer.querySelectorAll('.edit-map-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnEl = e.target.closest('.edit-map-btn');
                    const id = btnEl.dataset.id;
                    const map = maps.find(m => m.id === id);
                    this.customCreator.loadForEditing(map);
                });
            });
        }
    }

    startCustomGame(map) {
        this.view.classList.add('hidden');
        this.game.setMode('custom', map);
        this.game.start('easy'); 
        this.ui.showGameScreen('custom', map);
        this.ui.updateDifficulty('custom');
    }
}