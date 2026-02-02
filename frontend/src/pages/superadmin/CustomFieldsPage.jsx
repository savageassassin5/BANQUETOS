import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FormInput, Building2, Loader2, Save, Plus, Trash2, Edit,
    Type, Hash, Calendar, List, AlertTriangle, GripVertical
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { superAdminAPI } from '../../lib/api';
import { toast } from 'sonner';

const fieldTypes = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'dropdown', label: 'Dropdown', icon: List },
];

const roles = ['owner', 'manager', 'reception', 'accountant', 'ops'];

const CustomFieldsPage = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fields, setFields] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [form, setForm] = useState({
        name: '',
        field_type: 'text',
        options: [],
        required: false,
        visible_to_roles: ['owner', 'manager', 'reception']
    });
    const [optionInput, setOptionInput] = useState('');

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        if (config?.custom_fields) {
            setFields(config.custom_fields);
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
        setForm({ name: '', field_type: 'text', options: [], required: false, visible_to_roles: ['owner', 'manager', 'reception'] });
        setEditingField(null);
        setOptionInput('');
    };

    const handleEdit = (field) => {
        setEditingField(field);
        setForm({
            name: field.name,
            field_type: field.field_type,
            options: field.options || [],
            required: field.required || false,
            visible_to_roles: field.visible_to_roles || ['owner', 'manager', 'reception']
        });
        setDialogOpen(true);
    };

    const addOption = () => {
        if (optionInput.trim()) {
            setForm(prev => ({ ...prev, options: [...prev.options, optionInput.trim()] }));
            setOptionInput('');
        }
    };

    const removeOption = (idx) => {
        setForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
    };

    const toggleRole = (role) => {
        setForm(prev => ({
            ...prev,
            visible_to_roles: prev.visible_to_roles.includes(role)
                ? prev.visible_to_roles.filter(r => r !== role)
                : [...prev.visible_to_roles, role]
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Field name is required');
            return;
        }
        if (form.field_type === 'dropdown' && form.options.length === 0) {
            toast.error('Dropdown requires at least one option');
            return;
        }

        let updatedFields;
        if (editingField) {
            updatedFields = fields.map(f => f.id === editingField.id ? { ...f, ...form } : f);
        } else {
            updatedFields = [...fields, { ...form, id: crypto.randomUUID() }];
        }

        setSaving(true);
        try {
            await superAdminAPI.updateTenantConfig(selectedTenant.id, { custom_fields: updatedFields });
            setFields(updatedFields);
            setDialogOpen(false);
            resetForm();
            toast.success(editingField ? 'Field updated!' : 'Field created!');
        } catch (error) {
            toast.error('Failed to save field');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (fieldId) => {
        const updatedFields = fields.filter(f => f.id !== fieldId);
        setSaving(true);
        try {
            await superAdminAPI.updateTenantConfig(selectedTenant.id, { custom_fields: updatedFields });
            setFields(updatedFields);
            toast.success('Field deleted');
        } catch (error) {
            toast.error('Failed to delete field');
        } finally {
            setSaving(false);
        }
    };

    const getTypeIcon = (type) => {
        const found = fieldTypes.find(t => t.value === type);
        return found?.icon || Type;
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
                        <motion.div className="p-2 bg-cyan-500/20 rounded-xl" whileHover={{ rotate: 10 }}>
                            <FormInput className="h-6 w-6 text-cyan-400" />
                        </motion.div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
                            Custom Fields
                        </h1>
                    </div>
                    <p className="text-slate-400">Add custom booking fields without code</p>
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
                            <Button onClick={resetForm} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Field
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 rounded-2xl max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-white">{editingField ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <Label className="text-slate-300">Field Name</Label>
                                    <Input 
                                        value={form.name}
                                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Guest of Honor"
                                        className="bg-slate-800 border-slate-700 text-white mt-1 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-300">Field Type</Label>
                                    <Select value={form.field_type} onValueChange={val => setForm(prev => ({ ...prev, field_type: val }))}>
                                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                                            {fieldTypes.map(type => (
                                                <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        <type.icon className="h-4 w-4" />
                                                        {type.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {form.field_type === 'dropdown' && (
                                    <div>
                                        <Label className="text-slate-300">Dropdown Options</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input 
                                                value={optionInput}
                                                onChange={e => setOptionInput(e.target.value)}
                                                placeholder="Add option"
                                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                                                className="bg-slate-800 border-slate-700 text-white rounded-xl"
                                            />
                                            <Button type="button" onClick={addOption} variant="outline" className="border-slate-700 text-slate-300 rounded-xl">
                                                Add
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {form.options.map((opt, idx) => (
                                                <Badge 
                                                    key={idx} 
                                                    className="bg-cyan-500/20 text-cyan-400 cursor-pointer hover:bg-red-500/20 hover:text-red-400"
                                                    onClick={() => removeOption(idx)}
                                                >
                                                    {opt} ×
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300">Required Field</Label>
                                    <Switch 
                                        checked={form.required}
                                        onCheckedChange={val => setForm(prev => ({ ...prev, required: val }))}
                                        className="data-[state=checked]:bg-cyan-500"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-300">Visible to Roles</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {roles.map(role => (
                                            <Badge 
                                                key={role}
                                                className={`cursor-pointer capitalize ${
                                                    form.visible_to_roles.includes(role)
                                                        ? 'bg-cyan-500/20 text-cyan-400'
                                                        : 'bg-slate-700 text-slate-400'
                                                }`}
                                                onClick={() => toggleRole(role)}
                                            >
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="border-slate-700 text-slate-300 rounded-xl">Cancel</Button>
                                    </DialogClose>
                                    <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl">
                                        {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Fields List */}
            {configLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : (
                <div className="space-y-3">
                    {fields.map((field, idx) => {
                        const TypeIcon = getTypeIcon(field.field_type);
                        return (
                            <motion.div
                                key={field.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <GripVertical className="h-5 w-5 text-slate-600 cursor-grab" />
                                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                                                <TypeIcon className="h-5 w-5 text-cyan-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-white">{field.name}</h3>
                                                    {field.required && (
                                                        <Badge className="bg-red-500/20 text-red-400 text-xs">Required</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className="bg-slate-700 text-slate-300 text-xs capitalize">{field.field_type}</Badge>
                                                    {field.field_type === 'dropdown' && (
                                                        <span className="text-xs text-slate-500">{field.options?.length || 0} options</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleEdit(field)}
                                                    className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg h-8 w-8"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleDelete(field.id)}
                                                    className="text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg h-8 w-8"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                    {fields.length === 0 && (
                        <Card className="bg-slate-800/50 border-slate-700 rounded-2xl">
                            <CardContent className="p-12 text-center">
                                <FormInput className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-400">No custom fields configured</p>
                                <p className="text-xs text-slate-500 mt-1">Add custom fields to capture additional booking information</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Info */}
            <Card className="bg-slate-800/30 border-slate-700 rounded-2xl">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-cyan-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-slate-300 font-medium">No-Code Fields</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Custom fields automatically appear in booking forms and reports. 
                                Role visibility controls who can see and edit each field.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default CustomFieldsPage;
