import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin, Search, Trash2, Edit, Users, Download, Archive } from "lucide-react";
import { BookingData } from "./BookingForm";
import { useToast } from "@/hooks/use-toast";

interface BookingListProps {
  bookings: BookingData[];
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onEdit?: (booking: BookingData) => void;
  onBulkDelete?: (period: 'month' | 'quarter' | 'year') => Promise<{ success: boolean; error?: string }>;
  onExport?: (period: 'month' | 'quarter' | 'year') => void;
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

  const handleBulkDelete = async (period: 'month' | 'quarter' | 'year') => {
    if (!onBulkDelete) return;
    
    const result = await onBulkDelete(period);
    if (result.success) {
      const periodText = period === 'month' ? 'bulan' : period === 'quarter' ? 'triwulan' : 'tahun';
      toast({
        title: "Berhasil dihapus",
        description: `Data peminjaman periode ${periodText} berhasil dihapus`,
      });
    } else {
      toast({
        title: "Gagal menghapus",
        description: result.error || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleExport = (period: 'month' | 'quarter' | 'year') => {
    onExport?.(period);
    const periodText = period === 'month' ? 'bulan' : period === 'quarter' ? 'triwulan' : 'tahun';
    toast({
      title: "Berhasil diunduh",
      description: `Data peminjaman periode ${periodText} berhasil diunduh`,
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
                      Ini akan menghapus data peminjaman yang sudah lewat. Pilih periode data yang ingin dihapus secara permanen:
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="destructive" 
                      onClick={() => handleBulkDelete('month')}
                      className="justify-start"
                    >
                      Hapus Data Lebih dari 1 Bulan
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleBulkDelete('quarter')}
                      className="justify-start"
                    >
                      Hapus Data Lebih dari 3 Bulan
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleBulkDelete('year')}
                      className="justify-start"
                    >
                      Hapus Data Lebih dari 1 Tahun
                    </Button>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
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
                      Pilih periode data yang ingin diunduh:
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleExport('month')}
                      className="justify-start"
                    >
                      Export Data 1 Bulan Terakhir
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleExport('quarter')}
                      className="justify-start"
                    >
                      Export Data 3 Bulan Terakhir
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleExport('year')}
                      className="justify-start"
                    >
                      Export Data 1 Tahun Terakhir
                    </Button>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
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
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
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
