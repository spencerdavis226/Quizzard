import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/token';

interface RequireAuthProps {
  children: React.ReactNode;
}

function RequireAuth({ children }: RequireAuthProps) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default RequireAuth;
