"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowLeft, CreditCard, Upload, X } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type PaymentMethodType = 'bank' | 'ewallet' | 'qris';

type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  bankName: string;
  accountName: string;
  accountNumber: string;
  qrCodeUrl?: string;
};

export default function PembayaranPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({ type: 'bank' });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_settings')
      .select('payment_methods')
      .eq('id', 'default')
      .single();

    if (error) {
      toast.error("Gagal memuat metode pembayaran.");
    } else if (data) {
      setMethods(data.payment_methods || []);
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error("File harus berupa gambar");
        return;
      }
      setQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeQrImage = () => {
    setQrFile(null);
    setQrPreview(null);
    setFormData(prev => ({ ...prev, qrCodeUrl: undefined }));
  };

  const handleSaveList = async (newMethods: PaymentMethod[]) => {
    const { error } = await supabase
      .from('store_settings')
      .update({ payment_methods: newMethods })
      .eq('id', 'default');
      
    if (error) {
      toast.error("Gagal menyimpan perubahan.");
      return false;
    }
    return true;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName || !formData.accountName || !formData.accountNumber) {
      toast.error("Harap lengkapi semua bidang.");
      return;
    }

    setSaving(true);
    let uploadedUrl = formData.qrCodeUrl;

    if (qrFile) {
      setUploading(true);
      const fileExt = qrFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `payment_qrs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menus') // using existing menus bucket
        .upload(filePath, qrFile);

      setUploading(false);

      if (uploadError) {
        toast.error("Gagal mengunggah QR Code: " + uploadError.message);
        setSaving(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(filePath);
      uploadedUrl = publicUrl;
    }

    const newMethod: PaymentMethod = {
      id: crypto.randomUUID(),
      type: formData.type as PaymentMethodType,
      bankName: formData.bankName,
      accountName: formData.accountName,
      accountNumber: formData.accountNumber,
      qrCodeUrl: uploadedUrl,
    };

    const updatedMethods = [...methods, newMethod];
    
    if (await handleSaveList(updatedMethods)) {
      setMethods(updatedMethods);
      toast.success("Metode pembayaran berhasil ditambahkan!");
      setIsModalOpen(false);
      resetForm();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus metode pembayaran ini?")) return;
    
    const updated = methods.filter(m => m.id !== id);
    if (await handleSaveList(updated)) {
      setMethods(updated);
      toast.success("Metode pembayaran dihapus");
    }
  };

  const resetForm = () => {
    setFormData({ type: 'bank' });
    setQrFile(null);
    setQrPreview(null);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-none">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/edit-website" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Metode Pembayaran</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-8">
            Kelola daftar rekening, e-wallet, dan QRIS yang akan digunakan pelanggan untuk transfer pembayaran manual.
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if(!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Tambahkan Metode Pembayaran
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleAddSubmit}>
              <DialogHeader>
                <DialogTitle>Tambah Pembayaran</DialogTitle>
                <DialogDescription>
                  Masukkan detail rekening bank atau dompet digital Anda.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Jenis Pembayaran</Label>
                  <Select value={formData.type} onValueChange={(val: any) => setFormData(p => ({ ...p, type: val }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md">
                      <SelectItem value="bank">Transfer Bank</SelectItem>
                      <SelectItem value="ewallet">E-Wallet (DANA, OVO, dll)</SelectItem>
                      <SelectItem value="qris">Scan QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{formData.type === 'bank' ? 'Nama Bank' : formData.type === 'ewallet' ? 'Nama E-Wallet' : 'Nama QRIS'}</Label>
                  <Input 
                    required 
                    value={formData.bankName || ''} 
                    onChange={e => setFormData(p => ({ ...p, bankName: e.target.value }))}
                    placeholder="Contoh: BCA"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{formData.type === 'ewallet' ? 'Nomor HP' : 'Nomor Rekening / ID'}</Label>
                  <Input 
                    required 
                    type="number"
                    value={formData.accountNumber || ''} 
                    onChange={e => setFormData(p => ({ ...p, accountNumber: e.target.value }))}
                    placeholder={formData.type === 'ewallet' ? 'Contoh: 08123456789' : 'Contoh: 8735084321'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Atas Nama Pemilik Rekening</Label>
                  <Input 
                    required 
                    value={formData.accountName || ''} 
                    onChange={e => setFormData(p => ({ ...p, accountName: e.target.value }))}
                    placeholder="Contoh: Daffa Rafi"
                  />
                </div>

                {(formData.type === 'qris' || formData.type === 'ewallet') && (
                  <div className="space-y-2 pt-2">
                    <Label>Gambar QR Code</Label>
                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                      {qrPreview ? (
                        <div className="relative">
                          <img src={qrPreview} alt="Preview QR" className="w-32 h-32 object-contain bg-white p-2 rounded" />
                          <button
                            type="button"
                            onClick={removeQrImage}
                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-sm hover:bg-red-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                            <Upload className="h-5 w-5 text-zinc-400" />
                          </div>
                          <p className="text-sm font-medium mb-1">Unggah kode QR</p>
                          <p className="text-xs text-zinc-500 mb-4">PNG, JPG up to 5MB</p>
                          <Label htmlFor="qr-upload" className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
                            Pilih File
                            <input id="qr-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                          </Label>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={saving || uploading}>
                  {(saving || uploading) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {methods.map((method) => (
          <Card key={method.id} className="overflow-hidden relative group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">
                    {method.type}
                  </span>
                  <button 
                    onClick={() => handleDelete(method.id)}
                    className="text-red-500 bg-red-500/10 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 mb-1">{method.bankName}</h3>
              <p className="text-2xl font-mono text-primary mb-2 tracking-wide">{method.accountNumber}</p>
              <p className="text-sm text-zinc-500 uppercase tracking-wide">A.N. {method.accountName}</p>
              
              {method.qrCodeUrl && (
                <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Terlampir Kode QR</p>
                  <img src={method.qrCodeUrl} alt="QR Code" className="w-16 h-16 object-contain bg-white p-1 border rounded" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {methods.length === 0 && (
          <div className="col-span-full border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-10 min-h-[50vh] text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-sm mb-4 border border-zinc-200 dark:border-zinc-800">
              <CreditCard className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">Belum Ada Pembayaran</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm">Anda belum menambahkan rekening bank atau e-wallet. Tambahkan sekarang agar pelanggan bisa melakukan pembayaran.</p>
            <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Tambah Rekening</Button>
          </div>
        )}
      </div>
    </div>
  );
}
