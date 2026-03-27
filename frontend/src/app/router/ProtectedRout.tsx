import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return <Navigate to="/login"></Navigate>
  }

  return children
}

export default ProtectedRoute