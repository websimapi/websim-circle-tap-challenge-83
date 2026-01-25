import { hsl } from 'd3-color';
import { getAudioData } from './audio.js';
import { difficulties } from './game-config.js';

export class GameRenderer {
    constructor(canvas, colors) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.colors = colors;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        // Dimensions calculated on resize
        this.size = 0;
        this.radius = 0;
        this.lineWidth = 0;
        this.currentDifficulty = 'easy';
        this.customPoints = null; // Normalized points for custom map
        this.smoothedPulse = 0;
        this.particles = [];
    }

    setCustomMap(points) {
        this.customPoints = points;
        this.particles = []; // Clear particles on map change
    }

    resize(difficulty) {
        this.currentDifficulty = difficulty;
        const parent = this.canvas.parentElement;
        if (!parent) return; // Guard if removed from DOM
        
        const parentWidth = parent.offsetWidth;
        const parentHeight = parent.offsetHeight;
        const minDimension = Math.min(parentWidth, parentHeight);
        
        const canvasSize = minDimension * 0.9;
        
        this.canvas.style.width = `${canvasSize}px`;
        this.canvas.style.height = `${canvasSize}px`;

        this.size = canvasSize * this.devicePixelRatio;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        
        this.radius = this.size * 0.4;
        const conf = difficulties[this.currentDifficulty] || difficulties['easy'];
        this.lineWidth = this.size * conf.trackWidthFactor;
        
        return {
            size: this.size,
            radius: this.radius,
            lineWidth: this.lineWidth
        };
    }

    spawnParticles(pulseAmount, color) {
        // Spawn more particles when pulse is stronger
        const count = Math.floor(pulseAmount * (this.customPoints ? 4 : 2)); 
        const center = { x: 0, y: 0 }; // Normalized center

        for(let i=0; i<count; i++) {
            let x, y, angle;
            
            if (this.customPoints && this.customPoints.length > 2) {
                // Randomly pick a segment on the custom path
                const idx = Math.floor(Math.random() * this.customPoints.length);
                const p1 = this.customPoints[idx];
                const p2 = this.customPoints[(idx + 1) % this.customPoints.length];
                const t = Math.random();
                
                // Lerp in normalized space
                const nx = p1.x + (p2.x - p1.x) * t;
                const ny = p1.y + (p2.y - p1.y) * t;
                
                // Scale to canvas space
                const scaled = this.scalePoint({x: nx, y: ny});
                x = scaled.x;
                y = scaled.y;
                
                // Direction: Outward from center of canvas (since normalized points are centered at 0,0)
                // x,y here are relative to top-left of canvas. Center is size/2.
                // But scalePoint returns coords relative to top-left assuming input is centered.
                // scalePoint: x * size + 0? No, scalePoint is x * size. 
                // Normalized coords are -0.5 to 0.5. So scaled is -size/2 to size/2.
                // We need to translate them when drawing usually.
                // Let's store particles in relative coordinates (centered at 0,0) for simplicity.
                
                x = nx * this.size;
                y = ny * this.size;
                angle = Math.atan2(y, x);

            } else {
                // Standard Circle
                angle = Math.random() * Math.PI * 2;
                x = Math.cos(angle) * this.radius;
                y = Math.sin(angle) * this.radius;
            }

            // Velocity: Drifting outward with some randomness
            const speed = (20 + Math.random() * 50) * (0.5 + pulseAmount); 
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            this.particles.push({
                x, y, vx, vy,
                life: 1.0,
                decay: 1.0 + Math.random(), // Random decay speed
                size: (this.lineWidth * 0.4) * (0.5 + Math.random()),
                color: color.toString() // Capture current color string
            });
        }
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= p.decay * deltaTime;
            p.size *= 0.98; // Shrink over time
            
            if (p.life <= 0 || p.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        if (this.particles.length === 0) return;

        this.ctx.save();
        this.ctx.translate(this.size / 2, this.size / 2); // Center particles
        this.ctx.globalCompositeOperation = 'lighter'; // Additive blending for "space/lava" glow
        
        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life * 0.8; // Fade out
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
    }

    drawVisualizer(pulseAmount, currentColorHsl) {
        // Spawn particles based on pulse
        if (pulseAmount > 0.05) {
            this.spawnParticles(pulseAmount, currentColorHsl);
        }

        // Draw the particles
        this.drawParticles();

        if (pulseAmount <= 0.01) return;

        // Use additive blending for a glowing effect
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';

        const pulseColor = currentColorHsl.copy();
        
        if (this.customPoints) {
            // Enhanced Custom Visualizer: Glow + Particles (handled above)
            const points = this.customPoints;
            const len = points.length;
            
            this.ctx.translate(this.size / 2, this.size / 2);
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';

            // Draw a base glow layer
            this.ctx.beginPath();
            const start = this.scalePoint(points[0]);
            this.ctx.moveTo(start.x, start.y);
            for(let i=1; i<len; i++) {
                const p = this.scalePoint(points[i]);
                this.ctx.lineTo(p.x, p.y);
            }
            this.ctx.closePath();

            // Layer: Wide atmospheric pulse
            pulseColor.opacity = pulseAmount * 0.3;
            this.ctx.strokeStyle = pulseColor.toString();
            this.ctx.lineWidth = this.lineWidth + (pulseAmount * 50);
            this.ctx.stroke();

        } else {
            const centerX = this.size / 2;
            const centerY = this.size / 2;
            
            // Standard Mode: Radial Pulse Waves
            // Outer Glow
            const outerRadiusMax = this.radius * (1 + pulseAmount * 0.6);
            const outerGradient = this.ctx.createRadialGradient(centerX, centerY, this.radius, centerX, centerY, outerRadiusMax);
            
            pulseColor.opacity = pulseAmount * 0.6;
            outerGradient.addColorStop(0, pulseColor.toString());
            
            pulseColor.opacity = 0;
            outerGradient.addColorStop(1, pulseColor.toString());

            this.ctx.fillStyle = outerGradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, outerRadiusMax, 0, Math.PI*2);
            this.ctx.fill();

            // Inner Glow
            const innerRadiusMin = Math.max(0, this.radius * (1 - pulseAmount * 0.5));
            const innerGradient = this.ctx.createRadialGradient(centerX, centerY, innerRadiusMin, centerX, centerY, this.radius);
            
            pulseColor.opacity = 0;
            innerGradient.addColorStop(0, pulseColor.toString());
            
            pulseColor.opacity = pulseAmount * 0.5;
            innerGradient.addColorStop(1, pulseColor.toString());

            this.ctx.fillStyle = innerGradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.radius, 0, Math.PI*2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    draw(state, deltaTime = 0.016) {
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Update particles
        this.updateParticles(deltaTime);

        const { 
            currentColorHsl, 
            targetSize, 
            targetStartAngle, 
            failTap, 
            angle, 
            replayFrame 
        } = state;

        // Visualizer with Smoothing
        const audioData = getAudioData();
        let targetPulse = 0;
        if (audioData) {
            let bass = 0;
            // Use slightly more bins for richness
            for (let i = 0; i < 8; i++) {
                bass += audioData[i];
            }
            bass /= 8;
            targetPulse = (bass / 255);
        }
        
        // Smooth the pulse
        this.smoothedPulse += (targetPulse - this.smoothedPulse) * 0.3;
        
        // Draw Visualizer
        this.drawVisualizer(this.smoothedPulse, currentColorHsl);

        // Store pulse for replay
        if(replayFrame) {
            replayFrame.pulseAmount = this.smoothedPulse;
        }

        this.ctx.save();
        this.ctx.translate(this.size / 2, this.size / 2);

        if (this.customPoints) {
            this.drawCustomPath(state);
        } else {
            this.drawStandardPath(state);
        }
        
        this.ctx.restore();

        // Return if we are still showing the fail indicator for logic to know
        return !!failTap && ((performance.now() - failTap.timestamp) / 1000) < 3;
    }

    drawStandardPath(state) {
        const { currentColorHsl, targetSize, targetStartAngle, failTap, angle } = state;

        // Draw track
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.colors.secondary;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'butt';
        this.ctx.stroke();

        // Draw target zone
        if (targetSize > 0) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.radius, targetStartAngle, targetStartAngle + targetSize);
            this.ctx.strokeStyle = currentColorHsl.toString();
            this.ctx.lineWidth = this.lineWidth * 0.95;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }

        // Draw fail tap indicator
        if (failTap) {
            this.drawFailIndicator(failTap, true);
        }

        // Draw rotating line
        this.ctx.save();
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.moveTo(this.radius - this.lineWidth / 2, 0);
        this.ctx.lineTo(this.radius + this.lineWidth / 2, 0);
        this.ctx.strokeStyle = this.colors.fail;
        this.ctx.lineWidth = this.lineWidth / 2.5;
        this.ctx.lineCap = 'butt';
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawCustomPath(state) {
        const { currentColorHsl, targetSize, targetStartAngle, failTap, angle } = state;
        const points = this.customPoints;
        const len = points.length;

        // Draw full track
        this.ctx.beginPath();
        const start = this.scalePoint(points[0]);
        this.ctx.moveTo(start.x, start.y);
        for(let i=1; i<len; i++) {
            const p = this.scalePoint(points[i]);
            this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.strokeStyle = this.colors.secondary;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        // Helper to get index from angle (0..2PI -> 0..len)
        const getIndex = (ang) => {
            const norm = ((ang % (Math.PI*2)) + (Math.PI*2)) % (Math.PI*2);
            const progress = norm / (Math.PI*2);
            return Math.floor(progress * (len - 1));
        };

        // Draw Target Zone
        // Target is an arc in domain 0..2PI. We draw the segment of points corresponding to it.
        if (targetSize > 0) {
            this.ctx.beginPath();
            // We need to handle wrapping manually since it's a list of points
            const startIdx = getIndex(targetStartAngle);
            const endAngle = targetStartAngle + targetSize;
            const endIdx = getIndex(endAngle);
            
            const startP = this.scalePoint(points[startIdx]);
            this.ctx.moveTo(startP.x, startP.y);

            // If wrap around
            if (endAngle > Math.PI * 2) {
                // Draw to end
                for(let i = startIdx + 1; i < len; i++) {
                    const p = this.scalePoint(points[i]);
                    this.ctx.lineTo(p.x, p.y);
                }
                // Draw from start
                const realEndIdx = getIndex(endAngle % (Math.PI * 2));
                this.ctx.moveTo(this.scalePoint(points[0]).x, this.scalePoint(points[0]).y); // Gap fix
                 for(let i = 0; i <= realEndIdx; i++) {
                    const p = this.scalePoint(points[i]);
                    this.ctx.lineTo(p.x, p.y);
                }
            } else {
                for(let i = startIdx + 1; i <= endIdx; i++) {
                    const p = this.scalePoint(points[i]);
                    this.ctx.lineTo(p.x, p.y);
                }
            }

            this.ctx.strokeStyle = currentColorHsl.toString();
            this.ctx.lineWidth = this.lineWidth * 0.95;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }
        
        // Draw Fail Indicator
        if (failTap) {
            // Need custom fail indicator drawing
            // Reuse generic, but we need to position it at the specific point
             const age = (performance.now() - failTap.timestamp) / 1000;
             if (age < 3) {
                 const opacity = Math.max(0, 1 - (age / 3));
                 const idx = getIndex(failTap.angle);
                 const p = this.scalePoint(points[idx]);
                 
                 this.ctx.save();
                 this.ctx.translate(p.x, p.y);
                 // No rotation logic for 'X' in custom yet, just flat
                 
                 const failColor = hsl(this.colors.fail);
                 failColor.opacity = opacity;
                 const xSize = this.lineWidth * 0.4;
                 
                 this.ctx.beginPath();
                 this.ctx.moveTo(-xSize, -xSize);
                 this.ctx.lineTo(xSize, xSize);
                 this.ctx.moveTo(xSize, -xSize);
                 this.ctx.lineTo(-xSize, xSize);
                 this.ctx.strokeStyle = failColor.toString();
                 this.ctx.lineWidth = Math.max(2, this.size * 0.005);
                 this.ctx.stroke();
                 this.ctx.restore();
             }
        }

        // Draw Cursor
        const cursorIdx = getIndex(angle);
        const cursorP = this.scalePoint(points[cursorIdx]);
        
        this.ctx.beginPath();
        this.ctx.arc(cursorP.x, cursorP.y, this.lineWidth / 2, 0, Math.PI*2);
        this.ctx.fillStyle = this.colors.fail;
        this.ctx.fill();
    }

    scalePoint(p) {
        // Points are normalized around 0,0. Scale by size/2 roughly
        // The creator normalized them to roughly -0.5 to 0.5 range (scaled by size)
        // so we multiply by this.size
        return {
            x: p.x * this.size,
            y: p.y * this.size
        };
    }

    drawFailIndicator(failTap, isCircular) {
        const age = (performance.now() - failTap.timestamp) / 1000;
        if (age < 3) {
            const opacity = Math.max(0, 1 - (age / 3));
            const failColor = hsl(this.colors.fail);
            failColor.opacity = opacity;
            const failColorStr = failColor.toString();

            this.ctx.save();
            this.ctx.rotate(failTap.angle);
            
            // Ghost cursor line
            this.ctx.beginPath();
            this.ctx.moveTo(this.radius - this.lineWidth / 2, 0);
            this.ctx.lineTo(this.radius + this.lineWidth / 2, 0);
            this.ctx.strokeStyle = failColorStr;
            this.ctx.lineWidth = this.lineWidth / 2.5;
            this.ctx.lineCap = 'butt';
            this.ctx.stroke();

            // 'X' mark
            const xSize = this.lineWidth * 0.4;
            this.ctx.translate(this.radius, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(-xSize, -xSize);
            this.ctx.lineTo(xSize, xSize);
            this.ctx.moveTo(xSize, -xSize);
            this.ctx.lineTo(-xSize, xSize);
            this.ctx.strokeStyle = failColorStr;
            this.ctx.lineWidth = Math.max(2, this.size * 0.005);
            this.ctx.stroke();

            this.ctx.restore();
        }

        // Return if we are still showing the fail indicator for logic to know
        return !!failTap && ((performance.now() - failTap.timestamp) / 1000) < 3;
    }
}