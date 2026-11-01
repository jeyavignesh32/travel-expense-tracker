# TravelSense — full-stack trip companion

TravelSense is a React + Vite frontend, Node/Express API, MySQL database, Leaflet map and Socket.IO live trip-location app.

## Included

- Email/password registration and login (bcrypt + JWT)
- Create trips, add registered users, trip member list
- Explicit opt-in live location sharing while the browser tab is open
- Shared expense ledger and settlement status
- Trip notifications and Socket.IO updates
- Destination lookup and tourist attraction discovery using OpenStreetMap/Nominatim + Overpass
- Nearby map categories: hospitals, clinics, doctors, pharmacies, hotels, motels, guest houses, hostels, attractions, museums, viewpoints, historic places, schools, colleges, universities, restaurants, cafes, ATMs, banks, police, bus stations, fuel stations and supermarkets
- Map marker clustering and fallback from OpenStreetMap tiles to CARTO tiles
- Nearby places map available after sign-in even before creating a trip, with category checkboxes and 1/3/5/10/20 km radius selection
- Trip map also overlays nearby places while keeping member location sharing opt-in
- Hotel discovery from real OpenStreetMap mapped hotels
- Optional live hotel offers through Amadeus Self-Service API or a contracted supplier adapter

## Requirements

- Node.js 20.19+ or 22.12+ recommended (Vite 8 requirement)
- npm
- MySQL 8 (Docker Desktop is fine)

## Windows setup (CMD)

1. Extract the ZIP to a folder such as `D:\Downloads\TravelSense`.
2. Open CMD and enter the project folder:

   `cd /d D:\Downloads\TravelSense\TravelSense`

3. Install dependencies:

   `npm install --prefix server`

   `npm install --prefix client`

4. Create environment files by copying the examples:

   `copy server\.env.example server\.env`

   `copy client\.env.example client\.env`

5. Edit `server\.env` in Notepad. Set `MYSQL_PORT=3307` for the included Docker port mapping, set `MYSQL_PASSWORD` to the actual password configured for your MySQL container, and replace `JWT_SECRET` with a long random secret (at least 32 characters). Do not share or commit this file.

6. Create the database. In MySQL Workbench or the MySQL CLI, run the complete file `database\schema.sql`.

7. Start the backend in CMD window 1:

   `cd /d D:\Downloads\TravelSense\TravelSense\server`

   `npm run dev`

8. Start the frontend in CMD window 2:

   `cd /d D:\Downloads\TravelSense\TravelSense\client`

   `npm run dev`

9. Open `http://localhost:5173`. Check backend health at `http://localhost:4000/api/health`.

## Hotel APIs and cost

Nearby hotel names/locations are sourced from OpenStreetMap; this does **not** contain dependable live room prices, availability, taxes or booking inventory. The app does not invent prices.

For live rates, create supplier credentials and configure them in `server/.env`:

### Amadeus Self-Service

- `AMADEUS_CLIENT_ID=...`
- `AMADEUS_CLIENT_SECRET=...`
- `AMADEUS_BASE_URL=https://test.api.amadeus.com`

The adapter obtains an OAuth token, resolves the destination city, looks up hotels and requests offers. The test environment is for development; production access, inventory coverage, commercial terms and booking capability depend on Amadeus account approval and API product access. Verify current terms with Amadeus before launch.

Alternatively configure a contracted hotel supplier:

- `HOTEL_API_URL=https://your-supplier-endpoint`
- `HOTEL_API_KEY=...`

The generic supplier adapter expects a POST JSON request containing `destination`, `checkIn`, `checkOut`, and `adults`, and a JSON response with a `hotels` array. Provider-specific field mapping may be needed.

Never put hotel credentials in `client/.env` or any `VITE_` variable.

## Map/data API notes

- Nearby places use public OpenStreetMap Overpass endpoints; tourism destination lookup uses Nominatim. These are community services with usage policies, variable coverage, and rate limits. For high traffic/production, use a hosted provider or self-host/cache the data.
- Map tiles try OpenStreetMap first and CARTO as a fallback. DNS/network outages can still prevent both tile providers from loading.
- Missing OpenStreetMap tags mean a real place may not appear. Results are not a guarantee of completeness, opening hours, medical quality or school accreditation.
- Browser geolocation requires permission and a secure context (localhost is allowed). Live location sharing stops when the tab/browser stops; locked-phone background tracking requires a native mobile app.

## Security

- Real `.env` files are excluded from this distribution. Create them from examples.
- Use a strong unique MySQL password and JWT secret. Never commit `.env` files.
- Use HTTPS, proper CORS origins, backups, monitoring and a production-grade map/data provider before public deployment.

## Verification

The source files have been syntax-parsed. A complete production build and end-to-end MySQL/API test still needs to be run on the target Windows machine with its native Node dependencies and database credentials; this ZIP does not claim zero runtime errors.

## First use of the nearby map

1. Start the backend and frontend, then open `http://localhost:5173`.
2. Register or sign in. The nearby map is available from **Live map** even if you have not created a trip yet.
3. Allow browser location permission and click **Find places near me**.
4. Choose categories (hospital, clinic, pharmacy, hotel, must-visit attractions, school, college, restaurant, police, ATM and others), select a radius, then search again.
5. Open a marker to see its mapped name, category and available address details.

Nearby place discovery uses the browser's current location only for the search request. It does not enable trip-member location sharing. Trip sharing remains a separate opt-in control.
