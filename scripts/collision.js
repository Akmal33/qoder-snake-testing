// Collision Detection System
class CollisionDetector {
    constructor() {
        this.collisionHistory = [];
        this.debugMode = false;
    }

    /**
     * Check for boundary collision
     * @param {Object} position - Position to check
     * @returns {Object} Collision result
     */
    checkBoundaryCollision(position) {
        const collision = {
            detected: false,
            type: 'boundary',
            position: position,
            side: null
        };

        // Check left boundary
        if (position.x < 0) {
            collision.detected = true;
            collision.side = 'left';
        }
        // Check right boundary
        else if (position.x >= gameConfig.board.columns) {
            collision.detected = true;
            collision.side = 'right';
        }
        // Check top boundary
        else if (position.y < 0) {
            collision.detected = true;
            collision.side = 'top';
        }
        // Check bottom boundary
        else if (position.y >= gameConfig.board.rows) {
            collision.detected = true;
            collision.side = 'bottom';
        }

        if (collision.detected && this.debugMode) {
            this.logCollision(collision);
        }

        return collision;
    }

    /**
     * Check for self collision with snake body
     * @param {Snake} snake - Snake instance
     * @returns {Object} Collision result
     */
    checkSelfCollision(snake) {
        const collision = {
            detected: false,
            type: 'self',
            position: snake.getHead(),
            segmentIndex: -1
        };

        const head = snake.getHead();
        const body = snake.getBodyWithoutHead();

        // Check if head collides with any body segment
        for (let i = 0; i < body.length; i++) {
            if (utils.positionsEqual(head, body[i])) {
                collision.detected = true;
                collision.segmentIndex = i + 1; // +1 because we excluded head
                break;
            }
        }

        if (collision.detected && this.debugMode) {
            this.logCollision(collision);
        }

        return collision;
    }

    /**
     * Check for food collision
     * @param {Snake} snake - Snake instance
     * @param {Food} food - Food instance
     * @returns {Object} Collision result
     */
    checkFoodCollision(snake, food) {
        const collision = {
            detected: false,
            type: 'food',
            position: snake.getHead(),
            foodPosition: food.getPosition(),
            foodType: food.getType(),
            points: 0
        };

        if (food.isActive() && food.isEaten(snake.getHead())) {
            collision.detected = true;
            collision.points = food.getValue();
            collision.specialEffect = food.getSpecialEffect();
        }

        if (collision.detected && this.debugMode) {
            this.logCollision(collision);
        }

        return collision;
    }

    /**
     * Check all collisions for a snake
     * @param {Snake} snake - Snake instance
     * @param {Food} food - Food instance
     * @returns {Object} All collision results
     */
    checkAllCollisions(snake, food) {
        const results = {
            boundary: this.checkBoundaryCollision(snake.getHead()),
            self: this.checkSelfCollision(snake),
            food: this.checkFoodCollision(snake, food),
            hasAnyCollision: false,
            gameEnding: false
        };

        // Determine if any collision occurred
        results.hasAnyCollision = results.boundary.detected || 
                                 results.self.detected || 
                                 results.food.detected;

        // Determine if collision ends the game
        results.gameEnding = results.boundary.detected || results.self.detected;

        return results;
    }

    /**
     * Predict collision for next move
     * @param {Snake} snake - Snake instance
     * @param {Food} food - Food instance
     * @returns {Object} Predicted collision results
     */
    predictCollision(snake, food) {
        const nextHead = snake.getNextHeadPosition();
        
        const predictions = {
            boundary: this.checkBoundaryCollision(nextHead),
            self: this.checkSelfCollisionAtPosition(nextHead, snake),
            food: this.checkFoodCollisionAtPosition(nextHead, food),
            willEndGame: false
        };

        predictions.willEndGame = predictions.boundary.detected || predictions.self.detected;

        return predictions;
    }

    /**
     * Check self collision at specific position
     * @param {Object} position - Position to check
     * @param {Snake} snake - Snake instance
     * @returns {Object} Collision result
     */
    checkSelfCollisionAtPosition(position, snake) {
        const collision = {
            detected: false,
            type: 'self',
            position: position,
            segmentIndex: -1
        };

        // Check against entire body (including current head)
        for (let i = 0; i < snake.body.length; i++) {
            if (utils.positionsEqual(position, snake.body[i])) {
                collision.detected = true;
                collision.segmentIndex = i;
                break;
            }
        }

        return collision;
    }

