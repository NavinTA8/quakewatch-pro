# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with custom server (auto-starts WebSocket)
- `npm run dev:next` - Start Next.js dev server only (WebSocket manual)
- `node server.js` - Start custom server with WebSocket auto-startup
- `PORT=3001 node server.js` - Start on different port if 3000 is busy

### Build & Production
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server with WebSocket
- `npm run start:next` - Start Next.js production server only

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript compiler checks

### Utilities
- `npm run preview` - Build and start production preview
- `npm run analyze` - Analyze bundle size
- `/api/health` - Health check endpoint for server status

## Architecture Overview

### Custom Server Setup
The app uses a **custom Next.js server** (`server.js`) that automatically starts both Next.js and WebSocket servers. This is crucial for real-time earthquake data:

- **server.js** - Custom Next.js server with WebSocket auto-startup
- **websocket-server-cjs.js** - CommonJS WebSocket server wrapper for compatibility
- **src/lib/websocket-server.ts** - TypeScript WebSocket server implementation

### State Management Architecture
Uses **Zustand** for centralized state management:

- **useEarthquakeStore** - Main store for earthquake data, filters, alerts
- **Auto-refresh** - Built-in 5-minute polling mechanism
- **Real-time updates** - WebSocket integration for live data

### Data Flow Architecture
1. **USGS API** → `USGSApiClient` → **Store** → **Components**
2. **WebSocket Server** → `useWebSocket` hook → **Store** → **UI updates**
3. **Filters** → `applyFilters()` → **Filtered data** → **Map & List components**

### Alert System
Alert notifications use **earthquake ID tracking** (not array length) to prevent false alerts during filtering operations. Alerts only trigger for genuinely new earthquake data from the real-time feed.

### Early Warning System (Thailand-focused)
Advanced seismic early warning system using **P-wave and S-wave physics calculations**:

- **useEarlyWarning** hook - Processes earthquakes for threat assessment
- **Regional threat zones** - Monitors 5 major fault systems:
  - Myanmar-Thailand Border (M5.0+, 800km range)
  - Sumatra-Andaman Fault Zone (M6.5+, 1000km range)
  - Philippines Fault System (M7.0+, 1200km range)
  - Java-Bali Fault Zone (M6.0+, 800km range)
  - Sagaing Fault (M5.5+, 600km range)
- **Wave arrival calculations** - P-wave (6.0 km/s) and S-wave (3.5 km/s) timing
- **Threat levels** - LOW, MODERATE, HIGH, CRITICAL based on magnitude + distance
- **Thailand locations** - Monitors 10 major cities including Bangkok, Chiang Mai, Phuket
- **Warning validation** - Minimum 10s warning time, magnitude-based max distance
- **Browser notifications** - Enhanced alerts with threat-level specific messaging
- **Auto-cleanup** - Warnings expire after S-wave arrival + 60s

### WebSocket Real-time System
- **Client**: `useWebSocket` hook with exponential backoff retry logic
- **Server**: Auto-started WebSocket server on port 8080 (with port conflict resolution)
- **Health monitoring**: `/api/health` endpoint to verify WebSocket server readiness
- **Message types**: `initial-data`, `earthquake-update`, `error`, `ping`

### Map Integration
Uses **React Leaflet** with **dynamic imports** to avoid SSR issues. Map components are client-side only with proper loading states.

### Component Architecture
- **Dashboard** - Main container with tabs and resizable panels
- **EarthquakeMap** - Interactive Leaflet map with markers
- **EarthquakeList** - Scrollable list with earthquake details
- **EarthquakeFilters** - Filter controls (magnitude, location, time, alerts)
- **AlertSystem** - Notification system with browser notifications and sound
- **EmergencyAlertOverlay** - Full-screen emergency alerts for critical threats
- **ThailandLocationSelector** - User location selection for early warning
- **SafetyInstructions** - Emergency response guidance
- **EarlyWarningTest** - Early warning system testing interface

### Critical Implementation Details
- **WebSocket startup**: Use `node server.js` for development to ensure WebSocket server starts
- **Port conflicts**: Server automatically tries ports 8080, 8081, 8082, etc.
- **Alert logic**: Uses `earthquake.id` tracking to prevent filter-triggered false alerts
- **SSR compatibility**: Maps use dynamic imports with `{ ssr: false }`
- **Error handling**: Comprehensive error boundaries and fallback states
- **Early warning calculations**: Based on real seismic physics (P-wave and S-wave speeds)
- **Regional threat detection**: Earthquakes automatically categorized by fault zone
- **Warning time validation**: Minimum 10s warning time required for alerts
- **User location**: Required for early warning system to calculate arrival times

### File Structure
```
src/
├── app/                 # Next.js App Router
│   └── api/            # API routes (health, websocket)
├── components/          # React components
│   ├── ui/             # Shadcn/UI base components
│   └── *.tsx           # Feature components (Dashboard, Map, Filters, etc.)
├── hooks/              # Custom hooks
│   ├── use-websocket.ts      # WebSocket client with retry logic
│   └── use-early-warning.ts  # Early warning system hook
├── lib/                # Utilities and API clients
│   ├── usgs-api.ts           # USGS API client
│   ├── early-warning.ts      # Seismic wave calculations
│   └── websocket-server.ts   # WebSocket server implementation
├── stores/             # Zustand state stores
│   └── earthquake-store.ts   # Main store with auto-refresh
└── types/              # TypeScript type definitions
    └── earthquake.ts         # Earthquake data types
server.js               # Custom server with WebSocket auto-startup
websocket-server-cjs.js # WebSocket server CommonJS wrapper
```

### Environment Variables
- `PORT` - Next.js server port (default: 3000)
- `WS_PORT` - WebSocket server port (default: 8080)
- `NODE_ENV` - Environment (development/production)