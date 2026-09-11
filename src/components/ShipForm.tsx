import React, { useState } from 'react';
import { Ship, ShipStatus } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Upload } from 'lucide-react';
import { STANDARD_PORTS } from '../lib/constants';

interface ShipFormProps {
    initialData?: Ship;
    onSubmit: (ship: Partial<Ship>) => void;
    onCancel: () => void;
}

export function ShipForm({ initialData, onSubmit, onCancel }: ShipFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [port, setPort] = useState(initialData?.port || STANDARD_PORTS[0]);
    const [hasBarge, setHasBarge] = useState(initialData?.hasBarge ?? false);
    const [bargeCount, setBargeCount] = useState(initialData?.bargeCount ?? 1);
    const [arrivalDate, setArrivalDate] = useState(
        initialData?.arrivalDate ? new Date(initialData.arrivalDate).toISOString().slice(0, 16) : ''
    );
    const [completionDate, setCompletionDate] = useState(
        initialData?.completionDate ? new Date(initialData.completionDate).toISOString().slice(0, 16) : ''
    );
    const [status, setStatus] = useState<ShipStatus>(initialData?.status || 'waiting');
    const [weight, setWeight] = useState(initialData?.weight?.toString() || '');

    // Fake file list
    const [files, setFiles] = useState<{ name: string }[]>(initialData?.documents || []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            port,
            hasBarge,
            bargeCount: hasBarge ? Number(bargeCount) || 1 : 0,
            arrivalDate: new Date(arrivalDate).toISOString(),
            completionDate: completionDate ? new Date(completionDate).toISOString() : undefined,
            status,
            weight: parseFloat(weight) || 0,
            documents: files.map((f, i) => ({ id: `doc-${Date.now()}-${i}`, name: f.name, url: '#' })),
        });
    };

    const handleFakeUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setFiles([...files, { name: file.name }]);
            }
        };
        input.click();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Tên tàu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nhập tên tàu (VD: Ever Given)"
            />

            <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                    <label className="input-label">Cảng dỡ</label>
                    <select
                        className="input-field"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                    >
                        {STANDARD_PORTS.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="input-label block mb-1">Xà lan (+200k/salan)</label>
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            type="checkbox"
                            id="hasBargeForm"
                            checked={hasBarge}
                            onChange={(e) => setHasBarge(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="hasBargeForm" className="text-sm font-medium text-slate-700 select-none">
                            Có xà lan
                        </label>
                        {hasBarge && (
                            <input
                                type="number"
                                min="1"
                                value={bargeCount}
                                onChange={(e) => setBargeCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 ml-2 px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="SL"
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Ngày giờ vào"
                    type="datetime-local"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    required
                />
                <Input
                    label="Ngày giờ xong (Dự kiến / Thực tế)"
                    type="datetime-local"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Sản lượng (Tấn)"
                    type="number"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    placeholder="VD: 50000"
                />

                <div className="input-group">
                    <label className="input-label">Trạng thái</label>
                    <select
                        className="input-field"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ShipStatus)}
                    >
                        <option value="waiting">Chờ xếp slot</option>
                        <option value="entering">Đang vào</option>
                        <option value="loading">Đang bốc dỡ</option>
                        <option value="completed">Đã hoàn thành</option>
                    </select>
                </div>
            </div>

            <div className="pt-2">
                <label className="input-label block mb-2">Giấy tờ đính kèm</label>
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
                    <Button type="button" variant="secondary" onClick={handleFakeUpload} className="mb-2">
                        <Upload size={16} className="mr-2" />
                        Chọn file từ máy
                    </Button>
                    {files.length > 0 && (
                        <ul className="text-sm text-slate-600 mt-3 text-left list-disc pl-5 space-y-1">
                            {files.map((f, i) => <li key={i}>{f.name}</li>)}
                        </ul>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
                <Button type="submit" variant="primary">Lưu thông tin</Button>
            </div>
        </form>
    );
}
