"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Save, Store, CreditCard, Bell, Shield } from "lucide-react";
import { toast } from "sonner";

export default function PengaturanPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pengaturan berhasil disimpan!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Pengaturan</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Kelola informasi toko, metode pembayaran, dan preferensi notifikasi.</p>
      </div>

      <Tabs defaultValue="toko" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 lg:grid-cols-4 mb-4">
          <TabsTrigger value="toko" className="gap-2"><Store className="h-4 w-4" /> Profil Toko</TabsTrigger>
          <TabsTrigger value="pembayaran" className="gap-2"><CreditCard className="h-4 w-4" /> Pembayaran</TabsTrigger>
          <TabsTrigger value="notifikasi" className="gap-2"><Bell className="h-4 w-4" /> Notifikasi</TabsTrigger>
          <TabsTrigger value="keamanan" className="gap-2"><Shield className="h-4 w-4" /> Keamanan</TabsTrigger>
        </TabsList>

        <TabsContent value="toko">
          <Card>
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
                  <Input id="storeName" defaultValue="Cumita - Cita Rasa Pedas yang Menggoda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Nomor WhatsApp Admin</Label>
                  <Input id="whatsapp" defaultValue="62881025610837" />
                  <p className="text-[10px] text-zinc-500">Gunakan format 628... tanpa tanda plus (+).</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Toko</Label>
                  <Textarea id="address" defaultValue="Jl. Sukabirus, Bojongsoang, Bandung" rows={3} />
                </div>
              </CardContent>
              <CardFooter className="border-t border-zinc-100 dark:border-zinc-800 pt-4 px-6 pb-6">
                <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto">
                  <Save className="h-4 w-4" /> Simpan Perubahan
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="pembayaran">
          <Card>
            <form onSubmit={handleSave}>
              <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
                <CardDescription>
                  Atur rekening bank atau e-wallet untuk menerima pembayaran dari pelanggan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Nama Bank / E-Wallet</Label>
                    <Input id="bankName" defaultValue="BCA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Nama Pemilik Rekening</Label>
                    <Input id="accountName" defaultValue="Daffa Rafi AL Faraz" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Nomor Rekening</Label>
                  <Input id="accountNumber" defaultValue="8735084321" />
                </div>
                
                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-medium text-sm mb-4">Opsi Pembayaran Lainnya (QRIS)</h4>
                  <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-xs text-zinc-500">QRIS Image</span>
                    </div>
                    <Button variant="outline" size="sm">Upload QRIS Baru</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-zinc-100 dark:border-zinc-800 pt-4 px-6 pb-6">
                <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto">
                  <Save className="h-4 w-4" /> Simpan Perubahan
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="notifikasi">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>
                Pilih notifikasi apa saja yang ingin Anda terima.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                <div>
                  <h4 className="font-medium text-sm">Pesanan Baru</h4>
                  <p className="text-xs text-zinc-500">Terima notifikasi suara saat ada pesanan baru masuk.</p>
                </div>
                <div className="h-6 w-11 bg-primary rounded-full relative cursor-pointer">
                  <div className="h-5 w-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                <div>
                  <h4 className="font-medium text-sm">Pesan Chat Baru</h4>
                  <p className="text-xs text-zinc-500">Terima notifikasi saat pelanggan mengirim pesan.</p>
                </div>
                <div className="h-6 w-11 bg-primary rounded-full relative cursor-pointer">
                  <div className="h-5 w-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keamanan">
          <Card>
            <CardHeader>
              <CardTitle>Keamanan Akun</CardTitle>
              <CardDescription>
                Ubah password akun admin Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Password Lama</Label>
                <Input id="oldPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </CardContent>
            <CardFooter className="border-t border-zinc-100 dark:border-zinc-800 pt-4 px-6 pb-6">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto">
                <Save className="h-4 w-4" /> Update Password
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
