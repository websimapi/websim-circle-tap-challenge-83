import { room, getMyProfile, createOrUpdateMyProfile, fetchUserProfile, NEW_COLLECTION_NAME } from './leaderboard-api.js';

export async function createCustomMap(mapData) {
    const { user, profile } = await getMyProfile();
    
    const myMaps = profile ? (profile.created_maps || []) : [];
    
    if (myMaps.length >= 10) {
        throw new Error("You have reached the limit of 10 custom maps. Please delete one to create a new one.");
    }

    const newMap = {
        id: crypto.randomUUID(),
        name: mapData.name || `Map ${new Date().toLocaleDateString()}`,
        points: mapData.points, // Array of {x, y} normalized
        lives: mapData.lives || 1,
        creator_id: user.id,
        creator_username: user.username,
        plays: 0,
        created_at: new Date().toISOString()
    };

    const updatedMaps = [...myMaps, newMap];
    
    await createOrUpdateMyProfile({ created_maps: updatedMaps });
    return newMap;
}

export async function getCustomMaps(filter = 'browse') {
    if (filter === 'mine') {
        const { profile } = await getMyProfile();
        if (!profile) return [];
        return profile.created_maps || [];
    } else {
        // Browse: Fetch all profiles and aggregate maps
        // Note: getList returns latest records. This limits browsing to active users/recent profiles
        const profiles = await room.collection(NEW_COLLECTION_NAME).getList();
        
        let allMaps = [];
        profiles.forEach(p => {
            if (p.created_maps && Array.isArray(p.created_maps)) {
                allMaps = allMaps.concat(p.created_maps);
            }
        });
        
        // Sort by newest first
        allMaps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return allMaps;
    }
}

export async function deleteCustomMap(mapId) {
    const { profile } = await getMyProfile();
    if (!profile || !profile.created_maps) return;

    const updatedMaps = profile.created_maps.filter(m => m.id !== mapId);
    await createOrUpdateMyProfile({ created_maps: updatedMaps });
}

export async function saveCustomMapScore(mapId, scoreData) {
    const { profile } = await getMyProfile();
    
    const existingScores = profile ? (profile.custom_map_scores || []) : [];
    
    // Add mapId to scoreData
    const newScoreEntry = {
        ...scoreData,
        mapId: mapId
    };
    
    const updatedScores = [...existingScores, newScoreEntry];
    
    // Limit total custom scores stored to avoid bloat (e.g. keep last 100)
    if (updatedScores.length > 100) {
        // Simple trim of oldest
        updatedScores.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        updatedScores.length = 100;
    }

    await createOrUpdateMyProfile({ custom_map_scores: updatedScores });
}

export async function getCustomMapLeaderboard(mapId) {
    // Fetch all profiles to find scores for this map
    const profiles = await room.collection(NEW_COLLECTION_NAME).getList();
    
    const scores = [];
    profiles.forEach(p => {
        if (p.custom_map_scores && Array.isArray(p.custom_map_scores)) {
            const mapScores = p.custom_map_scores.filter(s => s.mapId === mapId);
            mapScores.forEach(s => {
                scores.push({
                    username: p.username,
                    ...s
                });
            });
        }
    });
    
    // Sort by score desc
    scores.sort((a, b) => b.score - a.score);
    return scores;
}