const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('carwash.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    price REAL,
    durationMin INTEGER
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    quantity REAL,
    minStock REAL,
    unit TEXT,
    price REAL,
    supplier TEXT,
    lastRestocked TEXT
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    plateNumber TEXT,
    vehicleType TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    customerName TEXT,
    customerPhone TEXT,
    totalAmount REAL,
    paymentMethod TEXT,
    paymentStatus TEXT,
    status TEXT,
    date TEXT,
    servedBy TEXT,
    duration INTEGER,
    vehicleType TEXT
  );

  CREATE TABLE IF NOT EXISTS transaction_services (
    id TEXT PRIMARY KEY,
    transactionId TEXT,
    serviceName TEXT,
    vehicleType TEXT,
    quantity INTEGER,
    price REAL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    transactionId TEXT,
    customerId TEXT,
    customerName TEXT,
    customerPhone TEXT,
    serviceStatus TEXT,
    assignedStaff TEXT,
    estimatedDuration INTEGER,
    startTime TEXT,
    endTime TEXT,
    isPaused INTEGER,
    pausedAt TEXT,
    totalPausedSeconds INTEGER,
    scheduledTime TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ---------- API endpoints ----------
app.get('/api/services', (req, res) => {
  const rows = db.prepare('SELECT * FROM services').all();
  res.json(rows);
});

app.post('/api/services', (req, res) => {
  const { id, name, price, durationMin } = req.body;
  const stmt = db.prepare('INSERT INTO services (id, name, price, durationMin) VALUES (?, ?, ?, ?)');
  stmt.run(id, name, price, durationMin);
  res.status(201).json({ id, name, price, durationMin });
});

app.get('/api/inventory', (req, res) => {
  const items = db.prepare('SELECT * FROM inventory').all();
  const withStatus = items.map(item => ({
    ...item,
    status: item.quantity === 0 ? 'out' : (item.quantity <= item.minStock ? 'low' : 'good')
  }));
  res.json(withStatus);
});

app.post('/api/inventory', (req, res) => {
  const { id, name, category, quantity, minStock, unit, price, supplier, lastRestocked } = req.body;
  const stmt = db.prepare('INSERT INTO inventory (id, name, category, quantity, minStock, unit, price, supplier, lastRestocked) VALUES (?,?,?,?,?,?,?,?,?)');
  stmt.run(id, name, category, quantity, minStock, unit, price, supplier, lastRestocked);
  res.status(201).json({ id, name, category, quantity, minStock, unit, price, supplier, lastRestocked });
});

app.post('/api/inventory/:id/restock', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const newQuantity = item.quantity + quantity;
  const stmt = db.prepare('UPDATE inventory SET quantity = ?, lastRestocked = ? WHERE id = ?');
  stmt.run(newQuantity, new Date().toISOString(), id);
  res.json({ success: true });
});

app.get('/api/customers', (req, res) => {
  const rows = db.prepare('SELECT * FROM customers').all();
  res.json(rows);
});

app.post('/api/customers', (req, res) => {
  const { id, name, phone, plateNumber, vehicleType } = req.body;
  const stmt = db.prepare('INSERT INTO customers (id, name, phone, plateNumber, vehicleType) VALUES (?,?,?,?,?)');
  stmt.run(id, name, phone, plateNumber || null, vehicleType || null);
  res.status(201).json({ id, name, phone, plateNumber, vehicleType });
});

