import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Workflow, Building2, Loader2, Save, RefreshCw, AlertTriangle,
    Percent, Truck, Users, Lock, BadgePercent, TrendingDown, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';

const ruleDefinitions = [
    { 
        key: 'advance_required_percent', 
        label: 'Advance Required (%)', 
        icon: Percent, 
        description: 'Minimum advance payment required to confirm booking',
        type: 'number',
        min: 0,
        max: 100
    },
    { 
        key: 'vendors_mandatory_before_confirm', 
        label: 'Vendors Mandatory Before Confirm', 
        icon: Truck, 
        description: 'Require vendor assignment before booking confirmation',
        type: 'boolean'
    },
    { 
        key: 'staff_mandatory_before_event', 
        label: 'Staff Mandatory Before Event', 
        icon: Users, 
        description: 'Require staff assignment before event day',
        type: 'boolean'
    },
    { 
        key: 'lock_editing_hours_before', 
        label: 'Lock Editing (Hours Before)', 
        icon: Lock, 
        description: 'Lock booking editing X hours before event (0 = no lock)',
        type: 'number',
        min: 0,
        max: 168
    },
    { 
        key: 'discount_approval_required', 
        label: 'Discount Approval Required', 
        icon: BadgePercent, 
        description: 'Require manager approval for discounts',
        type: 'boolean'
    },
    { 
        key: 'profit_margin_warning_percent', 
        label: 'Profit Margin Warning (%)', 
        icon: TrendingDown, 
        description: 'Show warning when profit margin falls below this',
        type: 'number',
        min: 0,
        max: 100
    },
    { 
        key: 'vendor_unpaid_warning_days', 
        label: 'Vendor Unpaid Warning (Days)', 
        icon: Clock, 
        description: 'Alert for vendors unpaid after X days',
        type: 'number',
        min: 1,
        max: 90
    },
];

const WorkflowRulesPage = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [localRules, setLocalRules] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        if (config?.workflow_rules) {
            setLocalRules(config.workflow_rules);
            setHasChanges(false);
        }
    }, [config]);

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

    const updateRule = (key, value) => {
        setLocalRules(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const saveRules = async () => {
        setSaving(true);
        try {
            await superAdminAPI.updateWorkflowRules(selectedTenant.id, localRules);
            setConfig(prev => ({ ...prev, workflow_rules: localRules }));
            setHasChanges(false);
            toast.success('Workflow rules saved!');
        } catch (error) {
            toast.error('Failed to save rules');
        } finally {
            setSaving(false);
        }
    };

    const resetRules = () => {
        if (config?.workflow_rules) {
            setLocalRules(config.workflow_rules);
            setHasChanges(false);
        }
    };

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
                        <motion.div className="p-2 bg-amber-500/20 rounded-xl" whileHover={{ rotate: 10 }}>
                            <Workflow className="h-6 w-6 text-amber-400" />
                        </motion.div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                            Workflow Rules
                        </h1>
                    </div>
                    <p className="text-slate-400">Configure business rules and validations per tenant</p>
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

            {/* Save Bar */}
            {hasChanges && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                            <span className="text-amber-200">You have unsaved changes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={resetRules}
                                className="border-amber-700 text-amber-300 hover:bg-amber-900/50 rounded-lg"
                            >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reset
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={saveRules}
                                disabled={saving}
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                            >
                                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Rules Grid */}
            {configLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : config ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ruleDefinitions.map((rule, idx) => (
                        <motion.div
                            key={rule.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-amber-500/20 rounded-lg">
                                            <rule.icon className="h-5 w-5 text-amber-400" />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-white font-semibold">{rule.label}</Label>
                                            <p className="text-xs text-slate-400 mt-1 mb-3">{rule.description}</p>
                                            
                                            {rule.type === 'boolean' ? (
                                                <div className="flex items-center gap-3">
                                                    <Switch
                                                        checked={localRules[rule.key] ?? false}
                                                        onCheckedChange={(checked) => updateRule(rule.key, checked)}
                                                        className="data-[state=checked]:bg-amber-500"
                                                    />
                                                    <span className="text-sm text-slate-300">
                                                        {localRules[rule.key] ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={localRules[rule.key] ?? 0}
                                                        onChange={(e) => updateRule(rule.key, parseInt(e.target.value) || 0)}
                                                        min={rule.min}
                                                        max={rule.max}
                                                        className="w-24 bg-slate-900 border-slate-700 text-white rounded-lg"
                                                    />
                                                    {rule.key.includes('percent') && (
                                                        <span className="text-slate-400">%</span>
                                                    )}
                                                    {rule.key.includes('hours') && (
                                                        <span className="text-slate-400">hours</span>
                                                    )}
                                                    {rule.key.includes('days') && (
                                                        <span className="text-slate-400">days</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                    <CardContent className="p-12 text-center">
                        <Workflow className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">Select a tenant to configure workflow rules</p>
                    </CardContent>
                </Card>
            )}

            {/* Info Card */}
            <Card className="bg-slate-800/30 border-slate-700 rounded-2xl">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-slate-300 font-medium">How Rules Work</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Workflow rules enforce business logic across the tenant's application. 
                                Changes take effect immediately after saving and affect all users within the tenant.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default WorkflowRulesPage;
