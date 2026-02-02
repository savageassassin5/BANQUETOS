import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Users2, Building2, Loader2, Save, RefreshCw, AlertTriangle,
    Eye, Edit, DollarSign, Receipt, Trash2, Download, UserCog, Truck, BadgeCheck
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';

const roles = [
    { key: 'owner', label: 'Owner', description: 'Full access to everything', color: 'violet' },
    { key: 'manager', label: 'Manager', description: 'Manage operations & staff', color: 'blue' },
    { key: 'reception', label: 'Reception', description: 'Handle bookings & customers', color: 'emerald' },
    { key: 'accountant', label: 'Accountant', description: 'Financial operations', color: 'amber' },
    { key: 'ops', label: 'Ops', description: 'Event operations & vendors', color: 'pink' },
    { key: 'custom', label: 'Custom', description: 'Custom role permissions', color: 'slate' },
];

const permissions = [
    { key: 'view_bookings', label: 'View Bookings', icon: Eye, category: 'Bookings' },
    { key: 'edit_bookings', label: 'Edit Bookings', icon: Edit, category: 'Bookings' },
    { key: 'view_profit', label: 'View Profit', icon: DollarSign, category: 'Finance' },
    { key: 'edit_profit', label: 'Edit Profit', icon: Edit, category: 'Finance' },
    { key: 'view_vendor_ledger', label: 'View Vendor Ledger', icon: Receipt, category: 'Vendors' },
    { key: 'record_payments', label: 'Record Payments', icon: DollarSign, category: 'Finance' },
    { key: 'delete_records', label: 'Delete Records', icon: Trash2, category: 'Admin' },
    { key: 'export_reports', label: 'Export Reports', icon: Download, category: 'Reports' },
    { key: 'manage_staff', label: 'Manage Staff', icon: UserCog, category: 'Staff' },
    { key: 'manage_vendors', label: 'Manage Vendors', icon: Truck, category: 'Vendors' },
    { key: 'approve_discounts', label: 'Approve Discounts', icon: BadgeCheck, category: 'Finance' },
];

const PermissionsPage = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [localPermissions, setLocalPermissions] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [activeRole, setActiveRole] = useState('owner');

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        if (config?.permissions) {
            setLocalPermissions(config.permissions);
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

    const togglePermission = (role, permission) => {
        setLocalPermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [permission]: !(prev[role]?.[permission] ?? false)
            }
        }));
        setHasChanges(true);
    };

    const savePermissions = async () => {
        setSaving(true);
        try {
            await superAdminAPI.updatePermissions(selectedTenant.id, localPermissions);
            setConfig(prev => ({ ...prev, permissions: localPermissions }));
            setHasChanges(false);
            toast.success('Permissions saved!');
        } catch (error) {
            toast.error('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const resetPermissions = () => {
        if (config?.permissions) {
            setLocalPermissions(config.permissions);
            setHasChanges(false);
        }
    };

    const grantAllForRole = (role) => {
        const allGranted = {};
        permissions.forEach(p => { allGranted[p.key] = true; });
        setLocalPermissions(prev => ({ ...prev, [role]: allGranted }));
        setHasChanges(true);
    };

    const revokeAllForRole = (role) => {
        const allRevoked = {};
        permissions.forEach(p => { allRevoked[p.key] = false; });
        setLocalPermissions(prev => ({ ...prev, [role]: allRevoked }));
        setHasChanges(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const activeRoleConfig = roles.find(r => r.key === activeRole);
    const rolePermissions = localPermissions[activeRole] || {};
    const grantedCount = Object.values(rolePermissions).filter(Boolean).length;

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div className="p-2 bg-pink-500/20 rounded-xl" whileHover={{ rotate: 10 }}>
                            <Users2 className="h-6 w-6 text-pink-400" />
                        </motion.div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                            Role Permissions
                        </h1>
                    </div>
                    <p className="text-slate-400">Configure what each role can do per tenant</p>
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
                    className="bg-pink-900/30 border border-pink-700/50 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-pink-400" />
                            <span className="text-pink-200">You have unsaved changes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={resetPermissions}
                                className="border-pink-700 text-pink-300 hover:bg-pink-900/50 rounded-lg"
                            >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reset
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={savePermissions}
                                disabled={saving}
                                className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
                            >
                                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Role Tabs */}
            {configLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : config ? (
                <Tabs value={activeRole} onValueChange={setActiveRole}>
                    <TabsList className="bg-slate-800 border border-slate-700 rounded-xl p-1 flex-wrap h-auto">
                        {roles.map(role => (
                            <TabsTrigger 
                                key={role.key} 
                                value={role.key}
                                className={`rounded-lg data-[state=active]:bg-${role.color}-600 data-[state=active]:text-white px-4 py-2`}
                            >
                                {role.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {roles.map(role => (
                        <TabsContent key={role.key} value={role.key} className="mt-6">
                            {/* Role Header */}
                            <Card className="bg-slate-800/50 border-slate-700 rounded-2xl mb-6">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{role.label}</h3>
                                            <p className="text-sm text-slate-400">{role.description}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {grantedCount} of {permissions.length} permissions granted
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => grantAllForRole(role.key)}
                                                className="border-emerald-700 text-emerald-400 hover:bg-emerald-900/50 rounded-lg"
                                            >
                                                Grant All
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => revokeAllForRole(role.key)}
                                                className="border-red-700 text-red-400 hover:bg-red-900/50 rounded-lg"
                                            >
                                                Revoke All
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Permissions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {permissions.map((perm, idx) => {
                                    const isGranted = rolePermissions[perm.key] ?? false;
                                    return (
                                        <motion.div
                                            key={perm.key}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                        >
                                            <Card className={`border rounded-xl transition-all cursor-pointer ${
                                                isGranted 
                                                    ? 'bg-emerald-900/20 border-emerald-700/50' 
                                                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                            }`}
                                            onClick={() => togglePermission(role.key, perm.key)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${isGranted ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                                                                <perm.icon className={`h-4 w-4 ${isGranted ? 'text-emerald-400' : 'text-slate-400'}`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white text-sm">{perm.label}</p>
                                                                <p className="text-xs text-slate-500">{perm.category}</p>
                                                            </div>
                                                        </div>
                                                        <Switch
                                                            checked={isGranted}
                                                            onCheckedChange={() => togglePermission(role.key, perm.key)}
                                                            className="data-[state=checked]:bg-emerald-500"
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                    <CardContent className="p-12 text-center">
                        <Users2 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400">Select a tenant to configure permissions</p>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
};

export default PermissionsPage;
