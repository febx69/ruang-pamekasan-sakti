// src/pages/Index.tsx
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseBookings } from "@/hooks/useSupabaseBookings";
import LoginForm from "@/components/Auth/LoginForm";
import Header from "@/components/Layout/Header";
import BookingForm, { BookingData } from "@/components/Booking/BookingForm";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, login, logout, isLoading: authLoading } = useSupabaseAuth();
  // Kita tetap butuh hook ini untuk fungsi addBooking
  const { addBooking } = useSupabaseBookings(user);
  const navigate = useNavigate();

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    return await login(username, password);
  };

  const handleBookingSubmit = async (bookingData: Omit<BookingData, 'id' | 'createdAt'>) => {
    return await addBooking(bookingData);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-government-green"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={logout} />
      
      <main className="container mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Tombol menuju Jadwal */}
        <div className="flex justify-end">
            <Button 
                onClick={() => navigate("/jadwal")} 
                className="bg-government-blue hover:bg-blue-700 text-white gap-2"
            >
                <CalendarDays size={18} />
                Lihat Jadwal Ruangan
            </Button>
        </div>

        {/* Hanya menampilkan Form */}
        <BookingForm onSubmit={handleBookingSubmit} />
      </main>
    </div>
  );
};

export default Index;
