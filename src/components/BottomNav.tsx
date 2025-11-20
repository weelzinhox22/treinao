import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, TrendingUp, Plus, Target, Users, MoreVertical, Trophy, Image, Award, User, Scale } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const mainNavItems = [
    {
      path: "/dashboard",
      icon: Home,
      label: "Início",
    },
    {
      path: "/treinos",
      icon: Calendar,
      label: "Treinos",
    },
    {
      path: "/treinos/novo",
      icon: Plus,
      label: "Novo",
      isAction: true,
    },
    {
      path: "/feed",
      icon: Users,
      label: "Feed",
    },
  ];

  const moreNavItems = [
    {
      path: "/metas",
      icon: Target,
      label: "Metas",
    },
    {
      path: "/peso",
      icon: Scale,
      label: "Peso",
    },
    {
      path: "/progressao",
      icon: TrendingUp,
      label: "Progressão",
    },
    {
      path: "/fotos",
      icon: Image,
      label: "Fotos",
    },
    {
      path: "/badges",
      icon: Award,
      label: "Conquistas",
    },
    {
      path: "/perfil",
      icon: User,
      label: "Perfil",
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || (path === "/dashboard" && location.pathname === "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {mainNavItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg",
                    "hover:bg-primary/90 transition-all"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </Button>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 px-1",
                "transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-primary")} />
              <span className={cn("text-[10px] font-medium truncate w-full text-center", active && "text-primary")}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* Menu Mais */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 px-1",
                "transition-colors text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreVertical className="h-5 w-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate w-full text-center">
                Mais
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="mb-2 w-48">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <DropdownMenuItem
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(active && "bg-primary/10 text-primary")}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default BottomNav;

