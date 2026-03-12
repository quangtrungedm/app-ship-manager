import { useAuth, DIVISION_LABELS } from '../lib/AuthContext';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ship, LogOut, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

export function MobileLayout({ children }: { children: React.ReactNode }) {
    const { role, division, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const prefix = role === 'STAFF' ? '/staff' : '/boss';
    const mainRef = useRef<HTMLElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const tabs = [
        { label: 'Tổng quan', path: `${prefix}/overview`, icon: LayoutDashboard, color: '#3b82f6', bg: 'linear-gradient(135deg, rgba(59,130,246,.25), rgba(37,99,235,.15))' },
        { label: 'Tàu', path: `${prefix}/ships`, icon: Ship, color: '#10b981', bg: 'linear-gradient(135deg, rgba(16,185,129,.25), rgba(5,150,105,.15))' },
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

    // --- Pull to Refresh Logic ---
    const [touchStartY, setTouchStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const maxPull = 120;
    const threshold = 60;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (mainRef.current?.scrollTop !== 0) return;
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartY === 0 || isRefreshing) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY;
        if (diff > 0 && mainRef.current?.scrollTop === 0) {
            // Prevent default scroll behavior when dragging down at top
            if (e.cancelable) e.preventDefault();
            setPullDistance(Math.min(diff * 0.5, maxPull)); // Add resistance
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > threshold && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(threshold); // Snap back to loading state height

            // Dispatch global refresh event
            const event = new CustomEvent('app:refresh');
            window.dispatchEvent(event);

            // Artificial delay to show spinner if network is too fast
            setTimeout(() => {
                setIsRefreshing(false);
                setPullDistance(0);
            }, 1000);
        } else {
            setPullDistance(0);
        }
        setTouchStartY(0);
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 500,
            margin: '0 auto', background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(40px) saturate(150%)',
            WebkitBackdropFilter: 'blur(40px) saturate(150%)',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0,0,0,0.05)',
            borderLeft: '1px solid rgba(255,255,255,0.3)',
            borderRight: '1px solid rgba(255,255,255,0.3)'
        }}>
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                background: 'rgba(255, 255, 255, 0.25)',
                borderBottom: '1px solid rgba(255,255,255,0.4)',
                position: 'relative', zIndex: 10
            }}>
                <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-primary)', letterSpacing: '.5px', textTransform: 'uppercase' }}>
                        {role === 'STAFF' ? 'Nhân viên' : 'Quản lý'}{division ? ` · ${DIVISION_LABELS[division]}` : ''}
                    </p>
                    <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{pageTitle}</h1>
                </div>
                <button
                    onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                            logout();
                            navigate('/login');
                        }
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

            <main
                ref={mainRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch',
                    paddingBottom: 90, position: 'relative'
                }}
            >
                {/* PTR Indicator */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: pullDistance,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', opacity: pullDistance / threshold,
                    transition: isRefreshing || pullDistance === 0 ? 'height 0.3s ease, opacity 0.3s ease' : 'none'
                }}>
                    <RefreshCw
                        size={24}
                        color="var(--c-primary)"
                        className={isRefreshing ? "spin" : ""}
                        style={{
                            transform: `rotate(${isRefreshing ? 0 : pullDistance * 2}deg)`,
                            transition: isRefreshing ? 'none' : 'transform 0.1s'
                        }}
                    />
                </div>

                <div style={{
                    padding: 16,
                    transform: `translateY(${pullDistance}px)`,
                    transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease' : 'none'
                }} className="fade-up">
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
                                        background: tab.bg,
                                        boxShadow: `0 0 12px ${tab.color}33`,
                                        opacity: 1,
                                        transform: 'scale(1)',
                                        transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }} />
                                )}
                                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} color={active ? tab.color : 'inherit'} style={{
                                    position: 'relative', zIndex: 1,
                                    transform: active ? 'translateY(-1px)' : 'translateY(0)',
                                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }} />
                                <span style={{
                                    fontSize: 12, fontWeight: active ? 800 : 500,
                                    color: active ? tab.color : 'inherit',
                                    position: 'relative', zIndex: 1, letterSpacing: '.2px',
                                    whiteSpace: 'nowrap',
                                    transform: active ? 'translateY(1px)' : 'translateY(0)',
                                    transition: 'all .3s ease',
                                }}>{tab.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
