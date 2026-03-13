import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { StaffOverview } from './pages/StaffOverview';
import { StaffShips } from './pages/StaffShips';
import { BossOverview } from './pages/BossOverview';
import { BossShips } from './pages/BossShips';
import { DocumentEntry } from './pages/DocumentEntry';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Staff Routes */}
                    <Route path="/staff" element={
                        <ProtectedRoute allowedRole="STAFF">
                            <Navigate to="/staff/overview" replace />
                        </ProtectedRoute>
                    } />
                    <Route path="/staff/overview" element={
                        <ProtectedRoute allowedRole="STAFF">
                            <StaffOverview />
                        </ProtectedRoute>
                    } />
                    <Route path="/staff/ships" element={
                        <ProtectedRoute allowedRole="STAFF">
                            <StaffShips />
                        </ProtectedRoute>
                    } />

                    {/* Boss Routes */}
                    <Route path="/boss" element={
                        <ProtectedRoute allowedRole="BOSS">
                            <Navigate to="/boss/overview" replace />
                        </ProtectedRoute>
                    } />
                    <Route path="/boss/overview" element={
                        <ProtectedRoute allowedRole="BOSS">
                            <BossOverview />
                        </ProtectedRoute>
                    } />
                    <Route path="/boss/ships" element={
                        <ProtectedRoute allowedRole="BOSS">
                            <BossShips />
                        </ProtectedRoute>
                    } />

                    {/* Document Entry Route */}
                    <Route path="/doc-entry" element={
                        <ProtectedRoute allowedRole="DOC">
                            <DocumentEntry />
                        </ProtectedRoute>
                    } />

                    {/* Root redirect */}
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
