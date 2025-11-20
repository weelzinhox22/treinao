import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { exercisesService, type ExerciseData } from "@/services/exercisesService";
import { useAuth } from "@/contexts/AuthContext";
import { treinoService } from "@/services/treinoService";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface ExerciseAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const ExerciseAutocomplete = ({
  value,
  onChange,
  placeholder = "Digite o nome do exercício",
  className,
}: ExerciseAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Buscar exercícios
  const getSuggestions = (): ExerciseData[] => {
    if (!searchQuery.trim()) {
      // Se não há busca, mostrar exercícios populares + últimos usados
      const popular = exercisesService.getPopular(5);
      const lastUsed = user
        ? getLastUsedExercises(user.id, 5)
        : [];
      
      // Combinar e remover duplicatas
      const all = [...popular, ...lastUsed];
      const unique = Array.from(
        new Map(all.map((ex) => [ex.name, ex])).values()
      );
      return unique.slice(0, 8);
    }

    return exercisesService.searchExercises(searchQuery);
  };

  // Obter exercícios usados recentemente pelo usuário
  const getLastUsedExercises = (userId: string, limit: number): ExerciseData[] => {
    const treinos = treinoService.getTreinos(userId);
    const exerciseNames = new Set<string>();

    // Coletar nomes de exercícios dos últimos treinos
    treinos
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .forEach((treino) => {
        treino.exercises.forEach((ex) => {
          if (ex.name.trim()) {
            exerciseNames.add(ex.name);
          }
        });
      });

    // Buscar dados dos exercícios
    return Array.from(exerciseNames)
      .slice(0, limit)
      .map((name) => exercisesService.getByName(name))
      .filter((ex): ex is ExerciseData => ex !== undefined);
  };

  const suggestions = getSuggestions();

  const handleSelect = (exerciseName: string) => {
    onChange(exerciseName);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSearchQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={cn("pr-8", className)}
          />
          <ChevronsUpDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar exercício..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery
                ? "Nenhum exercício encontrado"
                : "Digite para buscar exercícios"}
            </CommandEmpty>
            {suggestions.length > 0 && (
              <CommandGroup heading={searchQuery ? "Resultados" : "Sugestões"}>
                {suggestions.map((exercise) => (
                  <CommandItem
                    key={exercise.id}
                    value={exercise.name}
                    onSelect={() => handleSelect(exercise.name)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === exercise.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {exercise.category}
                        {exercise.muscleGroups.length > 0 &&
                          ` • ${exercise.muscleGroups.join(", ")}`}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!searchQuery && (
              <CommandGroup heading="Categorias">
                {exercisesService.getCategories().slice(0, 5).map((category) => (
                  <CommandItem
                    key={category}
                    value={category}
                    onSelect={() => {
                      setSearchQuery(category);
                    }}
                    className="cursor-pointer"
                  >
                    {category}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ExerciseAutocomplete;

