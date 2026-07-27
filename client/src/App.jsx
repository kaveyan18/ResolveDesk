import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/auth/LoginScreen';
import StudentDashboard from './components/dashboards/StudentDashboard';
import TechnicianDashboard from './components/dashboards/TechnicianDashboard';
import HeadDashboard from './components/dashboards/HeadDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Initializing ResolveDesk session...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  switch (user.role) {
    case 'Student':
      return <StudentDashboard />;
    case 'Technician':
      return <TechnicianDashboard />;
    case 'DepartmentHead':
      return <HeadDashboard />;
    case 'Admin':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
