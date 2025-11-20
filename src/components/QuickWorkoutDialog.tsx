import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Trophy, Camera, X } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { activityService, type ActivityType } from "@/services/activityService";
import { groupService, type Challenge } from "@/services/groupService";
import { workoutPhotoService } from "@/services/workoutPhotoService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import LazyImage from "@/components/LazyImage";

interface QuickWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkoutCreated?: () => void;
}

const QuickWorkoutDialog = ({
  open,
  onOpenChange,
  onWorkoutCreated,
}: QuickWorkoutDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>("");
  const [durationHours, setDurationHours] = useState<string>("0");
  const [durationMinutes, setDurationMinutes] = useState<string>("0");
  const [durationSeconds, setDurationSeconds] = useState<string>("0");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [open, user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const allActivities = activityService.getAllActivities();
      setActivities(allActivities);

      const userChallenges = await groupService.getUserChallenges(user.id);
      setChallenges(userChallenges);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A foto deve ter no máximo 10MB",
          variant: "destructive",
        });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const calculateTotalMinutes = (): number => {
    const hours = parseInt(durationHours) || 0;
    const minutes = parseInt(durationMinutes) || 0;
    const seconds = parseInt(durationSeconds) || 0;
    return hours * 60 + minutes + Math.round(seconds / 60);
  };

  const handleCreate = async () => {
    if (!user || !selectedActivity) return;

    const activity = activityService.getActivityById(selectedActivity);
    if (!activity) return;

    const totalMinutes = calculateTotalMinutes();
    if (totalMinutes <= 0) {
      toast({
        title: "Duração inválida",
        description: "A duração deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    setUploadingPhoto(true);
    try {
      const points = activityService.calculatePoints(selectedActivity, totalMinutes);

      // Upload da foto se houver
      let photoUrl: string | undefined;
      if (photoFile) {
        try {
          photoUrl = await workoutPhotoService.uploadWorkoutPhoto(user.id, photoFile);
        } catch (error: any) {
          console.error("Erro ao fazer upload da foto:", error);
          toast({
            title: "Aviso",
            description: "Treino registrado, mas a foto não foi enviada. " + (error.message || ""),
            variant: "destructive",
          });
        }
      }

      await groupService.createQuickWorkout(
        user.id,
        user.name,
        selectedActivity,
        activity.name,
        totalMinutes,
        format(date, "yyyy-MM-dd"),
        points,
        selectedChallenges.length > 0 ? selectedChallenges : undefined,
        photoUrl,
        startTime || undefined,
        parseInt(durationHours) || 0,
        parseInt(durationMinutes) || 0,
        parseInt(durationSeconds) || 0,
        title.trim() || undefined,
        description.trim() || undefined
      );

      toast({
        title: "Treino registrado!",
        description: `Você ganhou ${points} pontos!`,
      });

      onWorkoutCreated?.();
      onOpenChange(false);
      
      // Reset form
      setSelectedActivity("");
      setStartTime("");
      setDurationHours("0");
      setDurationMinutes("0");
      setDurationSeconds("0");
      setDate(new Date());
      setSelectedChallenges([]);
      setPhotoFile(null);
      setPhotoPreview(null);
      setTitle("");
      setDescription("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar o treino.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
      setUploadingPhoto(false);
    }
  };

  const selectedActivityData = activities.find((a) => a.id === selectedActivity);
  const totalMinutes = calculateTotalMinutes();
  const calculatedPoints = selectedActivityData && totalMinutes > 0
    ? activityService.calculatePoints(selectedActivity, totalMinutes)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registrar Treino Rápido
          </DialogTitle>
          <DialogDescription>
            Registre seu treino do dia e ganhe pontos nos desafios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div>
            <Label htmlFor="title">Título do Treino (opcional)</Label>
            <Input
              id="title"
              placeholder="Ex: Treino Matinal de Peito"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dê um nome para seu treino
            </p>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Como foi seu treino? Compartilhe detalhes, dicas ou motivação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Adicione uma legenda, código de grupo, ou qualquer mensagem
            </p>
          </div>

          {/* Data */}
          <div>
            <Label>Data do Treino</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tipo de Atividade */}
          <div>
            <Label>Tipo de Atividade</Label>
            <Select value={selectedActivity} onValueChange={setSelectedActivity}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a atividade" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    <div className="flex items-center gap-2">
                      <span>{activity.emoji}</span>
                      <span>{activity.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horário de Início */}
          <div>
            <Label>Horário de Início (opcional)</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Quando você começou o treino
            </p>
          </div>

          {/* Duração Detalhada */}
          <div>
            <Label>Duração do Treino</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <Label htmlFor="hours" className="text-xs text-muted-foreground">Horas</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="24"
                  value={durationHours}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 24)) {
                      setDurationHours(val);
                    }
                  }}
                  placeholder="0"
                  className="text-center"
                />
              </div>
              <div>
                <Label htmlFor="minutes" className="text-xs text-muted-foreground">Minutos</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                      setDurationMinutes(val);
                    }
                  }}
                  placeholder="0"
                  className="text-center"
                />
              </div>
              <div>
                <Label htmlFor="seconds" className="text-xs text-muted-foreground">Segundos</Label>
                <Input
                  id="seconds"
                  type="number"
                  min="0"
                  max="59"
                  value={durationSeconds}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                      setDurationSeconds(val);
                    }
                  }}
                  placeholder="0"
                  className="text-center"
                />
              </div>
            </div>
            {totalMinutes > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Total: {totalMinutes} minuto{totalMinutes !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Pontos Calculados */}
          {selectedActivity && totalMinutes > 0 && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Pontos que você ganhará:</span>
                </div>
                <span className="text-2xl font-bold text-primary">{calculatedPoints}</span>
              </div>
            </div>
          )}

          {/* Foto do Treino */}
          <div>
            <Label>Foto do Treino (opcional)</Label>
            {photoPreview ? (
              <div className="relative mt-2">
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                  <LazyImage
                    src={photoPreview}
                    alt="Preview da foto"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={removePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo 10MB. Formatos: JPG, PNG, WEBP
                </p>
              </div>
            )}
          </div>

          {/* Desafios */}
          {challenges.length > 0 && (
            <div>
              <Label>Participar em Desafios</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={challenge.id}
                      checked={selectedChallenges.includes(challenge.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedChallenges([...selectedChallenges, challenge.id]);
                        } else {
                          setSelectedChallenges(
                            selectedChallenges.filter((id) => id !== challenge.id)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={challenge.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <div>
                        <p className="font-semibold">{challenge.name}</p>
                        {challenge.description && (
                          <p className="text-xs text-muted-foreground">
                            {challenge.description}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!selectedActivity || totalMinutes <= 0 || creating || uploadingPhoto}>
            {creating || uploadingPhoto ? "Registrando..." : "Registrar Treino"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickWorkoutDialog;

