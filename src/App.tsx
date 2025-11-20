import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Treinos from "./pages/Treinos";
import NovoTreino from "./pages/NovoTreino";
import Progressao from "./pages/Progressao";
import Fotos from "./pages/Fotos";
import Metas from "./pages/Metas";
import ExercicioDetalhes from "./pages/ExercicioDetalhes";
import Badges from "./pages/Badges";
import Feed from "./pages/Feed";
import Perfil from "./pages/Perfil";
import Peso from "./pages/Peso";
import GroupFeed from "./pages/GroupFeed";
import UserProfile from "./pages/UserProfile";
import Onboarding from "./components/Onboarding";
import OfflineIndicator from "./components/OfflineIndicator";
import NotFound from "./pages/NotFound";
import { useMobileNotification } from "./hooks/useMobileNotification";

const queryClient = new QueryClient();

const AppContent = () => {
  useMobileNotification();
  
  return (
    <TooltipProvider>
      <a href="#main-content" className="skip-link">
        Pular para conteúdo principal
      </a>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Index />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/treinos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Treinos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/treinos/novo"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NovoTreino />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/treinos/editar/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NovoTreino />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/progressao"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Progressao />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fotos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Fotos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/metas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Metas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exercicio/:exerciseName"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ExercicioDetalhes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/badges"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Badges />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Feed />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Perfil />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/peso"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Peso />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/grupo/:groupId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GroupFeed />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil/:userId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UserProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Onboarding />
          <OfflineIndicator />
        </BrowserRouter>
      </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
