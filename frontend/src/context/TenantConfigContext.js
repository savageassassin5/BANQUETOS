import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { configAPI } from '../lib/api';
import { useAuth } from './AuthContext';

const TenantConfigContext = createContext(null);

export const useTenantConfig = () => {
    const context = useContext(TenantConfigContext);
    if (!context) {
        throw new Error('useTenantConfig must be used within TenantConfigProvider');
    }
    return context;
};

// Default config for fallback
const DEFAULT_CONFIG = {
    version: 0,
    feature_flags: {
        bookings: true,
        party_planner: true,
        operations_checklist: false,
        vendors: true,
        vendor_ledger: true,
        staff_planning: false,
        profit_tracking: false,
        reports: true,
        advanced_reports: false,
        event_day_mode: false,
        multi_hall: false,
        custom_fields: false,
    },
    workflow_rules: {
        advance_required_percent: 50,
        vendors_mandatory_before_confirm: false,
        staff_mandatory_before_event: false,
        lock_editing_hours_before: 0,
        discount_approval_required: false,
        profit_margin_warning_percent: 20,
        vendor_unpaid_warning_days: 7,
    },
    permissions: {},
    ui_visibility: {
        show_profit_tab: true,
        show_staff_tab: true,
        show_vendors_tab: true,
        show_checklist_tab: true,
        label_party_planner: 'Party Planner',
        label_vendors: 'Vendors',
        label_bookings: 'Bookings',
        readonly_modules: [],
    },
    event_templates: [],
    custom_fields: [],
    financial_controls: {
        allowed_payment_methods: ['cash', 'upi', 'bank_transfer', 'cheque', 'card'],
        tax_rate: 18,
        tax_type: 'GST',
    },
};

export const TenantConfigProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    // Fetch config from server
    const fetchConfig = useCallback(async () => {
        if (!token || !user?.tenant_id) {
            setConfig(null);
            setLoading(false);
            return;
        }

        try {
            const res = await configAPI.sync();
            if (res.data && res.data.version) {
                setConfig(res.data);
                setError(null);
                setLastFetch(new Date());
            } else {
                // No config found, use defaults
                setConfig({ ...DEFAULT_CONFIG, tenant_id: user.tenant_id });
            }
        } catch (err) {
            console.error('Failed to fetch tenant config:', err);
            setError('Failed to load tenant configuration');
            // Use defaults on error to allow basic functionality
            setConfig({ ...DEFAULT_CONFIG, tenant_id: user.tenant_id });
        } finally {
            setLoading(false);
        }
    }, [token, user?.tenant_id]);

    // Initial fetch
    useEffect(() => {
        if (user?.tenant_id && token) {
            fetchConfig();
        } else if (!user?.tenant_id) {
            // Super admin or no tenant - use defaults
            setConfig(DEFAULT_CONFIG);
            setLoading(false);
        }
    }, [user?.tenant_id, token, fetchConfig]);

    // Periodic version check (every 30 seconds)
    useEffect(() => {
        if (!token || !user?.tenant_id || !config?.version) return;

        const checkVersion = async () => {
            try {
                const res = await configAPI.checkVersion(config.version);
                if (res.data.needs_sync) {
                    console.log('Config updated on server, re-fetching...');
                    fetchConfig();
                }
            } catch (err) {
                console.error('Version check failed:', err);
            }
        };

        const interval = setInterval(checkVersion, 30000);
        return () => clearInterval(interval);
    }, [token, user?.tenant_id, config?.version, fetchConfig]);

    // Feature flag check
    const isFeatureEnabled = useCallback((feature) => {
        if (!config?.feature_flags) return true; // Default to enabled
        return config.feature_flags[feature] !== false;
    }, [config]);

    // Permission check for current user's role
    const hasPermission = useCallback((permission) => {
        if (!config?.permissions || !user?.role) return true; // Default to allowed
        
        // Map user roles to config roles
        const roleMap = {
            'admin': 'owner',
            'tenant_admin': 'owner',
            'owner': 'owner',
            'manager': 'manager',
            'reception': 'reception',
            'accountant': 'accountant',
            'ops': 'ops',
        };
        
        const configRole = roleMap[user.role] || 'custom';
        const rolePerms = config.permissions[configRole];
        
        if (!rolePerms) return true; // No restrictions defined
        return rolePerms[permission] !== false;
    }, [config, user?.role]);

    // Workflow rule getter
    const getWorkflowRule = useCallback((rule) => {
        if (!config?.workflow_rules) return DEFAULT_CONFIG.workflow_rules[rule];
        return config.workflow_rules[rule] ?? DEFAULT_CONFIG.workflow_rules[rule];
    }, [config]);

    // UI visibility check
    const isUIVisible = useCallback((element) => {
        if (!config?.ui_visibility) return true;
        return config.ui_visibility[element] !== false;
    }, [config]);

    // Check if module is readonly
    const isReadonly = useCallback((module) => {
        if (!config?.ui_visibility?.readonly_modules) return false;
        return config.ui_visibility.readonly_modules.includes(module);
    }, [config]);

    // Get label (for renamed modules)
    const getLabel = useCallback((key, defaultLabel) => {
        if (!config?.ui_visibility) return defaultLabel;
        return config.ui_visibility[`label_${key}`] || defaultLabel;
    }, [config]);

    // Get event template by type
    const getEventTemplate = useCallback((eventType) => {
        if (!config?.event_templates) return null;
        return config.event_templates.find(t => 
            t.name.toLowerCase() === eventType?.toLowerCase()
        ) || null;
    }, [config]);

    // Get custom fields
    const getCustomFields = useCallback(() => {
        if (!config?.custom_fields) return [];
        // Filter by role visibility
        const roleMap = {
            'admin': 'owner',
            'tenant_admin': 'owner',
        };
        const userRole = roleMap[user?.role] || user?.role || 'owner';
        
        return config.custom_fields.filter(field => 
            !field.visible_to_roles || 
            field.visible_to_roles.length === 0 ||
            field.visible_to_roles.includes(userRole)
        );
    }, [config, user?.role]);

    // Get financial controls
    const getFinancialControl = useCallback((key) => {
        if (!config?.financial_controls) return DEFAULT_CONFIG.financial_controls[key];
        return config.financial_controls[key] ?? DEFAULT_CONFIG.financial_controls[key];
    }, [config]);

    const value = {
        config,
        loading,
        error,
        lastFetch,
        refetch: fetchConfig,
        
        // Feature flags
        isFeatureEnabled,
        
        // Permissions
        hasPermission,
        
        // Workflow rules
        getWorkflowRule,
        
        // UI
        isUIVisible,
        isReadonly,
        getLabel,
        
        // Templates
        getEventTemplate,
        
        // Custom fields
        getCustomFields,
        
        // Financial
        getFinancialControl,
    };

    return (
        <TenantConfigContext.Provider value={value}>
            {children}
        </TenantConfigContext.Provider>
    );
};

export default TenantConfigContext;
