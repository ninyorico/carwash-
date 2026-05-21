import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Droplets,
  Sparkles,
  Car,
  Wind,
  Shield,
  Zap,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Bike,
  Truck,
  Bus,
  X,
  Search,
  UserPlus,
  User,
  Phone,
  Edit2,
  CreditCard,
  Wallet,
  Banknote,
  Check,
  Loader2,
  Printer,
  Mail,
  Receipt,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  gradient: string;
  allowedVehicles?: string[];
}

interface VehicleType {
  id: string;
  name: string;
  icon: React.ReactNode;
  priceMultiplier: number;
  gradient: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  plateNumber?: string;
  vehicleType?: string;
}

interface CartItem extends Service {
  quantity: number;
  vehicleType: VehicleType;
  finalPrice: number;
  assignedStaff?: string;
}

const vehicleTypes: VehicleType[] = [
  {
    id: 'motorcycle',
    name: 'Motorcycle',
    icon: <Bike className="w-8 h-8" />,
    priceMultiplier: 0.6,
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'sedan',
    name: 'Sedan',
    icon: <Car className="w-8 h-8" />,
    priceMultiplier: 1.0,
    gradient: 'from-blue-500 to-purple-500',
  },
  {
    id: 'suv',
    name: 'SUV',
    icon: <Car className="w-8 h-8" />,
    priceMultiplier: 1.3,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'van',
    name: 'Van',
    icon: <Bus className="w-8 h-8" />,
    priceMultiplier: 1.5,
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'truck',
    name: 'Truck',
    icon: <Truck className="w-8 h-8" />,
    priceMultiplier: 1.7,
    gradient: 'from-orange-500 to-red-500',
  },
];

// Find the cheapest vehicle type (lowest priceMultiplier)
const cheapestVehicle = vehicleTypes.reduce((prev, current) =>
  (prev.priceMultiplier < current.priceMultiplier) ? prev : current
);

const services: Service[] = [
  {
    id: 'srv1',
    name: 'Basic Wash',
    description: 'Exterior wash and dry',
    price: Math.round(250 * cheapestVehicle.priceMultiplier), // ₱150 for motorcycle
    icon: <Droplets className="w-6 h-6" />,
    gradient: 'from-blue-500 to-cyan-500',
    allowedVehicles: ['motorcycle', 'sedan', 'suv', 'van', 'truck'],
  },
  {
    id: 'srv2',
    name: 'Premium Wash',
    description: 'Wash + interior cleaning',
    price: Math.round(450 * cheapestVehicle.priceMultiplier), // ₱270 for motorcycle
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-purple-500 to-pink-500',
    allowedVehicles: ['sedan', 'suv', 'van', 'truck'], // No motorcycle
  },
  {
    id: 'srv3',
    name: 'Full Detailing',
    description: 'Complete detail service',
    price: Math.round(1200 * cheapestVehicle.priceMultiplier), // ₱720 for motorcycle
    icon: <Car className="w-6 h-6" />,
    gradient: 'from-pink-500 to-rose-500',
    allowedVehicles: ['motorcycle', 'sedan', 'suv', 'van', 'truck'],
  },
  {
    id: 'srv4',
    name: 'Express Wash',
    description: 'Quick wash in 10 mins',
    price: Math.round(150 * cheapestVehicle.priceMultiplier), // ₱90 for motorcycle
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-yellow-500 to-orange-500',
    allowedVehicles: ['motorcycle', 'sedan', 'suv', 'van', 'truck'],
  },
  {
    id: 'srv5',
    name: 'Wax & Polish',
    description: 'Premium wax application',
    price: Math.round(600 * cheapestVehicle.priceMultiplier), // ₱360 for motorcycle
    icon: <Shield className="w-6 h-6" />,
    gradient: 'from-green-500 to-emerald-500',
    allowedVehicles: ['motorcycle', 'sedan', 'suv', 'van', 'truck'],
  },
  {
    id: 'srv6',
    name: 'Air Fresh',
    description: 'Interior deodorizing',
    price: Math.round(200 * cheapestVehicle.priceMultiplier), // ₱120 for motorcycle
    icon: <Wind className="w-6 h-6" />,
    gradient: 'from-cyan-500 to-blue-500',
    allowedVehicles: ['sedan', 'suv', 'van', 'truck'], // No motorcycle
  },
];

