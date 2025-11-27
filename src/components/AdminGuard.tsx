import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export const AdminGuard = () => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  
  // Logic: Must be logged in AND have admin claim
  // Note: For development, you might temporarily allow just (user) if you haven't set claims yet.
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};