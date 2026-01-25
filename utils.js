import { hsl } from 'd3-color';

// Color generation based on level
export function getHslStringForLevel(level) {
    const hue = ((level - 1) * 40) % 360;
    return `hsl(${hue}, 100%, 60%)`;
}

// Robust hit detection for circular arcs
export function isAngleInArc(angleToCheck, arcStart, arcSize) {
    const twoPi = Math.PI * 2;
    const normAngle = (angleToCheck % twoPi + twoPi) % twoPi;
    const normArcStart = (arcStart % twoPi + twoPi) % twoPi;
    
    const normArcEnd = (normArcStart + arcSize) % twoPi;

    if (normArcStart < normArcEnd) {
        return normAngle >= normArcStart && normAngle <= normArcEnd;
    } else {
        return normAngle >= normArcStart || normAngle <= normArcEnd;
    }
}

export function getComputedColors() {
    const computedStyles = getComputedStyle(document.documentElement);
    return {
        secondary: computedStyles.getPropertyValue('--secondary-color'),
        success: computedStyles.getPropertyValue('--success-color'),
        fail: computedStyles.getPropertyValue('--fail-color')
    };
}

export function resamplePath(points, targetCount = 200) {
    if (!points || points.length < 2) return points;

    // Calculate total length
    let totalLength = 0;
    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i-1].x;
        const dy = points[i].y - points[i-1].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        totalLength += dist;
        lengths.push(totalLength);
    }

    // New equidistant points
    const newPoints = [];
    const step = totalLength / (targetCount - 1); // -1 to ensure we hit end exactly

    let currentLen = 0;
    let originalIndex = 0;

    for (let i = 0; i < targetCount; i++) {
        const targetDist = i * step;
        
        // Find segment containing targetDist
        while (originalIndex < lengths.length - 1 && lengths[originalIndex + 1] < targetDist) {
            originalIndex++;
        }

        if (originalIndex >= lengths.length - 1) {
            newPoints.push({ ...points[points.length - 1] });
        } else {
            const startLen = lengths[originalIndex];
            const endLen = lengths[originalIndex + 1];
            const segmentLen = endLen - startLen;
            const t = (targetDist - startLen) / segmentLen;
            
            const p1 = points[originalIndex];
            const p2 = points[originalIndex + 1];
            
            newPoints.push({
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t
            });
        }
    }
    
    // Ensure the loop closes perfectly if meant to be closed
    // (Caller handles explicit closure point before resampling usually)
    
    return newPoints;
}

export function generateHeartSVG(idPrefix, index) {
    // A heart with a clip path for the fill
    const clipId = `${idPrefix}-clip-${index}`;
    return `
        <div class="heart-wrapper" id="${idPrefix}-heart-${index}">
             <svg class="heart-svg" viewBox="0 0 24 24">
                <defs>
                    <clipPath id="${clipId}">
                        <rect class="heart-fill-rect" x="0" y="0" width="24" height="24" />
                    </clipPath>
                </defs>
                <path class="heart-bg" fill="#330000" stroke="#550000" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                <path class="heart-fill" fill="#ff0000" clip-path="url(#${clipId})" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
        </div>
    `;
}