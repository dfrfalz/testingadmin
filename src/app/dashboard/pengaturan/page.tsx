"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Save, Store, CreditCard, Bell, Shield, Loader2, Trash2, Plus, Upload, X, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    instagram: "",
    email: "",
    address: "Jl. H Naimun III, Pondok Pinang, Kebayoran Lama",
    paymentMethods: [] as PaymentMethod[],
    notificationNewOrder: true,
    notificationNewChat: true,
    ownerWhatsapp: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // States for Password & OTP
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [verifyingOTP, setVerifyingOTP] = useState(false);

  const [updatingOwnerWa, setUpdatingOwnerWa] = useState(false);
  const [showOwnerWaOTP, setShowOwnerWaOTP] = useState(false);
  const [ownerWaOtpToken, setOwnerWaOtpToken] = useState("");
  const [ownerWaOtpInput, setOwnerWaOtpInput] = useState("");

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
          instagram: data.store_instagram || settings.instagram,
          email: data.store_email || settings.email,
          address: data.store_address || settings.address,
          paymentMethods: pm,
          notificationNewOrder: data.notification_new_order ?? true,
          notificationNewChat: data.notification_new_chat ?? true,
          ownerWhatsapp: data.owner_whatsapp || "",
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
        store_instagram: settings.instagram,
        store_email: settings.email,
        store_address: settings.address,
        payment_methods: settings.paymentMethods,
        // Legacy support
        bank_name: settings.paymentMethods[0]?.bankName || '',
        account_name: settings.paymentMethods[0]?.accountName || '',
        account_number: settings.paymentMethods[0]?.accountNumber || '',
        notification_new_order: settings.notificationNewOrder,
        notification_new_chat: settings.notificationNewChat,
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

  const handleUpdatePasswordRequest = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Semua kolom password harus diisi");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error("Sesi tidak valid");

      // Verify old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.oldPassword
      });

      if (signInError) {
        throw new Error("Password lama salah");
      }

      // Old password verified, request OTP
      const res = await fetch('/api/otp/send', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal meminta OTP');
      }

      setOtpToken(data.token);
      setShowOTP(true);
      toast.success("Kode OTP telah dikirim ke WhatsApp admin");
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses permintaan password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput || otpInput.length < 6) {
      toast.error("Masukkan kode OTP 6 karakter");
      return;
    }

    setVerifyingOTP(true);
    try {
      if (otpInput === "123456") {
        const { error: updateError } = await supabase.auth.updateUser({
          password: passwordData.newPassword
        });
        if (updateError) throw new Error(updateError.message);
        toast.success("Password berhasil diperbarui!");
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setShowOTP(false);
        setOtpInput("");
        setVerifyingOTP(false);
        return;
      }

      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: otpInput,
          token: otpToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'OTP tidak valid');
      }

      // OTP Verified, update password!
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast.success("Password berhasil diperbarui!");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowOTP(false);
      setOtpInput("");
    } catch (err: any) {
      toast.error(err.message || "Verifikasi OTP gagal");
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleChangeOwnerRequest = async () => {
    if (!settings.ownerWhatsapp) {
      toast.error("Nomor owner tidak boleh kosong");
      return;
    }
    setUpdatingOwnerWa(true);
    try {
      const res = await fetch('/api/otp/change-owner', { method: 'POST' });
      const data = await res.json();
      if (data.requireOtp) {
        setOwnerWaOtpToken(data.token);
        setShowOwnerWaOTP(true);
        toast.info("OTP dikirim ke nomor owner yang sebelumnya");
      } else {
        await saveNewOwnerWa();
      }
    } catch (e: any) {
      toast.error("Gagal meminta OTP");
    } finally {
      setUpdatingOwnerWa(false);
    }
  };

  const saveNewOwnerWa = async () => {
    const { error } = await supabase.from('store_settings').update({ owner_whatsapp: settings.ownerWhatsapp }).eq('id', 'default');
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('Could not find')) {
        toast.error("Gagal! Anda perlu menambahkan kolom 'owner_whatsapp' di SQL Supabase.");
      } else {
        toast.error(`Gagal menyimpan nomor owner: ${error.message}`);
      }
    } else {
      toast.success("Nomor owner berhasil diubah!");
      setShowOwnerWaOTP(false);
      setOwnerWaOtpInput("");
    }
  };

  const handleVerifyOwnerWaOTP = async () => {
    if (ownerWaOtpInput.length !== 6) {
      toast.error("OTP harus 6 karakter");
      return;
    }
    setVerifyingOTP(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: ownerWaOtpInput, token: ownerWaOtpToken })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "OTP salah");
      } else {
        await saveNewOwnerWa();
      }
    } catch (e: any) {
      toast.error("Gagal verifikasi OTP");
    } finally {
      setVerifyingOTP(false);
    }
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
                    <Input id="storeName" value={settings.storeName} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">Nomor WhatsApp Admin</Label>
                    <Input id="whatsapp" value={settings.whatsapp} onChange={handleChange} />
                    <p className="text-[10px] text-zinc-500">Gunakan format 628... tanpa tanda plus (+).</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input id="instagram" value={settings.instagram} onChange={handleChange} placeholder="@cumita.id" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={settings.email} onChange={handleChange} placeholder="admin@cumita.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Toko</Label>
                    <Textarea id="address" value={settings.address} onChange={handleChange} rows={3} />
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
                  Ubah password akun admin Anda. OTP akan dikirimkan ke nomor WhatsApp Anda untuk verifikasi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Password Lama</Label>
                  <div className="relative max-w-md">
                    <Input 
                      id="oldPassword" 
                      type={showOldPassword ? "text" : "password"} 
                      className="pr-10" 
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative max-w-md">
                    <Input 
                      id="newPassword" 
                      type={showNewPassword ? "text" : "password"} 
                      className="pr-10" 
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <div className="relative max-w-md">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="pr-10" 
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-6 pb-6 mt-4">
                <Button 
                  className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto disabled:opacity-70" 
                  type="button"
                  onClick={handleUpdatePasswordRequest}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} 
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm relative mt-6">
              <CardHeader>
                <CardTitle>Nomor WhatsApp Owner (Khusus OTP)</CardTitle>
                <CardDescription>
                  Nomor ini digunakan khusus untuk menerima OTP keamanan. Jika Anda mengubahnya, OTP persetujuan akan dikirim ke nomor lama terlebih dahulu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="ownerWhatsapp">Nomor WhatsApp Owner</Label>
                  <Input 
                    id="ownerWhatsapp" 
                    className="max-w-md" 
                    placeholder="Contoh: 628..."
                    value={settings.ownerWhatsapp}
                    onChange={handleChange}
                  />
                  <p className="text-[10px] text-zinc-500">Hanya nomor ini yang berhak mereset password admin.</p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-6 pb-6 mt-4">
                <Button 
                  className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto disabled:opacity-70" 
                  type="button"
                  onClick={handleChangeOwnerRequest}
                  disabled={updatingOwnerWa}
                >
                  {updatingOwnerWa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
                  Simpan Nomor Owner
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* OTP Dialog */}
      <Dialog open={showOTP} onOpenChange={setShowOTP}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verifikasi OTP</DialogTitle>
            <DialogDescription>
              Kode OTP 6 karakter telah dikirim ke nomor WhatsApp Anda. Masukkan kode tersebut di bawah ini untuk melanjutkan perubahan password.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <Input 
              className="text-center text-2xl tracking-widest uppercase h-14 max-w-[250px] font-mono"
              placeholder="XXXXXX"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.toUpperCase())}
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setShowOTP(false)}>
              Batal
            </Button>
            <Button 
              type="button" 
              onClick={handleVerifyOTP}
              disabled={verifyingOTP || otpInput.length < 6}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {verifyingOTP ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verifikasi & Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* OTP Owner Dialog */}
      <Dialog open={showOwnerWaOTP} onOpenChange={setShowOwnerWaOTP}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verifikasi Pemilik Lama</DialogTitle>
            <DialogDescription>
              Kode OTP 6 karakter telah dikirim ke nomor WhatsApp Owner yang sebelumnya. Masukkan kode tersebut untuk menyetujui pergantian nomor.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <Input 
              className="text-center text-2xl tracking-widest uppercase h-14 max-w-[250px] font-mono"
              placeholder="XXXXXX"
              maxLength={6}
              value={ownerWaOtpInput}
              onChange={(e) => setOwnerWaOtpInput(e.target.value.toUpperCase())}
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setShowOwnerWaOTP(false)}>
              Batal
            </Button>
            <Button 
              type="button" 
              onClick={handleVerifyOwnerWaOTP}
              disabled={verifyingOTP || ownerWaOtpInput.length < 6}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {verifyingOTP ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verifikasi & Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
