import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Leaf, Drumstick, Search, FolderPlus, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { menuAPI } from '../lib/api';
import { formatCurrency, menuTypes } from '../lib/utils';
import { toast } from 'sonner';

const MenuPage = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const [form, setForm] = useState({
        name: '',
        category: '',
        menu_type: 'veg',
        price_per_plate: 100,
        description: '',
        is_addon: false
    });

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: ''
    });

    // Default categories (fallback if no custom categories)
    const defaultCategories = ['Starters', 'Main Course', 'Rice', 'Breads', 'Desserts', 'Beverages', 'Add-on'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [menuRes, catRes] = await Promise.all([
                menuAPI.getAll(),
                menuAPI.getCategories().catch(() => ({ data: [] }))
            ]);
            setMenuItems(menuRes.data);
            setCategories(catRes.data || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get all unique categories (custom + from existing items)
    const getAllCategories = () => {
        const customCats = categories.map(c => c.name);
        const itemCats = [...new Set(menuItems.map(i => i.category))];
        const allCats = [...new Set([...defaultCategories, ...customCats, ...itemCats])];
        return allCats.sort();
    };

    const resetForm = () => {
        setForm({
            name: '',
            category: '',
            menu_type: 'veg',
            price_per_plate: 100,
            description: '',
            is_addon: false
        });
        setEditingItem(null);
    };

    const resetCategoryForm = () => {
        setCategoryForm({ name: '', description: '' });
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setForm({
            name: item.name,
            category: item.category,
            menu_type: item.menu_type,
            price_per_plate: item.price_per_plate,
            description: item.description || '',
            is_addon: item.is_addon
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.category) {
            toast.error('Please fill name and category');
            return;
        }
        try {
            if (editingItem) {
                await menuAPI.update(editingItem.id, form);
                toast.success('Menu item updated');
            } else {
                await menuAPI.create(form);
                toast.success('Menu item created');
            }
            loadData();
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Failed to save menu item');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this item?')) return;
        try {
            await menuAPI.delete(id);
            toast.success('Menu item deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!categoryForm.name.trim()) {
            toast.error('Please enter category name');
            return;
        }
        try {
            await menuAPI.createCategory(categoryForm);
            toast.success('Category added');
            loadData();
            setCategoryDialogOpen(false);
            resetCategoryForm();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to add category');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await menuAPI.deleteCategory(id);
            toast.success('Category deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || 
                          (activeTab === 'veg' && item.menu_type === 'veg') ||
                          (activeTab === 'nonveg' && item.menu_type === 'non_veg') ||
                          (activeTab === 'addons' && item.is_addon);
        return matchesSearch && matchesTab;
    });

    const groupedItems = filteredItems.reduce((acc, item) => {
        const category = item.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="menu-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Menu</h1>
                    <p className="text-gray-600 mt-1">Manage food items, categories and add-ons</p>
                </div>
                <div className="flex gap-2">
                    {/* Add Category Dialog */}
                    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="outline"
                                className="border-fuchsia-300 text-fuchsia-600 hover:bg-fuchsia-50"
                                onClick={resetCategoryForm}
                            >
                                <FolderPlus className="h-4 w-4 mr-2" />
                                Add Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-heading">Add New Category</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                                    <Input
                                        required
                                        value={categoryForm.name}
                                        onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Paneer Special, Chinese"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <Textarea
                                        value={categoryForm.description}
                                        onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Optional description"
                                        rows={2}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700">
                                        Add Category
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Add Menu Item Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl shadow-lg"
                                onClick={resetForm}
                                data-testid="add-menu-item-btn"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Menu Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-heading">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                                    <Input
                                        required
                                        value={form.name}
                                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter item name"
                                        data-testid="menu-item-name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                        <Select 
                                            value={form.category} 
                                            onValueChange={value => setForm(prev => ({ ...prev, category: value }))}
                                        >
                                            <SelectTrigger data-testid="menu-category">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getAllCategories().map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                        <Select 
                                            value={form.menu_type} 
                                            onValueChange={value => setForm(prev => ({ ...prev, menu_type: value }))}
                                        >
                                            <SelectTrigger data-testid="menu-type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {menuTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Plate (₹) *</label>
                                    <Input
                                        type="number"
                                        required
                                        value={form.price_per_plate}
                                        onChange={e => setForm(prev => ({ ...prev, price_per_plate: parseFloat(e.target.value) }))}
                                        data-testid="menu-price"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <Textarea
                                        value={form.description}
                                        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description..."
                                        rows={2}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={form.is_addon}
                                        onCheckedChange={checked => setForm(prev => ({ ...prev, is_addon: checked }))}
                                    />
                                    <label className="text-sm font-medium text-gray-700">This is an add-on service (fixed price)</label>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" className="border-slate-200 rounded-xl">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl" data-testid="save-menu-item-btn">
                                        {editingItem ? 'Update' : 'Create'} Item
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Custom Categories Section */}
            {categories.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4 text-fuchsia-600" />
                            Custom Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center gap-1 bg-fuchsia-50 border border-fuchsia-200 rounded-full px-3 py-1">
                                    <span className="text-sm font-medium text-fuchsia-700">{cat.name}</span>
                                    <button 
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="text-fuchsia-400 hover:text-red-500 ml-1"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10"
                                data-testid="search-menu"
                            />
                        </div>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="veg">
                                    <Leaf className="h-4 w-4 mr-1 text-green-600" />
                                    Veg
                                </TabsTrigger>
                                <TabsTrigger value="nonveg">
                                    <Drumstick className="h-4 w-4 mr-1 text-red-600" />
                                    Non-Veg
                                </TabsTrigger>
                                <TabsTrigger value="addons">Add-ons</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>

            {/* Menu Items by Category */}
            {Object.keys(groupedItems).length > 0 ? (
                Object.entries(groupedItems).map(([category, items]) => (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle className="font-heading text-lg flex items-center gap-2">
                                {category}
                                <Badge variant="secondary" className="font-normal">{items.length} items</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                                        data-testid={`menu-item-${item.id}`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-3 h-3 rounded-full ${item.menu_type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <h4 className="font-medium">{item.name}</h4>
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-fuchsia-600">
                                                    {item.is_addon ? formatCurrency(item.price_per_plate) : `₹${item.price_per_plate}/plate`}
                                                </span>
                                                {item.is_addon && (
                                                    <Badge variant="secondary">Add-on</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="text-red-600"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">No menu items found</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MenuPage;
