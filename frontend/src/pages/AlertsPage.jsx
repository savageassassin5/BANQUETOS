import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Clock, CreditCard, Utensils, Bell, Check, ExternalLink, Sparkles, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { alertsAPI } from '../lib/api';
import { Link } from 'react-router-dom';

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            const res = await alertsAPI.getAll();
            setAlerts(res.data);
        } catch (error) {
            console.error('Failed to load alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAlertIcon = (type) => {
        const icons = {
            payment_overdue: CreditCard,
            event_tomorrow: Clock,
            no_menu_assigned: Utensils,
            low_advance: AlertCircle,
            double_booking: AlertTriangle
        };
        return icons[type] || AlertCircle;
    };

    const getAlertColor = (priority) => {
        if (priority === 'high') return 'border-l-rose-500 bg-gradient-to-r from-rose-50 to-pink-50';
        if (priority === 'medium') return 'border-l-amber-500 bg-gradient-to-r from-amber-50 to-orange-50';
        return 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50';
    };

    const getPriorityBadge = (priority) => {
        if (priority === 'high') return 'bg-rose-100 text-rose-700 border-0';
        if (priority === 'medium') return 'bg-amber-100 text-amber-700 border-0';
        return 'bg-blue-100 text-blue-700 border-0';
    };

    const getIconBg = (priority) => {
        if (priority === 'high') return 'bg-rose-100';
        if (priority === 'medium') return 'bg-amber-100';
        return 'bg-blue-100';
    };

    const getIconColor = (priority) => {
        if (priority === 'high') return 'text-rose-600';
        if (priority === 'medium') return 'text-amber-600';
        return 'text-blue-600';
    };

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'high') return a.priority === 'high';
        if (filter === 'medium') return a.priority === 'medium';
        return true;
    });

    const highCount = alerts.filter(a => a.priority === 'high').length;
    const mediumCount = alerts.filter(a => a.priority === 'medium').length;

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
            data-testid="alerts-page"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div
                            className="p-2 bg-rose-100 rounded-xl"
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <AlertTriangle className="h-6 w-6 text-rose-600" />
                        </motion.div>
                        <h1 className="font-heading text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                            Alerts & Warnings
                        </h1>
                    </div>
                    <p className="text-slate-500">Real-time alerts requiring your attention</p>
                </div>
                <div className="flex items-center gap-3">
                    {highCount > 0 && (
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <Badge className="bg-rose-100 text-rose-700 border-0 px-4 py-2 rounded-full text-sm font-semibold">
                                {highCount} High Priority
                            </Badge>
                        </motion.div>
                    )}
                    {mediumCount > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-0 px-4 py-2 rounded-full text-sm font-semibold">
                            {mediumCount} Medium
                        </Badge>
                    )}
                </div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                        <motion.div 
                            className="p-3 rounded-xl bg-rose-100"
                            whileHover={{ rotate: 10 }}
                        >
                            <AlertTriangle className="h-6 w-6 text-rose-600" />
                        </motion.div>
                        <div>
                            <p className="text-2xl font-bold text-rose-600">{highCount}</p>
                            <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">High Priority</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                        <motion.div 
                            className="p-3 rounded-xl bg-amber-100"
                            whileHover={{ rotate: 10 }}
                        >
                            <AlertCircle className="h-6 w-6 text-amber-600" />
                        </motion.div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{mediumCount}</p>
                            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Medium Priority</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                        <motion.div 
                            className="p-3 rounded-xl bg-purple-100"
                            whileHover={{ rotate: 10 }}
                        >
                            <CreditCard className="h-6 w-6 text-purple-600" />
                        </motion.div>
                        <div>
                            <p className="text-2xl font-bold text-purple-600">{alerts.filter(a => a.alert_type === 'payment_overdue').length}</p>
                            <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider">Payment Issues</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                        <motion.div 
                            className="p-3 rounded-xl bg-cyan-100"
                            whileHover={{ rotate: 10 }}
                        >
                            <Clock className="h-6 w-6 text-cyan-600" />
                        </motion.div>
                        <div>
                            <p className="text-2xl font-bold text-cyan-600">{alerts.filter(a => a.alert_type === 'event_tomorrow').length}</p>
                            <p className="text-xs font-semibold text-cyan-500 uppercase tracking-wider">Events Tomorrow</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filter */}
            <motion.div variants={itemVariants} className="flex gap-2">
                {['all', 'high', 'medium'].map(tab => (
                    <motion.div key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            variant={filter === tab ? 'default' : 'outline'}
                            className={filter === tab 
                                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl' 
                                : 'border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 rounded-xl'
                            }
                            onClick={() => setFilter(tab)}
                        >
                            {tab === 'all' ? 'All Alerts' : `${tab.charAt(0).toUpperCase() + tab.slice(1)} Priority`}
                        </Button>
                    </motion.div>
                ))}
            </motion.div>

            {/* Alerts List */}
            <motion.div variants={itemVariants} className="space-y-4">
                {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert, idx) => {
                        const Icon = getAlertIcon(alert.alert_type);
                        return (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ x: 4 }}
                            >
                                <Card className={`bg-white border-0 border-l-4 shadow-lg rounded-2xl ${getAlertColor(alert.priority)} overflow-hidden hover:shadow-xl transition-all`} data-testid={`alert-${alert.id}`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <motion.div 
                                                className={`p-3 rounded-xl ${getIconBg(alert.priority)}`}
                                                whileHover={{ rotate: 10, scale: 1.1 }}
                                            >
                                                <Icon className={`h-6 w-6 ${getIconColor(alert.priority)}`} />
                                            </motion.div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-slate-800">{alert.title}</h3>
                                                    <Badge className={`${getPriorityBadge(alert.priority)} rounded-full px-3 font-medium text-xs`}>
                                                        {alert.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-slate-600 mb-4">{alert.message}</p>
                                                <div className="flex items-center gap-4">
                                                    <Badge variant="outline" className="border-slate-200 text-slate-500 text-xs rounded-full">
                                                        {alert.alert_type.replace(/_/g, ' ')}
                                                    </Badge>
                                                    {alert.booking_id && (
                                                        <Link to={`/dashboard/bookings/${alert.booking_id}/edit`}>
                                                            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl h-auto p-2">
                                                                View Booking <ExternalLink className="ml-1 h-3 w-3" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl">
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Resolve
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })
                ) : (
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-lg rounded-2xl">
                        <CardContent className="py-16 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                <PartyPopper className="h-20 w-20 text-emerald-400 mx-auto mb-4" />
                            </motion.div>
                            <h3 className="font-heading text-2xl font-bold text-emerald-700 mb-2">All Clear!</h3>
                            <p className="text-emerald-600">No alerts at the moment. Everything is running smoothly.</p>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </motion.div>
    );
};

export default AlertsPage;
