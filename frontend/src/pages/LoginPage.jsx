import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
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
            await login(form.email, form.password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div 
                    className="absolute w-96 h-96 bg-white/10 rounded-full -top-48 -left-48 blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div 
                    className="absolute w-96 h-96 bg-yellow-300/20 rounded-full -bottom-48 -right-48 blur-3xl"
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, delay: 2 }}
                />
                <motion.div 
                    className="absolute w-64 h-64 bg-cyan-300/20 rounded-full top-1/2 left-1/4 blur-3xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                />
            </div>
            
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=85')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-transparent to-purple-900/50" />
                
                <div className="relative z-10 flex flex-col justify-center p-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <motion.div 
                            className="flex items-center gap-3 mb-12"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                        </motion.div>
                        <h1 className="font-heading text-5xl lg:text-6xl text-white leading-[1.1] mb-6 font-bold">
                            Mayur Simran
                        </h1>
                        <p className="text-sm uppercase tracking-[0.3em] text-amber-300 mb-8 font-medium">Premium Banquets</p>
                        <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mb-8" />
                        <p className="text-white/70 text-lg max-w-md leading-relaxed">
                            Access your dashboard to manage celebrations 
                            and create extraordinary experiences.
                        </p>
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
                    <div className="lg:hidden text-center mb-12">
                        <motion.div 
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-xl"
                            whileHover={{ rotate: 10, scale: 1.05 }}
                        >
                            <Sparkles className="h-8 w-8 text-white" />
                        </motion.div>
                        <h1 className="font-heading text-3xl text-white font-bold">Mayur Simran</h1>
                        <p className="text-sm uppercase tracking-[0.2em] text-amber-200">Premium Banquets</p>
                    </div>

                    <motion.div 
                        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <div className="text-center mb-10">
                            <h2 className="font-heading text-2xl text-slate-800 mb-2 font-bold">Welcome Back</h2>
                            <p className="text-slate-500 text-sm">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-3 block">Email Address</label>
                                <Input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter your email"
                                    className="w-full border-slate-200 focus:border-purple-400 rounded-xl py-3 px-4"
                                    data-testid="login-email"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-3 block">Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={form.password}
                                        onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="Enter your password"
                                        className="w-full border-slate-200 focus:border-purple-400 rounded-xl py-3 px-4 pr-12"
                                        data-testid="login-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl py-6 font-semibold text-sm shadow-lg shadow-purple-300"
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

                        <div className="mt-8 text-center">
                            <p className="text-slate-500 text-sm">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-purple-600 hover:text-pink-500 font-semibold transition-colors">
                                    Register here
                                </Link>
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <p className="text-center text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">
                                Demo: <span className="font-mono text-purple-600">admin@mayurbanquet.com</span> / <span className="font-mono text-purple-600">admin123</span>
                            </p>
                        </div>
                    </motion.div>

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                            ← Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
