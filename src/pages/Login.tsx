import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Ship, Hammer, ClipboardCheck } from 'lucide-react';

export function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const enterStaff = () => {
        login('STAFF', 'SAT_THEP');
        navigate('/staff/overview');
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

            {/* Main Navigation Actions */}
            <div style={{
                width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12,
            }} className="fade-up fade-up-d2">
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>Chọn chức năng</p>
                
                {/* 1. Nhân viên */}
                <button onClick={enterStaff} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                    background: 'var(--c-surface)', border: '1px solid #e2e8f0', borderRadius: 'var(--radius)',
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
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
                        <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, marginTop: 2 }}>Nhập liệu & quản lý chuyến tàu</p>
                    </div>
                </button>

                {/* 2. Cập Nhật Tàu */}
                <button
                    onClick={() => navigate('/ship-update')}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '18px 20px', border: 'none', borderRadius: 'var(--radius)',
                        cursor: 'pointer', fontFamily: 'inherit',
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
                        transition: 'transform .15s, box-shadow .15s',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ClipboardCheck size={22} color="#fff" strokeWidth={2.2} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>Cập Nhật Tàu</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', margin: 0, marginTop: 2 }}>Đánh giá, tiền cafe & tally tàu</p>
                    </div>
                </button>
            </div>

            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 28, textAlign: 'center', lineHeight: 1.6 }}>
                Engineer System by Quang Trung<br />ver 1.0
            </p>
        </div>
    );
}
