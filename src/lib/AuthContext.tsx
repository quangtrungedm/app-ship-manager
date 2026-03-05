import React, { createContext, useContext, useState } from 'react';

export type Role = 'STAFF' | 'BOSS' | null;
export type Division = 'VIN_CAN_GIO' | 'SAT_THEP' | null;

export const DIVISION_LABELS: Record<string, string> = {
    VIN_CAN_GIO: 'Vin Cần Giờ',
    SAT_THEP: 'Sắt Thép',
};

interface AuthContextType {
    role: Role;
    division: Division;
    login: (role: Role, division: Division) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<Role>(() => {
        const saved = localStorage.getItem('app_role');
        return (saved === 'STAFF' || saved === 'BOSS') ? saved : null;
    });

    const [division, setDivision] = useState<Division>(() => {
        const saved = localStorage.getItem('app_division');
        return (saved === 'VIN_CAN_GIO' || saved === 'SAT_THEP') ? saved : null;
    });

    const login = (newRole: Role, newDiv: Division) => {
        setRole(newRole);
        setDivision(newDiv);
        if (newRole) localStorage.setItem('app_role', newRole);
        if (newDiv) localStorage.setItem('app_division', newDiv);
    };

    const logout = () => {
        setRole(null);
        setDivision(null);
        localStorage.removeItem('app_role');
        localStorage.removeItem('app_division');
    };

    return (
        <AuthContext.Provider value={{ role, division, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
