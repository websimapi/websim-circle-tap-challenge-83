export const creatorViewTemplate = `
    <!-- Custom Level Creator View -->
    <div id="custom-creator-view" class="hidden">
        <canvas id="creator-canvas"></canvas>
        <div class="creator-ui-top">
            <h2>Draw Your Track</h2>
            <p>Draw a continuous loop. Start and end must meet.</p>
        </div>
        <div class="creator-ui-settings">
            <div class="setting-item name-input-container">
                <input type="text" id="creator-map-name" placeholder="Map Name" maxlength="20">
            </div>
            <div class="setting-item">
                <label>Lives:</label>
                <select id="creator-lives">
                    <option value="1">1</option>
                    <option value="3" selected>3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="999">∞</option>
                </select>
            </div>
            <div class="setting-item">
                <label>Drain:</label>
                <input type="checkbox" id="creator-drain" checked style="width: 20px; height: 20px;">
            </div>
        </div>
        <div class="creator-ui-bottom">
            <button id="creator-cancel-btn" class="menu-btn">Cancel</button>
            <button id="creator-clear-btn" class="menu-btn">Clear</button>
            <button id="creator-eraser-btn" class="menu-btn icon-only" aria-label="Eraser" title="Erase from end">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zM4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l8.48-8.48-6.37-6.37L4.22 15.58z"/></svg>
            </button>
            <button id="creator-finish-btn" class="menu-btn icon-only hidden" aria-label="Finish">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </button>
        </div>
    </div>
`;

export const browserViewTemplate = `
    <!-- Custom Maps Browser -->
    <div id="custom-browser-view" class="hidden">
        <div class="view-container">
            <button id="close-browser-btn" class="icon-btn close-top-right" aria-label="Close">&times;</button>
            <h2>Custom Maps</h2>
            
            <div class="browser-tabs">
                <button class="tab-btn active" data-tab="browse">Browse</button>
                <button class="tab-btn" data-tab="mine">My Maps</button>
            </div>
            
            <div class="browser-controls">
                <div class="sort-buttons">
                    <button class="sort-btn active" data-sort="recent">Recent</button>
                    <button class="sort-btn" data-sort="played">Most Played</button>
                </div>
            </div>

            <div id="custom-maps-list" class="list-container">
                <!-- Populated dynamically -->
            </div>
            
            <div id="custom-maps-pagination" class="pagination-container hidden"></div>

            <div class="browser-footer">
                <button id="create-new-map-btn" class="menu-btn">
                    <span class="icon">✏️</span> Create New Map
                </button>
            </div>
        </div>
    </div>
`;

export const leaderboardViewTemplate = `
    <div id="leaderboard-view" class="hidden">
        <!-- Main List View -->
        <div id="leaderboard-main-view" class="view-container">
            <button id="close-leaderboard-btn" aria-label="Close Leaderboard">&times;</button>
            <h2>Leaderboard</h2>
            <div id="leaderboard-difficulty-filters">
                <button class="leaderboard-filter-btn active" data-difficulty="easy">Easy</button>
                <button class="leaderboard-filter-btn" data-difficulty="medium">Medium</button>
                <button class="leaderboard-filter-btn" data-difficulty="hard">Hard</button>
                <button id="my-scores-btn" class="leaderboard-filter-btn" data-difficulty="mine">My Scores</button>
            </div>
            <div id="leaderboard-list" class="list-container">
                <!-- Scores will be populated here -->
            </div>
            <div id="leaderboard-pagination" class="pagination-container hidden">
                <!-- Pagination controls will be populated here -->
            </div>
        </div>

        <!-- Detailed Score View -->
        <div id="leaderboard-detail-view" class="view-container hidden">
            <div class="detail-header">
                <button id="detail-back-btn" class="back-nav-btn" aria-label="Back">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    <span>Back</span>
                </button>
                <div id="detail-header-content"></div>
            </div>
            <div id="detail-list" class="list-container">
                <!-- Detailed scores list -->
            </div>
            <div id="detail-pagination" class="pagination-container hidden">
                <!-- Detail pagination -->
            </div>
        </div>
    </div>
`;

export const aboutViewTemplate = `
    <div id="about-view" class="hidden">
        <div class="about-content">
            <button id="close-about-btn" aria-label="Close About">&times;</button>
            <h2>About Project</h2>
            <p>This project was created on <a href="https://websim.ai" target="_blank">WebSim.ai</a>.</p>
            <p>It utilizes cutting-edge AI tools for assets and features:</p>
            <div class="logo-grid">
                <div class="logo-item">
                    <div class="logo-img-container"><img src="logo_websim.png" alt="WebSim"></div>
                    <span>WebSim</span>
                </div>
                <div class="logo-item">
                    <div class="logo-img-container"><img src="logo_remotion.png" alt="Remotion"></div>
                    <span>Remotion</span>
                    <small>Instant Replays</small>
                </div>
                <div class="logo-item">
                    <div class="logo-img-container"><img src="sonauto.svg" alt="Sonauto"></div>
                    <span>Sonauto</span>
                    <small>Music Generation</small>
                </div>
                <div class="logo-item">
                    <div class="logo-img-container"><img src="elevenlabslogo.png" alt="ElevenLabs"></div>
                    <span>ElevenLabs</span>
                    <small>SFX Audio</small>
                </div>
            </div>

            <div class="about-footer">
                <p class="footer-label">Language Models</p>
                <div class="footer-badges">
                    <div class="badge-item">ChatGPT</div>
                    <div class="badge-item">Gemini</div>
                </div>
            </div>
        </div>
    </div>
`;

export function injectTemplates() {
    const container = document.createElement('div');
    container.innerHTML = creatorViewTemplate + browserViewTemplate + leaderboardViewTemplate + aboutViewTemplate;
    
    // Append children to body
    while (container.firstChild) {
        document.body.appendChild(container.firstChild);
    }
}