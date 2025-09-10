/**
 * Thailand Regional Earthquake Early Warning System
 * Seismic wave physics calculations for P-wave and S-wave arrival times
 */

import { Earthquake } from '@/types/earthquake'

export interface ThailandLocation {
  name: string
  lat: number
  lng: number
  region: string
}

export interface EarlyWarningData {
  earthquake: Earthquake
  distanceKm: number
  pWaveArrivalTime: Date
  sWaveArrivalTime: Date
  warningTimeSeconds: number
  threatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  expectedIntensity: string
  actionRequired: string
  isWarningValid: boolean
  threatZone?: string | null // Added for regional threat analysis
}

// Thailand major cities and regions
export const THAILAND_LOCATIONS: ThailandLocation[] = [
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, region: 'Central Thailand' },
  { name: 'Chiang Mai', lat: 18.7883, lng: 98.9853, region: 'Northern Thailand' },
  { name: 'Phuket', lat: 7.8804, lng: 98.3923, region: 'Southern Thailand' },
  { name: 'Pattaya', lat: 12.9279, lng: 100.8701, region: 'Eastern Thailand' },
  { name: 'Hat Yai', lat: 7.0061, lng: 100.4681, region: 'Southern Thailand' },
  { name: 'Khon Kaen', lat: 16.4322, lng: 102.8236, region: 'Northeastern Thailand' },
  { name: 'Nakhon Ratchasima', lat: 14.9799, lng: 102.0977, region: 'Northeastern Thailand' },
  { name: 'Udon Thani', lat: 17.4138, lng: 102.7877, region: 'Northeastern Thailand' },
  { name: 'Surat Thani', lat: 9.1382, lng: 99.3215, region: 'Southern Thailand' },
  { name: 'Mae Hong Son', lat: 19.3014, lng: 97.9676, region: 'Northern Thailand' }
]

// Seismic wave velocities (km/s) for Southeast Asian crust
export const SEISMIC_WAVE_SPEEDS = {
  P_WAVE_SPEED: 6.0, // km/s - Primary waves through regional crust
  S_WAVE_SPEED: 3.5, // km/s - Secondary waves (60% of P-wave speed)
  SURFACE_WAVE_SPEED: 3.2, // km/s - Most damaging waves
}

// Early warning thresholds
export const WARNING_THRESHOLDS = {
  MIN_WARNING_TIME: 10, // seconds - minimum useful warning time
  MAX_WARNING_DISTANCE: 300, // km - maximum effective warning distance
  MIN_MAGNITUDE: 4.0, // minimum magnitude for alerts
  CRITICAL_MAGNITUDE: 6.0, // magnitude threshold for critical alerts
}

// Regional seismic threat zones that can affect Thailand
export const REGIONAL_THREAT_ZONES = {
  // Myanmar-Thailand Border Region
  MYANMAR_BORDER: {
    name: 'Myanmar-Thailand Border',
    bounds: { north: 28, south: 9, east: 101, west: 92 },
    maxDistance: 800, // km from Thailand border
    minMagnitude: 5.0,
    threatMultiplier: 1.5, // Higher threat due to proximity
  },
  
  // Sumatra-Andaman Fault Zone (Indonesia)
  SUMATRA_FAULT: {
    name: 'Sumatra-Andaman Fault Zone',
    bounds: { north: 15, south: -6, east: 100, west: 90 },
    maxDistance: 1000, // km from Thailand
    minMagnitude: 6.5, // Larger quakes needed for distant threat
    threatMultiplier: 1.2,
  },
  
  // Philippines Fault System
  PHILIPPINES_FAULT: {
    name: 'Philippines Fault System',
    bounds: { north: 21, south: 4, east: 127, west: 116 },
    maxDistance: 1200, // km from Thailand
    minMagnitude: 7.0, // Only major quakes affect Thailand from this distance
    threatMultiplier: 0.8,
  },
  
  // Java-Bali Fault Zone (Indonesia)
  JAVA_FAULT: {
    name: 'Java-Bali Fault Zone',
    bounds: { north: -5, south: -9, east: 116, west: 105 },
    maxDistance: 800, // km from southern Thailand
    minMagnitude: 6.0,
    threatMultiplier: 1.0,
  },
  
  // Sagaing Fault (Myanmar)
  SAGAING_FAULT: {
    name: 'Sagaing Fault Zone',
    bounds: { north: 28, south: 16, east: 98, west: 94 },
    maxDistance: 600, // km from northern Thailand
    minMagnitude: 5.5,
    threatMultiplier: 1.3,
  }
}

