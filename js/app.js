// Main Application Controller
import { DroughtCalculator } from './drought-calculator.js';
import { MapVisualizer } from './map-visualizer.js';

export class DroughtMapApp {
  constructor() {
    this.droughtCalculator = new DroughtCalculator();
    this.mapVisualizer = null;
    this.map = null;
    this.timeArray = [];
    this.currentTimeIndex = 0;
    this.isAnimating = false;
    this.animationSpeed = 100; // milliseconds between frames
    
    this.initializeApp();
  }

  // Initialize the application
  initializeApp() {
    this.initializeMap();
    this.initializeTimeControls();
    this.initializeEventListeners();
    this.startWithInitialDate();
  }

  // Initialize the Leaflet map
  initializeMap() {
    console.log('Initializing map...');
    
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded!');
      return;
    }
    
    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found!');
      return;
    }
    
    console.log('Map container found:', mapContainer);
    console.log('Map container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
    
    this.map = L.map('map', {
      center: [23.6345, -102.5528], // Mexico center
      zoom: 5,
      minZoom: 3,
      maxZoom: 8,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true
    });

    console.log('Map created:', this.map);

    // Initialize map visualizer
    this.mapVisualizer = new MapVisualizer(this.map);
    this.mapVisualizer.initializeMap();

    // Add custom map events
    this.map.on('droughtmap:updated', (e) => {
      this.onDroughtMapUpdated(e);
    });
    
    console.log('Map initialization completed');
  }

  // Initialize time controls
  initializeTimeControls() {
    this.timeArray = this.droughtCalculator.generateTimeArray();
    this.timeSlider = document.getElementById('timeSlider');
    this.currentTimeDisplay = document.getElementById('currentTime');
    
    // Set slider properties
    this.timeSlider.min = 0;
    this.timeSlider.max = this.timeArray.length - 1;
    this.timeSlider.value = Math.floor(this.timeArray.length / 2); // Start in middle (around 2035)
    
    // Update display
    this.updateTimeDisplay();
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Time slider
    this.timeSlider.addEventListener('input', (e) => {
      this.currentTimeIndex = parseInt(e.target.value);
      this.updateDroughtMap();
    });

    // Play/Pause button (if exists)
    const playButton = document.getElementById('playButton');
    if (playButton) {
      playButton.addEventListener('click', () => {
        this.toggleAnimation();
      });
    }

    // Reset button (if exists)
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.resetToStart();
      });
    }

    // Speed control (if exists)
    const speedControl = document.getElementById('speedControl');
    if (speedControl) {
      speedControl.addEventListener('change', (e) => {
        this.animationSpeed = parseInt(e.target.value);
      });
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardInput(e);
    });

    // Window resize
    window.addEventListener('resize', () => {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
    });
  }

  // Handle keyboard input
  handleKeyboardInput(e) {
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.previousTime();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.nextTime();
        break;
      case ' ':
        e.preventDefault();
        this.toggleAnimation();
        break;
      case 'Home':
        e.preventDefault();
        this.goToStart();
        break;
      case 'End':
        e.preventDefault();
        this.goToEnd();
        break;
    }
  }

  // Update drought map
  updateDroughtMap() {
    const currentDate = this.timeArray[this.currentTimeIndex];
    this.mapVisualizer.updateDroughtMap(currentDate);
    this.updateTimeDisplay();
  }

  // Update time display
  updateTimeDisplay() {
    const currentDate = this.timeArray[this.currentTimeIndex];
    this.currentTimeDisplay.textContent = this.droughtCalculator.formatDate(currentDate);
    
    // Update slider position
    this.timeSlider.value = this.currentTimeIndex;
  }

  // Navigate to previous time
  previousTime() {
    if (this.currentTimeIndex > 0) {
      this.currentTimeIndex--;
      this.updateDroughtMap();
    }
  }

  // Navigate to next time
  nextTime() {
    if (this.currentTimeIndex < this.timeArray.length - 1) {
      this.currentTimeIndex++;
      this.updateDroughtMap();
    }
  }

  // Go to start of timeline
  goToStart() {
    this.currentTimeIndex = 0;
    this.updateDroughtMap();
  }

  // Reset to start (same as goToStart but with animation stop)
  resetToStart() {
    this.stopAnimation();
    this.goToStart();
  }

  // Go to end of timeline
  goToEnd() {
    this.currentTimeIndex = this.timeArray.length - 1;
    this.updateDroughtMap();
  }

  // Toggle animation
  toggleAnimation() {
    if (this.isAnimating) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  // Start animation
  startAnimation() {
    this.isAnimating = true;
    this.animate();
  }

  // Stop animation
  stopAnimation() {
    this.isAnimating = false;
  }

  // Animation loop
  animate() {
    if (!this.isAnimating) return;

    this.nextTime();
    
    // Check if we've reached the end
    if (this.currentTimeIndex >= this.timeArray.length - 1) {
      this.stopAnimation();
      return;
    }

    // Continue animation
    setTimeout(() => {
      this.animate();
    }, this.animationSpeed);
  }

  // Handle drought map updates
  onDroughtMapUpdated(e) {
    // Update any additional UI elements based on the new data
    this.updateStatistics(e.data);
  }

  // Update statistics display
  updateStatistics(droughtData) {
    // Calculate statistics
    const totalStates = droughtData.length;
    const affectedStates = droughtData.filter(state => state.intensity > 0.2).length;
    const severeDrought = droughtData.filter(state => state.level >= 3).length;
    const extremeDrought = droughtData.filter(state => state.level >= 4).length;

    // Update statistics display (if elements exist)
    const statsElement = document.getElementById('statistics');
    if (statsElement) {
      statsElement.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Estados Afectados:</span>
          <span class="stat-value">${affectedStates}/${totalStates}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Sequía Severa:</span>
          <span class="stat-value">${severeDrought}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Sequía Extrema:</span>
          <span class="stat-value">${extremeDrought}</span>
        </div>
      `;
    }
  }

  // Start with initial date
  startWithInitialDate() {
    // Start with a date around 2035 to show climate projections
    this.currentTimeIndex = Math.floor(this.timeArray.length * 0.5);
    this.updateDroughtMap();
  }

  // Get current date
  getCurrentDate() {
    return this.timeArray[this.currentTimeIndex];
  }

  // Get current drought data
  getCurrentDroughtData() {
    const currentDate = this.getCurrentDate();
    return this.droughtCalculator.getStatesDroughtData(currentDate);
  }

  // Export current map state
  exportMapState() {
    return {
      currentDate: this.getCurrentDate(),
      droughtData: this.getCurrentDroughtData(),
      timeIndex: this.currentTimeIndex,
      totalTimePoints: this.timeArray.length
    };
  }

  // Clean up resources
  destroy() {
    if (this.mapVisualizer) {
      this.mapVisualizer.destroy();
    }
    if (this.map) {
      this.map.remove();
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing DroughtMapApp...');
  try {
    window.droughtMapApp = new DroughtMapApp();
    console.log('DroughtMapApp initialized successfully');
  } catch (error) {
    console.error('Error initializing DroughtMapApp:', error);
  }
});
