// Food Entity Class
class Food {
    constructor() {
        this.position = null;
        this.value = gameConfig.food.points;
        this.active = false;
        this.type = 'normal';
        this.color = gameConfig.food.color;
        this.size = gameConfig.food.size;
        this.spawnTime = 0;
        this.specialFood = null;
    }

    /**
     * Generate new food at random position avoiding snake body
     * @param {Snake} snake - Snake instance to avoid
     * @returns {boolean} True if food was successfully generated
     */
    generateNewPosition(snake) {
        const maxAttempts = 100;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const newPosition = utils.getRandomPosition();
            
            // Check if position is not occupied by snake
            if (!snake.isPositionOccupied(newPosition)) {
                this.position = newPosition;
                this.active = true;
                this.spawnTime = Date.now();
                this.resetToNormal();
                return true;
            }
            
            attempts++;
        }
        
        // Fallback: find any available position
        return this.findAvailablePosition(snake);
    }

    /**
     * Find any available position on the board
     * @param {Snake} snake - Snake instance to avoid
     * @returns {boolean} True if position was found
     */
    findAvailablePosition(snake) {
        for (let y = 0; y < gameConfig.board.rows; y++) {
            for (let x = 0; x < gameConfig.board.columns; x++) {
                const testPosition = utils.createPosition(x, y);
                if (!snake.isPositionOccupied(testPosition)) {
                    this.position = testPosition;
                    this.active = true;
                    this.spawnTime = Date.now();
                    this.resetToNormal();
                    return true;
                }
            }
        }
        
        // No available positions (should never happen in normal gameplay)
        console.warn('No available positions for food generation');
        return false;
    }

    /**
     * Check if food is eaten by snake head
     * @param {Object} snakeHead - Snake head position
     * @returns {boolean} True if food is eaten
     */
    isEaten(snakeHead) {
        if (!this.active || !this.position) {
            return false;
        }
        
        return utils.positionsEqual(this.position, snakeHead);
    }

    /**
     * Consume the food and return points value
     * @returns {number} Points value of consumed food
     */
    consume() {
        if (!this.active) {
            return 0;
        }
        
        const points = this.value;
        this.active = false;
        this.position = null;
        
        return points;
    }

    /**
     * Reset food to normal type
     */
    resetToNormal() {
        this.type = 'normal';
        this.value = gameConfig.food.points;
        this.color = gameConfig.food.color;
        this.size = gameConfig.food.size;
        this.specialFood = null;
    }

    /**
     * Make food a special type with bonus points
     * @param {string} specialType - Type of special food
     */
    makeSpecial(specialType = 'bonus') {
        this.type = specialType;
        
        switch (specialType) {
            case 'bonus':
                this.value = gameConfig.food.points * 2;
                this.color = '#e74c3c'; // Red color for bonus
                this.size = gameConfig.food.size + 2;
                break;
            case 'mega':
                this.value = gameConfig.food.points * 5;
                this.color = '#9b59b6'; // Purple color for mega
                this.size = gameConfig.food.size + 4;
                break;
            case 'speed':
                this.value = gameConfig.food.points;
                this.color = '#3498db'; // Blue color for speed boost
                this.size = gameConfig.food.size;
                this.specialFood = { type: 'speed', duration: 5000 }; // 5 seconds
                break;
            default:
                this.resetToNormal();
        }
    }

    /**
     * Check if food should become special based on time or conditions
     * @param {number} currentScore - Current game score
     * @returns {boolean} True if food became special
     */
    checkForSpecialFood(currentScore) {
        // Don't make already special food special again
        if (this.type !== 'normal') {
            return false;
        }
        
        // Random chance for special food based on score
        const specialChance = Math.min(0.1 + (currentScore / 1000) * 0.05, 0.3);
        
        if (Math.random() < specialChance) {
            // Choose random special type
            const specialTypes = ['bonus', 'mega', 'speed'];
            const randomType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
            this.makeSpecial(randomType);
            return true;
        }
        
        return false;
    }

    /**
     * Get food age in milliseconds
     * @returns {number} Age in milliseconds
     */
    getAge() {
        if (!this.active || !this.spawnTime) {
            return 0;
        }
        
        return Date.now() - this.spawnTime;
    }

    /**
     * Check if food has expired (for special foods with time limits)
     * @returns {boolean} True if food has expired
     */
    hasExpired() {
        // Normal food doesn't expire
        if (this.type === 'normal') {
            return false;
        }
        
        // Special food expires after 10 seconds
        const maxAge = 10000; // 10 seconds
        return this.getAge() > maxAge;
    }

    /**
     * Update food state (for animations, expiration, etc.)
     * @param {number} currentScore - Current game score
     */
    update(currentScore) {
        if (!this.active) {
            return;
        }
        
        // Check for expiration
        if (this.hasExpired()) {
            this.resetToNormal();
        }
        
        // Randomly upgrade to special food
        this.checkForSpecialFood(currentScore);
    }

    /**
     * Get rendering information for the food
     * @returns {Object} Render data
     */
    getRenderData() {
        if (!this.active || !this.position) {
            return null;
        }
        
        const pixelPos = utils.gridToPixel(this.position);
        const centerOffset = (gameConfig.board.cellSize - this.size) / 2;
        
        return {
            x: pixelPos.x + centerOffset,
            y: pixelPos.y + centerOffset,
            size: this.size,
            color: this.color,
            type: this.type,
            age: this.getAge()
        };
    }

    /**
     * Get special effect information if food has special properties
     * @returns {Object|null} Special effect data or null
     */
    getSpecialEffect() {
        return this.specialFood;
    }

    /**
     * Check if food is currently active
     * @returns {boolean} True if food is active
     */
    isActive() {
        return this.active;
    }

    /**
     * Get current position
     * @returns {Object|null} Food position or null if inactive
     */
    getPosition() {
        return this.position;
    }

    /**
     * Get food value in points
     * @returns {number} Point value
     */
    getValue() {
        return this.value;
    }

    /**
     * Get food type
     * @returns {string} Food type
     */
    getType() {
        return this.type;
    }

    /**
     * Force food to specific position (for testing)
     * @param {Object} position - Position to set
     */
    setPosition(position) {
        if (utils.isValidPosition(position)) {
            this.position = position;
            this.active = true;
            this.spawnTime = Date.now();
        }
    }

    /**
     * Get food state for saving/loading
     * @returns {Object} Food state
     */
    getState() {
        return {
            position: this.position,
            value: this.value,
            active: this.active,
            type: this.type,
            color: this.color,
            size: this.size,
            spawnTime: this.spawnTime,
            specialFood: this.specialFood
        };
    }

    /**
     * Restore food from saved state
     * @param {Object} state - Food state to restore
     */
    setState(state) {
        this.position = state.position;
        this.value = state.value;
        this.active = state.active;
        this.type = state.type;
        this.color = state.color;
        this.size = state.size;
        this.spawnTime = state.spawnTime;
        this.specialFood = state.specialFood;
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            position: this.position,
            active: this.active,
            type: this.type,
            value: this.value,
            age: this.getAge(),
            hasExpired: this.hasExpired(),
            specialFood: this.specialFood
        };
    }
}

// Export Food class
window.Food = Food;