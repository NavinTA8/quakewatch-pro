import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { USGSApiClient } from './usgs-api'
import { Earthquake } from '@/types/earthquake'

export interface WebSocketMessage {
  type: 'earthquake-update' | 'initial-data' | 'error' | 'ping'
  data?: unknown
  timestamp: number
}

class EarthquakeWebSocketServer {
  private wss: WebSocketServer | null = null
  private clients: Set<WebSocket> = new Set()
  private updateInterval: NodeJS.Timeout | null = null
  private lastEarthquakes: Earthquake[] = []

  async initialize(port: number = 8080): Promise<void> {
    if (this.wss) {
      console.log('WebSocket server already running on port', port)
      return
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Starting WebSocket server on port ${port}...`)
        
        this.wss = new WebSocketServer({ 
          port,
          perMessageDeflate: false // Disable compression for better performance
        })
        
        // Handle server startup success
        this.wss.on('listening', () => {
          console.log(`✅ WebSocket server successfully started on port ${port}`)
          this.startPeriodicUpdates()
          resolve()
        })
        
        // Handle server errors
        this.wss.on('error', (error: any) => {
          console.error('❌ WebSocket server error:', error.message)
          
          if (error.code === 'EADDRINUSE') {
            const errorMsg = `Port ${port} is already in use. Try a different port or stop the process using port ${port}.`
            console.error(errorMsg)
            reject(new Error(errorMsg))
          } else if (error.code === 'EACCES') {
            const errorMsg = `Permission denied to use port ${port}. Try a port above 1024.`
            console.error(errorMsg)
            reject(new Error(errorMsg))
          } else {
            reject(error)
          }
          
          this.wss = null
        })
    
        this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      console.log('New WebSocket connection established')
      
      this.clients.add(ws)
      
      // Send initial earthquake data
      this.sendInitialData(ws)
      
      ws.on('message', (message: string) => {
        try {
          const parsedMessage = JSON.parse(message)
          this.handleClientMessage(ws, parsedMessage)
        } catch (error) {
          console.error('Invalid message received:', error)
        }
      })
      
      ws.on('close', () => {
        console.log('WebSocket connection closed')
        this.clients.delete(ws)
      })
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        this.clients.delete(ws)
      })
      
      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping()
        } else {
          clearInterval(pingInterval)
        }
        }, 30000)
      })

      } catch (error) {
        console.error('Failed to initialize WebSocket server:', error)
        this.wss = null
        reject(error)
      }
    })
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      const data = await USGSApiClient.getRecentEarthquakes('day', 'all')
      this.lastEarthquakes = data.features
      
      const message: WebSocketMessage = {
        type: 'initial-data',
        data: data.features,
        timestamp: Date.now()
      }
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
      }
    } catch (error) {
      const errorMessage: WebSocketMessage = {
        type: 'error',
        data: { message: 'Failed to fetch initial earthquake data' },
        timestamp: Date.now()
      }
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(errorMessage))
      }
    }
  }

  private handleClientMessage(ws: WebSocket, message: { type?: string }) {
    if (message.type === 'ping') {
      const pongMessage: WebSocketMessage = {
        type: 'ping',
        data: { pong: true },
        timestamp: Date.now()
      }
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(pongMessage))
      }
    }
  }

  private startPeriodicUpdates() {
    // Update every 5 minutes
    this.updateInterval = setInterval(async () => {
      await this.checkForNewEarthquakes()
    }, 5 * 60 * 1000)

    // Also check immediately
    this.checkForNewEarthquakes()
  }

  private async checkForNewEarthquakes() {
    try {
      const data = await USGSApiClient.getRecentEarthquakes('day', 'all')
      const newEarthquakes = data.features
      
      // Find truly new earthquakes (not in the last update)
      const lastIds = new Set(this.lastEarthquakes.map(eq => eq.id))
      const newOnes = newEarthquakes.filter(eq => !lastIds.has(eq.id))
      
      if (newOnes.length > 0) {
        console.log(`Found ${newOnes.length} new earthquakes`)
        
        const message: WebSocketMessage = {
          type: 'earthquake-update',
          data: {
            new: newOnes,
            all: newEarthquakes
          },
          timestamp: Date.now()
        }
        
        this.broadcast(message)
        this.lastEarthquakes = newEarthquakes
      }
    } catch (error) {
      console.error('Error checking for new earthquakes:', error)
      
      const errorMessage: WebSocketMessage = {
        type: 'error',
        data: { message: 'Failed to check for earthquake updates' },
        timestamp: Date.now()
      }
      
      this.broadcast(errorMessage)
    }
  }

  private broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message)
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr)
      }
    })
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    
    if (this.wss) {
      this.wss.close()
      this.wss = null
    }
    
    this.clients.clear()
    console.log('WebSocket server stopped')
  }
}

export const earthquakeWebSocketServer = new EarthquakeWebSocketServer()