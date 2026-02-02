import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
    ArrowRight, Calendar, CreditCard, Users, TrendingUp, Shield, 
    CheckCircle, ChevronRight, Wallet, Receipt, PieChart, UserCheck,
    Building2, Sparkles, Play, Clock, IndianRupee, BarChart3, Lock
} from 'lucide-react';
import { Button } from '../components/ui/button';

// Animated Section Component
const AnimatedSection = ({ children, className = '', delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className="group"
        >
            <div className="bg-white rounded-3xl p-8 h-full border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-violet-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
};

// Step Card Component
const StepCard = ({ number, icon: Icon, title, description, isLast = false, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
        >
            <div className="flex items-start gap-6">
                {/* Number Circle */}
                <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                        <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-violet-600 flex items-center justify-center text-xs font-bold text-violet-600">
                        {number}
                    </div>
                    {/* Connector Line */}
                    {!isLast && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-20 bg-gradient-to-b from-violet-300 to-transparent" />
                    )}
                </div>
                
                {/* Content */}
                <div className="pt-2 pb-12">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 leading-relaxed">{description}</p>
                </div>
            </div>
        </motion.div>
    );
};

// Role Card Component
const RoleCard = ({ icon: Icon, title, description, features, gradient, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
        >
            <div className={`rounded-3xl p-8 h-full bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                        <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                    <p className="text-white/80 mb-6">{description}</p>
                    
                    <ul className="space-y-3">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3 text-white/90">
                                <CheckCircle className="h-5 w-5 text-white/70 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
};

const LandingPage = () => {
    const heroRef = useRef(null);
    
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });
    
    const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

    // Features data
    const features = [
        {
            icon: Calendar,
            title: 'Booking Management',
            description: 'Create and manage bookings with day/night slots, guest counts, and event details in one unified dashboard.'
        },
        {
            icon: CreditCard,
            title: 'Payment Tracking',
            description: 'Track cash, credit, and UPI payments. Monitor advances, balances, and payment status in real-time.'
        },
        {
            icon: Wallet,
            title: 'Vendor Payments',
            description: 'Manage vendor payables, record advance and final payments, track outstanding balances automatically.'
        },
        {
            icon: PieChart,
            title: 'Profit Calculation',
            description: 'Calculate net profit per event by tracking revenue against party expenses and vendor costs.'
        },
        {
            icon: Users,
            title: 'Staff Permissions',
            description: 'Separate admin and reception access levels. Control who can view costs and manage pricing.'
        },
        {
            icon: Receipt,
            title: 'Professional Invoices',
            description: 'Generate detailed PDF invoices with GST breakdown, itemized charges, and payment history.'
        }
    ];

    // Steps data
    const steps = [
        {
            icon: Calendar,
            title: 'Create Booking',
            description: 'Add customer details, select hall, date, slot (day/night), menu items, and guest count.'
        },
        {
            icon: Receipt,
            title: 'Generate Invoice',
            description: 'System auto-calculates food charges, add-ons, discounts, and 5% GST for professional invoicing.'
        },
        {
            icon: IndianRupee,
            title: 'Track Payments',
            description: 'Record payments by mode (cash/UPI/credit). Monitor advances and balance due in real-time.'
        },
        {
            icon: Wallet,
            title: 'Manage Expenses',
            description: 'Add party expenses, track vendor payments, and calculate outstanding balances automatically.'
        },
        {
            icon: TrendingUp,
            title: 'See Profit',
            description: 'View net profit per event. Total revenue minus expenses gives you the complete financial picture.'
        }
    ];

    return (
        <div className="bg-white overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-gray-900">BanquetOS</span>
                        </Link>
                        
                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-gray-600 hover:text-violet-600 transition-colors text-sm font-medium">Features</a>
                            <a href="#how-it-works" className="text-gray-600 hover:text-violet-600 transition-colors text-sm font-medium">How it Works</a>
                            <a href="#roles" className="text-gray-600 hover:text-violet-600 transition-colors text-sm font-medium">Roles</a>
                        </div>

                        {/* CTA Button */}
                        <Link to="/login">
                            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-full px-6 shadow-lg shadow-violet-200 transition-all duration-300 hover:shadow-xl hover:shadow-violet-300">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-violet-50 via-white to-white" />
                <div className="absolute top-20 left-10 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
                <div className="absolute top-40 right-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-200/20 rounded-full blur-3xl" />

                <motion.div 
                    className="relative z-10 max-w-7xl mx-auto px-6 py-20"
                    style={{ opacity: heroOpacity, scale: heroScale }}
                >
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div>
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 border border-violet-200 mb-8"
                            >
                                <Sparkles className="h-4 w-4 text-violet-600" />
                                <span className="text-violet-700 text-sm font-medium">Banquet Management Software</span>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1 
                                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.3 }}
                            >
                                <span className="text-gray-900">Run Your </span>
                                <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Banquet</span>
                                <br />
                                <span className="text-gray-900">Like a </span>
                                <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Pro</span>
                            </motion.h1>

                            {/* Subtitle */}
                            <motion.p 
                                className="text-xl text-gray-500 mb-10 max-w-lg leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                From bookings to profits — manage your entire banquet business in one powerful, easy-to-use platform.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div 
                                className="flex flex-col sm:flex-row gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.7 }}
                            >
                                <Link to="/login">
                                    <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-2xl shadow-xl shadow-violet-200 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-300 hover:-translate-y-1">
                                        Start Free Trial
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Button variant="outline" className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 text-lg px-8 py-6 rounded-2xl transition-all duration-300 hover:border-gray-300">
                                    <Play className="mr-2 h-5 w-5" />
                                    Watch Demo
                                </Button>
                            </motion.div>

                            {/* Trust Indicators */}
                            <motion.div 
                                className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-100"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.9 }}
                            >
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">500+</div>
                                    <div className="text-sm text-gray-500">Events Managed</div>
                                </div>
                                <div className="w-px h-10 bg-gray-200" />
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">₹50L+</div>
                                    <div className="text-sm text-gray-500">Revenue Tracked</div>
                                </div>
                                <div className="w-px h-10 bg-gray-200" />
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">99%</div>
                                    <div className="text-sm text-gray-500">Accuracy</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Visual */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="relative hidden lg:block"
                        >
                            {/* Dashboard Preview Card */}
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
                                <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                                    {/* Header Bar */}
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                        <span className="ml-4 text-sm text-gray-400 font-mono">banquetos.app/dashboard</span>
                                    </div>
                                    
                                    {/* Dashboard Content */}
                                    <div className="p-6 space-y-4">
                                        {/* Stats Row */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-violet-50 rounded-xl p-4">
                                                <div className="text-xs text-violet-600 mb-1">Today's Bookings</div>
                                                <div className="text-2xl font-bold text-gray-900">12</div>
                                            </div>
                                            <div className="bg-green-50 rounded-xl p-4">
                                                <div className="text-xs text-green-600 mb-1">Revenue</div>
                                                <div className="text-2xl font-bold text-gray-900">₹4.2L</div>
                                            </div>
                                            <div className="bg-amber-50 rounded-xl p-4">
                                                <div className="text-xs text-amber-600 mb-1">Pending</div>
                                                <div className="text-2xl font-bold text-gray-900">₹85K</div>
                                            </div>
                                        </div>
                                        
                                        {/* Chart Placeholder */}
                                        <div className="bg-gray-50 rounded-xl p-4 h-32 flex items-end gap-2">
                                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                                <motion.div 
                                                    key={i}
                                                    className="flex-1 bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-lg"
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h}%` }}
                                                    transition={{ duration: 0.5, delay: 0.8 + (i * 0.1) }}
                                                />
                                            ))}
                                        </div>
                                        
                                        {/* Recent Booking */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                                    <Calendar className="h-5 w-5 text-violet-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">Wedding Reception</div>
                                                    <div className="text-sm text-gray-500">250 guests • Grand Hall</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-green-600">₹1,85,000</div>
                                                <div className="text-xs text-gray-400">Today, Night</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Floating Cards */}
                            <motion.div 
                                className="absolute -left-8 top-20 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Payment Received</div>
                                        <div className="text-xs text-gray-500">₹50,000 via UPI</div>
                                    </div>
                                </div>
                            </motion.div>
                            
                            <motion.div 
                                className="absolute -right-4 bottom-20 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Net Profit</div>
                                        <div className="text-xs text-green-600 font-medium">+₹42,500 this event</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <AnimatedSection className="text-center mb-20">
                        <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-4">Features</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Everything You Need to
                            <br />
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Manage Your Business</span>
                        </h2>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Powerful features designed specifically for banquet hall owners to streamline operations and maximize profits.
                        </p>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <FeatureCard
                                key={feature.title}
                                {...feature}
                                delay={index * 0.1}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-20 items-start">
                        {/* Left Content */}
                        <AnimatedSection className="lg:sticky lg:top-32">
                            <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-4">How It Works</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                                From Booking to
                                <br />
                                <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Profit in 5 Steps</span>
                            </h2>
                            <p className="text-xl text-gray-500 mb-8 leading-relaxed">
                                A simple, streamlined workflow that takes you from creating a booking to seeing your net profit — all in one place.
                            </p>
                            
                            {/* Visual Flow */}
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 border border-violet-100">
                                <div className="flex items-center justify-between">
                                    {['Booking', 'Invoice', 'Payment', 'Expense', 'Profit'].map((step, i) => (
                                        <React.Fragment key={step}>
                                            <div className="flex flex-col items-center">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-semibold
                                                    ${i === 4 ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white' : 'bg-white text-violet-600 border border-violet-200'}`}>
                                                    {i + 1}
                                                </div>
                                                <span className="text-xs text-gray-500 mt-2">{step}</span>
                                            </div>
                                            {i < 4 && <ChevronRight className="h-5 w-5 text-violet-300" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Right Steps */}
                        <div className="space-y-0">
                            {steps.map((step, index) => (
                                <StepCard
                                    key={step.title}
                                    number={index + 1}
                                    {...step}
                                    isLast={index === steps.length - 1}
                                    delay={index * 0.15}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Roles & Permissions Section */}
            <section id="roles" className="py-32 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <AnimatedSection className="text-center mb-20">
                        <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-4">Roles & Permissions</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Right Access for
                            <br />
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Every Team Member</span>
                        </h2>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Secure role-based access ensures your staff sees only what they need — nothing more, nothing less.
                        </p>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <RoleCard
                            icon={Shield}
                            title="Admin"
                            description="Full control over all business operations and financial data."
                            gradient="from-violet-600 to-purple-600"
                            features={[
                                'Manage expenses and vendor payments',
                                'Set menu pricing and discounts',
                                'View profit reports and analytics',
                                'Manage staff accounts and permissions',
                                'Access all booking and payment data'
                            ]}
                            delay={0}
                        />
                        <RoleCard
                            icon={UserCheck}
                            title="Reception"
                            description="Focused access for day-to-day booking operations."
                            gradient="from-gray-700 to-gray-800"
                            features={[
                                'Check hall availability',
                                'Create and manage bookings',
                                'Record customer payments',
                                'Generate invoices for customers',
                                'Cannot view expenses or profits'
                            ]}
                            delay={0.15}
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-32 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <AnimatedSection>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
                            <Lock className="h-4 w-4 text-white/70" />
                            <span className="text-white/90 text-sm font-medium">14-Day Free Trial • No Credit Card</span>
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Ready to Transform
                            <br />
                            Your Banquet Business?
                        </h2>
                        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Join hundreds of banquet owners who have streamlined their operations and increased profits with BanquetOS.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/login">
                                <Button className="bg-white text-violet-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Button variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-2xl transition-all duration-300">
                                Schedule Demo
                            </Button>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-white">BanquetOS</span>
                        </div>
                        
                        {/* Links */}
                        <div className="flex items-center gap-8 text-sm">
                            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
                            <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How it Works</a>
                            <a href="#roles" className="text-gray-400 hover:text-white transition-colors">Roles</a>
                            <Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link>
                        </div>

                        {/* Copyright */}
                        <div className="text-gray-500 text-sm">
                            © 2025 BanquetOS. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