/**
 * Calculate distance between two geographic points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate P-wave and S-wave arrival times
 */
export function calculateWaveArrivals(
  distanceKm: number,
  earthquakeTime: Date
): { pWaveArrival: Date; sWaveArrival: Date } {
  const pWaveTravelTime = (distanceKm / SEISMIC_WAVE_SPEEDS.P_WAVE_SPEED) * 1000 // milliseconds
  const sWaveTravelTime = (distanceKm / SEISMIC_WAVE_SPEEDS.S_WAVE_SPEED) * 1000 // milliseconds
  
  return {
    pWaveArrival: new Date(earthquakeTime.getTime() + pWaveTravelTime),
    sWaveArrival: new Date(earthquakeTime.getTime() + sWaveTravelTime)
  }
}

/**
 * Determine threat level based on magnitude and distance
 */
export function calculateThreatLevel(
  magnitude: number,
  distanceKm: number
): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  // Modified Mercalli intensity approximation
  const intensity = magnitude - 3 * Math.log10(distanceKm) + 2
  
  if (magnitude >= 7.0 && distanceKm < 100) return 'CRITICAL'
  if (magnitude >= 6.0 && distanceKm < 150) return 'CRITICAL'
  if (magnitude >= 5.5 && distanceKm < 100) return 'HIGH'
  if (magnitude >= 5.0 && distanceKm < 150) return 'HIGH'
  if (magnitude >= 4.5 && distanceKm < 100) return 'MODERATE'
  if (magnitude >= 4.0 && distanceKm < 200) return 'MODERATE'
  
  return 'LOW'
}

/**
 * Get expected shaking intensity description
 */
export function getExpectedIntensity(
  magnitude: number,
  distanceKm: number
): string {
  const intensity = magnitude - 3 * Math.log10(distanceKm) + 2
  
  if (intensity >= 7) return 'Violent shaking - severe damage expected'
  if (intensity >= 6) return 'Very strong shaking - considerable damage'
  if (intensity >= 5) return 'Strong shaking - moderate damage possible'
  if (intensity >= 4) return 'Light to moderate shaking - minor damage'
  if (intensity >= 3) return 'Weak shaking - felt by most people'
  if (intensity >= 2) return 'Very light shaking - felt by few people'
  
  return 'Not felt - no damage expected'
}

/**
 * Get recommended action based on threat level and warning time
 */
export function getRecommendedAction(
  threatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
  warningTimeSeconds: number
): string {
  if (threatLevel === 'CRITICAL') {
    if (warningTimeSeconds < 15) {
      return 'IMMEDIATE: DROP, COVER, HOLD ON! Take cover immediately!'
    } else if (warningTimeSeconds < 60) {
      return 'URGENT: Move away from windows, get under desk or doorway'
    } else {
      return 'EVACUATE: Exit building if possible, avoid elevators'
    }
  }
  
  if (threatLevel === 'HIGH') {
    if (warningTimeSeconds < 30) {
      return 'TAKE COVER: Drop, cover, hold on. Stay away from falling objects'
    } else {
      return 'PREPARE: Move to safe area, away from windows and heavy objects'
    }
  }
  
  if (threatLevel === 'MODERATE') {
    return 'BE READY: Prepare to take cover if shaking begins'
  }
  
  return 'STAY ALERT: Monitor for updates, light shaking possible'
}

/**
 * Calculate early warning data for a user location with regional threat analysis
 */
