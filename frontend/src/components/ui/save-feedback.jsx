import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * SaveFeedback - Provides visual feedback for save operations
 * States: idle, saving, saved, error
 */
export function SaveFeedback({ 
  status = 'idle', 
  message,
  className 
}) {
  const configs = {
    idle: null,
    saving: { 
      icon: Loader2, 
      text: message || 'Saving...', 
      color: 'text-slate-500',
      animate: true 
    },
    saved: { 
      icon: CheckCircle, 
      text: message || 'Saved', 
      color: 'text-emerald-600',
      animate: false 
    },
    error: { 
      icon: XCircle, 
      text: message || 'Failed to save', 
      color: 'text-rose-600',
      animate: false 
    },
  };
  
  const config = configs[status];
  
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-medium',
          config.color,
          className
        )}
        data-testid={`save-feedback-${status}`}
      >
        <Icon className={cn('h-4 w-4', config.animate && 'animate-spin')} />
        <span>{config.text}</span>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * useSaveState - Hook to manage save state with auto-reset
 */
export function useSaveState(autoResetMs = 2000) {
  const [saveState, setSaveState] = React.useState('idle');
  const timeoutRef = React.useRef(null);
  
  const setStatus = React.useCallback((status) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setSaveState(status);
    
    if (status === 'saved' || status === 'error') {
      timeoutRef.current = setTimeout(() => {
        setSaveState('idle');
      }, autoResetMs);
    }
  }, [autoResetMs]);
  
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [saveState, setStatus];
}
