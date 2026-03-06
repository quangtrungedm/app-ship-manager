import { useState, useMemo, useRef } from 'react';
import { MobileLayout } from '../components/MobileLayout';
import { useShips } from '../lib/useShips';
import { useAuth } from '../lib/AuthContext';
import { uploadFile } from '../lib/api';
import { isConfigured } from '../lib/config';
import { Ship, Document as ShipDoc } from '../types';
import { Plus, Calendar, Weight, X, Upload, FileText, Trash2, Ship as ShipIcon, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Loader2, Search, ArrowDownUp } from 'lucide-react';

function formatMonthLabel(ym: string) {
    const [y, m] = ym.split('-');
    const names = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return `${names[parseInt(m)]} ${y}`;
}

function ShipCard({ ship, onClick }: { ship: Ship; onClick: () => void }) {
    const date = new Date(ship.arrivalDate).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
    return (
        <div className="card" onClick={onClick} style={{ padding: 16, marginBottom: 12, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontSize: 15, fontWeight: 700, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: 8 }}>{ship.name}</p>
                <span className="badge badge-completed" style={{ flexShrink: 0 }}>
                    <CheckCircle size={11} /> Đã hoàn thành
                </span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--c-text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> {date}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Weight size={13} /> {ship.weight.toLocaleString()} tấn</span>
                {ship.documents.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={13} /> {ship.documents.length} file</span>
                )}
            </div>
        </div>
    );
}

