import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Users, Truck, Music, Palette, ChefHat, User, IndianRupee, 
    CheckCircle, Calendar, Save, AlertTriangle, Clock, RefreshCw, Target,
    FileText, Activity, Sparkles, TrendingUp, AlertCircle, CheckCircle2,
    Building2, UserCheck, Clipboard, Play, Circle, Phone, Mail, Minus, X,
    Camera, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { StatusBadge } from '../components/ui/status-badge';
import { SaveFeedback, useSaveState } from '../components/ui/save-feedback';
import { IntelligenceCue } from '../components/ui/intelligence-cue';
import { SkeletonPartyPlanning, SkeletonEventCard, SkeletonStaffRow, SkeletonVendorRow } from '../components/ui/skeletons';
import { bookingsAPI, vendorAPI, partyPlanningAPI, customersAPI, hallsAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

// Vendor category configurations with auto-generated checklist items
const vendorCategories = {
    dj_sound: {
        label: 'DJ / Sound',
        icon: Music,
        color: 'purple',
        checklistItems: ['Confirm playlist with client', 'Confirm arrival time', 'Test sound system']
    },
    decor: {
        label: 'Decoration',
        icon: Palette,
        color: 'pink',
        checklistItems: ['Finalize theme', 'Confirm stage setup time', 'Arrange flower delivery']
    },
    catering: {
        label: 'Catering',
        icon: ChefHat,
        color: 'orange',
        checklistItems: ['Finalize menu', 'Confirm veg/non-veg split', 'Set serving time']
    },
    photography: {
        label: 'Photography',
        icon: Camera,
        color: 'indigo',
        checklistItems: ['Confirm coverage timeline', 'Pre-wedding shoot date']
    },
    flower: {
        label: 'Flowers',
        icon: Palette,
        color: 'emerald',
        checklistItems: ['Confirm flower arrangement', 'Delivery timing']
    },
    lighting: {
        label: 'Lighting',
        icon: Sparkles,
        color: 'amber',
        checklistItems: ['Setup timing', 'Power requirements']
    },
    other: {
        label: 'Other',
        icon: Truck,
        color: 'slate',
        checklistItems: []
    }
};

// Vendor status lifecycle
const vendorStatuses = ['invited', 'confirmed', 'arrived', 'completed', 'paid'];

// Staff suggestion templates based on event type
const staffTemplates = {
    wedding: {
        base: { waiter: 10, chef: 3, helper: 5, supervisor: 2 },
        perGuest: { waiter: 0.08, helper: 0.03 }
    },
    birthday: {
        base: { waiter: 4, chef: 1, helper: 2, supervisor: 1 },
        perGuest: { waiter: 0.04, helper: 0.02 }
    },
    corporate: {
        base: { waiter: 6, chef: 2, helper: 3, supervisor: 1 },
        perGuest: { waiter: 0.05, helper: 0.02 }
    },
    default: {
        base: { waiter: 6, chef: 2, helper: 3, supervisor: 1 },
        perGuest: { waiter: 0.06, helper: 0.03 }
    }
};

const PartyPlanningPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'tenant_admin';
    
    // Core state
    const [confirmedBookings, setConfirmedBookings] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [customers, setCustomers] = useState({});
    const [halls, setHalls] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Selected booking and plan state
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [hasPlan, setHasPlan] = useState(false);
    const [planDialogOpen, setPlanDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useSaveState();
    
    // Booking change tracking
    const [bookingChanged, setBookingChanged] = useState(false);
    const [changeWarnings, setChangeWarnings] = useState([]);
    
    // Advanced features state
    const [profitSnapshot, setProfitSnapshot] = useState(null);
    const [staffSuggestions, setStaffSuggestions] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    
    // Vendor management state
    const [vendorAssignments, setVendorAssignments] = useState([]);
    const [showAddVendor, setShowAddVendor] = useState(false);
    const [newVendorMode, setNewVendorMode] = useState('select'); // 'select', 'new', 'other'
    const [newVendorForm, setNewVendorForm] = useState({
        name: '', phone: '', email: '', category: 'other', cost: 0, advance: 0, notes: '', status: 'invited'
    });
    
    // Plan form
    const [planForm, setPlanForm] = useState({
        booking_id: '',
        dj_vendor_id: '',
        decor_vendor_id: '',
        catering_vendor_id: '',
        custom_vendors: [],
        vendor_assignments: [],
        staff_assignments: [],
        timeline_tasks: [],
        inventory: {},
        setup_notes: '',
        menu_execution: {},
        notes: ''
    });

    const staffRoles = [
        { value: 'waiter', label: 'Waiter', icon: User, defaultWage: 500 },
        { value: 'chef', label: 'Chef', icon: ChefHat, defaultWage: 800 },
        { value: 'helper', label: 'Helper', icon: Users, defaultWage: 400 },
        { value: 'supervisor', label: 'Supervisor', icon: UserCheck, defaultWage: 1000 },
        { value: 'usher', label: 'Usher', icon: User, defaultWage: 450 },
        { value: 'custom', label: 'Other', icon: User, defaultWage: 500 }
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

    // Load plan by booking ID using the new API
    const loadPlanByBooking = useCallback(async (bookingId) => {
        try {
            const res = await partyPlanningAPI.getByBooking(bookingId);
            setSelectedBooking(res.data.booking);
            setCurrentPlan(res.data.plan);
            setHasPlan(res.data.has_plan);
            setBookingChanged(res.data.plan?.booking_changed || false);
            setChangeWarnings(res.data.plan?.change_warnings || []);
            
            if (res.data.plan) {
                setPlanForm({
                    booking_id: bookingId,
                    dj_vendor_id: res.data.plan.dj_vendor_id || '',
                    decor_vendor_id: res.data.plan.decor_vendor_id || '',
                    catering_vendor_id: res.data.plan.catering_vendor_id || '',
                    custom_vendors: res.data.plan.custom_vendors || [],
                    vendor_assignments: res.data.plan.vendor_assignments || [],
                    staff_assignments: res.data.plan.staff_assignments || [],
                    timeline_tasks: res.data.plan.timeline_tasks || [],
                    inventory: res.data.plan.inventory || {},
                    setup_notes: res.data.plan.setup_notes || '',
                    menu_execution: res.data.plan.menu_execution || {},
                    notes: res.data.plan.notes || ''
                });
                setVendorAssignments(res.data.plan.vendor_assignments || []);
            } else {
                // Reset form for new plan
                setPlanForm({
                    booking_id: bookingId,
                    dj_vendor_id: '',
                    decor_vendor_id: '',
                    catering_vendor_id: '',
                    custom_vendors: [],
                    vendor_assignments: [],
                    staff_assignments: [],
                    timeline_tasks: [],
                    inventory: {},
                    setup_notes: '',
                    menu_execution: {},
                    notes: ''
                });
                setVendorAssignments([]);
            }
            
            // Load profit snapshot
            try {
                const profitRes = await partyPlanningAPI.getProfitSnapshot(bookingId);
                setProfitSnapshot(profitRes.data);
            } catch (e) {
                console.error('Failed to load profit snapshot:', e);
            }
            
        } catch (error) {
            toast.error('Failed to load party plan');
            console.error(error);
        }
    }, []);

    const openPlanDialog = async (booking) => {
        await loadPlanByBooking(booking.id);
        setPlanDialogOpen(true);
    };

    // Enhanced staff management with smart suggestions
    const addStaffMember = () => {
        const defaultShifts = selectedBooking?.time_slot === 'Day' 
            ? { shift_start: '09:00', shift_end: '17:00' }
            : { shift_start: '17:00', shift_end: '23:00' };
        
        setPlanForm(prev => ({
            ...prev,
            staff_assignments: [...prev.staff_assignments, { 
                role: 'waiter', 
                count: 1, 
                wage_type: 'fixed',
                wage: 500,
                ...defaultShifts,
                assigned_names: [],
                attendance: 'pending',
                notes: ''
            }]
        }));
    };

    const updateStaffMember = (index, field, value) => {
        setPlanForm(prev => {
            const staff = [...prev.staff_assignments];
            staff[index] = { ...staff[index], [field]: value };
            return { ...prev, staff_assignments: staff };
        });
    };

    const incrementStaffCount = (index) => {
        updateStaffMember(index, 'count', (planForm.staff_assignments[index]?.count || 1) + 1);
    };

    const decrementStaffCount = (index) => {
        const current = planForm.staff_assignments[index]?.count || 1;
        if (current > 1) {
            updateStaffMember(index, 'count', current - 1);
        }
    };

    const removeStaffMember = (index) => {
        setPlanForm(prev => ({
            ...prev,
            staff_assignments: prev.staff_assignments.filter((_, i) => i !== index)
        }));
    };

    // Smart staff suggestions based on event type and guest count
    const generateSmartStaffPlan = () => {
        if (!selectedBooking) return;
        
        const guestCount = selectedBooking.guest_count || 100;
        const eventType = selectedBooking.event_type?.toLowerCase() || 'default';
        const template = staffTemplates[eventType] || staffTemplates.default;
        const slot = selectedBooking.time_slot;
        
        const defaultShifts = slot === 'Day' 
            ? { shift_start: '09:00', shift_end: '17:00' }
            : { shift_start: '17:00', shift_end: '23:00' };
        
        const suggestions = [];
        
        // Calculate counts based on template
        Object.entries(template.base).forEach(([role, baseCount]) => {
            const perGuest = template.perGuest[role] || 0;
            const calculatedCount = Math.ceil(baseCount + (guestCount * perGuest));
            const roleInfo = staffRoles.find(r => r.value === role);
            
            suggestions.push({
                role,
                count: calculatedCount,
                wage_type: 'fixed',
                wage: roleInfo?.defaultWage || 500,
                ...defaultShifts,
                assigned_names: [],
                attendance: 'pending',
                notes: ''
            });
        });
        
        setPlanForm(prev => ({ ...prev, staff_assignments: suggestions }));
        toast.success(`Smart staff plan generated for ${guestCount} guests (${eventType})`);
    };

    // Apply staff suggestions from API
    const applyStaffSuggestions = async () => {
        if (!selectedBooking) return;
        try {
            const res = await partyPlanningAPI.suggestStaff(selectedBooking.id);
            setPlanForm(prev => ({
                ...prev,
                staff_assignments: res.data.suggestions
            }));
            toast.success('Staff suggestions applied');
        } catch (error) {
            // Fallback to local calculation
            generateSmartStaffPlan();
        }
    };

    // Calculate total staff cost
    const totalStaffCost = useMemo(() => {
        return planForm.staff_assignments.reduce((sum, s) => {
            return sum + ((s.count || 0) * (s.wage || 0));
        }, 0);
    }, [planForm.staff_assignments]);

    // Check for understaffing
    const staffingWarnings = useMemo(() => {
        if (!selectedBooking) return [];
        const warnings = [];
        const guestCount = selectedBooking.guest_count || 100;
        const eventType = selectedBooking.event_type?.toLowerCase() || 'default';
        const template = staffTemplates[eventType] || staffTemplates.default;
        
        const currentCounts = planForm.staff_assignments.reduce((acc, s) => {
            acc[s.role] = (acc[s.role] || 0) + s.count;
            return acc;
        }, {});
        
        Object.entries(template.base).forEach(([role, baseCount]) => {
            const perGuest = template.perGuest[role] || 0;
            const suggested = Math.ceil(baseCount + (guestCount * perGuest));
            const current = currentCounts[role] || 0;
            
            if (current < suggested * 0.7) {
                warnings.push({
                    role,
                    current,
                    suggested,
                    message: `${role.charAt(0).toUpperCase() + role.slice(1)}s may be insufficient (${current}/${suggested})`
                });
            }
        });
        
        return warnings;
    }, [planForm.staff_assignments, selectedBooking]);

    // Vendor management functions
    const addVendorAssignment = (vendorData) => {
        // Check for duplicate category
        const existingCategory = vendorAssignments.find(v => v.category === vendorData.category);
        if (existingCategory && vendorData.category !== 'other') {
            toast.error(`A ${vendorCategories[vendorData.category]?.label || vendorData.category} vendor is already assigned`);
            return;
        }
        
        // Auto-add checklist items for this category
        const categoryConfig = vendorCategories[vendorData.category] || vendorCategories.other;
        const newChecklistItems = categoryConfig.checklistItems.map(item => ({
            id: `${vendorData.category}-${Date.now()}-${Math.random()}`,
            task: item,
            status: 'pending',
            category: vendorData.category
        }));
        
        const newAssignment = {
            id: `vendor-${Date.now()}`,
            ...vendorData,
            status: vendorData.status || 'invited'
        };
        
        setVendorAssignments(prev => [...prev, newAssignment]);
        setPlanForm(prev => ({
            ...prev,
            vendor_assignments: [...(prev.vendor_assignments || []), newAssignment],
            timeline_tasks: [...(prev.timeline_tasks || []), ...newChecklistItems]
        }));
        
        setShowAddVendor(false);
        resetNewVendorForm();
        toast.success('Vendor assigned');
    };

    const updateVendorStatus = (vendorId, newStatus) => {
        setVendorAssignments(prev => prev.map(v => 
            v.id === vendorId ? { ...v, status: newStatus } : v
        ));
        setPlanForm(prev => ({
            ...prev,
            vendor_assignments: (prev.vendor_assignments || []).map(v => 
                v.id === vendorId ? { ...v, status: newStatus } : v
            )
        }));
    };

    const removeVendorAssignment = (vendorId) => {
        setVendorAssignments(prev => prev.filter(v => v.id !== vendorId));
        setPlanForm(prev => ({
            ...prev,
            vendor_assignments: (prev.vendor_assignments || []).filter(v => v.id !== vendorId)
        }));
        toast.success('Vendor removed');
    };

    const resetNewVendorForm = () => {
        setNewVendorForm({
            name: '', phone: '', email: '', category: 'other', cost: 0, advance: 0, notes: '', status: 'invited'
        });
        setNewVendorMode('select');
    };

    // Calculate vendor costs
    const totalVendorCost = useMemo(() => {
        return vendorAssignments.reduce((sum, v) => sum + (v.cost || 0), 0);
    }, [vendorAssignments]);

    const vendorBalance = useMemo(() => {
        return vendorAssignments.reduce((sum, v) => sum + ((v.cost || 0) - (v.advance || 0)), 0);
    }, [vendorAssignments]);

    // Check for unconfirmed vendors near event date
    const vendorWarnings = useMemo(() => {
        if (!selectedBooking) return [];
        const eventDate = new Date(selectedBooking.event_date);
        const today = new Date();
        const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilEvent <= 7) {
            return vendorAssignments
                .filter(v => v.status === 'invited')
                .map(v => ({
                    vendor: v.name || vendorCategories[v.category]?.label || v.category,
                    daysUntilEvent,
                    message: `${v.name || v.category} not confirmed - event in ${daysUntilEvent} days`
                }));
        }
        return [];
    }, [vendorAssignments, selectedBooking]);

    // Timeline management
    const updateTimelineTask = async (taskId, newStatus) => {
        if (!selectedBooking) return;
        try {
            await partyPlanningAPI.updateTimelineTask(selectedBooking.id, taskId, newStatus);
            // Refresh plan
            await loadPlanByBooking(selectedBooking.id);
            toast.success('Task updated');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const regenerateTimeline = async () => {
        if (!selectedBooking) return;
        try {
            const res = await partyPlanningAPI.generateTimeline(selectedBooking.id);
            setPlanForm(prev => ({
                ...prev,
                timeline_tasks: res.data.timeline
            }));
            toast.success('Timeline regenerated');
        } catch (error) {
            toast.error('Failed to regenerate timeline');
        }
    };

    // Acknowledge booking changes
    const acknowledgeChanges = async () => {
        if (!selectedBooking) return;
        try {
            await partyPlanningAPI.acknowledgeChanges(selectedBooking.id);
            setBookingChanged(false);
            setChangeWarnings([]);
            toast.success('Changes acknowledged');
        } catch (error) {
            toast.error('Failed to acknowledge changes');
        }
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
        setSaveStatus('saving');
        try {
            const payload = {
                ...planForm,
                dj_vendor_id: planForm.dj_vendor_id || null,
                decor_vendor_id: planForm.decor_vendor_id || null,
                catering_vendor_id: planForm.catering_vendor_id || null,
                vendor_assignments: vendorAssignments,
                staff_assignments: planForm.staff_assignments.map(s => ({
                    role: s.role,
                    count: parseInt(s.count) || 1,
                    wage_type: s.wage_type || 'fixed',
                    wage: parseFloat(s.wage) || 0,
                    shift_start: s.shift_start || '',
                    shift_end: s.shift_end || '',
                    assigned_names: s.assigned_names || [],
                    attendance: s.attendance || 'pending',
                    notes: s.notes || ''
                }))
            };
            
            if (hasPlan) {
                await partyPlanningAPI.update(planForm.booking_id, payload);
            } else {
                await partyPlanningAPI.create(payload);
            }
            
            setSaveStatus('saved');
            toast.success(hasPlan ? 'Party plan updated' : 'Party plan created');
            setPlanDialogOpen(false);
            loadData();
        } catch (error) {
            setSaveStatus('error');
            toast.error(error.response?.data?.detail || 'Failed to save party plan');
        } finally {
            setSaving(false);
        }
    };

    // Calculate totals
    const totalStaffCharges = planForm.staff_assignments.reduce((sum, s) => {
        const count = parseInt(s.count) || 1;
        const wage = parseFloat(s.wage) || 0;
        return sum + (count * wage);
    }, 0);

    const getCustomerName = (customerId) => customers[customerId]?.name || 'Unknown';
    const getHallName = (hallId) => halls[hallId]?.name || 'Unknown';
    const getVendorName = (vendorId) => vendors.find(v => v.id === vendorId)?.name || '';

    // Readiness score badge
    const ReadinessScore = ({ score, breakdown }) => {
        const color = score >= 80 ? 'green' : score >= 50 ? 'amber' : 'red';
        return (
            <div className="flex items-center gap-2">
                <div className={`text-${color}-600 font-bold text-xl`}>{score}%</div>
                <div className="text-xs text-gray-500">Ready</div>
            </div>
        );
    };

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
        return <SkeletonPartyPlanning />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Party Planning</h1>
                    <p className="text-gray-500 text-sm">Event operations brain - coordinate vendors, staff & logistics</p>
                </div>
            </div>

            {/* Info Banner */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-100 rounded-2xl p-4"
            >
                <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-fuchsia-600 mt-0.5" />
                    <div>
                        <p className="text-sm text-fuchsia-800 font-medium">Plan every event detail</p>
                        <p className="text-xs text-fuchsia-600">Select a booking to coordinate vendors, staff, timeline, and track profitability</p>
                    </div>
                </div>
            </motion.div>

            {/* Bookings Grid */}
            {confirmedBookings.length === 0 ? (
                <Card className="p-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No confirmed bookings to plan.</p>
                    <p className="text-sm text-gray-400 mt-1">Confirm bookings to start party planning.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {confirmedBookings.map((booking, index) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className={`cursor-pointer hover:shadow-lg transition-all border-2 ${
                                booking.has_party_plan ? 'border-green-200 bg-green-50/30' : 'border-transparent hover:border-fuchsia-200'
                            }`}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs font-mono">
                                                    {booking.booking_number}
                                                </Badge>
                                                {booking.has_party_plan && (
                                                    <Badge className="bg-green-100 text-green-700 text-xs">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Planned
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900">
                                                {getCustomerName(booking.customer_id)}
                                            </h3>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span>{booking.event_date}</span>
                                            <Badge variant="secondary" className="text-xs capitalize">{booking.slot}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            <span>{getHallName(booking.hall_id)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            <span>{booking.guest_count} guests</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-gray-400" />
                                            <span className="capitalize">{booking.event_type}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(booking.total_amount)}
                                        </span>
                                        <Button
                                            size="sm"
                                            onClick={() => openPlanDialog(booking)}
                                            className={booking.has_party_plan 
                                                ? "bg-green-600 hover:bg-green-700" 
                                                : "bg-fuchsia-600 hover:bg-fuchsia-700"
                                            }
                                        >
                                            {booking.has_party_plan ? 'View Plan' : 'Create Plan'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Plan Dialog */}
            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
                                <Clipboard className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <div className="text-xl font-bold">
                                    {hasPlan ? 'Edit Party Plan' : 'Create Party Plan'}
                                </div>
                                {selectedBooking && (
                                    <div className="text-sm font-normal text-gray-500">
                                        {selectedBooking.booking_number} • {getCustomerName(selectedBooking.customer_id)}
                                    </div>
                                )}
                            </div>
                            {currentPlan?.readiness_score !== undefined && (
                                <div className="ml-auto">
                                    <ReadinessScore score={currentPlan.readiness_score} />
                                </div>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Booking Change Warning */}
                    {bookingChanged && changeWarnings.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4"
                        >
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-amber-800">Booking details changed — review plan</p>
                                    <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                                        {changeWarnings.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                </div>
                                <Button size="sm" variant="outline" onClick={acknowledgeChanges} className="text-amber-700 border-amber-300">
                                    Acknowledge
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Booking Summary Header */}
                    {selectedBooking && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block text-xs">Event</span>
                                    <span className="font-medium capitalize">{selectedBooking.event_type}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs">Date</span>
                                    <span className="font-medium">{selectedBooking.event_date}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs">Slot</span>
                                    <span className="font-medium capitalize">{selectedBooking.slot}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs">Guests</span>
                                    <span className="font-medium">{selectedBooking.guest_count}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs">Hall</span>
                                    <span className="font-medium">{getHallName(selectedBooking.hall_id)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-5 mb-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="vendors">Vendors</TabsTrigger>
                            <TabsTrigger value="staff">Staff</TabsTrigger>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="profit">Profit</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Readiness Card */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Target className="h-4 w-4 text-fuchsia-600" />
                                            Event Readiness
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-fuchsia-600">
                                            {currentPlan?.readiness_score || 0}%
                                        </div>
                                        {currentPlan?.readiness_breakdown && (
                                            <div className="mt-3 space-y-2">
                                                {Object.entries(currentPlan.readiness_breakdown).map(([key, value]) => (
                                                    <div key={key} className="flex items-center gap-2 text-xs">
                                                        {value ? (
                                                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <Circle className="h-3 w-3 text-gray-300" />
                                                        )}
                                                        <span className={value ? 'text-green-700' : 'text-gray-400'}>
                                                            {key.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Quick Stats */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-600" />
                                            Staff & Vendors
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-sm">Vendors assigned</span>
                                                <span className="font-medium">
                                                    {[planForm.dj_vendor_id, planForm.decor_vendor_id, planForm.catering_vendor_id].filter(Boolean).length + planForm.custom_vendors.length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-sm">Staff roles</span>
                                                <span className="font-medium">{planForm.staff_assignments.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-sm">Total staff</span>
                                                <span className="font-medium">
                                                    {planForm.staff_assignments.reduce((sum, s) => sum + (parseInt(s.count) || 0), 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Timeline Status */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-amber-600" />
                                            Timeline Tasks
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-sm">Total tasks</span>
                                                <span className="font-medium">{planForm.timeline_tasks.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-sm">Completed</span>
                                                <span className="font-medium text-green-600">
                                                    {planForm.timeline_tasks.filter(t => t.status === 'done').length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-sm">Pending</span>
                                                <span className="font-medium text-amber-600">
                                                    {planForm.timeline_tasks.filter(t => t.status === 'pending').length}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">General Notes</label>
                                <Textarea
                                    value={planForm.notes}
                                    onChange={e => setPlanForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Add any notes for this event..."
                                    rows={3}
                                />
                            </div>
                        </TabsContent>

                        {/* Vendors Tab */}
                        <TabsContent value="vendors" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* DJ Vendor */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Music className="h-4 w-4 text-purple-600" />
                                        DJ / Sound
                                    </label>
                                    <Select value={planForm.dj_vendor_id} onValueChange={v => setPlanForm(prev => ({ ...prev, dj_vendor_id: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select DJ vendor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {getVendorsByType('dj').map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Decor Vendor */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-pink-600" />
                                        Decoration
                                    </label>
                                    <Select value={planForm.decor_vendor_id} onValueChange={v => setPlanForm(prev => ({ ...prev, decor_vendor_id: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select decor vendor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {getVendorsByType('decor').map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Catering Vendor */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <ChefHat className="h-4 w-4 text-orange-600" />
                                        Catering
                                    </label>
                                    <Select value={planForm.catering_vendor_id} onValueChange={v => setPlanForm(prev => ({ ...prev, catering_vendor_id: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select catering vendor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {getVendorsByType('catering').map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Other Vendors */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Other Vendors</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {vendors.filter(v => 
                                        !['dj', 'decor', 'catering'].some(t => v.vendor_type?.toLowerCase().includes(t))
                                    ).map(vendor => (
                                        <div
                                            key={vendor.id}
                                            onClick={() => toggleCustomVendor(vendor.id)}
                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                planForm.custom_vendors.includes(vendor.id)
                                                    ? 'border-fuchsia-500 bg-fuchsia-50'
                                                    : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm font-medium">{vendor.name}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 capitalize mt-1">{vendor.vendor_type}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Staff Tab */}
                        <TabsContent value="staff" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900">Staff Assignments</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={applyStaffSuggestions}>
                                        <Sparkles className="h-4 w-4 mr-1" />
                                        Smart Suggest
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={addStaffMember}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Staff
                                    </Button>
                                </div>
                            </div>

                            {planForm.staff_assignments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No staff assigned. Click "Smart Suggest" for recommendations.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {planForm.staff_assignments.map((staff, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-gray-50 rounded-xl p-4"
                                        >
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
                                                <Select value={staff.role} onValueChange={v => updateStaffMember(index, 'role', v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {staffRoles.map(role => (
                                                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Count"
                                                    value={staff.count || 1}
                                                    onChange={e => updateStaffMember(index, 'count', e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Wage"
                                                    value={staff.wage || ''}
                                                    onChange={e => updateStaffMember(index, 'wage', e.target.value)}
                                                />
                                                <div className="text-sm text-gray-500">
                                                    Total: {formatCurrency((parseInt(staff.count) || 1) * (parseFloat(staff.wage) || 0))}
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeStaffMember(index)} className="text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-fuchsia-50 rounded-xl p-4 flex items-center justify-between">
                                <span className="font-medium text-fuchsia-800">Total Staff Cost</span>
                                <span className="text-xl font-bold text-fuchsia-600">{formatCurrency(totalStaffCharges)}</span>
                            </div>
                        </TabsContent>

                        {/* Timeline Tab */}
                        <TabsContent value="timeline" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900">Run-of-Show Timeline</h3>
                                <Button variant="outline" size="sm" onClick={regenerateTimeline}>
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Regenerate
                                </Button>
                            </div>

                            {planForm.timeline_tasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No timeline generated. Click "Regenerate" to create one.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {planForm.timeline_tasks.sort((a, b) => a.time.localeCompare(b.time)).map((task, index) => (
                                        <motion.div
                                            key={task.id || index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`flex items-center gap-4 p-3 rounded-xl border ${
                                                task.status === 'done' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
                                            }`}
                                        >
                                            <button
                                                onClick={() => updateTimelineTask(task.id, task.status === 'done' ? 'pending' : 'done')}
                                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                                    task.status === 'done' 
                                                        ? 'bg-green-500 text-white' 
                                                        : 'border-2 border-gray-300 text-gray-300 hover:border-green-500'
                                                }`}
                                            >
                                                {task.status === 'done' && <CheckCircle className="h-4 w-4" />}
                                            </button>
                                            <div className="text-sm font-mono text-gray-500 w-16">{task.time}</div>
                                            <div className="flex-1">
                                                <div className={`font-medium ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                    {task.title}
                                                </div>
                                                <div className="text-xs text-gray-500">{task.owner}</div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs capitalize">{task.owner_type}</Badge>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Profit Tab */}
                        <TabsContent value="profit" className="space-y-4">
                            {profitSnapshot ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardContent className="p-4">
                                                <div className="text-xs text-gray-500">Booking Revenue</div>
                                                <div className="text-xl font-bold text-gray-900">
                                                    {formatCurrency(profitSnapshot.booking_revenue)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-4">
                                                <div className="text-xs text-gray-500">Received</div>
                                                <div className="text-xl font-bold text-green-600">
                                                    {formatCurrency(profitSnapshot.payments_received)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-4">
                                                <div className="text-xs text-gray-500">Total Expenses</div>
                                                <div className="text-xl font-bold text-red-600">
                                                    {formatCurrency(profitSnapshot.total_expenses)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-br from-fuchsia-50 to-pink-50">
                                            <CardContent className="p-4">
                                                <div className="text-xs text-fuchsia-600">Est. Profit</div>
                                                <div className="text-xl font-bold text-fuchsia-600">
                                                    {formatCurrency(profitSnapshot.estimated_profit)}
                                                </div>
                                                <div className="text-xs text-fuchsia-500">
                                                    {profitSnapshot.profit_margin}% margin
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Alerts */}
                                    {profitSnapshot.alerts?.length > 0 && (
                                        <div className="space-y-2">
                                            {profitSnapshot.alerts.map((alert, i) => (
                                                <div key={i} className={`flex items-center gap-2 p-3 rounded-lg ${
                                                    alert.type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="text-sm">{alert.message}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Expense Breakdown */}
                                    {profitSnapshot.expense_breakdown?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-3">Expense Breakdown</h4>
                                            <div className="space-y-2">
                                                {profitSnapshot.expense_breakdown.map((exp, i) => (
                                                    <div key={i} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                                                        <span className="text-gray-600">{exp.category}</span>
                                                        <span className="font-medium">{formatCurrency(exp.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <TrendingUp className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">Profit data will be available after saving the plan.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSavePlan} disabled={saving} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                            {saving ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {hasPlan ? 'Update Plan' : 'Create Plan'}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PartyPlanningPage;
