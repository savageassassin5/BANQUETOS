import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Trash2, CreditCard, Wallet, IndianRupee, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { StatusBadge } from '../components/ui/status-badge';
import { SaveFeedback, useSaveState } from '../components/ui/save-feedback';
import { IntelligenceCue } from '../components/ui/intelligence-cue';
import { SkeletonBookingSection, Skeleton } from '../components/ui/skeletons';
import { bookingsAPI, customersAPI, hallsAPI, menuAPI, vendorAPI } from '../lib/api';
import { eventTypes, formatCurrency, bookingStatuses } from '../lib/utils';
import { toast } from 'sonner';

const BookingFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [halls, setHalls] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [addons, setAddons] = useState([]);
    const [vendors, setVendors] = useState([]);

    const [form, setForm] = useState({
        customer_id: '',
        hall_id: '',
        event_type: '',
        event_date: '',
        slot: 'day',
        guest_count: 100,
        menu_items: [],
        addons: [],
        special_requests: '',
        custom_menu_prices: {},
        // GST Options
        gst_option: 'on',  // 'on', 'off', 'custom'
        custom_gst_percent: 5,
        // Discount
        discount_type: 'percent',
        discount_value: 0,
        // Payment Splits
        payment_splits: [],
        // Legacy
        payment_received: false,
        advance_amount: 0,
        payment_method: 'cash',
        // Linked vendors
        linked_vendors: [],
        status: 'enquiry'
    });

    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [customersRes, hallsRes, menuRes, vendorsRes] = await Promise.all([
                customersAPI.getAll(),
                hallsAPI.getAll(),
                menuAPI.getAll(),
                vendorAPI.getAll().catch(() => ({ data: [] }))
            ]);
            setCustomers(customersRes.data);
            setHalls(hallsRes.data);
            setMenuItems(menuRes.data.filter(m => !m.is_addon));
            setAddons(menuRes.data.filter(m => m.is_addon));
            setVendors(vendorsRes.data);

            if (isEditing) {
                const bookingRes = await bookingsAPI.getOne(id);
                const booking = bookingRes.data;
                setForm({
                    customer_id: booking.customer_id,
                    hall_id: booking.hall_id,
                    event_type: booking.event_type,
                    event_date: booking.event_date,
                    slot: booking.slot || 'day',
                    guest_count: booking.guest_count,
                    menu_items: booking.menu_items || [],
                    addons: booking.addons || [],
                    special_requests: booking.special_requests || '',
                    custom_menu_prices: booking.custom_menu_prices || {},
                    gst_option: booking.gst_option || 'on',
                    custom_gst_percent: booking.gst_percent || 5,
                    discount_type: booking.discount_type || 'percent',
                    discount_value: booking.discount_value || booking.discount_percent || 0,
                    payment_splits: booking.payment_splits || [],
                    payment_received: booking.advance_paid > 0,
                    advance_amount: booking.advance_paid || 0,
                    payment_method: booking.payment_method || 'cash',
                    linked_vendors: booking.linked_vendors || [],
                    status: booking.status
                });
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async () => {
        try {
            const res = await customersAPI.create(newCustomer);
            setCustomers(prev => [...prev, res.data]);
            setForm(prev => ({ ...prev, customer_id: res.data.id }));
            setShowNewCustomerForm(false);
            setNewCustomer({ name: '', email: '', phone: '', address: '' });
            toast.success('Customer created');
        } catch (error) {
            toast.error('Failed to create customer');
        }
    };

    // Payment Split Management
    const addPaymentSplit = () => {
        setForm(prev => ({
            ...prev,
            payment_splits: [...prev.payment_splits, { method: 'cash', amount: 0 }]
        }));
    };

    const updatePaymentSplit = (index, field, value) => {
        setForm(prev => {
            const splits = [...prev.payment_splits];
            splits[index] = { ...splits[index], [field]: value };
            return { ...prev, payment_splits: splits };
        });
    };

    const removePaymentSplit = (index) => {
        setForm(prev => ({
            ...prev,
            payment_splits: prev.payment_splits.filter((_, i) => i !== index)
        }));
    };

    const calculateEstimate = () => {
        const selectedMenuItems = menuItems.filter(m => form.menu_items.includes(m.id));
        
        // Food charge with custom prices support
        let foodCharge = 0;
        selectedMenuItems.forEach(item => {
            if (form.custom_menu_prices[item.id] !== undefined) {
                foodCharge += form.custom_menu_prices[item.id];
            } else if (item.pricing_type === 'fixed') {
                foodCharge += item.price_per_plate;
            } else {
                foodCharge += item.price_per_plate * form.guest_count;
            }
        });
        
        // Addon charge
        const selectedAddons = addons.filter(a => form.addons.includes(a.id));
        let addonCharge = 0;
        selectedAddons.forEach(addon => {
            if (form.custom_menu_prices[addon.id] !== undefined) {
                addonCharge += form.custom_menu_prices[addon.id];
            } else {
                addonCharge += addon.price_per_plate;
            }
        });
        
        const subtotal = foodCharge + addonCharge;
        
        let discountAmount = 0;
        if (form.discount_type === 'percent') {
            discountAmount = subtotal * (form.discount_value / 100);
        } else {
            discountAmount = form.discount_value;
        }
        const afterDiscount = Math.max(0, subtotal - discountAmount);
        
        // GST based on option
        let gstPercent = 0;
        let gstAmount = 0;
        if (form.gst_option === 'on') {
            gstPercent = 5;
            gstAmount = afterDiscount * 0.05;
        } else if (form.gst_option === 'custom') {
            gstPercent = form.custom_gst_percent;
            gstAmount = afterDiscount * (form.custom_gst_percent / 100);
        }
        
        const total = afterDiscount + gstAmount;
        
        // Calculate advance from payment splits or legacy
        let advancePaid = 0;
        if (form.payment_splits.length > 0) {
            advancePaid = form.payment_splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
        } else if (form.payment_received) {
            advancePaid = form.advance_amount;
        }
        
        const balanceDue = total - advancePaid;

        return { foodCharge, addonCharge, subtotal, discountAmount, gstPercent, gstAmount, total, advancePaid, balanceDue };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.customer_id || !form.hall_id || !form.event_type || !form.event_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate payment splits if used
        if (form.payment_splits.length > 0) {
            const estimate = calculateEstimate();
            const splitTotal = form.payment_splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
            if (splitTotal > estimate.total) {
                toast.error('Payment splits total cannot exceed the total amount');
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                payment_splits: form.payment_splits.map(s => ({
                    method: s.method,
                    amount: parseFloat(s.amount) || 0
                }))
            };

            if (isEditing) {
                await bookingsAPI.update(id, payload);
                toast.success('Booking updated');
            } else {
                await bookingsAPI.create(payload);
                toast.success('Booking created');
            }
            navigate('/dashboard/bookings');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save booking');
        } finally {
            setSaving(false);
        }
    };

    const toggleMenuItem = (itemId) => {
        setForm(prev => ({
            ...prev,
            menu_items: prev.menu_items.includes(itemId)
                ? prev.menu_items.filter(id => id !== itemId)
                : [...prev.menu_items, itemId]
        }));
    };

    const toggleAddon = (addonId) => {
        setForm(prev => ({
            ...prev,
            addons: prev.addons.includes(addonId)
                ? prev.addons.filter(id => id !== addonId)
                : [...prev.addons, addonId]
        }));
    };

    const setCustomPrice = (itemId, price) => {
        setForm(prev => ({
            ...prev,
            custom_menu_prices: {
                ...prev.custom_menu_prices,
                [itemId]: parseFloat(price) || 0
            }
        }));
    };

    const estimate = calculateEstimate();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6" data-testid="booking-form-page">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/bookings')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
                        {isEditing ? 'Edit Booking' : 'New Booking'}
                    </h1>
                    <p className="text-gray-600 mt-1">Fill in the details to create a booking</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading text-lg">Customer Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!showNewCustomerForm ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer *</label>
                                            <Select value={form.customer_id} onValueChange={value => setForm(prev => ({ ...prev, customer_id: value }))}>
                                                <SelectTrigger data-testid="customer-select">
                                                    <SelectValue placeholder="Choose a customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map(customer => (
                                                        <SelectItem key={customer.id} value={customer.id}>
                                                            {customer.name} - {customer.phone}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="button" variant="outline" onClick={() => setShowNewCustomerForm(true)} data-testid="add-customer-btn">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add New Customer
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                                <Input value={newCustomer.name} onChange={e => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} placeholder="Customer name" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                                <Input value={newCustomer.phone} onChange={e => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone number" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                            <Input type="email" value={newCustomer.email} onChange={e => setNewCustomer(prev => ({ ...prev, email: e.target.value }))} placeholder="Email address" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" onClick={handleCreateCustomer}>Save Customer</Button>
                                            <Button type="button" variant="outline" onClick={() => setShowNewCustomerForm(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Event Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading text-lg">Event Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hall *</label>
                                        <Select value={form.hall_id} onValueChange={value => setForm(prev => ({ ...prev, hall_id: value }))}>
                                            <SelectTrigger data-testid="hall-select">
                                                <SelectValue placeholder="Select hall" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {halls.map(hall => (
                                                    <SelectItem key={hall.id} value={hall.id}>
                                                        {hall.name} ({hall.capacity} guests)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                                        <Select value={form.event_type} onValueChange={value => setForm(prev => ({ ...prev, event_type: value }))}>
                                            <SelectTrigger data-testid="event-type-select">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {eventTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                                        <Input type="date" value={form.event_date} onChange={e => setForm(prev => ({ ...prev, event_date: e.target.value }))} data-testid="event-date" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot *</label>
                                        <Select value={form.slot} onValueChange={value => setForm(prev => ({ ...prev, slot: value }))}>
                                            <SelectTrigger data-testid="slot-select">
                                                <SelectValue placeholder="Select slot" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="day">Day Slot (10 AM - 5 PM)</SelectItem>
                                                <SelectItem value="night">Night Slot (8 PM - 1 AM)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count *</label>
                                        <div className="flex items-center gap-2">
                                            <Button type="button" variant="outline" size="icon" onClick={() => setForm(prev => ({ ...prev, guest_count: Math.max(10, prev.guest_count - 10) }))}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input type="number" value={form.guest_count} onChange={e => setForm(prev => ({ ...prev, guest_count: parseInt(e.target.value) || 0 }))} className="text-center" data-testid="guest-count" />
                                            <Button type="button" variant="outline" size="icon" onClick={() => setForm(prev => ({ ...prev, guest_count: prev.guest_count + 10 }))}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <Select value={form.status} onValueChange={value => setForm(prev => ({ ...prev, status: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {bookingStatuses.map(status => (
                                                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Menu Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading text-lg">Menu Selection</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {menuItems.map(item => (
                                        <div 
                                            key={item.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                form.menu_items.includes(item.id) 
                                                    ? 'border-fuchsia-500 bg-fuchsia-50 ring-2 ring-fuchsia-200' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => toggleMenuItem(item.id)}
                                            data-testid={`menu-item-${item.id}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={`w-4 h-4 mt-0.5 rounded-sm border flex items-center justify-center shrink-0 ${form.menu_items.includes(item.id) ? 'bg-fuchsia-600 border-fuchsia-600 text-white' : 'border-gray-300'}`}>
                                                    {form.menu_items.includes(item.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500">{item.category}</p>
                                                    <p className="text-sm font-bold text-fuchsia-600">
                                                        {item.pricing_type === 'fixed' ? formatCurrency(item.price_per_plate) : `₹${item.price_per_plate}/plate`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add-ons */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading text-lg">Add-ons & Services</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    {addons.map(addon => (
                                        <div 
                                            key={addon.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                form.addons.includes(addon.id) 
                                                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => toggleAddon(addon.id)}
                                            data-testid={`addon-${addon.id}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={`w-4 h-4 mt-0.5 rounded-sm border flex items-center justify-center shrink-0 ${form.addons.includes(addon.id) ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300'}`}>
                                                    {form.addons.includes(addon.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{addon.name}</p>
                                                    <p className="text-sm font-bold text-amber-600">{formatCurrency(addon.price_per_plate)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Discount & GST */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading text-lg">Discount & GST Options</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Discount */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type</label>
                                        <Select value={form.discount_type} onValueChange={value => setForm(prev => ({ ...prev, discount_type: value }))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="percent">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">{form.discount_type === 'percent' ? 'Discount %' : 'Discount Amount (₹)'}</label>
                                        <Input type="number" min="0" value={form.discount_value} onChange={e => setForm(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))} placeholder="0" data-testid="discount-value" />
                                    </div>
                                </div>
                                
                                {/* GST Options */}
                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Options</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'on', label: 'GST On (5%)' },
                                            { value: 'off', label: 'GST Off (0%)' },
                                            { value: 'custom', label: 'Custom %' }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, gst_option: opt.value }))}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                                    form.gst_option === opt.value 
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {form.gst_option === 'custom' && (
                                        <div className="mt-3">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Custom GST Percentage</label>
                                            <Input type="number" min="0" max="100" value={form.custom_gst_percent} onChange={e => setForm(prev => ({ ...prev, custom_gst_percent: parseFloat(e.target.value) || 0 }))} placeholder="5" className="w-32" />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Splits */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="font-heading text-lg flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-fuchsia-600" />
                                    Advance Payment (Split)
                                </CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addPaymentSplit}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Payment
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {form.payment_splits.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No advance payments added. Click "Add Payment" to record payments.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {form.payment_splits.map((split, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Method</label>
                                                        <Select value={split.method} onValueChange={v => updatePaymentSplit(idx, 'method', v)}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="cash">
                                                                    <div className="flex items-center gap-2">
                                                                        <IndianRupee className="h-4 w-4" />
                                                                        Cash
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="upi">
                                                                    <div className="flex items-center gap-2">
                                                                        <Wallet className="h-4 w-4" />
                                                                        UPI
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="credit">
                                                                    <div className="flex items-center gap-2">
                                                                        <CreditCard className="h-4 w-4" />
                                                                        Card
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
                                                        <Input type="number" min="0" value={split.amount} onChange={e => updatePaymentSplit(idx, 'amount', e.target.value)} placeholder="0" />
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => removePaymentSplit(idx)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <div className="flex justify-between pt-2 border-t font-medium">
                                            <span>Total Advance:</span>
                                            <span className="text-green-600">{formatCurrency(estimate.advancePaid)}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Special Requests */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading text-lg">Special Requests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea value={form.special_requests} onChange={e => setForm(prev => ({ ...prev, special_requests: e.target.value }))} placeholder="Any special requirements or notes..." rows={3} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Estimate Card */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader className="bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white rounded-t-lg">
                                <CardTitle className="font-heading">Cost Estimate</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Food ({form.guest_count} guests)</span>
                                        <span className="font-medium">{formatCurrency(estimate.foodCharge)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Add-ons</span>
                                        <span className="font-medium">{formatCurrency(estimate.addonCharge)}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(estimate.subtotal)}</span>
                                    </div>
                                    {form.discount_value > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount {form.discount_type === 'percent' ? `(${form.discount_value}%)` : '(Fixed)'}</span>
                                            <span>-{formatCurrency(estimate.discountAmount)}</span>
                                        </div>
                                    )}
                                    {estimate.gstPercent > 0 && (
                                        <div className="flex justify-between text-blue-600">
                                            <span>GST ({estimate.gstPercent}%)</span>
                                            <span>+{formatCurrency(estimate.gstAmount)}</span>
                                        </div>
                                    )}
                                    {form.gst_option === 'off' && (
                                        <div className="flex justify-between text-gray-400">
                                            <span>GST</span>
                                            <span>OFF</span>
                                        </div>
                                    )}
                                    <hr />
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total Amount</span>
                                        <span className="text-fuchsia-600">{formatCurrency(estimate.total)}</span>
                                    </div>
                                    {estimate.advancePaid > 0 && (
                                        <>
                                            <div className="flex justify-between text-green-600">
                                                <span>Advance Paid</span>
                                                <span>{formatCurrency(estimate.advancePaid)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold text-orange-600">
                                                <span>Balance Due</span>
                                                <span>{formatCurrency(Math.max(0, estimate.balanceDue))}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <Button type="submit" className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl" disabled={saving} data-testid="save-booking-btn">
                                    {saving ? 'Saving...' : (isEditing ? 'Update Booking' : 'Create Booking')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BookingFormPage;
