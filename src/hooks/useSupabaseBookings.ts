import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BookingData } from "@/components/Booking/BookingForm";
import { User } from "./useSupabaseAuth";
import { toast } from "@/components/ui/use-toast";

export type PeriodOption = {
  year?: number;
  month?: number;
  quarter?: number;
};

export const useSupabaseBookings = (user: User | null) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }
  
    // Initial fetch
    fetchBookings();
  
    // Set up real-time subscription
    const channel = supabase
      .channel('realtime-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Perubahan terdeteksi!', payload);
          
          const formatBooking = (record: any): BookingData => ({
            id: record.id,
            date: record.date,
            name: record.name,
            room: record.room,
            startTime: record.start_time,
            endTime: record.end_time,
            description: record.description || '',
            createdAt: record.created_at
          });

          setBookings(currentBookings => {
            if (payload.eventType === 'INSERT') {
              toast({
                title: "Jadwal Baru Ditambahkan",
                description: `Peminjaman untuk ${payload.new.name} telah ditambahkan.`,
              });
              return [...currentBookings, formatBooking(payload.new)].sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime));
            }
            if (payload.eventType === 'UPDATE') {
               toast({
                title: "Jadwal Diperbarui",
                description: `Peminjaman untuk ${payload.new.name} telah diubah.`,
              });
              return currentBookings.map(booking =>
                booking.id === payload.new.id ? formatBooking(payload.new) : booking
              );
            }
            if (payload.eventType === 'DELETE') {
              toast({
                title: "Jadwal Dihapus",
                description: `Satu jadwal peminjaman telah dihapus.`,
                variant: "destructive"
              });
              return currentBookings.filter(booking => booking.id !== payload.old.id);
            }
            return currentBookings;
          });
        }
      )
      .subscribe();
  
    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBookings]);

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

      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });
  };

  const addBooking = async (bookingData: Omit<BookingData, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    if (checkTimeConflict(bookingData.date, bookingData.room, bookingData.startTime, bookingData.endTime)) {
      return { 
        success: false, 
        error: `Bentrok waktu! Ruangan ${bookingData.room} sudah dipinjam pada tanggal ${bookingData.date} di rentang waktu ${bookingData.startTime} - ${bookingData.endTime}` 
      };
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          date: bookingData.date,
          name: bookingData.name,
          room: bookingData.room,
          start_time: bookingData.startTime,
          end_time: bookingData.endTime,
          description: bookingData.description,
          user_id: user.id
        });

      if (error) {
        console.error('Error adding booking:', error);
        return { success: false, error: 'Gagal menambah peminjaman' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error adding booking:', error);
      return { success: false, error: 'Gagal menambah peminjaman' };
    }
  };

  const updateBooking = async (id: string, updatedData: Partial<BookingData>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

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

      return { success: true };
    } catch (error) {
      console.error('Error deleting booking:', error);
      return { success: false, error: 'Gagal menghapus peminjaman' };
    }
  };

  // --- PERBAIKAN UTAMA DI SINI ---
  const bulkDeleteByPeriod = async (period: PeriodOption): Promise<{ success: boolean; error?: string }> => {
    if (!user || user.role !== 'admin') return { success: false, error: 'Unauthorized' };

    try {
      let query = supabase.from('bookings').delete();

      // Gunakan String manipulation untuk tanggal agar aman dari timezone
      if (period.year) {
        const yearStr = period.year.toString();
        
        if (period.month) {
          // Format MM harus 2 digit: 01, 02, dst.
          const monthStr = period.month.toString().padStart(2, '0');
          // Filter start: YYYY-MM-01
          const startStr = `${yearStr}-${monthStr}-01`;
          
          // Cari tanggal terakhir bulan tersebut
          // new Date(y, m, 0).getDate() memberikan jumlah hari di bulan m
          const lastDay = new Date(period.year, period.month, 0).getDate();
          const endStr = `${yearStr}-${monthStr}-${lastDay}`;
          
          query = query.gte('date', startStr);
          query = query.lte('date', endStr);
          
        } else if (period.quarter) {
          const startMonth = (period.quarter - 1) * 3 + 1; // 1, 4, 7, 10
          const endMonth = startMonth + 2; // 3, 6, 9, 12
          
          const startMonthStr = startMonth.toString().padStart(2, '0');
          const endMonthStr = endMonth.toString().padStart(2, '0');
          
          // Hari terakhir di bulan akhir triwulan
          const lastDay = new Date(period.year, endMonth, 0).getDate();
          
          const startStr = `${yearStr}-${startMonthStr}-01`;
          const endStr = `${yearStr}-${endMonthStr}-${lastDay}`;
          
          query = query.gte('date', startStr);
          query = query.lte('date', endStr);
          
        } else {
          // Setahun penuh
          query = query.gte('date', `${yearStr}-01-01`);
          query = query.lte('date', `${yearStr}-12-31`);
        }
      } else {
          return { success: false, error: 'Tahun harus dipilih' };
      }
  
      const { error } = await query;
  
      if (error) {
        console.error('Error bulk deleting:', error);
        return { success: false, error: 'Gagal menghapus data massal' };
      }
      
      await fetchBookings();
      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting (Catch):', error);
      return { success: false, error: 'Terjadi kesalahan sistem saat menghapus data' };
    }
  };

  const getActiveBookings = () => {
    const now = new Date();
    return bookings.filter(booking => {
      // Pastikan format tanggal valid sebelum parsing
      if(!booking.date) return false;
      const endDateTime = new Date(`${booking.date}T${booking.endTime}`);
      return endDateTime > now;
    });
  };

  const getAllBookings = () => {
    return bookings;
  };

  // --- PERBAIKAN EXPORT ---
  const exportToExcel = async (period: PeriodOption) => {
    try {
      let filteredBookings = [...bookings]; // Copy array agar aman

      if (period.year) {
          filteredBookings = filteredBookings.filter(booking => {
              // Validasi data
              if (!booking.date) return false;
              // Gunakan string parsing yang lebih aman daripada Date object
              const bookingYear = parseInt(booking.date.substring(0, 4));
              return bookingYear === period.year;
          });

          if (period.month) {
              filteredBookings = filteredBookings.filter(booking => {
                  if (!booking.date) return false;
                  // Format YYYY-MM-DD, ambil MM (index 5-7)
                  const bookingMonth = parseInt(booking.date.substring(5, 7));
                  return bookingMonth === period.month;
              });
          } else if (period.quarter) {
              const startMonth = (period.quarter - 1) * 3 + 1;
              const endMonth = startMonth + 2;
              filteredBookings = filteredBookings.filter(booking => {
                  if (!booking.date) return false;
                  const bookingMonth = parseInt(booking.date.substring(5, 7));
                  return bookingMonth >= startMonth && bookingMonth <= endMonth;
              });
          }
      }
      
      const csvContent = [
        ['Tanggal', 'Nama Peminjam', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Keterangan'],
        ...filteredBookings.map(booking => [
          `"${booking.date}"`, // Quote strings agar aman di CSV
          `"${booking.name.replace(/"/g, '""')}"`, // Escape quotes
          `"${booking.room}"`,
          booking.startTime,
          booking.endTime,
          `"${(booking.description || '').replace(/"/g, '""')}"`
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `peminjaman-ruangan-${period.year}${period.month ? '-bulan-'+period.month : ''}.csv`;
      document.body.appendChild(a); // Append ke body agar click works di Firefox
      a.click();
      document.body.removeChild(a); // Cleanup
      window.URL.revokeObjectURL(url); // Free memory
      
    } catch (e) {
      console.error("Export Error:", e);
      // Tidak throw error agar aplikasi tidak crash
    }
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
