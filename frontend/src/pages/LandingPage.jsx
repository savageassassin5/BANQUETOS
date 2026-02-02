import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
    ArrowRight, Calendar, CreditCard, Users, TrendingUp, Shield, 
    CheckCircle, ChevronRight, Wallet, Receipt, PieChart, UserCheck,
    Building2, Sparkles, Play, Clock, BarChart3, Lock, X,
    Globe, Zap, FileText, AlertTriangle, Settings, Download,
    ChevronDown, Hotel, PartyPopper, MapPin, Truck, Bell,
    Target, Heart, Star, Check, ArrowUpRight, Phone, Mail
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

// ==================== ANIMATION UTILITIES ====================
const useReducedMotionSafe = () => {
    const shouldReduceMotion = useReducedMotion();
    return shouldReduceMotion;
};

// Animated Counter Hook
const useAnimatedCounter = (end, duration = 2000, start = 0) => {
    const [count, setCount] = useState(start);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const reduceMotion = useReducedMotionSafe();
    
    useEffect(() => {
        if (!isInView) return;
        if (reduceMotion) {
            setCount(end);
            return;
        }
        
        let startTime = null;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * (end - start) + start));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isInView, end, duration, start, reduceMotion]);
    
    return [count, ref];
};

// ==================== REUSABLE COMPONENTS ====================

// Animated Section with stagger support
const AnimatedSection = ({ children, className = '', delay = 0, stagger = false }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const reduceMotion = useReducedMotionSafe();
    
    const variants = {
        hidden: { opacity: 0, y: reduceMotion ? 0 : 40 },
        visible: { opacity: 1, y: 0 }
    };
    
    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={variants}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Feature Card with hover effects
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const reduceMotion = useReducedMotionSafe();
    
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduceMotion ? 0 : 30 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={reduceMotion ? {} : { y: -8, transition: { duration: 0.3 } }}
            className="group cursor-pointer"
        >
            <div className="bg-white rounded-3xl p-8 h-full border border-gray-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-500">
                <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center mb-6"
                    whileHover={reduceMotion ? {} : { scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <Icon className="h-7 w-7 text-violet-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-violet-600 transition-colors">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
};

// Use Case Card
const UseCaseCard = ({ icon: Icon, title, description, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const reduceMotion = useReducedMotionSafe();
    
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduceMotion ? 1 : 0.9 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay }}
            whileHover={reduceMotion ? {} : { scale: 1.05 }}
            className="group"
        >
            <div className="bg-white rounded-2xl p-6 h-full border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all duration-300 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-4 group-hover:from-violet-200 group-hover:to-purple-200 transition-colors">
                    <Icon className="h-8 w-8 text-violet-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </motion.div>
    );
};

// FAQ Accordion Item
const FAQItem = ({ question, answer, isOpen, onClick, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const reduceMotion = useReducedMotionSafe();
    
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduceMotion ? 0 : 20 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, delay }}
            className="border-b border-gray-100 last:border-0"
        >
            <button
                onClick={onClick}
                className="w-full py-6 flex items-center justify-between text-left group"
            >
                <span className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors pr-4">{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                >
                    <ChevronDown className={`h-5 w-5 transition-colors ${isOpen ? 'text-violet-600' : 'text-gray-400'}`} />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-gray-500 leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Floating Shape Component for parallax
const FloatingShape = ({ className, delay = 0, duration = 4, y = 20 }) => {
    const reduceMotion = useReducedMotionSafe();
    
    if (reduceMotion) return <div className={className} />;
    
    return (
        <motion.div
            className={className}
            animate={{ y: [-y, y, -y] }}
            transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
        />
    );
};

