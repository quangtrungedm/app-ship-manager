import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
}

export function EmptyState({
    title = 'Không có dữ liệu',
    description = 'Chưa có thông tin nào để hiển thị tại đây.',
    icon = <Inbox size={42} strokeWidth={1.5} color="var(--c-primary)" />
}: EmptyStateProps) {
    return (
        <div className="fade-up" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px 20px', textAlign: 'center', background: 'var(--c-surface)',
            borderRadius: 'var(--radius)', border: '1px solid var(--c-border)',
            margin: '16px 0', borderStyle: 'dashed'
        }}>
            <div style={{
                width: 80, height: 80, borderRadius: '50%', background: 'var(--c-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.5)'
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)', margin: '0 0 6px 0' }}>{title}</h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', margin: 0, maxWidth: 240, lineHeight: 1.5 }}>
                {description}
            </p>
        </div>
    );
}