const availableStaff = ['La Mave', 'Hev Abi', 'Flow G', 'Skusta Clee'];

let lastAssignedIndex = -1;
const autoAssignStaff = () => {
  lastAssignedIndex = (lastAssignedIndex + 1) % availableStaff.length;
  return availableStaff[lastAssignedIndex];
};

export function POS() {
  const queryClient = useQueryClient();

  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(res => res.data),
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(true);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    plateNumber: '',
    vehicleType: '',
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'ewallet' | null>(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [createdTicketId, setCreatedTicketId] = useState('');
  const [completedTransaction, setCompletedTransaction] = useState<{
    id: string;
    total: number;
    cart: CartItem[];
    paymentMethod: string;
    amountReceived: string;
    changeAmount: number;
  } | null>(null);

  const getAvailableVehicles = () => {
    if (!selectedService) return vehicleTypes;
    const allowedIds = selectedService.allowedVehicles || [];
    return vehicleTypes.filter(vehicle => allowedIds.includes(vehicle.id));
  };

  const getBasePrice = (service: Service) => {
    // Return the actual starting price (cheapest vehicle)
    return service.price;
  };

  const handleServiceClick = (service: Service) => {
    if (!selectedCustomer) {
      setShowCustomerModal(true);
      return;
    }
    setSelectedService(service);
    setSelectedVehicle(null);
    setSelectedStaff(null);
    setShowVehicleModal(true);
  };

  const handleVehicleSelect = (vehicle: VehicleType) => setSelectedVehicle(vehicle);

  const handleAddToCart = () => {
    if (!selectedService || !selectedVehicle || !selectedStaff) return;
    const finalPrice = Math.round(selectedService.price / cheapestVehicle.priceMultiplier * selectedVehicle.priceMultiplier);
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === selectedService.id &&
          item.vehicleType.id === selectedVehicle.id &&
          item.assignedStaff === selectedStaff
      );
      if (existing) {
        return prev.map((item) =>
          item.id === selectedService.id &&
            item.vehicleType.id === selectedVehicle.id &&
            item.assignedStaff === selectedStaff
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          ...selectedService,
          quantity: 1,
          vehicleType: selectedVehicle,
          finalPrice,
          assignedStaff: selectedStaff,
        },
      ];
    });
    setShowVehicleModal(false);
    setSelectedService(null);
    setSelectedVehicle(null);
    setSelectedStaff(null);
  };

  const removeFromCart = (id: string, vehicleId: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.id === id && item.vehicleType.id === vehicleId))
    );
  };

  const updateQuantity = (id: string, vehicleId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id && item.vehicleType.id === vehicleId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  const tax = 0;
  const total = subtotal + tax;
  const calculatedPrice = selectedService && selectedVehicle
    ? Math.round(selectedService.price / cheapestVehicle.priceMultiplier * selectedVehicle.priceMultiplier)
    : 0;
  const changeAmount = paymentMethod === 'cash' && amountReceived
    ? Math.max(0, parseFloat(amountReceived) - total)
    : 0;

  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.phone.includes(customerSearchQuery) ||
    (customer.plateNumber?.toLowerCase() || '').includes(customerSearchQuery.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearchQuery('');
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    try {
      const id = `C${Date.now()}`;
      const res = await api.post('/customers', { id, ...newCustomer });
      setSelectedCustomer(res.data);
      setShowCustomerModal(false);
      setShowAddCustomerForm(false);
      setNewCustomer({ name: '', phone: '', plateNumber: '', vehicleType: '' });
      refetchCustomers();
    } catch (err) {
      console.error(err);
      alert('Failed to add customer');
    }
  };

  const handleChangeCustomer = () => {
    setShowCustomerModal(true);
    setShowAddCustomerForm(false);
    setCustomerSearchQuery('');
  };

  const handlePaymentMethodSelect = (method: 'cash' | 'card' | 'ewallet') => {
    setPaymentMethod(method);
    setAmountReceived('');
  };

  const handleConfirmPayment = async () => {
    if (!paymentMethod || !selectedCustomer) return;
    if (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < total)) return;

    setPaymentStatus('processing');

    const payload = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      services: cart.map(item => ({
        name: item.name,
        vehicleType: item.vehicleType.name,
        quantity: item.quantity,
        price: item.finalPrice,
        durationMin: 30,
      })),
      totalAmount: total,
      paymentMethod,
      assignedStaff: cart[0]?.assignedStaff || autoAssignStaff(),
    };

    try {
      const res = await api.post('/transactions', payload);
      const data = res.data;

      setCompletedTransaction({
        id: data.transaction.id,
        total: total,
        cart: [...cart],
        paymentMethod: paymentMethod,
        amountReceived: amountReceived,
        changeAmount: changeAmount,
      });

      setTransactionId(data.transaction.id);
      setCreatedTicketId(data.ticket.id);
      setPaymentStatus('success');
      setShowPaymentModal(false);
      setShowReceipt(true);
      setCart([]);
    } catch (err) {
      console.error(err);
      setPaymentStatus('idle');
      alert('Payment failed. Try again.');
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setShowPaymentModal(false);
    setPaymentStatus('idle');
    setPaymentMethod(null);
    setAmountReceived('');
    setTransactionId('');
    setCreatedTicketId('');
    setCompletedTransaction(null);
    setCart([]);
  };

  const handlePrintReceipt = () => {
    alert('Receipt printed!');
  };

  const handleEmailReceipt = () => {
    alert(`Receipt sent to ${selectedCustomer?.name || 'customer'}!`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Services grid */}
      <div className="flex-1 overflow-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Point of Sale</h1>
          <p className="text-white/80">Select services to add to cart</p>
        </div>

        {selectedCustomer && (
          <div className="mb-6 backdrop-blur-2xl bg-white/10 border border-white/20 rounded-[28px] shadow-xl shadow-black/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80 mb-1">Current Customer</p>
                  <p className="text-white font-semibold text-lg">{selectedCustomer.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-white/80 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedCustomer.phone}
                    </span>
                    {selectedCustomer.plateNumber && (
                      <span className="text-sm text-white/80 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {selectedCustomer.plateNumber}
                      </span>
                    )}
                    {selectedCustomer.vehicleType && (
                      <span className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400">
                        {selectedCustomer.vehicleType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleChangeCustomer}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Change</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceClick(service)}
              className="relative overflow-hidden backdrop-blur-2xl bg-white/10 hover:bg-white/15 border border-white/20 rounded-[28px] p-6 shadow-xl shadow-black/10 transition-all duration-300 cursor-pointer group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              />
              <div className="relative mb-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white mb-4`}
                >
                  {service.icon}
                </div>
              </div>
              <div className="relative">
                <h3 className="text-lg font-semibold text-white mb-1">{service.name}</h3>
                <p className="text-sm text-white/80 mb-4">{service.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white/80">Starting at</span>
                    <span className="text-2xl font-bold text-white ml-2">₱{getBasePrice(service)}</span>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white`}
                  >
                    <Plus className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart panel */}
      <div className="w-96 border-l border-white/20 backdrop-blur-2xl bg-white/10 flex flex-col shadow-2xl shadow-black/10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Cart</h2>
              <p className="text-sm text-white/80">{cart.length} items</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-white/80" />
              </div>
              <p className="text-white/80">Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.id}-${item.vehicleType.id}`}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium mb-1">{item.name}</h4>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded bg-gradient-to-br ${item.vehicleType.gradient} flex items-center justify-center`}
                      >
                        <div className="text-white scale-50">{item.vehicleType.icon}</div>
                      </div>
                      <span className="text-xs text-white/80">{item.vehicleType.name}</span>
                    </div>
                    {item.assignedStaff && (
                      <div className="flex items-center gap-1 mt-1">
                        <User className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-400">{item.assignedStaff}</span>
                      </div>
                    )}
                    <p className="text-sm text-white/80 mt-1">₱{item.finalPrice} each</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id, item.vehicleType.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.vehicleType.id, -1)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.vehicleType.id, 1)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-lg font-bold text-white">
                    ₱{(item.finalPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-white/10">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-white/80">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between text-white text-xl font-bold">
                <span>Total</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Complete Payment</span>
            </button>
          </div>
        )}
      </div>

      {/* Customer Selection Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => selectedCustomer && setShowCustomerModal(false)}
          >
            <div
              className="w-full max-w-2xl backdrop-blur-xl bg-slate-800/70 border border-white/20 rounded-3xl p-8 max-h-[90vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >

              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <User className="w-7 h-7 text-white" />
                  </div>

                  <div>
                    <h3 className="text-3xl font-bold text-white mb-1">
                      Customer Selection
                    </h3>

                    <p className="text-white/60">
                      Search or add a new customer
                    </p>
                  </div>

                </div>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />

                <input
                  type="text"
                  placeholder="Search by name, phone, or plate number..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="
      w-full
      pl-12
      pr-4
      py-4
      bg-white/10
      hover:bg-white/15
      border
      border-white/20
      rounded-2xl
      text-white
      placeholder-white/40
      backdrop-blur-xl
      focus:outline-none
      focus:bg-white/15
      transition-all
    "
                />
              </div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-white">
                  {customerSearchQuery ? 'Search Results' : 'Recent Customers'}
                </h4>

                <span className="text-sm text-white/40">
                  {filteredCustomers.length} found
                </span>
              </div>

              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 mb-6 custom-scrollbar
">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="
    group
    relative
    overflow-hidden
    backdrop-blur-2xl
    bg-white/10
    hover:bg-white/15
    border
    border-white/20
    rounded-[24px]
    p-4
    cursor-pointer
    shadow-xl
    shadow-black/10
    transition-all
    duration-300
    hover:scale-[1.02]
    hover:-translate-y-1
  "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition-all duration-500" />

                    <div className="relative flex items-center gap-4">

                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <User className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1">
                        <p className="text-white font-semibold text-lg">
                          {customer.name}
                        </p>

                        <div className="flex items-center gap-3 text-sm text-white/50 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </span>

                          {customer.plateNumber && (
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {customer.plateNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {customer.vehicleType && (
                        <div className="
        px-3
        py-1.5
        rounded-xl
        bg-cyan-500/10
        border
        border-cyan-400/20
        text-cyan-300
        text-xs
        font-medium
      ">
                          {customer.vehicleType}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredCustomers.length === 0 && customerSearchQuery && (
                  <div className="text-center text-white/80 py-4">No customers found</div>
                )}
              </div>
              <button
                onClick={() => setShowAddCustomerForm(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold"
              >
                Add New Customer
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Customer Form Modal */}
      <AnimatePresence>
        {showAddCustomerForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl shadow-black/10 rounded-3xl p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Add New Customer</h3>
                <button
                  onClick={() => setShowAddCustomerForm(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 shadow-xl shadow-black/10 rounded-xl text-white placeholder-white/80 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 shadow-xl shadow-black/10 rounded-xl text-white placeholder-white/80 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
                <input
                  type="text"
                  placeholder="Plate Number (Optional)"
                  value={newCustomer.plateNumber}
                  onChange={e => setNewCustomer({ ...newCustomer, plateNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 shadow-xl shadow-black/10 rounded-xl text-white placeholder-white/80 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Vehicle Type</label>
                  <select
                    value={newCustomer.vehicleType}
                    onChange={e => setNewCustomer({ ...newCustomer, vehicleType: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 shadow-xl shadow-black/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all cursor-pointer"
                  >
                    <option value="" className="bg-slate-800/70 text-gray-300">Select Vehicle Type</option>
                    <option value="Motorcycle" className="bg-slate-800/70 text-white">Motorcycle</option>
                    <option value="Sedan" className="bg-slate-800/70 text-white">Sedan</option>
                    <option value="SUV" className="bg-slate-800/70 text-white">SUV</option>
                    <option value="Van" className="bg-slate-800/70 text-white">Van</option>
                    <option value="Truck" className="bg-slate-800/70 text-white">Truck</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddCustomerForm(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewCustomer}
                  disabled={!newCustomer.name || !newCustomer.phone}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                >
                  Save Customer
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Vehicle Selection Modal */}
      <AnimatePresence>
        {showVehicleModal && selectedService && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowVehicleModal(false);
              setSelectedService(null);
              setSelectedVehicle(null);
              setSelectedStaff(null);
            }}
          >
            <div
              className="w-full max-w-2xl max-h-[90vh] backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl shadow-black/10 rounded-3xl shadow-2xl overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedService.gradient} flex items-center justify-center text-white`}>
                      {selectedService.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {selectedService.name}
                      </h3>
                      <p className="text-gray-400">{selectedService.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowVehicleModal(false);
                      setSelectedService(null);
                      setSelectedVehicle(null);
                      setSelectedStaff(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-blue-400 text-sm">
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Select vehicle type and assign staff to add to cart
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Choose Vehicle Type</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getAvailableVehicles().map((vehicle) => (
                      <div
                        key={vehicle.id}
                        onClick={() => handleVehicleSelect(vehicle)}
                        className={`relative cursor-pointer backdrop-blur-xl border rounded-2xl p-6 transition-all ${selectedVehicle?.id === vehicle.id
                          ? `border-blue-500/50 bg-blue-500/10`
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                      >
                        {selectedVehicle?.id === vehicle.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="relative flex flex-col items-center text-center">
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${vehicle.gradient} flex items-center justify-center text-white mb-3`}>
                            {vehicle.icon}
                          </div>
                          <h5 className="text-white font-semibold mb-1">{vehicle.name}</h5>
                          <p className="text-sm text-gray-400">
                            {vehicle.priceMultiplier === 1.0
                              ? 'Base price'
                              : `${Math.round((vehicle.priceMultiplier - 1) * 100)}${vehicle.priceMultiplier > 1 ? '+' : '-'}%`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff Selection */}
                {selectedVehicle && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Assign Staff</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableStaff.map((staff) => (
                        <button
                          key={staff}
                          onClick={() => setSelectedStaff(staff)}
                          className={`relative cursor-pointer backdrop-blur-xl bg-white/5 border rounded-xl p-4 transition-all ${selectedStaff === staff
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-white/10 hover:border-white/20'
                            }`}
                        >
                          {selectedStaff === staff && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="relative flex flex-col items-center text-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${selectedStaff === staff
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                              }`}>
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <span className={`text-sm font-medium ${selectedStaff === staff ? 'text-white' : 'text-gray-400'
                              }`}>
                              {staff}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Final Price</p>
                      <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        ₱{selectedVehicle ? calculatedPrice : getBasePrice(selectedService)}
                      </div>
                    </div>
                    {selectedVehicle && (
                      <div className="flex flex-col items-end">
                        <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${selectedVehicle.gradient} bg-opacity-10 border border-white/10 mb-2`}>
                          <span className="text-xs text-white font-medium">
                            {selectedVehicle.name}
                          </span>
                        </div>
                        {selectedVehicle.priceMultiplier !== 1.0 && (
                          <span className="text-xs text-gray-500">
                            Base: ₱{getBasePrice(selectedService)} × {selectedVehicle.priceMultiplier}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowVehicleModal(false);
                      setSelectedService(null);
                      setSelectedVehicle(null);
                      setSelectedStaff(null);
                    }}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedVehicle || !selectedStaff}
                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${(selectedVehicle && selectedStaff)
                      ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed'
                      }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

{/* Payment Modal */}
<AnimatePresence>
  {showPaymentModal && (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={() => setShowPaymentModal(false)}
    >
      <div
        className="w-full max-w-xl backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl shadow-black/10 rounded-[28px] p-6"
        onClick={e => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <CreditCard className="w-6 h-6 text-white" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white">
                Payment
              </h3>

              <p className="text-white/50 mt-1 text-sm">
                Select payment method and amount
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPaymentModal(false)}
            className="text-white/50 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PAYMENT METHODS */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Payment Method
          </h4>

          <div className="grid grid-cols-3 gap-3">

            {(['cash', 'card', 'ewallet'] as const).map((method) => (
              <div
                key={method}
                onClick={() => handlePaymentMethodSelect(method)}
className={`cursor-pointer rounded-2xl p-4 text-center border transition-all duration-300 backdrop-blur-xl ${paymentMethod === method ? 'border-cyan-400/50 bg-white/10 scale-[1.02]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >

<div
  className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${
    method === 'cash'
      ? 'bg-gradient-to-br from-green-500 to-emerald-500'
      : method === 'card'
      ? 'bg-gradient-to-br from-blue-500 to-purple-500'
      : 'bg-gradient-to-br from-pink-500 to-rose-500'
  }`}
>

                  {method === 'cash' && (
                    <Banknote className="w-6 h-6 text-white" />
                  )}

                  {method === 'card' && (
                    <CreditCard className="w-6 h-6 text-white" />
                  )}

                  {method === 'ewallet' && (
                    <Wallet className="w-6 h-6 text-white" />
                  )}
                </div>

                <div>
                  <p className="text-white font-semibold text-base capitalize">
                    {method}
                  </p>

                  <p className="text-white/40 text-xs mt-1">
                    {method === 'cash' && 'Pay with cash'}
                    {method === 'card' && 'Debit/Credit'}
                    {method === 'ewallet' && 'GCash / Maya'}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">

          <h4 className="text-xl font-bold text-white mb-4">
            Order Summary
          </h4>

          <div className="space-y-2 mb-4">

            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium text-sm">
                    {item.name}

                    <span className="text-white/40 ml-2">
                      ({item.vehicleType.name})
                    </span>
                  </p>

                  <p className="text-xs text-white/40">
                    x{item.quantity}
                  </p>
                </div>

                <p className="text-white font-semibold text-sm">
                  ₱{(item.finalPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}

          </div>

          <div className="border-t border-white/10 pt-4 space-y-2">

            <div className="flex justify-between text-white/50 text-sm">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-white/50 text-sm">
              <span>Tax</span>
              <span>₱0.00</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xl font-bold text-white">
                Total
              </span>

              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                ₱{total.toFixed(2)}
              </span>
            </div>

          </div>
        </div>

        {/* CASH INPUT */}
        {paymentMethod === 'cash' && (
          <div className="space-y-4 mb-6">

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Amount Received
              </label>

              <input
                type="number"
                step="0.01"
                placeholder="Enter amount received"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="
                  w-full
                  px-4
                  py-3
                  bg-white/5
                  border
                  border-white/10
                  rounded-2xl
                  text-white
                  placeholder-white/30
                  focus:outline-none
                  focus:border-cyan-400/50
                  transition-all
                "
              />
            </div>

            {amountReceived && parseFloat(amountReceived) > 0 && (
              <div
                className={`p-4 rounded-2xl transition-all ${
                  parseFloat(amountReceived) >= total
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >

                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">
                    Change:
                  </span>

                  <span
                    className={`text-2xl font-bold ${
                      parseFloat(amountReceived) >= total
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    ₱{changeAmount.toFixed(2)}
                  </span>
                </div>

                {parseFloat(amountReceived) < total && (
                  <p className="text-red-400 text-xs mt-2">
                    Need ₱
                    {(total - parseFloat(amountReceived)).toFixed(2)} more
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* NON CASH INFO */}
        {paymentMethod && paymentMethod !== 'cash' && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-400" />

              <div>
                <p className="text-white font-medium text-sm">
                  Payment via {paymentMethod === 'card'
                    ? 'Credit/Debit Card'
                    : 'E-Wallet'}
                </p>

                <p className="text-xs text-white/50">
                  Amount to charge: ₱{total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">

          <button
            onClick={() => setShowPaymentModal(false)}
            className="
              flex-1
              py-3
              rounded-2xl
              bg-white/5
              border
              border-white/10
              text-white/70
              hover:bg-white/10
              transition-all
              font-semibold
            "
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmPayment}
            disabled={
              !paymentMethod ||
              (paymentMethod === 'cash' &&
                (!amountReceived ||
                  parseFloat(amountReceived) < total))
            }
className={`flex-1 py-3 rounded-2xl text-white font-semibold transition-all flex items-center justify-center gap-2 ${
  paymentMethod &&
  (paymentMethod !== 'cash' ||
    (amountReceived &&
      parseFloat(amountReceived) >= total))
    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:shadow-lg hover:shadow-cyan-500/40'
    : 'bg-white/5 text-white/30 cursor-not-allowed'
}`}
          >

            {paymentStatus === 'processing' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirm Payment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )}
</AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && completedTransaction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl shadow-black/10 rounded-3xl p-8">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Payment Successful!</h3>
                <p className="text-gray-400 text-sm mt-1">Transaction #{completedTransaction.id}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-4 max-h-60 overflow-auto">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Order Summary</h4>
                {completedTransaction.cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">{item.name} x{item.quantity}</span>
                    <span className="text-white">₱{(item.finalPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 mt-2 pt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-300">Total Paid</span>
                    <span className="text-xl font-bold text-green-400">₱{completedTransaction.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
              <button
                onClick={handleCloseReceipt}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-all"
              >
                Complete & New Transaction
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}