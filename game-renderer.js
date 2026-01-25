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
        
        // Increase canvas size relative to parent to avoid clipping
        const canvasSize = minDimension * 0.95;
        
        this.canvas.style.width = `${canvasSize}px`;
        this.canvas.style.height = `${canvasSize}px`;

        this.size = canvasSize * this.devicePixelRatio;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        
        // Reduced radius to 0.3 to allow particles to blow out without clipping
        this.radius = this.size * 0.3;
        const conf = difficulties[this.currentDifficulty] || difficulties['easy'];
        this.lineWidth = this.size * conf.trackWidthFactor;
        
        return {
            size: this.size,
            radius: this.radius,
            lineWidth: this.lineWidth
        };
    }

    spawnParticles(pulseAmount, color, currentAngle) {
        // Spawn more particles when pulse is stronger
        const count = Math.floor(pulseAmount * (this.customPoints ? 4 : 2)); 

        let startX, startY, velocityAngle;

        if (this.customPoints && this.customPoints.length > 2) {
            // Find cursor position on custom path
            const idx = this.getIndex(currentAngle);
            const p = this.customPoints[idx];
            // Scale to canvas space (relative to center)
            startX = p.x * (this.size * 0.75);
            startY = p.y * (this.size * 0.75);
            velocityAngle = Math.atan2(startY, startX);
        } else {
            // Standard Circle - spawn at cursor
            startX = Math.cos(currentAngle) * this.radius;
            startY = Math.sin(currentAngle) * this.radius;
            velocityAngle = currentAngle;
        }

        for(let i=0; i<count; i++) {
            // Randomize start position slightly to create a "source" area rather than a single pixel point
            const spread = this.lineWidth * 0.5;
            const x = startX + (Math.random() - 0.5) * spread;
            const y = startY + (Math.random() - 0.5) * spread;

            // Velocity: Explosive outward movement from the cursor
            // Add some angle spread to the velocity for a "spray" effect
            const sprayAngle = velocityAngle + (Math.random() - 0.5) * 1.0; 
            const speed = (this.size * 0.3 + Math.random() * this.size * 0.4) * (0.2 + pulseAmount * 1.5); 
            
            const vx = Math.cos(sprayAngle) * speed;
            const vy = Math.sin(sprayAngle) * speed;

            // Vary color slightly for vibrancy
            let particleColor = color;
            if (Math.random() > 0.5) {
                // Shift hue slightly
                const c = hsl(color);
                c.h += (Math.random() - 0.5) * 60; // +/- 30 degrees hue shift
                c.l += (Math.random() - 0.5) * 0.2; // slight lightness variation
                particleColor = c.toString();
            }

            this.particles.push({
                x, y, vx, vy,
                life: 1.0,
                decay: 0.5 + Math.random() * 0.8,
                size: (this.lineWidth * 0.6) * (0.5 + Math.random()),
                color: particleColor
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

    drawVisualizer(pulseAmount, currentColorHsl, currentAngle) {
        // Spawn particles based on pulse, passing angle
        if (pulseAmount > 0.05) {
            this.spawnParticles(pulseAmount, currentColorHsl, currentAngle);
        }

        // Draw the particles
        this.drawParticles();

        if (pulseAmount <= 0.01) return;

        // Use additive blending for a glowing effect
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        
        // Dynamic color for the pulse based on angle
        const vibrantColor = currentColorHsl.copy();
        // Shift hue based on rotation for vibrancy
        vibrantColor.h = (vibrantColor.h + (currentAngle * 180 / Math.PI) / 4) % 360; 

        if (this.customPoints) {
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
            vibrantColor.opacity = pulseAmount * 0.4;
            this.ctx.strokeStyle = vibrantColor.toString();
            this.ctx.lineWidth = this.lineWidth + (pulseAmount * 60);
            this.ctx.stroke();

        } else {
            const centerX = this.size / 2;
            const centerY = this.size / 2;
            
            // Standard Mode: Vibrant Conic/Radial mix
            
            // Create a gradient that rotates with the indicator
            try {
                // Conic Gradient for rotational vibrancy
                const conicGradient = this.ctx.createConicGradient(currentAngle - Math.PI/2, centerX, centerY);
                
                const c1 = vibrantColor.copy(); c1.opacity = pulseAmount * 0.3;
                const c2 = vibrantColor.copy(); c2.h = (c2.h + 60) % 360; c2.opacity = pulseAmount * 0.5;
                const c3 = vibrantColor.copy(); c3.h = (c3.h - 60) % 360; c3.opacity = 0;
                
                // Build a "spotlight" gradient
                conicGradient.addColorStop(0, c1.toString());
                conicGradient.addColorStop(0.1, c2.toString());
                conicGradient.addColorStop(0.5, c3.toString());
                conicGradient.addColorStop(0.9, c3.toString());
                conicGradient.addColorStop(1, c1.toString());

                this.ctx.fillStyle = conicGradient;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, this.radius * 2, 0, Math.PI * 2);
                this.ctx.fill();

            } catch (e) {
                // Fallback for older browsers
            }

            // Central radial burst that matches color
            const outerRadiusMax = this.radius * (1 + pulseAmount * 0.8);
            const outerGradient = this.ctx.createRadialGradient(centerX, centerY, this.radius * 0.5, centerX, centerY, outerRadiusMax);
            
            vibrantColor.opacity = pulseAmount * 0.5;
            outerGradient.addColorStop(0, vibrantColor.toString());
            vibrantColor.opacity = 0;
            outerGradient.addColorStop(1, vibrantColor.toString());

            this.ctx.fillStyle = outerGradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, outerRadiusMax, 0, Math.PI*2);
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
        this.drawVisualizer(this.smoothedPulse, currentColorHsl, angle);

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

    getIndex(ang) {
        if (!this.customPoints) return 0;
        const len = this.customPoints.length;
        const norm = ((ang % (Math.PI*2)) + (Math.PI*2)) % (Math.PI*2);
        const progress = norm / (Math.PI*2);
        const idx = Math.floor(progress * (len - 1));
        return Math.max(0, Math.min(len - 1, idx));
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

        // Draw Target Zone
        // Target is an arc in domain 0..2PI. We draw the segment of points corresponding to it.
        if (targetSize > 0) {
            this.ctx.beginPath();
            // We need to handle wrapping manually since it's a list of points
            const startIdx = this.getIndex(targetStartAngle);
            const endAngle = targetStartAngle + targetSize;
            const endIdx = this.getIndex(endAngle);
            
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
                const realEndIdx = this.getIndex(endAngle % (Math.PI * 2));
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
                 const idx = this.getIndex(failTap.angle);
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
        const cursorIdx = this.getIndex(angle);
        const cursorP = this.scalePoint(points[cursorIdx]);
        
        this.ctx.beginPath();
        this.ctx.arc(cursorP.x, cursorP.y, this.lineWidth / 2, 0, Math.PI*2);
        this.ctx.fillStyle = this.colors.fail;
        this.ctx.fill();
    }

    scalePoint(p) {
        // Points are normalized around 0,0. Scale by size/2 roughly
        // The creator normalized them to roughly -0.5 to 0.5 range.
        // We scale down slightly (0.75) to ensure they fit with room for particles
        const scale = this.size * 0.75;
        return {
            x: p.x * scale,
            y: p.y * scale
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