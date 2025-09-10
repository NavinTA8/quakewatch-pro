'use client'

import { useState } from 'react'
import { EarthquakeFilters } from '@/types/earthquake'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Filter, 
  X, 
  Search, 
  Calendar,
  AlertTriangle,
  MapPin
} from 'lucide-react'
import { useEarthquakeStore } from '@/stores/earthquake-store'

interface EarthquakeFiltersComponentProps {
  className?: string
}

export const EarthquakeFiltersComponent = ({ 
  className = '' 
}: EarthquakeFiltersComponentProps) => {
  const { filters, setFilters, fetchFilteredEarthquakes, fetchRecentEarthquakes } = useEarthquakeStore()
  const [localFilters, setLocalFilters] = useState<EarthquakeFilters>(filters)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    value !== undefined && value !== null && value !== ''
  )

  const handleFilterChange = (key: keyof EarthquakeFilters, value: unknown) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const applyFilters = async () => {
    // Clean up filters to remove empty/undefined values
    const cleanFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key as keyof EarthquakeFilters] = value
      }
      return acc
    }, {} as EarthquakeFilters)
    
    console.log('Applying filters:', cleanFilters)
    setFilters(cleanFilters)
    
    try {
      if (Object.keys(cleanFilters).length > 0) {
        console.log('Fetching filtered earthquakes...')
        await fetchFilteredEarthquakes(cleanFilters)
      } else {
        console.log('No filters, fetching recent earthquakes...')
        await fetchRecentEarthquakes()
      }
      setIsAdvancedOpen(false) // Close the filter popup on success
    } catch (error) {
      console.error('Error applying filters:', error)
    }
  }

  const clearFilters = async () => {
    setLocalFilters({})
    setFilters({})
    await fetchRecentEarthquakes()
  }

  const handleMagnitudeChange = (values: number[]) => {
    handleFilterChange('minMagnitude', values[0])
    if (values.length > 1) {
      handleFilterChange('maxMagnitude', values[1])
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by location..."
              value={localFilters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 rounded-full">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                  </span>
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="h-6 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Magnitude Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    Magnitude Range
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={[
                        localFilters.minMagnitude || 0,
                        localFilters.maxMagnitude || 10
                      ]}
                      onValueChange={handleMagnitudeChange}
                      max={10}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>M{(localFilters.minMagnitude || 0).toFixed(1)}</span>
                      <span>M{(localFilters.maxMagnitude || 10).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Alert Level Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    Alert Level
                  </Label>
                  <Select 
                    value={localFilters.alertLevel || undefined} 
                    onValueChange={(value) => handleFilterChange('alertLevel', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All alert levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All alert levels</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Date Range
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">Start Date</Label>
                      <Input
                        type="date"
                        value={localFilters.startTime ? 
                          localFilters.startTime.toISOString().split('T')[0] : ''
                        }
                        onChange={(e) => handleFilterChange('startTime', e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">End Date</Label>
                      <Input
                        type="date"
                        value={localFilters.endTime ? 
                          localFilters.endTime.toISOString().split('T')[0] : ''
                        }
                        onChange={(e) => handleFilterChange('endTime', e.target.value ? new Date(e.target.value + 'T23:59:59') : undefined)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={applyFilters} 
                    className="flex-1"
                    size="sm"
                  >
                    Apply Filters
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAdvancedOpen(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.location && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              Location: {filters.location}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => {
                  const newFilters = { ...localFilters }
                  delete newFilters.location
                  setLocalFilters(newFilters)
                  applyFilters()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.minMagnitude !== undefined && (
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Min Mag: M{filters.minMagnitude.toFixed(1)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => {
                  const newFilters = { ...localFilters }
                  delete newFilters.minMagnitude
                  setLocalFilters(newFilters)
                  applyFilters()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.alertLevel && (
            <Badge variant="secondary" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alert: {filters.alertLevel}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => {
                  const newFilters = { ...localFilters }
                  delete newFilters.alertLevel
                  setLocalFilters(newFilters)
                  applyFilters()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}