import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Enhanced Skeleton components for BanquetOS
 * Dark theme with purple shimmer effect
 * Respects prefers-reduced-motion
 */

// Base skeleton with dark theme shimmer animation
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-purple-900/40',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-[shimmer_2s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-purple-400/20 before:to-transparent',
        'motion-reduce:before:animate-none',
        className
      )}
      {...props}
    />
  );
}

// Metric card skeleton (dashboard stats)
export function SkeletonMetric({ className }) {
  return (
    <div className={cn('p-6 rounded-2xl bg-[#1e1a2e] border border-purple-800/30', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <div className="flex items-center mt-4 gap-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Event card skeleton (dashboard/booking cards)
export function SkeletonEventCard({ className }) {
  return (
    <div className={cn('p-5 rounded-2xl bg-[#1e1a2e] border border-purple-800/30 shadow-lg shadow-purple-900/20', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// Table row skeleton (bookings, payments, vendors)
export function SkeletonTableRow({ columns = 6, className }) {
  return (
    <tr className={cn('border-b border-purple-800/20', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className={cn(
            'h-4',
            i === 0 ? 'w-20' : 
            i === columns - 1 ? 'w-16 rounded-full' : 
            'w-24'
          )} />
        </td>
      ))}
    </tr>
  );
}

// Booking table skeleton
export function SkeletonBookingTable({ rows = 5 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-purple-900/30">
          <tr>
            {['Booking #', 'Customer', 'Hall', 'Event', 'Date', 'Amount', 'Status', 'Payment', 'Actions'].map((h, i) => (
              <th key={i} className="text-left py-4 px-4 font-medium text-purple-300/60 text-sm">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-purple-800/20 last:border-0">
              <td className="py-4 px-4"><Skeleton className="h-4 w-20 font-mono" /></td>
              <td className="py-4 px-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </td>
              <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
              <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
              <td className="py-4 px-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </td>
              <td className="py-4 px-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
              <td className="py-4 px-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
              <td className="py-4 px-4">
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Booking detail header skeleton
export function SkeletonBookingHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
    </div>
  );
}

// Booking detail section skeleton
export function SkeletonBookingSection({ lines = 4 }) {
  return (
    <div className="p-5 rounded-xl bg-white border border-slate-100 space-y-3">
      <Skeleton className="h-5 w-32 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

// Party planning snapshot skeleton
export function SkeletonPartySnapshot() {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Party planning checklist skeleton
export function SkeletonChecklistRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
      <Skeleton className="h-5 w-5 rounded-full shrink-0" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

// Vendor row skeleton
export function SkeletonVendorRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white">
      <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  );
}

// Staff role skeleton
export function SkeletonStaffRow() {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

// Timeline vertical skeleton
export function SkeletonTimeline({ items = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-white">
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
          <Skeleton className="h-4 w-14 font-mono" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Vendor card grid skeleton
export function SkeletonVendorCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <Skeleton className="h-2 w-full" />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-1 mb-4">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <Skeleton className="h-5 w-16 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-5 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-5 w-16 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment ledger row skeleton
export function SkeletonPaymentRow() {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
      <td className="py-4 px-4"><Skeleton className="h-5 w-20 font-bold" /></td>
      <td className="py-4 px-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-4 w-20" />
        </div>
      </td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
    </tr>
  );
}

// Filter bar skeleton
export function SkeletonFilterBar() {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-full md:w-48 rounded-xl" />
      </div>
    </div>
  );
}

// Report card skeleton
export function SkeletonReportCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

// User row skeleton
export function SkeletonUserRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
      <div className="flex gap-1">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

// Dashboard full skeleton
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-9 w-40" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetric key={i} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
      
      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <Skeleton className="h-5 w-32" />
        </div>
        <SkeletonBookingTable rows={5} />
      </div>
    </div>
  );
}

// Party Planning skeleton
export function SkeletonPartyPlanning() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      
      <Skeleton className="h-16 w-full rounded-2xl" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonEventCard key={i} />
        ))}
      </div>
    </div>
  );
}
