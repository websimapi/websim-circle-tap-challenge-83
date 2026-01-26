import { generateHeartSVG } from './utils.js';

export class VSUIHandler {
    constructor(elements) {
        this.elements = elements;
    }

    updateLobbyPreview(users) {
        const container = document.getElementById('vs-lobby-preview');
        if (!container) return;

        container.innerHTML = '';
        
        // Prioritize seeking users (waiting), then playing
        const sortedUsers = users.sort((a, b) => {
            if (a.status === 'seeking' && b.status !== 'seeking') return -1;
            if (a.status !== 'seeking' && b.status === 'seeking') return 1;
            return 0;
        });

        // Show max 3 avatars
        const maxAvatars = 3;
        const count = sortedUsers.length;
        const displayUsers = sortedUsers.slice(0, maxAvatars);

        displayUsers.forEach((user, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'lobby-avatar-container';
            wrapper.dataset.clientId = user.clientId; // Store ID for click handling
            wrapper.style.zIndex = maxAvatars - index; 

            const img = document.createElement('img');
            img.src = user.avatarUrl || `https://images.websim.com/avatar/${user.username}`;
            img.className = `lobby-avatar status-${user.status}`;
            img.title = `${user.username} (${user.status === 'seeking' ? 'Waiting' : 'Fighting'})`;
            
            wrapper.appendChild(img);
            container.appendChild(wrapper);
        });

        if (count > maxAvatars) {
            const overflow = document.createElement('div');
            overflow.className = 'lobby-overflow';
            overflow.textContent = `+${count - maxAvatars}`;
            container.appendChild(overflow);
        }
    }

    updateStatus(text, show) {
        this.elements.vsStatusDisplay.textContent = text;
        if (show) this.elements.vsStatusDisplay.classList.remove('hidden');
        else this.elements.vsStatusDisplay.classList.add('hidden');
    }

    setupMatch(opponent) {
        this.elements.difficultyIndicator.classList.add('hidden');
        this.elements.scoreDisplay.classList.add('hidden'); // Hide main score
        this.elements.playerHeartsContainer.classList.remove('hidden');
        this.elements.opponentView.classList.remove('hidden');
        if (this.elements.vsBackBtn) this.elements.vsBackBtn.classList.add('hidden');
        
        // Setup Player Hearts
        this.elements.playerHearts.innerHTML = '';
        for(let i=0; i<3; i++) {
            this.elements.playerHearts.innerHTML += generateHeartSVG('player', i);
        }

        // Setup Opponent
        document.getElementById('opponent-name').textContent = opponent.username;
        const pfpEl = document.getElementById('opponent-pfp');
        if (pfpEl) {
            pfpEl.src = opponent.avatarUrl || `https://images.websim.com/avatar/${opponent.username}`;
        }

        const oppHeartsEl = document.getElementById('opponent-hearts');
        oppHeartsEl.innerHTML = '';
        for(let i=0; i<3; i++) {
            oppHeartsEl.innerHTML += generateHeartSVG('opp', i);
        }
        
        this.updateOpponentLevel(1);

        // Start updates loop/animation if needed
        this.animateHearts(300, 'player');
        this.animateHearts(300, 'opp');
    }

    updatePlayerHearts(health) {
        this.animateHearts(health, 'player'); // VS mode container
        this.animateHearts(health, 'custom'); // Custom mode container
    }

    updateOpponentHearts(health) {
        this.animateHearts(health, 'opp');
    }

    updateOpponentLevel(level) {
        const el = document.getElementById('opponent-level');
        if (el) el.textContent = level;
    }
    
    updateOpponentScore(score) {
        const opponentScore = document.getElementById('opponent-score');
        if (opponentScore) {
            opponentScore.textContent = `Score: ${score}`;
        }
    }

    animateHearts(health, prefix) {
        // Health is 0-300
        for (let i = 0; i < 3; i++) {
            const heartHealth = Math.max(0, Math.min(100, health - (i * 100)));
            const percentage = heartHealth / 100;
            
            // Adjust rect y position to drain
            const fillRect = document.querySelector(`#${prefix}-clip-${i} rect`);
            const wrapper = document.querySelector(`#${prefix}-heart-${i}`);
            
            if (fillRect) {
                // height is 24, so y goes from 0 (full) to 24 (empty)
                const y = 24 * (1 - percentage);
                fillRect.setAttribute('y', y);
            }

            if (wrapper) {
                if (percentage === 1) {
                    wrapper.classList.add('heart-pulsing');
                    wrapper.style.filter = '';
                } else if (percentage === 0) {
                    wrapper.classList.remove('heart-pulsing');
                    wrapper.style.filter = 'grayscale(1) brightness(0.5)';
                } else {
                    wrapper.classList.remove('heart-pulsing');
                    wrapper.style.filter = '';
                }
            }
        }
    }

    reset() {
        this.elements.difficultyIndicator.classList.remove('hidden');
        this.elements.playerHeartsContainer.classList.add('hidden');
        this.elements.opponentView.classList.add('hidden');
        this.elements.vsStatusDisplay.classList.add('hidden');
        if (this.elements.vsBackBtn) this.elements.vsBackBtn.classList.add('hidden');
        
        // Ensure main score is visible if not in menu
        const startHidden = this.elements.startMenu.classList.contains('hidden');
        const gameoverHidden = this.elements.gameOverMenu.classList.contains('hidden');
        
        if (startHidden && gameoverHidden) {
            this.elements.scoreDisplay.classList.remove('hidden');
        }
    }
}