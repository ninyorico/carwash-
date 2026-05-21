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
    servedBy TEXT
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

// Seed data if empty
const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
if (serviceCount === 0) {
  const insertService = db.prepare('INSERT INTO services (id, name, price, durationMin) VALUES (?, ?, ?, ?)');
  insertService.run('srv1', 'Basic Wash', 25, 15);
  insertService.run('srv2', 'Premium Wash', 45, 30);
  insertService.run('srv3', 'Full Detailing', 120, 120);
  insertService.run('srv4', 'Express Wash', 15, 10);
  insertService.run('srv5', 'Wax & Polish', 60, 45);
  insertService.run('srv6', 'Air Fresh', 20, 20);

  const insertInv = db.prepare('INSERT INTO inventory (id, name, category, quantity, minStock, unit, price, supplier, lastRestocked) VALUES (?,?,?,?,?,?,?,?,?)');
  insertInv.run('inv1', 'Foam Soap', 'Washing', 50, 20, 'gallons', 45, 'BubbleTech', new Date().toISOString());
  insertInv.run('inv2', 'Microfiber Towels', 'Supplies', 120, 50, 'pieces', 2.5, 'CleanPro', new Date().toISOString());
  insertInv.run('inv3', 'Glass Cleaner', 'Cleaning', 35, 20, 'bottles', 9.99, 'CleanPro', new Date().toISOString());

  const insertCustomer = db.prepare('INSERT INTO customers (id, name, phone, plateNumber, vehicleType) VALUES (?,?,?,?,?)');
  insertCustomer.run('C001', 'John Doe', '555-0101', 'ABC-1234', 'Sedan');

  // Sample transactions
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString();
    const txId = `TXN${i}`;
    const services = ['Basic Wash', 'Premium Wash', 'Express Wash', 'Wax & Polish'][Math.floor(Math.random() * 4)];
    const price = services === 'Premium Wash' ? 45 : services === 'Basic Wash' ? 25 : services === 'Express Wash' ? 15 : 60;
    
    const txStmt = db.prepare('INSERT INTO transactions (id, customerId, customerName, customerPhone, totalAmount, paymentMethod, paymentStatus, status, date, servedBy) VALUES (?,?,?,?,?,?,?,?,?,?)');
    txStmt.run(txId, 'C001', 'John Doe', '555-0101', price, 'card', 'paid', 'completed', dateStr, 'Mike Johnson');
    
    const svcStmt = db.prepare('INSERT INTO transaction_services (id, transactionId, serviceName, vehicleType, quantity, price) VALUES (?,?,?,?,?,?)');
    svcStmt.run(`tsvc${i}`, txId, services, 'Sedan', 1, price);
  }
}

// API endpoints
app.get('/api/services', (req, res) => {
  const rows = db.prepare('SELECT * FROM services').all();
  res.json(rows);
});

app.get('/api/inventory', (req, res) => {
  const items = db.prepare('SELECT * FROM inventory').all();
  const withStatus = items.map(item => ({
    ...item,
    status: item.quantity === 0 ? 'out' : (item.quantity <= item.minStock ? 'low' : 'good')
  }));
  res.json(withStatus);
});

app.get('/api/customers', (req, res) => {
  const rows = db.prepare('SELECT * FROM customers').all();
  res.json(rows);
});

app.post('/api/customers', (req, res) => {
  const { name, phone, plateNumber, vehicleType } = req.body;
  const id = `C${Date.now()}`;
  const stmt = db.prepare('INSERT INTO customers (id, name, phone, plateNumber, vehicleType) VALUES (?,?,?,?,?)');
  stmt.run(id, name, phone, plateNumber || null, vehicleType || null);
  res.status(201).json({ id, name, phone, plateNumber, vehicleType });
});

