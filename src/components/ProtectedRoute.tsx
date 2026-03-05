import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function ProtectedRoute({ children, allowedRole }: { children: JSX.Element, allowedRole?: 'STAFF' | 'BOSS' }) {
    const { role } = useAuth();

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && role !== allowedRole) {
        // If accessing staff page but boss, redirect to boss dashboard
        if (role === 'BOSS') return <Navigate to="/boss/dashboard" replace />;
        if (role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
    }

    return children;
}
