import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Users, IndianRupee, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { SaveFeedback, useSaveState } from '../components/ui/save-feedback';
import { Skeleton } from '../components/ui/skeletons';
import { hallsAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

const HallsPage = () => {
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingHall, setEditingHall] = useState(null);
    const [form, setForm] = useState({
        name: '',
        capacity: 100,
        price_per_day: 0,
        price_per_event: 0,
        price_per_plate: 0,
        description: '',
        amenities: [],
        images: []
    });
    const [amenityInput, setAmenityInput] = useState('');
    const [saveStatus, setSaveStatus] = useSaveState();
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        loadHalls();
    }, []);

    const loadHalls = async () => {
        try {
            const res = await hallsAPI.getAll();
            setHalls(res.data);
        } catch (error) {
            console.error('Failed to load halls:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            name: '',
            capacity: 100,
            price_per_day: 0,
            price_per_event: 0,
            price_per_plate: 0,
            description: '',
            amenities: [],
            images: []
        });
        setEditingHall(null);
    };

    const handleEdit = (hall) => {
        setEditingHall(hall);
        setForm({
            name: hall.name,
            capacity: hall.capacity,
            price_per_day: hall.price_per_day || 0,
            price_per_event: hall.price_per_event || 0,
            price_per_plate: hall.price_per_plate || 0,
            description: hall.description || '',
            amenities: hall.amenities || [],
            images: hall.images || []
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveStatus('saving');
        try {
            if (editingHall) {
                await hallsAPI.update(editingHall.id, form);
                toast.success('Hall updated');
            } else {
                await hallsAPI.create(form);
                toast.success('Hall created');
            }
            setSaveStatus('saved');
            loadHalls();
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            setSaveStatus('error');
            toast.error('Failed to save hall');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await hallsAPI.delete(id);
            toast.success('Hall deleted');
            loadHalls();
        } catch (error) {
            toast.error('Failed to delete hall');
        } finally {
            setDeleting(null);
        }
    };

    const addAmenity = () => {
        if (amenityInput.trim()) {
            setForm(prev => ({
                ...prev,
                amenities: [...prev.amenities, amenityInput.trim()]
            }));
            setAmenityInput('');
        }
    };

    const removeAmenity = (index) => {
        setForm(prev => ({
            ...prev,
            amenities: prev.amenities.filter((_, i) => i !== index)
        }));
    };

    if (loading) {
        return (
            <div className="space-y-6" data-testid="halls-page">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <Skeleton className="h-48 w-full" />
                            <CardContent className="p-6 space-y-4">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-full" />
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-5 w-20" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 flex-1 rounded-lg" />
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="halls-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Halls</h1>
                    <p className="text-gray-600 mt-1">Manage your banquet halls and venues</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl shadow-lg"
                            onClick={resetForm}
                            data-testid="add-hall-btn"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Hall
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-heading">{editingHall ? 'Edit Hall' : 'Add New Hall'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hall Name *</label>
                                <Input
                                    required
                                    value={form.name}
                                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter hall name"
                                    data-testid="hall-name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                                    <Input
                                        type="number"
                                        required
                                        value={form.capacity}
                                        onChange={e => setForm(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                                        data-testid="hall-capacity"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Day (₹)</label>
                                    <Input
                                        type="number"
                                        value={form.price_per_day}
                                        onChange={e => setForm(prev => ({ ...prev, price_per_day: parseFloat(e.target.value) || 0 }))}
                                        data-testid="hall-price-day"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Event (₹)</label>
                                    <Input
                                        type="number"
                                        value={form.price_per_event}
                                        onChange={e => setForm(prev => ({ ...prev, price_per_event: parseFloat(e.target.value) || 0 }))}
                                        data-testid="hall-price-event"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Plate (₹)</label>
                                    <Input
                                        type="number"
                                        value={form.price_per_plate}
                                        onChange={e => setForm(prev => ({ ...prev, price_per_plate: parseFloat(e.target.value) || 0 }))}
                                        data-testid="hall-price-plate"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <Textarea
                                    value={form.description}
                                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe the hall..."
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={amenityInput}
                                        onChange={e => setAmenityInput(e.target.value)}
                                        placeholder="Add amenity"
                                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                                    />
                                    <Button type="button" variant="outline" onClick={addAmenity}>Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {form.amenities.map((amenity, idx) => (
                                        <span 
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                                        >
                                            {amenity}
                                            <button type="button" onClick={() => removeAmenity(idx)}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <Input
                                    value={form.images[0] || ''}
                                    onChange={e => setForm(prev => ({ ...prev, images: [e.target.value] }))}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className="border-slate-200 rounded-xl">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white rounded-xl" data-testid="save-hall-btn">
                                    {editingHall ? 'Update' : 'Create'} Hall
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Halls Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {halls.map((hall, idx) => (
                    <motion.div
                        key={hall.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`hall-card-${hall.id}`}>
                            <div className="h-48 overflow-hidden">
                                <img 
                                    src={hall.images?.[0] || 'https://images.unsplash.com/photo-1568989357443-057c03fb10fc?w=600'}
                                    alt={hall.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <CardContent className="p-6">
                                <h3 className="font-heading text-xl font-bold mb-2">{hall.name}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hall.description}</p>
                                
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Users className="h-4 w-4" />
                                        <span>{hall.capacity} Guests</span>
                                    </div>
                                    <div className="text-right">
                                        {hall.price_per_day > 0 && (
                                            <div className="flex items-center gap-1 text-maroon font-bold">
                                                <IndianRupee className="h-4 w-4" />
                                                <span>{hall.price_per_day?.toLocaleString()}/day</span>
                                            </div>
                                        )}
                                        {hall.price_per_event > 0 && (
                                            <div className="text-sm text-gray-600">
                                                ₹{hall.price_per_event?.toLocaleString()}/event
                                            </div>
                                        )}
                                        {hall.price_per_plate > 0 && (
                                            <div className="text-sm text-gray-600">
                                                ₹{hall.price_per_plate?.toLocaleString()}/plate
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {hall.amenities?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {hall.amenities.slice(0, 3).map((amenity, i) => (
                                            <span key={i} className="text-xs px-2 py-1 bg-cream rounded-full text-maroon">
                                                {amenity}
                                            </span>
                                        ))}
                                        {hall.amenities.length > 3 && (
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                                +{hall.amenities.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={() => handleEdit(hall)}
                                        data-testid={`edit-hall-${hall.id}`}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleDelete(hall.id)}
                                        data-testid={`delete-hall-${hall.id}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {halls.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500 mb-4">No halls added yet</p>
                        <Button onClick={() => setDialogOpen(true)} className="bg-maroon hover:bg-maroon-dark">
                            Add Your First Hall
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default HallsPage;
