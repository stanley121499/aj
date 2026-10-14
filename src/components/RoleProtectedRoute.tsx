import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import LoadingPage from "../pages/pages/loading";
import { useAuthContext } from "../context/AuthContext";
import type { Database } from "../../database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface RoleProtectedRouteProps {
  /** Roles allowed to access nested routes. */
  allowedRoles: UserRole[];
  /** Where to send unauthorized signed-in users. */
  redirectTo?: string;
}

/**
 * Blocks signed-in users whose role is outside allowedRoles.
 * Must nest under ProtectedRoute (auth required).
 */
const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  redirectTo = "/dashboard",
}) => {
  const { user_detail, loading } = useAuthContext();

  if (loading || !user_detail) {
    // Wait for user_detail — redirecting while it is still null sends admins to /dashboard.
    return <LoadingPage />;
  }

  if (!allowedRoles.includes(user_detail.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
