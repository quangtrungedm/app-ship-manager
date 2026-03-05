import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { Button } from './ui/Button';
import { LogOut, Anchor, User } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { role, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 text-white p-2 rounded-lg">
                                <Anchor size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 leading-none">Ship Manager</h1>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {role === 'STAFF' ? 'Phân hệ Nhân viên' : 'Phân hệ Quản lý'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                                <User size={16} />
                                <span>Xin chào, <strong>{role === 'STAFF' ? 'Nhân viên' : 'Sếp'}</strong></span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-red-600 hover:bg-red-50">
                                <LogOut size={18} className="mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
