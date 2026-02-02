import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, AlertCircle, Clock, Users, Wallet, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const cueConfigs = {
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    iconColor: 'text-amber-500'
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-500'
  },
  danger: {
    icon: AlertCircle,
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    iconColor: 'text-rose-500'
  },
  neutral: {
    icon: Info,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    iconColor: 'text-slate-500'
  }
};

/**
 * IntelligenceCue - Lightweight intelligence notifications
 * Non-intrusive, dismissible alerts for important status changes
 */
export function IntelligenceCue({
  type = 'info',
  message,
  subtext,
  dismissible = true,
  onDismiss,
  icon: CustomIcon,
  className
}) {
  const [visible, setVisible] = React.useState(true);
  const config = cueConfigs[type] || cueConfigs.info;
  const Icon = CustomIcon || config.icon;
  
  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-start gap-2.5 px-3 py-2.5 rounded-lg border',
            config.bg, config.border,
            className
          )}
          data-testid={`intelligence-cue-${type}`}
        >
          <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.iconColor)} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', config.text)}>{message}</p>
            {subtext && (
              <p className={cn('text-xs mt-0.5', config.text, 'opacity-80')}>{subtext}</p>
            )}
          </div>
          {dismissible && (
            <button 
              onClick={handleDismiss}
              className={cn('p-0.5 rounded hover:bg-black/5 transition-colors', config.text)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * IntelligenceCueStack - Stack of multiple cues
 */
export function IntelligenceCueStack({ cues = [], className }) {
  const [visibleCues, setVisibleCues] = React.useState(cues.map((_, i) => i));
  
  const handleDismiss = (index) => {
    setVisibleCues(prev => prev.filter(i => i !== index));
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      {cues.map((cue, index) => (
        visibleCues.includes(index) && (
          <IntelligenceCue
            key={cue.id || index}
            type={cue.type}
            message={cue.message}
            subtext={cue.subtext}
            icon={cue.icon}
            dismissible={cue.dismissible !== false}
            onDismiss={() => handleDismiss(index)}
          />
        )
      ))}
    </div>
  );
}

/**
 * Pre-built cue generators for common scenarios
 */
export const cueGenerators = {
  eventAtRisk: (score) => ({
    type: 'warning',
    message: 'This event is at risk',
    subtext: `Readiness score is ${score}% - review plan details`,
    icon: AlertTriangle
  }),
  paymentPending: (days) => ({
    type: 'warning',
    message: `Payment pending for ${days} days`,
    subtext: 'Consider following up with customer',
    icon: Wallet
  }),
  staffShortage: (count, suggested) => ({
    type: 'warning',
    message: 'Staff count below suggested',
    subtext: `Current: ${count}, Suggested: ${suggested}`,
    icon: Users
  }),
  vendorUnconfirmed: (days) => ({
    type: 'danger',
    message: 'Vendor not confirmed',
    subtext: `Event is in ${days} days`,
    icon: Clock
  }),
  bookingChanged: () => ({
    type: 'info',
    message: 'Booking details changed',
    subtext: 'Review this section for updates',
    icon: Info
  }),
};
