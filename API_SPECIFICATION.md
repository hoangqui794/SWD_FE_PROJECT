# API Specification for SWD392 Project (IoT Monitoring System)

This document outlines the API endpoints required for the Frontend (React/Vite) to function correctly. The Backend should implement these endpoints following RESTful standards.

**Base URL:** `https://swd-project-api.onrender.com`

## 1. Authentication & Users
### 1.1 Login
- **Endpoint:** `POST /api/auth/login`
- **Description:** Authenticate user and return JWT token.
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "token": "jwt_string",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "ADMIN | MANAGER | USER"
    }
  }
  ```

### 1.2 Register
- **Endpoint:** `POST /api/auth/register`
- **Description:** Register a new user.
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** `201 Created`

### 1.3 Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Description:** Get profile of the currently logged-in user (based on Token).
- **Response:**
  ```json
  {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "ADMIN | MANAGER | USER"
  }
  ```

---

## 2. Sites Management (SitesPage)
### 2.1 Get All Sites
- **Endpoint:** `GET /api/sites`
- **Query Params:**
  - `search`: string (Optional - filter by name or ID)
- **Response:**
  ```json
  [
    {
      "id": "string",  // e.g., "S-CG-001"
      "org": "string", // e.g., "WinMart Retail Group"
      "name": "string", // e.g., "WinMart Cầu Giấy"
      "hubs_count": number // Calculated field: number of hubs in this site
    }
  ]
  ```

### 2.2 Create Site
- **Endpoint:** `POST /api/sites`
- **Request Body:**
  ```json
  {
    "org": "string",
    "name": "string"
  }
  ```
- **Response:** Created Site object.

### 2.3 Update Site
- **Endpoint:** `PUT /api/sites/{id}`
- **Request Body:**
  ```json
  {
    "org": "string",
    "name": "string"
  }
  ```

### 2.4 Delete Site
- **Endpoint:** `DELETE /api/sites/{id}`

---

## 3. Hubs Management (HubsPage)
### 3.1 Get All Hubs
- **Endpoint:** `GET /api/hubs`
- **Query Params:**
  - `site_id`: string (Optional - to get hubs for a specific site)
- **Response:**
  ```json
  [
    {
      "id": "string", // e.g., "HUB-772-AX"
      "mac": "string", // e.g., "00:1A:2B:3C:4D:5E"
      "status": "Online | Offline",
      "site_id": "string"
    }
  ]
  ```

### 3.2 Create Hub
- **Endpoint:** `POST /api/hubs`
- **Request Body:**
  ```json
  {
    "mac": "string",
    "site_id": "string" // Optional if hubs can be unassigned initially
  }
  ```

### 3.3 Update Hub
- **Endpoint:** `PUT /api/hubs/{id}`
- **Request Body:**
  ```json
  {
    "site_id": "string", // Move hub to another site
    "status": "string" // Maybe readonly, updated by system?
  }
  ```

### 3.4 Delete Hub
- **Endpoint:** `DELETE /api/hubs/{id}`

---

## 4. Sensors Management (SensorsPage)
### 4.1 Get All Sensors
- **Endpoint:** `GET /api/sensors`
- **Query Params:**
  - `hub_id`: string (Optional)
  - `type`: string (Optional)
- **Response:**
  ```json
  [
    {
      "id": "string",
      "name": "string", // e.g., "Storage Temp"
      "type": "Temperature | Humidity | Pressure",
      "value": "string | number", // e.g., "22.4", current reading
      "unit": "string", // e.g., "°C"
      "status": "Active | Offline",
      "hub_id": "string"
    }
  ]
  ```

### 4.2 Register Sensor
- **Endpoint:** `POST /api/sensors`
- **Request Body:**
  ```json
  {
    "name": "string",
    "type": "Temperature | Humidity | Pressure",
    "hub_id": "string"
  }
  ```

---

## 5. Alerts Management (AlertsPage)
### 5.1 Get Alerts
- **Endpoint:** `GET /api/alerts`
- **Query Params:**
  - `status`: "Active" | "Resolved" | "All"
  - `search`: string (search by sensor name)
- **Response:**
  ```json
  [
    {
      "id": "number | string",
      "time": "datetime", // e.g., "2024-05-14 14:22"
      "sensor_name": "string",
      "severity": "Critical | Warning",
      "status": "Active | Resolved"
    }
  ]
  ```

### 5.2 Resolve Alert
- **Endpoint:** `PUT /api/alerts/{id}/resolve`
- **Description:** Mark an alert as resolved.
- **Response:** Updated Alert object.

### 5.3 Delete Alert Log
- **Endpoint:** `DELETE /api/alerts/{id}`

---

## 6. Dashboard Statistics
### 6.1 Get Stats
- **Endpoint:** `GET /api/dashboard/stats`
- **Response:**
  ```json
  {
    "total_sites": number,
    "total_hubs": number,
    "active_sensors": number,
    "pending_alerts": number
  }
  ```
