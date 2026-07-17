# 🧳 TravelExpense - Setup Guide

## Prerequisites
1. **Node.js** (v18 or above) — [Download](https://nodejs.org)
2. **MySQL** (v8.0 or above) — [Download](https://dev.mysql.com/downloads/installer/)

---

## Step 1: Create the Database in MySQL

Open **MySQL Command Line** or **MySQL Workbench** and run:

```sql
CREATE DATABASE travel_safety;
USE travel_safety;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget_total DECIMAL(15, 2) DEFAULT 0,
    trip_type ENUM('Adventure', 'Temple', 'Nature', 'City', 'General') DEFAULT 'General',
    base_fuel_price DECIMAL(10, 2) DEFAULT 100.00,
    vehicle_mileage DECIMAL(10, 2) DEFAULT 15.00,
    creator_id INT NOT NULL,
    status ENUM('active', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Trip Members
CREATE TABLE IF NOT EXISTS trip_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (trip_id, user_id),
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    payer_id INT,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    category ENUM('Food', 'Transport', 'Hotel', 'Shopping', 'Other') NOT NULL,
    description TEXT,
    receipt_url TEXT,
    lat DOUBLE,
    lng DOUBLE,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Itinerary Items Table
CREATE TABLE IF NOT EXISTS itinerary_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'Place',
    day_number INT DEFAULT 1,
    time_slot VARCHAR(50) DEFAULT '12:00 PM',
    lat DOUBLE,
    lng DOUBLE,
    image_url TEXT,
    status ENUM('suggested', 'selected', 'visited') DEFAULT 'selected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- 6. Locations Table (Real-time GPS tracking)
CREATE TABLE IF NOT EXISTS locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    trip_id INT NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    accuracy DOUBLE,
    speed DOUBLE,
    heading DOUBLE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- 7. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    user_id INT NOT NULL,
    type ENUM('sos', 'missed_front', 'budget_exceeded') NOT NULL,
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Packing Items Table
CREATE TABLE IF NOT EXISTS packing_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Clothing',
    packed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);
```

---

## Step 2: Update the `.env` File

Open `server/.env` and update with YOUR MySQL password:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=travel_safety
JWT_SECRET=supersecretkeytravelsense2026
NODE_ENV=development
```

---

## Step 3: Install Dependencies

Open terminal and run:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## Step 4: Start the App

Open **two terminals**:

**Terminal 1 — Backend Server:**
```bash
cd server
npm start
```
You should see: `🚀 Server running on port 5000` and `✅ MySQL Connected Successfully`

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
You should see: `VITE ready` with URL `http://localhost:5173`

---

## Step 5: Open in Browser

Go to **http://localhost:5173** — Register a new account and start using the app!

---

## Troubleshooting

| Error | Fix |
|---|---|
| `MySQL Connection Failed` | Make sure MySQL is running and password in `.env` is correct |
| `ECONNREFUSED 127.0.0.1:5000` | Start the backend server first (Step 4, Terminal 1) |
| `Module not found` | Run `npm install` again in both `server/` and `client/` folders |
| `Port 5000 already in use` | Kill the process: `npx kill-port 5000` |
