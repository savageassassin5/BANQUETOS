import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, CalendarDays, Building2, Users, UtensilsCrossed,
    ClipboardList, CreditCard, FileText, MessageSquare, LogOut, Menu, X, ChevronRight,
    AlertTriangle, BarChart3, Truck, Bell, Sparkles, Receipt, PartyPopper
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'from-violet-500 to-purple-500', roles: ['admin', 'tenant_admin', 'reception', 'staff'], feature: null },
    { path: '/dashboard/bookings', icon: ClipboardList, label: 'Bookings', color: 'from-blue-500 to-cyan-500', roles: ['admin', 'tenant_admin', 'reception'], feature: 'bookings' },
    { path: '/dashboard/calendar', icon: CalendarDays, label: 'Calendar', color: 'from-emerald-500 to-teal-500', roles: ['admin', 'tenant_admin', 'reception'], feature: 'calendar' },
    { path: '/dashboard/halls', icon: Building2, label: 'Venues', color: 'from-orange-500 to-amber-500', roles: ['admin', 'tenant_admin', 'reception'], feature: 'halls' },
    { path: '/dashboard/menu', icon: UtensilsCrossed, label: 'Menu', color: 'from-pink-500 to-rose-500', roles: ['admin', 'tenant_admin', 'reception'], feature: 'menu' },
    { path: '/dashboard/customers', icon: Users, label: 'Clients', color: 'from-indigo-500 to-blue-500', roles: ['admin', 'tenant_admin', 'reception'], feature: 'customers' },
    { path: '/dashboard/vendors', icon: Truck, label: 'Vendors', color: 'from-fuchsia-500 to-pink-500', roles: ['admin', 'tenant_admin'], feature: 'vendors' },
    { path: '/dashboard/payments', icon: CreditCard, label: 'Payments', color: 'from-green-500 to-emerald-500', roles: ['admin', 'tenant_admin', 'reception'], feature: 'payments' },
    { path: '/dashboard/party-planning', icon: PartyPopper, label: 'Party Planning', color: 'from-amber-500 to-yellow-500', roles: ['admin', 'tenant_admin'], feature: 'party_planning' },
    { path: '/dashboard/expenses', icon: Receipt, label: 'Expenses', color: 'from-red-500 to-rose-500', roles: ['admin', 'tenant_admin'], feature: 'expenses' },
    { path: '/dashboard/enquiries', icon: MessageSquare, label: 'Enquiries', color: 'from-cyan-500 to-blue-500', roles: ['admin', 'tenant_admin', 'reception'], feature: 'enquiries' },
    { path: '/dashboard/alerts', icon: AlertTriangle, label: 'Alerts', color: 'from-red-500 to-orange-500', roles: ['admin', 'tenant_admin'], feature: null },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', color: 'from-purple-500 to-violet-500', roles: ['admin', 'tenant_admin'], feature: 'analytics' },
    { path: '/dashboard/reports', icon: FileText, label: 'Reports', color: 'from-yellow-500 to-orange-500', roles: ['admin', 'tenant_admin'], feature: 'reports' },
    { path: '/dashboard/notifications', icon: Bell, label: 'Notifications', color: 'from-sky-500 to-indigo-500', roles: ['admin', 'tenant_admin'], feature: 'notifications' },
];

const DashboardLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, hasFeature } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const userRole = user?.role || 'reception';
    const isAdmin = userRole === 'admin' || userRole === 'tenant_admin';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Filter nav items based on user role AND feature flags
    const filteredNavItems = navItems.filter(item => {
        // Check role
        if (!item.roles.includes(userRole)) return false;
        // Check feature (if specified)
        if (item.feature && !hasFeature(item.feature)) return false;
        return true;
    });

    return (
        <div className="min-h-screen admin-dark flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-[#1a1625] border-r border-purple-900/30 z-40">
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-3 h-20 px-6 border-b border-purple-900/30 bg-gradient-to-r from-purple-900/50 via-violet-900/50 to-purple-900/50">
                        <motion.div 
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <Sparkles className="h-6 w-6 text-white" />
                        </motion.div>
                        <div>
                            <span className="font-heading text-lg text-white font-semibold">Mayur Simran</span>
                            <span className="block text-[10px] uppercase tracking-widest text-purple-300/70">Banquet Manager</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {filteredNavItems.map((item, index) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <motion.div
                                    key={item.path}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                                            isActive 
                                                ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-purple-500/20` 
                                                : 'text-purple-200/70 hover:bg-purple-900/30 hover:text-white'
                                        }`}
                                        data-testid={`nav-${item.label.toLowerCase()}`}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: isActive ? 0 : 10 }}
                                            transition={{ type: "spring", stiffness: 400 }}
                                        >
                                            <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                                        </motion.div>
                                        <span className="text-sm font-medium">{item.label}</span>
                                        {isActive && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="ml-auto"
                                            >
                                                <ChevronRight className="h-4 w-4 text-white" />
                                            </motion.div>
                                        )}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>

                    {/* User Info */}
                    <div className="p-4 border-t border-purple-900/30 bg-purple-900/20">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <motion.div 
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
                                whileHover={{ scale: 1.1 }}
                            >
                                <span className="text-white font-semibold">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                <p className="text-xs text-purple-400 font-medium capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-purple-300/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                            onClick={handleLogout}
                            data-testid="logout-btn"
                        >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: 'spring', damping: 30 }}
                            className="fixed inset-y-0 left-0 w-72 bg-[#1a1625] shadow-2xl z-50 lg:hidden border-r border-purple-900/30"
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-purple-900/50 via-violet-900/50 to-purple-900/50 border-b border-purple-900/30">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-6 w-6 text-purple-400" />
                                        <span className="font-heading text-lg text-white font-semibold">Mayur Simran</span>
                                    </div>
                                    <button onClick={() => setSidebarOpen(false)} className="text-purple-300/70 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                                    {filteredNavItems.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                    isActive 
                                                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                                                        : 'text-purple-200/70 hover:bg-purple-900/30 hover:text-white'
                                                }`}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                                <div className="p-4 border-t border-purple-900/30">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-purple-300/70 hover:text-red-400 hover:bg-red-500/10"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4 mr-3" />
                                        Sign Out
                                    </Button>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 lg:pl-72">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-30 bg-[#1a1625]/95 backdrop-blur-xl border-b border-purple-900/30 shadow-lg shadow-black/20">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button 
                            onClick={() => setSidebarOpen(true)} 
                            className="p-2 rounded-xl text-purple-300/70 hover:bg-purple-900/30 hover:text-white transition-colors" 
                            data-testid="mobile-sidebar-toggle"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-400" />
                            <span className="font-heading text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                                Mayur Simran
                            </span>
                        </div>
                        <motion.div 
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow shadow-purple-500/30"
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-white text-sm font-semibold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </motion.div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 md:p-6 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
