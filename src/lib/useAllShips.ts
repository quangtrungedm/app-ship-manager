import { useState, useEffect, useCallback } from 'react';
import { Ship } from '../types';
import { isConfigured } from './config';
import * as api from './api';
import { MOCK_SHIPS } from '../data/mockShips';

interface UseAllShipsReturn {
    ships: Ship[];
    loading: boolean;
    error: string | null;
    addShip: (ship: Omit<Ship, 'id'>) => Promise<void>;
    updateShip: (ship: Ship) => Promise<void>;
    deleteShip: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const CACHE_KEY = 'ship_manager_cache_BOSS';

export function useAllShips(): UseAllShipsReturn {
    const [ships, setShips] = useState<Ship[]>(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try { return JSON.parse(cached); } catch { return []; }
        }
        return [];
    });
    const [loading, setLoading] = useState(!localStorage.getItem(CACHE_KEY));
    const [error, setError] = useState<string | null>(null);

    const loadShips = useCallback(async () => {
        if (!isConfigured()) {
            setShips(MOCK_SHIPS);
            setLoading(false);
            return;
        }
        setError(null);
        try {
            const data = await api.fetchShips();
            const bossShips = data.filter((s: Ship) => s.division === 'SAT_THEP' || !s.division);
            setShips(bossShips);
            localStorage.setItem(CACHE_KEY, JSON.stringify(bossShips));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
            if (ships.length === 0) setShips(MOCK_SHIPS);
        } finally {
            setLoading(false);
        }
    }, [ships.length]);

    useEffect(() => { loadShips(); }, [loadShips]);

    useEffect(() => {
        const handleRefresh = () => { loadShips(); };
        window.addEventListener('app:refresh', handleRefresh);
        return () => window.removeEventListener('app:refresh', handleRefresh);
    }, [loadShips]);

    const handleAdd = async (ship: Omit<Ship, 'id'>) => {
        const tempId = `shp-boss-${Date.now()}`;
        const newShip = { ...ship, id: tempId, division: 'SAT_THEP' } as Ship;
        setShips(prev => {
            const next = [newShip, ...prev];
            localStorage.setItem(CACHE_KEY, JSON.stringify(next));
            return next;
        });

        if (isConfigured()) {
            try {
                const { id } = await api.addShip({ ...ship, division: 'SAT_THEP' });
                setShips(prev => {
                    const next = prev.map(s => s.id === tempId ? { ...s, id } : s);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
                    return next;
                });
            } catch (err) {
                setShips(prev => {
                    const next = prev.filter(s => s.id !== tempId);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
                    return next;
                });
                throw err;
            }
        }
    };

    const handleUpdate = async (ship: Ship) => {
        const updatedShip = { ...ship, division: ship.division || 'SAT_THEP' };
        setShips(prev => {
            const next = prev.map(s => s.id === updatedShip.id ? updatedShip : s);
            localStorage.setItem(CACHE_KEY, JSON.stringify(next));
            return next;
        });
        if (isConfigured()) {
            try {
                await api.updateShip(updatedShip);
            } catch (err) {
                console.error('Lỗi cập nhật:', err);
                throw err;
            }
        }
    };

    const handleDelete = async (id: string) => {
        setShips(prev => {
            const next = prev.filter(s => s.id !== id);
            localStorage.setItem(CACHE_KEY, JSON.stringify(next));
            return next;
        });
        if (isConfigured()) {
            try {
                await api.deleteShip(id);
            } catch (err) {
                console.error('Lỗi xóa:', err);
                throw err;
            }
        }
    };

    return {
        ships,
        loading,
        error,
        addShip: handleAdd,
        updateShip: handleUpdate,
        deleteShip: handleDelete,
        refresh: loadShips,
    };
}