export function StaffShips() {
    const { ships, loading: _loading, addShip, updateShip: updateShipApi } = useShips();
    const { division } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Ship | null>(null);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const now = new Date();
    const [pickerYear, setPickerYear] = useState(now.getFullYear());
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    // Search & Sort state
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'weight-desc' | 'weight-asc'>('newest');


    const filteredShips = useMemo(() => {
        let result = ships;

        // 1. Filter by Month
        if (selectedMonth !== 'all') {
            result = result.filter(s => {
                const d = new Date(s.arrivalDate);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
            });
        }

        // 2. Filter by Search Query
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            result = result.filter(s => s.name.toLowerCase().includes(q));
        }

        // 3. Sort
        result = [...result].sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime();
            if (sortBy === 'oldest') return new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime();
            if (sortBy === 'weight-desc') return b.weight - a.weight;
            if (sortBy === 'weight-asc') return a.weight - b.weight;
            return 0;
        });

        return result;
    }, [ships, selectedMonth, searchQuery, sortBy]);

    // Form state
    const [name, setName] = useState('');
    const [arrival, setArrival] = useState('');
    const [completion, setCompletion] = useState('');
    const [weight, setWeight] = useState('');
    const [docs, setDocs] = useState<ShipDoc[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const openNew = () => {
        setEditing(null); setName(''); setArrival(''); setCompletion(''); setWeight(''); setDocs([]);
        setShowForm(true);
    };
    const openEdit = (s: Ship) => {
        setEditing(s); setName(s.name); setArrival(s.arrivalDate.split('T')[0]);
        setCompletion(s.completionDate?.split('T')[0] || ''); setWeight(String(s.weight));
        setDocs([...s.documents]);
        setShowForm(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const fileArr = Array.from(files);
        setPendingFiles(prev => [...prev, ...fileArr]);
        const newDocs: ShipDoc[] = fileArr.map((f, i) => ({
            id: `doc-new-${Date.now()}-${i}`,
            name: f.name,
            url: URL.createObjectURL(f),
        }));
        setDocs(prev => [...prev, ...newDocs]);
        e.target.value = '';
    };

    const removeDoc = (id: string) => {
        setDocs(prev => prev.filter(d => d.id !== id));
        setPendingFiles(prev => prev.filter(f => !id.includes(f.name)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Upload pending files to Drive
            let uploadedDocs = docs.filter(d => !d.id.startsWith('doc-new-'));
            if (isConfigured() && pendingFiles.length > 0) {
                for (const file of pendingFiles) {
                    const uploaded = await uploadFile(file);
                    uploadedDocs.push(uploaded);
                }
            } else {
                uploadedDocs = docs;
            }

            const shipData: Ship = {
                id: editing?.id || `shp-${Date.now()}`,
                name, arrivalDate: new Date(arrival).toISOString(),
                completionDate: completion ? new Date(completion).toISOString() : undefined,
                weight: Number(weight), documents: uploadedDocs,
                division: division || undefined,
            };
            if (editing) { await updateShipApi(shipData); }
            else { await addShip(shipData); }
            setPendingFiles([]);
            setShowForm(false);
        } catch (err) {
            alert('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <MobileLayout>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{filteredShips.length} chuyến tàu</p>
                        {_loading && <Loader2 size={12} className="spin" color="var(--c-primary)" />}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={16} /> Thêm mới</button>
                </div>

                {/* Search & Sort Panel */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} color="var(--c-text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Tìm tên tàu..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px 10px 36px',
                                border: 'none', borderRadius: 12, background: 'var(--c-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                fontSize: 13, fontFamily: 'inherit', color: 'var(--c-text)', outline: 'none'
                            }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
                                <X size={14} color="var(--c-text-secondary)" />
                            </button>
                        )}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            style={{
                                appearance: 'none', padding: '10px 36px 10px 12px',
                                border: 'none', borderRadius: 12, background: 'var(--c-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                fontSize: 13, fontWeight: 600, fontFamily: 'inherit', color: 'var(--c-text)', outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="weight-desc">Sản lượng (Cao-Thấp)</option>
                            <option value="weight-asc">Sản lượng (Thấp-Cao)</option>
                        </select>
                        <ArrowDownUp size={14} color="var(--c-text-secondary)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                </div>

                {/* Month Picker */}
                <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
                    <button
                        onClick={() => { setPickerOpen(!pickerOpen); }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '10px 16px', border: 'none', background: 'transparent',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        <Calendar size={15} color="var(--c-primary)" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                            {selectedMonth === 'all' ? 'Tất cả tháng' : formatMonthLabel(selectedMonth)}
                        </span>
                        <ChevronDown size={15} color="var(--c-text-secondary)" style={{ transition: 'transform .2s', transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>

                    {pickerOpen && (
                        <div style={{ padding: '0 16px 14px' }}>
                            <div style={{ height: 1, background: 'var(--c-border)', marginBottom: 12 }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <button onClick={() => setPickerYear(y => y - 1)} style={{ border: 'none', background: 'var(--c-bg)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}>
                                    <ChevronLeft size={15} />
                                </button>
                                <span style={{ fontSize: 14, fontWeight: 800 }}>{pickerYear}</span>
                                <button onClick={() => setPickerYear(y => y + 1)} style={{ border: 'none', background: 'var(--c-bg)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}>
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                                {['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'].map((label, i) => {
                                    const key = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                                    const isActive = selectedMonth === key;
                                    const isCurrent = now.getMonth() === i && now.getFullYear() === pickerYear;
                                    return (
                                        <button key={i} onClick={() => { setSelectedMonth(key); setPickerOpen(false); }} style={{
                                            padding: '9px 0', borderRadius: 10, border: isCurrent && !isActive ? '2px solid var(--c-primary)' : '2px solid transparent',
                                            cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: isActive ? 700 : 500,
                                            background: isActive ? 'var(--c-primary)' : 'var(--c-bg)',
                                            color: isActive ? '#fff' : 'var(--c-text)',
                                            transition: 'all .15s',
                                        }}>{label}</button>
                                    );
                                })}
                            </div>
                            <button onClick={() => { setSelectedMonth('all'); setPickerOpen(false); }} style={{
                                width: '100%', padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                                fontFamily: 'inherit', fontSize: 12, fontWeight: selectedMonth === 'all' ? 700 : 500,
                                background: selectedMonth === 'all' ? 'var(--c-primary)' : 'var(--c-bg)',
                                color: selectedMonth === 'all' ? '#fff' : 'var(--c-text-secondary)',
                            }}>Tất cả</button>
                        </div>
                    )}
                </div>

                {filteredShips.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-secondary)', fontSize: 14 }}>Không có tàu trong tháng này</div>
                ) : (
                    filteredShips.map(s => <ShipCard key={s.id} ship={s} onClick={() => openEdit(s)} />)
                )}
            </MobileLayout>

            {/* ── Bottom Sheet Form ── */}
            {
                showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                            <div className="modal-handle" />

                            {/* Sheet Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShipIcon size={18} color="var(--c-primary)" />
                                    </div>
                                    <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{editing ? 'Cập nhật tàu' : 'Thêm tàu mới'}</p>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)} style={{ padding: 6 }}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Ship Name */}
                                <div className="field">
                                    <label>Tên tàu</label>
                                    <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Ever Given" required />
                                </div>

                                {/* Dates */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="field">
                                        <label>Ngày vào cảng</label>
                                        <input type="date" value={arrival} onChange={e => setArrival(e.target.value)} required />
                                    </div>
                                    <div className="field">
                                        <label>Ngày hoàn thành</label>
                                        <input type="date" value={completion} onChange={e => setCompletion(e.target.value)} />
                                    </div>
                                </div>

                                {/* Weight */}
                                <div className="field">
                                    <label>Sản lượng (tấn)</label>
                                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="VD: 15000" required />
                                </div>

                                {/* Divider */}
                                <div style={{ height: 1, background: 'var(--c-border)', margin: '8px 0 16px' }} />

                                {/* File Upload Section */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary)', marginBottom: 8 }}>
                                        Giấy tờ đính kèm
                                    </label>

                                    {/* Uploaded files list */}
                                    {docs.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                            {docs.map(doc => (
                                                <div key={doc.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                                                    background: 'var(--c-bg)', borderRadius: 10, fontSize: 13,
                                                }}>
                                                    <FileText size={16} color="var(--c-primary)" style={{ flexShrink: 0 }} />
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{doc.name}</span>
                                                    <button type="button" onClick={() => removeDoc(doc.id)} style={{
                                                        background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0,
                                                        color: 'var(--c-danger)', display: 'flex',
                                                    }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload button */}
                                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" onChange={handleFileSelect} style={{ display: 'none' }} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        width: '100%', padding: '14px', border: '2px dashed var(--c-border)',
                                        borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer',
                                        fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--c-primary)',
                                        transition: 'border-color .2s, background .2s',
                                    }}>
                                        <Upload size={18} />
                                        Chọn file để tải lên
                                    </button>
                                    <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', marginTop: 6, textAlign: 'center' }}>
                                        PDF, Word, Excel, Ảnh (tối đa 10MB/file)
                                    </p>
                                </div>

                                {/* Submit */}
                                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</> : (editing ? 'Lưu thay đổi' : 'Thêm tàu')}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
}
