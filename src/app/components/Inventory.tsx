  import { useState, useEffect } from 'react';
  import { motion, AnimatePresence } from 'motion/react';
  import {
    Package,
    AlertCircle,
    CheckCircle,
    Plus,
    Search,
    TrendingDown,
    Sparkles,
    X,
    Edit2,
    RefreshCw,
  } from 'lucide-react';
  import { api } from '../../lib/api';

  interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    minStock: number;
    unit: string;
    price: number;
    supplier: string;
    lastRestocked: string;
    status: 'good' | 'low' | 'out';
  }

  export function Inventory() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);

const [selectedItem, setSelectedItem] =
  useState<InventoryItem | null>(null);

const [restockQuantity, setRestockQuantity] =
  useState(0);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [newItem, setNewItem] = useState({
      name: '',
      category: '',
      quantity: 0,
      minStock: 0,
      unit: '',
      price: 0,
      supplier: '',
    });

    // Fetch inventory from API
    useEffect(() => {
      fetchInventory();
    }, []);

    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await api.get('/inventory');
        setInventory(response.data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleAddItem = async () => {
      if (!newItem.name || !newItem.category || newItem.quantity <= 0) {
        alert('Please fill in all required fields');
        return;
      }

      const id = `INV${Date.now()}`;
      const payload = {
        id,
        ...newItem,
        lastRestocked: new Date().toISOString(),
      };

      try {
        await api.post('/inventory', payload);
        await fetchInventory();
        setShowAddModal(false);
        setNewItem({
          name: '',
          category: '',
          quantity: 0,
          minStock: 0,
          unit: '',
          price: 0,
          supplier: '',
        });
      } catch (error) {
        console.error('Error adding item:', error);
        alert('Failed to add item');
      }
    };

const handleRestock = (item: InventoryItem) => {
  setSelectedItem(item);
  setRestockQuantity(0);
  setShowRestockModal(true);
};

const confirmRestock = async () => {
  if (!selectedItem || restockQuantity <= 0) return;

  try {
    await api.post(
      `/inventory/${selectedItem.id}/restock`,
      {
        quantity: Number(restockQuantity),
      }
    );

    await fetchInventory();

    setShowRestockModal(false);
    setSelectedItem(null);
    setRestockQuantity(0);
  } catch (error) {
    console.error('RESTOCK ERROR:', error);

    alert('Failed to restock item');
  }
};

    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'good':
          return {
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/30',
            label: 'In Stock',
            icon: CheckCircle,
          };
        case 'low':
          return {
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30',
            label: 'Low Stock',
            icon: AlertCircle,
          };
        case 'out':
          return {
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            label: 'Out of Stock',
            icon: AlertCircle,
          };
        default:
          return {
            color: 'text-gray-400',
            bg: 'bg-gray-500/10',
            border: 'border-gray-500/30',
            label: 'Unknown',
            icon: AlertCircle,
          };
      }
    };

