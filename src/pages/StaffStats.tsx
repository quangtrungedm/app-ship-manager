import { useState, useMemo } from 'react';
import { MobileLayout } from '../components/MobileLayout';
import { useShips } from '../lib/useShips';
import { calcShipSalary, calcBargeBonus, TON_RATE } from '../lib/salary';
import {
    BarChart3, TrendingUp, Calendar, Wallet, CheckCircle, Clock,
    Download, ChevronDown, ChevronUp, Layers
} from 'lucide-react';

const MONTH_NAMES = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];
const SHORT_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const glassStyle = {
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.03)',
    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative' as const
};

export function StaffStats() {
    const { ships } = useShips();
    const now = new Date();
    const currentYear = now.getFullYear();

    const [selYear, setSelYear] = useState<number>(currentYear);
    const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards');
    const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
    const [showEmptyMonths, setShowEmptyMonths] = useState<boolean>(false);

    // Available years from ships data
    const availableYears = useMemo(() => {
        const yearsSet = new Set<number>([currentYear]);
        ships.forEach(s => {
            const y = new Date(s.arrivalDate).getFullYear();
            if (!isNaN(y)) yearsSet.add(y);
        });
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [ships, currentYear]);

    // Filter completed ships by selected year
    const yearShips = useMemo(() => {
        return ships.filter(s => {
            const d = new Date(s.arrivalDate);
            const isYear = d.getFullYear() === selYear;
            const isCompleted = s.status === 'completed' || !!s.completionDate;
            return isYear && isCompleted;
        });
    }, [ships, selYear]);

    // Monthly aggregation
    const monthlyStats = useMemo(() => {
        return Array.from({ length: 12 }, (_, monthIdx) => {
            const mShips = yearShips.filter(s => new Date(s.arrivalDate).getMonth() === monthIdx);
            const totalWeight = mShips.reduce((acc, s) => acc + s.weight, 0);
            const totalSalary = mShips.reduce((acc, s) => acc + calcShipSalary(s), 0);
            const paidSalary = mShips.filter(s => s.isPaid).reduce((acc, s) => acc + calcShipSalary(s), 0);
            const unpaidSalary = totalSalary - paidSalary;
            const totalBarges = mShips.filter(s => s.hasBarge).reduce((acc, s) => acc + (s.bargeCount || 1), 0);
            const bargeBonus = mShips.reduce((acc, s) => acc + calcBargeBonus(s.hasBarge, s.bargeCount), 0);
            const weightSalary = totalWeight * TON_RATE;

            return {
                monthIndex: monthIdx,
                monthName: MONTH_NAMES[monthIdx],
                shortName: SHORT_MONTHS[monthIdx],
                ships: mShips,
                shipCount: mShips.length,
                totalWeight,
                totalSalary,
                paidSalary,
                unpaidSalary,
                totalBarges,
                bargeBonus,
                weightSalary,
                hasData: mShips.length > 0
            };
        });
    }, [yearShips]);

    // Annual totals
    const annualTotals = useMemo(() => {
        const totalWeight = yearShips.reduce((acc, s) => acc + s.weight, 0);
        const totalSalary = yearShips.reduce((acc, s) => acc + calcShipSalary(s), 0);
        const paidSalary = yearShips.filter(s => s.isPaid).reduce((acc, s) => acc + calcShipSalary(s), 0);
        const unpaidSalary = totalSalary - paidSalary;
        const totalBarges = yearShips.filter(s => s.hasBarge).reduce((acc, s) => acc + (s.bargeCount || 1), 0);
        const bargeBonus = yearShips.reduce((acc, s) => acc + calcBargeBonus(s.hasBarge, s.bargeCount), 0);
        const totalShips = yearShips.length;
        const paidRatio = totalSalary > 0 ? Math.round((paidSalary / totalSalary) * 100) : 0;

        return {
            totalWeight,
            totalSalary,
            paidSalary,
            unpaidSalary,
            totalBarges,
            bargeBonus,
            totalShips,
            paidRatio
        };
    }, [yearShips]);

    // Max values for chart scaling
    const maxMonthlyWeight = useMemo(() => {
        return Math.max(...monthlyStats.map(m => m.totalWeight), 1);
    }, [monthlyStats]);

    const maxMonthlySalary = useMemo(() => {
        return Math.max(...monthlyStats.map(m => m.totalSalary), 1);
    }, [monthlyStats]);

    // Export monthly report to CSV / Excel
    const handleExportCSV = () => {
        const headers = [
            'Tháng', 'Năm', 'Số chuyến tàu', 'Sản lượng (tấn)',
            'Lương sản lượng (đ)', 'Số xà lan', 'Phụ cấp xà lan (đ)',
            'Tổng lương (đ)', 'Đã thanh toán (đ)', 'Chưa thanh toán (đ)'
        ];

        const rows = monthlyStats
            .filter(m => showEmptyMonths || m.hasData)
            .map(m => [
                `"${m.monthName}"`,
                selYear,
                m.shipCount,
                m.totalWeight.toFixed(3),
                m.weightSalary,
                m.totalBarges,
                m.bargeBonus,
                m.totalSalary,
                m.paidSalary,
                m.unpaidSalary
            ].join(','));

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Thong-ke-san-luong-luong-nam-${selYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const displayedMonths = useMemo(() => {
        return showEmptyMonths ? monthlyStats : monthlyStats.filter(m => m.hasData);
    }, [monthlyStats, showEmptyMonths]);

    return (
        <MobileLayout>
            {/* ── Header: Year Picker & View Toggle ── */}
            <div className="fade-up" style={{ ...glassStyle, padding: '14px 18px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 12,
                            background: 'linear-gradient(135deg, #f59e0b, #d97406)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                        }}>
                            <BarChart3 size={18} color="#fff" strokeWidth={2.5} />
                        </div>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thống Kê Năm</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <select
                                    value={selYear}
                                    onChange={e => setSelYear(Number(e.target.value))}
                                    style={{
                                        fontSize: 18, fontWeight: 800, color: '#0f172a', border: 'none',
                                        background: 'transparent', cursor: 'pointer', outline: 'none',
                                        fontFamily: 'inherit', padding: 0
                                    }}
                                >
                                    {availableYears.map(y => (
                                        <option key={y} value={y}>Năm {y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                            onClick={handleExportCSV}
                            title="Xuất file Excel thống kê"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '8px 12px', borderRadius: 12, border: '1px solid #e2e8f0',
                                background: '#f8fafc', color: '#334155', fontSize: 12, fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Download size={14} color="#2563eb" strokeWidth={2.5} />
                            <span>Excel</span>
                        </button>

                        <div style={{
                            display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 2,
                            border: '1px solid #e2e8f0'
                        }}>
                            <button
                                onClick={() => setViewMode('cards')}
                                style={{
                                    border: 'none', borderRadius: 10, padding: '6px 10px',
                                    background: viewMode === 'cards' ? '#fff' : 'transparent',
                                    boxShadow: viewMode === 'cards' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                    color: viewMode === 'cards' ? '#0f172a' : '#64748b',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                                title="Xem danh sách tháng"
                            >
                                <Layers size={14} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => setViewMode('chart')}
                                style={{
                                    border: 'none', borderRadius: 10, padding: '6px 10px',
                                    background: viewMode === 'chart' ? '#fff' : 'transparent',
                                    boxShadow: viewMode === 'chart' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                    color: viewMode === 'chart' ? '#0f172a' : '#64748b',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                                title="Xem biểu đồ so sánh"
                            >
                                <BarChart3 size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Annual Summary: 2 Big Highlight Cards ── */}
            <div className="fade-up fade-up-d1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {/* Total Production (Tấn) */}
                <div style={{
                    ...glassStyle,
                    padding: 16,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                    border: '1px solid #dcfce7'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={16} color="#15803d" strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sản lượng {selYear}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                            {annualTotals.totalWeight.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>tấn</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#15803d', fontWeight: 700 }}>
                        • {annualTotals.totalShips} chuyến tàu
                    </div>
                </div>

                {/* Total Salary (Đồng) */}
                <div style={{
                    ...glassStyle,
                    padding: 16,
                    background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                    border: '1px solid #dbeafe'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet size={16} color="#1d4ed8" strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng lương {selYear}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                            {annualTotals.totalSalary.toLocaleString('vi-VN')}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>đ</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#2563eb', fontWeight: 700 }}>
                        {annualTotals.totalBarges > 0 ? `• Gồm ${annualTotals.totalBarges} salan (+{(annualTotals.bargeBonus).toLocaleString('vi-VN')}đ)` : '• Chưa có xà lan'}
                    </div>
                </div>
            </div>

            {/* ── Cashflow Status Strip: Paid vs Unpaid ── */}
            <div className="fade-up fade-up-d2" style={{
                ...glassStyle,
                padding: '14px 16px',
                marginBottom: 20,
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tiến độ thanh toán năm {selYear}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{annualTotals.paidRatio}% hoàn tất</span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
                    <div style={{ width: `${annualTotals.paidRatio}%`, background: 'linear-gradient(90deg, #10b981, #059669)', transition: 'width 0.5s ease' }} />
                    <div style={{ width: `${100 - annualTotals.paidRatio}%`, background: '#f43f5e' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Đã nhận:</span>
                        <strong style={{ color: '#047857' }}>{annualTotals.paidSalary.toLocaleString('vi-VN')}đ</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} />
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Còn chờ:</span>
                        <strong style={{ color: '#be123c' }}>{annualTotals.unpaidSalary.toLocaleString('vi-VN')}đ</strong>
                    </div>
                </div>
            </div>

            {/* ── View: Monthly Comparison Chart ── */}
            {viewMode === 'chart' && (
                <div className="fade-up" style={{ ...glassStyle, padding: 18, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#0f172a' }}>Biểu Đồ So Sánh Các Tháng</h3>
                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>Sản lượng (tấn) và Tổng lương (triệu đồng)</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 700 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#15803d' }}>
                                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#10b981' }} /> Tấn
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1d4ed8' }}>
                                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#3b82f6' }} /> Lương
                            </span>
                        </div>
                    </div>

                    {/* Visual Bar Chart */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: 6, padding: '10px 0 0 0', borderBottom: '1px solid #e2e8f0' }}>
                        {monthlyStats.map(m => {
                            const weightHeight = Math.max(6, Math.round((m.totalWeight / maxMonthlyWeight) * 110));
                            const salaryHeight = Math.max(6, Math.round((m.totalSalary / maxMonthlySalary) * 110));
                            const isCurrent = now.getMonth() === m.monthIndex && now.getFullYear() === selYear;

                            return (
                                <div
                                    key={m.monthIndex}
                                    onClick={() => {
                                        if (m.hasData) {
                                            setViewMode('cards');
                                            setExpandedMonth(m.monthIndex);
                                        }
                                    }}
                                    style={{
                                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        height: '100%', justifyContent: 'flex-end', cursor: m.hasData ? 'pointer' : 'default',
                                        opacity: m.hasData ? 1 : 0.4
                                    }}
                                    title={`${m.monthName}: ${m.totalWeight.toLocaleString()} tấn | ${m.totalSalary.toLocaleString()}đ`}
                                >
                                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                                        {/* Weight Bar */}
                                        <div style={{
                                            width: '40%', maxWidth: 10, height: m.hasData ? `${weightHeight}px` : 4,
                                            background: m.hasData ? 'linear-gradient(180deg, #34d399, #059669)' : '#e2e8f0',
                                            borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease'
                                        }} />
                                        {/* Salary Bar */}
                                        <div style={{
                                            width: '40%', maxWidth: 10, height: m.hasData ? `${salaryHeight}px` : 4,
                                            background: m.hasData ? 'linear-gradient(180deg, #60a5fa, #2563eb)' : '#cbd5e1',
                                            borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease'
                                        }} />
                                    </div>
                                    <span style={{
                                        fontSize: 10, marginTop: 6, fontWeight: isCurrent ? 800 : (m.hasData ? 700 : 500),
                                        color: isCurrent ? '#2563eb' : (m.hasData ? '#334155' : '#94a3b8')
                                    }}>
                                        {m.shortName}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: '#64748b' }}>
                        <span>• Chạm vào cột tháng có dữ liệu để xem chi tiết tàu</span>
                    </div>
                </div>
            )}

            {/* ── Section Title & Filter Toggle ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={16} color="#475569" strokeWidth={2.5} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.2px' }}>Chi Tiết Từng Tháng ({displayedMonths.length} tháng)</span>
                </div>
                <button
                    onClick={() => setShowEmptyMonths(!showEmptyMonths)}
                    style={{
                        fontSize: 12, fontWeight: 700, color: '#2563eb', background: 'none',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                >
                    {showEmptyMonths ? 'Chỉ hiện tháng có tàu' : 'Hiện tất cả 12 tháng'}
                </button>
            </div>

            {/* ── List of Monthly Cards ── */}
            {displayedMonths.length === 0 ? (
                <div style={{ ...glassStyle, padding: 32, textAlign: 'center', color: '#64748b' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>Không có chuyến tàu hoàn thành nào trong năm {selYear}.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
                    {displayedMonths.map((m) => {
                        const isExpanded = expandedMonth === m.monthIndex;
                        const isCurrentMonth = now.getMonth() === m.monthIndex && now.getFullYear() === selYear;

                        return (
                            <div
                                key={m.monthIndex}
                                className="fade-up"
                                style={{
                                    ...glassStyle,
                                    border: isCurrentMonth ? '1.5px solid #93c5fd' : '1px solid rgba(0,0,0,0.05)',
                                    boxShadow: isCurrentMonth ? '0 8px 24px -4px rgba(59,130,246,0.15)' : '0 4px 12px rgba(0,0,0,0.02)'
                                }}
                            >
                                {/* Month Header */}
                                <div
                                    onClick={() => setExpandedMonth(isExpanded ? null : m.monthIndex)}
                                    style={{
                                        padding: '16px 18px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: isCurrentMonth ? 'linear-gradient(90deg, #f0f7ff, #ffffff)' : '#ffffff',
                                        borderBottom: isExpanded ? '1px solid #f1f5f9' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 14,
                                            background: m.hasData
                                                ? (isCurrentMonth ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)')
                                                : '#f1f5f9',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: m.hasData ? '0 4px 10px rgba(14,165,233,0.25)' : 'none'
                                        }}>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: m.hasData ? '#fff' : '#94a3b8' }}>
                                                {m.shortName}
                                            </span>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0f172a' }}>{m.monthName}</h4>
                                                {isCurrentMonth && (
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#1d4ed8', background: '#dbeafe', padding: '2px 6px', borderRadius: 6 }}>
                                                        Hiện tại
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                                {m.shipCount > 0 ? `${m.shipCount} chuyến tàu hoàn thành` : 'Chưa có tàu'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 16, fontWeight: 900, color: m.hasData ? '#0f172a' : '#94a3b8', margin: 0, letterSpacing: '-0.3px' }}>
                                                {m.totalSalary.toLocaleString('vi-VN')} đ
                                            </p>
                                            <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>
                                                {m.totalWeight.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tấn
                                            </span>
                                        </div>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8, background: '#f8fafc',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#64748b', transition: 'transform 0.2s ease'
                                        }}>
                                            {isExpanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Salary & Barge Formula Breakdown Strip */}
                                {m.hasData && (
                                    <div style={{
                                        padding: '12px 18px', background: '#f8fafc',
                                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                                        borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
                                    }}>
                                        {/* Tấn Breakdown */}
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Lương sản lượng</span>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                                                <strong style={{ fontSize: 14, color: '#0f172a', fontWeight: 800 }}>
                                                    {m.weightSalary.toLocaleString('vi-VN')}đ
                                                </strong>
                                                <span style={{ fontSize: 10, color: '#94a3b8' }}>(500đ/t)</span>
                                            </div>
                                        </div>

                                        {/* Xà Lan Breakdown */}
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Phụ cấp xà lan</span>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                                                <strong style={{ fontSize: 14, color: m.bargeBonus > 0 ? '#2563eb' : '#64748b', fontWeight: 800 }}>
                                                    {m.bargeBonus > 0 ? `+${m.bargeBonus.toLocaleString('vi-VN')}đ` : '0đ'}
                                                </strong>
                                                {m.totalBarges > 0 && (
                                                    <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 700 }}>(${m.totalBarges} salan)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment status banner */}
                                {m.hasData && (
                                    <div style={{
                                        padding: '8px 18px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: m.unpaidSalary === 0 ? '#f0fdf4' : '#fff1f2',
                                        fontSize: 11, fontWeight: 700
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {m.unpaidSalary === 0 ? (
                                                <>
                                                    <CheckCircle size={13} color="#15803d" strokeWidth={2.5} />
                                                    <span style={{ color: '#166534' }}>Đã thanh toán đủ toàn bộ tháng</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock size={13} color="#be123c" strokeWidth={2.5} />
                                                    <span style={{ color: '#9f1239' }}>Chưa thanh toán: {m.unpaidSalary.toLocaleString('vi-VN')}đ</span>
                                                </>
                                            )}
                                        </div>
                                        <span style={{ color: '#047857' }}>Đã nhận: {m.paidSalary.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}

                                {/* Expanded Ships List of that Month */}
                                {isExpanded && (
                                    <div style={{ padding: '14px 18px 18px 18px', background: '#ffffff' }}>
                                        <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Danh sách {m.ships.length} tàu trong {m.monthName}
                                        </p>

                                        {m.ships.length === 0 ? (
                                            <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Không có dữ liệu tàu.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {m.ships.map((s, sIdx) => {
                                                    const sSalary = calcShipSalary(s);
                                                    const arrDate = new Date(s.arrivalDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                                                    return (
                                                        <div
                                                            key={s.id || sIdx}
                                                            style={{
                                                                padding: '10px 12px',
                                                                background: '#f8fafc',
                                                                borderRadius: 12,
                                                                border: '1px solid #e2e8f0',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                                    <strong style={{ fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {s.name}
                                                                    </strong>
                                                                    {s.hasBarge && (
                                                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                                                            🚢 {s.bargeCount || 1}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 8 }}>
                                                                    <span>{arrDate}</span>
                                                                    <span>• {s.port || 'Sowatco Long Bình'}</span>
                                                                    <span>• {s.weight.toLocaleString('vi-VN')}t</span>
                                                                </div>
                                                            </div>

                                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                                <strong style={{ fontSize: 13, color: s.isPaid ? '#047857' : '#be123c' }}>
                                                                    {sSalary.toLocaleString('vi-VN')}đ
                                                                </strong>
                                                                <div style={{ fontSize: 10, fontWeight: 700, color: s.isPaid ? '#15803d' : '#b91c1c' }}>
                                                                    {s.isPaid ? 'Đã TT' : 'Chưa TT'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </MobileLayout>
    );
}
