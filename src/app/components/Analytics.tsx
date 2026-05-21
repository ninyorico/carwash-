import { motion } from 'motion/react';
import { useState } from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

// Custom Peso Sign Icon
const PesoSign = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <text x="12" y="18" textAnchor="middle" fontSize="18" fill="currentColor" stroke="none" fontWeight="bold">₱</text>
  </svg>
);

// Custom Tooltip for better visibility
const CustomTooltip = ({ active, payload, label, currency = false }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="text-gray-800 text-sm">
            <span style={{ color: p.color }} className="font-medium">
              {p.name}:
            </span>{' '}
            <span className="font-semibold">
              {currency ? `₱${p.value?.toLocaleString()}` : p.value?.toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function Analytics() {
  const [dateRange, setDateRange] = useState('30');

  const { data: revenueData = [], isLoading: revenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['analytics', 'revenue', dateRange],
    queryFn: () => api.get(`/analytics/revenue?days=${dateRange}`).then(res => res.data)
  });

  const { data: serviceDist = [], isLoading: distLoading, refetch: refetchServiceDist } = useQuery({
    queryKey: ['analytics', 'service-distribution', dateRange],
    queryFn: () => api.get(`/analytics/service-distribution?days=${dateRange}`).then(res => res.data)
  });

  const { data: paymentMethodsRaw = [], isLoading: paymentLoading, refetch: refetchPayment } = useQuery({
    queryKey: ['analytics', 'payment-methods', dateRange],
    queryFn: () => api.get(`/analytics/payment-methods?days=${dateRange}`).then(res => res.data)
  });

  const { data: topServices = [], isLoading: topLoading, refetch: refetchTop } = useQuery({
    queryKey: ['analytics', 'top-services', dateRange],
    queryFn: () => api.get(`/analytics/top-services?days=${dateRange}`).then(res => res.data)
  });

  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['analytics', 'dashboard', dateRange],
    queryFn: () => api.get(`/analytics/dashboard?days=${dateRange}`).then(res => res.data)
  });

  const handleDateRangeChange = (days: string) => {
    setDateRange(days);
    setTimeout(() => {
      refetchRevenue();
      refetchServiceDist();
      refetchPayment();
      refetchTop();
      refetchStats();
    }, 100);
  };

  const paymentMethodsMap = new Map();
  paymentMethodsRaw.forEach((item: any) => {
    const name = item.name;
    if (paymentMethodsMap.has(name)) {
      const existing = paymentMethodsMap.get(name);
      existing.value += item.value;
      existing.revenue += item.revenue;
      existing.count += item.count;
    } else {
      paymentMethodsMap.set(name, { ...item });
    }
  });
  
  const paymentMethods = Array.from(paymentMethodsMap.values()).map((m: any, i: number) => ({
    name: m.name,
    value: m.value || 0,
    color: ['#10b981', '#3b82f6', '#8b5cf6'][i % 3],
    revenue: m.revenue || 0
  }));

  if (revenueLoading || distLoading || paymentLoading || topLoading || statsLoading) {
    return <div className="p-8 text-white">Loading analytics...</div>;
  }

  const revenueChartData = revenueData.map((item: any) => ({
    date: item.date,
    revenue: item.revenue,
    profit: Math.round(item.revenue * 0.6),
    expenses: Math.round(item.revenue * 0.4)
  }));

  const totalRevenue = dashboardStats?.totalRevenue || 0;
  const totalBookings = dashboardStats?.totalBookings || 0;
  const activeServices = dashboardStats?.activeServices || 0;
  const completedToday = dashboardStats?.completedToday || 0;

  const dailyStats = [
    { id: 1, label: "Total Revenue", value: `₱${totalRevenue.toLocaleString()}`, trend: 'up', percentage: dashboardStats?.revenueChange?.toFixed(1) + '%' || '0%', icon: PesoSign, gradient: 'from-green-500 to-emerald-500' },
    { id: 2, label: "Total Bookings", value: totalBookings.toString(), trend: 'up', percentage: dashboardStats?.bookingsChange?.toFixed(1) + '%' || '0%', icon: ShoppingCart, gradient: 'from-blue-500 to-cyan-500' },
    { id: 3, label: "Active Services", value: activeServices.toString(), trend: 'neutral', percentage: '0%', icon: Clock, gradient: 'from-purple-500 to-pink-500' },
    { id: 4, label: "Completed Today", value: completedToday.toString(), trend: 'up', percentage: dashboardStats?.bookingsChange?.toFixed(1) + '%' || '0%', icon: CheckCircle, gradient: 'from-cyan-500 to-blue-500' },
  ];

  const getDateRangeLabel = (days: string) => {
    switch(days) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case '90': return 'Last 90 days';
      case '365': return 'Last year';
      default: return 'Last 30 days';
    }
  };

  if (revenueData.length === 0 && serviceDist.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-white text-xl mb-4">No transaction data yet</div>
        <p className="text-gray-400">Complete some transactions in POS to see analytics</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Real business insights from transaction data</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none pr-10"
              style={{ backgroundColor: '#1e293b' }}
            >
              <option value="7" className="bg-slate-800 text-white">Last 7 days</option>
              <option value="30" className="bg-slate-800 text-white">Last 30 days</option>
              <option value="90" className="bg-slate-800 text-white">Last 90 days</option>
              <option value="365" className="bg-slate-800 text-white">Last year</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /><span>Generate Report</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {dailyStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.03, y: -4 }} className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="relative flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-green-400" /><span className="text-sm font-medium text-green-400">{stat.percentage}</span></div>
              </div>
              <p className="relative text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="relative text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Trend Chart with Gradient */}
      {revenueChartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Revenue Trend</h3>
              <p className="text-sm text-gray-400">{getDateRangeLabel(dateRange)} performance from actual transactions</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-sm text-gray-400">Revenue</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="revenueLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                fontSize={12} 
                angle={-45} 
                textAnchor="end" 
                height={70}
                interval={dateRange === '7' ? 0 : Math.floor(revenueChartData.length / 10)}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip currency={true} />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="url(#revenueLineGrad)" 
                strokeWidth={2} 
                fill="url(#revenueGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Distribution Bar Chart with Gradient */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-1">Service Distribution</h3>
            <p className="text-sm text-gray-400">Breakdown by service type for {getDateRangeLabel(dateRange)}</p>
          </div>
          {serviceDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={serviceDist}>
                <defs>
                  <linearGradient id="serviceBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="serviceName" stroke="#9ca3af" fontSize={11} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip content={<CustomTooltip currency={false} />} />
                <Bar dataKey="count" fill="url(#serviceBarGrad)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (<div className="text-center text-gray-400 py-12">No service data available for this period</div>)}
        </motion.div>

        {/* Payment Methods Pie Chart with Gradients */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-1">Payment Methods</h3>
            <p className="text-sm text-gray-400">Distribution by payment type for {getDateRangeLabel(dateRange)}</p>
          </div>
          {paymentMethods.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <defs>
                    {paymentMethods.map((entry: any, index: number) => (
                      <linearGradient key={`grad-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie 
                    data={paymentMethods} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={70} 
                    paddingAngle={5} 
                    dataKey="value" 
                    labelKey="name" 
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentMethods.map((entry: any, index: number) => (
                      <Cell key={`${entry.name}-${index}`} fill={`url(#pieGradient${index})`} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip currency={false} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {paymentMethods.map((item: any, idx: number) => (
                  <div key={`${item.name}-${idx}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-white">₱{item.revenue?.toLocaleString() || 0}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (<div className="text-center text-gray-400 py-12">No payment data available for this period</div>)}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Services */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-1">Top Services</h3>
            <p className="text-sm text-gray-400">Most popular by revenue for {getDateRangeLabel(dateRange)}</p>
          </div>
          <div className="space-y-4">
            {topServices.slice(0, 5).map((service: any, index: number) => (
              <div key={`${service.serviceName}-${index}`} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-bold">{index + 1}</div>
                  <div>
                    <p className="text-white font-medium text-sm">{service.serviceName}</p>
                    <p className="text-xs text-gray-500">{service.bookings} bookings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold text-sm">₱{service.revenue?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Service Revenue Bar Chart with Gradient */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="lg:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-1">Service Revenue</h3>
            <p className="text-sm text-gray-400">Revenue by service type for {getDateRangeLabel(dateRange)}</p>
          </div>
          {topServices.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topServices} layout="vertical">
                <defs>
                  <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                <YAxis type="category" dataKey="serviceName" stroke="#9ca3af" fontSize={11} width={100} />
                <Tooltip content={<CustomTooltip currency={true} />} />
                <Bar dataKey="revenue" fill="url(#revenueBarGrad)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (<div className="text-center text-gray-400 py-12">No revenue data available for this period</div>)}
        </motion.div>
      </div>
    </div>
  );
}