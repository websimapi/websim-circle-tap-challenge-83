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
    }

    setCustomMap(points) {
        this.customPoints = points;
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

    drawVisualizer(pulseAmount, currentColorHsl) {
        if (pulseAmount <= 0.1) return;

        const pulseColor = currentColorHsl.copy({opacity: pulseAmount * 0.3});

        if (this.customPoints) {
            const points = this.customPoints;
            const len = points.length;
            
            this.ctx.save();
            this.ctx.translate(this.size / 2, this.size / 2);
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';

            const baseWidth = this.lineWidth;
            const extraWidth = this.lineWidth * 1.5 * pulseAmount;
            
            this.ctx.beginPath();
            const start = this.scalePoint(points[0]);
            this.ctx.moveTo(start.x, start.y);
            for(let i=1; i<len; i++) {
                const p = this.scalePoint(points[i]);
                this.ctx.lineTo(p.x, p.y);
            }
            this.ctx.closePath();

            // Layer 1: Wide faint glow
            this.ctx.strokeStyle = pulseColor.copy({opacity: pulseAmount * 0.15}).toString();
            this.ctx.lineWidth = baseWidth + extraWidth * 2.5;
            this.ctx.stroke();

            // Layer 2: Medium glow
            this.ctx.strokeStyle = pulseColor.toString();
            this.ctx.lineWidth = baseWidth + extraWidth;
            this.ctx.stroke();

            this.ctx.restore();
            return;
        }

        const centerX = this.size / 2;
        const centerY = this.size / 2;
        const outerRadius = this.radius + this.lineWidth / 2;
        const innerRadius = this.radius - this.lineWidth / 2;

        // --- Outer Pulse ---
        const maxOuterPulse = this.lineWidth * 0.8;
        const pulseOuterRadius = outerRadius + (pulseAmount * maxOuterPulse);
        
        const outerGradient = this.ctx.createRadialGradient(centerX, centerY, outerRadius, centerX, centerY, pulseOuterRadius);
        outerGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        outerGradient.addColorStop(0.8, pulseColor.toString());
        outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = outerGradient;
        this.ctx.fillRect(0, 0, this.size, this.size);

        // --- Inner Pulse ---
        const maxInnerPulse = innerRadius * 0.7; 
        const pulseInnerRadius = innerRadius - (pulseAmount * maxInnerPulse);

        const innerGradient = this.ctx.createRadialGradient(centerX, centerY, pulseInnerRadius, centerX, centerY, innerRadius);
        innerGradient.addColorStop(0, 'rgba(0,0,0,0)');
        innerGradient.addColorStop(0.5, pulseColor.toString());
        innerGradient.addColorStop(1, 'rgba(0,0,0,0)');

        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(0, 0, this.size, this.size);
    }

    draw(state) {
        this.ctx.clearRect(0, 0, this.size, this.size);

        const { 
            currentColorHsl, 
            targetSize, 
            targetStartAngle, 
            failTap, 
            angle, 
            replayFrame 
        } = state;

        // Visualizer
        const audioData = getAudioData();
        let pulseAmount = 0;
        if (audioData) {
            let bass = 0;
            for (let i = 0; i < 5; i++) {
                bass += audioData[i];
            }
            bass /= 5;
            pulseAmount = (bass / 255);
            this.drawVisualizer(pulseAmount, currentColorHsl);
        }

        // Store pulse for replay
        if(replayFrame) {
            replayFrame.pulseAmount = pulseAmount;
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