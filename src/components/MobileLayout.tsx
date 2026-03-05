import { useAuth, DIVISION_LABELS } from '../lib/AuthContext';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ship, LogOut } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

export function MobileLayout({ children }: { children: React.ReactNode }) {
    const { role, division, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const prefix = role === 'STAFF' ? '/staff' : '/boss';
    const mainRef = useRef<HTMLElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const tabs = [
        { label: 'Tổng quan', path: `${prefix}/overview`, icon: LayoutDashboard },
        { label: 'Tàu', path: `${prefix}/ships`, icon: Ship },
    ];

    const currentTab = tabs.find(t => location.pathname.startsWith(t.path));
    const pageTitle = currentTab?.label ?? 'Ship Manager';

    const [collapsed, setCollapsed] = useState(false);
    const lastScrollY = useRef(0);

    const resetTimer = useCallback(() => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCollapsed(true), 2500);
    }, []);

    const expand = useCallback(() => {
        setCollapsed(false);
        resetTimer();
    }, [resetTimer]);

    useEffect(() => {
        const el = mainRef.current;
        if (!el) return;
        const handleScroll = () => {
            const y = el.scrollTop;
            if (y > lastScrollY.current + 10) setCollapsed(true);
            else if (y < lastScrollY.current - 10) expand();
            lastScrollY.current = y;
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        resetTimer();
        return () => { el.removeEventListener('scroll', handleScroll); clearTimeout(timerRef.current); };
    }, [expand, resetTimer]);

    useEffect(() => { expand(); }, [location.pathname, expand]);

    // Active tab icon for collapsed state
    const activeTab = tabs.find(t => location.pathname.startsWith(t.path)) || tabs[0];
    const ActiveIcon = activeTab.icon;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 500,
            margin: '0 auto', background: 'var(--c-bg)', position: 'relative', overflow: 'hidden',
        }}>
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', background: 'var(--c-surface)',
                borderBottom: '2px solid transparent',
                backgroundImage: 'linear-gradient(var(--c-surface), var(--c-surface)), linear-gradient(90deg, var(--c-primary), #f59e0b)',
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
            }}>
                <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-primary)', letterSpacing: '.5px', textTransform: 'uppercase' }}>
                        {role === 'STAFF' ? 'Nhân viên' : 'Quản lý'}{division ? ` · ${DIVISION_LABELS[division]}` : ''}
                    </p>
                    <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{pageTitle}</h1>
                </div>
                <button
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40,
                        borderRadius: 12, border: 'none', background: '#fee2e2', color: '#dc2626',
                        cursor: 'pointer', flexShrink: 0, transition: 'all .2s ease',
                    }}
                >
                    <LogOut size={18} strokeWidth={2.5} style={{ marginLeft: -2 }} />
                </button>
            </header>

            <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: 90 }}>
                <div style={{ padding: 16 }} className="fade-up">
                    {children}
                </div>
            </main>

            {/* ── Bottom Nav ── */}
            <div
                onMouseEnter={expand}
                onTouchStart={expand}
                onClick={collapsed ? expand : undefined}
                style={{
                    position: 'absolute',
                    bottom: 20,
                    /* Use left + translateX for smooth interpolation */
                    left: collapsed ? 'calc(100% - 68px)' : '50%',
                    transform: collapsed ? 'translateX(0)' : 'translateX(-50%)',
                    width: collapsed ? 52 : 200,
                    height: 52,
                    borderRadius: 26,
                    zIndex: 50,
                    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                    boxShadow: '0 6px 24px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.07)',
                    cursor: collapsed ? 'pointer' : 'default',
                    overflow: 'hidden',
                    /* Single smooth transition for everything */
                    transition: 'left .35s ease, transform .35s ease, width .35s ease',
                    willChange: 'left, transform, width',
                }}
            >
                {/* Collapsed icon — always rendered, fades in/out */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: collapsed ? 1 : 0,
                    transition: 'opacity .2s ease',
                    pointerEvents: collapsed ? 'auto' : 'none',
                }}>
                    <ActiveIcon size={22} color="#fff" strokeWidth={2} />
                </div>

                {/* Expanded tabs — always rendered, fades in/out */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center',
                    opacity: collapsed ? 0 : 1,
                    transition: 'opacity .2s ease .05s',
                    pointerEvents: collapsed ? 'none' : 'auto',
                }}>
                    {tabs.map(tab => {
                        const active = location.pathname.startsWith(tab.path);
                        const Icon = tab.icon;
                        return (
                            <NavLink key={tab.path} to={tab.path} style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: 6, textDecoration: 'none', height: '100%',
                                color: active ? '#fff' : 'rgba(255,255,255,.35)',
                                transition: 'color .2s ease',
                                position: 'relative',
                            }}>
                                {active && (
                                    <div style={{
                                        position: 'absolute', inset: 5, borderRadius: 20,
                                        background: 'linear-gradient(135deg, rgba(99,134,255,.25), rgba(59,130,246,.15))',
                                        boxShadow: '0 0 12px rgba(99,134,255,.2)',
                                    }} />
                                )}
                                <Icon size={17} strokeWidth={active ? 2.2 : 1.5} style={{ position: 'relative', zIndex: 1 }} />
                                <span style={{
                                    fontSize: 12, fontWeight: active ? 700 : 500,
                                    position: 'relative', zIndex: 1, letterSpacing: '.2px',
                                    whiteSpace: 'nowrap',
                                }}>{tab.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
