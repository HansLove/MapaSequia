// Drought Intensity Calculator with Climate Projections
import { mexicanStates, climateProjectionFactors } from '../data/mexican-states.js';

export class DroughtCalculator {
  constructor() {
    this.states = mexicanStates;
    this.climateFactors = climateProjectionFactors;
  }

  // Generate time array from 2020 to 2050 (monthly)
  generateTimeArray() {
    const times = [];
    const start = new Date('2020-01-01');
    const end = new Date('2050-12-01');
    const current = new Date(start);
    
    while (current <= end) {
      times.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return times;
  }

  // Calculate drought intensity for a specific state and date
  calculateDroughtIntensity(state, date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Seasonal variation (dry season: Nov-Apr, wet season: May-Oct)
    const isDrySeason = month >= 10 || month <= 3;
    const seasonalFactor = isDrySeason ? 1.3 : 0.7;
    
    // Multi-year drought cycles (4-year cycle)
    const cyclePhase = (year - 2020) % 4;
    const cycleFactors = [1.5, 1.2, 0.8, 0.6]; // Peak, high, low, recovery
    const cycleFactor = cycleFactors[cyclePhase];
    
    // Climate change projection factor (2025-2050)
    let climateFactor = 1.0;
    if (year >= 2025) {
      climateFactor = this.climateFactors[year] || 2.35; // Default to max if beyond 2050
    }
    
    // Regional climate zone modifier
    const climateZoneModifier = this.getClimateZoneModifier(state.climateZone, year);
    
    // Calculate final intensity
    const finalIntensity = Math.min(1.0, 
      state.baseIntensity * 
      seasonalFactor * 
      cycleFactor * 
      climateFactor * 
      climateZoneModifier
    );
    
    return finalIntensity;
  }

  // Get climate zone modifier based on climate change projections
  getClimateZoneModifier(climateZone, year) {
    const baseModifiers = {
      'desert': 1.0,      // Already dry, less affected
      'arid': 1.1,        // Moderately affected
      'temperate': 1.2,   // More affected
      'tropical': 1.3     // Most affected by climate change
    };
    
    const baseModifier = baseModifiers[climateZone] || 1.0;
    
    // Increase impact over time
    if (year >= 2025) {
      const yearsFrom2025 = year - 2025;
      const additionalImpact = yearsFrom2025 * 0.02; // 2% increase per year
      return baseModifier + additionalImpact;
    }
    
    return baseModifier;
  }

  // Get drought level (0-4) from intensity (0-1)
  getDroughtLevel(intensity) {
    return Math.floor(intensity * 4);
  }

  // Get drought level name
  getDroughtLevelName(level) {
    const levelNames = ['Normal', 'D0 - Anormalmente Seco', 'D1 - Sequía Moderada', 'D2 - Sequía Severa', 'D3 - Sequía Extrema', 'D4 - Sequía Excepcional'];
    return levelNames[level] || levelNames[0];
  }

  // Get heat map color for drought level with heat-map intensity modifier
  getHeatMapColor(level, intensity, heatmapIntensity = 0.5) {
    // Dramatic color schemes that change significantly with heat-map intensity
    const colorSchemes = {
      0: { 
        normal: '#e6f3ff',    // Light blue
        moderate: '#3b82f6',  // Blue
        extreme: '#1e40af'    // Dark blue
      },
      1: { 
        normal: '#ffffcc',    // Light yellow
        moderate: '#f59e0b',  // Orange
        extreme: '#dc2626'    // Red
      },
      2: { 
        normal: '#ffd966',    // Yellow
        moderate: '#f97316',  // Orange-red
        extreme: '#dc2626'    // Red
      },
      3: { 
        normal: '#ffb366',    // Light orange
        moderate: '#ef4444',  // Red
        extreme: '#991b1b'    // Dark red
      },
      4: { 
        normal: '#ff8c66',    // Orange
        moderate: '#dc2626',  // Red
        extreme: '#7f1d1d'    // Very dark red
      },
      5: { 
        normal: '#ff6666',    // Light red
        moderate: '#991b1b',  // Dark red
        extreme: '#450a0a'    // Almost black
      }
    };
    
    const scheme = colorSchemes[level] || colorSchemes[0];
    
    // Create dramatic color changes based on heat-map intensity
    let finalColor;
    
    if (heatmapIntensity <= 0.33) {
      // Low intensity - use normal colors
      finalColor = scheme.normal;
    } else if (heatmapIntensity <= 0.66) {
      // Medium intensity - interpolate between normal and moderate
      const factor = (heatmapIntensity - 0.33) / 0.33;
      finalColor = this.interpolateColor(scheme.normal, scheme.moderate, factor);
    } else {
      // High intensity - interpolate between moderate and extreme
      const factor = (heatmapIntensity - 0.66) / 0.34;
      finalColor = this.interpolateColor(scheme.moderate, scheme.extreme, factor);
    }
    
    // Add some variation based on drought intensity within the level
    const intensityInLevel = (intensity * 4) % 1;
    if (intensityInLevel > 0.5) {
      // Make it slightly brighter for higher intensity
      finalColor = this.lightenColor(finalColor, 0.1);
    }
    
    return finalColor;
  }

  // Apply heat effect to color (increase saturation and brightness)
  applyHeatEffect(baseColor, heatColor, factor) {
    const base = this.hexToRgb(baseColor);
    const heat = this.hexToRgb(heatColor);
    
    const r = Math.round(base.r + (heat.r - base.r) * factor);
    const g = Math.round(base.g + (heat.g - base.g) * factor);
    const b = Math.round(base.b + (heat.b - base.b) * factor);
    
    return this.rgbToHex(r, g, b);
  }

  // Apply cool effect to color (decrease saturation)
  applyCoolEffect(baseColor, factor) {
    const rgb = this.hexToRgb(baseColor);
    
    // Convert to grayscale and blend
    const gray = Math.round(rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
    
    const r = Math.round(rgb.r + (gray - rgb.r) * factor);
    const g = Math.round(rgb.g + (gray - rgb.g) * factor);
    const b = Math.round(rgb.b + (gray - rgb.b) * factor);
    
    return this.rgbToHex(r, g, b);
  }

  // Convert hex to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Convert RGB to hex
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Lighten a color by a factor (0-1)
  lightenColor(hexColor, factor) {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return hexColor;
    
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));
    
    return this.rgbToHex(r, g, b);
  }

