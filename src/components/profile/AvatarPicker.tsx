import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  avatars: string[];
  value: string | null;
  onSelect: (avatarUrl: string) => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ avatars, value, onSelect }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto pr-1">
        {avatars.map((avatar, index) => {
          const selected = value === avatar;

          return (
            <button
              key={avatar}
              type="button"
              onClick={() => onSelect(avatar)}
              className={cn(
                "relative aspect-square rounded-2xl border transition-all overflow-hidden",
                selected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/60",
              )}
              aria-label={`Select anime avatar ${index + 1}`}
            >
              <img
                src={avatar}
                alt={`Anime avatar ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {selected && (
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Pick any avatar style and save profile.</p>
    </div>
  );
};

export default AvatarPicker;
