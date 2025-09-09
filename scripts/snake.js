// Snake Entity Class
class Snake {
    constructor() {
        this.reset();
    }

    /**
     * Reset snake to initial state
     */
    reset() {
        // Initialize snake body with starting length
        this.body = [];
        const startX = Math.floor(gameConfig.board.columns / 2);
        const startY = Math.floor(gameConfig.board.rows / 2);
        
        // Create initial body segments
        for (let i = 0; i < gameConfig.snake.initialLength; i++) {
            this.body.push(utils.createPosition(startX - i, startY));
        }
        
        // Set initial direction
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        
        // Track growing state
        this.growing = false;
        this.length = gameConfig.snake.initialLength;
    }

    /**
     * Get the head position of the snake
     * @returns {Object} Head position
     */
    getHead() {
        return this.body[0];
    }

    /**
     * Get the tail position of the snake
     * @returns {Object} Tail position
     */
    getTail() {
        return this.body[this.body.length - 1];
    }

    /**
     * Change snake direction if valid
     * @param {Object} newDirection - New direction to set
     * @returns {boolean} True if direction was changed
     */
    changeDirection(newDirection) {
        // Prevent reverse direction (can't move directly backwards)
        if (utils.areDirectionsOpposite(newDirection, this.direction)) {
            return false;
        }
        
        // Queue the direction change for next update
        this.nextDirection = newDirection;
        return true;
    }

    /**
     * Move the snake one step in current direction
     */
    move() {
        // Update direction from queued direction
        this.direction = this.nextDirection;
        
        // Calculate new head position
        const head = this.getHead();
        const newHead = utils.createPosition(
            head.x + this.direction.x,
            head.y + this.direction.y
        );
        
        // Add new head to front of body
        this.body.unshift(newHead);
        
        // Remove tail unless growing
        if (!this.growing) {
            this.body.pop();
        } else {
            this.growing = false;
            this.length++;
        }
    }

    /**
     * Make the snake grow on next move
     */
    grow() {
        this.growing = true;
    }

    /**
     * Check if snake head collides with its own body
     * @returns {boolean} True if self collision detected
     */
    checkSelfCollision() {
        const head = this.getHead();
        // Check if head position matches any body segment (excluding head itself)
        for (let i = 1; i < this.body.length; i++) {
            if (utils.positionsEqual(head, this.body[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a position is occupied by snake body
     * @param {Object} position - Position to check
     * @returns {boolean} True if position is occupied
     */
    isPositionOccupied(position) {
        return this.body.some(segment => utils.positionsEqual(segment, position));
    }

    /**
     * Get all body positions except head
     * @returns {Array} Array of body positions
     */
    getBodyWithoutHead() {
        return this.body.slice(1);
    }

    /**
     * Get current length of snake
     * @returns {number} Snake length
     */
    getLength() {
        return this.body.length;
    }

    /**
     * Get current direction name
     * @returns {string} Direction name
     */
    getDirectionName() {
        return this.direction.name;
    }

    /**
     * Check if snake can move in a given direction
     * @param {Object} direction - Direction to check
     * @returns {boolean} True if movement is valid
     */
    canMoveInDirection(direction) {
        return !utils.areDirectionsOpposite(direction, this.direction);
    }

    /**
     * Get next head position without moving
     * @returns {Object} Next head position
     */
    getNextHeadPosition() {
        const head = this.getHead();
        return utils.createPosition(
            head.x + this.direction.x,
            head.y + this.direction.y
        );
    }

    /**
     * Validate snake state for debugging
     * @returns {Object} Validation result
     */
    validate() {
        const issues = [];
        
        // Check for duplicate positions in body
        const positions = new Set();
        for (const segment of this.body) {
            const key = `${segment.x},${segment.y}`;
            if (positions.has(key)) {
                issues.push(`Duplicate position: ${key}`);
            }
            positions.add(key);
        }
        
        // Check if all positions are valid
        for (const segment of this.body) {
            if (!utils.isValidPosition(segment)) {
                issues.push(`Invalid position: ${segment.x},${segment.y}`);
            }
        }
        
        // Check minimum length
        if (this.body.length < 1) {
            issues.push('Snake body is empty');
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * Get snake state for saving/loading
     * @returns {Object} Snake state
     */
    getState() {
        return {
            body: [...this.body],
            direction: this.direction,
            nextDirection: this.nextDirection,
            growing: this.growing,
            length: this.length
        };
    }

    /**
     * Restore snake from saved state
     * @param {Object} state - Snake state to restore
     */
    setState(state) {
        this.body = [...state.body];
        this.direction = state.direction;
        this.nextDirection = state.nextDirection;
        this.growing = state.growing;
        this.length = state.length;
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            bodyLength: this.body.length,
            head: this.getHead(),
            direction: this.getDirectionName(),
            growing: this.growing,
            nextDirection: this.nextDirection.name,
            validation: this.validate()
        };
    }
}

// Export Snake class
window.Snake = Snake;