// Demo Modal Component
const DemoModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '', business: '', country: '', email: '', phone: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const reduceMotion = useReducedMotionSafe();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const API_URL = process.env.REACT_APP_BACKEND_URL || '';
            await fetch(`${API_URL}/api/enquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    message: `Demo Request - Business: ${formData.business}, Country: ${formData.country}`,
                    source: 'demo_request'
                })
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting demo request:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : 20 }}
                    transition={{ duration: reduceMotion ? 0 : 0.3 }}
                    className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>

                    {submitted ? (
                        <div className="text-center py-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
                            >
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                            <p className="text-gray-500 mb-6">We'll contact you within 24 hours to schedule your demo.</p>
                            <Button onClick={onClose} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl">
                                Close
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                                    <Play className="h-7 w-7 text-violet-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Book a Demo</h3>
                                <p className="text-gray-500">See BanquetOS in action. Get a personalized walkthrough.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Input
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="rounded-xl border-gray-200 focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <Input
                                        placeholder="Business Name"
                                        value={formData.business}
                                        onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                                        required
                                        className="rounded-xl border-gray-200 focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <Input
                                        placeholder="Country"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        required
                                        className="rounded-xl border-gray-200 focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="rounded-xl border-gray-200 focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <Input
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        className="rounded-xl border-gray-200 focus:border-violet-500"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl py-6 text-lg shadow-lg shadow-violet-200"
                                >
                                    {submitting ? 'Submitting...' : 'Request Demo'}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </form>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ==================== MAIN LANDING PAGE ====================
const LandingPage = () => {
    const heroRef = useRef(null);
    const [demoModalOpen, setDemoModalOpen] = useState(false);
    const [openFAQ, setOpenFAQ] = useState(null);
    const reduceMotion = useReducedMotionSafe();
    
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });
    
    const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
    const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

    // ==================== DATA ====================
    
    const features = [
        { icon: Calendar, title: 'Smart Booking & Calendar', description: 'Avoid double bookings with conflict protection. Day/night slots, guest counts, all in one view.' },
        { icon: PartyPopper, title: 'Party Planning', description: 'Coordinate vendors, staff, and checklists for each event. Run-sheet included.' },
        { icon: CreditCard, title: 'Payments & Invoices', description: 'Track cash, UPI, credit payments. Generate professional PDF invoices with GST.' },
        { icon: PieChart, title: 'Expenses & Profit Tracking', description: 'Record event expenses, vendor costs. See net profit per event instantly.' },
        { icon: Building2, title: 'Multi-Hall / Multi-Venue', description: 'Manage multiple halls with separate pricing and availability. Perfect for large venues.' },
        { icon: Users, title: 'Customers & Enquiries', description: 'CRM for your clients. Track enquiries, convert leads, maintain customer history.' },
        { icon: BarChart3, title: 'Reports & Audit Trail', description: 'Financial reports, booking analytics, audit logs. Export to CSV anytime.' },
        { icon: Shield, title: 'Role-Based Permissions', description: 'Admin, Reception, Staff roles. Control who sees costs, profits, and sensitive data.' },
        { icon: Globe, title: 'Global Settings', description: 'Timezone, currency, tax settings. Works for businesses in India and worldwide.' },
        { icon: Lock, title: 'Super Admin (SaaS)', description: 'For multi-location groups. Manage tenants, plans, and users from one dashboard.' },
    ];

    const howItWorks = [
        { icon: Building2, title: 'Add Halls & Packages', description: 'Set up your venues with pricing, capacity, and amenities.' },
        { icon: Calendar, title: 'Take Bookings', description: 'Create bookings with conflict protection. No more double bookings.' },
        { icon: Truck, title: 'Plan Staff & Vendors', description: 'Assign vendors, track payments, manage event logistics.' },
        { icon: TrendingUp, title: 'See Profit & Export', description: 'View net profit per event. Export reports for accounting.' },
    ];

    const useCases = [
        { icon: Building2, title: 'Banquet Halls', description: 'Perfect for traditional banquet operations' },
        { icon: Hotel, title: 'Hotels', description: 'Manage hotel event spaces and ballrooms' },
        { icon: Heart, title: 'Wedding Venues', description: 'Specialized for wedding celebrations' },
        { icon: PartyPopper, title: 'Event Spaces', description: 'Corporate events, parties, and more' },
        { icon: MapPin, title: 'Multi-Location Groups', description: 'Manage all venues from one dashboard' },
    ];

    const faqs = [
        { question: 'Is BanquetOS suitable for hotels and banquet halls?', answer: 'Yes! BanquetOS is designed for both traditional banquet halls and hotel event spaces. It handles everything from small party rooms to large ballrooms with multiple booking slots.' },
        { question: 'Can reception staff access limited modules?', answer: 'Absolutely. We have role-based permissions. Reception staff can create bookings and record payments, but cannot see expenses, profit margins, or admin settings. You control who sees what.' },
        { question: 'Does it support multiple halls or venues?', answer: 'Yes. You can add unlimited halls with individual pricing, capacity, and availability calendars. Perfect for venues with multiple event spaces.' },
        { question: 'Can I export reports for my accountant?', answer: 'Yes. Export bookings, payments, and financial reports to CSV with one click. All data is audit-ready with timestamps and user tracking.' },
        { question: 'Does it work worldwide with different currencies and timezones?', answer: 'Yes! BanquetOS supports multiple currencies (INR, USD, EUR, GBP) and timezones. Whether you\'re in India, USA, or anywhere else, it adapts to your locale.' },
        { question: 'How do I get enterprise access for multiple locations?', answer: 'Contact us for enterprise rollout. We offer multi-tenant setup where you can manage all your locations from a single Super Admin dashboard with centralized billing.' },
    ];

    const problems = [
        'Double bookings causing chaos',
        'Payment confusion and tracking nightmares',
        'Vendor payments scattered everywhere',
        'No visibility into actual profit',
        'Staff accessing sensitive pricing data',
    ];

    const solutions = [
        'Smart conflict detection prevents overlaps',
        'One dashboard for all payment modes',
        'Vendor management with auto-calculations',
        'Real-time profit per event tracking',
        'Role-based access controls everything',
    ];

    // Animated counters
    const [eventsCount, eventsRef] = useAnimatedCounter(500, 2000);
    const [venuesCount, venuesRef] = useAnimatedCounter(50, 1500);
    const [countriesCount, countriesRef] = useAnimatedCounter(12, 1800);

    return (
        <div className="bg-white overflow-x-hidden">
            {/* Demo Modal */}
            <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />

            {/* ==================== NAVIGATION ==================== */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3">
                            <motion.div 
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200"
                                whileHover={reduceMotion ? {} : { scale: 1.05, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                <Building2 className="h-5 w-5 text-white" />
                            </motion.div>
                            <span className="font-bold text-xl text-gray-900">BanquetOS</span>
                        </Link>
                        
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-gray-600 hover:text-violet-600 transition-colors text-sm font-medium">Features</a>
                            <a href="#how-it-works" className="text-gray-600 hover:text-violet-600 transition-colors text-sm font-medium">How it Works</a>
                            <a href="#use-cases" className="text-gray-600 hover:text-violet-600 transition-colors text-sm font-medium">Use Cases</a>
                            <a href="#faq" className="text-gray-600 hover:text-violet-600 transition-colors text-sm font-medium">FAQ</a>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button 
                                variant="ghost" 
                                onClick={() => setDemoModalOpen(true)}
                                className="hidden sm:flex text-gray-600 hover:text-violet-600"
                            >
                                Book Demo
                            </Button>
                            <Link to="/login">
                                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-full px-6 shadow-lg shadow-violet-200 transition-all duration-300 hover:shadow-xl hover:shadow-violet-300">
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ==================== 1. HERO SECTION ==================== */}
            <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-violet-50 via-white to-white" />
                <FloatingShape className="absolute top-20 left-10 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" duration={6} y={30} />
                <FloatingShape className="absolute top-40 right-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" duration={8} y={25} delay={1} />
                <FloatingShape className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-200/20 rounded-full blur-3xl" duration={7} y={20} delay={2} />
                
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

                <motion.div 
                    className="relative z-10 max-w-7xl mx-auto px-6 py-20"
                    style={reduceMotion ? {} : { opacity: heroOpacity, scale: heroScale, y: heroY }}
                >
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div>
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 border border-violet-200 mb-8"
                            >
                                <Sparkles className="h-4 w-4 text-violet-600" />
                                <span className="text-violet-700 text-sm font-medium">Banquet & Hotel Operations Software</span>
                            </motion.div>

                            {/* Headline with stagger */}
                            <motion.h1 
                                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.3 }}
                            >
                                <motion.span 
                                    className="block text-gray-900"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.4 }}
                                >
                                    All-in-One
                                </motion.span>
                                <motion.span 
                                    className="block bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.5 }}
                                >
                                    Banquet & Hotel
                                </motion.span>
                                <motion.span 
                                    className="block text-gray-900"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.6 }}
                                >
                                    Operations Software
                                </motion.span>
                            </motion.h1>

                            {/* Subtitle */}
                            <motion.p 
                                className="text-xl text-gray-500 mb-8 max-w-lg leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.7 }}
                            >
                                Manage bookings, staff, vendors, payments, and profit—without chaos. Built for banquet halls and hotels worldwide.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div 
                                className="flex flex-col sm:flex-row gap-4 mb-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.8 }}
                            >
                                <Link to="/login">
                                    <motion.div
                                        whileHover={reduceMotion ? {} : { scale: 1.02, y: -2 }}
                                        whileTap={reduceMotion ? {} : { scale: 0.98 }}
                                    >
                                        <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-2xl shadow-xl shadow-violet-200 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-300 relative overflow-hidden group" data-testid="get-started-btn">
                                            <span className="relative z-10 flex items-center">
                                                Get Started
                                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-violet-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Button>
                                    </motion.div>
                                </Link>
                                <motion.div
                                    whileHover={reduceMotion ? {} : { scale: 1.02 }}
                                    whileTap={reduceMotion ? {} : { scale: 0.98 }}
                                >
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setDemoModalOpen(true)}
                                        className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 text-lg px-8 py-6 rounded-2xl transition-all duration-300"
                                        data-testid="book-demo-btn"
                                    >
                                        <Play className="mr-2 h-5 w-5" />
                                        Book a Demo
                                    </Button>
                                </motion.div>
                            </motion.div>

                            {/* Micro-benefit chips */}
                            <motion.div 
                                className="flex flex-wrap gap-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: reduceMotion ? 0 : 0.6, delay: 1 }}
                            >
                                {[
                                    { icon: Shield, text: 'No double booking' },
                                    { icon: TrendingUp, text: 'Profit per event' },
                                    { icon: Globe, text: 'Works worldwide' },
                                ].map((chip, i) => (
                                    <motion.div
                                        key={chip.text}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: reduceMotion ? 0 : 0.3, delay: 1.1 + (i * 0.1) }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100"
                                    >
                                        <chip.icon className="h-4 w-4 text-violet-600" />
                                        <span className="text-sm text-gray-600 font-medium">{chip.text}</span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Right Visual - Dashboard Preview */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.5 }}
                            className="relative hidden lg:block"
                        >
                            <div className="relative">
                                <motion.div 
                                    className="absolute -inset-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-3xl blur-2xl opacity-20"
                                    animate={reduceMotion ? {} : { opacity: [0.15, 0.25, 0.15] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                />
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
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: "Today's Bookings", value: '12', color: 'violet' },
                                                { label: 'Revenue', value: '₹4.2L', color: 'green' },
                                                { label: 'Profit', value: '₹1.8L', color: 'amber' },
                                            ].map((stat, i) => (
                                                <motion.div 
                                                    key={stat.label}
                                                    className={`bg-${stat.color}-50 rounded-xl p-4`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.8 + (i * 0.1) }}
                                                >
                                                    <div className={`text-xs text-${stat.color}-600 mb-1`}>{stat.label}</div>
                                                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        
                                        {/* Chart */}
                                        <div className="bg-gray-50 rounded-xl p-4 h-32 flex items-end gap-2">
                                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                                <motion.div 
                                                    key={i}
                                                    className="flex-1 bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-lg"
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h}%` }}
                                                    transition={{ duration: reduceMotion ? 0 : 0.5, delay: 1 + (i * 0.1) }}
                                                />
                                            ))}
                                        </div>
                                        
                                        {/* Recent Booking */}
                                        <motion.div 
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.5 }}
                                        >
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
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Floating Cards */}
                            <FloatingShape 
                                className="absolute -left-8 top-20 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                                duration={4}
                                y={10}
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
                            </FloatingShape>
                            
                            <FloatingShape 
                                className="absolute -right-4 bottom-20 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                                duration={5}
                                y={10}
                                delay={1}
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
                            </FloatingShape>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* ==================== 2. TRUST STRIP ==================== */}
            <section className="py-12 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div 
                        className="flex flex-wrap items-center justify-center gap-8 md:gap-16"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: reduceMotion ? 0 : 0.6 }}
                    >
                        {[
                            { icon: Zap, text: 'Built for real banquet workflows' },
                            { icon: Shield, text: 'Role-based access (Admin/Reception/Staff)' },
                            { icon: Lock, text: 'Secure & scalable' },
                            { icon: Globe, text: 'India + Worldwide' },
                        ].map((item, i) => (
                            <motion.div 
                                key={item.text}
                                className="flex items-center gap-3 text-gray-600"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: reduceMotion ? 0 : 0.4, delay: i * 0.1 }}
                            >
                                <item.icon className="h-5 w-5 text-violet-600" />
                                <span className="text-sm font-medium">{item.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ==================== 3. PROBLEM → SOLUTION ==================== */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <AnimatedSection className="text-center mb-16">
                        <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-4">The Challenge</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Running a Banquet is
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"> Complicated</span>
                        </h2>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Without the right tools, you're juggling spreadsheets, phone calls, and paper receipts.
                        </p>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Problems */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: reduceMotion ? 0 : 0.6 }}
                            className="bg-white rounded-3xl p-8 border border-red-100"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Common Problems</h3>
                            </div>
                            <ul className="space-y-4">
                                {problems.map((problem, i) => (
                                    <motion.li 
                                        key={problem}
                                        className="flex items-start gap-3"
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: reduceMotion ? 0 : 0.3, delay: 0.2 + (i * 0.1) }}
                                    >
                                        <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-600">{problem}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Solutions */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: reduceMotion ? 0 : 0.6 }}
                            className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-3xl p-8 text-white"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold">BanquetOS Solution</h3>
                            </div>
                            <ul className="space-y-4">
                                {solutions.map((solution, i) => (
                                    <motion.li 
                                        key={solution}
                                        className="flex items-start gap-3"
                                        initial={{ opacity: 0, x: 10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: reduceMotion ? 0 : 0.3, delay: 0.2 + (i * 0.1) }}
                                    >
                                        <Check className="h-5 w-5 text-green-300 mt-0.5 flex-shrink-0" />
                                        <span className="text-white/90">{solution}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ==================== 4. FEATURES GRID ==================== */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <AnimatedSection className="text-center mb-16">
                        <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-4">Features</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Everything You Need to
                            <br />
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Run Your Business</span>
                        </h2>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Powerful features designed for banquet halls and hotels to streamline operations and maximize profits.
                        </p>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {features.map((feature, index) => (
                            <FeatureCard
                                key={feature.title}
                                {...feature}
                                delay={index * 0.05}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== 5. HOW IT WORKS ==================== */}
            <section id="how-it-works" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <AnimatedSection className="text-center mb-16">
                        <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-4">How It Works</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Simple Steps to
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"> Success</span>
                        </h2>
                    </AnimatedSection>

                    <div className="max-w-4xl mx-auto">
                        <div className="relative">
                            {/* Timeline line */}
                            <motion.div 
                                className="absolute left-8 top-0 w-0.5 bg-gradient-to-b from-violet-500 to-purple-500 hidden md:block"
                                initial={{ height: 0 }}
                                whileInView={{ height: '100%' }}
                                viewport={{ once: true }}
                                transition={{ duration: reduceMotion ? 0 : 1.5 }}
                            />

                            <div className="space-y-8">
                                {howItWorks.map((step, index) => (
                                    <motion.div
                                        key={step.title}
                                        initial={{ opacity: 0, x: -30 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: reduceMotion ? 0 : 0.5, delay: index * 0.15 }}
                                        className="relative flex items-start gap-6 md:gap-8"
                                    >
                                        {/* Step number */}
                                        <div className="relative flex-shrink-0 z-10">
                                            <motion.div 
                                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200"
                                                whileHover={reduceMotion ? {} : { scale: 1.1, rotate: 5 }}
                                                transition={{ type: "spring", stiffness: 400 }}
                                            >
                                                <step.icon className="h-7 w-7 text-white" />
                                            </motion.div>
                                            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-violet-600 flex items-center justify-center text-xs font-bold text-violet-600 shadow">
                                                {index + 1}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="pt-2 pb-8">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                                            <p className="text-gray-500 leading-relaxed">{step.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== 6. PARTY PLANNING SPOTLIGHT ==================== */}
            <section className="py-24 bg-gradient-to-br from-violet-900 via-purple-900 to-violet-900 relative overflow-hidden">
                <FloatingShape className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" duration={8} y={40} />
                <FloatingShape className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" duration={10} y={30} delay={2} />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <AnimatedSection>
                            <span className="inline-block text-violet-300 font-semibold text-sm uppercase tracking-wider mb-4">Party Planning Module</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Your Event's
                                <span className="bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent"> Operations Brain</span>
                            </h2>
                            <p className="text-xl text-white/70 mb-8 leading-relaxed">
                                Coordinate every aspect of your event from one dashboard. Vendors, staff, checklists, and run-sheets—all connected.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { icon: Truck, text: 'Vendor coordination & payments' },
                                    { icon: Users, text: 'Staff shift management' },
                                    { icon: CheckCircle, text: 'Event checklists & tasks' },
                                    { icon: FileText, text: 'Run-sheet for the day' },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.text}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.3 + (i * 0.1) }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                            <item.icon className="h-5 w-5 text-violet-300" />
                                        </div>
                                        <span className="text-white/90">{item.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatedSection>

                        {/* Animated checklist */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: reduceMotion ? 0 : 0.6 }}
                            className="relative"
                        >
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <PartyPopper className="h-6 w-6 text-violet-300" />
                                    <span className="font-semibold text-white">Event Checklist</span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { text: 'Venue setup confirmed', done: true },
                                        { text: 'Catering team arrival - 10 AM', done: true },
                                        { text: 'Sound system check', done: true },
                                        { text: 'Photographer briefing', done: false },
                                        { text: 'Guest registration desk', done: false },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.text}
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: reduceMotion ? 0 : 0.3, delay: 0.5 + (i * 0.1) }}
                                            className={`flex items-center gap-3 p-3 rounded-xl ${item.done ? 'bg-green-500/20' : 'bg-white/5'}`}
                                        >
                                            <motion.div
                                                initial={item.done ? { scale: 0 } : {}}
                                                whileInView={item.done ? { scale: 1 } : {}}
                                                viewport={{ once: true }}
                                                transition={{ type: "spring", stiffness: 300, delay: 0.8 + (i * 0.1) }}
                                            >
                                                {item.done ? (
                                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                                                )}
                                            </motion.div>
                                            <span className={item.done ? 'text-white/70 line-through' : 'text-white'}>{item.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ==================== 7. STATS / ROI ==================== */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <AnimatedSection className="text-center mb-16">
                        <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-4">Results</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Built for
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"> Real Impact</span>
                        </h2>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { value: eventsCount, label: 'Events Managed', suffix: '+', ref: eventsRef },
                            { value: venuesCount, label: 'Venues Using BanquetOS', suffix: '+', ref: venuesRef },
                            { value: countriesCount, label: 'Countries Supported', suffix: '', ref: countriesRef },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                ref={stat.ref}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: reduceMotion ? 0 : 0.5, delay: i * 0.1 }}
                                className="text-center p-8 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border border-violet-100"
                            >
                                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                    {stat.value}{stat.suffix}
                                </div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {[
                            { icon: Target, text: 'One dashboard for every event' },
                            { icon: CreditCard, text: 'Track deposits, balances & expenses' },
                            { icon: TrendingUp, text: 'Clear profit visibility per booking' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.text}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.3 + (i * 0.1) }}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl"
                            >
                                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <item.icon className="h-6 w-6 text-violet-600" />
                                </div>
                                <span className="text-gray-700 font-medium">{item.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== 8. USE CASES ==================== */}
            <section id="use-cases" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <AnimatedSection className="text-center mb-16">
                        <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-4">Use Cases</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Perfect For
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"> Your Venue</span>
                        </h2>
                    </AnimatedSection>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {useCases.map((useCase, index) => (
                            <UseCaseCard
                                key={useCase.title}
                                {...useCase}
                                delay={index * 0.1}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== 9. FAQ ==================== */}
            <section id="faq" className="py-24 bg-white">
                <div className="max-w-3xl mx-auto px-6">
                    <AnimatedSection className="text-center mb-16">
                        <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-4">FAQ</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Common
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"> Questions</span>
                        </h2>
                    </AnimatedSection>

                    <div className="bg-gray-50 rounded-3xl p-8">
                        {faqs.map((faq, index) => (
                            <FAQItem
                                key={faq.question}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openFAQ === index}
                                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                                delay={index * 0.05}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ==================== 10. FINAL CTA ==================== */}
            <section className="py-32 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 relative overflow-hidden">
                <FloatingShape className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" duration={6} y={30} />
                <FloatingShape className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" duration={8} y={25} delay={1} />

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <AnimatedSection>
                        <motion.div 
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8"
                            whileHover={reduceMotion ? {} : { scale: 1.05 }}
                        >
                            <Star className="h-4 w-4 text-yellow-300" />
                            <span className="text-white/90 text-sm font-medium">14-Day Free Trial • No Credit Card Required</span>
                        </motion.div>
                        
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Run Every Event
                            <br />
                            <span className="text-white/90">With Confidence</span>
                        </h2>
                        <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Join hundreds of banquet owners and hoteliers who have streamlined their operations with BanquetOS.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <Link to="/login">
                                <motion.div
                                    whileHover={reduceMotion ? {} : { scale: 1.05, y: -2 }}
                                    whileTap={reduceMotion ? {} : { scale: 0.98 }}
                                >
                                    <Button className="bg-white text-violet-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-2xl shadow-xl transition-all duration-300 group">
                                        Get Started
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </motion.div>
                            </Link>
                            <motion.div
                                whileHover={reduceMotion ? {} : { scale: 1.05 }}
                                whileTap={reduceMotion ? {} : { scale: 0.98 }}
                            >
                                <Button 
                                    variant="outline" 
                                    onClick={() => setDemoModalOpen(true)}
                                    className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-2xl transition-all duration-300"
                                >
                                    <Play className="mr-2 h-5 w-5" />
                                    Book a Demo
                                </Button>
                            </motion.div>
                        </div>

                        <p className="text-white/60 text-sm">
                            <a href="mailto:enterprise@banquetos.com" className="hover:text-white/80 transition-colors">
                                Contact us for enterprise rollout →
                            </a>
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* ==================== FOOTER ==================== */}
            <footer className="bg-gray-900 py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-xl text-white">BanquetOS</span>
                            </div>
                            <p className="text-gray-400 max-w-md mb-6">
                                All-in-one banquet and hotel operations software. Manage bookings, payments, vendors, and profits from one dashboard.
                            </p>
                            <div className="flex gap-4">
                                <a href="mailto:hello@banquetos.com" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                                    <Mail className="h-4 w-4" />
                                    hello@banquetos.com
                                </a>
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-3">
                                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</a></li>
                                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">How it Works</a></li>
                                <li><a href="#use-cases" className="text-gray-400 hover:text-white transition-colors text-sm">Use Cases</a></li>
                                <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm">FAQ</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Get Started</h4>
                            <ul className="space-y-3">
                                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">Login</Link></li>
                                <li><button onClick={() => setDemoModalOpen(true)} className="text-gray-400 hover:text-white transition-colors text-sm">Book a Demo</button></li>
                                <li><a href="mailto:enterprise@banquetos.com" className="text-gray-400 hover:text-white transition-colors text-sm">Enterprise</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-gray-500 text-sm">
                            © 2025 BanquetOS. All rights reserved.
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span>Built with ❤️ for banquet owners worldwide</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
