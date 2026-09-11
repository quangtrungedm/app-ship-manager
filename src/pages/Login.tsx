import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Ship, BarChart3, Hammer, LayoutList } from 'lucide-react';

export function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const enter = (role: 'STAFF' | 'BOSS') => {
        login(role, 'SAT_THEP');
        navigate(role === 'STAFF' ? '/staff/overview' : '/boss/overview');
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
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Mảng hoạt động</p>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                    background: '#fef3c7', border: '2px solid #d97706', borderRadius: 16,
                    boxShadow: '0 4px 16px rgba(217,119,6,0.15)'
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Hammer size={22} color="#d97706" />
                    </div>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#92400e' }}>Sắt Thép</p>
                        <p style={{ fontSize: 12, color: '#b45309', margin: 0, marginTop: 2 }}>Mảng vận chuyển sắt thép & dòng tiền</p>
                    </div>
                </div>
            </div>

            {/* Role Selector */}
            <div style={{
                width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12,
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

                <button onClick={() => enter('BOSS')} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                    background: 'var(--c-surface)', border: 'none', borderRadius: 'var(--radius)',
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-card)',
                    transition: 'transform .15s, box-shadow .15s',
                }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BarChart3 size={22} color="#d97706" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Quản lý</p>
                        <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, marginTop: 2 }}>Xem báo cáo & thanh toán</p>
                    </div>
                </button>
            </div>

            {/* Direct access to BossManager */}
            <div style={{ width: '100%', maxWidth: 340, marginTop: 20 }} className="fade-up fade-up-d3">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.07)' }} />
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap' }}>hoặc truy cập nhanh</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.07)' }} />
                </div>
                <button
                    onClick={() => navigate('/boss/manager')}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 20px', border: 'none', borderRadius: 'var(--radius)',
                        cursor: 'pointer', fontFamily: 'inherit',
                        background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                        boxShadow: '0 8px 24px rgba(109,40,217,0.3)',
                        transition: 'transform .15s, box-shadow .15s',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <LayoutList size={22} color="#fff" strokeWidth={2} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>Quản Lý Tổng</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0, marginTop: 2 }}>Xem & quản lý toàn bộ chuyến tàu</p>
                    </div>
                </button>
            </div>

            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 28, textAlign: 'center', lineHeight: 1.6 }}>
                Engineer System by Quang Trung<br />ver 1.0
            </p>
        </div>
    );
}
