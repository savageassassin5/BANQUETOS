import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Eye, Building2, Loader2, Save, RefreshCw, AlertTriangle,
    EyeOff, Type, Lock
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';

const tabVisibility = [
    { key: 'show_profit_tab', label: 'Profit Tab', description: 'Show profit tracking in party planner' },
    { key: 'show_staff_tab', label: 'Staff Tab', description: 'Show staff planning in party planner' },
    { key: 'show_vendors_tab', label: 'Vendors Tab', description: 'Show vendors in party planner' },
    { key: 'show_checklist_tab', label: 'Checklist Tab', description: 'Show operations checklist' },
];

const labelCustomization = [
    { key: 'label_party_planner', label: 'Party Planner', default: 'Party Planner' },
    { key: 'label_vendors', label: 'Vendors', default: 'Vendors' },
    { key: 'label_bookings', label: 'Bookings', default: 'Bookings' },
];

const readonlyModules = [
    { key: 'profit', label: 'Profit', description: 'Make profit section read-only' },
    { key: 'vendors', label: 'Vendors', description: 'Make vendors section read-only' },
    { key: 'staff', label: 'Staff', description: 'Make staff section read-only' },
];

const UIControlsPage = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [localUI, setLocalUI] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        if (config?.ui_visibility) {
            setLocalUI(config.ui_visibility);
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

    const updateUI = (key, value) => {
        setLocalUI(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const toggleReadonly = (module) => {
        const current = localUI.readonly_modules || [];
        const updated = current.includes(module)
            ? current.filter(m => m !== module)
            : [...current, module];
        setLocalUI(prev => ({ ...prev, readonly_modules: updated }));
        setHasChanges(true);
    };

    const saveUI = async () => {
        setSaving(true);
        try {
            await superAdminAPI.updateTenantConfig(selectedTenant.id, { ui_visibility: localUI });
            setConfig(prev => ({ ...prev, ui_visibility: localUI }));
            setHasChanges(false);
            toast.success('UI settings saved!');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const resetUI = () => {
        if (config?.ui_visibility) {
            setLocalUI(config.ui_visibility);
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
                        <motion.div className="p-2 bg-purple-500/20 rounded-xl" whileHover={{ rotate: 10 }}>
                            <Eye className="h-6 w-6 text-purple-400" />
                        </motion.div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                            UI Controls
                        </h1>
                    </div>
                    <p className="text-slate-400">Control what tenants see without code changes</p>
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
                    className="bg-purple-900/30 border border-purple-700/50 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-purple-400" />
                            <span className="text-purple-200">You have unsaved changes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={resetUI} className="border-purple-700 text-purple-300 hover:bg-purple-900/50 rounded-lg">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reset
                            </Button>
                            <Button size="sm" onClick={saveUI} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
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
                    {/* Tab Visibility */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Eye className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Tab Visibility</h3>
                                    <p className="text-xs text-slate-400">Show or hide tabs in the app</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {tabVisibility.map(tab => (
                                    <div key={tab.key} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-white text-sm">{tab.label}</p>
                                            <p className="text-xs text-slate-500">{tab.description}</p>
                                        </div>
                                        <Switch
                                            checked={localUI[tab.key] ?? true}
                                            onCheckedChange={(val) => updateUI(tab.key, val)}
                                            className="data-[state=checked]:bg-purple-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Label Customization */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Type className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Label Customization</h3>
                                    <p className="text-xs text-slate-400">Rename module labels</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {labelCustomization.map(label => (
                                    <div key={label.key}>
                                        <Label className="text-slate-400 text-xs">{label.label}</Label>
                                        <Input
                                            value={localUI[label.key] || label.default}
                                            onChange={(e) => updateUI(label.key, e.target.value)}
                                            placeholder={label.default}
                                            className="bg-slate-900 border-slate-700 text-white mt-1 rounded-xl"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Read-Only Modules */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl lg:col-span-2">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Lock className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Read-Only Modules</h3>
                                    <p className="text-xs text-slate-400">Make sections view-only (no editing allowed)</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {readonlyModules.map(module => {
                                    const isReadonly = (localUI.readonly_modules || []).includes(module.key);
                                    return (
                                        <div 
                                            key={module.key}
                                            onClick={() => toggleReadonly(module.key)}
                                            className={`p-4 rounded-xl cursor-pointer transition-all ${
                                                isReadonly 
                                                    ? 'bg-amber-900/20 border border-amber-700/50' 
                                                    : 'bg-slate-900/50 border border-slate-700 hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-white">{module.label}</span>
                                                {isReadonly ? (
                                                    <Badge className="bg-amber-500/20 text-amber-400 text-xs">Locked</Badge>
                                                ) : (
                                                    <Badge className="bg-slate-700 text-slate-400 text-xs">Editable</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">{module.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                    <CardContent className="p-12 text-center">
                        <Eye className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">Select a tenant to configure UI controls</p>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
};

export default UIControlsPage;
