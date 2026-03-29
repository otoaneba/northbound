import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: 'protected' }} replace />
  }

  return children
}

export default ProtectedRoute