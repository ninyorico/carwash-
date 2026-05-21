import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  CreditCard,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download,
  User,
  Car,
  Printer,
} from 'lucide-react';
import { api } from '../../lib/api';

export function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return transactions.filter((txn: any) => {
      const txnDate = new Date(txn.date);
      if (filter === 'today') return txnDate >= today;
      if (filter === 'week') return txnDate >= weekAgo;
      if (filter === 'month') return txnDate >= monthAgo;
      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusConfig = (paymentStatus: string) => {
    switch(paymentStatus) {
      case 'paid': return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Paid' };
      case 'pending': return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Pending' };
      default: return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Refunded' };
    }
  };

  // Get duration in minutes with proper formatting
  const getDurationDisplay = (txn: any) => {
    if (txn.duration) {
      const mins = txn.duration;
      if (mins < 60) return `${mins} mins`;
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      if (remainingMins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
      return `${hours} hr ${remainingMins} min`;
    }
    // Calculate from services if duration not stored
    if (txn.services && txn.services.length > 0) {
      const totalMins = txn.services.reduce((sum, s) => sum + (s.durationMin || 30) * s.quantity, 0);
      if (totalMins < 60) return `${totalMins} mins`;
      const hours = Math.floor(totalMins / 60);
      const remainingMins = totalMins % 60;
      if (remainingMins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
      return `${hours} hr ${remainingMins} min`;
    }
    return 'N/A';
  };

  const handlePrint = (txn: any) => {
    // Calculate totals
    const subtotal = txn.services?.reduce((sum: number, s: any) => sum + (s.price * s.quantity), 0) || 0;
    const tax = subtotal * 0.08;
    const total = txn.totalAmount || subtotal + tax;
    const vehicleType = txn.services?.[0]?.vehicleType || 'N/A';
    const duration = getDurationDisplay(txn);

    // Create print window
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (!printWindow) {
      alert('Please allow pop-ups to print receipts');
      return;
    }

    // Generate HTML for printing
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Receipt - ${txn.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', 'Monaco', monospace;
            background: #f5f5f5;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
          }
          .receipt {
            max-width: 500px;
            width: 100%;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .business-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .business-details {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .info-section {
            margin-bottom: 20px;
            padding: 12px;
            background: #f9f9f9;
            border-radius: 4px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            text-align: left;
            border-bottom: 1px solid #ddd;
            padding: 8px 0;
            font-size: 12px;
          }
          td {
            padding: 8px 0;
            font-size: 12px;
            border-bottom: 1px solid #eee;
          }
          .totals {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #333;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 14px;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #999;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
          }
          .status-paid { background: #d4edda; color: #155724; }
          .status-pending { background: #fff3cd; color: #856404; }
          .status-refunded { background: #f8d7da; color: #721c24; }
          .status-completed { background: #d4edda; color: #155724; }
          .status-in-progress { background: #cce5ff; color: #004085; }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .receipt {
              border: none;
              box-shadow: none;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="business-name">Premium CarWash</div>
            <div class="business-details">123 Main Street, City</div>
            <div class="business-details">Phone: (555) 123-4567</div>
            <div class="business-details">Email: info@premiumcarwash.com</div>
          </div>

          <div class="title">🧾 TRANSACTION RECEIPT 🧾</div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${txn.id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date & Time:</span>
              <span class="info-value">${formatFullDateTime(txn.date)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Served By:</span>
              <span class="info-value">${txn.servedBy || 'N/A'}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Customer Name:</span>
              <span class="info-value">${txn.customerName}</span>
            </div>
            ${txn.customerPhone ? `
            <div class="info-row">
              <span class="info-label">Customer Phone:</span>
              <span class="info-value">${txn.customerPhone}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Vehicle Type:</span>
              <span class="info-value">${vehicleType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Duration:</span>
              <span class="info-value">${duration}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Qty</th>
                <th align="right">Price</th>
                <th align="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${txn.services?.map((service: any) => `
                <tr>
                  <td>${service.serviceName}</td>
                  <td>${service.quantity}</td>
                  <td align="right">$${service.price.toFixed(2)}</td>
                  <td align="right">$${(service.price * service.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (8%):</span>
              <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="grand-total">
              <span>TOTAL:</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>

          <div class="info-section" style="margin-top: 20px;">
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">${txn.paymentMethod === 'card' ? 'Credit/Debit Card' : txn.paymentMethod === 'ewallet' ? 'E-Wallet' : 'Cash'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Status:</span>
              <span class="info-value">
                <span class="status-badge status-${txn.paymentStatus || 'paid'}">
                  ${(txn.paymentStatus || 'paid').toUpperCase()}
                </span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Service Status:</span>
              <span class="info-value">
                <span class="status-badge status-${txn.status}">
                  ${txn.status.toUpperCase()}
                </span>
              </span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Please visit us again</p>
            <p style="margin-top: 10px; font-size: 9px;">This is a system generated receipt. No signature required.</p>
            <p style="margin-top: 5px; font-size: 9px;">For inquiries, please call (555) 123-4567</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { 
                window.close(); 
              }, 1000);
            }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <div className="p-8 text-white">Loading transactions...</div>;
  
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-white text-xl mb-4">No transactions yet</div>
        <p className="text-gray-400">Go to POS and complete a payment to see transactions here</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-gray-400">View and manage all transactions</p>
        </div>
        <button onClick={fetchTransactions} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2">
          <Download className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filter:</span>
        </div>
        <div className="flex gap-2">
          {['all', 'today', 'week', 'month'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((txn: any, idx: number) => {
          const isExpanded = expandedId === txn.id;
          const paymentStatusConfig = getPaymentStatusConfig(txn.paymentStatus || 'paid');
          const PaymentStatusIcon = paymentStatusConfig.icon;
          
          const vehicleType = txn.services?.[0]?.vehicleType || 'N/A';
          const duration = getDurationDisplay(txn);

          return (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
            >
              {/* Collapsed View */}
              <div
                onClick={() => toggleExpand(txn.id)}
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className={`p-3 rounded-xl ${paymentStatusConfig.bg} border ${paymentStatusConfig.border}`}>
                  <PaymentStatusIcon className={`w-5 h-5 ${paymentStatusConfig.color}`} />
                </div>

                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                    <p className="text-white font-mono text-sm font-medium">{txn.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Customer</p>
                    <p className="text-white font-medium">{txn.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                    <p className="text-white text-sm">{formatDate(txn.date)}</p>
                    <p className="text-gray-500 text-xs">{formatTime(txn.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Services</p>
                    {/* Collapsed: Show only count */}
                    <p className="text-white text-sm">{txn.services?.length || 0} item(s)</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        ₱{txn.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/10 overflow-hidden"
                  >
                    <div className="p-6 bg-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Payment Method */}
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                          <CreditCard className="w-5 h-5 text-blue-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="text-white font-medium capitalize">
                              {txn.paymentMethod === 'card' ? 'Credit/Debit Card' : txn.paymentMethod === 'ewallet' ? 'E-Wallet' : 'Cash'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">Status:</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentStatusConfig.bg} ${paymentStatusConfig.color}`}>
                                {paymentStatusConfig.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Type */}
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                          <Car className="w-5 h-5 text-purple-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Vehicle Type</p>
                            <p className="text-white font-medium">{vehicleType}</p>
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                          <Clock className="w-5 h-5 text-pink-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Duration</p>
                            <p className="text-white font-medium">{duration}</p>
                          </div>
                        </div>

                        {/* Served By */}
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                          <User className="w-5 h-5 text-cyan-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Served By</p>
                            <p className="text-white font-medium">{txn.servedBy || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Expanded: Show full service list */}
                      {txn.services && txn.services.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-semibold text-gray-400 mb-3">Services Availed</h4>
                          <div className="space-y-2">
                            {txn.services.map((service: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                                <div className="flex-1">
                                  <p className="text-white font-medium">{service.serviceName}</p>
                                  <p className="text-xs text-gray-500">Vehicle: {service.vehicleType || 'N/A'} | Qty: {service.quantity}</p>
                                </div>
                                <p className="text-white font-semibold">₱{(service.price * service.quantity).toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Print Button */}
                      <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
                        <button
                          onClick={() => handlePrint(txn)}
                          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Printer className="w-4 h-4" /> Print Receipt
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}