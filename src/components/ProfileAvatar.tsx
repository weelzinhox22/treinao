import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { profileService } from "@/services/profileService";

interface ProfileAvatarProps {
  userId: string;
  userName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProfileAvatar = ({ userId, userName, size = "md", className }: ProfileAvatarProps) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvatar();
  }, [userId]);

  const loadAvatar = async () => {
    try {
      const profile = await profileService.getProfile(userId);
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ""}`}>
      {avatarUrl && !loading && (
        <AvatarImage src={avatarUrl} alt={userName} />
      )}
      <AvatarFallback className="bg-primary text-primary-foreground">
        {getInitials(userName)}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;

