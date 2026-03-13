import { Navigate } from 'react-router-dom';
import { useAuth, Role } from '../lib/AuthContext';

export function ProtectedRoute({ children, allowedRole }: { children: JSX.Element, allowedRole?: Role }) {
    const { role } = useAuth();

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && role !== allowedRole) {
        // If accessing staff page but boss, redirect to boss dashboard
        if (role === 'BOSS') return <Navigate to="/boss/overview" replace />;
        if (role === 'STAFF') return <Navigate to="/staff/overview" replace />;
        if (role === 'DOC') return <Navigate to="/doc-entry" replace />;
    }

    return children;
}
