import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if WebSocket server is reachable
    const wsPort = process.env.WS_PORT || 8080
    
    // Simple WebSocket connectivity test
    const testConnection = new Promise((resolve) => {
      try {
        const WebSocket = require('ws')
        const ws = new WebSocket(`ws://localhost:${wsPort}`)
        
        ws.on('open', () => {
          ws.close()
          resolve(true)
        })
        
        ws.on('error', () => {
          resolve(false)
        })
        
        // Timeout after 2 seconds
        setTimeout(() => {
          ws.terminate()
          resolve(false)
        }, 2000)
      } catch (error) {
        resolve(false)
      }
    })
    
    const isWebSocketReady = await testConnection
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        nextjs: true,
        websocket: isWebSocketReady
      },
      websocket: {
        port: wsPort,
        url: `ws://localhost:${wsPort}`,
        status: isWebSocketReady ? 'ready' : 'unavailable'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          nextjs: true,
          websocket: false
        }
      },
      { status: 503 }
    )
  }
}