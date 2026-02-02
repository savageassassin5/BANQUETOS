import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, IndianRupee, Users, Package, Truck, FileText, AlertCircle, CheckCircle, Lock, Unlock, Save, X, CreditCard, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { bookingsAPI, vendorAPI, customersAPI, partyExpensesAPI, vendorPaymentsAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const ExpensesPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState({});
    const [vendors, setVendors] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isBookingLocked, setIsBookingLocked] = useState(false);
    const [bookingExpenses, setBookingExpenses] = useState([]);
    const [pendingExpenses, setPendingExpenses] = useState([]);
    const [vendorBalanceSheet, setVendorBalanceSheet] = useState([]);
    const [allVendorPayments, setAllVendorPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingExpenses, setSavingExpenses] = useState(false);
    const [activeTab, setActiveTab] = useState('party-expenses');
    const [vendorPaymentDialogOpen, setVendorPaymentDialogOpen] = useState(false);
    const [addPayableDialogOpen, setAddPayableDialogOpen] = useState(false);
    const [customExpenseName, setCustomExpenseName] = useState('');
    
    // Inline expense form
    const [newExpense, setNewExpense] = useState({
        expense_name: '',
        amount: '',
        notes: ''
    });
    
    // Vendor payment form
    const [vendorPaymentForm, setVendorPaymentForm] = useState({
        vendor_id: '',
        booking_id: '',
        amount: '',
        payment_mode: 'cash',
        payment_type: 'advance',
        description: ''
    });
    
    // Add payable form
    const [addPayableForm, setAddPayableForm] = useState({
        vendor_id: '',
        amount: '',
        description: ''
    });
    
    // Vendor expense linking
    const [linkedVendorId, setLinkedVendorId] = useState('');

    const expenseCategories = [
        'Raw Material',
        'Decoration',
        'Labor',
        'Transportation',
        'Equipment Rental',
        'Catering Supplies',
        'Flowers',
        'Lighting',
        'Sound/DJ',
        'Photography',
        'Videography',
        'Tent/Pandal',
        'Generator',
        'Security',
        'Cleaning',
        'Vendor Payment',
        'Miscellaneous',
        'Custom'
    ];

    const paymentTypes = [
        { value: 'advance', label: 'Advance' },
        { value: 'partial', label: 'Partial' },
        { value: 'final', label: 'Final' }
    ];

    const paymentModes = [
        { value: 'cash', label: 'Cash' },
        { value: 'upi', label: 'UPI' },
        { value: 'credit', label: 'Card/Credit' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedBooking) {
            loadBookingExpenses(selectedBooking);
        } else {
            setBookingExpenses([]);
            setPendingExpenses([]);
        }
    }, [selectedBooking]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, vendorsRes, customersRes] = await Promise.all([
                bookingsAPI.getAll(),
                vendorAPI.getAll(),
                customersAPI.getAll()
            ]);
            setBookings(bookingsRes.data);
            setVendors(vendorsRes.data);
            
            const customersMap = {};
            customersRes.data.forEach(c => customersMap[c.id] = c);
            setCustomers(customersMap);
            
            if (isAdmin) {
                await loadVendorData();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadVendorData = async () => {
        try {
            const [balanceRes, paymentsRes] = await Promise.all([
                vendorPaymentsAPI.getBalanceSheet(),
                vendorPaymentsAPI.getAll()
            ]);
            setVendorBalanceSheet(balanceRes.data);
            setAllVendorPayments(paymentsRes.data);
        } catch (e) {
            console.error('Failed to load vendor data:', e);
        }
    };

    const loadBookingExpenses = async (bookingId) => {
        try {
            const res = await partyExpensesAPI.getAll(bookingId);
            setBookingExpenses(res.data);
        } catch (error) {
            console.error('Failed to load expenses:', error);
            setBookingExpenses([]);
        }
    };

    const handleBookingSelect = (bookingId) => {
        if (isBookingLocked) return;
        setSelectedBooking(bookingId);
        setPendingExpenses([]);
        setNewExpense({ expense_name: '', amount: '', notes: '' });
        setCustomExpenseName('');
    };

    const handleLockBooking = () => {
        if (!selectedBooking) {
            toast.error('Please select a booking first');
            return;
        }
        setIsBookingLocked(true);
        toast.success('Booking locked. You can now add expenses.');
    };

    const handleUnlockBooking = () => {
        if (pendingExpenses.length > 0) {
            if (!window.confirm('You have unsaved expenses. Unlock will discard them. Continue?')) {
                return;
            }
        }
        setIsBookingLocked(false);
        setPendingExpenses([]);
        toast.info('Booking unlocked');
    };

    const handleAddExpenseInline = () => {
        let expenseName = newExpense.expense_name;
        if (newExpense.expense_name === 'Custom' && customExpenseName.trim()) {
            expenseName = customExpenseName.trim();
        }
        
        if (!expenseName || !newExpense.amount || parseFloat(newExpense.amount) <= 0) {
            toast.error('Please enter expense name and valid amount');
            return;
        }
        
        const expense = {
            id: `temp-${Date.now()}`,
            expense_name: expenseName,
            amount: parseFloat(newExpense.amount),
            notes: newExpense.notes,
            isPending: true
        };
        
        setPendingExpenses(prev => [...prev, expense]);
        setNewExpense({ expense_name: '', amount: '', notes: '' });
        setCustomExpenseName('');
        toast.success('Expense added to list');
    };

    const handleRemovePendingExpense = (tempId) => {
        setPendingExpenses(prev => prev.filter(e => e.id !== tempId));
    };

    const handleSaveAllExpenses = async () => {
        if (pendingExpenses.length === 0) {
            toast.error('No expenses to save');
            return;
        }
        
        setSavingExpenses(true);
        try {
            for (const expense of pendingExpenses) {
                await partyExpensesAPI.create({
                    booking_id: selectedBooking,
                    expense_name: expense.expense_name,
                    amount: expense.amount,
                    notes: expense.notes
                });
            }
            toast.success(`${pendingExpenses.length} expense(s) saved successfully!`);
            setPendingExpenses([]);
            await loadBookingExpenses(selectedBooking);
            await loadData();
        } catch (error) {
            toast.error('Failed to save expenses');
        } finally {
            setSavingExpenses(false);
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm('Delete this expense?')) return;
        
        try {
            await partyExpensesAPI.delete(expenseId);
            toast.success('Expense deleted');
            await loadBookingExpenses(selectedBooking);
            await loadData();
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const handleAddVendorPayment = async (e) => {
        e.preventDefault();
        if (!vendorPaymentForm.vendor_id || !vendorPaymentForm.amount || parseFloat(vendorPaymentForm.amount) <= 0) {
            toast.error('Please select vendor and enter valid amount');
            return;
        }
        
        try {
            await vendorPaymentsAPI.create({
                vendor_id: vendorPaymentForm.vendor_id,
                booking_id: vendorPaymentForm.booking_id === 'none' ? null : (vendorPaymentForm.booking_id || null),
                amount: parseFloat(vendorPaymentForm.amount),
                payment_mode: vendorPaymentForm.payment_mode,
                description: `${vendorPaymentForm.payment_type.charAt(0).toUpperCase() + vendorPaymentForm.payment_type.slice(1)} - ${vendorPaymentForm.description || 'Payment'}`
            });
            toast.success('Payment recorded successfully');
            setVendorPaymentDialogOpen(false);
            setVendorPaymentForm({ vendor_id: '', booking_id: '', amount: '', payment_mode: 'cash', payment_type: 'advance', description: '' });
            await loadVendorData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to record payment');
        }
    };

    const handleAddPayable = async (e) => {
        e.preventDefault();
        if (!addPayableForm.vendor_id || !addPayableForm.amount || parseFloat(addPayableForm.amount) <= 0) {
            toast.error('Please select vendor and enter valid amount');
            return;
        }
        
        try {
            await vendorPaymentsAPI.addPayable(
                addPayableForm.vendor_id,
                parseFloat(addPayableForm.amount),
                addPayableForm.description || 'Added payable'
            );
            toast.success('Payable amount added to vendor');
            setAddPayableDialogOpen(false);
            setAddPayableForm({ vendor_id: '', amount: '', description: '' });
            await loadVendorData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to add payable');
        }
    };

    const getCustomerName = (customerId) => customers[customerId]?.name || 'Unknown';
    const selectedBookingData = selectedBooking ? bookings.find(b => b.id === selectedBooking) : null;
    
    // Calculations
    const savedExpensesTotal = bookingExpenses.reduce((sum, e) => sum + e.amount, 0);
    const pendingExpensesTotal = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = savedExpensesTotal + pendingExpensesTotal;
    const netProfit = selectedBookingData ? selectedBookingData.total_amount - savedExpensesTotal : 0;
    
    // Vendor totals
    const totalOutstanding = vendorBalanceSheet.reduce((sum, v) => sum + (v.outstanding_balance || 0), 0);
    const totalPaid = vendorBalanceSheet.reduce((sum, v) => sum + (v.total_paid || 0), 0);
    const totalPayable = vendorBalanceSheet.reduce((sum, v) => sum + (v.total_payable || 0), 0);

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="p-8 text-center">
                    <CardContent>
                        <p className="text-gray-500">Admin access required.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600" />
            </div>
        );
    }

    return (
        <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Expenses Management</h1>
                    <p className="text-gray-600 mt-1">Track party expenses, vendor payments & outstanding balances</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <IndianRupee className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Vendor Payable</p>
                                <p className="text-lg font-bold">{formatCurrency(totalPayable)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Vendor Paid</p>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Outstanding</p>
                                <p className="text-lg font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Active Vendors</p>
                                <p className="text-lg font-bold">{vendors.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="party-expenses" className="data-[state=active]:bg-white">
                        <Package className="h-4 w-4 mr-2" />
                        Party Expenses
                    </TabsTrigger>
                    <TabsTrigger value="vendor-payments" className="data-[state=active]:bg-white">
                        <Truck className="h-4 w-4 mr-2" />
                        Vendor Payments
                    </TabsTrigger>
                    <TabsTrigger value="outstanding" className="data-[state=active]:bg-white">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Outstanding
                    </TabsTrigger>
                </TabsList>

                {/* Party Expenses Tab */}
                <TabsContent value="party-expenses" className="space-y-6">
                    {/* Booking Selection with Lock */}
                    <Card className={isBookingLocked ? 'border-2 border-fuchsia-500 bg-fuchsia-50/30' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-fuchsia-600" />
                                    {isBookingLocked ? 'Selected Booking (Locked)' : 'Select Booking'}
                                </CardTitle>
                                <div className="flex gap-2">
                                    {!isBookingLocked ? (
                                        <Button 
                                            onClick={handleLockBooking}
                                            disabled={!selectedBooking}
                                            className="bg-fuchsia-600 hover:bg-fuchsia-700"
                                            size="sm"
                                        >
                                            <Lock className="h-4 w-4 mr-1" />
                                            Lock & Add Expenses
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={handleUnlockBooking}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Unlock className="h-4 w-4 mr-1" />
                                            Unlock
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!isBookingLocked ? (
                                <Select value={selectedBooking || ''} onValueChange={handleBookingSelect}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose a booking to add expenses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bookings.filter(b => b.status !== 'cancelled').map(booking => (
                                            <SelectItem key={booking.id} value={booking.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm">{booking.booking_number}</span>
                                                    <span className="text-gray-500">|</span>
                                                    <span className="font-medium">{getCustomerName(booking.customer_id)}</span>
                                                    <span className="text-gray-500">|</span>
                                                    <span className="text-sm">{booking.event_date}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : selectedBookingData && (
                                <div className="bg-white rounded-lg p-4 border-2 border-fuchsia-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Booking ID</p>
                                            <p className="font-mono font-medium">{selectedBookingData.booking_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Customer</p>
                                            <p className="font-medium">{getCustomerName(selectedBookingData.customer_id)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Event Date</p>
                                            <p className="font-medium">{selectedBookingData.event_date}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Total Amount</p>
                                            <p className="font-bold text-green-600">{formatCurrency(selectedBookingData.total_amount)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Inline Expense Entry (Only when locked) */}
                    {isBookingLocked && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Add Expenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-3 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                                        <Select 
                                            value={newExpense.expense_name} 
                                            onValueChange={v => setNewExpense(prev => ({ ...prev, expense_name: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {expenseCategories.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {newExpense.expense_name === 'Custom' && (
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Custom Name</label>
                                            <Input
                                                value={customExpenseName}
                                                onChange={e => setCustomExpenseName(e.target.value)}
                                                placeholder="Enter expense name"
                                            />
                                        </div>
                                    )}
                                    <div className="w-full md:w-32">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={newExpense.amount}
                                            onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes (Optional)</label>
                                        <Input
                                            value={newExpense.notes}
                                            onChange={e => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Notes..."
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleAddExpenseInline}
                                        className="bg-fuchsia-600 hover:bg-fuchsia-700"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Expenses List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pending Expenses (Unsaved) */}
                        {pendingExpenses.length > 0 && (
                            <Card className="border-2 border-yellow-400 bg-yellow-50/30">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
                                        <AlertCircle className="h-5 w-5" />
                                        Unsaved Expenses ({pendingExpenses.length})
                                    </CardTitle>
                                    <Button 
                                        onClick={handleSaveAllExpenses}
                                        disabled={savingExpenses}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        {savingExpenses ? 'Saving...' : 'Save All'}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {pendingExpenses.map((expense) => (
                                            <div key={expense.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                                                <div>
                                                    <p className="font-medium">{expense.expense_name}</p>
                                                    {expense.notes && <p className="text-sm text-gray-500">{expense.notes}</p>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-yellow-700">{formatCurrency(expense.amount)}</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 h-8 w-8"
                                                        onClick={() => handleRemovePendingExpense(expense.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-yellow-300">
                                            <div className="flex justify-between font-bold">
                                                <span>Pending Total:</span>
                                                <span className="text-yellow-700">{formatCurrency(pendingExpensesTotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Saved Expenses */}
                        <Card className={pendingExpenses.length === 0 ? 'lg:col-span-2' : ''}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    Saved Expenses ({bookingExpenses.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!selectedBooking ? (
                                    <p className="text-center text-gray-500 py-8">Select and lock a booking to manage expenses</p>
                                ) : bookingExpenses.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No saved expenses yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {bookingExpenses.map((expense) => (
                                            <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{expense.expense_name}</p>
                                                    {expense.notes && <p className="text-sm text-gray-500">{expense.notes}</p>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 h-8 w-8"
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t">
                                            <div className="flex justify-between font-bold">
                                                <span>Saved Total:</span>
                                                <span className="text-red-600">{formatCurrency(savedExpensesTotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Profit Summary */}
                    {selectedBookingData && (
                        <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Profit Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-white rounded-lg text-center">
                                        <p className="text-sm text-gray-500">Total Revenue</p>
                                        <p className="text-xl font-bold text-green-600">{formatCurrency(selectedBookingData.total_amount)}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg text-center">
                                        <p className="text-sm text-gray-500">Advance Received</p>
                                        <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedBookingData.advance_paid)}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg text-center">
                                        <p className="text-sm text-gray-500">Total Expenses</p>
                                        <p className="text-xl font-bold text-red-600">{formatCurrency(savedExpensesTotal)}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg text-center">
                                        <p className="text-sm text-gray-500">Net Profit</p>
                                        <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(netProfit)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Vendor Payments Tab */}
                <TabsContent value="vendor-payments" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Truck className="h-5 w-5 text-fuchsia-600" />
                                Vendor Ledger
                            </CardTitle>
                            <div className="flex gap-2">
                                <Dialog open={addPayableDialogOpen} onOpenChange={setAddPayableDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="border-fuchsia-300 text-fuchsia-600 hover:bg-fuchsia-50">
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Payable
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Vendor Payable Amount</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddPayable} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Vendor *</label>
                                                <Select value={addPayableForm.vendor_id} onValueChange={v => setAddPayableForm(prev => ({ ...prev, vendor_id: v }))}>
                                                    <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                                                    <SelectContent>
                                                        {vendors.map(v => (
                                                            <SelectItem key={v.id} value={v.id}>{v.name} ({v.vendor_type})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                                                <Input type="number" min="0" value={addPayableForm.amount} onChange={e => setAddPayableForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Description</label>
                                                <Input value={addPayableForm.description} onChange={e => setAddPayableForm(prev => ({ ...prev, description: e.target.value }))} placeholder="e.g., DJ for Wedding" />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                                <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700">Add Payable</Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                <Dialog open={vendorPaymentDialogOpen} onOpenChange={setVendorPaymentDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600">
                                            <Wallet className="h-4 w-4 mr-1" />
                                            Record Payment
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Record Vendor Payment</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddVendorPayment} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Vendor *</label>
                                                <Select value={vendorPaymentForm.vendor_id} onValueChange={v => setVendorPaymentForm(prev => ({ ...prev, vendor_id: v }))}>
                                                    <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                                                    <SelectContent>
                                                        {vendors.map(v => {
                                                            const vb = vendorBalanceSheet.find(x => x.vendor_id === v.id);
                                                            return (
                                                                <SelectItem key={v.id} value={v.id}>
                                                                    <div className="flex justify-between items-center w-full">
                                                                        <span>{v.name}</span>
                                                                        {vb && vb.outstanding_balance > 0 && (
                                                                            <span className="text-xs text-red-500 ml-2">Due: {formatCurrency(vb.outstanding_balance)}</span>
                                                                        )}
                                                                    </div>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Link to Booking (Optional)</label>
                                                <Select value={vendorPaymentForm.booking_id} onValueChange={v => setVendorPaymentForm(prev => ({ ...prev, booking_id: v }))}>
                                                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No specific booking</SelectItem>
                                                        {bookings.filter(b => b.status !== 'cancelled').map(b => (
                                                            <SelectItem key={b.id} value={b.id}>{b.booking_number} - {getCustomerName(b.customer_id)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Payment Type</label>
                                                    <Select value={vendorPaymentForm.payment_type} onValueChange={v => setVendorPaymentForm(prev => ({ ...prev, payment_type: v }))}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {paymentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Mode</label>
                                                    <Select value={vendorPaymentForm.payment_mode} onValueChange={v => setVendorPaymentForm(prev => ({ ...prev, payment_mode: v }))}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {paymentModes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                                                <Input type="number" min="0" value={vendorPaymentForm.amount} onChange={e => setVendorPaymentForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Description</label>
                                                <Textarea value={vendorPaymentForm.description} onChange={e => setVendorPaymentForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Payment notes" rows={2} />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                                <Button type="submit" className="bg-gradient-to-r from-fuchsia-600 to-pink-500">Record Payment</Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {vendorBalanceSheet.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No vendors added yet</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-gray-50">
                                                <th className="text-left py-3 px-4 font-medium">Vendor</th>
                                                <th className="text-left py-3 px-4 font-medium">Type</th>
                                                <th className="text-center py-3 px-4 font-medium">Parties</th>
                                                <th className="text-right py-3 px-4 font-medium">Total Payable</th>
                                                <th className="text-right py-3 px-4 font-medium">Total Paid</th>
                                                <th className="text-right py-3 px-4 font-medium">Outstanding</th>
                                                <th className="text-center py-3 px-4 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vendorBalanceSheet.map((vendor) => (
                                                <tr key={vendor.vendor_id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <p className="font-medium">{vendor.vendor_name}</p>
                                                        {vendor.phone && <p className="text-xs text-gray-500">{vendor.phone}</p>}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline">{vendor.vendor_type}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge className="bg-purple-100 text-purple-700">{vendor.parties_count || 0}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(vendor.total_payable)}</td>
                                                    <td className="py-3 px-4 text-right text-green-600 font-medium">{formatCurrency(vendor.total_paid)}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={vendor.outstanding_balance > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-medium'}>
                                                            {formatCurrency(vendor.outstanding_balance)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {vendor.outstanding_balance === 0 ? (
                                                            <Badge className="bg-green-100 text-green-700">Cleared</Badge>
                                                        ) : vendor.total_paid > 0 ? (
                                                            <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-700">Pending</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-100 font-bold">
                                                <td colSpan="3" className="py-3 px-4">TOTAL</td>
                                                <td className="py-3 px-4 text-right">{formatCurrency(totalPayable)}</td>
                                                <td className="py-3 px-4 text-right text-green-600">{formatCurrency(totalPaid)}</td>
                                                <td className="py-3 px-4 text-right text-red-600">{formatCurrency(totalOutstanding)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Payments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {allVendorPayments.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No payments recorded</p>
                            ) : (
                                <div className="space-y-2">
                                    {allVendorPayments.slice(0, 10).map((payment) => {
                                        const vendor = vendors.find(v => v.id === payment.vendor_id);
                                        return (
                                            <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{vendor?.name || 'Unknown'}</p>
                                                    <p className="text-sm text-gray-500">{payment.description || 'Payment'}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">{payment.payment_mode}</Badge>
                                                        <span className="text-xs text-gray-400">{new Date(payment.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-green-600">{formatCurrency(payment.amount)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Outstanding Tab */}
                <TabsContent value="outstanding" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                Outstanding Vendor Balances
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {vendorBalanceSheet.filter(v => v.outstanding_balance > 0).length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-xl font-medium text-gray-700">All Clear!</p>
                                    <p className="text-gray-500">No outstanding vendor payments</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {vendorBalanceSheet.filter(v => v.outstanding_balance > 0).sort((a, b) => b.outstanding_balance - a.outstanding_balance).map((vendor) => (
                                        <div key={vendor.vendor_id} className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-lg">{vendor.vendor_name}</p>
                                                    <p className="text-sm text-gray-600">{vendor.vendor_type}</p>
                                                    {vendor.phone && <p className="text-xs text-gray-500">{vendor.phone}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">Outstanding</p>
                                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(vendor.outstanding_balance)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-red-200 grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Total Payable:</span>
                                                    <span className="font-medium ml-1">{formatCurrency(vendor.total_payable)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Paid:</span>
                                                    <span className="font-medium text-green-600 ml-1">{formatCurrency(vendor.total_paid)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Parties:</span>
                                                    <span className="font-medium ml-1">{vendor.parties_count || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary Card */}
                    <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                <div>
                                    <p className="text-sm text-gray-600">Total Outstanding</p>
                                    <p className="text-3xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Vendors with Dues</p>
                                    <p className="text-3xl font-bold text-orange-600">{vendorBalanceSheet.filter(v => v.outstanding_balance > 0).length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Cleared Vendors</p>
                                    <p className="text-3xl font-bold text-green-600">{vendorBalanceSheet.filter(v => v.outstanding_balance === 0 && v.total_payable > 0).length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};

export default ExpensesPage;
