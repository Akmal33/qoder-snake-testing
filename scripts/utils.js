// Game Configuration and Utility Functions

// Game Configuration Object
const gameConfig = {
    board: {
        width: 600,
        height: 600,
        cellSize: 20,
        backgroundColor: '#16213e',
        get rows() { return this.height / this.cellSize; },
        get columns() { return this.width / this.cellSize; }
    },
    snake: {
        initialLength: 3,
        color: '#0f3460',
        headColor: '#e94560',
        speed: 150, // milliseconds per move
        initialDirection: 'right'
    },
    food: {
        color: '#f39c12',
        size: 18,
        points: 10
    },
    game: {
        fps: 60,
        enableSounds: true,
        highScoreKey: 'snakeHighScore',
        states: {
            MENU: 'menu',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'gameOver'
        }
    },
    controls: {
        keyboard: {
            up: ['ArrowUp', 'KeyW'],
            down: ['ArrowDown', 'KeyS'],
            left: ['ArrowLeft', 'KeyA'],
            right: ['ArrowRight', 'KeyD'],
            pause: ['Space'],
            restart: ['KeyR']
        },
        touch: {
            minSwipeDistance: 30,
            swipeThreshold: 10
        }
    }
};

// Difficulty Levels
const difficultyLevels = {
    easy: { speed: 200, description: 'Slow movement for beginners' },
    medium: { speed: 150, description: 'Standard game speed' },
    hard: { speed: 100, description: 'Fast-paced gameplay' },
    expert: { speed: 75, description: 'Very challenging speed' }
};

// Direction Constants
const DIRECTIONS = {
    UP: { x: 0, y: -1, name: 'up' },
    DOWN: { x: 0, y: 1, name: 'down' },
    LEFT: { x: -1, y: 0, name: 'left' },
    RIGHT: { x: 1, y: 0, name: 'right' }
};

// Utility Functions
const utils = {
    /**
     * Create a position object
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object} Position object
     */
    createPosition(x, y) {
        return { x: Math.floor(x), y: Math.floor(y) };
    },

    /**
     * Check if two positions are equal
     * @param {Object} pos1 - First position
     * @param {Object} pos2 - Second position
     * @returns {boolean} True if positions are equal
     */
    positionsEqual(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    },

    /**
     * Check if a position is within the game board boundaries
     * @param {Object} position - Position to check
     * @returns {boolean} True if position is valid
     */
    isValidPosition(position) {
        return position.x >= 0 && 
               position.x < gameConfig.board.columns && 
               position.y >= 0 && 
               position.y < gameConfig.board.rows;
    },

    /**
     * Generate a random position within the game board
     * @returns {Object} Random position
     */
    getRandomPosition() {
        return this.createPosition(
            Math.floor(Math.random() * gameConfig.board.columns),
            Math.floor(Math.random() * gameConfig.board.rows)
        );
    },

    /**
     * Convert grid position to pixel coordinates
     * @param {Object} gridPosition - Grid position
     * @returns {Object} Pixel coordinates
     */
    gridToPixel(gridPosition) {
        return {
            x: gridPosition.x * gameConfig.board.cellSize,
            y: gridPosition.y * gameConfig.board.cellSize
        };
    },

    /**
     * Convert pixel coordinates to grid position
     * @param {Object} pixelPosition - Pixel coordinates
     * @returns {Object} Grid position
     */
    pixelToGrid(pixelPosition) {
        return this.createPosition(
            Math.floor(pixelPosition.x / gameConfig.board.cellSize),
            Math.floor(pixelPosition.y / gameConfig.board.cellSize)
        );
    },

    /**
     * Get opposite direction
     * @param {Object} direction - Current direction
     * @returns {Object} Opposite direction
     */
    getOppositeDirection(direction) {
        if (direction === DIRECTIONS.UP) return DIRECTIONS.DOWN;
        if (direction === DIRECTIONS.DOWN) return DIRECTIONS.UP;
        if (direction === DIRECTIONS.LEFT) return DIRECTIONS.RIGHT;
        if (direction === DIRECTIONS.RIGHT) return DIRECTIONS.LEFT;
        return direction;
    },

    /**
     * Check if two directions are opposite
     * @param {Object} dir1 - First direction
     * @param {Object} dir2 - Second direction
     * @returns {boolean} True if directions are opposite
     */
    areDirectionsOpposite(dir1, dir2) {
        return this.getOppositeDirection(dir1) === dir2;
    },

    /**
     * Calculate distance between two positions
     * @param {Object} pos1 - First position
     * @param {Object} pos2 - Second position
     * @returns {number} Distance between positions
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Generate a unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Local Storage Helper
const storage = {
    /**
     * Get high score from localStorage
     * @returns {number} High score
     */
    getHighScore() {
        const saved = localStorage.getItem(gameConfig.game.highScoreKey);
        return saved ? parseInt(saved, 10) : 0;
    },

    /**
     * Save high score to localStorage
     * @param {number} score - Score to save
     */
    setHighScore(score) {
        const currentHigh = this.getHighScore();
        if (score > currentHigh) {
            localStorage.setItem(gameConfig.game.highScoreKey, score.toString());
            return true; // New high score
        }
        return false;
    },

    /**
     * Get game settings from localStorage
     * @returns {Object} Game settings
     */
    getSettings() {
        const saved = localStorage.getItem('snakeGameSettings');
        return saved ? JSON.parse(saved) : {
            difficulty: 'medium',
            soundEnabled: true
        };
    },

    /**
     * Save game settings to localStorage
     * @param {Object} settings - Settings to save
     */
    setSettings(settings) {
        localStorage.setItem('snakeGameSettings', JSON.stringify(settings));
    }
};

// Performance monitoring
const performance = {
    fps: 0,
    lastTime: 0,
    frameCount: 0,

    /**
     * Update FPS counter
     * @param {number} currentTime - Current timestamp
     */
    updateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    },

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getFPS() {
        return this.fps;
    }
};

// Export objects for use in other modules
window.gameConfig = gameConfig;
window.difficultyLevels = difficultyLevels;
window.DIRECTIONS = DIRECTIONS;
window.utils = utils;
window.storage = storage;
window.performance = performance;