import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Phone, Mail, Check, Clock, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { enquiriesAPI } from '../lib/api';
import { formatDateTime, eventTypes } from '../lib/utils';
import { toast } from 'sonner';

const EnquiriesPage = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadEnquiries();
    }, []);

    const loadEnquiries = async () => {
        try {
            const res = await enquiriesAPI.getAll();
            setEnquiries(res.data);
        } catch (error) {
            console.error('Failed to load enquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkContacted = async (id) => {
        try {
            await enquiriesAPI.markContacted(id);
            toast.success('Marked as contacted');
            loadEnquiries();
        } catch (error) {
            toast.error('Failed to update enquiry');
        }
    };

    const filteredEnquiries = enquiries.filter(e => {
        if (filter === 'pending') return !e.is_contacted;
        if (filter === 'contacted') return e.is_contacted;
        return true;
    });

    const pendingCount = enquiries.filter(e => !e.is_contacted).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="enquiries-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Enquiries</h1>
                    <p className="text-gray-600 mt-1">Manage customer enquiries from the website</p>
                </div>
                {pendingCount > 0 && (
                    <Badge className="bg-gold text-maroon px-4 py-2 text-lg">
                        {pendingCount} Pending
                    </Badge>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['all', 'pending', 'contacted'].map(tab => (
                    <Button
                        key={tab}
                        variant={filter === tab ? 'default' : 'outline'}
                        className={filter === tab ? 'bg-maroon hover:bg-maroon-dark' : ''}
                        onClick={() => setFilter(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {tab === 'pending' && pendingCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-white text-maroon rounded-full">{pendingCount}</span>
                        )}
                    </Button>
                ))}
            </div>

            {/* Enquiries List */}
            <div className="grid gap-4">
                {filteredEnquiries.length > 0 ? (
                    filteredEnquiries.map((enquiry, idx) => (
                        <motion.div
                            key={enquiry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card 
                                className={`${!enquiry.is_contacted ? 'border-l-4 border-l-gold bg-gold/5' : ''}`}
                                data-testid={`enquiry-${enquiry.id}`}
                            >
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-maroon/10 flex items-center justify-center">
                                                    <MessageSquare className="h-5 w-5 text-maroon" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-lg">{enquiry.name}</h3>
                                                    <p className="text-sm text-gray-500">{formatDateTime(enquiry.created_at)}</p>
                                                </div>
                                                {!enquiry.is_contacted && (
                                                    <Badge className="bg-yellow-100 text-yellow-800">New</Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="h-4 w-4" />
                                                    <span>{enquiry.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="h-4 w-4" />
                                                    <span className="truncate">{enquiry.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{enquiry.event_date}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Users className="h-4 w-4" />
                                                    <span>{enquiry.guest_count} Guests</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="capitalize">
                                                    {eventTypes.find(t => t.value === enquiry.event_type)?.label || enquiry.event_type}
                                                </Badge>
                                            </div>

                                            {enquiry.message && (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-700">{enquiry.message}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex md:flex-col gap-2">
                                            {!enquiry.is_contacted ? (
                                                <Button 
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleMarkContacted(enquiry.id)}
                                                    data-testid={`mark-contacted-${enquiry.id}`}
                                                >
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Mark Contacted
                                                </Button>
                                            ) : (
                                                <Badge className="bg-green-100 text-green-800 justify-center py-2">
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Contacted
                                                </Badge>
                                            )}
                                            <Button 
                                                variant="outline"
                                                onClick={() => window.open(`tel:${enquiry.phone}`)}
                                            >
                                                <Phone className="h-4 w-4 mr-2" />
                                                Call
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No enquiries found</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default EnquiriesPage;