app.post('/api/transactions', (req, res) => {
  const { customerId, customerName, customerPhone, services, totalAmount, paymentMethod, assignedStaff } = req.body;
  const txId = `TXN${Date.now()}`;
  const date = new Date().toISOString();

  const txStmt = db.prepare('INSERT INTO transactions (id, customerId, customerName, customerPhone, totalAmount, paymentMethod, paymentStatus, status, date, servedBy) VALUES (?,?,?,?,?,?,?,?,?,?)');
  txStmt.run(txId, customerId, customerName, customerPhone, totalAmount, paymentMethod, 'paid', 'completed', date, assignedStaff);

  const svcStmt = db.prepare('INSERT INTO transaction_services (id, transactionId, serviceName, vehicleType, quantity, price) VALUES (?,?,?,?,?,?)');
  for (const svc of services) {
    svcStmt.run(`tsvc_${Date.now()}_${Math.random()}`, txId, svc.name, svc.vehicleType, svc.quantity, svc.price);
  }

  const ticketId = `ST${Date.now()}`;
  const estimatedDuration = services.reduce((sum, s) => sum + (s.durationMin || 30) * s.quantity, 0);
  const ticketStmt = db.prepare('INSERT INTO tickets (id, transactionId, customerId, customerName, customerPhone, serviceStatus, assignedStaff, estimatedDuration, scheduledTime, notes, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  ticketStmt.run(ticketId, txId, customerId, customerName, customerPhone, 'pending', assignedStaff, estimatedDuration, null, null, new Date().toISOString());

  const updateInv = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE name = ?');
  for (const svc of services) {
    if (svc.name === 'Basic Wash') updateInv.run(0.5, 'Foam Soap');
    if (svc.name === 'Premium Wash') updateInv.run(0.8, 'Foam Soap');
  }

  res.status(201).json({ transaction: { id: txId }, ticket: { id: ticketId } });
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
  const { serviceStatus, startTime, endTime, isPaused, pausedAt, totalPausedSeconds } = req.body;
  const stmt = db.prepare('UPDATE tickets SET serviceStatus = ?, startTime = ?, endTime = ?, isPaused = ?, pausedAt = ?, totalPausedSeconds = ? WHERE id = ?');
  stmt.run(serviceStatus, startTime, endTime, isPaused ? 1 : 0, pausedAt, totalPausedSeconds, id);
  res.json({ success: true });
});

// Analytics endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    
    const totalRevenueStmt = db.prepare('SELECT SUM(totalAmount) as total FROM transactions WHERE status = "completed"');
    const totalRevenue = totalRevenueStmt.get().total || 0;
    
    const totalBookingsStmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = "completed"');
    const totalBookings = totalBookingsStmt.get().count || 0;
    
    const activeServicesStmt = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE serviceStatus IN ("pending","in-progress")');
    const activeServices = activeServicesStmt.get().count || 0;
    
    const revenueTodayStmt = db.prepare('SELECT SUM(totalAmount) as total FROM transactions WHERE status = "completed" AND date LIKE ?');
    const revenueToday = revenueTodayStmt.get(`${today}%`).total || 0;
    
    const revenueYesterdayStmt = db.prepare('SELECT SUM(totalAmount) as total FROM transactions WHERE status = "completed" AND date LIKE ?');
    const revenueYesterday = revenueYesterdayStmt.get(`${yesterday}%`).total || 0;
    
    const completedTodayStmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = "completed" AND date LIKE ?');
    const completedToday = completedTodayStmt.get(`${today}%`).count || 0;
    
    const completedYesterdayStmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = "completed" AND date LIKE ?');
    const completedYesterday = completedYesterdayStmt.get(`${yesterday}%`).count || 0;
    
    const revenueChange = revenueYesterday === 0 ? (revenueToday > 0 ? 100 : 0) : ((revenueToday - revenueYesterday) / revenueYesterday) * 100;
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
      const revStmt = db.prepare('SELECT SUM(totalAmount) as total FROM transactions WHERE status = "completed" AND date LIKE ?');
      const revenue = revStmt.get(`${dateStr}%`).total || 0;
      const bookingsStmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = "completed" AND date LIKE ?');
      const bookings = bookingsStmt.get(`${dateStr}%`).count || 0;
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
    const items = db.prepare(`
      SELECT ts.serviceName, SUM(ts.quantity) as count, SUM(ts.price * ts.quantity) as revenue
      FROM transaction_services ts
      JOIN transactions t ON ts.transactionId = t.id
      WHERE t.status = 'completed'
      GROUP BY ts.serviceName
      ORDER BY revenue DESC
    `).all();
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

// ADD THESE TWO ENDPOINTS:
app.get('/api/analytics/payment-methods', (req, res) => {
  try {
    const methods = db.prepare(`
      SELECT paymentMethod, COUNT(*) as count, SUM(totalAmount) as revenue
      FROM transactions
      WHERE status = 'completed'
      GROUP BY paymentMethod
    `).all();
    
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
    const top = db.prepare(`
      SELECT ts.serviceName, SUM(ts.quantity) as bookings, SUM(ts.price * ts.quantity) as revenue
      FROM transaction_services ts
      JOIN transactions t ON ts.transactionId = t.id
      WHERE t.status = 'completed'
      GROUP BY ts.serviceName
      ORDER BY revenue DESC
      LIMIT 5
    `).all();
    res.json(top);
  } catch (err) {
    console.error('Top services error:', err);
    res.json([]);
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));