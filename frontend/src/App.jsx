import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StudentAuthProvider } from './context/StudentAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Student pages
import StudentRegisterPage from './pages/student/StudentRegisterPage';
import StudentEventsPage from './pages/student/StudentEventsPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentLayout from './components/StudentLayout';
import StudentProtectedRoute from './components/StudentProtectedRoute';

// Admin pages
import DashboardPage from './pages/admin/DashboardPage';
import PendingPage from './pages/admin/PendingPage';
import ApprovedPage from './pages/admin/ApprovedPage';
import RejectedPage from './pages/admin/RejectedPage';
import ExportPage from './pages/admin/ExportPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminEmailPage from './pages/admin/AdminEmailPage';
import EventAttendancePage from './pages/admin/EventAttendancePage';
import AnalyticsDashboardPage from './pages/admin/AnalyticsDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudentAuthProvider>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Student Routes */}
            <Route path="/student/register" element={<StudentRegisterPage />} />

            <Route path="/student" element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }>
              <Route path="events" element={<StudentEventsPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
            </Route>

            {/* Admin Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin Protected Routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="pending" element={<PendingPage />} />
              <Route path="approved" element={<ApprovedPage />} />
              <Route path="rejected" element={<RejectedPage />} />
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="events/:eventId/attendance" element={<EventAttendancePage />} />
              <Route path="email" element={<AdminEmailPage />} />
              <Route path="export" element={<ExportPage />} />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudentAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
