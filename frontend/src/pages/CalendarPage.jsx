import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sun, Moon, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { calendarAPI, hallsAPI } from '../lib/api';
import { Link } from 'react-router-dom';

// Default hall colors
const hallColors = [
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#10b981', // emerald
    '#6366f1', // indigo
    '#ef4444', // red
    '#84cc16', // lime
];

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCalendarData();
    }, [currentDate]);

    const loadCalendarData = async () => {
        setLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const [eventsRes, hallsRes] = await Promise.all([
                calendarAPI.getEvents(month, year),
                hallsAPI.getAll()
            ]);
            setEvents(eventsRes.data);
            // Assign colors to halls if not present
            const hallsWithColors = hallsRes.data.map((hall, idx) => ({
                ...hall,
                color: hall.color || hallColors[idx % hallColors.length]
            }));
            setHalls(hallsWithColors);
        } catch (error) {
            console.error('Failed to load calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getHallColor = (hallName) => {
        const hall = halls.find(h => h.name === hallName);
        return hall?.color || '#6366f1';
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        return { daysInMonth, startingDay };
    };

    const getEventsForDate = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const getSlotInfo = (event) => {
        const startHour = parseInt(event.start_time?.split(':')[0] || '10');
        if (startHour >= 18 || startHour < 6) {
            return { slot: 'night', icon: Moon, label: 'N' };
        }
        return { slot: 'day', icon: Sun, label: 'D' };
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const today = new Date();
    const isToday = (day) => {
        return today.getDate() === day && 
               today.getMonth() === currentDate.getMonth() && 
               today.getFullYear() === currentDate.getFullYear();
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-6" data-testid="calendar-page">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Calendar</h1>
                    <p className="text-gray-600 mt-1">View and manage your event schedule</p>
                </div>
                <Link to="/dashboard/bookings/new">
                    <Button className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600" data-testid="new-booking-btn">
                        <Plus className="h-4 w-4 mr-2" />
                        New Booking
                    </Button>
                </Link>
            </div>

            {/* Legend: Halls & Slots */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-wrap items-center gap-6 justify-center">
                        {/* Hall Colors */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-600">Halls:</span>
                            {halls.map(hall => (
                                <div key={hall.id} className="flex items-center gap-2">
                                    <div 
                                        className="w-4 h-4 rounded-full" 
                                        style={{ backgroundColor: hall.color }}
                                    />
                                    <span className="text-sm">{hall.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        {/* Slot Legend */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full">
                                <Sun className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-medium text-amber-700">Day</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 rounded-full">
                                <Moon className="h-4 w-4 text-indigo-600" />
                                <span className="text-sm font-medium text-indigo-700">Night</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Calendar Card */}
            <Card>
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="font-heading text-xl">{monthName}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)} data-testid="prev-month">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                                Today
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)} data-testid="next-month">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {/* Week days header */}
                            <div className="grid grid-cols-7 border-b">
                                {weekDays.map(day => (
                                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7">
                                {Array.from({ length: startingDay }).map((_, idx) => (
                                    <div key={`empty-${idx}`} className="min-h-[130px] border-b border-r bg-gray-50/50" />
                                ))}

                                {Array.from({ length: daysInMonth }).map((_, idx) => {
                                    const day = idx + 1;
                                    const dayEvents = getEventsForDate(day);
                                    const isTodayDate = isToday(day);

                                    return (
                                        <div 
                                            key={day} 
                                            className={`min-h-[130px] border-b border-r p-2 ${isTodayDate ? 'bg-fuchsia-50' : ''}`}
                                            data-testid={`calendar-day-${day}`}
                                        >
                                            <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'w-7 h-7 rounded-full bg-fuchsia-600 text-white flex items-center justify-center' : ''}`}>
                                                {day}
                                            </div>
                                            <div className="space-y-1">
                                                {dayEvents.slice(0, 4).map((event, eventIdx) => {
                                                    const slotInfo = getSlotInfo(event);
                                                    const SlotIcon = slotInfo.icon;
                                                    const hallColor = getHallColor(event.hall);
                                                    
                                                    return (
                                                        <div 
                                                            key={eventIdx}
                                                            className="text-xs p-1.5 rounded text-white flex items-center gap-1"
                                                            style={{ backgroundColor: hallColor }}
                                                            title={`${event.title}\n${event.hall} | ${slotInfo.slot.toUpperCase()} (${event.start_time} - ${event.end_time})\n${event.guest_count} guests`}
                                                        >
                                                            <SlotIcon className="h-3 w-3 shrink-0" />
                                                            <span className="truncate flex-1">{event.hall}</span>
                                                            <span className="text-[10px] opacity-80">{slotInfo.label}</span>
                                                        </div>
                                                    );
                                                })}
                                                {dayEvents.length > 4 && (
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        +{dayEvents.length - 4} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-heading text-lg">Upcoming Events This Month</CardTitle>
                </CardHeader>
                <CardContent>
                    {events.length > 0 ? (
                        <div className="space-y-3">
                            {events.slice(0, 8).map((event, idx) => {
                                const slotInfo = getSlotInfo(event);
                                const SlotIcon = slotInfo.icon;
                                const hallColor = getHallColor(event.hall);
                                
                                return (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: hallColor }}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${hallColor}20` }}>
                                                <Building2 className="h-6 w-6" style={{ color: hallColor }} />
                                            </div>
                                            <div>
                                                <p className="font-medium">{event.title}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span className="font-medium" style={{ color: hallColor }}>{event.hall}</span>
                                                    <span>|</span>
                                                    <span>{event.guest_count} guests</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                            <Badge className={`${slotInfo.slot === 'day' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                <SlotIcon className="h-3 w-3 mr-1" />
                                                {slotInfo.slot === 'day' ? 'Day' : 'Night'}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No events scheduled for this month</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CalendarPage;
