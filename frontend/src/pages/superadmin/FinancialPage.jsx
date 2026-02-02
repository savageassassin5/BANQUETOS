import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Wallet, Building2, Loader2, Save, RefreshCw, AlertTriangle,
    CreditCard, Percent, BadgePercent, ArrowDownUp
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';

const paymentMethods = [
    { key: 'cash', label: 'Cash' },
    { key: 'upi', label: 'UPI' },
    { key: 'bank_transfer', label: 'Bank Transfer' },
    { key: 'cheque', label: 'Cheque' },
    { key: 'card', label: 'Card' },
];

const roundingRules = [
    { value: 'nearest', label: 'Nearest (₹100 → ₹100)' },
    { value: 'up', label: 'Round Up (₹101 → ₹200)' },
    { value: 'down', label: 'Round Down (₹199 → ₹100)' },
];

const FinancialPage = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [localFinance, setLocalFinance] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        if (config?.financial_controls) {
            setLocalFinance(config.financial_controls);
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

    const updateFinance = (key, value) => {
        setLocalFinance(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const togglePaymentMethod = (method) => {
        const current = localFinance.allowed_payment_methods || [];
        const updated = current.includes(method)
            ? current.filter(m => m !== method)
            : [...current, method];
        setLocalFinance(prev => ({ ...prev, allowed_payment_methods: updated }));
        setHasChanges(true);
    };

    const saveFinance = async () => {
        setSaving(true);
        try {
            await superAdminAPI.updateTenantConfig(selectedTenant.id, { financial_controls: localFinance });
            setConfig(prev => ({ ...prev, financial_controls: localFinance }));
            setHasChanges(false);
            toast.success('Financial settings saved!');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const resetFinance = () => {
        if (config?.financial_controls) {
            setLocalFinance(config.financial_controls);
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
                        <motion.div className="p-2 bg-green-500/20 rounded-xl" whileHover={{ rotate: 10 }}>
                            <Wallet className="h-6 w-6 text-green-400" />
                        </motion.div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                            Financial Controls
                        </h1>
                    </div>
                    <p className="text-slate-400">Configure payment methods, tax, and limits</p>
                </div>
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

            {/* Save Bar */}
            {hasChanges && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-900/30 border border-green-700/50 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-green-400" />
                            <span className="text-green-200">You have unsaved changes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={resetFinance} className="border-green-700 text-green-300 hover:bg-green-900/50 rounded-lg">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reset
                            </Button>
                            <Button size="sm" onClick={saveFinance} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
                                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {configLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : config ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Methods */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <CreditCard className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Payment Methods</h3>
                                    <p className="text-xs text-slate-400">Allowed methods for this tenant</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {paymentMethods.map(method => {
                                    const isAllowed = (localFinance.allowed_payment_methods || []).includes(method.key);
                                    return (
                                        <div 
                                            key={method.key}
                                            onClick={() => togglePaymentMethod(method.key)}
                                            className={`p-3 rounded-xl cursor-pointer transition-all ${
                                                isAllowed 
                                                    ? 'bg-green-900/20 border border-green-700/50' 
                                                    : 'bg-slate-900/50 border border-slate-700 hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-white text-sm">{method.label}</span>
                                                {isAllowed && <Badge className="bg-green-500/20 text-green-400 text-xs">Enabled</Badge>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tax Settings */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Percent className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Tax Settings</h3>
                                    <p className="text-xs text-slate-400">Tax type and rate</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-slate-400 text-xs">Tax Type</Label>
                                    <Select value={localFinance.tax_type || 'GST'} onValueChange={val => updateFinance('tax_type', val)}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-1 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                                            <SelectItem value="GST" className="text-white hover:bg-slate-700">GST</SelectItem>
                                            <SelectItem value="VAT" className="text-white hover:bg-slate-700">VAT</SelectItem>
                                            <SelectItem value="SST" className="text-white hover:bg-slate-700">SST</SelectItem>
                                            <SelectItem value="None" className="text-white hover:bg-slate-700">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">Tax Rate (%)</Label>
                                    <Input
                                        type="number"
                                        value={localFinance.tax_rate || 0}
                                        onChange={(e) => updateFinance('tax_rate', parseFloat(e.target.value) || 0)}
                                        min={0}
                                        max={100}
                                        className="bg-slate-900 border-slate-700 text-white mt-1 rounded-xl"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Discount Limits */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <BadgePercent className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Discount Limits</h3>
                                    <p className="text-xs text-slate-400">Max discount by role</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-slate-400 text-xs">Reception Max Discount (%)</Label>
                                    <Input
                                        type="number"
                                        value={localFinance.max_discount_percent_reception || 0}
                                        onChange={(e) => updateFinance('max_discount_percent_reception', parseInt(e.target.value) || 0)}
                                        min={0}
                                        max={100}
                                        className="bg-slate-900 border-slate-700 text-white mt-1 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">Manager Max Discount (%)</Label>
                                    <Input
                                        type="number"
                                        value={localFinance.max_discount_percent_manager || 0}
                                        onChange={(e) => updateFinance('max_discount_percent_manager', parseInt(e.target.value) || 0)}
                                        min={0}
                                        max={100}
                                        className="bg-slate-900 border-slate-700 text-white mt-1 rounded-xl"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Other Settings */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <ArrowDownUp className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Other Settings</h3>
                                    <p className="text-xs text-slate-400">Vendor advance and rounding</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-slate-400 text-xs">Vendor Advance Required (%)</Label>
                                    <Input
                                        type="number"
                                        value={localFinance.vendor_advance_required_percent || 0}
                                        onChange={(e) => updateFinance('vendor_advance_required_percent', parseInt(e.target.value) || 0)}
                                        min={0}
                                        max={100}
                                        className="bg-slate-900 border-slate-700 text-white mt-1 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">Rounding Rule</Label>
                                    <Select value={localFinance.rounding_rule || 'nearest'} onValueChange={val => updateFinance('rounding_rule', val)}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-1 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                                            {roundingRules.map(rule => (
                                                <SelectItem key={rule.value} value={rule.value} className="text-white hover:bg-slate-700">
                                                    {rule.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                    <CardContent className="p-12 text-center">
                        <Wallet className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">Select a tenant to configure financial controls</p>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
};

export default FinancialPage;
