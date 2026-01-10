'use client';

import { useState, useRef, useEffect } from 'react';
import Button from './Button';
import Input from './Input';
import { Settings, X } from 'lucide-react';

// Chart Display Settings Types (for axis labels and display options, not data)
export type ChartDisplayConfig = {
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    showLegend: boolean;
    showGrid: boolean;
};

// Popover Settings Panel for Chart Display Options
type ChartSettingsPopoverProps = {
    open: boolean;
    onClose: () => void;
    config: ChartDisplayConfig;
    onSave: (config: ChartDisplayConfig) => void;
    anchorRef: React.RefObject<HTMLButtonElement | null>;
};

export function ChartSettingsPopover({ open, onClose, config, onSave, anchorRef }: ChartSettingsPopoverProps) {
    const [editedConfig, setEditedConfig] = useState<ChartDisplayConfig>(config);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Update editedConfig when config changes
    useEffect(() => {
        setEditedConfig(config);
    }, [config]);

    // Close on click outside
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
                anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onClose, anchorRef]);

    if (!open) return null;

    const handleSave = () => {
        onSave(editedConfig);
        onClose();
    };

    return (
        <div
            ref={popoverRef}
            style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '280px',
                backgroundColor: 'var(--color-panel)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                zIndex: 50,
                padding: 'var(--spacing-lg)',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
            }}>
                <span style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                }}>차트 설정</span>
                <button
                    onClick={onClose}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                    }}
                >
                    <X size={16} />
                </button>
            </div>

            {/* Title Input */}
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--spacing-xs)',
                }}>차트 제목</label>
                <Input
                    value={editedConfig.title}
                    onChange={(e) => setEditedConfig({ ...editedConfig, title: e.target.value })}
                    style={{ fontSize: '16px' }}
                    fullWidth
                />
            </div>

            {/* X Axis Label */}
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--spacing-xs)',
                }}>X축 라벨</label>
                <Input
                    value={editedConfig.xAxisLabel}
                    onChange={(e) => setEditedConfig({ ...editedConfig, xAxisLabel: e.target.value })}
                    style={{ fontSize: '16px' }}
                    placeholder="예: 요일"
                    fullWidth
                />
            </div>

            {/* Y Axis Label */}
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--spacing-xs)',
                }}>Y축 라벨</label>
                <Input
                    value={editedConfig.yAxisLabel}
                    onChange={(e) => setEditedConfig({ ...editedConfig, yAxisLabel: e.target.value })}
                    style={{ fontSize: '16px' }}
                    placeholder="예: 건수"
                    fullWidth
                />
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={editedConfig.showLegend}
                        onChange={(e) => setEditedConfig({ ...editedConfig, showLegend: e.target.checked })}
                        style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>범례 표시</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={editedConfig.showGrid}
                        onChange={(e) => setEditedConfig({ ...editedConfig, showGrid: e.target.checked })}
                        style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>그리드 표시</span>
                </label>
            </div>

            {/* Save Button */}
            <Button variant="primary" size="sm" onClick={handleSave} fullWidth>
                적용
            </Button>
        </div>
    );
}

// Settings Button with integrated popover
type ChartSettingsButtonProps = {
    config: ChartDisplayConfig;
    onSave: (config: ChartDisplayConfig) => void;
};

export function ChartSettingsButton({ config, onSave }: ChartSettingsButtonProps) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: open ? 'var(--color-accent-soft)' : 'transparent',
                    color: open ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                    if (!open) {
                        e.currentTarget.style.backgroundColor = 'var(--color-accent-soft)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!open) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-muted)';
                    }
                }}
                title="차트 설정"
            >
                <Settings size={18} />
            </button>

            <ChartSettingsPopover
                open={open}
                onClose={() => setOpen(false)}
                config={config}
                onSave={onSave}
                anchorRef={buttonRef}
            />
        </div>
    );
}

// Chart color constants using design tokens
export const CHART_COLORS = {
    primary: '#8FA963',      // colors.primary.main
    primaryDark: '#4A5D23',  // colors.primary.dark
    primaryLight: '#C2D5A8', // colors.primary.light
    success: '#C2D5A8',      // colors.status.success.main
    danger: '#EF4444',       // colors.semantic.danger
    warning: '#F59E0B',      // colors.semantic.warning
    info: '#F59E0B',         // Blue for "incoming"
    muted: '#64748B',        // colors.text.muted
    border: '#E9F0DF',       // colors.border.main
    background: '#F0F5E8',   // colors.background.elevated1
};
