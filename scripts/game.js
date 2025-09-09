// Main Game Engine
class Game {
    constructor() {
        this.snake = null;
        this.food = null;
        this.score = 0;
        this.highScore = 0;
        this.state = gameConfig.game.states.MENU;
        this.lastUpdateTime = 0;
        this.gameLoopId = null;
        this.speed = gameConfig.snake.speed;
        this.paused = false;
        this.gameStartTime = 0;
        this.gameEndTime = 0;
        
        // UI elements
        this.scoreElement = null;
        this.highScoreElement = null;
        this.overlayElement = null;
        this.overlayTitle = null;
        this.overlayMessage = null;
        this.startButton = null;
        this.pauseButton = null;
        this.restartButton = null;
        
        this.initialize();
    }

    /**
     * Initialize game systems
     */
    initialize() {
        // Initialize game objects
        this.snake = new Snake();
        this.food = new Food();
        
        // Setup input handler
        inputHandler.setGameInstance(this);
        
        // Get UI elements
        this.getUIElements();
        
        // Load high score
        this.highScore = storage.getHighScore();
        this.updateUI();
        
        // Setup resize handler
        window.addEventListener('resize', utils.debounce(() => {
            renderer.resize();
        }, 250));
        
        // Show initial menu
        this.showMenu();
        
        console.log('Snake Game initialized successfully!');
    }

    /**
     * Get UI element references
     */
    getUIElements() {
        this.scoreElement = document.getElementById('current-score');
        this.highScoreElement = document.getElementById('high-score');
        this.overlayElement = document.getElementById('game-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMessage = document.getElementById('overlay-message');
        this.startButton = document.getElementById('start-btn');
        this.pauseButton = document.getElementById('pause-btn');
        this.restartButton = document.getElementById('restart-btn');
    }

    /**
     * Start a new game
     */
    start() {
        this.resetGame();
        this.state = gameConfig.game.states.PLAYING;
        this.gameStartTime = Date.now();
        this.hideOverlay();
        this.updateUI();
        this.startGameLoop();
        
        // Generate initial food
        this.food.generateNewPosition(this.snake);
        
        console.log('Game started');
    }

    /**
     * Pause or resume game
     */
    togglePause() {
        if (this.state === gameConfig.game.states.PLAYING) {
            this.pause();
        } else if (this.state === gameConfig.game.states.PAUSED) {
            this.resume();
        }
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.state !== gameConfig.game.states.PLAYING) return;
        
        this.state = gameConfig.game.states.PAUSED;
        this.paused = true;
        this.stopGameLoop();
        this.showOverlay('Paused', 'Press SPACE to continue or R to restart');
        
        console.log('Game paused');
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.state !== gameConfig.game.states.PAUSED) return;
        
        this.state = gameConfig.game.states.PLAYING;
        this.paused = false;
        this.hideOverlay();
        this.startGameLoop();
        
