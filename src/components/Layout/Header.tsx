import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo-pamekasan.png";

interface HeaderProps {
  user: {
    username: string;
    role: 'admin' | 'user';
  } | null;
  onLogout: () => void;
}

const Header = ({ user, onLogout }: HeaderProps) => {
  return (
    <header className="bg-card shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src={logoImage} 
              alt="Logo Kabupaten Pamekasan" 
              className="h-12 w-12 object-contain"
            />
            <div className="text-foreground">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Sistem Peminjaman Ruangan
              </h1>
              <p className="text-sm text-muted-foreground">
                Dinas Kesehatan Kabupaten Pamekasan
              </p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-foreground">
                <User size={18} />
                <div className="text-sm">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-muted-foreground text-xs capitalize">{user.role}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="transition-all duration-300 transform hover:scale-105"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
