const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sample data for tables
const tables = [
  { id: 1, number: 1, capacity: 2, isAvailable: true },
  { id: 2, number: 2, capacity: 2, isAvailable: true },
  { id: 3, number: 3, capacity: 4, isAvailable: true },
  { id: 4, number: 4, capacity: 4, isAvailable: true },
  { id: 5, number: 5, capacity: 6, isAvailable: true },
  { id: 6, number: 6, capacity: 8, isAvailable: true }
];

// Store reservations
let reservations = [];

// Validation middleware
const validateReservation = (req, res, next) => {
  const { name, guests, tableId, time } = req.body;
  
  if (!name || !guests || !tableId || !time) {
    return res.status(400).json({ error: "Name, guest count, table ID, and time are required" });
  }
  
  if (isNaN(guests) || guests <= 0) {
    return res.status(400).json({ error: "Guest count must be a positive number" });
  }
  
  const table = tables.find(t => t.id === parseInt(tableId));
  if (!table) {
    return res.status(404).json({ error: "Table not found" });
  }
  
  if (!table.isAvailable) {
    return res.status(400).json({ error: "Table is already reserved" });
  }
  
  if (guests > table.capacity) {
    return res.status(400).json({ error: `No available tables for ${guests} guests` });
  }
  
  next();
};

// API Routes
// GET /tables - Display available tables
app.get('/api/tables', (req, res) => {
  res.json(tables);
});

// POST /reservations - Reserve a table
app.post('/api/reservations', validateReservation, (req, res) => {
  const { name, guests, tableId, time, date, phone } = req.body;
  const tableIndex = tables.findIndex(t => t.id === parseInt(tableId));
  
  // Create new reservation
  const newReservation = {
    id: Date.now().toString(),
    name,
    guests: parseInt(guests),
    tableId: parseInt(tableId),
    tableNumber: tables[tableIndex].number,
    time,
    date,
    phone,
    createdAt: new Date()
  };
  
  // Update table availability
  tables[tableIndex].isAvailable = false;
  
  // Store reservation
  reservations.push(newReservation);
  
  res.status(201).json({
    success: `Table ${tables[tableIndex].number} reserved for ${name} (${guests} guests)`,
    reservation: newReservation
  });
});

// GET /reservations - View all reservations
app.get('/api/reservations', (req, res) => {
  res.json(reservations);
});

// PUT /update/:id - Modify a reservation
app.put('/api/update/:id', (req, res) => {
  const { id } = req.params;
  const { name, guests, tableId, time, date, phone } = req.body;
  
  // Find reservation
  const reservationIndex = reservations.findIndex(r => r.id === id);
  if (reservationIndex === -1) {
    return res.status(404).json({ error: "Reservation not found" });
  }
  
  const oldTableId = reservations[reservationIndex].tableId;
  
  // If table is changing, check availability
  if (tableId && parseInt(tableId) !== oldTableId) {
    const newTable = tables.find(t => t.id === parseInt(tableId));
    
    if (!newTable) {
      return res.status(404).json({ error: "New table not found" });
    }
    
    if (!newTable.isAvailable) {
      return res.status(400).json({ error: "New table is already reserved" });
    }
    
    if (guests && parseInt(guests) > newTable.capacity) {
      return res.status(400).json({ error: `No available tables for ${guests} guests` });
    }
    
    // Free up the old table
    const oldTableIndex = tables.findIndex(t => t.id === oldTableId);
    tables[oldTableIndex].isAvailable = true;
    
    // Reserve the new table
    const newTableIndex = tables.findIndex(t => t.id === parseInt(tableId));
    tables[newTableIndex].isAvailable = false;
  }
  
  // Update reservation
  reservations[reservationIndex] = {
    ...reservations[reservationIndex],
    name: name || reservations[reservationIndex].name,
    guests: guests ? parseInt(guests) : reservations[reservationIndex].guests,
    tableId: tableId ? parseInt(tableId) : reservations[reservationIndex].tableId,
    tableNumber: tableId ? tables.find(t => t.id === parseInt(tableId)).number : reservations[reservationIndex].tableNumber,
    time: time || reservations[reservationIndex].time,
    date: date || reservations[reservationIndex].date,
    phone: phone || reservations[reservationIndex].phone,
    updatedAt: new Date()
  };
  
  res.json({
    success: `Reservation updated for ${reservations[reservationIndex].name}`,
    reservation: reservations[reservationIndex]
  });
});

// DELETE /cancel/:id - Cancel a reservation
app.delete('/api/cancel/:id', (req, res) => {
  const { id } = req.params;
  
  // Find reservation
  const reservationIndex = reservations.findIndex(r => r.id === id);
  if (reservationIndex === -1) {
    return res.status(404).json({ error: "Reservation not found" });
  }
  
  const reservation = reservations[reservationIndex];
  
  // Make table available again
  const tableIndex = tables.findIndex(t => t.id === reservation.tableId);
  tables[tableIndex].isAvailable = true;
  
  // Remove reservation
  const canceledReservation = reservations.splice(reservationIndex, 1)[0];
  
  res.json({
    success: `Reservation canceled for ${canceledReservation.name}`,
    reservation: canceledReservation
  });
});

// Add a favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// This middleware should come AFTER all API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    // If it's an API route that wasn't handled, return 404
    return res.status(404).json({ error: "API endpoint not found" });
  }
  // For non-API routes, serve the index.html
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});