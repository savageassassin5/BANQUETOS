import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Building2, ArrowLeft, Save, Plus, Users, Trash2, Edit, 
    CheckCircle, XCircle, Key, Mail, User, Shield, ToggleLeft, ToggleRight
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

const TenantDetailPage = ({ isNew = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [plans, setPlans] = useState([]);
    const [users, setUsers] = useState([]);
    const [tenant, setTenant] = useState({
        business_name: '',
        country: 'India',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        status: 'active',
        plan_id: '',
        features_override: {}
    });

    // User management state
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'reception'
    });
    const [deleteUserDialog, setDeleteUserDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        fetchPlans();
        if (!isNew && id) {
            fetchTenant();
            fetchUsers();
        }
    }, [id, isNew]);

    const fetchPlans = async () => {
        try {
            const res = await superAdminAPI.getPlans();
            setPlans(res.data);
            if (isNew && res.data.length > 0) {
                setTenant(prev => ({ ...prev, plan_id: res.data[0].id }));
            }
        } catch (error) {
            toast.error('Failed to load plans');
        }
    };

    const fetchTenant = async () => {
        try {
            const res = await superAdminAPI.getTenant(id);
            setTenant(res.data);
        } catch (error) {
            toast.error('Failed to load tenant');
            navigate('/superadmin/tenants');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await superAdminAPI.getTenantUsers(id);
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to load users');
        }
    };

    const handleSave = async () => {
        if (!tenant.business_name.trim()) {
            toast.error('Business name is required');
            return;
        }

        setSaving(true);
        try {
            if (isNew) {
                const res = await superAdminAPI.createTenant(tenant);
                toast.success('Tenant created successfully');
                navigate(`/superadmin/tenants/${res.data.id}`);
            } else {
                await superAdminAPI.updateTenant(id, tenant);
                toast.success('Tenant updated successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save tenant');
        } finally {
            setSaving(false);
        }
    };

    const handleFeatureToggle = (feature) => {
        const currentPlan = plans.find(p => p.id === tenant.plan_id);
        const planValue = currentPlan?.features?.[feature] ?? true;
        const overrideValue = tenant.features_override?.[feature];
        
        // If override exists, remove it (go back to plan default)
        // If no override, set opposite of plan value
        const newOverrides = { ...tenant.features_override };
        if (overrideValue !== undefined) {
            delete newOverrides[feature];
        } else {
            newOverrides[feature] = !planValue;
        }
        
        setTenant({ ...tenant, features_override: newOverrides });
    };

    const getEffectiveFeatureValue = (feature) => {
        const overrideValue = tenant.features_override?.[feature];
        if (overrideValue !== undefined) return overrideValue;
        const currentPlan = plans.find(p => p.id === tenant.plan_id);
        return currentPlan?.features?.[feature] ?? true;
    };

    const isFeatureOverridden = (feature) => {
        return tenant.features_override?.[feature] !== undefined;
    };

    // User management functions
    const openUserDialog = (user = null) => {
        if (user) {
            setEditingUser(user);
            setUserForm({
                name: user.name,
                email: user.email,
                password: '',
                phone: user.phone || '',
                role: user.role
            });
        } else {
            setEditingUser(null);
            setUserForm({
                name: '',
                email: '',
                password: '',
                phone: '',
                role: 'reception'
            });
        }
        setUserDialogOpen(true);
    };

    const handleSaveUser = async () => {
        if (!userForm.name || !userForm.email) {
            toast.error('Name and email are required');
            return;
        }
        if (!editingUser && !userForm.password) {
            toast.error('Password is required for new users');
            return;
        }

        try {
            if (editingUser) {
                const updateData = { ...userForm };
                if (!updateData.password) delete updateData.password;
                await superAdminAPI.updateTenantUser(id, editingUser.id, updateData);
                toast.success('User updated successfully');
            } else {
                await superAdminAPI.createTenantUser(id, userForm);
                toast.success('User created successfully');
            }
            setUserDialogOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save user');
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await superAdminAPI.deleteTenantUser(id, userToDelete.id);
            toast.success('User deleted successfully');
            setDeleteUserDialog(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleResetPassword = async (userId) => {
        const newPassword = prompt('Enter new password (min 6 characters):');
        if (!newPassword || newPassword.length < 6) {
            if (newPassword) toast.error('Password must be at least 6 characters');
            return;
        }
        try {
            await superAdminAPI.updateTenantUser(id, userId, { password: newPassword });
            toast.success('Password reset successfully');
        } catch (error) {
            toast.error('Failed to reset password');
        }
    };

    const handleToggleUserStatus = async (user) => {
        const newStatus = user.status === 'active' ? 'disabled' : 'active';
        try {
            await superAdminAPI.updateTenantUser(id, user.id, { status: newStatus });
            toast.success(`User ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user status');
        }
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
            <div className="flex items-center gap-4">
                <Link to="/superadmin/tenants">
                    <Button variant="ghost" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white">
                        {isNew ? 'Create New Tenant' : tenant.business_name}
                    </h1>
                    {!isNew && <p className="text-slate-400">Manage tenant settings and users</p>}
                </div>
                <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    data-testid="save-tenant-btn"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-violet-400" />
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Business Name *</label>
                                <Input
                                    value={tenant.business_name}
                                    onChange={(e) => setTenant({ ...tenant, business_name: e.target.value })}
                                    placeholder="Enter business name"
                                    className="bg-slate-700/50 border-slate-600 text-white"
                                    data-testid="business-name-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Country</label>
                                <Input
                                    value={tenant.country}
                                    onChange={(e) => setTenant({ ...tenant, country: e.target.value })}
                                    placeholder="India"
                                    className="bg-slate-700/50 border-slate-600 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Timezone</label>
                                <select
                                    value={tenant.timezone}
                                    onChange={(e) => setTenant({ ...tenant, timezone: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                >
                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                    <option value="Europe/London">Europe/London (GMT)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Currency</label>
                                <select
                                    value={tenant.currency}
                                    onChange={(e) => setTenant({ ...tenant, currency: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Plan</label>
                                <select
                                    value={tenant.plan_id}
                                    onChange={(e) => setTenant({ ...tenant, plan_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                    data-testid="plan-select"
                                >
                                    <option value="">Select Plan</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                                <select
                                    value={tenant.status}
                                    onChange={(e) => setTenant({ ...tenant, status: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                    data-testid="status-select"
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="trial">Trial</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                        <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-violet-400" />
                            Feature Overrides
                        </h2>
                        <p className="text-sm text-slate-400 mb-6">
                            Override plan features for this tenant. Click to toggle.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                                const enabled = getEffectiveFeatureValue(key);
                                const overridden = isFeatureOverridden(key);
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleFeatureToggle(key)}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                                            enabled 
                                                ? 'bg-green-500/10 border border-green-500/30' 
                                                : 'bg-slate-700/30 border border-slate-600/50'
                                        } ${overridden ? 'ring-2 ring-violet-500/50' : ''}`}
                                        data-testid={`feature-toggle-${key}`}
                                    >
                                        <span className={enabled ? 'text-green-400' : 'text-slate-400'}>{label}</span>
                                        <div className="flex items-center gap-2">
                                            {overridden && (
                                                <span className="text-xs px-2 py-0.5 bg-violet-500/30 text-violet-300 rounded">
                                                    Override
                                                </span>
                                            )}
                                            {enabled ? (
                                                <ToggleRight className="h-6 w-6 text-green-400" />
                                            ) : (
                                                <ToggleLeft className="h-6 w-6 text-slate-500" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Users Section (only for existing tenants) */}
                    {!isNew && (
                        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <Users className="h-5 w-5 text-violet-400" />
                                    Users ({users.length})
                                </h2>
                                <Button 
                                    onClick={() => openUserDialog()}
                                    className="bg-violet-600 hover:bg-violet-700"
                                    data-testid="add-user-btn"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add User
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {users.map((user) => (
                                    <div 
                                        key={user.id} 
                                        className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl"
                                        data-testid={`user-row-${user.id}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                                <span className="text-white font-medium">
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{user.name}</div>
                                                <div className="text-sm text-slate-400">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                                                user.role === 'tenant_admin' 
                                                    ? 'bg-violet-500/20 text-violet-400' 
                                                    : 'bg-slate-600/50 text-slate-300'
                                            }`}>
                                                {user.role === 'tenant_admin' ? 'Admin' : user.role}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                user.status === 'active' 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {user.status || 'active'}
                                            </span>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => openUserDialog(user)}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleResetPassword(user.id)}
                                                className="text-slate-400 hover:text-amber-400"
                                                title="Reset Password"
                                            >
                                                <Key className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleToggleUserStatus(user)}
                                                className={user.status === 'active' ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-green-400'}
                                                title={user.status === 'active' ? 'Disable User' : 'Enable User'}
                                            >
                                                {user.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => {
                                                    setUserToDelete(user);
                                                    setDeleteUserDialog(true);
                                                }}
                                                className="text-slate-400 hover:text-red-400"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No users yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Info */}
                    {!isNew && (
                        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Info</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Status</span>
                                    <span className={`capitalize ${
                                        tenant.status === 'active' ? 'text-green-400' : 
                                        tenant.status === 'suspended' ? 'text-red-400' : 'text-amber-400'
                                    }`}>
                                        {tenant.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Users</span>
                                    <span className="text-white">{users.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Plan</span>
                                    <span className="text-white">
                                        {plans.find(p => p.id === tenant.plan_id)?.name || 'None'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help */}
                    <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-2xl border border-violet-500/30 p-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Need Help?</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Feature overrides let you customize which modules this tenant can access, 
                            independent of their plan settings.
                        </p>
                        <Button variant="outline" className="w-full border-violet-500/50 text-violet-400 hover:bg-violet-500/10">
                            Contact Support
                        </Button>
                    </div>
                </div>
            </div>

            {/* User Dialog */}
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {editingUser ? 'Update user details' : 'Create a new user for this tenant'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Name *</label>
                            <Input
                                value={userForm.name}
                                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                placeholder="Enter name"
                                className="bg-slate-700/50 border-slate-600 text-white"
                                data-testid="user-name-input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Email *</label>
                            <Input
                                type="email"
                                value={userForm.email}
                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                placeholder="Enter email"
                                className="bg-slate-700/50 border-slate-600 text-white"
                                data-testid="user-email-input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Password {editingUser ? '(leave blank to keep current)' : '*'}
                            </label>
                            <Input
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                placeholder={editingUser ? '••••••••' : 'Enter password'}
                                className="bg-slate-700/50 border-slate-600 text-white"
                                data-testid="user-password-input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Phone</label>
                            <Input
                                value={userForm.phone}
                                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                                placeholder="Enter phone number"
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                            <select
                                value={userForm.role}
                                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                data-testid="user-role-select"
                            >
                                <option value="tenant_admin">Tenant Admin</option>
                                <option value="admin">Admin</option>
                                <option value="reception">Reception</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserDialogOpen(false)} className="border-slate-600 text-slate-300">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveUser} className="bg-violet-600 hover:bg-violet-700" data-testid="save-user-btn">
                            {editingUser ? 'Update' : 'Create'} User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <AlertDialog open={deleteUserDialog} onOpenChange={setDeleteUserDialog}>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Are you sure you want to delete "{userToDelete?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 text-white hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default TenantDetailPage;
