import { createCustomMap } from './custom-maps-api.js';
import { resamplePath } from './utils.js';

export class CustomLevelCreator {
    constructor(uiController) {
        this.ui = uiController;
        this.canvas = document.getElementById('creator-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.isDrawing = false;
        this.isValid = false;
        this.touchThreshold = 30; // pixels to snap close
        
        this.bindEvents();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    bindEvents() {
        // Drawing events
        this.canvas.addEventListener('pointerdown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('pointermove', (e) => this.draw(e));
        this.canvas.addEventListener('pointerup', () => this.stopDrawing());
        this.canvas.addEventListener('pointerleave', () => this.stopDrawing());

        // UI Buttons
        document.getElementById('creator-cancel-btn').addEventListener('click', () => this.close());
        document.getElementById('creator-clear-btn').addEventListener('click', () => this.reset());
        
        // Eraser with hold functionality
        const eraserBtn = document.getElementById('creator-eraser-btn');
        let eraserInterval;
        const startErasing = (e) => {
            e.preventDefault();
            this.erase();
            eraserInterval = setInterval(() => this.erase(), 50);
        };
        const stopErasing = () => {
            clearInterval(eraserInterval);
        };
        
        eraserBtn.addEventListener('mousedown', startErasing);
        eraserBtn.addEventListener('touchstart', startErasing);
        eraserBtn.addEventListener('mouseup', stopErasing);
        eraserBtn.addEventListener('touchend', stopErasing);
        eraserBtn.addEventListener('mouseleave', stopErasing);

        document.getElementById('creator-finish-btn').addEventListener('click', () => this.finish());
        
        // Open Creator
        document.getElementById('create-new-map-btn').addEventListener('click', () => this.open());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }

    open() {
        document.getElementById('custom-creator-view').classList.remove('hidden');
        document.getElementById('custom-browser-view').classList.add('hidden');
        this.reset();
        this.resize();
    }

    close() {
        document.getElementById('custom-creator-view').classList.add('hidden');
        // Show browser again if we came from there
        document.getElementById('custom-browser-view').classList.remove('hidden');
    }

    reset() {
        this.points = [];
        this.isDrawing = false;
        this.isValid = false;
        const nameInput = document.getElementById('creator-map-name');
        if(nameInput) nameInput.value = '';
        this.render();
    }

    erase() {
        if (this.points.length > 0) {
            // Remove points from the end
            this.points.splice(-5); 
            this.isValid = false; // Opened the loop
            this.render();
        }
    }

    getPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const p = this.getPoint(e);
        
        // If we have points, check if we are continuing or resetting
        if (this.points.length > 0 && !this.isValid) {
            // Continue from end
        } else {
            // New start if empty or if previous was valid (finished loop)
            this.points = [p];
            this.isValid = false;
        }
        this.render();
    }

    draw(e) {
        if (!this.isDrawing) return;
        const point = this.getPoint(e);
        
        // Throttle distance
        const last = this.points[this.points.length - 1];
        const dx = point.x - last.x;
        const dy = point.y - last.y;
        if (dx*dx + dy*dy > 25) { // 5px min distance
            this.points.push(point);
            this.render();
        }
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        // Check closure
        if (this.points.length > 10) {
            const first = this.points[0];
            const last = this.points[this.points.length - 1];
            const dx = first.x - last.x;
            const dy = first.y - last.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < this.touchThreshold) {
                // Snap to close
                this.points.push({ ...first });
                this.isValid = true;
                this.render();
            } else {
                // Not closed logic? 
                // For now, let's be strict: must close manually or we highlight start
            }
        }
        this.render();
    }

    loadForEditing(mapData) {
        this.open();
        
        // De-normalize points back to canvas space roughly
        // We don't know the exact original scale, but we can fit it to the current canvas
        const minDim = Math.min(this.canvas.width, this.canvas.height);
        const scale = minDim * 0.8; // Use 80% of canvas
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.points = mapData.points.map(p => ({
            x: p.x * (scale * 1.2) + cx, // Undo the 1.2 padding division roughly
            y: p.y * (scale * 1.2) + cy
        }));
        
        // Update lives
        const livesInput = document.getElementById('creator-lives');
        if (livesInput) livesInput.value = mapData.lives || 3;

        const drainInput = document.getElementById('creator-drain');
        if (drainInput) drainInput.checked = mapData.drainEnabled !== false; // Default true
        
        const nameInput = document.getElementById('creator-map-name');
        if (nameInput) nameInput.value = mapData.name || '';

        this.isValid = true; // Assumed valid since it was saved
        this.isDrawing = false;
        this.render();
    }

    async finish() {
        if (!this.isValid) return;

        // Normalize points to 0-1 range based on bounding box, but keep aspect ratio centered
        const xs = this.points.map(p => p.x);
        const ys = this.points.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        const width = maxX - minX;
        const height = maxY - minY;
        const size = Math.max(width, height);
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Resample before saving for consistency
        const resampled = resamplePath(this.points, 120);

        // Normalize
        const normalizedPoints = resampled.map(p => ({
            x: (p.x - centerX) / (size * 1.2), // Add padding
            y: (p.y - centerY) / (size * 1.2)
        }));

        const livesInput = document.getElementById('creator-lives');
        const lives = parseInt(livesInput.value, 10);
        
        const drainInput = document.getElementById('creator-drain');
        const drainEnabled = drainInput.checked;
        
        const nameInput = document.getElementById('creator-map-name');
        const mapName = nameInput.value.trim() || `Map ${new Date().toLocaleDateString()}`;

        try {
            await createCustomMap({ 
                points: normalizedPoints, 
                lives: lives, 
                drainEnabled: drainEnabled,
                name: mapName
            });
            alert("Map saved as a new entry!");
            this.close();
            // trigger refresh of browser?
            const event = new CustomEvent('refreshCustomMaps');
            window.dispatchEvent(event);
        } catch (e) {
            alert(e.message);
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid background for context
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        ctx.beginPath();
        for(let x=0; x<this.canvas.width; x+=gridSize) { ctx.moveTo(x,0); ctx.lineTo(x,this.canvas.height); }
        for(let y=0; y<this.canvas.height; y+=gridSize) { ctx.moveTo(0,y); ctx.lineTo(this.canvas.width,y); }
        ctx.stroke();

        if (this.points.length < 1) {
            // Start indicator
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Tap/Click to start drawing", this.canvas.width/2, this.canvas.height/2);
            return;
        }

        // Draw Path with Rainbow Gradient
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Gradient logic: we need to draw segments individually for gradient
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i-1];
            const p2 = this.points[i];
            
            const hue = (i / this.points.length * 360) % 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        // Draw Start Point
        const start = this.points[0];
        ctx.beginPath();
        ctx.arc(start.x, start.y, 10, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw End Point / Snap Target
        if (!this.isValid && this.points.length > 0) {
            ctx.beginPath();
            ctx.arc(start.x, start.y, this.touchThreshold, 0, Math.PI*2);
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Finish Button visibility
        const btn = document.getElementById('creator-finish-btn');
        if (this.isValid) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    }
}