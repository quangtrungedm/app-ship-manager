import { useNavigate } from 'react-router-dom';
import { useAuth, Division } from '../lib/AuthContext';
import { Ship, BarChart3, Building2, Hammer, FileText } from 'lucide-react';
import { useState } from 'react';

export function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [selectedDiv, setSelectedDiv] = useState<Division>(null);

    const [comingSoon, setComingSoon] = useState(false);

    const divisions: { key: Division; label: string; desc: string; icon: typeof Building2; color: string; bg: string; disabled?: boolean }[] = [
        { key: 'VIN_CAN_GIO', label: 'Vin Cần Giờ', desc: 'Dự án cảng Vin', icon: Building2, color: '#4f46e5', bg: '#eef2ff' },
        { key: 'SAT_THEP', label: 'Sắt Thép', desc: 'Mảng sắt thép', icon: Hammer, color: '#d97706', bg: '#fef3c7' },
    ];

    const enter = (role: 'STAFF' | 'BOSS' | 'DOC') => {
        if (!selectedDiv) return;
        login(role, selectedDiv);
        if (role === 'DOC') {
            navigate('/doc-entry');
        } else {
            navigate(role === 'STAFF' ? '/staff/overview' : '/boss/overview');
        }
    };

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(145deg, #eef2ff 0%, #f0f2f5 50%, #fef3c7 100%)', padding: 24,
        }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }} className="fade-up">
                <img src="/logo.jpg" alt="Logo" style={{
                    width: 80, height: 80, borderRadius: 20, objectFit: 'contain',
                    margin: '0 auto 16px', display: 'block',
                    boxShadow: '0 4px 16px rgba(0,0,0,.08)',
                }} />
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Quản Lí Tàu LĐH</h1>
                <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginTop: 6 }}>Chọn mảng và vai trò để bắt đầu</p>
            </div>

            {/* Division Selector */}
            <div style={{ width: '100%', maxWidth: 340, marginBottom: 20 }} className="fade-up fade-up-d1">
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Chọn mảng</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {divisions.map(d => {
                        const active = selectedDiv === d.key;
                        const Icon = d.icon;
                        const isComingSoon = d.disabled && comingSoon;
                        return (
                            <button key={d.key} onClick={() => {
                                if (d.disabled) { setComingSoon(true); setTimeout(() => setComingSoon(false), 2000); return; }
                                setSelectedDiv(d.key);
                            }} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                padding: '18px 12px', border: active ? `2px solid ${d.color}` : '2px solid transparent',
                                borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                                background: active ? d.bg : 'var(--c-surface)',
                                boxShadow: active ? `0 4px 16px ${d.color}22` : 'var(--shadow-card)',
                                transition: 'all .2s ease',
                                transform: active ? 'scale(1.03)' : 'scale(1)',
                                opacity: d.disabled ? 0.7 : 1,
                                position: 'relative',
                            }}>
                                {isComingSoon && (
                                    <div style={{
                                        position: 'absolute', top: 8, right: 8,
                                        background: d.color, color: '#fff', fontSize: 9, fontWeight: 700,
                                        padding: '3px 8px', borderRadius: 8, letterSpacing: '.3px',
                                    }}>Đang phát triển</div>
                                )}
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: active ? `${d.color}18` : d.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={22} color={d.color} />
                                </div>
                                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: active ? d.color : 'var(--c-text)' }}>{d.label}</p>
                                <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', margin: 0 }}>{d.desc}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Role Selector */}
            <div style={{
                width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12,
                opacity: selectedDiv ? 1 : 0.4, pointerEvents: selectedDiv ? 'auto' : 'none',
                transition: 'opacity .3s ease',
            }} className="fade-up fade-up-d2">
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>Chọn vai trò</p>
                <button onClick={() => enter('STAFF')} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                    background: 'var(--c-surface)', border: 'none', borderRadius: 'var(--radius)',
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-card)',
                    transition: 'transform .15s, box-shadow .15s',
                }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Ship size={22} color="#4f6ef7" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Nhân viên</p>
                        <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, marginTop: 2 }}>Nhập liệu & quản lý tàu</p>
                    </div>
                </button>

                <button onClick={() => enter('DOC')} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                    background: 'var(--c-surface)', border: 'none', borderRadius: 'var(--radius)',
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-card)',
                    transition: 'transform .15s, box-shadow .15s',
                }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={22} color="#0d9488" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Hiện Trường</p>
                        <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, marginTop: 2 }}>Nhập liệu giấy tờ</p>
                    </div>
                </button>

                <button onClick={() => enter('BOSS')} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                    background: 'var(--c-surface)', border: 'none', borderRadius: 'var(--radius)',
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-card)',
                    transition: 'transform .15s, box-shadow .15s',
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BarChart3 size={22} color="#d97706" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Quản lý</p>
                        <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, marginTop: 2 }}>Xem báo cáo & tải giấy tờ</p>
                    </div>
                </button>
            </div>

            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 40, textAlign: 'center', lineHeight: 1.6 }}>
                Engineer System by Quang Trung<br />ver 1.0
            </p>
        </div>
    );
}
