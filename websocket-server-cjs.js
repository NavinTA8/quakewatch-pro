// CommonJS wrapper for TypeScript WebSocket server
const { WebSocketServer } = require('ws')

// Polyfill fetch for Node.js if not available
if (!global.fetch) {
  const { fetch } = require('undici')
  global.fetch = fetch
}

// Simple recreation of the earthquake WebSocket server for CommonJS
class EarthquakeWebSocketServer {
  constructor() {
    this.wss = null
    this.clients = new Set()
    this.updateInterval = null
    this.lastEarthquakes = []
  }

  async initialize(port = 8080) {
    if (this.wss) {
      console.log('WebSocket server already running on port', port)
      return
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Starting WebSocket server on port ${port}...`)
        
        this.wss = new WebSocketServer({ 
          port,
          perMessageDeflate: false
        })
        
        this.wss.on('listening', () => {
          console.log(`✅ WebSocket server successfully started on port ${port}`)
          this.startPeriodicUpdates()
          resolve()
        })
        
        this.wss.on('error', (error) => {
          console.error('❌ WebSocket server error:', error.message)
          
          if (error.code === 'EADDRINUSE') {
            const errorMsg = `Port ${port} is already in use. Try a different port.`
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
    
        this.wss.on('connection', (ws, request) => {
          console.log('✨ New WebSocket connection established')
          
          this.clients.add(ws)
          
          // Send initial earthquake data
          this.sendInitialData(ws)
          
          ws.on('message', (message) => {
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
            console.error('WebSocket connection error:', error)
            this.clients.delete(ws)
          })
          
          // Send ping every 30 seconds to keep connection alive
          const pingInterval = setInterval(() => {
            if (ws.readyState === ws.OPEN) {
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

  async sendInitialData(ws) {
    try {
      // Fetch real earthquake data from USGS API
      const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson')
      const data = await response.json()
      
      this.lastEarthquakes = data.features || []
      
      const message = {
        type: 'initial-data',
        data: data.features || [],
        timestamp: Date.now()
      }
      
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message))
      }
    } catch (error) {
      console.error('Failed to send initial data:', error)
      
      const errorMessage = {
        type: 'error',
        data: { message: 'Failed to fetch initial earthquake data' },
        timestamp: Date.now()
      }
      
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(errorMessage))
      }
    }
  }

  handleClientMessage(ws, message) {
    if (message.type === 'ping') {
      const pongMessage = {
        type: 'ping',
        data: { pong: true },
        timestamp: Date.now()
      }
      
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(pongMessage))
      }
    }
  }

  startPeriodicUpdates() {
    // Update every 5 minutes
    this.updateInterval = setInterval(() => {
      this.checkForNewEarthquakes()
    }, 5 * 60 * 1000)

    // Also check immediately
    this.checkForNewEarthquakes()
  }

  async checkForNewEarthquakes() {
    try {
      console.log('🔄 Checking for earthquake updates...')
      
      const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson')
      const data = await response.json()
      const newEarthquakes = data.features || []
      
      // Find truly new earthquakes (not in the last update)
      const lastIds = new Set(this.lastEarthquakes.map(eq => eq.id))
      const newOnes = newEarthquakes.filter(eq => !lastIds.has(eq.id))
      
      if (newOnes.length > 0) {
        console.log(`Found ${newOnes.length} new earthquakes`)
        
        const message = {
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
      console.error('Error checking for earthquakes:', error)
      
      const errorMessage = {
        type: 'error',
        data: { message: 'Failed to check for earthquake updates' },
        timestamp: Date.now()
      }
      
      this.broadcast(errorMessage)
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message)
    
    this.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
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
    console.log('🛑 WebSocket server stopped')
  }
}

const earthquakeWebSocketServer = new EarthquakeWebSocketServer()

module.exports = {
  earthquakeWebSocketServer
}