import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Building2, Shield, Calendar, CreditCard, Users, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            toast.success('Welcome back!');
            // Role-based redirect
            if (user.role === 'super_admin') {
                navigate('/superadmin');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: Calendar, text: 'Smart Booking Management', color: 'from-blue-500 to-cyan-500' },
        { icon: CreditCard, text: 'Payment & Invoice Tracking', color: 'from-green-500 to-emerald-500' },
        { icon: Users, text: 'Vendor & Staff Coordination', color: 'from-purple-500 to-pink-500' },
        { icon: BarChart3, text: 'Profit & Analytics Reports', color: 'from-amber-500 to-orange-500' },
    ];

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div 
                    className="absolute w-[600px] h-[600px] bg-violet-500/10 rounded-full -top-64 -left-64 blur-3xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <motion.div 
                    className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full -bottom-32 -right-32 blur-3xl"
                    animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, delay: 2 }}
                />
                <motion.div 
                    className="absolute w-[400px] h-[400px] bg-cyan-500/5 rounded-full top-1/2 left-1/4 blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                />
                {/* Subtle grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>
            
            {/* Left Side - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-center p-16 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Logo */}
                        <motion.div 
                            className="flex items-center gap-4 mb-12"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                                <Building2 className="h-9 w-9 text-white" />
                            </div>
                            <div>
                                <h1 className="font-heading text-3xl text-white font-bold tracking-tight">BANQUETOS</h1>
                                <p className="text-violet-300 text-sm font-medium">Operations Platform</p>
                            </div>
                        </motion.div>

                        {/* Headline */}
                        <h2 className="text-4xl lg:text-5xl text-white leading-tight mb-6 font-bold">
                            Manage Banquet &<br />
                            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                Hotel Operations
                            </span>
                        </h2>
                        
                        <p className="text-white/60 text-lg max-w-md leading-relaxed mb-12">
                            Streamline bookings, payments, vendors, and staff from one powerful dashboard.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            {features.map((feature, i) => (
                                <motion.div
                                    key={feature.text}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
                                    className="flex items-center gap-4"
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                                        <feature.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-white/80 font-medium">{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Trust Badge */}
                        <motion.div 
                            className="mt-16 flex items-center gap-3 text-white/50 text-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <Shield className="h-5 w-5 text-green-400" />
                            <span>Secure • Multi-tenant • Role-based Access</span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-md relative"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <motion.div 
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-500/30"
                            whileHover={{ rotate: 5, scale: 1.05 }}
                        >
                            <Building2 className="h-8 w-8 text-white" />
                        </motion.div>
                        <h1 className="font-heading text-2xl text-white font-bold">BANQUETOS</h1>
                        <p className="text-violet-300 text-sm">Operations Platform</p>
                    </div>

                    {/* Login Card */}
                    <motion.div 
                        className="bg-white/[0.03] backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/10"
                        whileHover={{ scale: 1.005 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <div className="text-center mb-10">
                            <h2 className="text-2xl text-white mb-2 font-bold">Sign in to BANQUETOS</h2>
                            <p className="text-white/50 text-sm">Manage banquet and hotel operations in one place</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3 block">
                                    Email Address
                                </label>
                                <Input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter your email"
                                    className="w-full bg-white/5 border-white/10 focus:border-violet-500 text-white placeholder:text-white/30 rounded-xl py-6 px-4"
                                    data-testid="login-email"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3 block">
                                    Password
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={form.password}
                                        onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="Enter your password"
                                        className="w-full bg-white/5 border-white/10 focus:border-violet-500 text-white placeholder:text-white/30 rounded-xl py-6 px-4 pr-12"
                                        data-testid="login-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-violet-400 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl py-6 font-semibold shadow-lg shadow-violet-500/30 transition-all duration-300"
                                    disabled={loading}
                                    data-testid="login-submit"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2 justify-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            </motion.div>
                                            Signing in...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 justify-center">
                                            <LogIn size={18} />
                                            Sign In
                                        </span>
                                    )}
                                </Button>
                            </motion.div>
                        </form>

                        {/* Removed demo credentials section for production */}
                    </motion.div>

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-white/50 hover:text-white transition-colors text-sm font-medium">
                            ← Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
