import { MobileLayout } from '../components/MobileLayout';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Globe, Info, ChevronRight, User } from 'lucide-react';

export function SettingsPage() {
    const { role, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <MobileLayout>
            {/* Profile Card */}
            <div className="card fade-up" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    <User size={24} />
                </div>
                <div>
                    <p style={{ fontSize: 16, fontWeight: 700 }}>{role === 'STAFF' ? 'Nhân viên Cảng' : 'Ban Giám đốc'}</p>
                    <p style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>Vai trò: {role}</p>
                </div>
            </div>

            {/* Settings List */}
            <div className="card fade-up fade-up-d1" style={{ marginBottom: 20 }}>
                {[
                    { icon: Globe, label: 'Ngôn ngữ', value: 'Tiếng Việt' },
                    { icon: Info, label: 'Phiên bản', value: 'v2.0 Mobile' },
                ].map((item, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                        borderBottom: i === 0 ? '1px solid var(--c-border)' : 'none',
                    }}>
                        <item.icon size={20} color="var(--c-text-secondary)" />
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{item.value}</span>
                        <ChevronRight size={16} color="var(--c-border)" />
                    </div>
                ))}
            </div>

            {/* Logout */}
            <button className="btn btn-danger btn-lg btn-block fade-up fade-up-d2" onClick={handleLogout} style={{ borderRadius: 'var(--radius-sm)' }}>
                <LogOut size={18} /> Đăng xuất
            </button>
        </MobileLayout>
    );
}