// Create transaction - status starts as 'pending'
app.post('/api/transactions', (req, res) => {
  const { customerId, customerName, customerPhone, services, totalAmount, paymentMethod, assignedStaff, scheduledTime, notes } = req.body;
  const txId = `TXN${Date.now()}`;
  const date = new Date().toISOString();
  const duration = services.reduce((sum, s) => sum + (s.durationMin || 30) * s.quantity, 0);
  const vehicleType = services[0]?.vehicleType || 'N/A';

  // Insert transaction with status 'pending'
  const txStmt = db.prepare('INSERT INTO transactions (id, customerId, customerName, customerPhone, totalAmount, paymentMethod, paymentStatus, status, date, servedBy, duration, vehicleType) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  txStmt.run(txId, customerId, customerName, customerPhone, totalAmount, paymentMethod, 'paid', 'pending', date, assignedStaff, duration, vehicleType);

  // Insert transaction services
  const svcStmt = db.prepare('INSERT INTO transaction_services (id, transactionId, serviceName, vehicleType, quantity, price) VALUES (?,?,?,?,?,?)');
  for (const svc of services) {
    svcStmt.run(`tsvc_${Date.now()}_${Math.random()}`, txId, svc.name, svc.vehicleType, svc.quantity, svc.price);
  }

  // Insert ticket
  const ticketId = `ST${Date.now()}`;
  const estimatedDuration = services.reduce((sum, s) => sum + (s.durationMin || 30) * s.quantity, 0);
  const ticketStmt = db.prepare('INSERT INTO tickets (id, transactionId, customerId, customerName, customerPhone, serviceStatus, assignedStaff, estimatedDuration, scheduledTime, notes, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  ticketStmt.run(ticketId, txId, customerId, customerName, customerPhone, 'pending', assignedStaff, estimatedDuration, scheduledTime || null, notes || null, date);

  res.status(201).json({ transaction: { id: txId, totalAmount, status: 'pending' }, ticket: { id: ticketId } });
});

// Update transaction status (for completion)
app.patch('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const stmt = db.prepare('UPDATE transactions SET status = ? WHERE id = ?');
    stmt.run(status, id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions', (req, res) => {
  const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
  for (const tx of transactions) {
    const services = db.prepare('SELECT * FROM transaction_services WHERE transactionId = ?').all(tx.id);
    tx.services = services;
  }
  res.json(transactions);
});

app.get('/api/tickets', (req, res) => {
  const tickets = db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC').all();
  res.json(tickets);
});

app.patch('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = [];
  const values = [];
  
  if (updates.serviceStatus !== undefined) {
    fields.push('serviceStatus = ?');
    values.push(updates.serviceStatus);
  }
  if (updates.startTime !== undefined) {
    fields.push('startTime = ?');
    values.push(updates.startTime);
  }
  if (updates.endTime !== undefined) {
    fields.push('endTime = ?');
    values.push(updates.endTime);
  }
  if (updates.isPaused !== undefined) {
    fields.push('isPaused = ?');
    values.push(updates.isPaused ? 1 : 0);
  }
  if (updates.pausedAt !== undefined) {
    fields.push('pausedAt = ?');
    values.push(updates.pausedAt);
  }
  if (updates.totalPausedSeconds !== undefined) {
    fields.push('totalPausedSeconds = ?');
    values.push(updates.totalPausedSeconds);
  }
  
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(id);
  const stmt = db.prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  res.json({ success: true });
});

// ---------- ANALYTICS ENDPOINTS ----------
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0,10);
    const today = new Date().toISOString().slice(0,10);
    
    // Total revenue for the selected period (only completed)
    const totalRevenueStmt = db.prepare('SELECT SUM(totalAmount) as total FROM transactions WHERE status = ? AND date >= ?');
    const totalRevenue = totalRevenueStmt.get('completed', startDateStr)?.total || 0;
    
    // Total bookings for the selected period (only completed)
    const totalBookingsStmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = ? AND date >= ?');
    const totalBookings = totalBookingsStmt.get('completed', startDateStr)?.count || 0;
    
    // Active services
    const activeServicesStmt = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE serviceStatus IN (?, ?)');
    const activeServices = activeServicesStmt.get('pending', 'in-progress')?.count || 0;
    
    // Completed today - ONLY completed transactions
    const completedTodayStmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = ? AND date LIKE ?');
    const completedToday = completedTodayStmt.get('completed', `${today}%`)?.count || 0;
    
    // Today's revenue
    const revenueTodayStmt = db.prepare('SELECT SUM(totalAmount) as total FROM transactions WHERE status = ? AND date LIKE ?');
    const revenueToday = revenueTodayStmt.get('completed', `${today}%`)?.total || 0;
    
    // Yesterday's revenue
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0,10);
    const revenueYesterdayStmt = db.prepare('SELECT SUM(totalAmount) as total FROM transactions WHERE status = ? AND date LIKE ?');
    const revenueYesterday = revenueYesterdayStmt.get('completed', `${yesterdayStr}%`)?.total || 0;
    
    const revenueChange = revenueYesterday === 0 ? (revenueToday > 0 ? 100 : 0) : ((revenueToday - revenueYesterday) / revenueYesterday) * 100;
    
    // Completed yesterday
    const completedYesterdayStmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = ? AND date LIKE ?');
    const completedYesterday = completedYesterdayStmt.get('completed', `${yesterdayStr}%`)?.count || 0;
    const bookingsChange = completedYesterday === 0 ? (completedToday > 0 ? 100 : 0) : ((completedToday - completedYesterday) / completedYesterday) * 100;
    
    res.json({
      totalRevenue,
      totalBookings,
      activeServices,
      completedToday,
      revenueToday,
      revenueChange: Math.round(revenueChange * 10) / 10,
      bookingsChange: Math.round(bookingsChange * 10) / 10,
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/revenue', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0,10);
      const revStmt = db.prepare('SELECT SUM(totalAmount) as total FROM transactions WHERE status = ? AND date LIKE ?');
      const revenue = revStmt.get('completed', `${dateStr}%`)?.total || 0;
      const bookingsStmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = ? AND date LIKE ?');
      const bookings = bookingsStmt.get('completed', `${dateStr}%`)?.count || 0;
      data.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue, bookings });
    }
    res.json(data);
  } catch (err) {
    console.error('Revenue analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/service-distribution', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0,10);
    
    const items = db.prepare(`
      SELECT ts.serviceName, SUM(ts.quantity) as count, SUM(ts.price * ts.quantity) as revenue
      FROM transaction_services ts
      JOIN transactions t ON ts.transactionId = t.id
      WHERE t.status = ? AND t.date >= ?
      GROUP BY ts.serviceName
      ORDER BY revenue DESC
    `).all('completed', startDateStr);
    
    const total = items.reduce((sum, i) => sum + (i.count || 0), 0);
    const result = items.map(item => ({
      serviceName: item.serviceName,
      count: item.count || 0,
      revenue: item.revenue || 0,
      percentage: total ? ((item.count || 0) / total) * 100 : 0
    }));
    res.json(result);
  } catch (err) {
    console.error('Service distribution error:', err);
    res.json([]);
  }
});

