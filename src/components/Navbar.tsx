import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dumbbell, LogOut, User, Settings, Home, Calendar, TrendingUp, Camera, Plus, Target, Trophy, Cloud, CloudOff, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSync } from "@/hooks/useSync";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NotificationBell from "@/components/NotificationBell";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isSyncing, syncStatus, syncAll, isOnline, lastSync } = useSync();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-smooth hover:opacity-80">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-electric bg-clip-text text-transparent">
              TREINÃO DOS CARAS
            </span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            {isAuthenticated ? (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                  <Link to="/dashboard">
                    <Button 
                      variant={isActive("/dashboard") ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        isActive("/dashboard") && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Início
                    </Button>
                  </Link>
                  <Link to="/treinos">
                    <Button 
                      variant={isActive("/treinos") ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        isActive("/treinos") && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Treinos
                    </Button>
                  </Link>
                  <Link to="/treinos/novo">
                    <Button 
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Treino
                    </Button>
                  </Link>
                  <Link to="/metas">
                    <Button 
                      variant={isActive("/metas") ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        isActive("/metas") && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Metas
                    </Button>
                  </Link>
                  <Link to="/progressao">
                    <Button 
                      variant={isActive("/progressao") ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        isActive("/progressao") && "bg-primary text-primary-foreground"
                      )}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Progresso
                    </Button>
                  </Link>
                  <Link to="/fotos">
                    <Button 
                      variant={isActive("/fotos") ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        isActive("/fotos") && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Fotos
                    </Button>
                  </Link>
                  <Link to="/badges">
                    <Button 
                      variant={isActive("/badges") ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        isActive("/badges") && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Conquistas
                    </Button>
                  </Link>
                  <Link to="/feed">
                    <Button 
                      variant={isActive("/feed") ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        isActive("/feed") && "bg-primary text-primary-foreground"
                      )}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Feed
                    </Button>
                  </Link>
                </div>

                {/* Notifications */}
                <NotificationBell />

                {/* Sync Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={syncAll}
                        disabled={isSyncing || !isOnline}
                        className="relative"
                      >
                        {syncStatus === "syncing" ? (
                          <Cloud className="h-4 w-4 animate-pulse" />
                        ) : syncStatus === "success" ? (
                          <Cloud className="h-4 w-4 text-green-500" />
                        ) : !isOnline ? (
                          <CloudOff className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Cloud className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isSyncing
                        ? "Sincronizando..."
                        : !isOnline
                        ? "Offline - Dados serão sincronizados quando voltar online"
                        : lastSync
                        ? `Última sincronização: ${lastSync.toLocaleTimeString("pt-BR")}`
                        : "Sincronizar dados"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        {user?.avatar_url && (
                          <AvatarImage src={user.avatar_url} alt={user.name} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user ? getInitials(user.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/perfil" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/progressao" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Progressão</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow" size="sm">
                    Começar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
