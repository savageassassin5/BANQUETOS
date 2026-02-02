import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, IndianRupee, Calendar, User, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { StatusBadge } from '../components/ui/status-badge';
import { SaveFeedback, useSaveState } from '../components/ui/save-feedback';
import { IntelligenceCue } from '../components/ui/intelligence-cue';
import { SkeletonMetric, SkeletonPaymentRow, Skeleton } from '../components/ui/skeletons';
import { paymentsAPI, bookingsAPI, customersAPI } from '../lib/api';
import { formatCurrency, formatDateTime, getPaymentStatusColor } from '../lib/utils';
import { toast } from 'sonner';

const PaymentsPage = () => {
    const [payments, setPayments] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState({});
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [form, setForm] = useState({
        booking_id: '',
        amount: 0,
        payment_mode: 'cash',
        notes: '',
        recorded_by: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    const paymentMethods = [
        { value: 'cash', label: 'Cash' },
        { value: 'upi', label: 'UPI' },
        { value: 'credit', label: 'Credit Card' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [paymentsRes, bookingsRes, customersRes] = await Promise.all([
                paymentsAPI.getAll(),
                bookingsAPI.getAll(),
                customersAPI.getAll()
            ]);
            setPayments(paymentsRes.data);
            setBookings(bookingsRes.data);
            
            const customersMap = {};
            customersRes.data.forEach(c => customersMap[c.id] = c);
            setCustomers(customersMap);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            booking_id: '',
            amount: 0,
            payment_mode: 'cash',
            notes: '',
            recorded_by: '',
            payment_date: new Date().toISOString().split('T')[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.booking_id || !form.amount) {
            toast.error('Please select booking and enter amount');
            return;
        }
        try {
            await paymentsAPI.create(form);
            toast.success('Payment recorded');
            loadData();
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Failed to record payment');
        }
    };

    const getBookingInfo = (bookingId) => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return null;
        const customer = customers[booking.customer_id];
        return { booking, customer };
    };

    const pendingBookings = bookings.filter(b => b.payment_status !== 'paid' && b.status !== 'cancelled');
    const selectedBooking = bookings.find(b => b.id === form.booking_id);

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.balance_due || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="payments-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Payments</h1>
                    <p className="text-gray-600 mt-1">Track and manage payments</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600"
                            onClick={resetForm}
                            data-testid="record-payment-btn"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Record Payment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Record Payment</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Booking *</label>
                                <Select value={form.booking_id} onValueChange={value => setForm(prev => ({ ...prev, booking_id: value }))}>
                                    <SelectTrigger data-testid="payment-booking">
                                        <SelectValue placeholder="Choose booking" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pendingBookings.map(booking => {
                                            const customer = customers[booking.customer_id];
                                            return (
                                                <SelectItem key={booking.id} value={booking.id}>
                                                    {booking.booking_number} - {customer?.name} (Due: {formatCurrency(booking.balance_due)})
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedBooking && (
                                <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                                    <p className="text-sm text-gray-600">Total Amount: <span className="font-medium">{formatCurrency(selectedBooking.total_amount)}</span></p>
                                    <p className="text-sm text-gray-600">Already Paid: <span className="font-medium text-green-600">{formatCurrency(selectedBooking.advance_paid)}</span></p>
                                    <p className="text-sm text-gray-600">Balance Due: <span className="font-medium text-red-600">{formatCurrency(selectedBooking.balance_due)}</span></p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                                    <Input
                                        type="number"
                                        required
                                        value={form.amount}
                                        onChange={e => setForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                                        placeholder="Enter amount"
                                        data-testid="payment-amount"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <Select value={form.payment_mode} onValueChange={value => setForm(prev => ({ ...prev, payment_mode: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map(method => (
                                                <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Calendar className="inline h-4 w-4 mr-1" />
                                        Payment Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={form.payment_date}
                                        onChange={e => setForm(prev => ({ ...prev, payment_date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <User className="inline h-4 w-4 mr-1" />
                                        Recorded By
                                    </label>
                                    <Input
                                        value={form.recorded_by}
                                        onChange={e => setForm(prev => ({ ...prev, recorded_by: e.target.value }))}
                                        placeholder="Name of person"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <Input
                                    value={form.notes}
                                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Optional notes"
                                />
                            </div>

                            <div className="flex gap-2 justify-end">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" className="bg-gradient-to-r from-fuchsia-600 to-pink-500" data-testid="save-payment-btn">
                                    Record Payment
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Collected</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl">
                                <IndianRupee className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Pending</p>
                                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <CreditCard className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Transactions</p>
                                <p className="text-2xl font-bold text-fuchsia-600">{payments.length}</p>
                            </div>
                            <div className="p-3 bg-fuchsia-100 rounded-xl">
                                <CreditCard className="h-6 w-6 text-fuchsia-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payments Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-heading">Payment History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Payment Date</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Booking</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Customer</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Amount</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Method</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Recorded By</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? (
                                    payments.map((payment, idx) => {
                                        const info = getBookingInfo(payment.booking_id);
                                        return (
                                            <motion.tr
                                                key={payment.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="border-b last:border-0 hover:bg-gray-50"
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span>{payment.payment_date || formatDateTime(payment.created_at).split(',')[0]}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="font-mono text-sm">{info?.booking?.booking_number || 'N/A'}</span>
                                                </td>
                                                <td className="py-4 px-4">{info?.customer?.name || 'N/A'}</td>
                                                <td className="py-4 px-4">
                                                    <span className="font-bold text-green-600">{formatCurrency(payment.amount)}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge variant="secondary" className="capitalize">{payment.payment_mode}</Badge>
                                                </td>
                                                <td className="py-4 px-4">
                                                    {payment.recorded_by ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <User className="h-3 w-3 text-gray-400" />
                                                            {payment.recorded_by}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="py-4 px-4 text-gray-500 max-w-[150px] truncate">{payment.notes || '-'}</td>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-gray-500">
                                            No payments recorded yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pending Payments */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-heading">Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingBookings.length > 0 ? (
                        <div className="space-y-3">
                            {pendingBookings.map(booking => {
                                const customer = customers[booking.customer_id];
                                return (
                                    <div key={booking.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                                        <div>
                                            <p className="font-medium">{customer?.name}</p>
                                            <p className="text-sm text-gray-500">{booking.booking_number} | {booking.event_date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-orange-600">{formatCurrency(booking.balance_due)}</p>
                                            <Badge className={getPaymentStatusColor(booking.payment_status)}>
                                                {booking.payment_status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No pending payments</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentsPage;
