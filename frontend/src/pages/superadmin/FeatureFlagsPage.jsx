import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ToggleRight, Building2, Search, Loader2, Check, X, RefreshCw,
    Calendar, ClipboardList, Truck, Receipt, Users, TrendingUp, 
    FileText, BarChart3, Clock, Columns, FormInput, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';

const featureDefinitions = [
    { key: 'bookings', label: 'Bookings', icon: Calendar, description: 'Core booking management', category: 'core' },
    { key: 'party_planner', label: 'Party Planner', icon: ClipboardList, description: 'Event planning & coordination', category: 'core' },
    { key: 'operations_checklist', label: 'Operations Checklist', icon: ClipboardList, description: 'Task management for events', category: 'operations' },
    { key: 'vendors', label: 'Vendors', icon: Truck, description: 'Vendor directory', category: 'vendors' },
    { key: 'vendor_ledger', label: 'Vendor Ledger & Payments', icon: Receipt, description: 'Track vendor transactions', category: 'vendors' },
    { key: 'staff_planning', label: 'Staff Planning', icon: Users, description: 'Staff assignment & scheduling', category: 'operations' },
    { key: 'profit_tracking', label: 'Profit Tracking', icon: TrendingUp, description: 'Revenue & profit analytics', category: 'finance' },
    { key: 'reports', label: 'Reports', icon: FileText, description: 'Basic reporting', category: 'reports' },
    { key: 'advanced_reports', label: 'Advanced Reports', icon: BarChart3, description: 'Analytics & insights', category: 'reports' },
    { key: 'event_day_mode', label: 'Event Day Mode', icon: Clock, description: 'Real-time event tracking', category: 'operations' },
    { key: 'multi_hall', label: 'Multi-Hall Support', icon: Columns, description: 'Manage multiple venues', category: 'core' },
    { key: 'custom_fields', label: 'Custom Fields', icon: FormInput, description: 'Add custom booking fields', category: 'advanced' },
];

const categories = [
    { key: 'all', label: 'All Features' },
    { key: 'core', label: 'Core' },
    { key: 'operations', label: 'Operations' },
    { key: 'vendors', label: 'Vendors' },
    { key: 'finance', label: 'Finance' },
    { key: 'reports', label: 'Reports' },
    { key: 'advanced', label: 'Advanced' },
];

