import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, ShoppingCart, AlertCircle, Users, Droplets, Sparkles } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
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

function StatCard({ title, value, change, icon, gradient, delay }: any) {
  const [count, setCount] = useState(0);
  const targetValue = parseFloat(value?.toString().replace(/[^0-9.]/g, '') || '0');

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = targetValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setCount(targetValue);
        clearInterval(timer);
      } else setCount(current);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [targetValue]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }} whileHover={{ scale: 1.02, y: -4 }} className="relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 group cursor-pointer">
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${gradient} bg-opacity-10 border border-white/10`}>{icon}</div>
        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(Math.round(change))}%</span>
        </div>
      </div>
      <div><p className="text-gray-400 text-sm mb-1">{title}</p><p className="text-3xl font-bold text-white">{title.includes('Revenue') ? '₱' : ''}{Math.floor(count).toLocaleString()}</p></div>
    </motion.div>
  );
}

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

export function Dashboard() {
  const [stats, setStats] = useState({ revenueToday: 0, totalBookings: 0, activeServices: 0, completedToday: 0, revenueChange: 0, bookingsChange: 0 });
  const [revenueData, setRevenueData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, revenueRes, serviceDistRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/revenue?days=7'),
          api.get('/analytics/service-distribution')
        ]);
        setStats(dashboardRes.data);
        const revData = revenueRes.data.map((d: any) => ({ name: d.date, value: d.revenue }));
        setRevenueData(revData);
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];
        const svcData = serviceDistRes.data.slice(0, 6).map((s: any, i: number) => ({ name: s.serviceName, value: s.count, color: colors[i % colors.length] }));
        setServiceData(svcData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-white">Loading dashboard...</div>;
  
  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1><p className="text-gray-400">Welcome back! Here's your overview</p></div>

      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Today's Revenue" value={`₱${Math.round(stats.revenueToday).toLocaleString()}`} change={stats.revenueChange} icon={<PesoSign className="w-6 h-6 text-blue-400" />} gradient="bg-gradient-to-br from-blue-500 to-blue-600" delay={0} />
        <StatCard title="Total Bookings" value={`${stats.totalBookings}`} change={stats.bookingsChange} icon={<ShoppingCart className="w-6 h-6 text-purple-400" />} gradient="bg-gradient-to-br from-purple-500 to-purple-600" delay={0.1} />
        <StatCard title="Active Services" value={`${stats.activeServices}`} change={0} icon={<Droplets className="w-6 h-6 text-pink-400" />} gradient="bg-gradient-to-br from-pink-500 to-pink-600" delay={0.2} />
        <StatCard title="Completed Today" value={`${stats.completedToday}`} change={stats.bookingsChange} icon={<Users className="w-6 h-6 text-cyan-400" />} gradient="bg-gradient-to-br from-cyan-500 to-cyan-600" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart with Gradient */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6"><div><h3 className="text-lg font-semibold text-white mb-1">Weekly Revenue</h3><p className="text-sm text-gray-400">Last 7 days performance</p></div></div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip currency={true}  />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="url(#lineGradient)" 
                strokeWidth={3} 
                dot={{ fill: '#8b5cf6', r: 4, stroke: '#3b82f6', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }}
                fill="url(#areaGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Service Distribution Chart with Gradient */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6"><div><h3 className="text-lg font-semibold text-white mb-1">Service Distribution</h3><p className="text-sm text-gray-400">By service type</p></div></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={serviceData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip currency={false} />} />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Service Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <defs>
                {serviceData.map((entry: any, index: number) => (
                  <linearGradient key={`grad-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <Pie 
                data={serviceData} 
                cx="50%" 
                cy="50%" 
                innerRadius={50} 
                outerRadius={80} 
                paddingAngle={5} 
                dataKey="value"
              >
                {serviceData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={`url(#pieGradient${index})`} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={false} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {serviceData.map((item: any, idx: number) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="lg:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold text-white">Recent Activity</h3><AlertCircle className="w-5 h-5 text-gray-400" /></div>
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-4 rounded-xl border bg-blue-500/5 border-blue-500/20">
              <div className="w-2 h-2 rounded-full mt-2 bg-blue-400" />
              <div><p className="text-white text-sm">System ready – no recent alerts</p><p className="text-gray-500 text-xs mt-1">All systems operating normally</p></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}