        console.log('Game resumed');
    }

    /**
     * Restart the game
     */
    restart() {
        this.stopGameLoop();
        this.start();
    }

    /**
     * End the game
     */
    gameOver() {
        this.state = gameConfig.game.states.GAME_OVER;
        this.gameEndTime = Date.now();
        this.stopGameLoop();
        
        // Check for new high score
        const isNewHighScore = storage.setHighScore(this.score);
        if (isNewHighScore) {
            this.highScore = this.score;
            this.showOverlay('New High Score!', `Score: ${this.score} • Press R to restart`);
            console.log('New high score:', this.score);
        } else {
            this.showOverlay('Game Over', `Score: ${this.score} • Press R to restart`);
        }
        
        this.updateUI();
        
        // Add game over effect
        if (renderer.isInitialized()) {
            renderer.addEffect('game_over', {
                x: gameConfig.board.width / 2,
                y: gameConfig.board.height / 2,
                duration: 2000,
                color: '#e94560'
            });
        }
        
        console.log('Game over. Score:', this.score);
    }

    /**
     * Reset game to initial state
     */
    resetGame() {
        this.snake.reset();
        this.food.active = false;
        this.score = 0;
        this.speed = gameConfig.snake.speed;
        this.paused = false;
        this.lastUpdateTime = 0;
        
        // Clear any effects
        if (renderer.isInitialized()) {
            renderer.effects = [];
        }
    }

    /**
     * Change snake direction
     * @param {Object} direction - New direction
     */
    changeDirection(direction) {
        if (this.state === gameConfig.game.states.PLAYING && !this.paused) {
            this.snake.changeDirection(direction);
        }
    }

    /**
     * Start the game loop
     */
    startGameLoop() {
        if (this.gameLoopId) {
            this.stopGameLoop();
        }
        
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    /**
     * Stop the game loop
     */
    stopGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    /**
     * Main game loop
     */
    gameLoop() {
        const currentTime = Date.now();
        
        // Update performance counter
        performance.updateFPS(currentTime);
        
        // Update game state
        if (currentTime - this.lastUpdateTime >= this.speed) {
            this.update();
            this.lastUpdateTime = currentTime;
        }
        
        // Render game
        this.render();
        
        // Continue loop if game is running
        if (this.state === gameConfig.game.states.PLAYING && !this.paused) {
            this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    /**
     * Update game state
     */
    update() {
        if (this.state !== gameConfig.game.states.PLAYING || this.paused) {
            return;
        }
        
        // Move snake
        this.snake.move();
        
        // Check collisions
        const collisions = collisionDetector.checkAllCollisions(this.snake, this.food);
        
        // Handle food collision
        if (collisions.food.detected) {
            this.handleFoodCollision(collisions.food);
        }
        
        // Handle game-ending collisions
        if (collisions.gameEnding) {
            this.gameOver();
            return;
        }
        
        // Update food
        this.food.update(this.score);
        
        // Increase speed gradually
        this.updateGameSpeed();
    }

    /**
     * Handle food collision
     * @param {Object} foodCollision - Food collision data
     */
    handleFoodCollision(foodCollision) {
        // Consume food and get points
        const points = this.food.consume();
        this.score += points;
        
        // Grow snake
        this.snake.grow();
        
        // Generate new food
        this.food.generateNewPosition(this.snake);
        
        // Add visual effects
        if (renderer.isInitialized()) {
            const foodPos = utils.gridToPixel(foodCollision.foodPosition);
            renderer.addEffect('food_eaten', {
                x: foodPos.x + gameConfig.board.cellSize / 2,
                y: foodPos.y + gameConfig.board.cellSize / 2,
                size: gameConfig.board.cellSize / 2,
                color: gameConfig.food.color,
                duration: 500
            });
            
            renderer.addEffect('score_popup', {
                x: foodPos.x + gameConfig.board.cellSize / 2,
                y: foodPos.y,
                points: points,
                size: 20,
                color: '#ffffff',
                duration: 1000
            });
        }
        
        // Handle special effects
        if (foodCollision.specialEffect) {
            this.handleSpecialEffect(foodCollision.specialEffect);
        }
        
        this.updateUI();
        
        console.log(`Food eaten! Score: ${this.score}, Points: ${points}`);
    }

    /**
     * Handle special food effects
     * @param {Object} effect - Special effect data
     */
    handleSpecialEffect(effect) {
        switch (effect.type) {
            case 'speed':
                // Temporarily increase game speed
                const originalSpeed = this.speed;
                this.speed = Math.max(50, this.speed - 50);
                setTimeout(() => {
                    this.speed = originalSpeed;
                }, effect.duration);
                console.log('Speed boost activated!');
                break;
        }
    }

    /**
     * Update game speed based on score
     */
    updateGameSpeed() {
        // Increase speed every 100 points, but cap the improvement
        const speedReduction = Math.floor(this.score / 100) * 5;
        this.speed = Math.max(75, gameConfig.snake.speed - speedReduction);
    }

    /**
     * Render the game
     */
    render() {
        if (!renderer.isInitialized()) {
            return;
        }
        
        // Clear canvas
        renderer.clear();
        
        // Render game board
        renderer.renderBoard();
        
        // Render game objects
        renderer.renderSnake(this.snake);
        renderer.renderFood(this.food);
        
        // Render effects
        renderer.renderEffects();
        
        // Render overlay if needed
        if (this.state === gameConfig.game.states.PAUSED) {
            renderer.renderOverlay('paused');
        } else if (this.state === gameConfig.game.states.GAME_OVER) {
            renderer.renderOverlay('gameOver', { score: this.score });
        }
    }

    /**
     * Update UI elements
     */
    updateUI() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
            this.scoreElement.classList.add('score-animate');
            setTimeout(() => {
                this.scoreElement.classList.remove('score-animate');
            }, 300);
        }
        
        if (this.highScoreElement) {
            this.highScoreElement.textContent = this.highScore;
        }
        
        // Update button states
        this.updateButtonStates();
    }

    /**
     * Update button states based on game state
     */
    updateButtonStates() {
        if (!this.startButton || !this.pauseButton || !this.restartButton) return;
        
        switch (this.state) {
            case gameConfig.game.states.MENU:
                this.startButton.style.display = 'inline-block';
                this.pauseButton.style.display = 'none';
                this.restartButton.style.display = 'none';
                break;
            case gameConfig.game.states.PLAYING:
                this.startButton.style.display = 'none';
                this.pauseButton.style.display = 'inline-block';
                this.pauseButton.textContent = 'Pause';
                this.restartButton.style.display = 'inline-block';
                break;
            case gameConfig.game.states.PAUSED:
                this.startButton.style.display = 'none';
                this.pauseButton.style.display = 'inline-block';
                this.pauseButton.textContent = 'Resume';
                this.restartButton.style.display = 'inline-block';
                break;
            case gameConfig.game.states.GAME_OVER:
                this.startButton.style.display = 'none';
                this.pauseButton.style.display = 'none';
                this.restartButton.style.display = 'inline-block';
                break;
        }
    }

    /**
     * Show game overlay
     * @param {string} title - Overlay title
     * @param {string} message - Overlay message
     */
    showOverlay(title, message) {
        if (this.overlayElement) {
            this.overlayElement.classList.add('show');
        }
        if (this.overlayTitle) {
            this.overlayTitle.textContent = title;
        }
        if (this.overlayMessage) {
            this.overlayMessage.textContent = message;
        }
    }

    /**
     * Hide game overlay
     */
    hideOverlay() {
        if (this.overlayElement) {
            this.overlayElement.classList.remove('show');
        }
    }

    /**
     * Show initial menu
     */
    showMenu() {
        this.state = gameConfig.game.states.MENU;
        this.showOverlay('Snake Game', 'Press Start to begin or use arrow keys');
        this.updateUI();
        
        // Render initial state
        this.render();
    }

    /**
     * Check if game is currently playing
     * @returns {boolean} True if game is playing
     */
    isPlaying() {
        return this.state === gameConfig.game.states.PLAYING && !this.paused;
    }

    /**
     * Get current game state
     * @returns {string} Current game state
     */
    getState() {
        return this.state;
    }

    /**
     * Get game statistics
     * @returns {Object} Game statistics
     */
    getStats() {
        const currentTime = Date.now();
        const gameTime = this.gameStartTime ? currentTime - this.gameStartTime : 0;
        
        return {
            score: this.score,
            highScore: this.highScore,
            gameTime: gameTime,
            snakeLength: this.snake ? this.snake.getLength() : 0,
            speed: this.speed,
            state: this.state,
            fps: performance.getFPS()
        };
    }

    /**
     * Enable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        renderer.setDebugMode(enabled);
        collisionDetector.setDebugMode(enabled);
        console.log('Debug mode:', enabled ? 'enabled' : 'disabled');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global game instance
    window.game = new Game();
    
    // Make game instance available globally for debugging
    if (typeof window !== 'undefined') {
        window.gameDebug = {
            game: window.game,
            renderer,
            inputHandler,
            collisionDetector,
            utils,
            gameConfig,
            enableDebug: () => window.game.setDebugMode(true),
            disableDebug: () => window.game.setDebugMode(false)
        };
    }
    
    console.log('Snake Game loaded successfully!');
    console.log('Use gameDebug object in console for debugging');
});

// Export Game class
window.Game = Game;