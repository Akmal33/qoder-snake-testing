// Input Handling System
class InputHandler {
    constructor() {
        this.keyPressed = new Set();
        this.lastKeyTime = 0;
        this.inputQueue = [];
        this.touchStartPos = null;
        this.touchEndPos = null;
        this.gameInstance = null;
        
        // Debounced and throttled input handlers
        this.debouncedKeyHandler = utils.debounce(this.handleKeyInput.bind(this), 50);
        this.throttledTouchHandler = utils.throttle(this.handleTouchInput.bind(this), 100);
        
        this.setupEventListeners();
    }

    /**
     * Set game instance reference for input callbacks
     * @param {Game} game - Game instance
     */
    setGameInstance(game) {
        this.gameInstance = game;
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Touch events for mobile
        document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        
        // Mouse events (for desktop clicking)
        document.addEventListener('click', this.onClick.bind(this));
        
        // Focus events
        window.addEventListener('blur', this.onWindowBlur.bind(this));
        window.addEventListener('focus', this.onWindowFocus.bind(this));
        
        // Prevent default behavior for game keys
        this.preventDefaultKeys();
    }

    /**
     * Prevent default behavior for game control keys
     */
    preventDefaultKeys() {
        document.addEventListener('keydown', (event) => {
            const gameKeys = [
                ...gameConfig.controls.keyboard.up,
                ...gameConfig.controls.keyboard.down,
                ...gameConfig.controls.keyboard.left,
                ...gameConfig.controls.keyboard.right,
                ...gameConfig.controls.keyboard.pause,
                ...gameConfig.controls.keyboard.restart
            ];
            
            if (gameKeys.includes(event.code)) {
                event.preventDefault();
            }
        });
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyDown(event) {
        const currentTime = Date.now();
        
        // Prevent rapid key repetition
        if (currentTime - this.lastKeyTime < 50) {
            return;
        }
        
        this.keyPressed.add(event.code);
        this.lastKeyTime = currentTime;
        
        // Queue input for processing
        this.queueInput('keyboard', event.code);
        
        // Process immediately if it's a critical game control
        this.debouncedKeyHandler(event.code);
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyUp(event) {
        this.keyPressed.delete(event.code);
    }

    /**
     * Handle touch start events
     * @param {TouchEvent} event - Touch event
     */
    onTouchStart(event) {
        if (event.touches.length > 0) {
            this.touchStartPos = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
                time: Date.now()
            };
        }
        event.preventDefault();
    }

    /**
     * Handle touch end events
     * @param {TouchEvent} event - Touch event
     */
    onTouchEnd(event) {
        if (event.changedTouches.length > 0 && this.touchStartPos) {
            this.touchEndPos = {
                x: event.changedTouches[0].clientX,
                y: event.changedTouches[0].clientY,
                time: Date.now()
            };
            
            this.processTouchSwipe();
        }
        event.preventDefault();
    }

    /**
     * Handle touch move events
     * @param {TouchEvent} event - Touch event
     */
    onTouchMove(event) {
        event.preventDefault(); // Prevent scrolling
    }

    /**
     * Handle click events
     * @param {MouseEvent} event - Mouse event
     */
    onClick(event) {
        // Handle button clicks
        const target = event.target;
        
        if (target.classList.contains('game-button')) {
            this.handleButtonClick(target.id);
        }
    }

    /**
     * Handle window blur (loss of focus)
     */
    onWindowBlur() {
        // Auto-pause game when window loses focus
        if (this.gameInstance && this.gameInstance.isPlaying()) {
            this.gameInstance.pause();
        }
        this.keyPressed.clear();
    }

    /**
     * Handle window focus
     */
    onWindowFocus() {
        this.keyPressed.clear();
    }

    /**
     * Process touch swipe gesture
     */
    processTouchSwipe() {
        if (!this.touchStartPos || !this.touchEndPos) {
            return;
        }
        
        const deltaX = this.touchEndPos.x - this.touchStartPos.x;
        const deltaY = this.touchEndPos.y - this.touchStartPos.y;
        const deltaTime = this.touchEndPos.time - this.touchStartPos.time;
        
        // Calculate swipe distance and direction
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Check if swipe meets minimum requirements
        if (distance < gameConfig.controls.touch.minSwipeDistance || deltaTime > 300) {
            return;
        }
        
        // Determine swipe direction
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        let direction;
        if (absX > absY) {
            // Horizontal swipe
            direction = deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        } else {
            // Vertical swipe
            direction = deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
        }
        
        // Queue swipe input
        this.queueInput('touch', direction);
        this.throttledTouchHandler(direction);
        
        // Reset touch positions
        this.touchStartPos = null;
        this.touchEndPos = null;
    }

    /**
     * Queue input for processing
     * @param {string} type - Input type (keyboard, touch)
     * @param {*} value - Input value
     */
    queueInput(type, value) {
        const input = {
            type,
            value,
            timestamp: Date.now()
        };
        
        this.inputQueue.push(input);
        
        // Keep queue size manageable
        if (this.inputQueue.length > 10) {
            this.inputQueue.shift();
        }
    }

    /**
     * Process keyboard input
     * @param {string} keyCode - Key code
     */
    handleKeyInput(keyCode) {
        if (!this.gameInstance) {
            return;
        }
        
        // Movement keys
        if (gameConfig.controls.keyboard.up.includes(keyCode)) {
            this.gameInstance.changeDirection(DIRECTIONS.UP);
        } else if (gameConfig.controls.keyboard.down.includes(keyCode)) {
            this.gameInstance.changeDirection(DIRECTIONS.DOWN);
        } else if (gameConfig.controls.keyboard.left.includes(keyCode)) {
            this.gameInstance.changeDirection(DIRECTIONS.LEFT);
        } else if (gameConfig.controls.keyboard.right.includes(keyCode)) {
            this.gameInstance.changeDirection(DIRECTIONS.RIGHT);
        }
        // Game control keys
        else if (gameConfig.controls.keyboard.pause.includes(keyCode)) {
            this.gameInstance.togglePause();
        } else if (gameConfig.controls.keyboard.restart.includes(keyCode)) {
            this.gameInstance.restart();
        }
    }

    /**
     * Process touch input
     * @param {Object} direction - Direction object
     */
    handleTouchInput(direction) {
        if (!this.gameInstance) {
            return;
        }
        
        this.gameInstance.changeDirection(direction);
    }

    /**
     * Handle button clicks
     * @param {string} buttonId - Button ID
     */
    handleButtonClick(buttonId) {
        if (!this.gameInstance) {
            return;
        }
        
        switch (buttonId) {
            case 'start-btn':
                this.gameInstance.start();
                break;
            case 'pause-btn':
                this.gameInstance.togglePause();
                break;
            case 'restart-btn':
                this.gameInstance.restart();
                break;
        }
    }

    /**
     * Check if a key is currently pressed
     * @param {string} keyCode - Key code to check
     * @returns {boolean} True if key is pressed
     */
    isKeyPressed(keyCode) {
        return this.keyPressed.has(keyCode);
    }

    /**
     * Check if any movement key is pressed
     * @returns {boolean} True if any movement key is pressed
     */
    isAnyMovementKeyPressed() {
        const movementKeys = [
            ...gameConfig.controls.keyboard.up,
            ...gameConfig.controls.keyboard.down,
            ...gameConfig.controls.keyboard.left,
            ...gameConfig.controls.keyboard.right
        ];
        
        return movementKeys.some(key => this.keyPressed.has(key));
    }

    /**
     * Get currently pressed keys
     * @returns {Array} Array of pressed key codes
     */
    getPressedKeys() {
        return Array.from(this.keyPressed);
    }

    /**
     * Clear input queue
     */
    clearInputQueue() {
        this.inputQueue = [];
    }

    /**
     * Get input queue
     * @returns {Array} Input queue
     */
    getInputQueue() {
        return [...this.inputQueue];
    }

    /**
     * Enable or disable input processing
     * @param {boolean} enabled - Whether to enable input
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.keyPressed.clear();
            this.clearInputQueue();
        }
    }

    /**
     * Get input statistics for debugging
     * @returns {Object} Input statistics
     */
    getInputStats() {
        const recentInputs = this.inputQueue.slice(-20);
        const keyboardInputs = recentInputs.filter(input => input.type === 'keyboard');
        const touchInputs = recentInputs.filter(input => input.type === 'touch');
        
        return {
            totalInputs: this.inputQueue.length,
            recentInputs: recentInputs.length,
            keyboardInputs: keyboardInputs.length,
            touchInputs: touchInputs.length,
            currentlyPressed: this.getPressedKeys(),
            lastInputTime: this.inputQueue.length > 0 ? 
                           this.inputQueue[this.inputQueue.length - 1].timestamp : 0
        };
    }

    /**
     * Simulate key press for testing
     * @param {string} keyCode - Key code to simulate
     */
    simulateKeyPress(keyCode) {
        this.handleKeyInput(keyCode);
    }

    /**
     * Simulate touch swipe for testing
     * @param {Object} direction - Direction to simulate
     */
    simulateSwipe(direction) {
        this.handleTouchInput(direction);
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.removeEventListener('keyup', this.onKeyUp.bind(this));
        document.removeEventListener('touchstart', this.onTouchStart.bind(this));
        document.removeEventListener('touchend', this.onTouchEnd.bind(this));
        document.removeEventListener('touchmove', this.onTouchMove.bind(this));
        document.removeEventListener('click', this.onClick.bind(this));
        window.removeEventListener('blur', this.onWindowBlur.bind(this));
        window.removeEventListener('focus', this.onWindowFocus.bind(this));
    }
}

// Create global input handler instance
const inputHandler = new InputHandler();

// Export InputHandler class and instance
window.InputHandler = InputHandler;
window.inputHandler = inputHandler;