const FeatureFlagsPage = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        try {
            const res = await superAdminAPI.getTenants();
            setTenants(res.data);
            if (res.data.length > 0) {
                setSelectedTenant(res.data[0]);
                loadConfig(res.data[0].id);
            }
        } catch (error) {
            toast.error('Failed to load tenants');
        } finally {
            setLoading(false);
        }
    };

    const loadConfig = async (tenantId) => {
        setConfigLoading(true);
        try {
            const res = await superAdminAPI.getTenantConfig(tenantId);
            setConfig(res.data);
        } catch (error) {
            toast.error('Failed to load config');
        } finally {
            setConfigLoading(false);
        }
    };

    const handleTenantChange = (tenantId) => {
        const tenant = tenants.find(t => t.id === tenantId);
        setSelectedTenant(tenant);
        loadConfig(tenantId);
    };

    const toggleFeature = async (featureKey) => {
        if (!config) return;
        
        setSaving(prev => ({ ...prev, [featureKey]: true }));
        
        const currentValue = config.feature_flags?.[featureKey] ?? false;
        const newFlags = { [featureKey]: !currentValue };
        
        try {
            await superAdminAPI.updateFeatureFlags(selectedTenant.id, newFlags);
            setConfig(prev => ({
                ...prev,
                feature_flags: { ...prev.feature_flags, ...newFlags }
            }));
            toast.success(`${featureKey.replace(/_/g, ' ')} ${!currentValue ? 'enabled' : 'disabled'}`);
        } catch (error) {
            toast.error('Failed to update feature');
        } finally {
            setSaving(prev => ({ ...prev, [featureKey]: false }));
        }
    };

    const enableAll = async () => {
        const allEnabled = {};
        featureDefinitions.forEach(f => { allEnabled[f.key] = true; });
        
        setSaving(prev => ({ ...prev, all: true }));
        try {
            await superAdminAPI.updateFeatureFlags(selectedTenant.id, allEnabled);
            setConfig(prev => ({ ...prev, feature_flags: allEnabled }));
            toast.success('All features enabled');
        } catch (error) {
            toast.error('Failed to enable all');
        } finally {
            setSaving(prev => ({ ...prev, all: false }));
        }
    };

    const disableAll = async () => {
        const allDisabled = {};
        featureDefinitions.forEach(f => { allDisabled[f.key] = false; });
        
        setSaving(prev => ({ ...prev, all: true }));
        try {
            await superAdminAPI.updateFeatureFlags(selectedTenant.id, allDisabled);
            setConfig(prev => ({ ...prev, feature_flags: allDisabled }));
            toast.success('All features disabled');
        } catch (error) {
            toast.error('Failed to disable all');
        } finally {
            setSaving(prev => ({ ...prev, all: false }));
        }
    };

    const filteredFeatures = featureDefinitions.filter(f => {
        const matchesSearch = f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             f.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const enabledCount = config?.feature_flags ? 
        Object.values(config.feature_flags).filter(Boolean).length : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div className="p-2 bg-emerald-500/20 rounded-xl" whileHover={{ rotate: 10 }}>
                            <ToggleRight className="h-6 w-6 text-emerald-400" />
                        </motion.div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                            Feature Flags
                        </h1>
                    </div>
                    <p className="text-slate-400">Enable or disable features per tenant instantly</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedTenant?.id || ''} onValueChange={handleTenantChange}>
                        <SelectTrigger className="w-64 bg-slate-800 border-slate-700 text-white rounded-xl">
                            <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Select Tenant" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                            {tenants.map(tenant => (
                                <SelectItem key={tenant.id} value={tenant.id} className="text-white hover:bg-slate-700">
                                    {tenant.business_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats */}
            {selectedTenant && config && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase">Selected Tenant</p>
                                    <p className="text-lg font-semibold text-white">{selectedTenant.business_name}</p>
                                </div>
                                <Building2 className="h-8 w-8 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase">Features Enabled</p>
                                    <p className="text-lg font-semibold text-emerald-400">{enabledCount} / {featureDefinitions.length}</p>
                                </div>
                                <Check className="h-8 w-8 text-emerald-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase">Config Version</p>
                                    <p className="text-lg font-semibold text-white">v{config.version || 1}</p>
                                </div>
                                <RefreshCw className="h-8 w-8 text-violet-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-2">
                            <Button 
                                size="sm" 
                                onClick={enableAll}
                                disabled={saving.all}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                            >
                                Enable All
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={disableAll}
                                disabled={saving.all}
                                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg"
                            >
                                Disable All
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search features..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-900 border-slate-700 text-white rounded-xl"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white rounded-xl">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                                {categories.map(cat => (
                                    <SelectItem key={cat.key} value={cat.key} className="text-white hover:bg-slate-700">
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Feature Grid */}
            {configLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : config ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFeatures.map((feature, idx) => {
                        const isEnabled = config.feature_flags?.[feature.key] ?? false;
                        const isSaving = saving[feature.key];
                        
                        return (
                            <motion.div
                                key={feature.key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className={`border rounded-2xl transition-all ${
                                    isEnabled 
                                        ? 'bg-emerald-900/20 border-emerald-700/50' 
                                        : 'bg-slate-800/50 border-slate-700'
                                }`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                                                    <feature.icon className={`h-5 w-5 ${isEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{feature.label}</h3>
                                                    <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
                                                    <Badge 
                                                        className={`mt-2 text-[10px] ${
                                                            feature.category === 'core' ? 'bg-blue-500/20 text-blue-400' :
                                                            feature.category === 'operations' ? 'bg-amber-500/20 text-amber-400' :
                                                            feature.category === 'vendors' ? 'bg-purple-500/20 text-purple-400' :
                                                            feature.category === 'finance' ? 'bg-green-500/20 text-green-400' :
                                                            feature.category === 'reports' ? 'bg-cyan-500/20 text-cyan-400' :
                                                            'bg-slate-500/20 text-slate-400'
                                                        }`}
                                                    >
                                                        {feature.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={() => toggleFeature(feature.key)}
                                                    disabled={isSaving}
                                                    className="data-[state=checked]:bg-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">Select a tenant to manage feature flags</p>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
};

export default FeatureFlagsPage;
