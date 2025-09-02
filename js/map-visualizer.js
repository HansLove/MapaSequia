// Advanced Map Visualizer with Heat Map Styling
import { DroughtCalculator } from './drought-calculator.js';

export class MapVisualizer {
  constructor(map) {
    this.map = map;
    this.droughtCalculator = new DroughtCalculator();
    this.currentDroughtLayer = null;
    this.animationFrame = null;
  }

  // Initialize the map with base layers
  initializeMap() {
    console.log('MapVisualizer: Initializing map with base layers...');
    
    // Add multiple base map options
    const baseMaps = {
      "Light": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CARTO'
      }),
      "Dark": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CARTO'
      }),
      "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
      })
    };

    console.log('MapVisualizer: Base maps created');

    // Add default base map
    baseMaps["Light"].addTo(this.map);
    console.log('MapVisualizer: Light base map added');
    
    // Add layer control
    L.control.layers(baseMaps).addTo(this.map);
    console.log('MapVisualizer: Layer control added');
    
    console.log('MapVisualizer: Map initialization completed');
  }

  // Create heat map styled polygons for drought visualization
  createDroughtPolygons(droughtData) {
    const polygons = [];
    
    droughtData.forEach(stateData => {
      // Show all states, but with different opacity based on intensity
      const polygon = L.polygon(stateData.coordinates, {
        color: this.getBorderColor(stateData.level),
        weight: this.getBorderWeight(stateData.intensity),
        fillColor: stateData.color,
        fillOpacity: this.getFillOpacity(stateData.intensity, stateData.heatmapIntensity),
        opacity: 0.8,
        className: 'drought-polygon'
      });

        // Add smooth hover effects
        polygon.on('mouseover', function(e) {
          this.setStyle({
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
          });
          this.bringToFront();
        });

        polygon.on('mouseout', function(e) {
          this.setStyle({
            weight: this.options.weight,
            opacity: 0.8,
            fillOpacity: this.options.fillOpacity
          });
        });

        // Enhanced tooltip with more information
        const tooltipContent = this.createTooltipContent(stateData);
        polygon.bindTooltip(tooltipContent, {
          permanent: false,
          direction: 'top',
          className: 'custom-tooltip'
        });

        // Add click event for detailed popup
        polygon.bindPopup(this.createPopupContent(stateData), {
          maxWidth: 300,
          className: 'custom-popup'
        });

        polygons.push(polygon);
    });

    return polygons;
  }

  // Get border color based on drought level
  getBorderColor(level) {
    const borderColors = ['#4a90e2', '#f5a623', '#f8e71c', '#ff6b35', '#d0021b', '#9013fe'];
    return borderColors[level] || borderColors[0];
  }

  // Get border weight based on intensity
  getBorderWeight(intensity) {
    return Math.max(1, Math.min(3, intensity * 3));
  }

  // Get fill opacity based on intensity and heat-map intensity
  getFillOpacity(intensity, heatmapIntensity = 0.5) {
    // Base opacity from drought intensity
    let baseOpacity = Math.max(0.2, Math.min(0.9, intensity * 0.8));
    
    // Adjust opacity based on heat-map intensity
    // Higher heat-map intensity = more visible
    const heatmapFactor = 0.3 + (heatmapIntensity * 0.7); // 0.3 to 1.0
    
    return Math.min(0.9, baseOpacity * heatmapFactor);
  }

  // Create enhanced tooltip content
  createTooltipContent(stateData) {
    const intensityPercent = Math.round(stateData.intensity * 100);
    const heatmapPercent = Math.round((stateData.heatmapIntensity || 0.5) * 100);
    return `
      <div class="tooltip-content">
        <strong>${stateData.name}</strong><br>
        <span class="drought-level">${stateData.levelName}</span><br>
        <span class="intensity">Intensidad: ${intensityPercent}%</span><br>
        <span class="heatmap-intensity">Mapa de Calor: ${heatmapPercent}%</span><br>
        <span class="date">${stateData.date}</span>
      </div>
    `;
  }

  // Create detailed popup content
  createPopupContent(stateData) {
    const intensityPercent = Math.round(stateData.intensity * 100);
    const heatmapPercent = Math.round((stateData.heatmapIntensity || 0.5) * 100);
    const climateZone = this.getClimateZoneName(stateData.climateZone);
    
    return `
      <div class="popup-content">
        <h3>${stateData.name}</h3>
        <div class="drought-info">
          <div class="info-row">
            <span class="label">Nivel de Sequía:</span>
            <span class="value drought-${stateData.level}">${stateData.levelName}</span>
          </div>
          <div class="info-row">
            <span class="label">Intensidad:</span>
            <span class="value">${intensityPercent}%</span>
          </div>
          <div class="info-row">
            <span class="label">Mapa de Calor:</span>
            <span class="value">${heatmapPercent}%</span>
          </div>
          <div class="info-row">
            <span class="label">Zona Climática:</span>
            <span class="value">${climateZone}</span>
          </div>
          <div class="info-row">
            <span class="label">Fecha:</span>
            <span class="value">${stateData.date}</span>
          </div>
        </div>
        <div class="drought-bar">
          <div class="drought-fill" style="width: ${intensityPercent}%; background-color: ${stateData.color};"></div>
        </div>
        <div class="heatmap-bar">
          <div class="heatmap-fill" style="width: ${heatmapPercent}%; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f97316, #ef4444);"></div>
        </div>
      </div>
    `;
  }

  // Get climate zone name in Spanish
  getClimateZoneName(zone) {
    const zoneNames = {
      'desert': 'Desértico',
      'arid': 'Árido',
      'temperate': 'Templado',
      'tropical': 'Tropical'
    };
    return zoneNames[zone] || zone;
  }

  // Update map with new drought data
  updateDroughtMap(date, heatmapIntensity = 0.5) {
    console.log('MapVisualizer: updateDroughtMap called with date:', date, 'heatmapIntensity:', heatmapIntensity);
    
    // Cancel any ongoing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Show loading state
    this.showLoading();

    // Use requestAnimationFrame for smooth updates
    this.animationFrame = requestAnimationFrame(() => {
      try {
        // Remove existing layer
        if (this.currentDroughtLayer) {
          this.map.removeLayer(this.currentDroughtLayer);
          console.log('MapVisualizer: Removed existing drought layer');
        }

        // Calculate new drought data with heat-map intensity
        console.log('MapVisualizer: Getting drought data...');
        const droughtData = this.droughtCalculator.getStatesDroughtData(date, heatmapIntensity);
        console.log('MapVisualizer: Got drought data:', droughtData.length, 'states');
        
        // Create new polygons
        console.log('MapVisualizer: Creating polygons...');
        const polygons = this.createDroughtPolygons(droughtData);
        console.log('MapVisualizer: Created', polygons.length, 'polygons');
        
        // Add to map with smooth animation
        this.currentDroughtLayer = L.layerGroup(polygons);
        this.currentDroughtLayer.addTo(this.map);
        console.log('MapVisualizer: Added polygons to map');

        // Hide loading state
        this.hideLoading();

        // Trigger custom event for UI updates
        this.map.fire('droughtmap:updated', {
          date: date,
          data: droughtData,
          heatmapIntensity: heatmapIntensity
        });
        
        console.log('MapVisualizer: updateDroughtMap completed successfully');

      } catch (error) {
        console.error('Error updating drought map:', error);
        this.hideLoading();
      }
    });
  }

  // Show loading indicator
  showLoading() {
    if (!document.querySelector('.loading')) {
      const loading = document.createElement('div');
      loading.className = 'loading';
      loading.textContent = 'Cargando datos de sequía...';
      document.body.appendChild(loading);
    }
  }

  // Hide loading indicator
  hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
      loading.remove();
    }
  }

  // Animate through time range
  animateTimeRange(startDate, endDate, duration = 10000, callback) {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const totalDuration = endTime - startTime;
    const startAnimationTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startAnimationTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentTime = startTime + (totalDuration * progress);
      const currentDate = new Date(currentTime);
      
      this.updateDroughtMap(currentDate);
      
      if (callback) {
        callback(currentDate, progress);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Get current drought layer for external access
  getCurrentDroughtLayer() {
    return this.currentDroughtLayer;
  }

  // Clean up resources
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.currentDroughtLayer) {
      this.map.removeLayer(this.currentDroughtLayer);
    }
  }
}
