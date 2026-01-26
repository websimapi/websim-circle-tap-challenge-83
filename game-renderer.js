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
        this.gameSize = 0; // The logical size of the game area
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 0;
        this.lineWidth = 0;
        this.currentDifficulty = 'easy';
        this.customPoints = null; // Normalized points for custom map
        this.screenPoints = null; // Scaled points for current resolution
        this.customPath = null; // Path2D cache
        this.smoothedPulse = 0;
    }

    setCustomMap(points) {
        this.customPoints = points;
        this.updateCachedPaths();
    }

    resize(difficulty) {
        this.currentDifficulty = difficulty;
        
        // Use full screen canvas to avoid clipping visualizer effects
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Cap pixel ratio to 2 to prevent massive canvases on high DPI mobile devices causing lag
        const pixelRatio = Math.min(this.devicePixelRatio, 2);
        
        this.canvas.width = width * pixelRatio;
        this.canvas.height = height * pixelRatio;
        
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        const minDimension = Math.min(width, height);
        this.gameSize = minDimension * 0.9 * pixelRatio;
        
        this.radius = this.gameSize * 0.35; 
        const conf = difficulties[this.currentDifficulty] || difficulties['easy'];
        this.lineWidth = this.gameSize * conf.trackWidthFactor;

        if (this.customPoints) {
            this.updateCachedPaths();
        }
        
        return {
            size: this.gameSize,
            radius: this.radius,
            lineWidth: this.lineWidth
        };
    }

    updateCachedPaths() {
        if (!this.customPoints || this.customPoints.length === 0) {
            this.screenPoints = null;
            this.customPath = null;
            return;
        }

        // Pre-calculate screen coordinates to avoid per-frame mapping
        this.screenPoints = this.customPoints.map(p => ({
            x: p.x * (this.gameSize * 0.85),
            y: p.y * (this.gameSize * 0.85)
        }));

        // Create Path2D for efficient rendering of the main shape
        const path = new Path2D();
        if (this.screenPoints.length > 0) {
            path.moveTo(this.screenPoints[0].x, this.screenPoints[0].y);
            for(let i=1; i<this.screenPoints.length; i++) {
                path.lineTo(this.screenPoints[i].x, this.screenPoints[i].y);
            }
            path.closePath();
        }
        this.customPath = path;
    }

    drawVisualizer(pulseAmount, currentColorHsl) {
        if (pulseAmount <= 0.01) return;

        // Use additive blending for a glowing effect
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.translate(this.centerX, this.centerY);

        const color = currentColorHsl.copy();
        const r = color.r;
        const g = color.g;
        const b = color.b;

        if (this.customPoints && this.customPath) {
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';
            
            // Soft Gradient Glow using layered strokes
            // We draw from widest/faintest to narrowest/brightest to simulate a gradient
            
            // 1. Wide Ambient Aura (Very transparent, very wide)
            this.ctx.lineWidth = this.lineWidth * (4 + pulseAmount * 6);
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.05 * pulseAmount})`;
            this.ctx.stroke(this.customPath);

            // 2. Medium Glow
            this.ctx.lineWidth = this.lineWidth * (2 + pulseAmount * 3);
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.15 * pulseAmount})`;
            this.ctx.stroke(this.customPath);

            // 3. Inner Glow
            this.ctx.lineWidth = this.lineWidth * (1 + pulseAmount);
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.4 * pulseAmount})`;
            this.ctx.stroke(this.customPath);
            
            // 4. Core Brightness (White-hot center tint)
            this.ctx.lineWidth = this.lineWidth * 0.8;
            this.ctx.strokeStyle = `rgba(${Math.min(255, r+50)}, ${Math.min(255, g+50)}, ${Math.min(255, b+50)}, ${0.2 * pulseAmount})`;
            this.ctx.stroke(this.customPath);

        } else {
            // Standard Circular Mode
            // Single clean radial gradient that peaks at the track and fades out both ways
            
            const maxRadius = this.radius * (1.5 + pulseAmount * 0.5); 
            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
            
            // Calculate stops relative to maxRadius
            const trackRatio = this.radius / maxRadius;
            const spread = 0.15 + (0.1 * pulseAmount); // How wide the glow is
            
            const cStr = `${r}, ${g}, ${b}`;
            
            // Ensure center is absolutely transparent
            grad.addColorStop(0, `rgba(${cStr}, 0)`);
            grad.addColorStop(Math.max(0, trackRatio - spread), `rgba(${cStr}, 0)`);
            
            // Peak at track
            grad.addColorStop(trackRatio, `rgba(${cStr}, ${0.6 * pulseAmount})`);
            
            // Fade out
            grad.addColorStop(Math.min(1, trackRatio + spread), `rgba(${cStr}, 0)`);
            grad.addColorStop(1, `rgba(${cStr}, 0)`);

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, maxRadius, 0, Math.PI*2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    draw(state) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
        
        // Draw Background Plate (Shadow/Glow)
        // This replaces the CSS box-shadow and ensures contrast against stars
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        
        // Draw Visualizer (it handles its own translation now for flexibility in gradients, wait, actually I moved translate into drawVisualizer for safety)
        this.ctx.restore(); // Ensure we are clean before visualizer called
        
        this.drawVisualizer(this.smoothedPulse, currentColorHsl);

        // Store pulse for replay
        if(replayFrame) {
            replayFrame.pulseAmount = this.smoothedPulse;
        }

        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);

        // Draw Dark Background for contrast (simulates a shadow behind the track)
        if (!this.customPoints) {
            const outerR = this.radius + 60;
            const bgGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
            
            const trackRatio = this.radius / outerR;
            // Strict transparent center
            bgGradient.addColorStop(0, 'rgba(0,0,0,0)'); 
            bgGradient.addColorStop(Math.max(0, trackRatio - 0.2), 'rgba(0,0,0,0)'); 
            
            // Dark ring
            bgGradient.addColorStop(trackRatio, 'rgba(0,0,0,0.6)'); 
            
            // Fade out
            bgGradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            this.ctx.fillStyle = bgGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, outerR, 0, Math.PI*2);
            this.ctx.fill();
        }

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
        if (!this.screenPoints || !this.customPath) return;

        const { currentColorHsl, targetSize, targetStartAngle, failTap, angle } = state;
        const points = this.screenPoints;
        const len = points.length;

        // Draw full track using cached Path2D
        this.ctx.strokeStyle = this.colors.secondary;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.stroke(this.customPath);

        // Helper to get index from angle (0..2PI -> 0..len)
        const getIndex = (ang) => {
            const norm = ((ang % (Math.PI*2)) + (Math.PI*2)) % (Math.PI*2);
            const progress = norm / (Math.PI*2);
            return Math.floor(progress * (len - 1));
        };

        // Draw Target Zone (Segmented)
        if (targetSize > 0) {
            this.ctx.beginPath();
            
            const startIdx = getIndex(targetStartAngle);
            const endAngle = targetStartAngle + targetSize;
            const endIdx = getIndex(endAngle);
            
            const startP = points[startIdx];
            this.ctx.moveTo(startP.x, startP.y);

            // If wrap around
            if (endAngle > Math.PI * 2) {
                // Draw to end
                for(let i = startIdx + 1; i < len; i++) {
                    const p = points[i];
                    this.ctx.lineTo(p.x, p.y);
                }
                // Draw from start
                const realEndIdx = getIndex(endAngle % (Math.PI * 2));
                this.ctx.moveTo(points[0].x, points[0].y); // Gap fix
                 for(let i = 0; i <= realEndIdx; i++) {
                    const p = points[i];
                    this.ctx.lineTo(p.x, p.y);
                }
            } else {
                for(let i = startIdx + 1; i <= endIdx; i++) {
                    const p = points[i];
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
             const age = (performance.now() - failTap.timestamp) / 1000;
             if (age < 3) {
                 const opacity = Math.max(0, 1 - (age / 3));
                 const idx = getIndex(failTap.angle);
                 const p = points[idx];
                 
                 this.ctx.save();
                 this.ctx.translate(p.x, p.y);
                 
                 const failColor = hsl(this.colors.fail);
                 failColor.opacity = opacity;
                 const xSize = this.lineWidth * 0.4;
                 
                 this.ctx.beginPath();
                 this.ctx.moveTo(-xSize, -xSize);
                 this.ctx.lineTo(xSize, xSize);
                 this.ctx.moveTo(xSize, -xSize);
                 this.ctx.lineTo(-xSize, xSize);
                 this.ctx.strokeStyle = failColor.toString();
                 this.ctx.lineWidth = Math.max(2, this.gameSize * 0.005);
                 this.ctx.stroke();
                 this.ctx.restore();
             }
        }

        // Draw Cursor
        const cursorIdx = getIndex(angle);
        const cursorP = points[cursorIdx];
        
        this.ctx.beginPath();
        this.ctx.arc(cursorP.x, cursorP.y, this.lineWidth / 2, 0, Math.PI*2);
        this.ctx.fillStyle = this.colors.fail;
        this.ctx.fill();
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
            this.ctx.lineWidth = Math.max(2, this.gameSize * 0.005);
            this.ctx.stroke();

            this.ctx.restore();
        }

        // Return if we are still showing the fail indicator for logic to know
        return !!failTap && ((performance.now() - failTap.timestamp) / 1000) < 3;
    }
}