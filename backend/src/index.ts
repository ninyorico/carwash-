import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import type { InventoryItem } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// ---------- Services ----------
app.get('/api/services', async (req, res) => {
  const services = await prisma.service.findMany();
  res.json(services);
});

app.post('/api/services', async (req, res) => {
  const { name, description, price, durationMin } = req.body;
  const service = await prisma.service.create({ data: { name, description, price, durationMin } });
  res.status(201).json(service);
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const updated = await prisma.service.update({ where: { id }, data: req.body });
  res.json(updated);
});

app.delete('/api/services/:id', async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- Inventory ----------
app.get('/api/inventory', async (req, res) => {
  const items = await prisma.inventoryItem.findMany();
  // compute status based on quantity vs minStock
  const withStatus = items.map((item: InventoryItem) => ({
    ...item,
    status: item.quantity === 0 ? 'out' : (item.quantity <= item.minStock ? 'low' : 'good')
  }));
  res.json(withStatus);
});

app.post('/api/inventory', async (req, res) => {
  const item = await prisma.inventoryItem.create({ data: req.body });
  res.status(201).json(item);
});

app.put('/api/inventory/:id', async (req, res) => {
  const updated = await prisma.inventoryItem.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

app.post('/api/inventory/:id/restock', async (req, res) => {
  const { quantity } = req.body;
  const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const updated = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { quantity: item.quantity + quantity, lastRestocked: new Date() }
  });
  res.json(updated);
});

// ---------- Customers ----------
app.get('/api/customers', async (req, res) => {
  const customers = await prisma.customer.findMany();
  res.json(customers);
});

app.post('/api/customers', async (req, res) => {
  const customer = await prisma.customer.create({ data: req.body });
  res.status(201).json(customer);
});

// ---------- Transactions & Tickets (POS) ----------
app.post('/api/transactions', async (req, res) => {
  const { customerId, services, paymentMethod, totalAmount, assignedStaff, scheduledTime, notes } = req.body;

  // 1. Create Transaction
  const transaction = await prisma.transaction.create({
    data: {
      customerId,
      totalAmount,
      paymentMethod,
      paymentStatus: 'paid',
      status: 'pending',
      servedBy: assignedStaff,
    }
  });

  // 2. Create Service Ticket
  const estimatedDuration = services.reduce((sum: number, s: any) => sum + (s.durationMin || 30) * s.quantity, 0);
  const ticket = await prisma.serviceTicket.create({
    data: {
      transactionId: transaction.id,
      customerId,
      serviceStatus: 'pending',
      assignedStaff,
      estimatedDuration,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      notes,
    }
  });

  // 3. Create TicketServiceItems
  for (const svc of services) {
    await prisma.ticketServiceItem.create({
      data: {
        ticketId: ticket.id,
        serviceId: svc.serviceId,
        vehicleType: svc.vehicleType,
        quantity: svc.quantity,
        price: svc.price,
      }
    });
  }

  // 4. Deduct inventory (call a helper or do it in the same transaction)
  for (const svc of services) {
    const serviceWithItems = await prisma.service.findUnique({
      where: { id: svc.serviceId },
      include: { items: { include: { item: true } } }
    });
    if (serviceWithItems) {
      for (const si of serviceWithItems.items) {
        await prisma.inventoryItem.update({
          where: { id: si.itemId },
          data: { quantity: { decrement: si.quantityUsed * svc.quantity } }
        });
      }
    }
  }

  const result = { transaction, ticket };
  res.status(201).json(result);
});

// ---------- Analytics ----------
app.get('/api/analytics/dashboard', async (req, res) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalRevenue, totalBookings, activeServices, todayTransactions, yesterdayTransactions] = await Promise.all([
    prisma.transaction.aggregate({ where: { status: 'completed' }, _sum: { totalAmount: true } }),
    prisma.transaction.count({ where: { status: 'completed' } }),
    prisma.serviceTicket.count({ where: { serviceStatus: { in: ['pending','in-progress'] } } }),
    prisma.transaction.findMany({ where: { createdAt: { gte: today, lt: tomorrow }, status: 'completed' } }),
    prisma.transaction.findMany({ where: { createdAt: { gte: new Date(Date.now() - 86400000), lt: today }, status: 'completed' } })
  ]);

  const revenueToday = todayTransactions.reduce((sum: number, t: { totalAmount: number; }) => sum + t.totalAmount, 0);
  const revenueYesterday = yesterdayTransactions.reduce((sum: number, t: { totalAmount: number; }) => sum + t.totalAmount, 0);
  const revenueChange = revenueYesterday === 0 ? 100 : ((revenueToday - revenueYesterday) / revenueYesterday) * 100;

  const completedToday = todayTransactions.length;
  const completedYesterday = yesterdayTransactions.length;
  const bookingsChange = completedYesterday === 0 ? 100 : ((completedToday - completedYesterday) / completedYesterday) * 100;

  res.json({
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    totalBookings,
    activeServices,
    completedToday,
    revenueToday,
    revenueChange,
    bookingsChange,
  });
});

app.get('/api/analytics/revenue', async (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const dates: Array<{ date: string; revenue: number; bookings: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0,0,0,0);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const txns = await prisma.transaction.findMany({
      where: { createdAt: { gte: date, lt: next }, status: 'completed' }
    });
    const revenue = txns.reduce((sum: number, t: { totalAmount: number }) => sum + t.totalAmount, 0);
    dates.push({ date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue, bookings: txns.length });
  }
  res.json(dates);
});

app.get('/api/analytics/service-distribution', async (req, res) => {
  const items = await prisma.ticketServiceItem.findMany({
    include: { service: true, ticket: { include: { transaction: true } } },
    where: { ticket: { transaction: { status: 'completed' } } }
  });
  const map = new Map();
  for (const item of items) {
    const name = item.service.name;
    const existing = map.get(name) || { count: 0, revenue: 0 };
    existing.count += item.quantity;
    existing.revenue += item.price * item.quantity;
    map.set(name, existing);
  }
  const totalCount = Array.from(map.values()).reduce((sum, v) => sum + v.count, 0);
  const result = Array.from(map.entries()).map(([serviceName, data]) => ({
    serviceName,
    count: data.count,
    revenue: data.revenue,
    percentage: totalCount ? (data.count / totalCount) * 100 : 0
  }));
  res.json(result);
});

// ---------- Service Tickets for Scheduling ----------
app.get('/api/tickets', async (req, res) => {
  const tickets = await prisma.serviceTicket.findMany({
    include: {
      customer: true,
      items: { include: { service: true } },
      transaction: true
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tickets);
});

app.patch('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const { serviceStatus, startTime, endTime, isPaused, pausedAt, totalPausedSeconds } = req.body;
  const updated = await prisma.serviceTicket.update({
    where: { id },
    data: { serviceStatus, startTime, endTime, isPaused, pausedAt, totalPausedSeconds }
  });
  res.json(updated);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));