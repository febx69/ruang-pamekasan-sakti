// src/pages/Index.tsx
import { useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseBookings } from "@/hooks/useSupabaseBookings";
import LoginForm from "@/components/Auth/LoginForm";
import Header from "@/components/Layout/Header";
import BookingForm, { BookingData } from "@/components/Booking/BookingForm";
import BookingList from "@/components/Booking/BookingList";
import EditBookingForm from "@/components/Booking/EditBookingForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const { user, login, logout, isLoading: authLoading } = useSupabaseAuth();
  const { 
    bookings,
    isLoading: bookingsLoading,
    addBooking, 
    updateBooking, 
    deleteBooking, 
    bulkDeleteByPeriod, 
    getActiveBookings, 
    getAllBookings, 
    exportToExcel 
  } = useSupabaseBookings(user);
  
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    return await login(username, password);
  };

  const handleBookingSubmit = async (bookingData: Omit<BookingData, 'id' | 'createdAt'>) => {
    return await addBooking(bookingData);
  };

  const handleEdit = (booking: BookingData) => {
    setEditingBooking(booking);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (updatedData: Omit<BookingData, 'id' | 'createdAt'>) => {
    if (editingBooking) {
      const result = await updateBooking(editingBooking.id, updatedData);
      if (result.success) {
        setIsEditDialogOpen(false);
        setEditingBooking(null);
      }
      return result;
    }
    return { success: false, error: 'No booking selected' };
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

  const displayBookings = user.role === 'admin' ? getAllBookings() : getActiveBookings();
  const listTitle = user.role === 'admin' ? 'Semua Peminjaman Ruangan' : 'Peminjaman Aktif';

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={logout} />
      
      <main className="container mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <BookingForm onSubmit={handleBookingSubmit} />
        
        <BookingList
          bookings={displayBookings}
          onDelete={user.role === 'admin' ? deleteBooking : undefined}
          onEdit={user.role === 'admin' ? handleEdit : undefined}
          onBulkDelete={user.role === 'admin' ? bulkDeleteByPeriod : undefined}
          onExport={user.role === 'admin' ? exportToExcel : undefined}
          userRole={user.role}
          title={listTitle}
          isLoading={bookingsLoading}
        />
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Peminjaman</DialogTitle>
            <DialogDescription>
              Ubah detail peminjaman ruangan
            </DialogDescription>
          </DialogHeader>
          {editingBooking && (
            <EditBookingForm
              booking={editingBooking}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
