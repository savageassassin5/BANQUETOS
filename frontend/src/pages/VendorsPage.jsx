import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Phone, Mail, Search, Truck, DollarSign, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { StatusBadge } from '../components/ui/status-badge';
import { SaveFeedback, useSaveState } from '../components/ui/save-feedback';
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

const VendorsPage = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

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

    useEffect(() => {
        loadVendors();
    }, []);

    const loadVendors = async () => {
        try {
            const res = await vendorAPI.getAll();
            setVendors(res.data);
        } catch (error) {
            console.error('Failed to load vendors:', error);
        } finally {
            setLoading(false);
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
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vendor?')) return;
        try {
            await vendorAPI.delete(id);
            toast.success('Vendor deleted');
            loadVendors();
        } catch (error) {
            toast.error('Failed to delete vendor');
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

    const filteredVendors = vendors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             v.services?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = typeFilter === 'all' || v.vendor_type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeConfig = (type) => vendorTypes.find(t => t.value === type) || vendorTypes[vendorTypes.length - 1];

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
            data-testid="vendors-page"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div
                            className="p-2 bg-fuchsia-100 rounded-xl"
                            whileHover={{ rotate: 10, scale: 1.1 }}
                        >
                            <Truck className="h-6 w-6 text-fuchsia-600" />
                        </motion.div>
                        <h1 className="font-heading text-3xl md:text-4xl font-bold bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                            Vendors
                        </h1>
                    </div>
                    <p className="text-slate-500">Manage your service vendors and partners</p>
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
                                        <SelectTrigger className="border-purple-200 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {vendorTypes.map(type => (
                                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                            ))}
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
                                <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl" data-testid="save-vendor-btn">
                                    {editingVendor ? 'Update' : 'Create'} Vendor
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants}>
                <Card className="bg-white border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input placeholder="Search vendors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-11 border-purple-200 focus:border-purple-400 rounded-xl" />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full md:w-48 border-purple-200 rounded-xl">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Types</SelectItem>
                                    {vendorTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Vendors Grid */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map((vendor, idx) => {
                    const typeConfig = getTypeConfig(vendor.vendor_type);
                    return (
                        <motion.div 
                            key={vendor.id} 
                            whileHover={{ y: -4, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all" data-testid={`vendor-card-${vendor.id}`}>
                                <div className={`h-2 bg-gradient-to-r ${typeConfig.color}`} />
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <motion.div 
                                                className={`w-12 h-12 rounded-xl ${typeConfig.bg} flex items-center justify-center`}
                                                whileHover={{ rotate: 10 }}
                                            >
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
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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

                                    <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{formatCurrency(vendor.base_rate)}</p>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Base Rate</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-slate-700">{vendor.total_events || 0}</p>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Events</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-emerald-600">{formatCurrency(vendor.total_earned || 0)}</p>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Earned</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>

            {filteredVendors.length === 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="bg-white border-0 shadow-lg rounded-2xl">
                        <CardContent className="py-16 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                <Truck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            </motion.div>
                            <p className="text-slate-400 text-lg">No vendors found</p>
                            <p className="text-slate-300 text-sm">Add your first vendor to get started</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
};

export default VendorsPage;
