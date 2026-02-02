import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Check, MessageSquare, Clock, Edit, Save, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { notificationsAPI, bookingsAPI } from '../lib/api';
import { formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

const NotificationsPage = () => {
    const [templates, setTemplates] = useState([]);
    const [logs, setLogs] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [editedText, setEditedText] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [templatesRes, logsRes, bookingsRes] = await Promise.all([
                notificationsAPI.getTemplates(),
                notificationsAPI.getLogs(),
                bookingsAPI.getAll()
            ]);
            setTemplates(templatesRes.data);
            setLogs(logsRes.data);
            setBookings(bookingsRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotification = async (bookingId, type) => {
        try {
            await notificationsAPI.send(bookingId, type);
            toast.success('Notification sent successfully!');
            loadData();
        } catch (error) {
            toast.error('Failed to send notification');
        }
    };

    const handleSaveTemplate = async (templateId) => {
        try {
            await notificationsAPI.updateTemplate(templateId, editedText, true);
            toast.success('Template updated successfully!');
            setEditingTemplate(null);
            loadData();
        } catch (error) {
            toast.error('Failed to update template');
        }
    };

    const getNotificationTypeLabel = (type) => {
        const labels = {
            booking_confirmation: 'Booking Confirmation',
            payment_reminder: 'Payment Reminder',
            event_reminder: 'Event Reminder'
        };
        return labels[type] || type;
    };

    const getNotificationIcon = (type) => {
        const icons = {
            booking_confirmation: Check,
            payment_reminder: Clock,
            event_reminder: Bell
        };
        return icons[type] || MessageSquare;
    };

    const getNotificationColor = (type) => {
        const colors = {
            booking_confirmation: { bg: 'bg-emerald-100', text: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-500' },
            payment_reminder: { bg: 'bg-amber-100', text: 'text-amber-600', gradient: 'from-amber-500 to-orange-500' },
            event_reminder: { bg: 'bg-sky-100', text: 'text-sky-600', gradient: 'from-sky-500 to-indigo-500' }
        };
        return colors[type] || { bg: 'bg-purple-100', text: 'text-purple-600', gradient: 'from-purple-500 to-pink-500' };
    };

    const pendingBookings = bookings.filter(b => b.status !== 'cancelled').slice(0, 10);

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
            data-testid="notifications-page"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-2">
                    <motion.div
                        className="p-2 bg-sky-100 rounded-xl"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Bell className="h-6 w-6 text-sky-600" />
                    </motion.div>
                    <h1 className="font-heading text-3xl md:text-4xl font-bold bg-gradient-to-r from-sky-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        Notifications
                    </h1>
                </div>
                <p className="text-slate-500">Manage WhatsApp/SMS templates and send notifications</p>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Tabs defaultValue="send">
                    <TabsList className="bg-white shadow-lg border-0 rounded-2xl p-1">
                        <TabsTrigger value="send" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl px-6">Send Notifications</TabsTrigger>
                        <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl px-6">Templates</TabsTrigger>
                        <TabsTrigger value="logs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl px-6">Logs</TabsTrigger>
                    </TabsList>

                    {/* Send Notifications Tab */}
                    <TabsContent value="send" className="mt-6">
                        <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
                                <CardTitle className="font-heading text-slate-800 flex items-center gap-2">
                                    <div className="p-2 bg-violet-100 rounded-lg">
                                        <Send className="h-5 w-5 text-violet-600" />
                                    </div>
                                    Quick Send
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Event</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingBookings.map((booking, idx) => (
                                                <motion.tr 
                                                    key={booking.id} 
                                                    className="border-b border-slate-100 hover:bg-purple-50/50 transition-colors"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <td className="py-4 px-6 font-mono text-sm font-medium text-purple-600">{booking.booking_number}</td>
                                                    <td className="py-4 px-6 text-slate-600 capitalize">{booking.event_type}</td>
                                                    <td className="py-4 px-6 text-slate-500">{booking.event_date}</td>
                                                    <td className="py-4 px-6">
                                                        <Badge variant="outline" className="border-slate-200 text-slate-600 capitalize rounded-full">{booking.status}</Badge>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex justify-end gap-2">
                                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 rounded-xl"
                                                                    onClick={() => handleSendNotification(booking.id, 'booking_confirmation')}
                                                                >
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Confirm
                                                                </Button>
                                                            </motion.div>
                                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0 rounded-xl"
                                                                    onClick={() => handleSendNotification(booking.id, 'payment_reminder')}
                                                                >
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    Payment
                                                                </Button>
                                                            </motion.div>
                                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-sky-100 text-sky-700 hover:bg-sky-200 border-0 rounded-xl"
                                                                    onClick={() => handleSendNotification(booking.id, 'event_reminder')}
                                                                >
                                                                    <Bell className="h-3 w-3 mr-1" />
                                                                    Remind
                                                                </Button>
                                                            </motion.div>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Templates Tab */}
                    <TabsContent value="templates" className="mt-6 space-y-4">
                        {templates.map((template, idx) => {
                            const Icon = getNotificationIcon(template.notification_type);
                            const colorConfig = getNotificationColor(template.notification_type);
                            return (
                                <motion.div
                                    key={template.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                                        <div className={`h-1 bg-gradient-to-r ${colorConfig.gradient}`} />
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <motion.div 
                                                    className={`p-3 rounded-xl ${colorConfig.bg}`}
                                                    whileHover={{ rotate: 10, scale: 1.1 }}
                                                >
                                                    <Icon className={`h-6 w-6 ${colorConfig.text}`} />
                                                </motion.div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <h3 className="font-semibold text-slate-800">{getNotificationTypeLabel(template.notification_type)}</h3>
                                                            <Badge className="bg-slate-100 text-slate-600 border-0 text-xs mt-1 rounded-full">{template.channel}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-slate-400">Active</span>
                                                                <Switch checked={template.is_active} />
                                                            </div>
                                                            {editingTemplate === template.id ? (
                                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                                    <Button size="sm" onClick={() => handleSaveTemplate(template.id)} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl">
                                                                        <Save className="h-3 w-3 mr-1" />
                                                                        Save
                                                                    </Button>
                                                                </motion.div>
                                                            ) : (
                                                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                                    <Button size="sm" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl" onClick={() => { setEditingTemplate(template.id); setEditedText(template.template); }}>
                                                                        <Edit className="h-3 w-3 mr-1" />
                                                                        Edit
                                                                    </Button>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {editingTemplate === template.id ? (
                                                        <Textarea
                                                            value={editedText}
                                                            onChange={e => setEditedText(e.target.value)}
                                                            className="border-purple-200 focus:border-purple-400 rounded-xl"
                                                            rows={3}
                                                        />
                                                    ) : (
                                                        <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-xl">{template.template}</p>
                                                    )}
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        Variables: {'{customer_name}'}, {'{booking_number}'}, {'{event_type}'}, {'{event_date}'}, {'{hall_name}'}, {'{total_amount}'}, {'{balance_due}'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </TabsContent>

                    {/* Logs Tab */}
                    <TabsContent value="logs" className="mt-6">
                        <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                                <CardTitle className="font-heading text-slate-800 flex items-center gap-2">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <MessageSquare className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    Notification History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {logs.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {logs.map((log, idx) => {
                                            const Icon = getNotificationIcon(log.notification_type);
                                            const colorConfig = getNotificationColor(log.notification_type);
                                            return (
                                                <motion.div 
                                                    key={idx} 
                                                    className="p-4 hover:bg-purple-50/50 transition-colors"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`p-2 rounded-xl ${colorConfig.bg}`}>
                                                            <Icon className={`h-4 w-4 ${colorConfig.text}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-slate-800">{getNotificationTypeLabel(log.notification_type)}</span>
                                                                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs rounded-full">{log.status}</Badge>
                                                            </div>
                                                            <p className="text-slate-500 text-sm truncate">{log.message}</p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                                <span>To: {log.recipient}</span>
                                                                <span>Channel: {log.channel}</span>
                                                                <span>{formatDateTime(log.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200 }}
                                        >
                                            <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                        </motion.div>
                                        <p className="text-slate-400 text-lg">No notifications sent yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </motion.div>
    );
};

export default NotificationsPage;
