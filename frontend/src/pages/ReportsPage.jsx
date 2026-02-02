import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, IndianRupee, FileText, Calculator, TrendingUp, Building2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { reportsAPI, hallsAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ReportsPage = () => {
    const [financialReport, setFinancialReport] = useState(null);
    const [gstSummary, setGstSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('financial');
    
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        loadFinancialReport();
    }, [dateRange]);

    useEffect(() => {
        loadGstSummary();
    }, [selectedYear, selectedMonth]);

    const loadFinancialReport = async () => {
        setLoading(true);
        try {
            const res = await reportsAPI.getFinancial(dateRange.start, dateRange.end);
            setFinancialReport(res.data);
        } catch (error) {
            console.error('Failed to load financial report:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGstSummary = async () => {
        try {
            const res = await reportsAPI.getGstSummary(selectedYear, selectedMonth);
            setGstSummary(res.data);
        } catch (error) {
            console.error('Failed to load GST summary:', error);
        }
    };

    const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const handleExportPDF = async () => {
        try {
            const API_URL = process.env.REACT_APP_BACKEND_URL;
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/reports/export-pdf?start_date=${dateRange.start}&end_date=${dateRange.end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `financial_report_${dateRange.start}_${dateRange.end}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Failed to export PDF. Please try again.');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const expenseChartData = financialReport?.expenses?.by_category 
        ? Object.entries(financialReport.expenses.by_category).map(([category, amount]) => ({
            name: category.charAt(0).toUpperCase() + category.slice(1),
            value: amount
        }))
        : [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div 
            className="space-y-6" 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            data-testid="reports-page"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div
                            className="p-2 bg-amber-100 rounded-xl"
                            whileHover={{ rotate: 10, scale: 1.1 }}
                        >
                            <FileText className="h-6 w-6 text-amber-600" />
                        </motion.div>
                        <h1 className="font-heading text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 bg-clip-text text-transparent">
                            Financial Reports
                        </h1>
                    </div>
                    <p className="text-slate-500">GST-ready reports and financial analytics</p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                        onClick={handleExportPDF}
                        className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl shadow-lg"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export to PDF
                    </Button>
                </motion.div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants}>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-white shadow-lg border-0 rounded-2xl p-1">
                        <TabsTrigger value="financial" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl px-6">Financial Summary</TabsTrigger>
                        <TabsTrigger value="gst" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl px-6">GST Report</TabsTrigger>
                        <TabsTrigger value="events" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl px-6">Event Breakdown</TabsTrigger>
                    </TabsList>

                    {/* Financial Summary Tab */}
                    <TabsContent value="financial" className="space-y-6 mt-6">
                        {/* Date Filter */}
                        <Card className="bg-white border-0 shadow-lg rounded-2xl">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Start Date</label>
                                        <Input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="border-purple-200 focus:border-purple-400 rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">End Date</label>
                                        <Input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="border-purple-200 focus:border-purple-400 rounded-xl" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600"
                                />
                            </div>
                        ) : financialReport && (
                            <>
                                {/* Revenue Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <motion.div whileHover={{ y: -4 }}>
                                        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-lg rounded-2xl">
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-purple-100 rounded-xl">
                                                        <IndianRupee className="h-5 w-5 text-purple-600" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Total Revenue</p>
                                                </div>
                                                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{formatCurrency(financialReport.revenue.total)}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -4 }}>
                                        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-lg rounded-2xl">
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-emerald-100 rounded-xl">
                                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Collected</p>
                                                </div>
                                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(financialReport.revenue.collected)}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -4 }}>
                                        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-0 shadow-lg rounded-2xl">
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-orange-100 rounded-xl">
                                                        <FileText className="h-5 w-5 text-orange-600" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Expenses</p>
                                                </div>
                                                <p className="text-2xl font-bold text-orange-600">{formatCurrency(financialReport.expenses.total)}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -4 }}>
                                        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-0 shadow-lg rounded-2xl">
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-cyan-100 rounded-xl">
                                                        <Calculator className="h-5 w-5 text-cyan-600" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">Net Profit</p>
                                                </div>
                                                <p className={`text-2xl font-bold ${financialReport.profit.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {formatCurrency(financialReport.profit.net)}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </div>

                                {/* Charts */}
                                <div className="grid lg:grid-cols-2 gap-6">
                                    {/* Expense Breakdown */}
                                    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                                        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-pink-50 to-rose-50">
                                            <CardTitle className="font-heading text-slate-800">Expense Breakdown</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="h-72">
                                                {expenseChartData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={expenseChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                                                {expenseChartData.map((_, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} formatter={v => formatCurrency(v)} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-slate-400">No expense data</div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Summary Stats */}
                                    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                                        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
                                            <CardTitle className="font-heading text-slate-800">Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                <span className="text-slate-600">Total Events</span>
                                                <span className="font-semibold text-slate-800">{financialReport.summary.total_events}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                <span className="text-slate-600">Average Revenue per Event</span>
                                                <span className="font-semibold text-purple-600">{formatCurrency(financialReport.summary.avg_revenue_per_event)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                <span className="text-slate-600">Total GST Collected</span>
                                                <span className="font-semibold text-slate-800">{formatCurrency(financialReport.gst.total_gst)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                <span className="text-slate-600">Pending Collection</span>
                                                <span className="font-semibold text-orange-600">{formatCurrency(financialReport.revenue.pending)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3">
                                                <span className="text-slate-600">Gross Profit Margin</span>
                                                <span className="font-semibold text-emerald-600">
                                                    {financialReport.revenue.total > 0 ? ((financialReport.profit.gross / financialReport.revenue.total) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* GST Report Tab */}
                    <TabsContent value="gst" className="space-y-6 mt-6">
                        {/* Period Selector */}
                        <Card className="bg-white border-0 shadow-lg rounded-2xl">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Year</label>
                                        <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
                                            <SelectTrigger className="w-32 border-purple-200 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {[2024, 2025, 2026].map(year => (
                                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">Month</label>
                                        <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
                                            <SelectTrigger className="w-40 border-purple-200 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {months.map((month, idx) => (
                                                    <SelectItem key={idx} value={(idx + 1).toString()}>{month}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {gstSummary && (
                            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
                                    <CardTitle className="font-heading text-slate-800 flex items-center gap-2">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <FileText className="h-5 w-5 text-amber-600" />
                                        </div>
                                        GST Summary - {months[selectedMonth - 1]} {selectedYear}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                    <span className="text-slate-600">Total Invoices</span>
                                                    <span className="font-semibold text-slate-800">{gstSummary.invoice_count}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                                    <span className="text-slate-600">Total Value (with GST)</span>
                                                    <span className="font-semibold text-slate-800">{formatCurrency(gstSummary.total_with_gst)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3">
                                                    <span className="text-slate-600">Taxable Amount</span>
                                                    <span className="font-bold text-purple-600">{formatCurrency(gstSummary.taxable_amount)}</span>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl">
                                                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-4">GST Breakdown (18%)</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">CGST @ 9%</span>
                                                        <span className="font-medium text-slate-800">{formatCurrency(gstSummary.cgst_9)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">SGST @ 9%</span>
                                                        <span className="font-medium text-slate-800">{formatCurrency(gstSummary.sgst_9)}</span>
                                                    </div>
                                                    <hr className="border-amber-200" />
                                                    <div className="flex justify-between text-lg">
                                                        <span className="font-semibold text-amber-700">Total GST</span>
                                                        <span className="font-bold text-amber-600">{formatCurrency(gstSummary.total_gst_collected)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Event Breakdown Tab */}
                    <TabsContent value="events" className="mt-6">
                        {financialReport?.event_breakdown && (
                            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                                    <CardTitle className="font-heading text-slate-800">Event-wise Financial Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking #</th>
                                                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Event</th>
                                                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</th>
                                                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected</th>
                                                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expenses</th>
                                                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Profit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {financialReport.event_breakdown.map((event, idx) => (
                                                    <motion.tr 
                                                        key={idx} 
                                                        className="border-b border-slate-100 hover:bg-purple-50/50 transition-colors"
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                    >
                                                        <td className="py-4 px-6 font-mono text-sm font-medium text-purple-600">{event.booking_number}</td>
                                                        <td className="py-4 px-6 font-medium text-slate-700">{event.customer}</td>
                                                        <td className="py-4 px-6 text-slate-500 capitalize">{event.event_type}</td>
                                                        <td className="py-4 px-6 text-slate-500">{event.event_date}</td>
                                                        <td className="py-4 px-6 text-right font-semibold text-purple-600">{formatCurrency(event.revenue)}</td>
                                                        <td className="py-4 px-6 text-right font-semibold text-emerald-600">{formatCurrency(event.collected)}</td>
                                                        <td className="py-4 px-6 text-right text-orange-600">{formatCurrency(event.expenses)}</td>
                                                        <td className={`py-4 px-6 text-right font-bold ${event.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {formatCurrency(event.profit)}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </motion.div>
        </motion.div>
    );
};

export default ReportsPage;
