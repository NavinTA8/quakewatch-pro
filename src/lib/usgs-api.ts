import { EarthquakeFeatureCollection, EarthquakeFilters } from '@/types/earthquake'

export class USGSApiClient {
  private static readonly BASE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0'
  private static readonly DETAIL_URL = 'https://earthquake.usgs.gov/fdsnws/event/1'

  static async getRecentEarthquakes(
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
    significance: 'all' | 'significant' | 'M4.5+' | 'M2.5+' | 'M1.0+' = 'all'
  ): Promise<EarthquakeFeatureCollection> {
    const endpoint = this.buildFeedEndpoint(timeframe, significance)
    
    try {
      const response = await fetch(`${this.BASE_URL}/${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch earthquake data:', error)
      throw error
    }
  }

  static async getEarthquakesWithFilters(filters: EarthquakeFilters): Promise<EarthquakeFeatureCollection> {
    const params = new URLSearchParams()
    
    params.append('format', 'geojson')
    params.append('orderby', 'time')
    
    if (filters.minMagnitude) {
      params.append('minmagnitude', filters.minMagnitude.toString())
    }
    if (filters.maxMagnitude) {
      params.append('maxmagnitude', filters.maxMagnitude.toString())
    }
    if (filters.startTime) {
      params.append('starttime', filters.startTime.toISOString())
    }
    if (filters.endTime) {
      params.append('endtime', filters.endTime.toISOString())
    }
    if (filters.alertLevel) {
      params.append('alertlevel', filters.alertLevel)
    }
    
    try {
      const response = await fetch(`${this.DETAIL_URL}/query?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch filtered earthquake data:', error)
      throw error
    }
  }

  private static buildFeedEndpoint(
    timeframe: 'hour' | 'day' | 'week' | 'month',
    significance: 'all' | 'significant' | 'M4.5+' | 'M2.5+' | 'M1.0+'
  ): string {
    const significanceMap = {
      'all': 'all',
      'significant': 'significant',
      'M4.5+': '4.5',
      'M2.5+': '2.5',
      'M1.0+': '1.0'
    }
    
    const timeMap = {
      'hour': 'hour',
      'day': 'day', 
      'week': 'week',
      'month': 'month'
    }
    
    if (significance === 'significant') {
      return `summary/significant_${timeMap[timeframe]}.geojson`
    }
    
    if (significance === 'all') {
      return `summary/all_${timeMap[timeframe]}.geojson`
    }
    
    return `summary/${significanceMap[significance]}_${timeMap[timeframe]}.geojson`
  }

  static getMagnitudeColor(magnitude: number | null): string {
    if (magnitude === null || magnitude === undefined) return '#gray-400' // Gray for unknown
    if (magnitude >= 7.0) return '#d73027' // Dark red
    if (magnitude >= 6.0) return '#f46d43' // Red-orange
    if (magnitude >= 5.0) return '#fdae61' // Orange
    if (magnitude >= 4.0) return '#fee08b' // Light orange
    if (magnitude >= 3.0) return '#e6f598' // Light green
    if (magnitude >= 2.0) return '#abdda4' // Green
    return '#66c2a5' // Light blue-green
  }

  static getMagnitudeSize(magnitude: number | null): number {
    if (magnitude === null || magnitude === undefined) return 6 // Default size for unknown
    return Math.max(4, Math.min(40, magnitude * 6))
  }

  static formatMagnitude(magnitude: number | null): string {
    if (magnitude === null || magnitude === undefined) {
      return 'N/A'
    }
    return magnitude.toFixed(1)
  }

  static formatDepth(depth: number): string {
    return `${depth.toFixed(1)} km`
  }

  static formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString()
  }

  static getTimeAgo(timestamp: number): string {
    const now = Date.now()
    const diffMs = now - timestamp
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    }
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }
}