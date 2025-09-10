'use client'

import { useState, useEffect } from 'react'
import { MapPin, Settings, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { THAILAND_LOCATIONS, ThailandLocation } from '@/lib/early-warning'

interface ThailandLocationSelectorProps {
  onLocationChange: (location: { name: string; lat: number; lng: number }) => void
  initialLocation?: { name: string; lat: number; lng: number }
}

export const ThailandLocationSelector = ({
  onLocationChange,
  initialLocation
}: ThailandLocationSelectorProps) => {
  const [selectedLocation, setSelectedLocation] = useState<ThailandLocation | null>(null)
  const [customLocation, setCustomLocation] = useState({ name: '', lat: '', lng: '' })
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (initialLocation) {
      const matchingLocation = THAILAND_LOCATIONS.find(
        loc => loc.name === initialLocation.name
      )
      if (matchingLocation) {
        setSelectedLocation(matchingLocation)
      } else {
        setCustomLocation({
          name: initialLocation.name,
          lat: initialLocation.lat.toString(),
          lng: initialLocation.lng.toString()
        })
        setIsCustomMode(true)
      }
    } else {
      // Default to Bangkok
      setSelectedLocation(THAILAND_LOCATIONS[0])
      onLocationChange({
        name: THAILAND_LOCATIONS[0].name,
        lat: THAILAND_LOCATIONS[0].lat,
        lng: THAILAND_LOCATIONS[0].lng
      })
    }
  }, [initialLocation, onLocationChange])

  const handleLocationSelect = (locationName: string) => {
    if (locationName === 'custom') {
      setIsCustomMode(true)
      setSelectedLocation(null)
      return
    }

    const location = THAILAND_LOCATIONS.find(loc => loc.name === locationName)
    if (location) {
      setSelectedLocation(location)
      setIsCustomMode(false)
      onLocationChange({
        name: location.name,
        lat: location.lat,
        lng: location.lng
      })
    }
  }

  const handleCustomLocationSubmit = () => {
    const lat = parseFloat(customLocation.lat)
    const lng = parseFloat(customLocation.lng)
    
    if (isNaN(lat) || isNaN(lng) || !customLocation.name) {
      alert('Please enter valid location data')
      return
    }

    if (lat < 5 || lat > 21 || lng < 97 || lng > 106) {
      alert('Please enter coordinates within Thailand region (5-21°N, 97-106°E)')
      return
    }

    onLocationChange({
      name: customLocation.name,
      lat,
      lng
    })
    setIsOpen(false)
  }

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCustomLocation({
          name: 'My Current Location',
          lat: latitude.toString(),
          lng: longitude.toString()
        })
        setIsCustomMode(true)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Could not get your location. Please select manually.')
      }
    )
  }

  const currentLocationName = isCustomMode 
    ? customLocation.name || 'Custom Location'
    : selectedLocation?.name || 'Unknown'

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-blue-500" />
      <span className="text-sm text-gray-600">Location:</span>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <span className="font-medium">{currentLocationName}</span>
            <Settings className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Set Your Location for Early Warning
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Preset Locations */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Major Thai Cities</Label>
                <Select
                  value={!isCustomMode && selectedLocation ? selectedLocation.name : ''}
                  onValueChange={handleLocationSelect}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {THAILAND_LOCATIONS.map((location) => (
                      <SelectItem key={location.name} value={location.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{location.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {location.region}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <span className="text-blue-600">📍 Custom Location</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Current Location Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={requestGeolocation}
                className="w-full text-xs"
              >
                📍 Use My Current Location
              </Button>

              {/* Custom Location Input */}
              {isCustomMode && (
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-xs font-medium">Custom Location</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Location name (e.g., My Home)"
                      value={customLocation.name}
                      onChange={(e) => setCustomLocation(prev => ({ ...prev, name: e.target.value }))}
                      className="text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Latitude (13.7563)"
                        value={customLocation.lat}
                        onChange={(e) => setCustomLocation(prev => ({ ...prev, lat: e.target.value }))}
                        className="text-xs"
                        type="number"
                        step="0.0001"
                      />
                      <Input
                        placeholder="Longitude (100.5018)"
                        value={customLocation.lng}
                        onChange={(e) => setCustomLocation(prev => ({ ...prev, lng: e.target.value }))}
                        className="text-xs"
                        type="number"
                        step="0.0001"
                      />
                    </div>
                    <Button
                      onClick={handleCustomLocationSubmit}
                      size="sm"
                      className="w-full text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Set Custom Location
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                💡 Accurate location ensures precise earthquake arrival time calculations
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Hook for managing user location
export const useThailandLocation = () => {
  const [userLocation, setUserLocation] = useState({
    name: 'Bangkok',
    lat: 13.7563,
    lng: 100.5018
  })

  const updateLocation = (location: { name: string; lat: number; lng: number }) => {
    setUserLocation(location)
    // Save to localStorage
    localStorage.setItem('quakewatch-location', JSON.stringify(location))
  }

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('quakewatch-location')
    if (saved) {
      try {
        const location = JSON.parse(saved)
        setUserLocation(location)
      } catch (error) {
        console.warn('Could not load saved location:', error)
      }
    }
  }, [])

  return {
    userLocation,
    updateLocation
  }
}