app.get('/api/analytics/payment-methods', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0,10);
    
    const methods = db.prepare(`
      SELECT paymentMethod, COUNT(*) as count, SUM(totalAmount) as revenue
      FROM transactions
      WHERE status = ? AND date >= ?
      GROUP BY paymentMethod
    `).all('completed', startDateStr);
    
    const total = methods.reduce((sum, m) => sum + (m.revenue || 0), 0);
    const result = methods.map(m => ({
      name: m.paymentMethod === 'card' ? 'Credit Card' : m.paymentMethod === 'ewallet' ? 'E-Wallet' : 'Cash',
      value: total ? (m.revenue / total) * 100 : 0,
      revenue: m.revenue || 0,
      count: m.count || 0
    }));
    res.json(result);
  } catch (err) {
    console.error('Payment methods error:', err);
    res.json([]);
  }
});

app.get('/api/analytics/top-services', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0,10);
    
    const top = db.prepare(`
      SELECT ts.serviceName, SUM(ts.quantity) as bookings, SUM(ts.price * ts.quantity) as revenue
      FROM transaction_services ts
      JOIN transactions t ON ts.transactionId = t.id
      WHERE t.status = ? AND t.date >= ?
      GROUP BY ts.serviceName
      ORDER BY revenue DESC
      LIMIT 5
    `).all('completed', startDateStr);
    res.json(top);
  } catch (err) {
    console.error('Top services error:', err);
    res.json([]);
  }
});



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Carwash Backend running on http://localhost:${PORT}`));