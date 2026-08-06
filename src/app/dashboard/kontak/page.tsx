"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Save, Loader2, Share2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function KontakPage() {
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [schedule, setSchedule] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();
        
      if (data && !error) {
        if (data.store_whatsapp) setWhatsapp(data.store_whatsapp);
        if (data.store_address) setAddress(data.store_address);
        if (data.operational_schedule) setSchedule(data.operational_schedule);
        // Membaca kolom baru jika sudah ada
        if (data.store_instagram) setInstagram(data.store_instagram);
        if (data.store_email) setEmail(data.store_email);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Coba simpan semuanya
    const updates: any = {
      store_whatsapp: whatsapp,
      store_address: address,
      operational_schedule: schedule,
      store_instagram: instagram,
      store_email: email
    };

    const { error } = await supabase
      .from('store_settings')
      .update(updates)
      .eq('id', 'default');

    if (error) {
      if (error.message.includes('does not exist')) {
        toast.error("Gagal! Anda belum menjalankan kode SQL untuk menambahkan kolom Instagram & Email di Supabase.");
      } else {
        toast.error("Gagal menyimpan: " + error.message);
      }
    } else {
      toast.success("Pengaturan Kontak & Sosial Media berhasil disimpan!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/edit-website">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Share2 className="h-6 w-6" /> Sosial Media & Kontak
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Ubah nomor WhatsApp, Instagram, Email, alamat, dan jam operasional toko Anda.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 w-full max-w-none">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-lg font-bold">Informasi Kontak</CardTitle>
            <CardDescription>Nomor dan tautan yang bisa dihubungi oleh pelanggan.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-zinc-700 dark:text-zinc-300">Nomor WhatsApp</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">+62</span>
                  <Input 
                    id="whatsapp" 
                    value={whatsapp.replace(/^62/, '')} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setWhatsapp(val ? `62${val}` : '');
                    }} 
                    placeholder="81234567890" 
                    className="pl-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
                  />
                </div>
                <p className="text-xs text-zinc-500">Gunakan format tanpa angka 0 di depan (contoh: 812...)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Alamat Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="cs@cumita.com" 
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="instagram" className="text-zinc-700 dark:text-zinc-300">Tautan Instagram</Label>
                <Input 
                  id="instagram" 
                  value={instagram} 
                  onChange={(e) => setInstagram(e.target.value)} 
                  placeholder="https://instagram.com/cumita" 
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
                />
              </div>
            </div>

          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-lg font-bold">Lokasi & Jam Operasional</CardTitle>
            <CardDescription>Alamat toko dan jadwal buka/tutup pesanan.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-zinc-700 dark:text-zinc-300">Alamat Toko</Label>
              <Textarea 
                id="address" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="Masukkan alamat lengkap toko" 
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 min-h-[80px]" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule" className="text-zinc-700 dark:text-zinc-300">Jam Operasional</Label>
              <Textarea 
                id="schedule" 
                value={schedule} 
                onChange={(e) => setSchedule(e.target.value)} 
                placeholder="Senin - Jumat: 09:00 - 17:00" 
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 min-h-[100px]" 
              />
            </div>

          </CardContent>
          <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 p-4 flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[120px] font-semibold">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan Kontak"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
