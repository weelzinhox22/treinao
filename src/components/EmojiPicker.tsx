import { Button } from "@/components/ui/button";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const EmojiPicker = ({ value, onChange }: EmojiPickerProps) => {
  const moods = [
    { emoji: "😎", label: "Confiante" },
    { emoji: "💪", label: "Forte" },
    { emoji: "🔥", label: "Motivado" },
    { emoji: "😤", label: "Determinado" },
    { emoji: "😊", label: "Feliz" },
    { emoji: "😴", label: "Cansado" },
    { emoji: "🤒", label: "Doente" },
    { emoji: "😐", label: "Normal" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {moods.map((mood) => (
        <Button
          key={mood.emoji}
          type="button"
          variant={value === mood.emoji ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(value === mood.emoji ? "" : mood.emoji)}
          className="gap-1.5"
        >
          <span className="text-lg">{mood.emoji}</span>
          <span className="text-xs">{mood.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default EmojiPicker;

