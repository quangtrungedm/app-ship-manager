import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ShipList } from '../components/ShipList';
import { ShipForm } from '../components/ShipForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { MOCK_SHIPS } from '../data/mockShips';
import { Ship } from '../types';
import { Plus, TrendingUp, Anchor, CheckCircle } from 'lucide-react';

export function StaffDashboard() {
    const [ships, setShips] = useState<Ship[]>(MOCK_SHIPS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShip, setEditingShip] = useState<Ship | undefined>(undefined);

    // Statistics calculations
    const totalShips = ships.length;
    const totalWeight = ships.reduce((acc, ship) => acc + ship.weight, 0);
    const completedShips = ships.filter(s => s.status === 'completed').length;

    const handleAddShip = () => {
        setEditingShip(undefined);
        setIsModalOpen(true);
    };

    const handleEditShip = (ship: Ship) => {
        setEditingShip(ship);
        setIsModalOpen(true);
    };

    const handleSubmit = (shipData: Partial<Ship>) => {
        if (editingShip) {
            setShips(ships.map(s => s.id === editingShip.id ? { ...s, ...shipData } as Ship : s));
        } else {
            setShips([{
                ...shipData,
                id: `shp-${Date.now()}`
            } as Ship, ...ships]);
        }
        setIsModalOpen(false);
    };

    return (
        <DashboardLayout>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-blue-500/20">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 font-medium mb-1">Tổng Số Tàu (Tháng này)</p>
                                <h3 className="text-4xl font-bold">{totalShips}</h3>
                            </div>
                            <div className="bg-blue-400/30 p-3 rounded-xl">
                                <Anchor size={24} className="text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-emerald-500/20">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-emerald-100 font-medium mb-1">Đã Hoàn Thành</p>
                                <h3 className="text-4xl font-bold">{completedShips}</h3>
                            </div>
                            <div className="bg-emerald-400/30 p-3 rounded-xl">
                                <CheckCircle size={24} className="text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-indigo-500/20">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-indigo-100 font-medium mb-1">Tổng Sản Lượng (Tấn)</p>
                                <h3 className="text-4xl font-bold">{totalWeight.toLocaleString()}</h3>
                            </div>
                            <div className="bg-indigo-400/30 p-3 rounded-xl">
                                <TrendingUp size={24} className="text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Danh Sách Tàu</h2>
                    <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi thông tin các lịch trình tàu.</p>
                </div>
                <Button onClick={handleAddShip} className="shadow-md">
                    <Plus size={18} className="mr-2" />
                    Nhập Tàu Mới
                </Button>
            </div>

            <ShipList ships={ships} onShipClick={handleEditShip} />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingShip ? "Cập nhật Thông tin Tàu" : "Nhập Biên nhận Tàu Mới"}
            >
                <ShipForm
                    initialData={editingShip}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </DashboardLayout>
    );
}
