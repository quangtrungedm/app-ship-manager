import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ShipList } from '../components/ShipList';
import { Card, CardContent } from '../components/ui/Card';
import { MOCK_SHIPS } from '../data/mockShips';
import { TrendingUp, Anchor, CheckCircle } from 'lucide-react';

export function BossDashboard() {
    // Use same mock data for presentation
    const ships = MOCK_SHIPS;

    // Statistics calculations
    const totalShips = ships.length;
    const totalWeight = ships.reduce((acc, ship) => acc + ship.weight, 0);
    const completedShips = ships.filter(s => s.status === 'completed').length;

    return (
        <DashboardLayout>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white border-none shadow-slate-900/20">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-300 font-medium mb-1">Tổng Số Tàu (Tháng này)</p>
                                <h3 className="text-4xl font-bold">{totalShips}</h3>
                            </div>
                            <div className="bg-slate-600/50 p-3 rounded-xl">
                                <Anchor size={24} className="text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none shadow-emerald-900/20">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-emerald-100 font-medium mb-1">Đã Hoàn Thành</p>
                                <h3 className="text-4xl font-bold">{completedShips}</h3>
                            </div>
                            <div className="bg-emerald-500/50 p-3 rounded-xl">
                                <CheckCircle size={24} className="text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none shadow-indigo-900/20">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-indigo-100 font-medium mb-1">Tổng Sản Lượng (Tấn)</p>
                                <h3 className="text-4xl font-bold">{totalWeight.toLocaleString()}</h3>
                            </div>
                            <div className="bg-indigo-500/50 p-3 rounded-xl">
                                <TrendingUp size={24} className="text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Danh Sách Tàu (Chỉ Xem)</h2>
                <p className="text-slate-500 text-sm mt-1">Theo dõi tiến độ và tải giấy tờ đính kèm.</p>
            </div>

            <ShipList ships={ships} />
        </DashboardLayout>
    );
}
