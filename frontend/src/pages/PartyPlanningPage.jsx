import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users, Truck, Music, Palette, ChefHat, User, IndianRupee, CheckCircle, Calendar, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { bookingsAPI, vendorAPI, partyPlanningAPI, customersAPI, hallsAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const PartyPlanningPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    
    const [confirmedBookings, setConfirmedBookings] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [customers, setCustomers] = useState({});
    const [halls, setHalls] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [planDialogOpen, setPlanDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [planForm, setPlanForm] = useState({
        booking_id: '',
        dj_vendor_id: '',
        decor_vendor_id: '',
        catering_vendor_id: '',
        custom_vendors: [],
        staff_assignments: [],
        notes: ''
    });

    const staffRoles = [
        { value: 'waiter', label: 'Waiter', icon: User },
        { value: 'chef', label: 'Chef', icon: ChefHat },
        { value: 'helper', label: 'Helper', icon: Users },
        { value: 'supervisor', label: 'Supervisor', icon: Users },
        { value: 'custom', label: 'Other', icon: User }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, vendorsRes, customersRes, hallsRes] = await Promise.all([
                bookingsAPI.getConfirmed(),
                vendorAPI.getAll(),
                customersAPI.getAll(),
                hallsAPI.getAll()
            ]);
            setConfirmedBookings(bookingsRes.data);
            setVendors(vendorsRes.data);
            
            const customersMap = {};
            customersRes.data.forEach(c => customersMap[c.id] = c);
            setCustomers(customersMap);
            
            const hallsMap = {};
            hallsRes.data.forEach(h => hallsMap[h.id] = h);
            setHalls(hallsMap);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const getVendorsByType = (type) => {
        return vendors.filter(v => v.vendor_type?.toLowerCase().includes(type.toLowerCase()));
    };

    const openPlanDialog = (booking) => {
        setSelectedBooking(booking);
        if (booking.party_plan) {
            setPlanForm({
                booking_id: booking.id,
                dj_vendor_id: booking.party_plan.dj_vendor_id || '',
                decor_vendor_id: booking.party_plan.decor_vendor_id || '',
                catering_vendor_id: booking.party_plan.catering_vendor_id || '',
                custom_vendors: booking.party_plan.custom_vendors || [],
                staff_assignments: booking.party_plan.staff_assignments || [],
                notes: booking.party_plan.notes || ''
            });
        } else {
            setPlanForm({
                booking_id: booking.id,
                dj_vendor_id: '',
                decor_vendor_id: '',
                catering_vendor_id: '',
                custom_vendors: [],
                staff_assignments: [],
                notes: ''
            });
        }
        setPlanDialogOpen(true);
    };

    const addStaffMember = () => {
        setPlanForm(prev => ({
            ...prev,
            staff_assignments: [...prev.staff_assignments, { name: '', role: 'waiter', charge: 0 }]
        }));
    };

    const updateStaffMember = (index, field, value) => {
        setPlanForm(prev => {
            const staff = [...prev.staff_assignments];
            staff[index] = { ...staff[index], [field]: value };
            return { ...prev, staff_assignments: staff };
        });
    };

    const removeStaffMember = (index) => {
        setPlanForm(prev => ({
            ...prev,
            staff_assignments: prev.staff_assignments.filter((_, i) => i !== index)
        }));
    };

    const toggleCustomVendor = (vendorId) => {
        setPlanForm(prev => ({
            ...prev,
            custom_vendors: prev.custom_vendors.includes(vendorId)
                ? prev.custom_vendors.filter(id => id !== vendorId)
                : [...prev.custom_vendors, vendorId]
        }));
    };

    const handleSavePlan = async () => {
        if (!planForm.booking_id) return;
        
        setSaving(true);
        try {
            const payload = {
                ...planForm,
                dj_vendor_id: planForm.dj_vendor_id || null,
                decor_vendor_id: planForm.decor_vendor_id || null,
                catering_vendor_id: planForm.catering_vendor_id || null,
                staff_assignments: planForm.staff_assignments.map(s => ({
                    name: s.name,
                    role: s.role,
                    charge: parseFloat(s.charge) || 0
                }))
            };
            
            if (selectedBooking.has_party_plan) {
                await partyPlanningAPI.update(planForm.booking_id, payload);
                toast.success('Party plan updated');
            } else {
                await partyPlanningAPI.create(payload);
                toast.success('Party plan created');
            }
            
            setPlanDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save party plan');
        } finally {
            setSaving(false);
        }
    };

    const totalStaffCharges = planForm.staff_assignments.reduce((sum, s) => sum + (parseFloat(s.charge) || 0), 0);

    const getCustomerName = (customerId) => customers[customerId]?.name || 'Unknown';
    const getHallName = (hallId) => halls[hallId]?.name || 'Unknown';
    const getVendorName = (vendorId) => vendors.find(v => v.id === vendorId)?.name || '';

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="p-8 text-center">
                    <CardContent>
                        <p className="text-gray-500">Admin access required for Party Planning.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="party-planning-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Party Planning</h1>
                    <p className="text-gray-600 mt-1">Assign vendors, staff, and manage event logistics</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-fuchsia-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-fuchsia-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-fuchsia-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Confirmed Events</p>
                                <p className="text-lg font-bold">{confirmedBookings.length}</p>
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
                                <p className="text-xs text-gray-500">Plans Created</p>
                                <p className="text-lg font-bold">{confirmedBookings.filter(b => b.has_party_plan).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Truck className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Available Vendors</p>
                                <p className="text-lg font-bold">{vendors.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Pending Plans</p>
                                <p className="text-lg font-bold">{confirmedBookings.filter(b => !b.has_party_plan).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmed Bookings */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-heading text-lg">Confirmed Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    {confirmedBookings.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No confirmed bookings yet</p>
                    ) : (
                        <div className="space-y-3">
                            {confirmedBookings.map((booking, idx) => (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`p-4 rounded-xl border-2 ${
                                        booking.has_party_plan 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-amber-50 border-amber-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                booking.has_party_plan ? 'bg-green-100' : 'bg-amber-100'
                                            }`}>
                                                {booking.has_party_plan ? (
                                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                                ) : (
                                                    <Calendar className="h-6 w-6 text-amber-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{getCustomerName(booking.customer_id)}</p>
                                                <p className="text-sm text-gray-500">{booking.booking_number}</p>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                                    <span>{booking.event_date}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{booking.slot}</span>
                                                    <span>•</span>
                                                    <span>{getHallName(booking.hall_id)}</span>
                                                    <span>•</span>
                                                    <span>{booking.guest_count} guests</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={booking.has_party_plan ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                                {booking.has_party_plan ? 'Plan Created' : 'Needs Planning'}
                                            </Badge>
                                            <Button 
                                                onClick={() => openPlanDialog(booking)}
                                                className={booking.has_party_plan 
                                                    ? 'bg-green-600 hover:bg-green-700' 
                                                    : 'bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600'
                                                }
                                            >
                                                {booking.has_party_plan ? 'Edit Plan' : 'Create Plan'}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {booking.has_party_plan && booking.party_plan && (
                                        <div className="mt-4 pt-4 border-t border-green-200">
                                            <div className="flex flex-wrap gap-3 text-sm">
                                                {booking.party_plan.dj_vendor_id && (
                                                    <Badge variant="outline" className="bg-white">
                                                        <Music className="h-3 w-3 mr-1" />
                                                        DJ: {getVendorName(booking.party_plan.dj_vendor_id)}
                                                    </Badge>
                                                )}
                                                {booking.party_plan.decor_vendor_id && (
                                                    <Badge variant="outline" className="bg-white">
                                                        <Palette className="h-3 w-3 mr-1" />
                                                        Decor: {getVendorName(booking.party_plan.decor_vendor_id)}
                                                    </Badge>
                                                )}
                                                {booking.party_plan.staff_assignments?.length > 0 && (
                                                    <Badge variant="outline" className="bg-white">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {booking.party_plan.staff_assignments.length} Staff
                                                    </Badge>
                                                )}
                                                {booking.party_plan.total_staff_charges > 0 && (
                                                    <Badge variant="outline" className="bg-white">
                                                        <IndianRupee className="h-3 w-3 mr-1" />
                                                        Staff: {formatCurrency(booking.party_plan.total_staff_charges)}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Party Plan Dialog */}
            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">
                            {selectedBooking?.has_party_plan ? 'Edit Party Plan' : 'Create Party Plan'}
                        </DialogTitle>
                        {selectedBooking && (
                            <p className="text-sm text-gray-500">
                                {getCustomerName(selectedBooking.customer_id)} • {selectedBooking.event_date} • {selectedBooking.guest_count} guests
                            </p>
                        )}
                    </DialogHeader>

                    <Tabs defaultValue="vendors" className="space-y-4">
                        <TabsList className="grid grid-cols-3 w-full">
                            <TabsTrigger value="vendors">Vendors</TabsTrigger>
                            <TabsTrigger value="staff">Staff & Waiters</TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                        </TabsList>

                        {/* Vendors Tab */}
                        <TabsContent value="vendors" className="space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                                {/* DJ Vendor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Music className="inline h-4 w-4 mr-1 text-purple-600" />
                                        DJ Vendor
                                    </label>
                                    <Select value={planForm.dj_vendor_id} onValueChange={v => setPlanForm(prev => ({ ...prev, dj_vendor_id: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select DJ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {getVendorsByType('dj').map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                            {vendors.filter(v => !v.vendor_type?.toLowerCase().includes('dj')).slice(0, 5).map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name} ({v.vendor_type})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Decor Vendor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Palette className="inline h-4 w-4 mr-1 text-pink-600" />
                                        Decor Vendor
                                    </label>
                                    <Select value={planForm.decor_vendor_id} onValueChange={v => setPlanForm(prev => ({ ...prev, decor_vendor_id: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Decor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {getVendorsByType('decor').map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                            {vendors.filter(v => !v.vendor_type?.toLowerCase().includes('decor')).slice(0, 5).map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name} ({v.vendor_type})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Catering Vendor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <ChefHat className="inline h-4 w-4 mr-1 text-amber-600" />
                                        Catering Vendor
                                    </label>
                                    <Select value={planForm.catering_vendor_id} onValueChange={v => setPlanForm(prev => ({ ...prev, catering_vendor_id: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Catering" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {getVendorsByType('cater').map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                            {vendors.filter(v => !v.vendor_type?.toLowerCase().includes('cater')).slice(0, 5).map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name} ({v.vendor_type})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Other Vendors */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Truck className="inline h-4 w-4 mr-1" />
                                    Other Vendors
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {vendors.map(v => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => toggleCustomVendor(v.id)}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                                                planForm.custom_vendors.includes(v.id)
                                                    ? 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700'
                                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Staff Tab */}
                        <TabsContent value="staff" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Staff Assignments</label>
                                <Button type="button" variant="outline" size="sm" onClick={addStaffMember}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Staff
                                </Button>
                            </div>

                            {planForm.staff_assignments.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No staff assigned. Click "Add Staff" to add waiters, chefs, etc.</p>
                            ) : (
                                <div className="space-y-3">
                                    {planForm.staff_assignments.map((staff, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1 grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                                                    <Input
                                                        value={staff.name}
                                                        onChange={e => updateStaffMember(idx, 'name', e.target.value)}
                                                        placeholder="Staff name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Role</label>
                                                    <Select value={staff.role} onValueChange={v => updateStaffMember(idx, 'role', v)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {staffRoles.map(role => (
                                                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Charge (₹)</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={staff.charge}
                                                        onChange={e => updateStaffMember(idx, 'charge', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => removeStaffMember(idx)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    <div className="flex justify-between pt-3 border-t font-medium">
                                        <span>Total Staff Charges:</span>
                                        <span className="text-fuchsia-600">{formatCurrency(totalStaffCharges)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">* Staff charges will be auto-added to booking expenses</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Notes Tab */}
                        <TabsContent value="notes" className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Planning Notes</label>
                                <Textarea
                                    value={planForm.notes}
                                    onChange={e => setPlanForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Add any notes about the event setup, timings, special instructions..."
                                    rows={6}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex gap-2 justify-end pt-4 border-t">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button 
                            onClick={handleSavePlan}
                            disabled={saving}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Plan'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PartyPlanningPage;
