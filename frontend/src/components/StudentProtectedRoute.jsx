import { Navigate } from 'react-router-dom';
import { useStudentAuth } from '../context/StudentAuthContext';

export default function StudentProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useStudentAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050510]">
                <div className="loader"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/student/register" replace />;
    }

    return children;
}
