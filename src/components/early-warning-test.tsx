'use client'

import { useState } from 'react'
import { Play, AlertTriangle, MapPin, Zap, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { calculateEarlyWarning, identifyThreatZone, isThailandThreat, THAILAND_LOCATIONS } from '@/lib/early-warning'
import { Earthquake } from '@/types/earthquake'

interface TestScenario {
  name: string
  magnitude: number
  latitude: number
  longitude: number
  location: string
  description: string
  expectedThreat: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Myanmar Border Earthquake',
    magnitude: 6.2,
    latitude: 19.0,
    longitude: 98.0,
    location: 'Myanmar-Thailand Border Region',
    description: 'Moderate earthquake near Thai border - should trigger regional alert',
    expectedThreat: 'HIGH'
  },
  {
    name: 'Sumatra Major Earthquake',
    magnitude: 7.8,
    latitude: 2.0,
    longitude: 95.0,
    location: 'Off the west coast of northern Sumatra',
    description: 'Major earthquake in Sumatra - distant but very large magnitude',
    expectedThreat: 'MODERATE'
  },
  {
    name: 'Philippines Strong Earthquake',
    magnitude: 7.2,
    latitude: 14.5,
    longitude: 120.5,
    location: 'Luzon, Philippines',
    description: 'Strong earthquake in Philippines - tests distant threat detection',
    expectedThreat: 'LOW'
  },
  {
    name: 'Local Thailand Earthquake',
    magnitude: 5.8,
    latitude: 18.8,
    longitude: 98.9,
    location: 'Northern Thailand',
    description: 'Local earthquake near Chiang Mai - close proximity, moderate magnitude',
    expectedThreat: 'HIGH'
  },
  {
    name: 'Java Critical Earthquake',
    magnitude: 8.1,
    latitude: -7.0,
    longitude: 110.0,
    location: 'Java, Indonesia',
    description: 'Critical magnitude earthquake - tests maximum threat scenarios',
    expectedThreat: 'MODERATE'
  }
]

