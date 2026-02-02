import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Users, IndianRupee, AlertCircle, TrendingUp, ArrowUpRight, Clock, MessageSquare, Sparkles, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/ui/status-badge';
import { IntelligenceCue } from '../components/ui/intelligence-cue';
import { SkeletonDashboard, SkeletonMetric, SkeletonBookingTable } from '../components/ui/skeletons';
import { dashboardAPI, seedAPI } from '../lib/api';
import { formatCurrency, formatDate, getStatusColor, getPaymentStatusColor } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [eventData, setEventData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsRes, revenueRes, eventRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getRevenueChart(),
                dashboardAPI.getEventDistribution()
            ]);
            setStats(statsRes.data);
            setRevenueData(revenueRes.data);
            setEventData(eventRes.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedData = async () => {
        try {
            const res = await seedAPI.seed();
            toast.success(res.data.message);
            loadDashboardData();
        } catch (error) {
            toast.info('Data already seeded');
        }
    };

    const statCards = [
        { 
            title: 'Total Bookings', 
            value: stats?.total_bookings || 0, 
            icon: CalendarDays, 
            gradient: 'from-violet-500 to-purple-600',
            bgGradient: 'from-violet-50 to-purple-50',
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-600',
            trend: '+12%'
        },
        { 
            title: 'Upcoming Events', 
            value: stats?.upcoming_events || 0, 
            icon: Clock, 
            gradient: 'from-emerald-500 to-teal-600',
            bgGradient: 'from-emerald-50 to-teal-50',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            trend: '+8%'
        },
        { 
            title: 'Monthly Revenue', 
            value: formatCurrency(stats?.monthly_revenue || 0), 
            icon: IndianRupee, 
            gradient: 'from-amber-500 to-orange-600',
            bgGradient: 'from-amber-50 to-orange-50',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            trend: '+24%'
        },
        { 
            title: 'Pending Payments', 
            value: stats?.pending_payments || 0, 
            icon: AlertCircle, 
            gradient: 'from-pink-500 to-rose-600',
            bgGradient: 'from-pink-50 to-rose-50',
            iconBg: 'bg-pink-100',
            iconColor: 'text-pink-600',
            trend: '-5%'
        },
    ];

    const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#6366f1'];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    // Generate intelligence cues based on data
    const intelligenceCues = React.useMemo(() => {
        const cues = [];
        if (stats?.pending_payments > 3) {
            cues.push({
                type: 'warning',
                message: `${stats.pending_payments} pending payments need attention`,
                subtext: 'Review and follow up to avoid cash flow issues'
            });
        }
        if (stats?.upcoming_events > 0 && stats?.upcoming_events <= 2) {
            cues.push({
                type: 'info',
                message: `${stats.upcoming_events} events coming up soon`,
                subtext: 'Ensure all preparations are in place'
            });
        }
        return cues;
    }, [stats]);

    // Check if any bookings are today
    const todayBookings = stats?.recent_bookings?.filter(b => {
        const today = new Date().toISOString().split('T')[0];
        return b.event_date === today;
    }) || [];

    if (loading) {
        return <SkeletonDashboard />;
    }

    return (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            data-testid="dashboard-page"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div
                            initial={{ rotate: -180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        >
                            <Sparkles className="h-8 w-8 text-purple-400" />
                        </motion.div>
                        <h1 className="font-heading text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                    </div>
                    <p className="text-purple-300/70">Welcome back! Here&apos;s your banquet overview.</p>
                </div>
                <div className="flex gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                            variant="outline" 
                            onClick={handleSeedData}
                            className="border-purple-700/50 text-purple-300 hover:bg-purple-900/30 hover:border-purple-600 hover:text-white rounded-xl bg-transparent"
                            data-testid="seed-data-btn"
                        >
                            Load Sample Data
                        </Button>
                    </motion.div>
                    <Link to="/dashboard/bookings/new">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/25" data-testid="new-booking-btn">
                                + New Booking
                            </Button>
                        </motion.div>
                    </Link>
                </div>
            </motion.div>

            {/* Intelligence Cues */}
            {intelligenceCues.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-2">
                    {intelligenceCues.map((cue, i) => (
                        <IntelligenceCue key={i} {...cue} />
                    ))}
                </motion.div>
            )}

            {/* Today's Events Alert */}
            {todayBookings.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 border-violet-700/50 shadow-lg shadow-purple-500/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.div 
                                    className="p-2 bg-violet-500/20 rounded-xl"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <CalendarDays className="h-5 w-5 text-violet-400" />
                                </motion.div>
                                <span className="text-purple-200">
                                    <span className="font-bold text-violet-400">{todayBookings.length}</span> event{todayBookings.length > 1 ? 's' : ''} scheduled for today
                                </span>
                            </div>
                            <Link to="/dashboard/bookings">
                                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 rounded-xl">
                                    View <ArrowUpRight className="ml-1 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Stats Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={stat.title}
                        whileHover={{ y: -4, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <Card className={`relative overflow-hidden bg-[#1e1a2e] border border-purple-800/30 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:border-purple-700/50 transition-all duration-300`} data-testid={`stat-${stat.title.toLowerCase().replace(/\s/g, '-')}`}>
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16`} />
                            <CardContent className="p-6 relative">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-purple-300/60 uppercase tracking-wider">{stat.title}</p>
                                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                                    </div>
                                    <motion.div 
                                        className={`p-3 rounded-xl bg-purple-900/50`}
                                        whileHover={{ rotate: 10, scale: 1.1 }}
                                    >
                                        <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                    </motion.div>
                                </div>
                                <div className="flex items-center mt-4 text-xs">
                                    <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`} />
                                    <span className={stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>{stat.trend}</span>
                                    <span className="text-purple-400/60 ml-1">vs last month</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Enquiries Alert */}
            {stats?.new_enquiries > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-700/30 shadow-lg">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.div 
                                    className="p-2 bg-amber-500/20 rounded-xl"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <MessageSquare className="h-5 w-5 text-amber-400" />
                                </motion.div>
                                <span className="text-purple-200">
                                    You have <span className="font-bold text-amber-400">{stats.new_enquiries}</span> new enquiries awaiting response
                                </span>
                            </div>
                            <Link to="/dashboard/enquiries">
                                <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-xl">
                                    View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Charts Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="bg-[#1e1a2e] shadow-lg shadow-purple-900/20 border border-purple-800/30 rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-purple-800/30 bg-purple-900/30">
                        <CardTitle className="font-heading text-white text-lg flex items-center gap-2">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-purple-400" />
                            </div>
                            Revenue Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0.6}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${(value / 1000)}k`} />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                                        contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Event Distribution */}
                <Card className="bg-[#1e1a2e] shadow-lg shadow-purple-900/20 border border-purple-800/30 rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-purple-800/30 bg-purple-900/30">
                        <CardTitle className="font-heading text-white text-lg flex items-center gap-2">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <CalendarDays className="h-4 w-4 text-cyan-400" />
                            </div>
                            Event Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72 flex items-center justify-center">
                            {eventData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={eventData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="count"
                                            nameKey="event_type"
                                            label={({ event_type, count }) => `${event_type}: ${count}`}
                                        >
                                            {eventData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#1e1a2e', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center">
                                    <CalendarDays className="h-12 w-12 text-purple-700 mx-auto mb-3" />
                                    <p className="text-purple-400/60">No event data available</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Recent Bookings */}
            <motion.div variants={itemVariants}>
                <Card className="bg-[#1e1a2e] shadow-lg shadow-purple-900/20 border border-purple-800/30 rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-purple-800/30 bg-purple-900/30">
                        <CardTitle className="font-heading text-white text-lg flex items-center gap-2">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <CalendarDays className="h-4 w-4 text-indigo-400" />
                            </div>
                            Recent Bookings
                        </CardTitle>
                        <Link to="/dashboard/bookings">
                            <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-xl">
                                View All <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-purple-800/30 bg-purple-900/20">
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Booking #</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Client</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Event</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Date</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Total</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Paid</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Due</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.recent_bookings?.length > 0 ? (
                                        stats.recent_bookings.map((booking, idx) => (
                                            <motion.tr 
                                                key={booking.id} 
                                                className="border-b border-purple-800/20 last:border-0 hover:bg-purple-900/30 transition-colors"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                            >
                                                <td className="py-4 px-6">
                                                    <span className="font-mono text-sm font-medium text-purple-400">{booking.booking_number}</span>
                                                </td>
                                                <td className="py-4 px-6 font-medium text-white">{booking.customer_name}</td>
                                                <td className="py-4 px-6 text-purple-300/70 capitalize">{booking.event_type}</td>
                                                <td className="py-4 px-6 text-purple-300/70">{formatDate(booking.event_date)}</td>
                                                <td className="py-4 px-6 font-semibold text-white">{formatCurrency(booking.total_amount)}</td>
                                                <td className="py-4 px-6 text-emerald-400">{formatCurrency(booking.advance_paid || 0)}</td>
                                                <td className="py-4 px-6 text-amber-400 font-medium">{formatCurrency(booking.balance_due || 0)}</td>
                                                <td className="py-4 px-6">
                                                    <StatusBadge type="booking" status={booking.status} size="sm" />
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center">
                                                <CalendarDays className="h-12 w-12 text-purple-700 mx-auto mb-3" />
                                                <p className="text-purple-400/60">No bookings yet. Click &quot;Load Sample Data&quot; to add demo bookings.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default DashboardPage;
