// src/components/Booking/BookingList.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Search, Trash2, Edit, Users, Download, Archive } from "lucide-react";
import { BookingData } from "./BookingForm";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodOption } from "@/hooks/useSupabaseBookings";

interface BookingListProps {
  bookings: BookingData[];
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onEdit?: (booking: BookingData) => void;
  onBulkDelete?: (period: PeriodOption) => Promise<{ success: boolean; error?: string }>;
  onExport?: (period: PeriodOption) => void;
  userRole: 'admin' | 'user';
  title: string;
  isLoading?: boolean;
}

const BookingList = ({
  bookings,
  onDelete,
  onEdit,
  onBulkDelete,
  onExport,
  userRole,
  title,
  isLoading = false
}: BookingListProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>();

  const years = Array.from(new Set(bookings.map(b => new Date(b.date).getFullYear()))).sort((a, b) => b - a);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
  const quarters = [{ value: 1, label: 'Triwulan 1 (Jan-Mar)' }, { value: 2, label: 'Triwulan 2 (Apr-Jun)' }, { value: 3, label: 'Triwulan 3 (Jul-Sep)' }, { value: 4, label: 'Triwulan 4 (Okt-Des)' }];

  const filteredBookings = bookings
    .filter(booking =>
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.description && booking.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      booking.date.includes(searchTerm)
    )
    .sort((a, b) => {
      // Sort by date descending, then start time ascending
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) {
        return dateComparison;
      }
      return a.startTime.localeCompare(b.startTime);
    });

  const handleDelete = async (id: string, name: string) => {
    if (!onDelete) return;
    
    const result = await onDelete(id);
    if (result.success) {
      toast({
        title: "Berhasil dihapus",
        description: `Peminjaman atas nama ${name} berhasil dihapus`,
      });
    } else {
      toast({
        title: "Gagal menghapus",
        description: result.error || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || !selectedYear) return;

    const result = await onBulkDelete({ year: selectedYear, month: selectedMonth, quarter: selectedQuarter });
    if (result.success) {
      toast({
        title: "Berhasil dihapus",
        description: `Data peminjaman berhasil dihapus`,
      });
    } else {
      toast({
        title: "Gagal menghapus",
        description: result.error || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };
  
  const handleExport = () => {
    if (!onExport || !selectedYear) return;
    onExport({ year: selectedYear, month: selectedMonth, quarter: selectedQuarter });
    toast({
      title: "Berhasil diunduh",
      description: `Data peminjaman berhasil diunduh`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const getRoomColor = (room: string) => {
    if (room.includes('Aula Mini')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
    if (room.includes('Lantai 2')) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
    if (room.includes('Aula Bhakti')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
  };

  const isActiveBooking = (booking: BookingData) => {
    const now = new Date();
    const endDateTime = new Date(`${booking.date}T${booking.endTime}`);
    return endDateTime > now;
  };

  return (
    <Card className="shadow-government border-none">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2 text-primary">
              <Users size={20} />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>
              Total: {filteredBookings.length} peminjaman
            </CardDescription>
          </div>
          
          {userRole === 'admin' && (
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <Archive size={16} className="mr-2" />
                    Hapus Data Lama
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Arsipkan Data Peminjaman</AlertDialogTitle>
                    <AlertDialogDescription>
                      Pilih periode data yang ingin dihapus secara permanen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="year-select-delete" className="text-right">Tahun</Label>
                      <Select value={selectedYear?.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                          <SelectTrigger id="year-select-delete" className="col-span-3"><SelectValue placeholder="Pilih Tahun" /></SelectTrigger>
                          <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="month-select-delete" className="text-right">Bulan (Opsional)</Label>
                       <Select value={selectedMonth?.toString()} onValueChange={(v) => {setSelectedMonth(parseInt(v)); setSelectedQuarter(undefined);}}>
                          <SelectTrigger id="month-select-delete" className="col-span-3"><SelectValue placeholder="Pilih Bulan" /></SelectTrigger>
                          <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="quarter-select-delete" className="text-right">Triwulan (Opsional)</Label>
                      <Select value={selectedQuarter?.toString()} onValueChange={(v) => {setSelectedQuarter(parseInt(v)); setSelectedMonth(undefined);}}>
                          <SelectTrigger id="quarter-select-delete" className="col-span-3"><SelectValue placeholder="Pilih Triwulan" /></SelectTrigger>
                          <SelectContent>{quarters.map(q => <SelectItem key={q.value} value={q.value.toString()}>{q.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-primary-foreground">
                    <Download size={16} className="mr-2" />
                    Export Excel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Export Data ke Excel</AlertDialogTitle>
                    <AlertDialogDescription>
                      Pilih periode data yang ingin diunduh.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="year-select-export" className="text-right">Tahun</Label>
                        <Select value={selectedYear?.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                            <SelectTrigger id="year-select-export" className="col-span-3"><SelectValue placeholder="Pilih Tahun" /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="month-select-export" className="text-right">Bulan (Opsional)</Label>
                        <Select value={selectedMonth?.toString()} onValueChange={(v) => {setSelectedMonth(parseInt(v)); setSelectedQuarter(undefined);}}>
                            <SelectTrigger id="month-select-export" className="col-span-3"><SelectValue placeholder="Pilih Bulan" /></SelectTrigger>
                            <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quarter-select-export" className="text-right">Triwulan (Opsional)</Label>
                        <Select value={selectedQuarter?.toString()} onValueChange={(v) => {setSelectedQuarter(parseInt(v)); setSelectedMonth(undefined);}}>
                            <SelectTrigger id="quarter-select-export" className="col-span-3"><SelectValue placeholder="Pilih Triwulan" /></SelectTrigger>
                            <SelectContent>{quarters.map(q => <SelectItem key={q.value} value={q.value.toString()}>{q.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExport}>Export</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari peminjaman..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 focus:animate-input-glow"
            />
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
             Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Tidak ada data peminjaman</p>
            </div>
          ) : (
            filteredBookings.map((booking, index) => (
              <div 
                key={booking.id} 
                className={`p-4 border rounded-lg transition-all duration-300 animate-enter-from-bottom opacity-0 hover:shadow-lg hover:border-primary/50 hover:scale-[1.01] ${
                  isActiveBooking(booking) 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-card opacity-60'
                }`}
                 style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-foreground">{booking.name}</h3>
                      {isActiveBooking(booking) ? (
                        <Badge variant="secondary" className="bg-primary text-primary-foreground">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Selesai
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock size={16} />
                        <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin size={16} />
                        <Badge variant="secondary" className={getRoomColor(booking.room)}>
                          {booking.room}
                        </Badge>
                      </div>
                    </div>
                    
                    {booking.description && (
                      <p className="text-sm text-foreground/80 mt-2">
                        {booking.description}
                      </p>
                    )}
                  </div>
                  
                  {userRole === 'admin' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit?.(booking)}
                        className="hover:bg-accent"
                      >
                        <Edit size={16} className="mr-1" />
                        Edit
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 size={16} className="mr-1" />
                            Hapus
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Peminjaman</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus peminjaman atas nama <strong>{booking.name}</strong>?
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(booking.id, booking.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingList;
