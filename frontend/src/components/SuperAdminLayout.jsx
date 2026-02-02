import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, Building2, CreditCard, Users, LogOut, Menu, X, 
    ChevronRight, Shield, Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { path: '/superadmin', icon: LayoutDashboard, label: 'Dashboard', color: 'from-violet-500 to-purple-500' },
    { path: '/superadmin/tenants', icon: Building2, label: 'Tenants', color: 'from-blue-500 to-cyan-500' },
    { path: '/superadmin/plans', icon: CreditCard, label: 'Plans', color: 'from-emerald-500 to-teal-500' },
];

const SuperAdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-800/50 backdrop-blur-xl shadow-xl z-40 border-r border-slate-700/50">
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-3 h-20 px-6 border-b border-slate-700/50 bg-gradient-to-r from-violet-600/20 to-purple-600/20">
                        <motion.div 
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <Shield className="h-6 w-6 text-white" />
                        </motion.div>
                        <div>
                            <span className="font-heading text-lg text-white font-semibold">BanquetOS</span>
                            <span className="block text-[10px] uppercase tracking-widest text-violet-400">Super Admin</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {navItems.map((item, index) => {
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
                                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
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
                    <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <motion.div 
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
                                whileHover={{ scale: 1.1 }}
                            >
                                <span className="text-white font-semibold">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                                </span>
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name || 'Super Admin'}</p>
                                <p className="text-xs text-violet-400 font-medium">Super Admin</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl"
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
                            className="fixed inset-y-0 left-0 w-72 bg-slate-800 shadow-2xl z-50 lg:hidden"
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-violet-600/20 to-purple-600/20 border-b border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-6 w-6 text-violet-400" />
                                        <span className="font-heading text-lg text-white font-semibold">Super Admin</span>
                                    </div>
                                    <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                                    {navItems.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                    isActive 
                                                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                                                        : 'text-slate-400 hover:bg-slate-700/50'
                                                }`}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                                <div className="p-4 border-t border-slate-700/50">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-900/20"
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
                <header className="lg:hidden sticky top-0 z-30 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button 
                            onClick={() => setSidebarOpen(true)} 
                            className="p-2 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors" 
                            data-testid="mobile-sidebar-toggle"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-violet-400" />
                            <span className="font-heading text-lg text-white font-semibold">
                                Super Admin
                            </span>
                        </div>
                        <motion.div 
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow"
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-white text-sm font-semibold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
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

export default SuperAdminLayout;