    /**
     * Check food collision at specific position
     * @param {Object} position - Position to check
     * @param {Food} food - Food instance
     * @returns {Object} Collision result
     */
    checkFoodCollisionAtPosition(position, food) {
        const collision = {
            detected: false,
            type: 'food',
            position: position,
            foodPosition: food.getPosition(),
            foodType: food.getType(),
            points: 0
        };

        if (food.isActive() && utils.positionsEqual(position, food.getPosition())) {
            collision.detected = true;
            collision.points = food.getValue();
            collision.specialEffect = food.getSpecialEffect();
        }

        return collision;
    }

    /**
     * Check if a position is safe (no collisions except food)
     * @param {Object} position - Position to check
     * @param {Snake} snake - Snake instance
     * @returns {boolean} True if position is safe
     */
    isPositionSafe(position, snake) {
        const boundaryCollision = this.checkBoundaryCollision(position);
        const selfCollision = this.checkSelfCollisionAtPosition(position, snake);
        
        return !boundaryCollision.detected && !selfCollision.detected;
    }

    /**
     * Get all safe positions around current snake head
     * @param {Snake} snake - Snake instance
     * @returns {Array} Array of safe positions with directions
     */
    getSafePositions(snake) {
        const head = snake.getHead();
        const safePositions = [];
        
        // Check all four directions
        const directions = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
        
        for (const direction of directions) {
            const testPosition = utils.createPosition(
                head.x + direction.x,
                head.y + direction.y
            );
            
            if (this.isPositionSafe(testPosition, snake)) {
                safePositions.push({
                    position: testPosition,
                    direction: direction,
                    canMove: snake.canMoveInDirection(direction)
                });
            }
        }
        
        return safePositions;
    }

    /**
     * Calculate distance to nearest boundary
     * @param {Object} position - Position to check
     * @returns {Object} Distance to each boundary
     */
    getDistanceToBoundaries(position) {
        return {
            left: position.x,
            right: gameConfig.board.columns - 1 - position.x,
            top: position.y,
            bottom: gameConfig.board.rows - 1 - position.y,
            nearest: Math.min(
                position.x,
                gameConfig.board.columns - 1 - position.x,
                position.y,
                gameConfig.board.rows - 1 - position.y
            )
        };
    }

    /**
     * Find the closest safe position to target
     * @param {Object} targetPosition - Target position
     * @param {Snake} snake - Snake instance
     * @returns {Object|null} Closest safe position or null
     */
    findClosestSafePosition(targetPosition, snake) {
        const safePositions = this.getSafePositions(snake);
        
        if (safePositions.length === 0) {
            return null;
        }
        
        let closest = safePositions[0];
        let minDistance = utils.calculateDistance(targetPosition, closest.position);
        
        for (let i = 1; i < safePositions.length; i++) {
            const distance = utils.calculateDistance(targetPosition, safePositions[i].position);
            if (distance < minDistance) {
                minDistance = distance;
                closest = safePositions[i];
            }
        }
        
        return closest;
    }

    /**
     * Log collision for debugging
     * @param {Object} collision - Collision data
     */
    logCollision(collision) {
        const timestamp = Date.now();
        const logEntry = {
            timestamp,
            ...collision
        };
        
        this.collisionHistory.push(logEntry);
        
        // Keep only last 50 collisions
        if (this.collisionHistory.length > 50) {
            this.collisionHistory.shift();
        }
        
        console.log('Collision detected:', logEntry);
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Get collision history
     * @returns {Array} Array of collision records
     */
    getCollisionHistory() {
        return [...this.collisionHistory];
    }

    /**
     * Clear collision history
     */
    clearHistory() {
        this.collisionHistory = [];
    }

    /**
     * Get collision statistics
     * @returns {Object} Collision statistics
     */
    getStatistics() {
        const stats = {
            total: this.collisionHistory.length,
            byType: {
                boundary: 0,
                self: 0,
                food: 0
            },
            recent: this.collisionHistory.slice(-10)
        };
        
        for (const collision of this.collisionHistory) {
            if (stats.byType.hasOwnProperty(collision.type)) {
                stats.byType[collision.type]++;
            }
        }
        
        return stats;
    }
}

// Create global collision detector instance
const collisionDetector = new CollisionDetector();

// Export collision detector
window.CollisionDetector = CollisionDetector;
window.collisionDetector = collisionDetector;