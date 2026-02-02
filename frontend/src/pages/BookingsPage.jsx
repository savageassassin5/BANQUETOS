import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, ChefHat, MoreVertical, Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { StatusBadge } from '../components/ui/status-badge';
import { IntelligenceCue } from '../components/ui/intelligence-cue';
import { SkeletonBookingTable, SkeletonFilterBar } from '../components/ui/skeletons';
import { bookingsAPI, customersAPI, hallsAPI } from '../lib/api';
import { formatCurrency, formatDate, getStatusColor, getPaymentStatusColor, eventTypes, bookingStatuses } from '../lib/utils';
import { toast } from 'sonner';

const BookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState({});
    const [halls, setHalls] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const loadData = async () => {
        try {
            const [bookingsRes, customersRes, hallsRes] = await Promise.all([
                bookingsAPI.getAll(statusFilter === 'all' ? null : statusFilter),
                customersAPI.getAll(),
                hallsAPI.getAll()
            ]);
            setBookings(bookingsRes.data);
            
            const customersMap = {};
            customersRes.data.forEach(c => customersMap[c.id] = c);
            setCustomers(customersMap);
            
            const hallsMap = {};
            hallsRes.data.forEach(h => hallsMap[h.id] = h);
            setHalls(hallsMap);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await bookingsAPI.cancel(id);
            toast.success('Booking cancelled');
            loadData();
        } catch (error) {
            toast.error('Failed to cancel booking');
        }
    };

    const handleDownloadInvoice = async (id) => {
        try {
            const response = await bookingsAPI.getInvoice(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Customer invoice downloaded');
        } catch (error) {
            toast.error('Failed to download invoice');
        }
    };

    const handleDownloadKitchenInvoice = async (id) => {
        try {
            const response = await bookingsAPI.getKitchenInvoice(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `kitchen-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Kitchen invoice downloaded');
        } catch (error) {
            toast.error('Failed to download kitchen invoice');
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const customer = customers[booking.customer_id];
        const hall = halls[booking.hall_id];
        const searchLower = searchQuery.toLowerCase();
        return (
            booking.booking_number?.toLowerCase().includes(searchLower) ||
            customer?.name?.toLowerCase().includes(searchLower) ||
            hall?.name?.toLowerCase().includes(searchLower) ||
            booking.event_type?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="bookings-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Bookings</h1>
                    <p className="text-gray-600 mt-1">Manage all your event bookings</p>
                </div>
                <Link to="/dashboard/bookings/new">
                    <Button 
                        className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 shadow-lg text-white font-semibold px-6 py-2" 
                        data-testid="create-booking-btn"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Booking
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search bookings..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10"
                                data-testid="search-bookings"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {bookingStatuses.map(status => (
                                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Bookings Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Booking #</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Customer</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Hall</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Event</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Date</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Amount</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Status</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Payment</th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking, idx) => (
                                        <motion.tr
                                            key={booking.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="border-b last:border-0 hover:bg-gray-50"
                                            data-testid={`booking-row-${booking.id}`}
                                        >
                                            <td className="py-4 px-4">
                                                <span className="font-mono text-sm">{booking.booking_number}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-medium">{customers[booking.customer_id]?.name || 'Unknown'}</p>
                                                    <p className="text-sm text-gray-500">{customers[booking.customer_id]?.phone}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">{halls[booking.hall_id]?.name || 'Unknown'}</td>
                                            <td className="py-4 px-4 capitalize">{booking.event_type}</td>
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p>{formatDate(booking.event_date)}</p>
                                                    <p className="text-sm text-gray-500">{booking.start_time} - {booking.end_time}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-medium">{formatCurrency(booking.total_amount)}</p>
                                                    <p className="text-sm text-gray-500">Due: {formatCurrency(booking.balance_due)}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge className={getStatusColor(booking.status)}>
                                                    {booking.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge className={getPaymentStatusColor(booking.payment_status)}>
                                                    {booking.payment_status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(booking)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle className="font-heading">Booking Details</DialogTitle>
                                                            </DialogHeader>
                                                            {selectedBooking && (
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Booking Number</p>
                                                                            <p className="font-medium">{selectedBooking.booking_number}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Customer</p>
                                                                            <p className="font-medium">{customers[selectedBooking.customer_id]?.name}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Hall</p>
                                                                            <p className="font-medium">{halls[selectedBooking.hall_id]?.name}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Event Type</p>
                                                                            <p className="font-medium capitalize">{selectedBooking.event_type}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Event Date</p>
                                                                            <p className="font-medium">{formatDate(selectedBooking.event_date)}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Time</p>
                                                                            <p className="font-medium">{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Guests</p>
                                                                            <p className="font-medium">{selectedBooking.guest_count}</p>
                                                                        </div>
                                                                    </div>
                                                                    <hr />
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between">
                                                                            <span>Hall Charges</span>
                                                                            <span>{formatCurrency(selectedBooking.hall_charge)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span>Food Charges</span>
                                                                            <span>{formatCurrency(selectedBooking.food_charge)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span>Add-ons</span>
                                                                            <span>{formatCurrency(selectedBooking.addon_charge)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-gray-500">
                                                                            <span>Discount ({selectedBooking.discount_percent}%)</span>
                                                                            <span>-{formatCurrency(selectedBooking.discount_amount)}</span>
                                                                        </div>
                                                                        <hr />
                                                                        <div className="flex justify-between font-bold text-lg">
                                                                            <span>Total</span>
                                                                            <span>{formatCurrency(selectedBooking.total_amount)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-green-600">
                                                                            <span>Paid</span>
                                                                            <span>{formatCurrency(selectedBooking.advance_paid)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-red-600 font-medium">
                                                                            <span>Balance Due</span>
                                                                            <span>{formatCurrency(selectedBooking.balance_due)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => navigate(`/dashboard/bookings/${booking.id}/edit`)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleDownloadInvoice(booking.id)}>
                                                                <FileText className="h-4 w-4 mr-2" />
                                                                Customer Invoice
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDownloadKitchenInvoice(booking.id)}>
                                                                <ChefHat className="h-4 w-4 mr-2" />
                                                                Kitchen Invoice
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {booking.status !== 'cancelled' && (
                                                                <DropdownMenuItem 
                                                                    className="text-red-600"
                                                                    onClick={() => handleCancelBooking(booking.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Cancel Booking
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="py-8 text-center text-gray-500">
                                            No bookings found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BookingsPage;
