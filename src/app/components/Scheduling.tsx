import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  User,
  Car,
  CheckCircle,
  XCircle,
  Plus,
  X,
  ClipboardList,
  Play,
  Pause,
  Square,
  Timer,
  Ban,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface Booking {
  id: string;
  customer: string;
  service: string;
  vehicle: string;
  time: string;
  employee: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  transactionId?: string;
  paymentStatus?: 'paid' | 'pending' | 'refunded';
  serviceTicket?: any;
  isPaused?: boolean;
}

type Column = {
  id: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  title: string;
  color: string;
  gradient: string;
  icon: React.ReactNode;
};

const columns: Column[] = [
  { id: 'pending', title: 'Pending', color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500', icon: <Clock className="w-4 h-4" /> },
  { id: 'in-progress', title: 'In Progress', color: 'text-purple-400', gradient: 'from-purple-500 to-pink-500', icon: <Timer className="w-4 h-4" /> },
  { id: 'completed', title: 'Completed', color: 'text-green-400', gradient: 'from-green-500 to-emerald-500', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'cancelled', title: 'Cancelled', color: 'text-red-400', gradient: 'from-red-500 to-rose-500', icon: <XCircle className="w-4 h-4" /> },
];

const formatElapsedTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getElapsedTime = (ticket: any): number => {
  if (!ticket?.startTime) return 0;
  const start = new Date(ticket.startTime).getTime();
  const now = ticket.endTime ? new Date(ticket.endTime).getTime() : Date.now();
  let elapsed = (now - start) / 1000;
  if (ticket.totalPausedSeconds) elapsed -= ticket.totalPausedSeconds;
  if (ticket.isPaused && ticket.pausedAt) {
    const pausedDuration = (Date.now() - new Date(ticket.pausedAt).getTime()) / 1000;
    elapsed -= pausedDuration;
  }
  return Math.max(0, elapsed);
};

function BookingCard({ booking, column, onClick, isNew }: any) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className={`backdrop-blur-xl bg-white/5 border rounded-xl p-4 cursor-pointer hover:border-white/20 transition-all ${
        isNew ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' : 'border-white/10'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-white font-medium mb-1">{booking.customer}</h4>
          <p className="text-sm text-gray-400">{booking.service}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-2 py-1 rounded-lg bg-black/40 border ${column.color.replace('text-', 'border-')} ${column.color} text-xs font-medium`}>
            ₱{booking.price}
          </div>
          {booking.isPaused && (
            <div className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-xs font-medium">
              ⏸ Paused
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-400"><Car className="w-4 h-4" /><span>{booking.vehicle}</span></div>
        <div className="flex items-center gap-2 text-sm text-gray-400"><Clock className="w-4 h-4" /><span>{booking.time}</span></div>
        <div className="flex items-center gap-2 text-sm text-gray-400"><User className="w-4 h-4" /><span>{booking.employee}</span></div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/10">
        <span className="text-xs text-gray-500">#{booking.id}</span>
      </div>
    </motion.div>
  );
}

function KanbanColumn({ column, bookings, onCardClick, newTicketIds }: any) {
  return (
    <div className="flex-1 min-w-[280px] backdrop-blur-xl bg-white/5 border rounded-2xl p-4 transition-all border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${column.gradient} bg-opacity-10`}>
            <div className={column.color}>{column.icon}</div>
          </div>
          <div>
            <h3 className="text-white font-semibold">{column.title}</h3>
            <p className="text-sm text-gray-500">{bookings.length} items</p>
          </div>
        </div>
      </div>
      <div className="space-y-3 min-h-[400px]">
        <AnimatePresence>
          {bookings.map((booking: Booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              column={column}
              onClick={() => onCardClick?.(booking)}
              isNew={newTicketIds?.has(booking.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Service options for new booking
const serviceOptions = [
  { name: 'Basic Wash', price: 250 },
  { name: 'Premium Wash', price: 450 },
  { name: 'Full Detailing', price: 1200 },
  { name: 'Express Wash', price: 150 },
  { name: 'Wax & Polish', price: 600 },
  { name: 'Air Fresh', price: 200 },
];

const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle'];

const availableStaff = ['Mike Johnson', 'David Chen', 'Sarah Lee', 'Emily Rodriguez', 'James Wilson'];

export function Scheduling() {
  const queryClient = useQueryClient();
  
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.get('/tickets').then(res => res.data),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/transactions').then(res => res.data),
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/tickets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [newTicketIds, setNewTicketIds] = useState<Set<string>>(new Set());
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // New booking form state
  const [newBookingForm, setNewBookingForm] = useState({
    customerName: '',
    customerPhone: '',
    service: '',
    vehicleType: '',
    scheduledTime: '',
    notes: '',
  });

  useEffect(() => {
    if (tickets.length > 0 && transactions.length > 0) {
      const converted = tickets.map((ticket: any) => {
        const relatedTx = transactions.find((tx: any) => tx.id === ticket.transactionId);
        
        let serviceNames = 'Service';
        let vehicleType = 'N/A';
        let price = 0;
        
        if (relatedTx?.services && relatedTx.services.length > 0) {
          serviceNames = relatedTx.services.map((s: any) => s.serviceName).join(', ');
          vehicleType = relatedTx.services[0]?.vehicleType || 'N/A';
          price = relatedTx.totalAmount || 0;
        }
        
        const scheduled = ticket.scheduledTime 
          ? new Date(ticket.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        return {
          id: ticket.id,
          customer: ticket.customerName,
          service: serviceNames,
          vehicle: vehicleType,
          time: scheduled,
          employee: ticket.assignedStaff,
          status: ticket.serviceStatus === 'approved' ? 'pending' : ticket.serviceStatus,
          price: price,
          transactionId: ticket.transactionId,
          paymentStatus: relatedTx?.paymentStatus || 'pending',
          serviceTicket: ticket,
          isPaused: ticket.isPaused || false,
        };
      });
      
      const existingIds = new Set(bookings.map(b => b.id));
      const newIds = converted.filter((c: Booking) => !existingIds.has(c.id)).map((c: Booking) => c.id);
      if (newIds.length) {
        setNewTicketIds(prev => new Set([...prev, ...newIds]));
        setTimeout(() => {
          setNewTicketIds(prev => {
            const updated = new Set(prev);
            newIds.forEach(id => updated.delete(id));
            return updated;
          });
        }, 5000);
      }
      setBookings(converted);
    }
  }, [tickets, transactions]);

  const handleCardClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
    
    if (booking.serviceTicket?.startTime && !booking.serviceTicket?.endTime) {
      setElapsedTime(getElapsedTime(booking.serviceTicket));
      if (!booking.serviceTicket?.isPaused && booking.status === 'in-progress') {
        startTimer();
      }
    } else {
      setElapsedTime(0);
    }
  };

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  const handleStartService = () => {
    if (selectedBooking) {
      updateTicket.mutate({ 
        id: selectedBooking.id, 
        data: { serviceStatus: 'in-progress', startTime: new Date().toISOString(), isPaused: false } 
      });
      setSelectedBooking(prev => prev ? { ...prev, status: 'in-progress', isPaused: false } : null);
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'in-progress', isPaused: false } : b));
      setElapsedTime(0);
      startTimer();
    }
  };

  const handlePauseService = () => {
    if (selectedBooking) {
      updateTicket.mutate({ 
        id: selectedBooking.id, 
        data: { isPaused: true, pausedAt: new Date().toISOString() } 
      });
      setSelectedBooking(prev => prev ? { ...prev, isPaused: true } : null);
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, isPaused: true } : b));
      stopTimer();
    }
  };

  const handleResumeService = () => {
    if (selectedBooking) {
      updateTicket.mutate({ 
        id: selectedBooking.id, 
        data: { isPaused: false, pausedAt: null } 
      });
      setSelectedBooking(prev => prev ? { ...prev, isPaused: false } : null);
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, isPaused: false } : b));
      startTimer();
    }
  };

