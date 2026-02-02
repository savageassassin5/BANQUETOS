import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    CreditCard, Plus, Edit, Trash2, Save, X, CheckCircle, XCircle,
    ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../components/ui/alert-dialog';

const DEFAULT_FEATURES = {
    bookings: true,
    calendar: true,
    halls: true,
    menu: true,
    customers: true,
    payments: true,
    enquiries: true,
    reports: false,
    vendors: false,
    analytics: false,
    notifications: false,
    expenses: false,
    party_planning: false
};

const FEATURE_LABELS = {
    bookings: 'Bookings',
    calendar: 'Calendar',
    halls: 'Halls/Venues',
    menu: 'Menu Management',
    customers: 'Customers',
    payments: 'Payments',
    enquiries: 'Enquiries',
    reports: 'Reports',
    vendors: 'Vendors',
    analytics: 'Analytics',
    notifications: 'Notifications',
    expenses: 'Expenses',
    party_planning: 'Party Planning'
};

const PlansPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planToDelete, setPlanToDelete] = useState(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        features: { ...DEFAULT_FEATURES }
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await superAdminAPI.getPlans();
            setPlans(res.data);
        } catch (error) {
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const openDialog = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setForm({
                name: plan.name,
                description: plan.description || '',
                features: { ...DEFAULT_FEATURES, ...plan.features }
            });
        } else {
            setEditingPlan(null);
            setForm({
                name: '',
                description: '',
                features: { ...DEFAULT_FEATURES }
            });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Plan name is required');
            return;
        }

        try {
            if (editingPlan) {
                await superAdminAPI.updatePlan(editingPlan.id, form);
                toast.success('Plan updated successfully');
            } else {
                await superAdminAPI.createPlan(form);
                toast.success('Plan created successfully');
            }
            setDialogOpen(false);
            fetchPlans();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save plan');
        }
    };

    const handleDelete = async () => {
        if (!planToDelete) return;
        try {
            await superAdminAPI.deletePlan(planToDelete.id);
            toast.success('Plan deleted successfully');
            setDeleteDialogOpen(false);
            setPlanToDelete(null);
            fetchPlans();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete plan');
        }
    };

    const toggleFeature = (feature) => {
        setForm(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [feature]: !prev.features[feature]
            }
        }));
    };

    const countEnabledFeatures = (features) => {
        return Object.values(features || {}).filter(v => v).length;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Plans</h1>
                    <p className="text-slate-400">Manage feature plans for tenants</p>
                </div>
                <Button 
                    onClick={() => openDialog()}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg"
                    data-testid="add-plan-btn"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Plan
                </Button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden"
                        data-testid={`plan-card-${plan.id}`}
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => openDialog(plan)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                            setPlanToDelete(plan);
                                            setDeleteDialogOpen(true);
                                        }}
                                        className="text-slate-400 hover:text-red-400"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                            {plan.description && (
                                <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
                            )}

                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-sm text-slate-400">
                                    {countEnabledFeatures(plan.features)} / {Object.keys(FEATURE_LABELS).length} features
                                </span>
                            </div>

                            {/* Feature Preview */}
                            <div className="border-t border-slate-700/50 pt-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(FEATURE_LABELS).slice(0, 6).map(([key, label]) => (
                                        <div key={key} className="flex items-center gap-2 text-xs">
                                            {plan.features?.[key] ? (
                                                <CheckCircle className="h-3 w-3 text-green-400" />
                                            ) : (
                                                <XCircle className="h-3 w-3 text-slate-500" />
                                            )}
                                            <span className={plan.features?.[key] ? 'text-slate-300' : 'text-slate-500'}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {Object.keys(FEATURE_LABELS).length > 6 && (
                                    <button 
                                        onClick={() => openDialog(plan)}
                                        className="text-xs text-violet-400 hover:text-violet-300 mt-2"
                                    >
                                        +{Object.keys(FEATURE_LABELS).length - 6} more features...
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tenant Count */}
                        <div className="px-6 py-3 bg-slate-700/30 border-t border-slate-700/50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Tenants using this plan</span>
                                <span className="text-white font-medium">{plan.tenant_count || 0}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {plans.length === 0 && (
                <div className="text-center py-16">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Plans Yet</h3>
                    <p className="text-slate-400 mb-6">Create your first plan to get started</p>
                    <Button 
                        onClick={() => openDialog()}
                        className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Plan
                    </Button>
                </div>
            )}

            {/* Plan Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Configure the features included in this plan
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Plan Name *</label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g., Basic, Pro, Enterprise"
                                    className="bg-slate-700/50 border-slate-600 text-white"
                                    data-testid="plan-name-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                                <Input
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief description"
                                    className="bg-slate-700/50 border-slate-600 text-white"
                                />
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-4">Features</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => toggleFeature(key)}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                                            form.features[key] 
                                                ? 'bg-green-500/10 border border-green-500/30' 
                                                : 'bg-slate-700/30 border border-slate-600/50'
                                        }`}
                                        data-testid={`plan-feature-${key}`}
                                    >
                                        <span className={form.features[key] ? 'text-green-400' : 'text-slate-400'}>
                                            {label}
                                        </span>
                                        {form.features[key] ? (
                                            <ToggleRight className="h-6 w-6 text-green-400" />
                                        ) : (
                                            <ToggleLeft className="h-6 w-6 text-slate-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setForm(prev => ({
                                    ...prev,
                                    features: Object.fromEntries(Object.keys(FEATURE_LABELS).map(k => [k, true]))
                                }))}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                Enable All
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setForm(prev => ({
                                    ...prev,
                                    features: Object.fromEntries(Object.keys(FEATURE_LABELS).map(k => [k, false]))
                                }))}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                Disable All
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setDialogOpen(false)} 
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            className="bg-violet-600 hover:bg-violet-700"
                            data-testid="save-plan-btn"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {editingPlan ? 'Update' : 'Create'} Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Plan</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Are you sure you want to delete "{planToDelete?.name}"? 
                            {planToDelete?.tenant_count > 0 && (
                                <span className="text-amber-400 block mt-2">
                                    Warning: {planToDelete.tenant_count} tenant(s) are using this plan.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PlansPage;