export const EarlyWarningTest = () => {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(TEST_SCENARIOS[0])
  const [customScenario, setCustomScenario] = useState({
    magnitude: 6.0,
    latitude: 15.0,
    longitude: 100.0,
    location: 'Custom Location'
  })
  const [testLocation, setTestLocation] = useState(THAILAND_LOCATIONS[0]) // Bangkok
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  const createTestEarthquake = (scenario: TestScenario | typeof customScenario): Earthquake => {
    const now = Date.now()
    return {
      type: 'Feature',
      id: `test-${now}`,
      geometry: {
        type: 'Point',
        coordinates: [scenario.longitude, scenario.latitude, 10] // 10km depth
      },
      properties: {
        mag: scenario.magnitude,
        place: scenario.location,
        time: now,
        updated: now,
        tz: null,
        url: '',
        detail: '',
        felt: null,
        cdi: null,
        mmi: null,
        alert: null,
        status: 'reviewed',
        tsunami: 0,
        sig: Math.round(scenario.magnitude * 100),
        net: 'test',
        code: `test${now}`,
        ids: `test${now}`,
        sources: 'test',
        types: 'origin,phase-data',
        nst: null,
        dmin: null,
        rms: 0.1,
        gap: null,
        magType: 'mw',
        type: 'earthquake',
        title: `M ${scenario.magnitude} - ${scenario.location}`
      }
    }
  }

  const runTest = async (useCustom = false) => {
    setIsRunning(true)
    
    try {
      const scenario = useCustom ? customScenario : selectedScenario
      const testEarthquake = createTestEarthquake(scenario)
      
      // Test threat detection
      const isThreat = isThailandThreat(testEarthquake)
      const threatZone = identifyThreatZone(testEarthquake)
      
      // Calculate early warning for test location
      const warningData = calculateEarlyWarning(
        testEarthquake,
        testLocation.lat,
        testLocation.lng
      )
      
      const results = {
        earthquake: testEarthquake,
        testLocation: testLocation,
        threatDetection: {
          isThreat,
          threatZone,
          expectedThreat: useCustom ? 'Unknown' : selectedScenario.expectedThreat
        },
        warningData,
        timestamp: new Date().toLocaleTimeString()
      }
      
      setTestResults(results)
      
      // Log results for debugging
      console.log('🧪 Early Warning Test Results:', results)
      
    } catch (error) {
      console.error('Test failed:', error)
      setTestResults({ error: error.message })
    }
    
    setIsRunning(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Early Warning System Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Location Selection */}
          <div>
            <Label className="text-sm font-medium">Test Location (Your Position)</Label>
            <Select 
              value={testLocation.name} 
              onValueChange={(value) => {
                const location = THAILAND_LOCATIONS.find(l => l.name === value)
                if (location) setTestLocation(location)
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THAILAND_LOCATIONS.map(location => (
                  <SelectItem key={location.name} value={location.name}>
                    {location.name} - {location.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Predefined Scenarios */}
          <div>
            <Label className="text-sm font-medium">Predefined Test Scenarios</Label>
            <div className="mt-2 space-y-2">
              {TEST_SCENARIOS.map((scenario) => (
                <div key={scenario.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-sm text-muted-foreground">
                      M{scenario.magnitude} • {scenario.location}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {scenario.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={scenario.expectedThreat === 'CRITICAL' ? 'destructive' : 'secondary'}>
                      {scenario.expectedThreat}
                    </Badge>
                    <Button
                      size="sm"
                      variant={selectedScenario.name === scenario.name ? "default" : "outline"}
                      onClick={() => {
                        setSelectedScenario(scenario)
                        runTest(false)
                      }}
                      disabled={isRunning}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Scenario */}
          <div>
            <Label className="text-sm font-medium">Custom Test Scenario</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Magnitude</Label>
                <Input
                  type="number"
                  min="1"
                  max="9"
                  step="0.1"
                  value={customScenario.magnitude}
                  onChange={(e) => setCustomScenario(prev => ({
                    ...prev,
                    magnitude: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs">Latitude</Label>
                <Input
                  type="number"
                  min="-90"
                  max="90"
                  step="0.1"
                  value={customScenario.latitude}
                  onChange={(e) => setCustomScenario(prev => ({
                    ...prev,
                    latitude: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs">Longitude</Label>
                <Input
                  type="number"
                  min="-180"
                  max="180"
                  step="0.1"
                  value={customScenario.longitude}
                  onChange={(e) => setCustomScenario(prev => ({
                    ...prev,
                    longitude: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input
                  value={customScenario.location}
                  onChange={(e) => setCustomScenario(prev => ({
                    ...prev,
                    location: e.target.value
                  }))}
                />
              </div>
            </div>
            <Button
              className="mt-3"
              onClick={() => runTest(true)}
              disabled={isRunning}
            >
              <Settings className="h-4 w-4 mr-2" />
              Run Custom Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Test Results - {testResults.timestamp}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.error ? (
              <div className="text-red-600">Error: {testResults.error}</div>
            ) : (
              <div className="space-y-4">
                {/* Earthquake Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Simulated Earthquake</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Magnitude:</strong> M{testResults.earthquake.properties.mag}</p>
                      <p><strong>Location:</strong> {testResults.earthquake.properties.place}</p>
                      <p><strong>Coordinates:</strong> {testResults.earthquake.geometry.coordinates[1]}°N, {testResults.earthquake.geometry.coordinates[0]}°E</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Test Location</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>City:</strong> {testResults.testLocation.name}</p>
                      <p><strong>Region:</strong> {testResults.testLocation.region}</p>
                      <p><strong>Coordinates:</strong> {testResults.testLocation.lat}°N, {testResults.testLocation.lng}°E</p>
                    </div>
                  </div>
                </div>

                {/* Threat Detection Results */}
                <div>
                  <h4 className="font-semibold mb-2">Threat Detection</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded">
                      <div className="text-xs text-muted-foreground">Thailand Threat</div>
                      <div className={`font-semibold ${testResults.threatDetection.isThreat ? 'text-red-600' : 'text-green-600'}`}>
                        {testResults.threatDetection.isThreat ? 'YES' : 'NO'}
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-xs text-muted-foreground">Threat Zone</div>
                      <div className="font-semibold">
                        {testResults.threatDetection.threatZone || 'None'}
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-xs text-muted-foreground">Expected Level</div>
                      <Badge variant="secondary">
                        {testResults.threatDetection.expectedThreat}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Warning Calculation Results */}
                {testResults.warningData && (
                  <div>
                    <h4 className="font-semibold mb-2">Early Warning Calculation</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-3 border rounded">
                        <div className="text-xs text-muted-foreground">Distance</div>
                        <div className="font-semibold">{testResults.warningData.distanceKm.toFixed(1)} km</div>
                      </div>
                      <div className="p-3 border rounded">
                        <div className="text-xs text-muted-foreground">Warning Time</div>
                        <div className="font-semibold">{testResults.warningData.warningTimeSeconds}s</div>
                      </div>
                      <div className="p-3 border rounded">
                        <div className="text-xs text-muted-foreground">Threat Level</div>
                        <Badge variant={testResults.warningData.threatLevel === 'CRITICAL' ? 'destructive' : 'secondary'}>
                          {testResults.warningData.threatLevel}
                        </Badge>
                      </div>
                      <div className="p-3 border rounded">
                        <div className="text-xs text-muted-foreground">Valid Warning</div>
                        <div className={`font-semibold ${testResults.warningData.isWarningValid ? 'text-green-600' : 'text-red-600'}`}>
                          {testResults.warningData.isWarningValid ? 'YES' : 'NO'}
                        </div>
                      </div>
                    </div>

                    {testResults.warningData.isWarningValid && (
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <h5 className="font-semibold text-amber-800 dark:text-amber-200">Recommended Action</h5>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          {testResults.warningData.actionRequired}
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                          Expected: {testResults.warningData.expectedIntensity}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}