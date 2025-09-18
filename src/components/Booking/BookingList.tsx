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
  onDelete?: (id: string) => void;
  onEdit?: (booking: BookingData) => void;
  onBulkDelete?: (period: 'month' | 'quarter' | 'year') => void;
  onExport?: (period: 'month' | 'quarter' | 'year') => void;
  userRole: 'admin' | 'user';
  title: string;
}

const BookingList = ({ 
  bookings, 
  onDelete, 
  onEdit, 
  onBulkDelete, 
  onExport, 
  userRole, 
  title 
}: BookingListProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof BookingData>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredBookings = bookings
    .filter(booking => 
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.date.includes(searchTerm)
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aVal < bVal ? -direction : aVal > bVal ? direction : 0;
    });

  const handleSort = (field: keyof BookingData) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = (id: string, name: string) => {
    onDelete?.(id);
    toast({
      title: "Berhasil dihapus",
      description: `Peminjaman atas nama ${name} berhasil dihapus`,
    });
  };

  const handleBulkDelete = (period: 'month' | 'quarter' | 'year') => {
    onBulkDelete?.(period);
    const periodText = period === 'month' ? 'bulan' : period === 'quarter' ? 'triwulan' : 'tahun';
    toast({
      title: "Berhasil dihapus",
      description: `Data peminjaman periode ${periodText} berhasil dihapus`,
    });
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
    return timeString;
  };

  const getRoomColor = (room: string) => {
    if (room.includes('Aula Mini')) return 'bg-blue-100 text-blue-800';
    if (room.includes('Lantai 2')) return 'bg-green-100 text-green-800';
    if (room.includes('Aula Bhakti')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const isActiveBooking = (booking: BookingData) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  };

  return (
    <Card className="shadow-government">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2 text-government-green">
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
                    Hapus Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Data Peminjaman</AlertDialogTitle>
                    <AlertDialogDescription>
                      Pilih periode data yang ingin dihapus:
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="destructive" 
                      onClick={() => handleBulkDelete('month')}
                      className="justify-start"
                    >
                      Hapus Data Bulanan
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleBulkDelete('quarter')}
                      className="justify-start"
                    >
                      Hapus Data Triwulanan
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleBulkDelete('year')}
                      className="justify-start"
                    >
                      Hapus Data Tahunan
                    </Button>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-government-green border-government-green hover:bg-government-green hover:text-white">
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
                      Export Data Bulanan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleExport('quarter')}
                      className="justify-start"
                    >
                      Export Data Triwulanan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleExport('year')}
                      className="justify-start"
                    >
                      Export Data Tahunan
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
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Tidak ada data peminjaman</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div 
                key={booking.id} 
                className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                  isActiveBooking(booking) ? 'bg-government-green/5 border-government-green/30' : 'bg-card'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{booking.name}</h3>
                      {isActiveBooking(booking) && (
                        <Badge variant="secondary" className="bg-government-green text-white">
                          Aktif
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
                      <p className="text-sm text-muted-foreground mt-2">
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
                        className="hover:bg-government-green hover:text-white"
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