import React from 'react'
import { create } from 'zustand'
import { Earthquake, EarthquakeFilters, EarthquakeAlert } from '@/types/earthquake'
import { USGSApiClient } from '@/lib/usgs-api'

interface EarthquakeStore {
  // State
  earthquakes: Earthquake[]
  filteredEarthquakes: Earthquake[]
  selectedEarthquake: Earthquake | null
  filters: EarthquakeFilters
  alerts: EarthquakeAlert[]
  isLoading: boolean
  lastUpdated: number | null
  error: string | null

  // Actions
  setEarthquakes: (earthquakes: Earthquake[]) => void
  setSelectedEarthquake: (earthquake: Earthquake | null) => void
  setFilters: (filters: EarthquakeFilters) => void
  addAlert: (earthquake: Earthquake) => void
  markAlertAsRead: (alertId: string) => void
  clearAlerts: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Async actions
  fetchRecentEarthquakes: (
    timeframe?: 'hour' | 'day' | 'week' | 'month',
    significance?: 'all' | 'significant' | 'M4.5+' | 'M2.5+' | 'M1.0+'
  ) => Promise<void>
  fetchFilteredEarthquakes: (filters: EarthquakeFilters) => Promise<void>
  applyFilters: () => void
}

export const useEarthquakeStore = create<EarthquakeStore>((set, get) => ({
  // Initial state
  earthquakes: [],
  filteredEarthquakes: [],
  selectedEarthquake: null,
  filters: {},
  alerts: [],
  isLoading: false,
  lastUpdated: null,
  error: null,

  // Actions
  setEarthquakes: (earthquakes) => {
    set({ earthquakes, lastUpdated: Date.now() })
    get().applyFilters()
  },

  setSelectedEarthquake: (earthquake) => {
    set({ selectedEarthquake: earthquake })
  },

  setFilters: (filters) => {
    set({ filters })
    get().applyFilters()
  },

  addAlert: (earthquake) => {
    const { alerts } = get()
    const existingAlert = alerts.find(alert => alert.earthquake.id === earthquake.id)
    
    if (!existingAlert) {
      const newAlert: EarthquakeAlert = {
        id: `alert-${earthquake.id}-${Date.now()}`,
        earthquake,
        timestamp: Date.now(),
        read: false
      }
      set({ alerts: [newAlert, ...alerts] })
    }
  },

  markAlertAsRead: (alertId) => {
    set(state => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    }))
  },

  clearAlerts: () => {
    set({ alerts: [] })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setError: (error) => {
    set({ error })
  },

  // Async actions
  fetchRecentEarthquakes: async (timeframe = 'day', significance = 'all') => {
    const { setLoading, setError, setEarthquakes } = get()
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await USGSApiClient.getRecentEarthquakes(timeframe, significance)
      setEarthquakes(data.features)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch earthquakes')
    } finally {
      setLoading(false)
    }
  },

  fetchFilteredEarthquakes: async (filters) => {
    const { setLoading, setError, setEarthquakes } = get()
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await USGSApiClient.getEarthquakesWithFilters(filters)
      setEarthquakes(data.features)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch filtered earthquakes')
    } finally {
      setLoading(false)
    }
  },

  applyFilters: () => {
    const { earthquakes, filters } = get()
    
    let filtered = [...earthquakes]
    
    // Filter by magnitude
    if (filters.minMagnitude !== undefined) {
      filtered = filtered.filter(eq => eq.properties.mag >= filters.minMagnitude!)
    }
    if (filters.maxMagnitude !== undefined) {
      filtered = filtered.filter(eq => eq.properties.mag <= filters.maxMagnitude!)
    }
    
    // Filter by time
    if (filters.startTime) {
      filtered = filtered.filter(eq => eq.properties.time >= filters.startTime!.getTime())
    }
    if (filters.endTime) {
      filtered = filtered.filter(eq => eq.properties.time <= filters.endTime!.getTime())
    }
    
    // Filter by alert level
    if (filters.alertLevel) {
      filtered = filtered.filter(eq => eq.properties.alert === filters.alertLevel)
    }
    
    // Filter by location (simple text search in place name)
    if (filters.location) {
      const location = filters.location.toLowerCase()
      filtered = filtered.filter(eq => 
        eq.properties.place.toLowerCase().includes(location)
      )
    }
    
    // Sort by time (most recent first)
    filtered.sort((a, b) => b.properties.time - a.properties.time)
    
    set({ filteredEarthquakes: filtered })
  }
}))

// Auto-refresh hook
export const useAutoRefresh = (intervalMs: number = 300000) => { // 5 minutes default
  const fetchRecentEarthquakes = useEarthquakeStore(state => state.fetchRecentEarthquakes)
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentEarthquakes()
    }, intervalMs)
    
    return () => clearInterval(interval)
  }, [fetchRecentEarthquakes, intervalMs])
}