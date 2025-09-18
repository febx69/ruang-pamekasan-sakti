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
    <header className="bg-gradient-header shadow-government border-b border-government-green/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src={logoImage} 
              alt="Logo Kabupaten Pamekasan" 
              className="h-12 w-12 object-contain"
            />
            <div className="text-white">
              <h1 className="text-xl font-bold tracking-tight">
                Sistem Manajemen Peminjaman Ruangan
              </h1>
              <p className="text-sm text-white/90">
                Dinas Kesehatan Kabupaten Pamekasan
              </p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white">
                <User size={18} />
                <div className="text-sm">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-white/80 text-xs capitalize">{user.role}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="border-white/30 text-white hover:bg-white/20 hover:text-white"
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