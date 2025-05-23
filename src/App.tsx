import React from "react";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import FlowbiteWrapper from "./components/FlowbiteWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import { AccountBalanceProvider } from "./context/AccountBalanceContext";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider } from "./context/AuthContext";
import { BakiProvider } from "./context/BakiContext";
import { CategoryProvider } from "./context/CategoryContext";
import { NoteProvider } from "./context/NoteContext";
import { ResultProvider } from "./context/ResultContext";
import { TransactionProvider } from "./context/TransactionContext";
import { UserProvider } from "./context/UserContext";
import "./index.css";
import DashboardPage from "./pages";
import SignInPage from "./pages/authentication/sign-in";
import HomePage from "./pages/landing/home";
import PrivacyPage from "./pages/legal/privacy";
import NotFoundPage from "./pages/pages/404";
import ServerErrorPage from "./pages/pages/500";
import MaintenancePage from "./pages/pages/maintenance";
import UserListPage from "./pages/users/list";
import UserSettingsPage from "./pages/users/settings";
import CategoryListPage from "./pages/category/list";
import NoteListPage from "./pages/notes/list";
import { AlertComponent } from "./components/AlertComponent";
import TransactionListPage from "./pages/transaction/list";
import ResultListPage from "./pages/results/list";
import OrangeListPage from "./pages/orange/list";
import useInactivityLogout from "./hooks/useInactivityLogout";

/**
 * Component that handles user inactivity logout
 * Must be used within AuthProvider
 */
const InactivityHandler: React.FC = () => {
  useInactivityLogout(900000); // 15 minutes of inactivity
  return null;
};

const App: React.FC = () => {
  return (
    <AlertProvider>
      <AuthProvider>
        <CategoryProvider>
          <UserProvider>
            <BakiProvider>
              <AccountBalanceProvider>
                <TransactionProvider>
                  <NoteProvider>
                    <ResultProvider>
                      <AlertComponent />
                      <InactivityHandler />
                      <BrowserRouter>
                        <Routes>
                          <Route element={<FlowbiteWrapper />}>
                            {/* Protected Routes */}
                            <Route element={<ProtectedRoute />}>
                              <Route
                                path="/dashboard"
                                element={<DashboardPage />}
                              />
                              <Route
                                path="/users/list"
                                element={<UserListPage />}
                              />
                              <Route
                                path="/users/settings"
                                element={<UserSettingsPage />}
                              />
                              <Route
                                path="/categories"
                                element={<CategoryListPage />}
                              />
                              <Route path="/notes" element={<NoteListPage />} />
                              <Route
                                path="/transactions"
                                element={<TransactionListPage />}
                              />
                              <Route
                                path="/results"
                                element={<ResultListPage />}
                              />
                              <Route
                                path="/orange"
                                element={<OrangeListPage />}
                              />
                            </Route>

                            {/* Public Routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route
                              path="/pages/maintenance"
                              element={<MaintenancePage />}
                            />
                            <Route
                              path="/authentication/sign-in"
                              element={<SignInPage />}
                            />

                            {/* Legal Pages */}
                            <Route
                              path="/legal/privacy"
                              element={<PrivacyPage />}
                            />

                            {/* Error Handling Routes */}
                            <Route path="/500" element={<ServerErrorPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                          </Route>
                        </Routes>
                      </BrowserRouter>
                    </ResultProvider>
                  </NoteProvider>
                </TransactionProvider>
              </AccountBalanceProvider>
            </BakiProvider>
          </UserProvider>
        </CategoryProvider>
      </AuthProvider>
    </AlertProvider>
  );
};

export default App;
