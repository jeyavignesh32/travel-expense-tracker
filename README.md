# Adventure Hub (TravelSense) 🌍

A modern, comprehensive, and highly interactive Travel Expense & Trip Management application designed to make group travel seamless and visually stunning. 

## 🚀 Overview

Adventure Hub goes far beyond a simple spreadsheet tracker. It features real-time expense syncing, location-aware SOS tracking, encrypted document vaults, an interactive 3D Globe, Tinder-style group itinerary building, and an AI-powered receipt scanner.

### Tech Stack
* **Frontend**: React 19, Vite, Framer Motion (for fluid animations)
* **Styling**: Tailwind CSS, Vanilla CSS for micro-animations
* **Interactive Maps**: Leaflet, React-Globe.gl, Three.js
* **OCR / AI**: Tesseract.js (for offline/client-side receipt scanning)
* **Backend Framework**: Node.js, Express (stubbed for prototype)
* **Database**: PostgreSQL (stubbed for prototype)

## 🛠️ Installation & Running

Since this is a frontend-heavy prototype tailored for demonstration, the app is configured to gracefully fall back to **Browser Local Storage** when the backend is not running. 

To run the application locally:

1. **Navigate to the client folder:**
   ```bash
   cd client
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Open your browser:**
   Navigate to `http://localhost:5173`

*(Note: The backend server in the `/server` directory is not required for the core unique features to function during this demonstration).*

## ✨ Key Features
- **Dashboard**: High-level overview of expenses and the 3D Interactive Globe.
- **Expense Tracker**: Track daily spending with AI receipt scanning.
- **Itinerary**: Group decision making using Swipe-to-Decide matching.
- **Live Map**: Real-time group tracking and nearby attractions using OpenStreetMap.
- **Safety Vault**: AES-encrypted client-side document storage and SOS alerts.

See `USER_GUIDE.md` for a full walkthrough of the application!