  // Interpolate between two colors
  interpolateColor(color1, color2, factor) {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Format date for display
  formatDate(date) {
    return date.toISOString().slice(0, 7); // YYYY-MM
  }

  // Get all states with their drought data for a specific date
  getStatesDroughtData(date, heatmapIntensity = 0.5) {
    console.log('DroughtCalculator: getStatesDroughtData called with date:', date, 'heatmapIntensity:', heatmapIntensity);
    console.log('DroughtCalculator: Processing', this.states.length, 'states');
    
    const result = this.states.map(state => {
      const intensity = this.calculateDroughtIntensity(state, date);
      const level = this.getDroughtLevel(intensity);
      const levelName = this.getDroughtLevelName(level);
      const color = this.getHeatMapColor(level, intensity, heatmapIntensity);
      
      return {
        ...state,
        intensity,
        level,
        levelName,
        color,
        date: this.formatDate(date),
        heatmapIntensity
      };
    });
    
    console.log('DroughtCalculator: Processed', result.length, 'states');
    console.log('DroughtCalculator: Sample state data:', result[0]);
    
    return result;
  }

  // Get heat-map intensity level name
  getHeatMapIntensityName(intensity) {
    if (intensity <= 0.2) return 'Normal';
    if (intensity <= 0.4) return 'Suave';
    if (intensity <= 0.6) return 'Moderado';
    if (intensity <= 0.8) return 'Intenso';
    return 'Extremo';
  }
}
