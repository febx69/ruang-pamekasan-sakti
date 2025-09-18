import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Clock, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface BookingData {
  id: string;
  date: string;
  name: string;
  room: string;
  startTime: string;
  endTime: string;
  description: string;
  createdAt: string;
}

interface BookingFormProps {
  onSubmit: (booking: Omit<BookingData, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
}

const rooms = [
  "Lantai 1 - Aula Mini",
  "Lantai 2", 
  "Lantai 3 - Aula Bhakti Husada"
];

const BookingForm = ({ onSubmit }: BookingFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    room: "",
    startTime: "",
    endTime: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.date || !formData.name || !formData.room || !formData.startTime || !formData.endTime) {
      toast({
        title: "Form tidak lengkap",
        description: "Mohon isi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast({
        title: "Waktu tidak valid", 
        description: "Waktu mulai harus lebih awal dari waktu selesai",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    const result = await onSubmit(formData);
    
    if (result.success) {
      // Reset form
      setFormData({
        date: "",
        name: "",
        room: "",
        startTime: "",
        endTime: "",
        description: ""
      });

      toast({
        title: "Berhasil",
        description: "Peminjaman ruangan berhasil ditambahkan",
      });
    } else {
      toast({
        title: "Gagal menambah peminjaman",
        description: result.error || "Terjadi kesalahan yang tidak diketahui",
        variant: "destructive"
      });
    }
    
    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="shadow-government">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-government-green">
          <Plus size={20} />
          <span>Tambah Peminjaman Ruangan</span>
        </CardTitle>
        <CardDescription>
          Isi formulir di bawah untuk menambahkan peminjaman ruangan baru
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-1">
                <CalendarIcon size={16} />
                <span>Tanggal</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="focus:ring-government-green"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Peminjam</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Masukkan nama peminjam"
                required
                className="focus:ring-government-green"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Ruangan</Label>
            <Select value={formData.room} onValueChange={(value) => handleInputChange("room", value)}>
              <SelectTrigger className="focus:ring-government-green">
                <SelectValue placeholder="Pilih ruangan" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room} value={room}>
                    {room}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center space-x-1">
                <Clock size={16} />
                <span>Waktu Mulai</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                required
                className="focus:ring-government-green"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center space-x-1">
                <Clock size={16} />
                <span>Waktu Selesai</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                required
                className="focus:ring-government-green"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Keterangan</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Keterangan tambahan (opsional)"
              rows={3}
              className="focus:ring-government-green resize-none"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-government-green hover:bg-government-green-dark transition-all duration-200"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Memproses...</span>
              </div>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Tambah Peminjaman
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;