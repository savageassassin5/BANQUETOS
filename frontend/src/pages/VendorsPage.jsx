import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit, Trash2, Phone, Mail, Search, Truck, Loader2, AlertTriangle,
    BookOpen, ArrowUpCircle, ArrowDownCircle, CreditCard, Receipt, X,
    Calendar, FileText, ChevronRight, TrendingUp, TrendingDown, Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SkeletonVendorCard, SkeletonFilterBar } from '../components/ui/skeletons';
import { vendorAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

const vendorTypes = [
    { value: 'decor', label: 'Decoration', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-100', text: 'text-pink-600' },
    { value: 'dj_sound', label: 'DJ & Sound', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-100', text: 'text-violet-600' },
    { value: 'flower', label: 'Flowers', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    { value: 'lighting', label: 'Lighting', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-100', text: 'text-amber-600' },
    { value: 'catering', label: 'Catering', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-100', text: 'text-cyan-600' },
    { value: 'photography', label: 'Photography', color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { value: 'other', label: 'Other', color: 'from-slate-500 to-gray-500', bg: 'bg-slate-100', text: 'text-slate-600' }
];

const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'card', label: 'Card' }
];

const VendorsPage = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [balanceFilter, setBalanceFilter] = useState('all');

    // Ledger modal state
    const [ledgerOpen, setLedgerOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [ledgerData, setLedgerData] = useState(null);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [txnFilter, setTxnFilter] = useState('all');

    // Transaction form state
    const [txnFormOpen, setTxnFormOpen] = useState(false);
    const [txnForm, setTxnForm] = useState({
        transaction_type: 'payment',
        amount: '',
        payment_method: 'cash',
        reference_id: '',
        note: ''
    });
    const [txnSaving, setTxnSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        vendor_type: 'decor',
        phone: '',
        email: '',
        address: '',
        services: [],
        base_rate: 0
    });
    const [serviceInput, setServiceInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        loadVendors();
    }, []);

    const loadVendors = async () => {
        try {
            const res = await vendorAPI.getDirectory();
            setVendors(res.data);
        } catch (error) {
            console.error('Failed to load vendors:', error);
            toast.error('Failed to load vendors');
        } finally {
            setLoading(false);
        }
    };

    const loadLedger = async (vendor) => {
        setSelectedVendor(vendor);
        setLedgerOpen(true);
        setLedgerLoading(true);
        try {
            const res = await vendorAPI.getLedger(vendor.id);
            setLedgerData(res.data);
        } catch (error) {
            console.error('Failed to load ledger:', error);
            toast.error('Failed to load vendor ledger');
        } finally {
            setLedgerLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', vendor_type: 'decor', phone: '', email: '', address: '', services: [], base_rate: 0 });
        setEditingVendor(null);
        setServiceInput('');
    };

    const handleEdit = (vendor) => {
        setEditingVendor(vendor);
        setForm({
            name: vendor.name,
            vendor_type: vendor.vendor_type,
            phone: vendor.phone,
            email: vendor.email || '',
            address: vendor.address || '',
            services: vendor.services || [],
            base_rate: vendor.base_rate || 0
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingVendor) {
                await vendorAPI.update(editingVendor.id, form);
                toast.success('Vendor updated successfully!');
            } else {
                await vendorAPI.create(form);
                toast.success('Vendor created successfully!');
            }
            loadVendors();
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Failed to save vendor');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await vendorAPI.delete(id);
            toast.success('Vendor deleted');
            loadVendors();
        } catch (error) {
            toast.error('Failed to delete vendor');
        } finally {
            setDeleting(null);
        }
    };

    const handleTxnSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVendor || !txnForm.amount) return;
        
        setTxnSaving(true);
        try {
            await vendorAPI.createTransaction(selectedVendor.id, {
                vendor_id: selectedVendor.id,
                transaction_type: txnForm.transaction_type,
                amount: parseFloat(txnForm.amount),
                payment_method: txnForm.transaction_type === 'payment' ? txnForm.payment_method : null,
                reference_id: txnForm.reference_id || null,
                note: txnForm.note
            });
            toast.success('Transaction recorded successfully!');
            setTxnFormOpen(false);
            setTxnForm({ transaction_type: 'payment', amount: '', payment_method: 'cash', reference_id: '', note: '' });
            loadLedger(selectedVendor);
            loadVendors();
        } catch (error) {
            toast.error('Failed to record transaction');
        } finally {
            setTxnSaving(false);
        }
    };

    const addService = () => {
        if (serviceInput.trim()) {
            setForm(prev => ({ ...prev, services: [...prev.services, serviceInput.trim()] }));
            setServiceInput('');
        }
    };

    const removeService = (index) => {
        setForm(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }));
    };

    // Calculate totals
    const totalPayable = vendors.filter(v => v.balance_type === 'payable').reduce((sum, v) => sum + (v.balance_display || 0), 0);
    const totalReceivable = vendors.filter(v => v.balance_type === 'receivable').reduce((sum, v) => sum + (v.balance_display || 0), 0);

    const filteredVendors = vendors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             v.services?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = typeFilter === 'all' || v.vendor_type === typeFilter;
        const matchesBalance = balanceFilter === 'all' || v.balance_type === balanceFilter;
        return matchesSearch && matchesType && matchesBalance;
    });

    const filteredTransactions = ledgerData?.transactions?.filter(t => 
        txnFilter === 'all' || t.transaction_type === txnFilter
    ) || [];

    const getTypeConfig = (type) => vendorTypes.find(t => t.value === type) || vendorTypes[vendorTypes.length - 1];

    const getBalanceBadge = (vendor) => {
        if (vendor.balance_type === 'payable') {
            return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Payable {formatCurrency(vendor.balance_display)}</Badge>;
        } else if (vendor.balance_type === 'receivable') {
            return <Badge className="bg-green-100 text-green-700 border-0 text-xs">Receivable {formatCurrency(vendor.balance_display)}</Badge>;
        }
        return <Badge className="bg-slate-100 text-slate-600 border-0 text-xs">Settled</Badge>;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };
    
    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
    };

    if (loading) {
        return (
            <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="vendors-page">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-10 w-32 bg-slate-100 rounded animate-pulse" />
                        <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-32 bg-slate-100 rounded-xl animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
                <SkeletonFilterBar />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (<SkeletonVendorCard key={i} />))}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible" data-testid="vendors-page">
            {/* Header */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div className="p-2 bg-fuchsia-100 rounded-xl" whileHover={{ rotate: 10, scale: 1.1 }}>
                            <Truck className="h-6 w-6 text-fuchsia-600" />
                        </motion.div>
                        <h1 className="font-heading text-3xl md:text-4xl font-bold bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                            Vendors
                        </h1>
                    </div>
                    <p className="text-slate-500">Manage vendors & track payments</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl shadow-lg" onClick={resetForm} data-testid="add-vendor-btn">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Vendor
                            </Button>
                        </motion.div>
                    </DialogTrigger>
                    <DialogContent className="bg-white rounded-2xl max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-heading text-slate-800 text-xl">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Vendor Name</label>
                                <Input required value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="border-purple-200 focus:border-purple-400 rounded-xl" data-testid="vendor-name" placeholder="Enter vendor name" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Type</label>
                                    <Select value={form.vendor_type} onValueChange={value => setForm(prev => ({ ...prev, vendor_type: value }))}>
                                        <SelectTrigger className="border-purple-200 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {vendorTypes.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Base Rate (₹)</label>
                                    <Input type="number" value={form.base_rate} onChange={e => setForm(prev => ({ ...prev, base_rate: parseFloat(e.target.value) || 0 }))} className="border-purple-200 rounded-xl" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Phone</label>
                                    <Input required value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} className="border-purple-200 rounded-xl" placeholder="+91 XXXXX XXXXX" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Email</label>
                                    <Input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} className="border-purple-200 rounded-xl" placeholder="vendor@email.com" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Address</label>
                                <Input value={form.address} onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))} className="border-purple-200 rounded-xl" placeholder="Full address" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Services</label>
                                <div className="flex gap-2 mb-2">
                                    <Input value={serviceInput} onChange={e => setServiceInput(e.target.value)} placeholder="Add service" className="border-purple-200 rounded-xl" onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addService())} />
                                    <Button type="button" variant="outline" onClick={addService} className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {form.services.map((service, idx) => (
                                        <Badge key={idx} className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer rounded-full px-3" onClick={() => removeService(idx)}>{service} ×</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className="border-slate-200 rounded-xl">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl min-w-[140px]" data-testid="save-vendor-btn">
                                    {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>) : (`${editingVendor ? 'Update' : 'Create'} Vendor`)}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Balance Summary Cards */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Total Payable</p>
                                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPayable)}</p>
                                <p className="text-xs text-red-500 mt-1">You owe vendors</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Total Receivable</p>
                                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalReceivable)}</p>
                                <p className="text-xs text-green-500 mt-1">Vendors owe you</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl">
                                <TrendingDown className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Net Balance</p>
                                <p className={`text-2xl font-bold ${totalPayable > totalReceivable ? 'text-red-700' : 'text-green-700'}`}>
                                    {formatCurrency(Math.abs(totalPayable - totalReceivable))}
                                </p>
                                <p className="text-xs text-purple-500 mt-1">
                                    {totalPayable > totalReceivable ? 'Net payable' : totalPayable < totalReceivable ? 'Net receivable' : 'All settled'}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Wallet className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card className="bg-white border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input placeholder="Search vendors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-11 border-purple-200 focus:border-purple-400 rounded-xl" />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full md:w-40 border-purple-200 rounded-xl"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Types</SelectItem>
                                    {vendorTypes.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
                                </SelectContent>
                            </Select>
                            <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                                <SelectTrigger className="w-full md:w-40 border-purple-200 rounded-xl"><SelectValue placeholder="Balance" /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Balances</SelectItem>
                                    <SelectItem value="payable">Payable</SelectItem>
                                    <SelectItem value="receivable">Receivable</SelectItem>
                                    <SelectItem value="settled">Settled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Vendors Grid */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map((vendor, idx) => {
                    const typeConfig = getTypeConfig(vendor.vendor_type);
                    return (
                        <motion.div key={vendor.id} variants={cardVariants} initial="hidden" animate="visible" whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, delay: idx * 0.05 }}>
                            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all" data-testid={`vendor-card-${vendor.id}`}>
                                <div className={`h-2 bg-gradient-to-r ${typeConfig.color}`} />
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <motion.div className={`w-12 h-12 rounded-xl ${typeConfig.bg} flex items-center justify-center`} whileHover={{ rotate: 10 }}>
                                                <Truck className={`h-6 w-6 ${typeConfig.text}`} />
                                            </motion.div>
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{vendor.name}</h3>
                                                <Badge className={`${typeConfig.bg} ${typeConfig.text} border-0 text-xs mt-1 rounded-full`}>{typeConfig.label}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(vendor)} className="text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl" disabled={deleting === vendor.id}>
                                                        {deleting === vendor.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Delete Vendor</AlertDialogTitle>
                                                        <AlertDialogDescription>Are you sure you want to delete <strong>{vendor.name}</strong>? This action cannot be undone.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(vendor.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>

                                    {/* Balance Badge */}
                                    <div className="mb-3">
                                        {getBalanceBadge(vendor)}
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Phone className="h-4 w-4" />
                                            <span>{vendor.phone}</span>
                                        </div>
                                        {vendor.email && (
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Mail className="h-4 w-4" />
                                                <span className="truncate">{vendor.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    {vendor.services?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {vendor.services.slice(0, 3).map((service, i) => (
                                                <Badge key={i} variant="outline" className="border-slate-200 text-slate-500 text-xs rounded-full">{service}</Badge>
                                            ))}
                                            {vendor.services.length > 3 && (
                                                <Badge variant="outline" className="border-slate-200 text-slate-400 text-xs rounded-full">+{vendor.services.length - 3}</Badge>
                                            )}
                                        </div>
                                    )}

                                    <div className="border-t border-slate-100 pt-4">
                                        <div className="grid grid-cols-2 gap-4 text-center mb-4">
                                            <div>
                                                <p className="text-lg font-bold text-slate-700">{vendor.total_events || 0}</p>
                                                <p className="text-xs text-slate-400 uppercase tracking-wider">Events</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{formatCurrency(vendor.base_rate)}</p>
                                                <p className="text-xs text-slate-400 uppercase tracking-wider">Base Rate</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl" onClick={() => loadLedger(vendor)} data-testid={`view-ledger-${vendor.id}`}>
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            View Ledger
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>

            {filteredVendors.length === 0 && (
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                    <Card className="bg-white border-0 shadow-lg rounded-2xl">
                        <CardContent className="py-16 text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                                <Truck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            </motion.div>
                            <p className="text-slate-400 text-lg">No vendors found</p>
                            <p className="text-slate-300 text-sm">Add your first vendor to get started</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Ledger Modal */}
            <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
                <DialogContent className="bg-white rounded-2xl max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${selectedVendor ? getTypeConfig(selectedVendor.vendor_type).bg : 'bg-slate-100'} flex items-center justify-center`}>
                                    <Truck className={`h-5 w-5 ${selectedVendor ? getTypeConfig(selectedVendor.vendor_type).text : 'text-slate-500'}`} />
                                </div>
                                <div>
                                    <DialogTitle className="font-heading text-slate-800 text-xl">{selectedVendor?.name}</DialogTitle>
                                    <p className="text-sm text-slate-500">Transaction Ledger</p>
                                </div>
                            </div>
                            {ledgerData?.summary && (
                                <div className={`px-4 py-2 rounded-xl ${ledgerData.summary.balance_type === 'payable' ? 'bg-red-100' : ledgerData.summary.balance_type === 'receivable' ? 'bg-green-100' : 'bg-slate-100'}`}>
                                    <p className="text-xs uppercase tracking-wider text-slate-500">Balance</p>
                                    <p className={`text-lg font-bold ${ledgerData.summary.balance_type === 'payable' ? 'text-red-700' : ledgerData.summary.balance_type === 'receivable' ? 'text-green-700' : 'text-slate-700'}`}>
                                        {formatCurrency(Math.abs(ledgerData.summary.balance))}
                                    </p>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    {ledgerLoading ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        </div>
                    ) : ledgerData ? (
                        <div className="flex-1 overflow-y-auto">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl m-4">
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 uppercase">Debits</p>
                                    <p className="text-lg font-semibold text-red-600">{formatCurrency(ledgerData.summary.total_debits)}</p>
                                </div>
                                <div className="text-center border-x border-slate-200">
                                    <p className="text-xs text-slate-500 uppercase">Credits</p>
                                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(ledgerData.summary.total_credits)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 uppercase">Payments</p>
                                    <p className="text-lg font-semibold text-green-600">{formatCurrency(ledgerData.summary.total_payments)}</p>
                                </div>
                            </div>

                            {/* Filter & Add Transaction */}
                            <div className="flex items-center justify-between px-4 mb-4">
                                <Tabs value={txnFilter} onValueChange={setTxnFilter} className="w-auto">
                                    <TabsList className="bg-slate-100 rounded-xl p-1">
                                        <TabsTrigger value="all" className="rounded-lg text-xs px-3">All</TabsTrigger>
                                        <TabsTrigger value="debit" className="rounded-lg text-xs px-3">Debits</TabsTrigger>
                                        <TabsTrigger value="credit" className="rounded-lg text-xs px-3">Credits</TabsTrigger>
                                        <TabsTrigger value="payment" className="rounded-lg text-xs px-3">Payments</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Button size="sm" onClick={() => setTxnFormOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl" data-testid="add-transaction-btn">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Transaction
                                </Button>
                            </div>

                            {/* Transactions List */}
                            <div className="px-4 pb-4 space-y-2">
                                {filteredTransactions.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                        <p>No transactions found</p>
                                    </div>
                                ) : (
                                    filteredTransactions.map(txn => (
                                        <div key={txn.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    txn.transaction_type === 'debit' ? 'bg-red-100' : 
                                                    txn.transaction_type === 'credit' ? 'bg-blue-100' : 'bg-green-100'
                                                }`}>
                                                    {txn.transaction_type === 'debit' ? <ArrowUpCircle className="h-5 w-5 text-red-600" /> :
                                                     txn.transaction_type === 'credit' ? <ArrowDownCircle className="h-5 w-5 text-blue-600" /> :
                                                     <CreditCard className="h-5 w-5 text-green-600" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 capitalize">{txn.transaction_type}</p>
                                                    <p className="text-xs text-slate-500">{txn.note || 'No description'}</p>
                                                    {txn.booking_number && (
                                                        <p className="text-xs text-purple-600">Booking: {txn.booking_number}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${
                                                    txn.transaction_type === 'debit' ? 'text-red-600' : 
                                                    txn.transaction_type === 'credit' ? 'text-blue-600' : 'text-green-600'
                                                }`}>
                                                    {txn.transaction_type === 'debit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                                </p>
                                                <p className="text-xs text-slate-400">{txn.transaction_date}</p>
                                                {txn.payment_method && (
                                                    <p className="text-xs text-slate-500 capitalize">{txn.payment_method.replace('_', ' ')}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Transaction Form Modal */}
            <Dialog open={txnFormOpen} onOpenChange={setTxnFormOpen}>
                <DialogContent className="bg-white rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-slate-800 text-xl">Record Transaction</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTxnSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Transaction Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'debit', label: 'Debit', icon: ArrowUpCircle, color: 'red', desc: 'You owe them' },
                                    { value: 'credit', label: 'Credit', icon: ArrowDownCircle, color: 'blue', desc: 'They owe you' },
                                    { value: 'payment', label: 'Payment', icon: CreditCard, color: 'green', desc: 'Pay vendor' }
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setTxnForm(prev => ({ ...prev, transaction_type: type.value }))}
                                        className={`p-3 rounded-xl border-2 transition-all ${
                                            txnForm.transaction_type === type.value 
                                                ? `border-${type.color}-500 bg-${type.color}-50` 
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <type.icon className={`h-6 w-6 mx-auto mb-1 ${txnForm.transaction_type === type.value ? `text-${type.color}-600` : 'text-slate-400'}`} />
                                        <p className="text-sm font-medium">{type.label}</p>
                                        <p className="text-xs text-slate-400">{type.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Amount (₹)</label>
                            <Input 
                                type="number" 
                                required 
                                value={txnForm.amount} 
                                onChange={e => setTxnForm(prev => ({ ...prev, amount: e.target.value }))} 
                                className="border-purple-200 rounded-xl text-lg" 
                                placeholder="0.00"
                                data-testid="txn-amount"
                            />
                        </div>
                        {txnForm.transaction_type === 'payment' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Payment Method</label>
                                    <Select value={txnForm.payment_method} onValueChange={value => setTxnForm(prev => ({ ...prev, payment_method: value }))}>
                                        <SelectTrigger className="border-purple-200 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {paymentMethods.map(m => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Reference ID</label>
                                    <Input 
                                        value={txnForm.reference_id} 
                                        onChange={e => setTxnForm(prev => ({ ...prev, reference_id: e.target.value }))} 
                                        className="border-purple-200 rounded-xl" 
                                        placeholder="UTR / Cheque No"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Note</label>
                            <Input 
                                value={txnForm.note} 
                                onChange={e => setTxnForm(prev => ({ ...prev, note: e.target.value }))} 
                                className="border-purple-200 rounded-xl" 
                                placeholder="Description or reference"
                            />
                        </div>
                        <div className="flex gap-2 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => setTxnFormOpen(false)} className="border-slate-200 rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={txnSaving || !txnForm.amount} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl min-w-[140px]" data-testid="save-transaction-btn">
                                {txnSaving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>) : 'Save Transaction'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default VendorsPage;
