"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Save, Store, CreditCard, Bell, Shield, Loader2, Trash2, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PaymentMethod = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  qrCodeUrl?: string;
};

const BANK_OPTIONS = ["DANA", "BCA", "BNI", "BRI", "Mandiri", "BSI", "GoPay", "OVO", "ShopeePay", "LinkAja"];

export default function PengaturanPage() {
  const [settings, setSettings] = useState({
    storeName: "Cumita - Cita Rasa Pedas yang Menggoda",
    whatsapp: "62881025610837",
    address: "Jl. H Naimun III, Pondok Pinang, Kebayoran Lama",
    paymentMethods: [] as PaymentMethod[],
    notificationNewOrder: true,
    notificationNewChat: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();
        
      if (data && !error) {
        let pm = data.payment_methods || [];
        if (pm.length === 0 && data.bank_name) {
          // Backward compatibility
          pm = [{
            id: 'legacy',
            bankName: data.bank_name,
            accountName: data.account_name,
            accountNumber: data.account_number
          }];
        }

        setSettings({
          storeName: data.store_name || settings.storeName,
          whatsapp: data.store_whatsapp || settings.whatsapp,
          address: data.store_address || settings.address,
          paymentMethods: pm,
          notificationNewOrder: data.notification_new_order ?? true,
          notificationNewChat: data.notification_new_chat ?? true,
        });
      }
      setLoading(false);
    };
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const toggleNotification = (key: 'notificationNewOrder' | 'notificationNewChat') => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePaymentMethodChange = (index: number, field: keyof PaymentMethod, value: string) => {
    setSettings(prev => {
      const newMethods = [...prev.paymentMethods];
      
      if (field === 'accountNumber') {
        const bank = newMethods[index].bankName;
        const onlyNums = value.replace(/\D/g, ''); // Remove non-digits
        if (bank === 'DANA' || bank === 'GoPay' || bank === 'OVO' || bank === 'ShopeePay' || bank === 'LinkAja') {
          newMethods[index][field] = onlyNums.slice(0, 15); // E-wallet numbers usually max 13-15 digits
        } else {
          newMethods[index][field] = onlyNums.slice(0, 20); // Reasonable max length for bank accounts
        }
      } else {
        newMethods[index][field] = value;
      }
      
      // If bank name changes, we re-run validation on the account number in case it violates the new bank's rules
      if (field === 'bankName') {
        const currentAccNum = newMethods[index].accountNumber;
        if (value === 'DANA' && currentAccNum.length > 13) {
          newMethods[index].accountNumber = currentAccNum.slice(0, 13);
        }
        // Jika bukan DANA atau e-wallet, mungkin kita ingin mereset qrCodeUrl?
        // Untuk sekarang biarkan saja
      }

      return { ...prev, paymentMethods: newMethods };
    });
  };

  const handleUploadQR = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `qr-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `qrcodes/${fileName}`; // Uploading to 'menus' bucket but inside 'qrcodes' folder

    setUploadingIndex(index);
    try {
      const { error: uploadError } = await supabase.storage
        .from('menus')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('menus').getPublicUrl(filePath);
      
      setSettings(prev => {
        const newMethods = [...prev.paymentMethods];
        newMethods[index].qrCodeUrl = data.publicUrl;
        return { ...prev, paymentMethods: newMethods };
      });
      
      toast.success("QR Code berhasil diunggah");
    } catch (error: any) {
      toast.error("Gagal mengunggah gambar: " + error.message);
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeQR = (index: number) => {
    setSettings(prev => {
      const newMethods = [...prev.paymentMethods];
      delete newMethods[index].qrCodeUrl;
      return { ...prev, paymentMethods: newMethods };
    });
  };

  const addPaymentMethod = () => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: [
        ...prev.paymentMethods,
        { id: Math.random().toString(36).substr(2, 9), bankName: '', accountName: '', accountNumber: '' }
      ]
    }));
  };

  const removePaymentMethod = (index: number) => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Validasi payment methods
    const incompletePM = settings.paymentMethods.some(pm => !pm.bankName || !pm.accountName || !pm.accountNumber);
    if (incompletePM) {
      toast.error("Mohon lengkapi semua data metode pembayaran.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('store_settings')
      .update({
        store_name: settings.storeName,
        store_whatsapp: settings.whatsapp,
        store_address: settings.address,
        payment_methods: settings.paymentMethods,
        // Legacy support
        bank_name: settings.paymentMethods[0]?.bankName || '',
        account_name: settings.paymentMethods[0]?.accountName || '',
        account_number: settings.paymentMethods[0]?.accountNumber || '',
        notification_new_order: settings.notificationNewOrder,
        notification_new_chat: settings.notificationNewChat,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');

    if (error) {
      toast.error(`Gagal menyimpan pengaturan: ${error.message}`);
      console.error(error);
    } else {
      toast.success("Pengaturan berhasil disimpan!");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Pengaturan</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Kelola informasi toko, metode pembayaran, dan preferensi notifikasi.</p>
      </div>

      <Tabs defaultValue="toko" orientation="vertical" className="flex flex-col md:flex-row gap-6 w-full">
        <TabsList className="w-full md:w-64 bg-transparent p-0 gap-1">
          <TabsTrigger value="toko" className="w-full justify-start gap-3 px-4 py-3 data-active:bg-zinc-100 dark:data-active:bg-zinc-800/50 data-active:shadow-none rounded-lg font-medium data-active:text-primary">
            <Store className="h-4 w-4" /> Profil Toko
          </TabsTrigger>
          <TabsTrigger value="pembayaran" className="w-full justify-start gap-3 px-4 py-3 data-active:bg-zinc-100 dark:data-active:bg-zinc-800/50 data-active:shadow-none rounded-lg font-medium data-active:text-primary">
            <CreditCard className="h-4 w-4" /> Pembayaran
          </TabsTrigger>
          <TabsTrigger value="notifikasi" className="w-full justify-start gap-3 px-4 py-3 data-active:bg-zinc-100 dark:data-active:bg-zinc-800/50 data-active:shadow-none rounded-lg font-medium data-active:text-primary">
            <Bell className="h-4 w-4" /> Notifikasi
          </TabsTrigger>
          <TabsTrigger value="keamanan" className="w-full justify-start gap-3 px-4 py-3 data-active:bg-zinc-100 dark:data-active:bg-zinc-800/50 data-active:shadow-none rounded-lg font-medium data-active:text-primary">
            <Shield className="h-4 w-4" /> Keamanan
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0 w-full">
          <TabsContent value="toko" className="mt-0">
            <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm relative">
              {loading && <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>}
              <form onSubmit={handleSave}>
                <CardHeader>
                  <CardTitle>Profil Toko</CardTitle>
                  <CardDescription>
                    Informasi ini akan ditampilkan kepada pelanggan di halaman checkout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nama Toko</Label>
                    <Input id="storeName" value={settings.storeName} onChange={handleChange} className="max-w-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">Nomor WhatsApp Admin</Label>
                    <Input id="whatsapp" value={settings.whatsapp} onChange={handleChange} className="max-w-xl" />
                    <p className="text-[10px] text-zinc-500">Gunakan format 628... tanpa tanda plus (+).</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Toko</Label>
                    <Textarea id="address" value={settings.address} onChange={handleChange} rows={3} className="max-w-xl" />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-6 pb-6 mt-4">
                  <Button type="submit" disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto disabled:opacity-70">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Perubahan
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="pembayaran" className="mt-0">
            <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm relative">
              {loading && <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>}
              <form onSubmit={handleSave}>
                <CardHeader>
                  <CardTitle>Metode Pembayaran</CardTitle>
                  <CardDescription>
                    Atur rekening bank atau e-wallet untuk menerima pembayaran dari pelanggan. Anda dapat menambahkan foto QR Code khusus untuk E-Wallet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="space-y-4">
                    {settings.paymentMethods.map((pm, index) => (
                      <div key={pm.id} className="group flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                        {/* Header Item */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                              <CreditCard className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">Metode {index + 1}</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePaymentMethod(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Hapus
                          </Button>
                        </div>
                        
                        {/* Body Item */}
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-zinc-500">Bank / E-Wallet</Label>
                            <Select
                              value={pm.bankName}
                              onValueChange={(val) => handlePaymentMethodChange(index, 'bankName', val || '')}
                            >
                              <SelectTrigger className="w-full bg-transparent shadow-none border-zinc-200 dark:border-zinc-800">
                                <SelectValue placeholder="Pilih..." />
                              </SelectTrigger>
                              <SelectContent>
                                {BANK_OPTIONS.map(bank => (
                                  <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-zinc-500">Nama Pemilik Rekening</Label>
                            <Input 
                              value={pm.accountName} 
                              onChange={(e) => handlePaymentMethodChange(index, 'accountName', e.target.value)} 
                              placeholder="Cth: John Doe"
                              className="bg-transparent shadow-none border-zinc-200 dark:border-zinc-800"
                            />
                          </div>
                          
                          <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs font-medium text-zinc-500">Nomor Rekening / Telepon</Label>
                            <Input 
                              value={pm.accountNumber} 
                              onChange={(e) => handlePaymentMethodChange(index, 'accountNumber', e.target.value)} 
                              placeholder={['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja'].includes(pm.bankName) ? "Cth: 08123456789" : "Masukkan deretan angka rekening"}
                              className="bg-transparent shadow-none border-zinc-200 dark:border-zinc-800 font-mono text-sm"
                              maxLength={['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja'].includes(pm.bankName) ? 15 : 20}
                            />
                            {['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja'].includes(pm.bankName) ? (
                              <p className="text-[10px] text-zinc-400 mt-1">Hanya angka (Maks 15 digit).</p>
                            ) : (
                              <p className="text-[10px] text-zinc-400 mt-1">Hanya angka (Maks 20 digit).</p>
                            )}
                          </div>

                          {/* Opsi Upload QR Code Khusus DANA / E-Wallet (Tampil jika sudah pilih Bank/E-Wallet) */}
                          {pm.bankName && (
                            <div className="md:col-span-2 pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800/80 border-dashed">
                              <Label className="text-xs font-medium text-zinc-500 mb-2 block">Foto QR Code (Opsional)</Label>
                              {pm.qrCodeUrl ? (
                                <div className="flex items-start gap-4 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                                  <img src={pm.qrCodeUrl} alt="QR Code" className="w-16 h-16 object-contain rounded-md bg-white border border-zinc-100" />
                                  <div className="flex-1 space-y-1">
                                    <p className="text-xs font-medium">QR Code Aktif</p>
                                    <p className="text-[10px] text-zinc-500">Akan ditampilkan ke pelanggan saat checkout.</p>
                                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-red-500" onClick={() => removeQR(index)}>
                                      <X className="w-3 h-3 mr-1" /> Hapus QR
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <Input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" 
                                    onChange={(e) => handleUploadQR(index, e)}
                                    disabled={uploadingIndex === index}
                                  />
                                  <div className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 hover:text-primary hover:border-primary transition-colors cursor-pointer text-sm">
                                    {uploadingIndex === index ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Upload className="w-4 h-4" />
                                    )}
                                    <span>{uploadingIndex === index ? 'Mengunggah...' : 'Klik untuk unggah foto QR Code (Opsional)'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>

                  {settings.paymentMethods.length === 0 && (
                    <div className="text-center p-6 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 text-sm">
                      Belum ada metode pembayaran. Silakan tambahkan.
                    </div>
                  )}

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-dashed" 
                    onClick={addPaymentMethod}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Tambah Metode Pembayaran
                  </Button>
                  
                </CardContent>
                <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-6 pb-6 mt-4">
                  <Button type="submit" disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto disabled:opacity-70">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Perubahan
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="notifikasi" className="mt-0">
            <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm relative">
              {loading && <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>}
              <CardHeader>
                <CardTitle>Pengaturan Notifikasi</CardTitle>
                <CardDescription>
                  Pilih notifikasi apa saja yang ingin Anda terima.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-2xl">
                <div onClick={() => { toggleNotification('notificationNewOrder'); handleSave({ preventDefault: () => {} } as React.FormEvent); }} className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800/80 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <div>
                    <h4 className="font-medium text-sm">Pesanan Baru</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Terima notifikasi suara saat ada pesanan baru masuk.</p>
                  </div>
                  <div className={`h-6 w-11 rounded-full relative flex-shrink-0 transition-colors ${settings.notificationNewOrder ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                    <div className={`h-5 w-5 bg-white rounded-full absolute top-0.5 shadow transition-transform ${settings.notificationNewOrder ? 'right-0.5 translate-x-0' : 'left-0.5 translate-x-0'}`}></div>
                  </div>
                </div>
                <div onClick={() => { toggleNotification('notificationNewChat'); handleSave({ preventDefault: () => {} } as React.FormEvent); }} className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800/80 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <div>
                    <h4 className="font-medium text-sm">Pesan Chat Baru</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Terima notifikasi saat pelanggan mengirim pesan.</p>
                  </div>
                  <div className={`h-6 w-11 rounded-full relative flex-shrink-0 transition-colors ${settings.notificationNewChat ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                    <div className={`h-5 w-5 bg-white rounded-full absolute top-0.5 shadow transition-transform ${settings.notificationNewChat ? 'right-0.5 translate-x-0' : 'left-0.5 translate-x-0'}`}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keamanan" className="mt-0">
            <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm relative">
              <CardHeader>
                <CardTitle>Keamanan Akun</CardTitle>
                <CardDescription>
                  Ubah password akun admin Anda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Password Lama</Label>
                  <Input id="oldPassword" type="password" className="max-w-md" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input id="newPassword" type="password" className="max-w-md" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <Input id="confirmPassword" type="password" className="max-w-md" />
                </div>
              </CardContent>
              <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-6 pb-6 mt-4">
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto" type="button">
                  <Save className="h-4 w-4" /> Update Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
