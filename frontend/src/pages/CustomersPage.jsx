import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Search, Phone, Mail, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { customersAPI, bookingsAPI } from '../lib/api';
import { formatDate, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [customersRes, bookingsRes] = await Promise.all([
                customersAPI.getAll(),
                bookingsAPI.getAll()
            ]);
            setCustomers(customersRes.data);
            setBookings(bookingsRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', email: '', phone: '', address: '' });
        setEditingCustomer(null);
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setForm({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address || ''
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await customersAPI.update(editingCustomer.id, form);
                toast.success('Customer updated');
            } else {
                await customersAPI.create(form);
                toast.success('Customer created');
            }
            loadData();
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Failed to save customer');
        }
    };

    const getCustomerBookings = (customerId) => {
        return bookings.filter(b => b.customer_id === customerId);
    };

    const getCustomerStats = (customerId) => {
        const customerBookings = getCustomerBookings(customerId);
        return {
            totalBookings: customerBookings.length,
            totalSpent: customerBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
            lastBooking: customerBookings.length > 0 ? customerBookings[0].event_date : null
        };
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="customers-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-600 mt-1">Manage your customer database</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl shadow-lg"
                            onClick={resetForm}
                            data-testid="add-customer-btn"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="font-heading">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <Input
                                    required
                                    value={form.name}
                                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter customer name"
                                    data-testid="customer-name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <Input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                    data-testid="customer-email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <Input
                                    required
                                    value={form.phone}
                                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Phone number"
                                    data-testid="customer-phone"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <Input
                                    value={form.address}
                                    onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Address"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className="border-slate-200 rounded-xl">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl" data-testid="save-customer-btn">
                                    {editingCustomer ? 'Update' : 'Create'} Customer
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search customers by name, email, or phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10"
                            data-testid="search-customers"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Customers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer, idx) => {
                    const stats = getCustomerStats(customer.id);
                    return (
                        <motion.div
                            key={customer.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className="hover:shadow-lg transition-shadow" data-testid={`customer-card-${customer.id}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-maroon/10 flex items-center justify-center">
                                                <User className="h-6 w-6 text-maroon" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-lg">{customer.name}</h3>
                                                <p className="text-sm text-gray-500">Customer</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => handleEdit(customer)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="h-4 w-4" />
                                            <span>{customer.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="h-4 w-4" />
                                            <span className="truncate">{customer.email}</span>
                                        </div>
                                        {customer.address && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin className="h-4 w-4" />
                                                <span className="truncate">{customer.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-2xl font-bold text-maroon">{stats.totalBookings}</p>
                                                <p className="text-xs text-gray-500">Bookings</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-gold-dark">{formatCurrency(stats.totalSpent).replace('₹', '₹')}</p>
                                                <p className="text-xs text-gray-500">Total Spent</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{stats.lastBooking ? formatDate(stats.lastBooking) : 'N/A'}</p>
                                                <p className="text-xs text-gray-500">Last Event</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {filteredCustomers.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">No customers found</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CustomersPage;
