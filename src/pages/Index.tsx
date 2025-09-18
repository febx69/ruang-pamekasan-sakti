import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBookings } from "@/hooks/useBookings";
import LoginForm from "@/components/Auth/LoginForm";
import Header from "@/components/Layout/Header";
import BookingForm, { BookingData } from "@/components/Booking/BookingForm";
import BookingList from "@/components/Booking/BookingList";
import EditBookingForm from "@/components/Booking/EditBookingForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const { user, login, logout, isLoading } = useAuth();
  const { 
    addBooking, 
    updateBooking, 
    deleteBooking, 
    bulkDeleteByPeriod, 
    getActiveBookings, 
    getAllBookings, 
    exportToExcel 
  } = useBookings();
  
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleLogin = (username: string, password: string): boolean => {
    return login(username, password);
  };

  const handleBookingSubmit = (bookingData: Omit<BookingData, 'id' | 'createdAt'>) => {
    addBooking(bookingData);
  };

  const handleEdit = (booking: BookingData) => {
    setEditingBooking(booking);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (updatedData: Omit<BookingData, 'id' | 'createdAt'>) => {
    if (editingBooking) {
      updateBooking(editingBooking.id, updatedData);
      setIsEditDialogOpen(false);
      setEditingBooking(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-government-green"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const bookings = user.role === 'admin' ? getAllBookings() : getActiveBookings();
  const listTitle = user.role === 'admin' ? 'Semua Peminjaman Ruangan' : 'Peminjaman Aktif';

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={logout} />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <BookingForm onSubmit={handleBookingSubmit} />
        
        <BookingList
          bookings={bookings}
          onDelete={user.role === 'admin' ? deleteBooking : undefined}
          onEdit={user.role === 'admin' ? handleEdit : undefined}
          onBulkDelete={user.role === 'admin' ? bulkDeleteByPeriod : undefined}
          onExport={user.role === 'admin' ? exportToExcel : undefined}
          userRole={user.role}
          title={listTitle}
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