const filteredInventory = inventory.filter((item) => {
  const matchesSearch =
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesLowStock = showLowStockOnly
    ? item.status === 'low' || item.status === 'out'
    : true;

  return matchesSearch && matchesLowStock;
});

    const stats = {
      total: inventory.length,
      lowStock: inventory.filter((item) => item.status === 'low').length,
      outOfStock: inventory.filter((item) => item.status === 'out').length,
      totalValue: inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    };

    if (loading) {
      return <div className="p-8 text-white">Loading inventory...</div>;
    }

    return (
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Inventory Management</h1>
            <p className="text-white/80">Track supplies, stock levels, and reorder points</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchInventory}
              className="px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl shadow-lg shadow-black/5 text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Item</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-2xl bg-white/10 hover:bg-white/15 border border-white/20 rounded-[28px] shadow-xl shadow-black/10 transition-all duration-300 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Total Items</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-2xl bg-white/10 hover:bg-white/15 border border-white/20 rounded-[28px] shadow-xl shadow-black/10 transition-all duration-300 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Low Stock</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.lowStock}</p>
              </div>
              <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
                <TrendingDown className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-2xl bg-white/10 hover:bg-white/15 border border-white/20 rounded-[28px] shadow-xl shadow-black/10 transition-all duration-300 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Out of Stock</p>
                <p className="text-3xl font-bold text-red-400">{stats.outOfStock}</p>
              </div>
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="backdrop-blur-2xl bg-white/10 hover:bg-white/15 border border-white/20 rounded-[28px] shadow-xl shadow-black/10 transition-all duration-300 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Inventory Value</p>
                <p className="text-3xl font-bold text-green-400">₱{stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/30">
                <Package className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Low Stock Alert Banner */}
        {stats.lowStock > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-500/10 border border-yellow-400/20 backdrop-blur-xl rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-semibold">Low Stock Alert</p>
                <p className="text-sm text-white/80">{stats.lowStock} item(s) are running low. Please reorder soon.</p>
              </div>
            </div>
<button
  onClick={() => setShowLowStockOnly(!showLowStockOnly)}
  className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm hover:bg-yellow-500/30 transition-all"
>
  {showLowStockOnly ? 'Show All Items' : 'View All'}
</button>
          </motion.div>
        )}

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search by name, category, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 hover:bg-white/15 border border-white/20 rounded-2xl text-white placeholder-white/40 backdrop-blur-xl focus:outline-none focus:bg-white/15 transition-all"
            />
          </div>
        </motion.div>

        {/* Inventory grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInventory.map((item, index) => {
            const statusConfig = getStatusConfig(item.status);
            const StatusIcon = statusConfig.icon;
            const stockPercentage = (item.quantity / item.minStock) * 100;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative backdrop-blur-2xl bg-white/10 hover:bg-white/15 border border-white/20 rounded-[28px] shadow-xl shadow-black/10 transition-all duration-300 p-6 group overflow-hidden"
              >
                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  <div className={`px-3 py-1 rounded-lg ${statusConfig.bg} border ${statusConfig.border} flex items-center gap-1`}>
                    <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                    <span className={`text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center text-white">
                    <Package className="w-6 h-6" />
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
                  <p className="text-sm text-white/60 mb-3">{item.category}</p>
                  
                  {/* Stock level */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current Stock</span>
                      <span className={statusConfig.color}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        transition={{ duration: 1, delay: index * 0.05 + 0.5 }}
                        className={`h-full rounded-full ${
                          item.status === 'good'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : item.status === 'low'
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-r from-red-500 to-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Reorder Point:</span>
                    <span className="text-white/60">{item.minStock} {item.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Unit Price:</span>
                    <span className="text-white/60">₱{item.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Supplier:</span>
                    <span className="text-white/60">{item.supplier}</span>
                  </div>
                </div>

                {/* Last restocked */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <p className="text-xs text-white/60">
                    Last restocked: <span className="text-gray-400">{new Date(item.lastRestocked).toLocaleDateString()}</span>
                  </p>
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();

    console.log('RESTOCK CLICK');

    handleRestock(item);
  }}
  className="relative z-50 px-3 py-1 bg-cyan-500/10 border border-cyan-400/30 rounded-xl text-cyan-300 hover:bg-cyan-500/20 text-xs transition-all cursor-pointer"
>
  Restock
</button>
                </div>

                {/* Hover glow */}
                <motion.div
                  className="absolute -bottom-2 -right-2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No inventory items found</p>
            <p className="text-gray-500 text-sm mt-2">Click "Add Item" to start tracking your supplies</p>
          </div>
        )}

        {/* Add item modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg backdrop-blur-xl bg-slate-800/70 border border-white/20 rounded-3xl p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Add New Item</h3>
                    <p className="text-sm text-gray-400 mt-1">Enter inventory item details</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Item Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Foam Soap, Microfiber Towels"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Category *</label>
                    <input
                      type="text"
                      placeholder="e.g., Cleaning Supplies, Tools, Chemicals"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Quantity *</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Unit *</label>
                      <input
                        type="text"
                        placeholder="e.g., liters, pieces, kg"
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Reorder Point (Min Stock) *</label>
                    <input
                      type="number"
                      placeholder="Minimum stock level before reorder"
                      value={newItem.minStock}
                      onChange={(e) => setNewItem({ ...newItem, minStock: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Price per Unit *</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Supplier *</label>
                      <input
                        type="text"
                        placeholder="Supplier name"
                        value={newItem.supplier}
                        onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-white/10 border border-white/10 rounded-2xl text-white font-semibold hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    disabled={!newItem.name || !newItem.category || newItem.quantity <= 0}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
  {showRestockModal && selectedItem && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={() => setShowRestockModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md backdrop-blur-xl bg-slate-800/70 border border-white/20 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">
              Restock Item
            </h3>

            <p className="text-sm text-gray-400 mt-1">
              {selectedItem.name}
            </p>
          </div>

          <button
            onClick={() => setShowRestockModal(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Quantity to Add
            </label>

            <input
              type="number"
              value={restockQuantity}
              onChange={(e) =>
                setRestockQuantity(Number(e.target.value))
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              placeholder="Enter quantity"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => setShowRestockModal(false)}
            className="flex-1 py-3 bg-white/10 border border-white/10 rounded-2xl text-white font-semibold hover:bg-white/20 transition-all"
          >
            Cancel
          </button>

          <button
            onClick={confirmRestock}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
          >
            Confirm Restock
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
      </div>
    );
  }