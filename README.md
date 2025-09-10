# QuakeWatch Pro 🌏

A modern, real-time earthquake monitoring system built with cutting-edge web technologies. Track global seismic activity with interactive maps, advanced filtering, and intelligent alert notifications.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC)

## ✨ Features

### 🗺️ Interactive Mapping
- **Real-time earthquake visualization** with magnitude-based markers
- **Interactive Leaflet maps** with detailed popup information
- **Magnitude color coding** from green (minor) to red (major)
- **Responsive zoom and pan** controls

### 🔔 Smart Alert System
- **Push notifications** for significant earthquakes (M5.0+)
- **Customizable alert thresholds** 
- **Browser notifications** with Notification API
- **Sound alerts** with toggle controls
- **Alert history** with read/unread states

### 🔍 Advanced Filtering
- **Magnitude range** filtering with slider controls
- **Geographic location** search and filtering
- **Time range** selection (start/end dates)
- **Alert level** filtering (green, yellow, orange, red)
- **Real-time filter application** with instant results

### 📡 Real-time Data
- **WebSocket connections** for live earthquake updates
- **USGS API integration** for authoritative seismic data
- **Auto-refresh** every 5 minutes
- **Connection status** indicators
- **Fallback polling** for reliability

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation & Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn/UI
- **State Management**: Zustand
- **Maps**: React Leaflet + OpenStreetMap
- **Real-time**: WebSockets + Server-Sent Events
- **Data Source**: USGS Earthquake API
- **Deployment**: Vercel (recommended)

## 📊 Data Sources

### USGS Earthquake API
- **Real-time feeds**: GeoJSON format earthquake data
- **Global coverage**: Worldwide earthquake monitoring
- **Update frequency**: Every 5 minutes for significant events
- **Data retention**: Up to 30 days of earthquake history

## 🌐 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
