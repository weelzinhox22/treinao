import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Filter, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { gamificationService, type Badge } from "@/services/gamificationService";
import { cn } from "@/lib/utils";
import { BadgeCardSkeleton, Skeleton } from "@/components/Skeleton";

const Badges = () => {
  const { user } = useAuth();
  const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Omit<Badge, "unlockedAt">[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked">("unlocked");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  const loadBadges = () => {
    if (!user) return;

    const unlocked = gamificationService.getUnlockedBadges(user.id);
    const all = gamificationService.getAllBadges();

    setUnlockedBadges(unlocked);
    setAllBadges(all);
    setLoading(false);
  };

  const getRarityColor = (rarity: Badge["rarity"]) => {
    switch (rarity) {
      case "common":
        return "border-gray-500/50 bg-gray-500/5";
      case "rare":
        return "border-blue-500/50 bg-blue-500/5";
      case "epic":
        return "border-purple-500/50 bg-purple-500/5";
      case "legendary":
        return "border-yellow-500/50 bg-yellow-500/5";
    }
  };

  const getRarityLabel = (rarity: Badge["rarity"]) => {
    switch (rarity) {
      case "common":
        return "Comum";
      case "rare":
        return "Rara";
      case "epic":
        return "Épica";
      case "legendary":
        return "Lendária";
    }
  };

  const unlockedIds = new Set(unlockedBadges.map((b) => b.id));

  // Filtrar badges baseado no filtro selecionado
  const filteredBadges = useMemo(() => {
    if (filter === "unlocked") {
      return allBadges.filter((badge) => unlockedIds.has(badge.id));
    }
    return allBadges;
  }, [allBadges, unlockedIds, filter]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="space-y-2">
            <Skeleton variant="default" className="h-8 w-48" />
            <Skeleton variant="text" className="h-4 w-64" />
          </div>
          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <Skeleton variant="default" className="h-2 w-full" />
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <BadgeCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-1">Conquistas</h1>
          <p className="text-muted-foreground text-sm">
            {unlockedBadges.length} de {allBadges.length} conquistas desbloqueadas
          </p>
        </div>

        {/* Progress */}
        <Card className="p-4 gradient-card border-border/50 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((unlockedBadges.length / allBadges.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(unlockedBadges.length / allBadges.length) * 100}%`,
              }}
            />
          </div>
        </Card>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filter === "unlocked" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unlocked")}
            className="flex-1"
          >
            <Filter className="h-4 w-4 mr-2" />
            Desbloqueadas ({unlockedBadges.length})
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="flex-1"
          >
            Todas ({allBadges.length})
          </Button>
        </div>

        {/* Badges Grid */}
        {filteredBadges.length === 0 ? (
          <Card className="p-8 gradient-card border-border/50 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conquista desbloqueada</h3>
            <p className="text-muted-foreground text-sm">
              Continue treinando para desbloquear suas primeiras conquistas!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredBadges.map((badge) => {
            const isUnlocked = unlockedIds.has(badge.id);
            const unlockedBadge = unlockedBadges.find((b) => b.id === badge.id);

            const badgeWithDetails = gamificationService.getBadgeWithDetails(badge.id);

            return (
              <Card
                key={badge.id}
                onClick={() => setSelectedBadge(badgeWithDetails || badge)}
                className={cn(
                  "p-4 gradient-card border-2 text-center transition-all",
                  isUnlocked
                    ? getRarityColor(badge.rarity)
                    : "border-border/30 opacity-50 grayscale",
                  "hover:scale-105 cursor-pointer"
                )}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {badge.description}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      badge.rarity === "common" && "bg-gray-500/20 text-gray-400",
                      badge.rarity === "rare" && "bg-blue-500/20 text-blue-400",
                      badge.rarity === "epic" && "bg-purple-500/20 text-purple-400",
                      badge.rarity === "legendary" && "bg-yellow-500/20 text-yellow-400"
                    )}
                  >
                    {getRarityLabel(badge.rarity)}
                  </span>
                </div>
                {isUnlocked && unlockedBadge?.unlockedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(unlockedBadge.unlockedAt).toLocaleDateString("pt-BR")}
                  </p>
                )}
                {!isUnlocked && (
                  <div className="mt-2">
                    <Trophy className="h-4 w-4 mx-auto text-muted-foreground/50" />
                  </div>
                )}
              </Card>
            );
          })}
          </div>
        )}

        {/* Badge Detail Dialog */}
        <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-5xl">{selectedBadge?.icon}</div>
                <div className="flex-1">
                  <DialogTitle className="text-xl">{selectedBadge?.name}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {selectedBadge?.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBadge?.detailedDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedBadge.detailedDescription}
                </p>
              )}
              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Raridade</p>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded font-medium",
                      selectedBadge?.rarity === "common" && "bg-gray-500/20 text-gray-400",
                      selectedBadge?.rarity === "rare" && "bg-blue-500/20 text-blue-400",
                      selectedBadge?.rarity === "epic" && "bg-purple-500/20 text-purple-400",
                      selectedBadge?.rarity === "legendary" && "bg-yellow-500/20 text-yellow-400"
                    )}
                  >
                    {selectedBadge?.rarity === "common" && "Comum"}
                    {selectedBadge?.rarity === "rare" && "Rara"}
                    {selectedBadge?.rarity === "epic" && "Épica"}
                    {selectedBadge?.rarity === "legendary" && "Lendária"}
                  </span>
                </div>
                {selectedBadge && unlockedIds.has(selectedBadge.id) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Desbloqueada em</p>
                    <p className="text-xs font-medium">
                      {unlockedBadges
                        .find((b) => b.id === selectedBadge.id)
                        ?.unlockedAt &&
                        new Date(
                          unlockedBadges.find((b) => b.id === selectedBadge.id)!.unlockedAt!
                        ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Badges;

