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

export async function getCustomMaps(filter = 'browse', sort = 'recent') {
    // 1. Fetch all profiles to aggregate maps and scores
    const profiles = await room.collection(NEW_COLLECTION_NAME).getList();
    
    // 2. Aggregate all play scores to calculate stats globally
    const allScores = [];
    profiles.forEach(p => {
        if (p.custom_map_scores && Array.isArray(p.custom_map_scores)) {
            allScores.push(...p.custom_map_scores);
        }
    });

    let resultMaps = [];

    if (filter === 'mine') {
        const { user } = await getMyProfile();
        // Find my profile from the list we just fetched to save a call, or specifically filter
        const myProfile = profiles.find(p => p.username === user.username);
        if (myProfile && myProfile.created_maps) {
            resultMaps = [...myProfile.created_maps];
        }
    } else {
        // Browse: Aggregate maps from all profiles
        profiles.forEach(p => {
            if (p.created_maps && Array.isArray(p.created_maps)) {
                resultMaps = resultMaps.concat(p.created_maps);
            }
        });
    }
    
    // 3. Attach Stats (Play Count)
    resultMaps.forEach(map => {
        const mapPlays = allScores.filter(s => s.mapId === map.id).length;
        map.playCount = mapPlays || 0;
        
        // Ensure legacy maps have a date if missing
        if (!map.created_at) map.created_at = new Date(0).toISOString();
    });

    // 4. Sort
    const getTime = (d) => new Date(d || 0).getTime();

    if (sort === 'played') {
        resultMaps.sort((a, b) => {
            const playsA = a.playCount || 0;
            const playsB = b.playCount || 0;
            if (playsB !== playsA) return playsB - playsA;
            return getTime(b.created_at) - getTime(a.created_at);
        });
    } else {
        // Recent
        resultMaps.sort((a, b) => getTime(b.created_at) - getTime(a.created_at));
    }

    return resultMaps;
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