const handleCompleteService = () => {
  if (selectedBooking) {
    // Update ticket status
    updateTicket.mutate({ 
      id: selectedBooking.id, 
      data: { serviceStatus: 'completed', endTime: new Date().toISOString(), isPaused: false } 
    });
    
    // Also update the transaction status to 'completed'
    if (selectedBooking.transactionId) {
      api.patch(`/transactions/${selectedBooking.transactionId}`, { status: 'completed' })
        .catch(err => console.error('Error updating transaction status:', err));
    }
    
    setSelectedBooking(prev => prev ? { ...prev, status: 'completed', isPaused: false } : null);
    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'completed', isPaused: false } : b));
    stopTimer();
    setTimeout(() => {
      setShowDetailModal(false);
    }, 500);
  }
};

  const handleCancelService = () => {
    if (selectedBooking) {
      updateTicket.mutate({ 
        id: selectedBooking.id, 
        data: { serviceStatus: 'cancelled', isPaused: false } 
      });
      setSelectedBooking(prev => prev ? { ...prev, status: 'cancelled', isPaused: false } : null);
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled', isPaused: false } : b));
      stopTimer();
      setTimeout(() => {
        setShowDetailModal(false);
      }, 500);
    }
  };

  // Handle creating a new booking
  const handleCreateNewBooking = async () => {
    const selectedService = serviceOptions.find(s => s.name === newBookingForm.service);
    if (!selectedService) return;

    // First, create or get customer
    let customerId = `C${Date.now()}`;
    let customerName = newBookingForm.customerName;
    let customerPhone = newBookingForm.customerPhone;

    // Check if customer already exists
    const existingCustomer = await api.get('/customers').then(res => 
      res.data.find((c: any) => c.phone === customerPhone)
    );

    if (existingCustomer) {
      customerId = existingCustomer.id;
      customerName = existingCustomer.name;
    } else {
      // Create new customer
      await api.post('/customers', {
        id: customerId,
        name: customerName,
        phone: customerPhone,
        vehicleType: newBookingForm.vehicleType,
      });
    }

    const payload = {
      customerId: customerId,
      customerName: customerName,
      customerPhone: customerPhone,
      services: [{
        name: selectedService.name,
        vehicleType: newBookingForm.vehicleType,
        quantity: 1,
        price: selectedService.price,
        durationMin: 30,
      }],
      totalAmount: selectedService.price,
      paymentMethod: 'pending',
      assignedStaff: availableStaff[0],
      scheduledTime: newBookingForm.scheduledTime,
      notes: newBookingForm.notes,
    };

    try {
      const res = await api.post('/transactions', payload);
      if (res.status === 201) {
        refetch();
        setShowNewBookingModal(false);
        setNewBookingForm({
          customerName: '',
          customerPhone: '',
          service: '',
          vehicleType: '',
          scheduledTime: '',
          notes: '',
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create booking');
    }
  };

  const getStatusDisplay = (status: string, isPaused: boolean) => {
    if (isPaused && status === 'in-progress') {
      return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Paused', icon: Pause };
    }
    switch(status) {
      case 'pending': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Pending', icon: Clock };
      case 'in-progress': return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'In Progress', icon: Timer };
      case 'completed': return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Completed', icon: CheckCircle };
      case 'cancelled': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Cancelled', icon: XCircle };
      default: return { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Unknown', icon: Clock };
    }
  };

  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    inProgress: bookings.filter(b => b.status === 'in-progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  if (isLoading) return <div className="p-8 text-white">Loading scheduling...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Scheduling</h1>
          <p className="text-gray-400">Manage and track service appointments</p>
        </div>
        <button 
          onClick={() => setShowNewBookingModal(true)} 
          className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Booking
        </button>
      </div>

      {/* Stats Cards - FIXED with solid colors, NO gradients */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-white">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">In Progress</p>
              <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
            </div>
            <Timer className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-white">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Cancelled</p>
              <p className="text-3xl font-bold text-white">{stats.cancelled}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            bookings={bookings.filter(b => b.status === column.id)}
            onCardClick={handleCardClick}
            newTicketIds={newTicketIds}
          />
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-auto"
            >
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <ClipboardList className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Service Details</h3>
                    <p className="text-sm text-gray-400">Ticket #{selectedBooking.id}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">Name</p><p className="text-white">{selectedBooking.customer}</p></div>
                  <div><p className="text-xs text-gray-500">Vehicle</p><p className="text-white">{selectedBooking.vehicle}</p></div>
                  <div><p className="text-xs text-gray-500">Scheduled Time</p><p className="text-white">{selectedBooking.time}</p></div>
                </div>
              </div>

              {/* Service Status - Display only */}
              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Service Status</h4>
                <div className="flex items-center gap-3">
                  {(() => {
                    const statusConfig = getStatusDisplay(selectedBooking.status, selectedBooking.isPaused || false);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig.bg} border ${statusConfig.border}`}>
                        <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                        <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Actions</h4>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={handleStartService}
                    disabled={selectedBooking.status === 'in-progress' || selectedBooking.status === 'completed' || selectedBooking.status === 'cancelled'}
                    className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Start
                  </button>
                  
                  {selectedBooking.isPaused ? (
                    <button
                      onClick={handleResumeService}
                      disabled={selectedBooking.status !== 'in-progress'}
                      className="px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" /> Resume
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseService}
                      disabled={selectedBooking.status !== 'in-progress'}
                      className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 hover:bg-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  )}
                  
                  <button
                    onClick={handleCompleteService}
                    disabled={selectedBooking.status !== 'in-progress'}
                    className="px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4" /> Complete
                  </button>

                  <button
                    onClick={handleCancelService}
                    disabled={selectedBooking.status === 'completed' || selectedBooking.status === 'cancelled'}
                    className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" /> Cancel
                  </button>
                </div>

                {/* Elapsed Time Display */}
                {(selectedBooking.status === 'in-progress' || elapsedTime > 0) && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Elapsed Time</span>
                      <span className="text-2xl font-mono font-bold text-white">
                        {formatElapsedTime(elapsedTime)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Service Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Service</span>
                    <span className="text-white font-medium">{selectedBooking.service}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Price</span>
                    <span className="text-xl font-bold text-white">₱{selectedBooking.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assigned To</span>
                    <span className="text-white font-medium flex items-center gap-2">
                      <User className="w-4 h-4" /> {selectedBooking.employee}
                    </span>
                  </div>
                  {selectedBooking.paymentStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Status</span>
                      <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        selectedBooking.paymentStatus === 'paid' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                          : selectedBooking.paymentStatus === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {selectedBooking.paymentStatus.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={() => setShowDetailModal(false)} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-all">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

{/* New Booking Modal */}
<AnimatePresence>
  {showNewBookingModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={() => setShowNewBookingModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">New Booking</h3>
              <p className="text-sm text-gray-400">Create a new service appointment</p>
            </div>
          </div>
          <button onClick={() => setShowNewBookingModal(false)} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Customer Name</label>
            <input
              type="text"
              value={newBookingForm.customerName}
              onChange={(e) => setNewBookingForm(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
              placeholder="Enter customer name"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
            <input
              type="tel"
              value={newBookingForm.customerPhone}
              onChange={(e) => setNewBookingForm(prev => ({ ...prev, customerPhone: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          {/* Service - FIXED dropdown visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Service</label>
            <select
              value={newBookingForm.service}
              onChange={(e) => setNewBookingForm(prev => ({ ...prev, service: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
              style={{ backgroundColor: '#1e293b' }}
            >
              <option value="" className="bg-slate-800 text-white">Select a service</option>
              {serviceOptions.map(service => (
                <option key={service.name} value={service.name} className="bg-slate-800 text-white">
                  {service.name} - ₱{service.price}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Type - FIXED dropdown visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Vehicle Type</label>
            <select
              value={newBookingForm.vehicleType}
              onChange={(e) => setNewBookingForm(prev => ({ ...prev, vehicleType: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
              style={{ backgroundColor: '#1e293b' }}
            >
              <option value="" className="bg-slate-800 text-white">Select vehicle type</option>
              {vehicleTypes.map(type => (
                <option key={type} value={type} className="bg-slate-800 text-white">
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Scheduled Time</label>
            <input
              type="datetime-local"
              value={newBookingForm.scheduledTime}
              onChange={(e) => setNewBookingForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Notes (Optional)</label>
            <textarea
              value={newBookingForm.notes}
              onChange={(e) => setNewBookingForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
              rows={3}
              placeholder="Add any special notes or requirements..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowNewBookingModal(false)}
            className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateNewBooking}
            disabled={!newBookingForm.customerName || !newBookingForm.customerPhone || !newBookingForm.service || !newBookingForm.vehicleType}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-blue-500/50"
          >
            Create Booking
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>  
    </div>
  );
}