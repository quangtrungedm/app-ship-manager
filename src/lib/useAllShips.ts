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

const CACHE_KEY = 'ship_manager_cache_ALL';

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
            setShips(data);
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
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
        const newShip = { ...ship, id: tempId } as Ship;
        setShips(prev => [newShip, ...prev]);

        if (isConfigured()) {
            try {
                const { id } = await api.addShip(ship);
                setShips(prev => prev.map(s => s.id === tempId ? { ...s, id } : s));
            } catch (err) {
                setShips(prev => prev.filter(s => s.id !== tempId));
                throw err;
            }
        }
    };

    const handleUpdate = async (ship: Ship) => {
        setShips(prev => prev.map(s => s.id === ship.id ? ship : s));
        if (isConfigured()) {
            try { await api.updateShip(ship); } catch (err) { console.error('Lỗi cập nhật:', err); }
        }
    };

    const handleDelete = async (id: string) => {
        setShips(prev => prev.filter(s => s.id !== id));
        if (isConfigured()) {
            try { await api.deleteShip(id); } catch (err) { console.error('Lỗi xóa:', err); }
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
