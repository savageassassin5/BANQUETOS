import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2, Circle, AlertTriangle, Wallet } from 'lucide-react';

// Status configurations for different entity types
const statusConfigs = {
  // Booking statuses
  booking: {
    draft: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: Circle, label: 'Draft' },
    enquiry: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Enquiry' },
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Confirmed' },
    completed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CheckCircle, label: 'Completed' },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle, label: 'Cancelled' },
  },
  // Party Plan statuses
  partyPlan: {
    not_started: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: Circle, label: 'Not Started' },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Loader2, label: 'In Progress' },
    ready: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Ready' },
    at_risk: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: AlertTriangle, label: 'At Risk' },
  },
  // Payment statuses
  payment: {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending' },
    partial: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Wallet, label: 'Partial' },
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Paid' },
    overdue: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: AlertCircle, label: 'Overdue' },
  },
  // Vendor statuses
  vendor: {
    invited: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: Circle, label: 'Invited' },
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Confirmed' },
    arrived: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CheckCircle, label: 'Arrived' },
    completed: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: CheckCircle, label: 'Completed' },
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Wallet, label: 'Paid' },
  },
  // Staff attendance statuses
  staff: {
    pending: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: Clock, label: 'Pending' },
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Confirmed' },
    absent: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle, label: 'Absent' },
  },
  // User statuses
  user: {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Active' },
    inactive: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: Circle, label: 'Inactive' },
    suspended: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle, label: 'Suspended' },
  }
};

export function StatusBadge({ 
  type = 'booking', 
  status, 
  size = 'sm', 
  showIcon = true,
  className 
}) {
  const config = statusConfigs[type]?.[status?.toLowerCase()] || statusConfigs.booking.draft;
  const Icon = config.icon;
  
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-1 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };
  
  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  };
  
  return (
    <span 
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors',
        config.bg, config.text, config.border,
        sizeClasses[size],
        className
      )}
      data-testid={`status-badge-${type}-${status}`}
    >
      {showIcon && (
        <Icon className={cn(
          iconSizes[size],
          status === 'in_progress' && 'animate-spin'
        )} />
      )}
      <span className="capitalize">{config.label || status}</span>
    </span>
  );
}

export { statusConfigs };
