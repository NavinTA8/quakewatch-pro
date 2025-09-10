import { NextRequest, NextResponse } from 'next/server'
import { earthquakeWebSocketServer } from '@/lib/websocket-server'

export async function GET(request: NextRequest) {
  try {
    // Initialize WebSocket server
    await earthquakeWebSocketServer.initialize(8080)
    
    return NextResponse.json({ 
      message: 'WebSocket server initialized successfully',
      port: 8080,
      url: 'ws://localhost:8080',
      status: 'running'
    })
  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize WebSocket server',
        details: errorMessage,
        port: 8080
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    earthquakeWebSocketServer.stop()
    
    return NextResponse.json({ 
      message: 'WebSocket server stopped' 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to stop WebSocket server' },
      { status: 500 }
    )
  }
}