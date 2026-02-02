import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Building2, Plus, Search, Filter, MoreVertical, Edit, Trash2,
    CheckCircle, XCircle, Clock, Users, ArrowUpRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
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

const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'trial', label: 'Trial' }
];

const TenantsPage = () => {
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tenantToDelete, setTenantToDelete] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tenantsRes, plansRes] = await Promise.all([
                superAdminAPI.getTenants(),
                superAdminAPI.getPlans()
            ]);
            setTenants(tenantsRes.data);
            setPlans(plansRes.data);
        } catch (error) {
            toast.error('Failed to load tenants');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (tenantId, newStatus) => {
        try {
            await superAdminAPI.updateTenant(tenantId, { status: newStatus });
            setTenants(tenants.map(t => 
                t.id === tenantId ? { ...t, status: newStatus } : t
            ));
            toast.success(`Tenant ${newStatus === 'active' ? 'activated' : 'suspended'}`);
        } catch (error) {
            toast.error('Failed to update tenant status');
        }
    };

    const handleDelete = async () => {
        if (!tenantToDelete) return;
        try {
            await superAdminAPI.deleteTenant(tenantToDelete.id);
            setTenants(tenants.filter(t => t.id !== tenantToDelete.id));
            toast.success('Tenant deleted successfully');
        } catch (error) {
            toast.error('Failed to delete tenant');
        } finally {
            setDeleteDialogOpen(false);
            setTenantToDelete(null);
        }
    };

    const getPlanName = (planId) => {
        const plan = plans.find(p => p.id === planId);
        return plan?.name || 'No Plan';
    };

    const filteredTenants = tenants.filter(tenant => {
        const matchesSearch = tenant.business_name?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusColors = {
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
        trial: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    };

    const statusIcons = {
        active: CheckCircle,
        suspended: XCircle,
        trial: Clock
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
                    <h1 className="text-3xl font-bold text-white mb-2">Tenants</h1>
                    <p className="text-slate-400">Manage all registered organizations</p>
                </div>
                <Link to="/superadmin/tenants/new">
                    <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg" data-testid="add-tenant-btn">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tenant
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search tenants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        data-testid="search-tenants"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    data-testid="status-filter"
                >
                    {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {/* Tenants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTenants.map((tenant, index) => {
                    const StatusIcon = statusIcons[tenant.status] || CheckCircle;
                    return (
                        <motion.div
                            key={tenant.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-colors"
                            data-testid={`tenant-card-${tenant.id}`}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">
                                            {tenant.business_name?.charAt(0)?.toUpperCase() || 'T'}
                                        </span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                            <DropdownMenuItem asChild className="text-slate-300 hover:text-white focus:text-white">
                                                <Link to={`/superadmin/tenants/${tenant.id}`}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            {tenant.status === 'active' ? (
                                                <DropdownMenuItem 
                                                    onClick={() => handleStatusChange(tenant.id, 'suspended')}
                                                    className="text-amber-400 hover:text-amber-300 focus:text-amber-300"
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Suspend
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem 
                                                    onClick={() => handleStatusChange(tenant.id, 'active')}
                                                    className="text-green-400 hover:text-green-300 focus:text-green-300"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Activate
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem 
                                                onClick={() => {
                                                    setTenantToDelete(tenant);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                className="text-red-400 hover:text-red-300 focus:text-red-300"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-1">{tenant.business_name}</h3>
                                <p className="text-sm text-slate-400 mb-4">{tenant.country || 'India'} • {tenant.timezone || 'IST'}</p>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${statusColors[tenant.status] || statusColors.active}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {tenant.status || 'active'}
                                    </span>
                                    <span className="text-xs text-slate-500 px-2 py-1 bg-slate-700/50 rounded-full">
                                        {getPlanName(tenant.plan_id)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Users className="h-4 w-4" />
                                        <span className="text-sm">{tenant.user_count || 0} users</span>
                                    </div>
                                    <Link to={`/superadmin/tenants/${tenant.id}`}>
                                        <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
                                            View
                                            <ArrowUpRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {filteredTenants.length === 0 && (
                <div className="text-center py-16">
                    <Building2 className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Tenants Found</h3>
                    <p className="text-slate-400 mb-6">
                        {search || statusFilter !== 'all' 
                            ? 'Try adjusting your filters' 
                            : 'Get started by adding your first tenant'}
                    </p>
                    {!search && statusFilter === 'all' && (
                        <Link to="/superadmin/tenants/new">
                            <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Tenant
                            </Button>
                        </Link>
                    )}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Tenant</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Are you sure you want to delete "{tenantToDelete?.business_name}"? 
                            This action cannot be undone and will remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default TenantsPage;
