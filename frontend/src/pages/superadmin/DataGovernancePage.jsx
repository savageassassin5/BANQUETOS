import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Database, Building2, Loader2, Save, RefreshCw, AlertTriangle,
    FileText, Trash2, Download, Shield, RotateCcw, History
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';

const DataGovernancePage = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [localGov, setLocalGov] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [versions, setVersions] = useState([]);
    const [versionsLoading, setVersionsLoading] = useState(false);

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        if (config?.data_governance) {
            setLocalGov(config.data_governance);
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
            loadVersions(tenantId);
        } catch (error) {
            toast.error('Failed to load config');
        } finally {
            setConfigLoading(false);
        }
    };

    const loadVersions = async (tenantId) => {
        setVersionsLoading(true);
        try {
            const res = await superAdminAPI.getConfigVersions(tenantId);
            setVersions(res.data.history || []);
        } catch (error) {
            console.error('Failed to load versions');
        } finally {
            setVersionsLoading(false);
        }
    };

    const handleTenantChange = (tenantId) => {
        const tenant = tenants.find(t => t.id === tenantId);
        setSelectedTenant(tenant);
        loadConfig(tenantId);
    };

    const updateGov = (key, value) => {
        setLocalGov(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const saveGov = async () => {
        setSaving(true);
        try {
            await superAdminAPI.updateTenantConfig(selectedTenant.id, { data_governance: localGov });
            setConfig(prev => ({ ...prev, data_governance: localGov }));
            setHasChanges(false);
            toast.success('Data governance settings saved!');
            loadVersions(selectedTenant.id);
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const resetGov = () => {
        if (config?.data_governance) {
            setLocalGov(config.data_governance);
            setHasChanges(false);
        }
    };

    const resetTenantData = async () => {
        setResetting(true);
        try {
            const res = await superAdminAPI.resetTenantData(selectedTenant.id);
            toast.success('Tenant data reset successfully!');
        } catch (error) {
            toast.error('Failed to reset tenant data');
        } finally {
            setResetting(false);
        }
    };

    const rollbackConfig = async (version) => {
        try {
            await superAdminAPI.rollbackConfig(selectedTenant.id, version);
            toast.success(`Config rolled back to version ${version}`);
            loadConfig(selectedTenant.id);
        } catch (error) {
            toast.error('Failed to rollback config');
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
                        <motion.div className="p-2 bg-red-500/20 rounded-xl" whileHover={{ rotate: 10 }}>
                            <Database className="h-6 w-6 text-red-400" />
                        </motion.div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                            Data Governance
                        </h1>
                    </div>
                    <p className="text-slate-400">Control data safety, audit, and versioning</p>
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
                    className="bg-red-900/30 border border-red-700/50 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            <span className="text-red-200">You have unsaved changes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={resetGov} className="border-red-700 text-red-300 hover:bg-red-900/50 rounded-lg">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reset
                            </Button>
                            <Button size="sm" onClick={saveGov} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white rounded-lg">
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
                    {/* Audit & Safety */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <FileText className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Audit & Safety</h3>
                                    <p className="text-xs text-slate-400">Logging and data protection</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-white text-sm">Enable Audit Logs</p>
                                        <p className="text-xs text-slate-500">Track all user actions</p>
                                    </div>
                                    <Switch
                                        checked={localGov.enable_audit_logs ?? true}
                                        onCheckedChange={(val) => updateGov('enable_audit_logs', val)}
                                        className="data-[state=checked]:bg-red-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-white text-sm">Soft Delete</p>
                                        <p className="text-xs text-slate-500">Archive instead of permanent delete</p>
                                    </div>
                                    <Switch
                                        checked={localGov.soft_delete_enabled ?? true}
                                        onCheckedChange={(val) => updateGov('soft_delete_enabled', val)}
                                        className="data-[state=checked]:bg-red-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-white text-sm">Allow Data Export</p>
                                        <p className="text-xs text-slate-500">Users can export reports</p>
                                    </div>
                                    <Switch
                                        checked={localGov.allow_data_export ?? true}
                                        onCheckedChange={(val) => updateGov('allow_data_export', val)}
                                        className="data-[state=checked]:bg-red-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-white text-sm">Demo Mode</p>
                                        <p className="text-xs text-slate-500">Tenant in demo/trial mode</p>
                                    </div>
                                    <Switch
                                        checked={localGov.demo_mode ?? false}
                                        onCheckedChange={(val) => updateGov('demo_mode', val)}
                                        className="data-[state=checked]:bg-amber-500"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Retention */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <Shield className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Data Retention</h3>
                                    <p className="text-xs text-slate-400">How long to keep data</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-slate-400 text-xs">Retention Period (Days)</Label>
                                <Input
                                    type="number"
                                    value={localGov.data_retention_days || 365}
                                    onChange={(e) => updateGov('data_retention_days', parseInt(e.target.value) || 365)}
                                    min={30}
                                    max={3650}
                                    className="bg-slate-900 border-slate-700 text-white mt-1 rounded-xl"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Data older than this will be archived/deleted based on soft delete setting
                                </p>
                            </div>

                            {/* Danger Zone */}
                            <div className="mt-8 pt-6 border-t border-slate-700">
                                <h4 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Danger Zone
                                </h4>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className="w-full border-red-700 text-red-400 hover:bg-red-900/30 rounded-xl">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Reset Tenant Data
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-slate-900 border-slate-700">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-white flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                                Reset Tenant Data
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-slate-400">
                                                This will permanently delete ALL data for <strong className="text-white">{selectedTenant?.business_name}</strong>:
                                                bookings, payments, vendors, party plans, and more.
                                                <br /><br />
                                                <strong className="text-red-400">This action cannot be undone.</strong>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white">Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={resetTenantData}
                                                disabled={resetting}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                {resetting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                                                Reset All Data
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Config Version History */}
                    <Card className="bg-slate-800/50 border-slate-700 rounded-2xl lg:col-span-2">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <History className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">Config Version History</h3>
                                        <p className="text-xs text-slate-400">Rollback to previous configurations</p>
                                    </div>
                                </div>
                                <Badge className="bg-violet-500/20 text-violet-400">
                                    Current: v{config.version || 1}
                                </Badge>
                            </div>
                            
                            {versionsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                                </div>
                            ) : versions.length > 0 ? (
                                <div className="space-y-2">
                                    {versions.slice(0, 5).map((v, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                            <div>
                                                <p className="font-medium text-white text-sm">Version {v.version}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(v.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => rollbackConfig(v.version)}
                                                className="border-slate-700 text-slate-300 hover:bg-slate-700 rounded-lg"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-1" />
                                                Rollback
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <History className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">No version history yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                    <CardContent className="p-12 text-center">
                        <Database className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">Select a tenant to configure data governance</p>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
};

export default DataGovernancePage;
