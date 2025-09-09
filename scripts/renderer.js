// Canvas Renderer System
class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.scale = 1;
        this.initialized = false;
        this.debugMode = false;
        this.animationFrame = 0;
        this.effects = [];
        
        this.initializeCanvas();
    }

    /**
     * Initialize canvas and context
     */
    initializeCanvas() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Game canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Canvas 2D context not available');
            return;
        }
        
        this.setupCanvas();
        this.initialized = true;
    }

    /**
     * Setup canvas properties
     */
    setupCanvas() {
        // Set canvas size
        this.canvas.width = gameConfig.board.width;
        this.canvas.height = gameConfig.board.height;
        
        // Setup high DPI support
        this.setupHighDPI();
        
        // Set default rendering properties
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Make canvas focusable for keyboard input
        this.canvas.tabIndex = 0;
    }

    /**
     * Setup high DPI (retina) display support
     */
    setupHighDPI() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        // Set actual size in memory (scaled up)
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale the canvas back down using CSS
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Scale the drawing context so everything draws at correct size
        this.ctx.scale(dpr, dpr);
        this.scale = dpr;
    }

    /**
     * Clear the entire canvas
     */
    clear() {
        if (!this.initialized) return;
        
        this.ctx.fillStyle = gameConfig.board.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Render the game board background
     */
    renderBoard() {
        if (!this.initialized) return;
        
        // Fill background
        this.ctx.fillStyle = gameConfig.board.backgroundColor;
        this.ctx.fillRect(0, 0, gameConfig.board.width, gameConfig.board.height);
        
        // Draw grid lines if in debug mode
        if (this.debugMode) {
            this.drawGrid();
        }
    }

    /**
     * Draw grid lines for debugging
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let x = 0; x <= gameConfig.board.width; x += gameConfig.board.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, gameConfig.board.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= gameConfig.board.height; y += gameConfig.board.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(gameConfig.board.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Render the snake
     * @param {Snake} snake - Snake instance to render
     */
    renderSnake(snake) {
        if (!this.initialized || !snake) return;
        
        const body = snake.body;
        
        // Render body segments
        for (let i = 0; i < body.length; i++) {
            const segment = body[i];
            const pixelPos = utils.gridToPixel(segment);
            
            // Different styling for head vs body
            if (i === 0) {
                this.drawSnakeHead(pixelPos);
            } else {
                this.drawSnakeBody(pixelPos, i);
            }
        }
        
        // Add glow effect for special states
        if (this.debugMode) {
            this.drawSnakeDebugInfo(snake);
        }
    }

    /**
     * Draw snake head
     * @param {Object} position - Pixel position
     */
    drawSnakeHead(position) {
        const cellSize = gameConfig.board.cellSize;
        
        // Main head body
        this.ctx.fillStyle = gameConfig.snake.headColor;
        this.ctx.fillRect(position.x, position.y, cellSize, cellSize);
        
        // Add border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(position.x + 0.5, position.y + 0.5, cellSize - 1, cellSize - 1);
        
        // Add eyes
        this.drawSnakeEyes(position);
    }

    /**
     * Draw snake eyes
     * @param {Object} position - Head position
     */
    drawSnakeEyes(position) {
        const cellSize = gameConfig.board.cellSize;
        const eyeSize = Math.max(2, cellSize / 8);
        const eyeOffset = cellSize / 4;
        
        this.ctx.fillStyle = '#ffffff';
        
        // Left eye
        this.ctx.fillRect(
            position.x + eyeOffset - eyeSize / 2,
            position.y + eyeOffset - eyeSize / 2,
            eyeSize,
            eyeSize
        );
        
        // Right eye
        this.ctx.fillRect(
            position.x + cellSize - eyeOffset - eyeSize / 2,
            position.y + eyeOffset - eyeSize / 2,
            eyeSize,
            eyeSize
        );
    }

    /**
     * Draw snake body segment
     * @param {Object} position - Pixel position
     * @param {number} index - Segment index
     */
    drawSnakeBody(position, index) {
        const cellSize = gameConfig.board.cellSize;
        
        // Alternating shades for body segments
        const shade = index % 2 === 0 ? gameConfig.snake.color : this.lightenColor(gameConfig.snake.color, 0.1);
        
        this.ctx.fillStyle = shade;
        this.ctx.fillRect(position.x, position.y, cellSize, cellSize);
        
        // Add subtle border
        this.ctx.strokeStyle = this.darkenColor(gameConfig.snake.color, 0.2);
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(position.x + 0.5, position.y + 0.5, cellSize - 1, cellSize - 1);
    }

    /**
     * Render food
     * @param {Food} food - Food instance to render
     */
    renderFood(food) {
        if (!this.initialized || !food || !food.isActive()) return;
        
        const renderData = food.getRenderData();
        if (!renderData) return;
        
        // Animate food with pulsing effect
        const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
        const actualSize = renderData.size * pulseScale;
        const sizeOffset = (renderData.size - actualSize) / 2;
        
        // Draw food based on type
        switch (renderData.type) {
            case 'bonus':
                this.drawSpecialFood(renderData.x + sizeOffset, renderData.y + sizeOffset, actualSize, renderData.color, '★');
                break;
            case 'mega':
                this.drawSpecialFood(renderData.x + sizeOffset, renderData.y + sizeOffset, actualSize, renderData.color, '♦');
                break;
            case 'speed':
                this.drawSpecialFood(renderData.x + sizeOffset, renderData.y + sizeOffset, actualSize, renderData.color, '⚡');
                break;
            default:
                this.drawNormalFood(renderData.x + sizeOffset, renderData.y + sizeOffset, actualSize, renderData.color);
        }
    }

    /**
     * Draw normal food
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Food size
     * @param {string} color - Food color
     */
    drawNormalFood(x, y, size, color) {
        // Draw circular food
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add highlight
        this.ctx.fillStyle = this.lightenColor(color, 0.3);
        this.ctx.beginPath();
        this.ctx.arc(x + size / 2 - size / 6, y + size / 2 - size / 6, size / 6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw special food with symbol
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Food size
     * @param {string} color - Food color
     * @param {string} symbol - Symbol to draw
     */
    drawSpecialFood(x, y, size, color, symbol) {
        // Draw background circle
        this.drawNormalFood(x, y, size, color);
        
        // Draw symbol
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${size * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, x + size / 2, y + size / 2);
    }

    /**
     * Render game effects (particles, explosions, etc.)
     */
    renderEffects() {
        if (!this.initialized) return;
        
        // Update and render all active effects
        this.effects = this.effects.filter(effect => {
            this.updateEffect(effect);
            if (effect.active) {
                this.drawEffect(effect);
                return true;
            }
            return false;
        });
    }

    /**
     * Update effect animation
     * @param {Object} effect - Effect object
     */
    updateEffect(effect) {
        const currentTime = Date.now();
        const elapsed = currentTime - effect.startTime;
        
        if (elapsed >= effect.duration) {
            effect.active = false;
            return;
        }
        
        // Update effect properties based on type
        const progress = elapsed / effect.duration;
        
        switch (effect.type) {
            case 'food_eaten':
                effect.scale = 1 + progress * 0.5;
                effect.alpha = 1 - progress;
                break;
            case 'score_popup':
                effect.y -= 0.5;
                effect.alpha = 1 - progress;
                break;
        }
    }

    /**
     * Draw effect
     * @param {Object} effect - Effect object
     */
    drawEffect(effect) {
        const oldAlpha = this.ctx.globalAlpha;
        this.ctx.globalAlpha = effect.alpha;
        
        switch (effect.type) {
            case 'food_eaten':
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.size * effect.scale, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
            case 'score_popup':
                this.ctx.fillStyle = effect.color;
                this.ctx.font = `bold ${effect.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`+${effect.points}`, effect.x, effect.y);
                break;
        }
        
        this.ctx.globalAlpha = oldAlpha;
    }

    /**
     * Add visual effect
     * @param {string} type - Effect type
     * @param {Object} options - Effect options
     */
    addEffect(type, options) {
        const effect = {
            type,
            active: true,
            startTime: Date.now(),
            duration: options.duration || 1000,
            alpha: 1,
            scale: 1,
            ...options
        };
        
        this.effects.push(effect);
    }

    /**
     * Render debug information
     * @param {Snake} snake - Snake instance
     */
    drawSnakeDebugInfo(snake) {
        const head = snake.getHead();
        const pixelPos = utils.gridToPixel(head);
        
        // Draw direction indicator
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(pixelPos.x + gameConfig.board.cellSize / 2, pixelPos.y + gameConfig.board.cellSize / 2);
        this.ctx.lineTo(
            pixelPos.x + gameConfig.board.cellSize / 2 + snake.direction.x * gameConfig.board.cellSize / 2,
            pixelPos.y + gameConfig.board.cellSize / 2 + snake.direction.y * gameConfig.board.cellSize / 2
        );
        this.ctx.stroke();
    }

    /**
     * Render game overlay (pause, game over, etc.)
     * @param {string} state - Game state
     * @param {Object} data - Additional data
     */
    renderOverlay(state, data = {}) {
        if (!this.initialized) return;
        
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, gameConfig.board.width, gameConfig.board.height);
        
        // Text properties
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const centerX = gameConfig.board.width / 2;
        const centerY = gameConfig.board.height / 2;
        
        switch (state) {
            case 'paused':
                this.ctx.font = 'bold 48px Arial';
                this.ctx.fillText('PAUSED', centerX, centerY - 30);
                this.ctx.font = '24px Arial';
                this.ctx.fillText('Press SPACE to continue', centerX, centerY + 30);
                break;
            case 'gameOver':
                this.ctx.font = 'bold 48px Arial';
                this.ctx.fillStyle = '#e94560';
                this.ctx.fillText('GAME OVER', centerX, centerY - 60);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '32px Arial';
                this.ctx.fillText(`Score: ${data.score || 0}`, centerX, centerY - 10);
                this.ctx.font = '24px Arial';
                this.ctx.fillText('Press R to restart', centerX, centerY + 40);
                break;
        }
    }

    /**
     * Lighten a color
     * @param {string} color - Hex color
     * @param {number} factor - Lighten factor (0-1)
     * @returns {string} Lightened color
     */
    lightenColor(color, factor) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * factor * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
    }

    /**
     * Darken a color
     * @param {string} color - Hex color
     * @param {number} factor - Darken factor (0-1)
     * @returns {string} Darkened color
     */
    darkenColor(color, factor) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * factor * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return `#${(0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1)}`;
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Get canvas dimensions
     * @returns {Object} Canvas dimensions
     */
    getDimensions() {
        return {
            width: this.canvas ? this.canvas.width : 0,
            height: this.canvas ? this.canvas.height : 0,
            scale: this.scale
        };
    }

    /**
     * Check if renderer is initialized
     * @returns {boolean} True if initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Resize canvas for responsive design
     */
    resize() {
        if (!this.initialized) return;
        
        this.setupCanvas();
    }
}

// Create global renderer instance
const renderer = new Renderer();

// Export Renderer class and instance
window.Renderer = Renderer;
window.renderer = renderer;