import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QRGenerator from './pages/QRGenerator';
import QRScanner from './pages/QRScanner';
import FaceRegistration from './pages/FaceRegistration';
import FaceAttendance from './pages/FaceAttendance';
import MarkAttendance from './pages/MarkAttendance';
import AttendanceWindow from './pages/AttendanceWindow';
import MyAttendance from './pages/MyAttendance';
import MyClasses from './pages/MyClasses';
import Notifications from './pages/Notifications';
import AtRiskStudents from './pages/AtRiskStudents';
import LandingPage from './pages/LandingPage';
import ManageClasses from './pages/ManageClasses';
import './index.css';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

const DashboardHome = () => {
  const { user } = useAuth();
  switch (user?.role) {
    case 'student': return <StudentDashboard />;
    case 'faculty': return <FacultyDashboard />;
    case 'admin': return <AdminDashboard />;
    default: return <StudentDashboard />;
  }
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />

              <Route path="scan-qr" element={<ProtectedRoute roles={['student']}><QRScanner /></ProtectedRoute>} />
              <Route path="face-register" element={<ProtectedRoute roles={['student']}><FaceRegistration /></ProtectedRoute>} />
              <Route path="face-attendance" element={<ProtectedRoute roles={['student']}><FaceAttendance /></ProtectedRoute>} />
              <Route path="my-attendance" element={<ProtectedRoute roles={['student']}><MyAttendance /></ProtectedRoute>} />

              <Route path="generate-qr" element={<ProtectedRoute roles={['faculty', 'admin']}><QRGenerator /></ProtectedRoute>} />
              <Route path="mark-attendance" element={<ProtectedRoute roles={['faculty', 'admin']}><MarkAttendance /></ProtectedRoute>} />
              <Route path="attendance-window" element={<ProtectedRoute roles={['faculty', 'admin']}><AttendanceWindow /></ProtectedRoute>} />
              <Route path="class-analytics" element={<ProtectedRoute roles={['faculty', 'admin']}><AtRiskStudents /></ProtectedRoute>} />

              <Route path="my-classes" element={<MyClasses />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="at-risk" element={<ProtectedRoute roles={['faculty', 'admin']}><AtRiskStudents /></ProtectedRoute>} />
              <Route path="manage-classes" element={<ProtectedRoute roles={['admin']}><ManageClasses /></ProtectedRoute>} />

              <Route path="analytics" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            </Route>

            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