export function calculateEarlyWarning(
  earthquake: Earthquake,
  userLat: number,
  userLng: number
): EarlyWarningData {
  const [eqLng, eqLat] = earthquake.geometry.coordinates
  const distanceKm = calculateDistance(userLat, userLng, eqLat, eqLng)
  const earthquakeTime = new Date(earthquake.properties.time)
  const magnitude = earthquake.properties.mag || 0
  
  // Identify regional threat zone
  const threatZone = identifyThreatZone(earthquake)
  
  const { pWaveArrival, sWaveArrival } = calculateWaveArrivals(distanceKm, earthquakeTime)
  const now = new Date()
  const warningTimeSeconds = Math.max(0, Math.floor((sWaveArrival.getTime() - now.getTime()) / 1000))
  
  // Enhanced threat level calculation with regional factors
  let threatLevel = calculateThreatLevel(magnitude, distanceKm)
  
  // Apply regional threat zone multiplier
  if (threatZone) {
    const zone = Object.values(REGIONAL_THREAT_ZONES).find(z => z.name === threatZone)
    if (zone && zone.threatMultiplier > 1.0) {
      // Upgrade threat level for high-risk regional zones
      if (threatLevel === 'LOW' && magnitude >= 5.5) threatLevel = 'MODERATE'
      if (threatLevel === 'MODERATE' && magnitude >= 6.5) threatLevel = 'HIGH'
      if (threatLevel === 'HIGH' && magnitude >= 7.5) threatLevel = 'CRITICAL'
    }
  }
  
  const expectedIntensity = getExpectedIntensity(magnitude, distanceKm)
  const actionRequired = getRecommendedAction(threatLevel, warningTimeSeconds)
  
  // Enhanced warning validation with regional considerations
  let maxDistance = WARNING_THRESHOLDS.MAX_WARNING_DISTANCE
  let minMagnitude = WARNING_THRESHOLDS.MIN_MAGNITUDE
  
  if (threatZone) {
    const zone = Object.values(REGIONAL_THREAT_ZONES).find(z => z.name === threatZone)
    if (zone) {
      maxDistance = zone.maxDistance
      minMagnitude = zone.minMagnitude
    }
  }
  
  const isWarningValid = 
    warningTimeSeconds >= WARNING_THRESHOLDS.MIN_WARNING_TIME &&
    distanceKm <= maxDistance &&
    magnitude >= minMagnitude
  
  return {
    earthquake,
    distanceKm,
    pWaveArrivalTime: pWaveArrival,
    sWaveArrivalTime: sWaveArrival,
    warningTimeSeconds,
    threatLevel,
    expectedIntensity,
    actionRequired,
    isWarningValid,
    threatZone
  }
}

/**
 * Identify which regional threat zone an earthquake belongs to
 */
export function identifyThreatZone(earthquake: Earthquake): string | null {
  const [eqLng, eqLat] = earthquake.geometry.coordinates
  
  for (const [zoneKey, zone] of Object.entries(REGIONAL_THREAT_ZONES)) {
    const { bounds } = zone
    if (eqLat >= bounds.south && eqLat <= bounds.north && 
        eqLng >= bounds.west && eqLng <= bounds.east) {
      return zone.name
    }
  }
  return null
}

/**
 * Check if earthquake affects Thailand region using enhanced regional detection
 */
export function isThailandThreat(earthquake: Earthquake): boolean {
  const [eqLng, eqLat] = earthquake.geometry.coordinates
  const magnitude = earthquake.properties.mag || 0
  
  // Check each regional threat zone
  for (const zone of Object.values(REGIONAL_THREAT_ZONES)) {
    const { bounds, maxDistance, minMagnitude } = zone
    
    // Check if earthquake is in this zone's bounds
    if (eqLat >= bounds.south && eqLat <= bounds.north && 
        eqLng >= bounds.west && eqLng <= bounds.east) {
      
      // Check if magnitude meets zone's minimum requirement
      if (magnitude >= minMagnitude) {
        // Check if any Thai city is within threat distance
        const isWithinRange = THAILAND_LOCATIONS.some(location => {
          const distance = calculateDistance(location.lat, location.lng, eqLat, eqLng)
          return distance <= maxDistance
        })
        
        if (isWithinRange) {
          return true
        }
      }
    }
  }
  
  // Fallback to original local threat detection
  const baseRadius = 200 // km
  const magnitudeMultiplier = Math.max(1, magnitude - 4)
  const threatRadius = baseRadius * magnitudeMultiplier
  
  return THAILAND_LOCATIONS.some(location => {
    const distance = calculateDistance(location.lat, location.lng, eqLat, eqLng)
    return distance <= threatRadius && magnitude >= WARNING_THRESHOLDS.MIN_MAGNITUDE
  })
}

/**
 * Get the closest Thai city to an earthquake
 */
export function getClosestThaiCity(earthquake: Earthquake): ThailandLocation | null {
  const [eqLng, eqLat] = earthquake.geometry.coordinates
  
  let closestCity: ThailandLocation | null = null
  let minDistance = Infinity
  
  THAILAND_LOCATIONS.forEach(location => {
    const distance = calculateDistance(location.lat, location.lng, eqLat, eqLng)
    if (distance < minDistance) {
      minDistance = distance
      closestCity = location
    }
  })
  
  return closestCity
}