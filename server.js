const { createServer } = require('http')
const next = require('next')
const { parse } = require('url')

// Import our WebSocket server (CommonJS version)
const { earthquakeWebSocketServer } = require('./websocket-server-cjs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000
const wsPort = process.env.WS_PORT || 8080

// Prepare Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Start the Next.js server
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    
    // Start WebSocket server after Next.js is ready
    startWebSocketServer()
  })

  // Function to start WebSocket server with retry logic
  async function startWebSocketServer() {
    let retries = 5
    let currentPort = wsPort
    
    while (retries > 0) {
      try {
        console.log(`🔌 Starting WebSocket server on port ${currentPort}...`)
        await earthquakeWebSocketServer.initialize(currentPort)
        console.log(`✅ WebSocket server successfully started on port ${currentPort}`)
        
        // Update environment variable for client connections
        process.env.WS_PORT = currentPort.toString()
        break
      } catch (error) {
        console.error(`❌ Failed to start WebSocket server on port ${currentPort}:`, error.message)
        
        if (error.message.includes('EADDRINUSE') || error.message.includes('already in use')) {
          currentPort++
          console.log(`🔄 Port ${currentPort - 1} is busy, trying port ${currentPort}...`)
        } else {
          // For non-port errors, wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        retries--
        if (retries === 0) {
          console.error('🚫 Failed to start WebSocket server after multiple attempts')
          console.error('🔧 Real-time features will be unavailable')
          console.error('💡 Try running: lsof -ti:8080 | xargs kill -9')
        }
      }
    }
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down servers...')
    earthquakeWebSocketServer.stop()
    server.close(() => {
      console.log('✅ Servers shut down gracefully')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('🛑 Shutting down servers...')
    earthquakeWebSocketServer.stop()
    server.close(() => {
      console.log('✅ Servers shut down gracefully')
      process.exit(0)
    })
  })
})