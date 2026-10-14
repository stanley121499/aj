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

  // Only block on auth/detail fetch — never treat a missing profile as forever-loading.
  if (loading) {
    return <LoadingPage />;
  }

  if (!user_detail) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(user_detail.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
