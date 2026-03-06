import { Ship, ShipStatus } from '../types';
import { Badge } from './ui/Badge';
import { Card, CardContent } from './ui/Card';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Download, Info, FileText } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../lib/AuthContext';

interface ShipListProps {
    ships: Ship[];
    onShipClick?: (ship: Ship) => void;
}

const statusMap: Record<ShipStatus, { label: string; variant: any }> = {
    waiting: { label: 'Chờ xếp slot', variant: 'waiting' },
    entering: { label: 'Đang vào', variant: 'entering' },
    completed: { label: 'Đã hoàn thành', variant: 'completed' }
};

export function ShipList({ ships, onShipClick }: ShipListProps) {
    const { role } = useAuth();

    if (ships.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                <Info className="mx-auto mb-2 opacity-50" size={32} />
                <p>Không có dữ liệu tàu nào.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {ships.map((ship) => (
                <Card
                    key={ship.id}
                    className={`cursor-pointer transition-all hover:border-blue-300 ${onShipClick ? 'hover:shadow-md' : ''}`}
                    onClick={() => onShipClick?.(ship)}
                >
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-bold text-slate-800 truncate">{ship.name}</h3>
                                <Badge variant={statusMap[ship.status || 'waiting'].variant}>
                                    {statusMap[ship.status || 'waiting'].label}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 sm:flex sm:gap-6 text-sm text-slate-500 mt-2">
                                <div>
                                    <span className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Ngày vào</span>
                                    <span>{format(new Date(ship.arrivalDate), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                                </div>
                                {ship.completionDate && (
                                    <div>
                                        <span className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Ngày xong</span>
                                        <span>{format(new Date(ship.completionDate), 'dd/MM/yyyy', { locale: vi })}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Sản lượng</span>
                                    <span className="font-medium text-slate-700">{ship.weight.toLocaleString()} tấn</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 w-full sm:w-auto pt-3 sm:pt-0 sm:pl-5">
                            <div className="text-xs font-medium text-slate-500 mb-1 hidden sm:block">Giấy tờ đính kèm</div>
                            {ship.documents.length > 0 ? (
                                <div className="flex items-center gap-2">
                                    <Badge variant="default" className="bg-slate-100">
                                        <FileText size={12} className="mr-1" />
                                        {ship.documents.length} file
                                    </Badge>
                                    {role === 'BOSS' && (
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); alert('Đang tải file xuống...'); }}>
                                            <Download size={14} />
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-slate-400 italic">Không có file</span>
                            )}
                        </div>

                    </CardContent>

                    {ship.bossNotes && (
                        <div className="bg-amber-50 px-5 py-3 border-t border-amber-100 text-sm">
                            <strong className="text-amber-800 font-semibold mr-2">Ghi chú từ sếp:</strong>
                            <span className="text-amber-700">{ship.bossNotes}</span>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}
