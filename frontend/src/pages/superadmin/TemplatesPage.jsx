import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FileText, Building2, Loader2, Save, Plus, Trash2, Edit,
    Calendar, Percent, Target, AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';

const defaultEventTypes = [
    { name: 'Wedding', color: 'pink' },
    { name: 'Birthday', color: 'amber' },
    { name: 'Corporate', color: 'blue' },
    { name: 'Reception', color: 'purple' },
    { name: 'Engagement', color: 'rose' },
    { name: 'Anniversary', color: 'emerald' },
    { name: 'Religious', color: 'indigo' },
    { name: 'Other', color: 'slate' },
];

const TemplatesPage = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [form, setForm] = useState({
        name: '',
        default_advance_percent: 50,
        profit_target_percent: 30,
        default_vendors: [],
        default_checklist: []
    });

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        if (config?.event_templates) {
            setTemplates(config.event_templates);
        }
    }, [config]);

    const loadTenants = async () => {
        try {
            const res = await superAdminAPI.getTenants();
            setTenants(res.data);
            if (res.data.length > 0) {
                setSelectedTenant(res.data[0]);
                loadConfig(res.data[0].id);
            }
        } catch (error) {
            toast.error('Failed to load tenants');
        } finally {
            setLoading(false);
        }
    };

    const loadConfig = async (tenantId) => {
        setConfigLoading(true);
        try {
            const res = await superAdminAPI.getTenantConfig(tenantId);
            setConfig(res.data);
        } catch (error) {
            toast.error('Failed to load config');
        } finally {
            setConfigLoading(false);
        }
    };

    const handleTenantChange = (tenantId) => {
        const tenant = tenants.find(t => t.id === tenantId);
        setSelectedTenant(tenant);
        loadConfig(tenantId);
    };

    const resetForm = () => {
        setForm({ name: '', default_advance_percent: 50, profit_target_percent: 30, default_vendors: [], default_checklist: [] });
        setEditingTemplate(null);
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setForm({
            name: template.name,
            default_advance_percent: template.default_advance_percent || 50,
            profit_target_percent: template.profit_target_percent || 30,
            default_vendors: template.default_vendors || [],
            default_checklist: template.default_checklist || []
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Template name is required');
            return;
        }

        let updatedTemplates;
        if (editingTemplate) {
            updatedTemplates = templates.map(t => 
                t.name === editingTemplate.name ? { ...t, ...form } : t
            );
        } else {
            updatedTemplates = [...templates, form];
        }

        setSaving(true);
        try {
            await superAdminAPI.updateTenantConfig(selectedTenant.id, { event_templates: updatedTemplates });
            setTemplates(updatedTemplates);
            setDialogOpen(false);
            resetForm();
            toast.success(editingTemplate ? 'Template updated!' : 'Template created!');
        } catch (error) {
            toast.error('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (templateName) => {
        const updatedTemplates = templates.filter(t => t.name !== templateName);
        setSaving(true);
        try {
            await superAdminAPI.updateTenantConfig(selectedTenant.id, { event_templates: updatedTemplates });
            setTemplates(updatedTemplates);
            toast.success('Template deleted');
        } catch (error) {
            toast.error('Failed to delete template');
        } finally {
            setSaving(false);
        }
    };

    const getColorClass = (name) => {
        const found = defaultEventTypes.find(t => t.name.toLowerCase() === name.toLowerCase());
        return found?.color || 'slate';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div className="p-2 bg-indigo-500/20 rounded-xl" whileHover={{ rotate: 10 }}>
                            <FileText className="h-6 w-6 text-indigo-400" />
                        </motion.div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                            Event Templates
                        </h1>
                    </div>
                    <p className="text-slate-400">Configure default settings for each event type</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedTenant?.id || ''} onValueChange={handleTenantChange}>
                        <SelectTrigger className="w-64 bg-slate-800 border-slate-700 text-white rounded-xl">
                            <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Select Tenant" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                            {tenants.map(tenant => (
                                <SelectItem key={tenant.id} value={tenant.id} className="text-white hover:bg-slate-700">
                                    {tenant.business_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-white">{editingTemplate ? 'Edit Template' : 'Add Template'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <Label className="text-slate-300">Event Type Name</Label>
                                    <Input 
                                        value={form.name}
                                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Wedding, Birthday"
                                        className="bg-slate-800 border-slate-700 text-white mt-1 rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-slate-300">Default Advance (%)</Label>
                                        <Input 
                                            type="number"
                                            value={form.default_advance_percent}
                                            onChange={e => setForm(prev => ({ ...prev, default_advance_percent: parseInt(e.target.value) || 0 }))}
                                            min={0}
                                            max={100}
                                            className="bg-slate-800 border-slate-700 text-white mt-1 rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-300">Profit Target (%)</Label>
                                        <Input 
                                            type="number"
                                            value={form.profit_target_percent}
                                            onChange={e => setForm(prev => ({ ...prev, profit_target_percent: parseInt(e.target.value) || 0 }))}
                                            min={0}
                                            max={100}
                                            className="bg-slate-800 border-slate-700 text-white mt-1 rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="border-slate-700 text-slate-300 rounded-xl">Cancel</Button>
                                    </DialogClose>
                                    <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                                        {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Templates Grid */}
            {configLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template, idx) => {
                        const color = getColorClass(template.name);
                        return (
                            <motion.div
                                key={template.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className={`bg-slate-800/50 border-slate-700 rounded-2xl overflow-hidden`}>
                                    <div className={`h-1 bg-${color}-500`} />
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 bg-${color}-500/20 rounded-lg`}>
                                                    <Calendar className={`h-5 w-5 text-${color}-400`} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{template.name}</h3>
                                                    <Badge className={`bg-${color}-500/20 text-${color}-400 text-xs mt-1`}>
                                                        Event Type
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleEdit(template)}
                                                    className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg h-8 w-8"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleDelete(template.name)}
                                                    className="text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg h-8 w-8"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Percent className="h-4 w-4 text-slate-400" />
                                                    <span className="text-xs text-slate-400">Advance</span>
                                                </div>
                                                <p className="text-lg font-semibold text-white">{template.default_advance_percent || 0}%</p>
                                            </div>
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Target className="h-4 w-4 text-slate-400" />
                                                    <span className="text-xs text-slate-400">Profit Target</span>
                                                </div>
                                                <p className="text-lg font-semibold text-emerald-400">{template.profit_target_percent || 0}%</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                    {templates.length === 0 && (
                        <Card className="bg-slate-800/50 border-slate-700 rounded-2xl col-span-full">
                            <CardContent className="p-12 text-center">
                                <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-400">No templates configured</p>
                                <p className="text-xs text-slate-500 mt-1">Add event type templates to auto-fill party planner</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default TemplatesPage;
