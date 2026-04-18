import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/protectedroute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/appcontext";
import { AuthProvider } from "@/context/authcontext";

import ChangePassword from "./pages/changepassword";
import ForgotPassword from "./pages/forgotpassword";
import Index from "./pages/index";
import Login from "./pages/login";
import ResetPassword from "./pages/resetpassword";
import Signup from "./pages/signup";
import VerifyEmail from "./pages/verifyemail";

const App = () => (
  <TooltipProvider>
    <AppProvider>
      <AuthProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  </TooltipProvider>
);

export default App;
