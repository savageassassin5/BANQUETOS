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
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'from-violet-500 to-purple-500', roles: ['admin', 'reception'] },
    { path: '/dashboard/bookings', icon: ClipboardList, label: 'Bookings', color: 'from-blue-500 to-cyan-500', roles: ['admin', 'reception'] },
    { path: '/dashboard/calendar', icon: CalendarDays, label: 'Calendar', color: 'from-emerald-500 to-teal-500', roles: ['admin', 'reception'] },
    { path: '/dashboard/halls', icon: Building2, label: 'Venues', color: 'from-orange-500 to-amber-500', roles: ['admin', 'reception'] },
    { path: '/dashboard/menu', icon: UtensilsCrossed, label: 'Menu', color: 'from-pink-500 to-rose-500', roles: ['admin', 'reception'] },
    { path: '/dashboard/customers', icon: Users, label: 'Clients', color: 'from-indigo-500 to-blue-500', roles: ['admin', 'reception'] },
    { path: '/dashboard/vendors', icon: Truck, label: 'Vendors', color: 'from-fuchsia-500 to-pink-500', roles: ['admin'] },  // Admin only
    { path: '/dashboard/payments', icon: CreditCard, label: 'Payments', color: 'from-green-500 to-emerald-500', roles: ['admin', 'reception'] },
    { path: '/dashboard/party-planning', icon: PartyPopper, label: 'Party Planning', color: 'from-amber-500 to-yellow-500', roles: ['admin'] },  // Admin only
    { path: '/dashboard/expenses', icon: Receipt, label: 'Expenses', color: 'from-red-500 to-rose-500', roles: ['admin'] },  // Admin only
    { path: '/dashboard/enquiries', icon: MessageSquare, label: 'Enquiries', color: 'from-cyan-500 to-blue-500', roles: ['admin', 'reception'] },
    { path: '/dashboard/alerts', icon: AlertTriangle, label: 'Alerts', color: 'from-red-500 to-orange-500', roles: ['admin'] },  // Admin only
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', color: 'from-purple-500 to-violet-500', roles: ['admin'] },  // Admin only
    { path: '/dashboard/reports', icon: FileText, label: 'Reports', color: 'from-yellow-500 to-orange-500', roles: ['admin'] },  // Admin only
    { path: '/dashboard/notifications', icon: Bell, label: 'Notifications', color: 'from-sky-500 to-indigo-500', roles: ['admin'] },  // Admin only
];

const DashboardLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const userRole = user?.role || 'reception';
    const isAdmin = userRole === 'admin';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Filter nav items based on user role
    const filteredNavItems = navItems.filter(item => {
        return item.roles.includes(userRole);
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white shadow-xl z-40 border-r border-purple-100">
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-3 h-20 px-6 border-b border-purple-100 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">
                        <motion.div 
                            className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <Sparkles className="h-6 w-6 text-white" />
                        </motion.div>
                        <div>
                            <span className="font-heading text-lg text-white font-semibold">Mayur Simran</span>
                            <span className="block text-[10px] uppercase tracking-widest text-white/80">Banquet Manager</span>
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
                                                ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                                                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
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
                    <div className="p-4 border-t border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <motion.div 
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                                whileHover={{ scale: 1.1 }}
                            >
                                <span className="text-white font-semibold">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">{user?.name}</p>
                                <p className="text-xs text-purple-600 font-medium capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl"
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
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: 'spring', damping: 30 }}
                            className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 lg:hidden"
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-6 w-6 text-white" />
                                        <span className="font-heading text-lg text-white font-semibold">Mayur Simran</span>
                                    </div>
                                    <button onClick={() => setSidebarOpen(false)} className="text-white/80 hover:text-white">
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
                                                        : 'text-slate-600 hover:bg-purple-50'
                                                }`}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                                <div className="p-4 border-t border-purple-100">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-slate-500 hover:text-red-500 hover:bg-red-50"
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
                <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-purple-100 shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button 
                            onClick={() => setSidebarOpen(true)} 
                            className="p-2 rounded-xl text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors" 
                            data-testid="mobile-sidebar-toggle"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            <span className="font-heading text-lg bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-semibold">
                                Mayur Simran
                            </span>
                        </div>
                        <motion.div 
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow"
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
                        transition={{ duration: 0.5 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
