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

  // Get heat map color for drought level
  getHeatMapColor(level, intensity) {
    // More sophisticated color scheme with gradients
    const colorSchemes = {
      0: { base: '#e6f3ff', gradient: '#cce7ff' }, // Normal - Light blue
      1: { base: '#ffffcc', gradient: '#fff2a3' }, // D0 - Light yellow
      2: { base: '#ffd966', gradient: '#ffcc33' }, // D1 - Yellow
      3: { base: '#ffb366', gradient: '#ff9933' }, // D2 - Orange
      4: { base: '#ff8c66', gradient: '#ff6b33' }, // D3 - Red-orange
      5: { base: '#ff6666', gradient: '#ff3333' }  // D4 - Red
    };
    
    const scheme = colorSchemes[level] || colorSchemes[0];
    
    // Create gradient based on intensity within the level
    const intensityInLevel = (intensity * 4) % 1;
    return this.interpolateColor(scheme.base, scheme.gradient, intensityInLevel);
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
  getStatesDroughtData(date) {
    console.log('DroughtCalculator: getStatesDroughtData called with date:', date);
    console.log('DroughtCalculator: Processing', this.states.length, 'states');
    
    const result = this.states.map(state => {
      const intensity = this.calculateDroughtIntensity(state, date);
      const level = this.getDroughtLevel(intensity);
      const levelName = this.getDroughtLevelName(level);
      const color = this.getHeatMapColor(level, intensity);
      
      return {
        ...state,
        intensity,
        level,
        levelName,
        color,
        date: this.formatDate(date)
      };
    });
    
    console.log('DroughtCalculator: Processed', result.length, 'states');
    console.log('DroughtCalculator: Sample state data:', result[0]);
    
    return result;
  }
}
