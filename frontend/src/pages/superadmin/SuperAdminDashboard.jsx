import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Building2, Users, CreditCard, TrendingUp, Plus, ArrowRight,
    CheckCircle, XCircle, Clock, Activity
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, label, value, trend, color, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50"
    >
        <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            {trend && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-slate-400">{label}</div>
    </motion.div>
);

const TenantRow = ({ tenant, index }) => {
    const statusColors = {
        active: 'bg-green-500/20 text-green-400',
        suspended: 'bg-red-500/20 text-red-400',
        trial: 'bg-amber-500/20 text-amber-400'
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-700/30 transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                        {tenant.business_name?.charAt(0)?.toUpperCase() || 'T'}
                    </span>
                </div>
                <div>
                    <div className="font-medium text-white">{tenant.business_name}</div>
                    <div className="text-sm text-slate-400">{tenant.user_count || 0} users</div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColors[tenant.status] || statusColors.active}`}>
                    {tenant.status || 'active'}
                </span>
                <Link to={`/superadmin/tenants/${tenant.id}`}>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
};

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState({
        total_tenants: 0,
        active_tenants: 0,
        total_users: 0,
        total_plans: 0
    });
    const [recentTenants, setRecentTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, tenantsRes] = await Promise.all([
                superAdminAPI.getStats(),
                superAdminAPI.getTenants()
            ]);
            setStats(statsRes.data);
            setRecentTenants(tenantsRes.data.slice(0, 5));
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Super Admin Dashboard</h1>
                    <p className="text-slate-400">Manage all tenants and platform settings</p>
                </div>
                <Link to="/superadmin/tenants/new">
                    <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tenant
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    icon={Building2} 
                    label="Total Tenants" 
                    value={stats.total_tenants} 
                    color="from-violet-500 to-purple-600"
                    delay={0}
                />
                <StatCard 
                    icon={CheckCircle} 
                    label="Active Tenants" 
                    value={stats.active_tenants} 
                    color="from-green-500 to-emerald-600"
                    delay={0.1}
                />
                <StatCard 
                    icon={Users} 
                    label="Total Users" 
                    value={stats.total_users} 
                    color="from-blue-500 to-cyan-600"
                    delay={0.2}
                />
                <StatCard 
                    icon={CreditCard} 
                    label="Plans" 
                    value={stats.total_plans} 
                    color="from-amber-500 to-orange-600"
                    delay={0.3}
                />
            </div>

            {/* Recent Tenants */}
            <div className="bg-slate-800/30 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-semibold text-white">Recent Tenants</h2>
                    <Link to="/superadmin/tenants">
                        <Button variant="ghost" className="text-slate-400 hover:text-white">
                            View All
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>
                <div className="p-4 space-y-2">
                    {recentTenants.length > 0 ? (
                        recentTenants.map((tenant, index) => (
                            <TenantRow key={tenant.id} tenant={tenant} index={index} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No tenants yet</p>
                            <Link to="/superadmin/tenants/new">
                                <Button variant="outline" className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700">
                                    Create First Tenant
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/superadmin/tenants/new" className="block">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-2xl p-6 border border-violet-500/30 hover:border-violet-400/50 transition-colors cursor-pointer"
                    >
                        <Building2 className="h-8 w-8 text-violet-400 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-1">Add New Tenant</h3>
                        <p className="text-sm text-slate-400">Create a new banquet organization</p>
                    </motion.div>
                </Link>
                <Link to="/superadmin/plans" className="block">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-400/50 transition-colors cursor-pointer"
                    >
                        <CreditCard className="h-8 w-8 text-emerald-400 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-1">Manage Plans</h3>
                        <p className="text-sm text-slate-400">Configure feature plans</p>
                    </motion.div>
                </Link>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-colors cursor-pointer"
                >
                    <Activity className="h-8 w-8 text-blue-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-1">Platform Health</h3>
                    <p className="text-sm text-slate-400">All systems operational</p>
                </motion.div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
