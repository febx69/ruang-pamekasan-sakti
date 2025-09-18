import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BookingData } from "@/components/Booking/BookingForm";
import { User } from "./useSupabaseAuth";

export const useSupabaseBookings = (user: User | null) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      const formattedBookings: BookingData[] = data.map(booking => ({
        id: booking.id,
        date: booking.date,
        name: booking.name,
        room: booking.room,
        startTime: booking.start_time,
        endTime: booking.end_time,
        description: booking.description || '',
        createdAt: booking.created_at
      }));

      setBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const checkTimeConflict = (
    date: string,
    room: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): boolean => {
    return bookings.some(booking => {
      if (booking.id === excludeId) return false;
      if (booking.date !== date || booking.room !== room) return false;

      const newStart = startTime;
      const newEnd = endTime;
      const existingStart = booking.startTime;
      const existingEnd = booking.endTime;

      // Check if time ranges overlap
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });
  };

  const addBooking = async (bookingData: Omit<BookingData, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    // Check for time conflicts
    if (checkTimeConflict(bookingData.date, bookingData.room, bookingData.startTime, bookingData.endTime)) {
      return { 
        success: false, 
        error: `Bentrok waktu! Ruangan ${bookingData.room} sudah dipinjam pada tanggal ${bookingData.date} di rentang waktu ${bookingData.startTime} - ${bookingData.endTime}` 
      };
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          date: bookingData.date,
          name: bookingData.name,
          room: bookingData.room,
          start_time: bookingData.startTime,
          end_time: bookingData.endTime,
          description: bookingData.description,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding booking:', error);
        return { success: false, error: 'Gagal menambah peminjaman' };
      }

      await fetchBookings();
      return { success: true };
    } catch (error) {
      console.error('Error adding booking:', error);
      return { success: false, error: 'Gagal menambah peminjaman' };
    }
  };

  const updateBooking = async (id: string, updatedData: Partial<BookingData>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    // Check for time conflicts if time or date is being updated
    if (updatedData.date || updatedData.startTime || updatedData.endTime || updatedData.room) {
      const existingBooking = bookings.find(b => b.id === id);
      if (!existingBooking) return { success: false, error: 'Peminjaman tidak ditemukan' };

      const checkDate = updatedData.date || existingBooking.date;
      const checkRoom = updatedData.room || existingBooking.room;
      const checkStartTime = updatedData.startTime || existingBooking.startTime;
      const checkEndTime = updatedData.endTime || existingBooking.endTime;

      if (checkTimeConflict(checkDate, checkRoom, checkStartTime, checkEndTime, id)) {
        return { 
          success: false, 
          error: `Bentrok waktu! Ruangan ${checkRoom} sudah dipinjam pada tanggal ${checkDate} di rentang waktu ${checkStartTime} - ${checkEndTime}` 
        };
      }
    }

    try {
      const updateData: any = {};
      if (updatedData.date) updateData.date = updatedData.date;
      if (updatedData.name) updateData.name = updatedData.name;
      if (updatedData.room) updateData.room = updatedData.room;
      if (updatedData.startTime) updateData.start_time = updatedData.startTime;
      if (updatedData.endTime) updateData.end_time = updatedData.endTime;
      if (updatedData.description !== undefined) updateData.description = updatedData.description;

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating booking:', error);
        return { success: false, error: 'Gagal memperbarui peminjaman' };
      }

      await fetchBookings();
      return { success: true };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: 'Gagal memperbarui peminjaman' };
    }
  };

  const deleteBooking = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting booking:', error);
        return { success: false, error: 'Gagal menghapus peminjaman' };
      }

      await fetchBookings();
      return { success: true };
    } catch (error) {
      console.error('Error deleting booking:', error);
      return { success: false, error: 'Gagal menghapus peminjaman' };
    }
  };

  const bulkDeleteByPeriod = async (period: 'month' | 'quarter' | 'year'): Promise<{ success: boolean; error?: string }> => {
    if (!user || user.role !== 'admin') return { success: false, error: 'Unauthorized' };

    try {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (period) {
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const { error } = await supabase
        .from('bookings')
        .delete()
        .lt('date', cutoffDate.toISOString().split('T')[0]);

      if (error) {
        console.error('Error bulk deleting:', error);
        return { success: false, error: 'Gagal menghapus data massal' };
      }

      await fetchBookings();
      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting:', error);
      return { success: false, error: 'Gagal menghapus data massal' };
    }
  };

  const getActiveBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= today;
    });
  };

  const getAllBookings = () => {
    return bookings;
  };

  const exportToExcel = async (period: 'month' | 'quarter' | 'year') => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (period) {
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const filteredBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= cutoffDate;
    });

    // Simple CSV export
    const csvContent = [
      ['Tanggal', 'Nama Peminjam', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Keterangan'],
      ...filteredBookings.map(booking => [
        booking.date,
        booking.name,
        booking.room,
        booking.startTime,
        booking.endTime,
        booking.description
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `peminjaman-ruangan-${period}-${now.toISOString().split('T')[0]}.csv`);
    a.click();
  };

  return {
    bookings,
    isLoading,
    addBooking,
    updateBooking,
    deleteBooking,
    bulkDeleteByPeriod,
    getActiveBookings,
    getAllBookings,
    exportToExcel,
    refreshBookings: fetchBookings
  };
};