import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Building2, Download, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { analyticsAPI, hallsAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AnalyticsPage = () => {
    const [halls, setHalls] = useState([]);
    const [utilization, setUtilization] = useState(null);
    const [peakSeasons, setPeakSeasons] = useState(null);
    const [idleDays, setIdleDays] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedHall, setSelectedHall] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (halls.length > 0 && !selectedHall) {
            setSelectedHall(halls[0].id);
        }
    }, [halls]);

    useEffect(() => {
        loadUtilization();
    }, [dateRange]);

    useEffect(() => {
        loadPeakSeasons();
    }, [selectedYear]);

    useEffect(() => {
        if (selectedHall) loadIdleDays();
    }, [selectedHall, dateRange]);

    const loadInitialData = async () => {
        try {
            const hallsRes = await hallsAPI.getAll();
            setHalls(hallsRes.data);
        } catch (error) {
            console.error('Failed to load halls:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUtilization = async () => {
        try {
            const res = await analyticsAPI.getHallUtilization(dateRange.start, dateRange.end);
            setUtilization(res.data);
        } catch (error) {
            console.error('Failed to load utilization:', error);
        }
    };

    const loadPeakSeasons = async () => {
        try {
            const res = await analyticsAPI.getPeakSeasons(selectedYear);
            setPeakSeasons(res.data);
        } catch (error) {
            console.error('Failed to load peak seasons:', error);
        }
    };

    const loadIdleDays = async () => {
        try {
            const res = await analyticsAPI.getIdleDays(selectedHall, dateRange.start, dateRange.end);
            setIdleDays(res.data);
        } catch (error) {
            console.error('Failed to load idle days:', error);
        }
    };

    const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

    const handleExportReport = async () => {
        try {
            const API_URL = process.env.REACT_APP_BACKEND_URL;
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/analytics/export?start_date=${dateRange.start}&end_date=${dateRange.end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analytics_report_${dateRange.start}_${dateRange.end}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Failed to export report. Please try again.');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export report. Please try again.');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600"
                />
            </div>
        );
    }

    return (
        <motion.div 
            className="space-y-6" 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            data-testid="analytics-page"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div
                            className="p-2 bg-purple-100 rounded-xl"
                            whileHover={{ rotate: 10, scale: 1.1 }}
                        >
                            <BarChart3 className="h-6 w-6 text-purple-600" />
                        </motion.div>
                        <h1 className="font-heading text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                            Hall Analytics
                        </h1>
                    </div>
                    <p className="text-slate-500">Track occupancy, revenue, and identify opportunities</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                        onClick={handleExportReport}
                        className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl shadow-lg"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </motion.div>
            </motion.div>

            {/* Date Range Filter */}
            <motion.div variants={itemVariants}>
                <Card className="bg-white shadow-lg border-0 rounded-2xl">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div>
                                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Start Date</label>
                                <Input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="border-purple-200 focus:border-purple-400 rounded-xl" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">End Date</label>
                                <Input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="border-purple-200 focus:border-purple-400 rounded-xl" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Year (Seasons)</label>
                                <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
                                    <SelectTrigger className="w-32 border-purple-200 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {[2024, 2025, 2026].map(year => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Overview Stats */}
            {utilization && (
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Total Revenue</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{formatCurrency(utilization.total_revenue)}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Overall Occupancy</p>
                            <p className="text-2xl font-bold text-emerald-600">{utilization.overall_occupancy}%</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Best Hall</p>
                            <p className="text-2xl font-bold text-amber-600">{utilization.best_performing?.hall_name || 'N/A'}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2">Period Days</p>
                            <p className="text-2xl font-bold text-cyan-600">{utilization.period?.total_days || 0}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Hall Performance Table */}
            {utilization && (
                <motion.div variants={itemVariants}>
                    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
                            <CardTitle className="font-heading text-slate-800 flex items-center gap-2">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Building2 className="h-5 w-5 text-orange-600" />
                                </div>
                                Hall-wise Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hall</th>
                                            <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacity</th>
                                            <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bookings</th>
                                            <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Booked Days</th>
                                            <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Idle Days</th>
                                            <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupancy</th>
                                            <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</th>
                                            <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {utilization.halls.map((hall, idx) => (
                                            <motion.tr 
                                                key={hall.hall_id} 
                                                className="border-b border-slate-100 hover:bg-purple-50/50 transition-colors"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                            >
                                                <td className="py-4 px-6 font-medium text-slate-700">{hall.hall_name}</td>
                                                <td className="py-4 px-6 text-center text-slate-500">{hall.capacity}</td>
                                                <td className="py-4 px-6 text-center font-medium text-purple-600">{hall.total_bookings}</td>
                                                <td className="py-4 px-6 text-center text-emerald-600 font-medium">{hall.booked_days}</td>
                                                <td className="py-4 px-6 text-center text-rose-500 font-medium">{hall.idle_days}</td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                        hall.occupancy_rate > 50 ? 'bg-emerald-100 text-emerald-700' : 
                                                        hall.occupancy_rate > 25 ? 'bg-amber-100 text-amber-700' : 
                                                        'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {hall.occupancy_rate}%
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-bold text-purple-600">{formatCurrency(hall.total_revenue)}</td>
                                                <td className="py-4 px-6 text-right text-slate-500">{formatCurrency(hall.avg_booking_value)}</td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Charts Row */}
            <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-6">
                {/* Peak Seasons Chart */}
                {peakSeasons && (
                    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
                            <CardTitle className="font-heading text-slate-800 flex items-center gap-2">
                                <div className="p-2 bg-violet-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-violet-600" />
                                </div>
                                Monthly Booking Trend ({selectedYear})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={peakSeasons.monthly_data}>
                                        <defs>
                                            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.6}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="bookings" fill="url(#colorBookings)" radius={[8, 8, 0, 0]} name="Bookings" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {peakSeasons.peak_month && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                                    <p className="text-slate-600 text-sm">
                                        <Sparkles className="inline h-4 w-4 text-purple-500 mr-1" />
                                        <span className="font-bold text-purple-600">{peakSeasons.peak_month}</span> is the peak season with maximum bookings
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Occupancy by Hall */}
                {utilization && (
                    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
                            <CardTitle className="font-heading text-slate-800 flex items-center gap-2">
                                <div className="p-2 bg-cyan-100 rounded-lg">
                                    <BarChart3 className="h-5 w-5 text-cyan-600" />
                                </div>
                                Occupancy Rate by Hall
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={utilization.halls} layout="vertical">
                                        <defs>
                                            <linearGradient id="colorOccupancy" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                                        <YAxis type="category" dataKey="hall_name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                                        <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} formatter={v => [`${v}%`, 'Occupancy']} />
                                        <Bar dataKey="occupancy_rate" fill="url(#colorOccupancy)" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </motion.div>

            {/* Idle Days Analysis */}
            <motion.div variants={itemVariants}>
                <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-rose-50 to-pink-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="font-heading text-slate-800 flex items-center gap-2">
                                <div className="p-2 bg-rose-100 rounded-lg">
                                    <Calendar className="h-5 w-5 text-rose-600" />
                                </div>
                                Idle Days Report
                            </CardTitle>
                            <Select value={selectedHall} onValueChange={setSelectedHall}>
                                <SelectTrigger className="w-48 border-rose-200 rounded-xl">
                                    <SelectValue placeholder="Select Hall" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {halls.map(hall => (
                                        <SelectItem key={hall.id} value={hall.id}>{hall.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {idleDays && (
                            <div>
                                <div className="flex items-center gap-8 mb-6">
                                    <div className="p-4 bg-rose-50 rounded-2xl">
                                        <p className="text-4xl font-bold text-rose-500">{idleDays.total_idle_days}</p>
                                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mt-1">Total Idle Days</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-slate-700">{idleDays.hall_name}</p>
                                        <p className="text-sm text-slate-500">Selected Hall</p>
                                    </div>
                                </div>
                                {idleDays.idle_dates?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                                        {idleDays.idle_dates.slice(0, 30).map((date, idx) => (
                                            <motion.span 
                                                key={idx} 
                                                className="text-xs px-3 py-1.5 bg-rose-100 text-rose-600 rounded-full font-medium"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: idx * 0.02 }}
                                            >
                                                {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </motion.span>
                                        ))}
                                        {idleDays.idle_dates.length > 30 && (
                                            <span className="text-xs px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                                                +{idleDays.idle_dates.length - 30} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default AnalyticsPage;
