'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, MapPin, Volume2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EarlyWarningData } from '@/lib/early-warning'

interface EmergencyAlertOverlayProps {
  warning: EarlyWarningData
  onDismiss?: () => void
}

export const EmergencyAlertOverlay = ({
  warning,
  onDismiss
}: EmergencyAlertOverlayProps) => {
  const [timeRemaining, setTimeRemaining] = useState(warning.timeToS)
  const [isFlashing, setIsFlashing] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  // Enhanced visual effects for different threat levels
  useEffect(() => {
    let flashInterval: NodeJS.Timeout
    
    if (warning.threatLevel === 'CRITICAL') {
      // Fast flashing for critical threats
      flashInterval = setInterval(() => {
        setIsFlashing(prev => !prev)
      }, 300)
    } else if (warning.threatLevel === 'HIGH') {
      // Moderate flashing for high threats
      flashInterval = setInterval(() => {
        setIsFlashing(prev => !prev)
      }, 600)
    }
    
    return () => {
      if (flashInterval) clearInterval(flashInterval)
    }
  }, [warning.threatLevel])

  // Play emergency sound with enhanced audio alerts
  useEffect(() => {
    if (warning.threatLevel === 'CRITICAL' || warning.threatLevel === 'HIGH') {
      playEmergencySound()
      
      // Play continuous alerts for critical threats
      if (warning.threatLevel === 'CRITICAL' && timeRemaining > 0) {
        const alertInterval = setInterval(() => {
          if (timeRemaining > 5) {
            playEmergencySound()
          }
        }, 3000) // Repeat every 3 seconds
        
        return () => clearInterval(alertInterval)
      }
    }
  }, [warning.threatLevel, timeRemaining])

  const playEmergencySound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContext()
      
      const duration = warning.threatLevel === 'CRITICAL' ? 3 : 2
      const urgency = warning.threatLevel === 'CRITICAL' ? 1.5 : 1.0
      
      // Create multi-tone emergency alert
      const playTone = (frequency: number, startTime: number, toneDuration: number) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime)
        gainNode.gain.setValueAtTime(0.2 * urgency, audioContext.currentTime + startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + toneDuration)
        
        oscillator.start(audioContext.currentTime + startTime)
        oscillator.stop(audioContext.currentTime + startTime + toneDuration)
      }
      
      if (warning.threatLevel === 'CRITICAL') {
        // Critical: Rapid multi-tone siren
        playTone(800, 0, 0.3)
        playTone(1000, 0.3, 0.3)
        playTone(1200, 0.6, 0.3)
        playTone(1000, 0.9, 0.3)
        playTone(800, 1.2, 0.3)
        playTone(1200, 1.5, 0.3)
        playTone(1000, 1.8, 0.3)
        playTone(800, 2.1, 0.3)
      } else if (warning.threatLevel === 'HIGH') {
        // High: Double-tone alert
        playTone(600, 0, 0.5)
        playTone(900, 0.5, 0.5)
        playTone(600, 1.0, 0.5)
        playTone(900, 1.5, 0.5)
      } else {
        // Moderate/Low: Single tone warning
        playTone(700, 0, 1.0)
        playTone(700, 1.2, 0.8)
      }
      
      // Add voice synthesis for critical alerts
      if (warning.threatLevel === 'CRITICAL' && 'speechSynthesis' in window) {
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(
            `Earthquake alert! Magnitude ${warning.earthquake.properties?.mag?.toFixed(1)} earthquake detected. Take cover immediately!`
          )
          utterance.rate = 1.2
          utterance.volume = 0.8
          speechSynthesis.speak(utterance)
        }, duration * 1000)
      }
      
    } catch (error) {
      console.warn('Could not play emergency sound:', error)
    }
  }

  const getThreatColor = (threatLevel: string) => {
    switch (threatLevel) {
      case 'CRITICAL': return 'bg-red-600'
      case 'HIGH': return 'bg-orange-500'
      case 'MODERATE': return 'bg-yellow-500'
      case 'LOW': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getThreatTextColor = (threatLevel: string) => {
    switch (threatLevel) {
      case 'CRITICAL': return 'text-red-600'
      case 'HIGH': return 'text-orange-600'
      case 'MODERATE': return 'text-yellow-600'
      case 'LOW': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "NOW"
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getUrgencyMessage = () => {
    if (timeRemaining <= 0) return "EARTHQUAKE SHAKING NOW!"
    if (timeRemaining <= 10) return "TAKE COVER IMMEDIATELY!"
    if (timeRemaining <= 30) return "EARTHQUAKE INCOMING!"
    return "EARTHQUAKE DETECTED!"
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isFlashing ? 'bg-red-500/90' : 'bg-black/80'
      } backdrop-blur-sm transition-all duration-200`}
      role="alert"
      aria-live="assertive"
    >
      <Card className={`w-full max-w-2xl ${getThreatColor(warning.threatLevel)} text-white animate-pulse shadow-2xl`}>
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-white animate-bounce" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {getUrgencyMessage()}
                </h1>
                <p className="text-white/90 text-lg">
                  M{warning.earthquake.properties?.mag?.toFixed(1) || 'Unknown'} • {warning.distanceKm.toFixed(0)}km away
                </p>
              </div>
            </div>
            {onDismiss && timeRemaining > 30 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Countdown Timer */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-6 w-6 text-white" />
              <span className="text-white/90">Shaking arrives in:</span>
            </div>
            <div 
              className={`text-8xl font-bold text-white ${
                timeRemaining <= 10 ? 'animate-pulse' : ''
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Location Info */}
          <div className="flex items-center gap-2 mb-6 justify-center flex-wrap">
            <MapPin className="h-5 w-5 text-white/80" />
            <span className="text-white/90">{warning.earthquake.properties?.place || 'Unknown location'}</span>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {warning.threatLevel}
            </Badge>
            {warning.threatZone && (
              <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                {warning.threatZone}
              </Badge>
            )}
          </div>

          {/* Safety Instructions */}
          <div className="bg-black/30 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-5 w-5 text-white" />
              <span className="text-white font-semibold">IMMEDIATE ACTION REQUIRED:</span>
            </div>
            <p className="text-white text-xl font-medium mb-2">
              {warning.actionRequired}
            </p>
            <p className="text-white/80">
              Expected: {warning.expectedIntensity}
            </p>
          </div>

          {/* Safety Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-2">DROP</div>
              <div className="text-white/80 text-sm">Get down on hands and knees</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-2">COVER</div>
              <div className="text-white/80 text-sm">Protect head and neck</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-2">HOLD ON</div>
              <div className="text-white/80 text-sm">Hold position until safe</div>
            </div>
          </div>

          {/* Earthquake Details */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/70">Epicenter:</span>
                <div className="text-white font-medium">
                  {warning.earthquake.properties?.place || 'Unknown location'}
                </div>
              </div>
              <div>
                <span className="text-white/70">Detected:</span>
                <div className="text-white font-medium">
                  {new Date(warning.earthquake.properties?.time || 0).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

