export class LeaderboardReplayHandler {
    constructor(callbacks) {
        this.callbacks = callbacks || {}; // { onReplayLoaded: (data) => {} }
    }

    async handleReplayClick(watchBtn, dataContext, userContext) {
        const originalHtml = watchBtn.innerHTML;
        watchBtn.innerHTML = '<span style="font-size: 0.6rem;">...</span>'; 
        watchBtn.disabled = true;

        try {
            await this._loadReplay(dataContext, userContext);
        } catch (error) {
            console.error("Replay load error", error);
            alert("Could not load replay.");
        } finally {
            watchBtn.innerHTML = originalHtml;
            watchBtn.disabled = false;
        }
    }

    async _loadReplay(gameData, user) {
        if (!gameData || !gameData.replayDataUrl) return;

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

            if (this.callbacks.onReplayLoaded) {
                this.callbacks.onReplayLoaded(replayData);
            }
        } catch (fetchError) {
            console.error("Error fetching replay data:", fetchError);
            throw fetchError;
        }
    }
}