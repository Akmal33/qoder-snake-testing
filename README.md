# Snake Game

A modern, responsive Snake game built with HTML5 Canvas, CSS3, and vanilla JavaScript. This implementation features smooth gameplay, touch controls for mobile devices, special food types, and a clean, responsive design.

## Features

### Core Gameplay
- Classic Snake gameplay with modern enhancements
- Smooth movement and collision detection
- Progressive speed increase as score grows
- High score tracking with local storage
- Pause/resume functionality

### Special Features
- **Special Food Types**: Bonus, mega, and speed boost foods
- **Visual Effects**: Particle effects, score popups, and animations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Touch Controls**: Swipe gestures for mobile gameplay
- **Keyboard Controls**: Arrow keys or WASD for movement

### Special Features
- **Special Food Types**: Bonus, mega, and speed boost foods
- **Visual Effects**: Particle effects, score popups, and animations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Touch Controls**: Swipe gestures for mobile gameplay
- **Keyboard Controls**: Arrow keys or WASD for movement

### Technical Features
- 60 FPS smooth gameplay
- Canvas-based rendering with high DPI support
- Collision detection system
- Input handling with debouncing and throttling
- Modular architecture with separated concerns
- Mobile device detection and optimization
- Virtual gamepad for touch devices
- Responsive design with CSS media queries

## How to Play

### Desktop Controls
- **Arrow Keys** or **WASD**: Move the snake
- **Space**: Pause/Resume the game
- **R**: Restart the game

### Mobile Controls
- **On-Screen D-Pad**: Virtual directional pad for movement
- **On-Screen Action Buttons**: Pause/Resume and Restart buttons
- **Landscape Mode**: Optimized layout for landscape orientation
- **Portrait Mode**: Traditional mobile layout with bottom gamepad
- **Swipe Gestures**: Alternative swipe controls for movement
- **Touch Interface**: Optimized for mobile browsers with responsive design

### Game Rules
1. Control the snake to eat food and grow longer
2. Avoid hitting the walls or the snake's own body
3. Special foods provide bonus points and effects:
   - ⭐ **Bonus Food**: Double points
   - ♦ **Mega Food**: 5x points
   - ⚡ **Speed Food**: Temporary speed boost

## Installation and Setup

### Option 1: Direct File Access
1. Download all files to a local directory
2. Open `index.html` in a modern web browser
3. Start playing!

### Option 2: Local Server (Recommended)
1. Download all files to a local directory
2. Start a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js
   npx serve
   ```
3. Open `http://localhost:8000` in your browser

## Project Structure

```
snake-game/
├── index.html              # Main HTML file
├── styles/
│   └── main.css           # All game styles
├── scripts/
│   ├── utils.js           # Utilities and configuration
│   ├── snake.js           # Snake entity class
│   ├── food.js            # Food entity class
│   ├── collision.js       # Collision detection system
│   ├── input.js           # Input handling system
│   ├── renderer.js        # Canvas rendering system
│   └── game.js            # Main game engine
└── README.md              # This file
```

## Browser Compatibility

- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

## Technical Specifications

### Performance
- Target: 60 FPS on desktop
- Minimum: 30 FPS on mobile
- Memory usage: <50MB
- Load time: <2 seconds

### Architecture
- **Modular Design**: Separated concerns with individual modules
- **Event-Driven**: Input handling with proper event management
- **Canvas Rendering**: Efficient 2D graphics with effect support
- **Responsive**: Adaptive layout for all screen sizes

## Development

### Key Classes and Modules

#### Game Engine (`game.js`)
- Main game loop and state management
- Coordinates all other systems
- Handles game logic and scoring

#### Snake Entity (`snake.js`)
- Snake movement and growth
- Direction changes and validation
- Self-collision detection

#### Food Entity (`food.js`)
- Food generation and positioning
- Special food types and effects
- Collision detection with snake

#### Collision System (`collision.js`)
- Boundary collision detection
- Self-collision detection
- Food collision detection
- Predictive collision analysis

#### Input Handler (`input.js`)
- Keyboard and touch input processing
- Input debouncing and validation
- Cross-platform compatibility

#### Renderer (`renderer.js`)
- Canvas drawing and animations
- Visual effects system
- High DPI display support

#### Utilities (`utils.js`)
- Game configuration
- Helper functions
- Performance monitoring
- Local storage management

### Debug Features

Open browser console and use the `gameDebug` object:

```javascript
// Enable debug mode
gameDebug.enableDebug();

// Get game statistics
gameDebug.game.getStats();

// Access game components
gameDebug.renderer.setDebugMode(true);
gameDebug.collisionDetector.setDebugMode(true);

// Manual testing
gameDebug.game.changeDirection(DIRECTIONS.UP);
```

## Customization

### Game Configuration

Edit `gameConfig` in `utils.js`:

```javascript
const gameConfig = {
    board: {
        width: 600,      // Board width in pixels
        height: 600,     // Board height in pixels
        cellSize: 20,    // Size of each grid cell
    },
    snake: {
        initialLength: 3, // Starting snake length
        speed: 150,      // Movement speed (ms)
    },
    food: {
        points: 10,      // Points per normal food
    }
};
```

### Styling

Modify colors in `main.css`:

```css
:root {
    --game-bg: #1a1a2e;        /* Background color */
    --snake-color: #0f3460;    /* Snake body color */
    --snake-head: #e94560;     /* Snake head color */
    --food-color: #f39c12;     /* Food color */
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Inspired by the classic Nokia Snake game
- Built with modern web technologies
- Designed for educational and entertainment purposes

---

**Enjoy playing Snake!** 🐍