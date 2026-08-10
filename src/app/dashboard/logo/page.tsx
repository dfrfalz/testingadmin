"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Save, Loader2, Image as ImageIcon, Upload, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function LogoPage() {
  const [logoLightUrl, setLogoLightUrl] = useState("/logo_cumita.png");
  const [logoDarkUrl, setLogoDarkUrl] = useState("/logo_tema_gelap.png");
  const [logoTagline, setLogoTagline] = useState("CITA RASA PEDAS PREMIUM");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLight, setUploadingLight] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('logo_light_url, logo_dark_url, logo_tagline')
        .eq('id', 'default')
        .single();
        
      if (data && !error) {
        if (data.logo_light_url) setLogoLightUrl(data.logo_light_url);
        if (data.logo_dark_url) setLogoDarkUrl(data.logo_dark_url);
        if (data.logo_tagline) setLogoTagline(data.logo_tagline);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isLight: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isLight) setUploadingLight(true);
    else setUploadingDark(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${isLight ? 'light' : 'dark'}_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menus')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menus')
        .getPublicUrl(filePath);

      if (isLight) {
        setLogoLightUrl(publicUrl);
      } else {
        setLogoDarkUrl(publicUrl);
      }
      toast.success("Gambar berhasil diunggah! Jangan lupa klik Simpan Logo.");
    } catch (error: any) {
      toast.error(`Gagal mengunggah: ${error.message}`);
    } finally {
      if (isLight) setUploadingLight(false);
      else setUploadingDark(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('store_settings')
      .update({
        logo_light_url: logoLightUrl || "/logo_cumita.png",
        logo_dark_url: logoDarkUrl || "/logo_tema_gelap.png",
        logo_tagline: logoTagline,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');

    if (error) {
      toast.error(`Gagal menyimpan logo: ${error.message}`);
      console.error(error);
    } else {
      toast.success("Logo berhasil diperbarui! Perubahan akan segera terlihat di semua tempat.");
      // Fire a custom event to notify layout/components to refetch or update logo
      window.dispatchEvent(new CustomEvent('logo-updated', { 
        detail: { logoLightUrl, logoDarkUrl } 
      }));
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 w-full max-w-none">
      <div className="mb-4">
        <Link href="/dashboard/edit-website" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Edit Website
        </Link>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <ImageIcon className="h-6 w-6" /> Pengaturan Logo
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Ubah logo toko Anda. Pastikan menyertakan dua versi untuk memastikan logo tetap terlihat jelas di mode Terang dan Gelap.
        </p>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm relative overflow-hidden">
        {loading && <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>}
        <form onSubmit={handleSave}>
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80">
            <CardTitle className="text-lg">Unggah Logo Baru</CardTitle>
            <CardDescription>
              Pilih gambar langsung dari perangkat Anda. Gunakan format PNG dengan latar transparan agar hasilnya maksimal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Logo (Mode Terang)</Label>
                  <div className="relative">
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)} 
                      disabled={uploadingLight}
                      className="cursor-pointer file:text-primary file:font-medium file:bg-primary/10 file:border-0 file:rounded-md file:px-3 file:mr-3 h-11 pt-2.5" 
                    />
                    {uploadingLight && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Ini akan digunakan saat latar belakang web berwarna putih/terang. Sebaiknya teks pada logo berwarna hitam atau gelap.
                  </p>
                </div>
                <div className="mt-4 p-8 rounded-xl border border-zinc-200 bg-white flex items-center justify-center relative group flex-1 min-h-[300px]">
                  <img src={logoLightUrl || "/logo_cumita.png"} alt="Preview Light" className="max-h-full max-w-full object-contain drop-shadow-sm" onError={(e) => { e.currentTarget.src = "/logo_cumita.png"; }} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Logo (Mode Gelap)</Label>
                  <div className="relative">
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)} 
                      disabled={uploadingDark}
                      className="cursor-pointer file:text-primary file:font-medium file:bg-primary/10 file:border-0 file:rounded-md file:px-3 file:mr-3 h-11 pt-2.5" 
                    />
                    {uploadingDark && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Ini akan digunakan saat latar belakang web berwarna gelap. Sebaiknya teks pada logo berwarna putih atau terang.
                  </p>
                </div>
                <div className="mt-4 p-8 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center relative group flex-1 min-h-[300px]">
                  <img src={logoDarkUrl || "/logo_tema_gelap.png"} alt="Preview Dark" className="max-h-full max-w-full object-contain drop-shadow-sm" onError={(e) => { e.currentTarget.src = "/logo_tema_gelap.png"; }} />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="space-y-3 max-w-xl">
                <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Teks Slogan (Tagline)</Label>
                <Input 
                  value={logoTagline} 
                  onChange={(e) => setLogoTagline(e.target.value)} 
                  placeholder="CITA RASA PEDAS PREMIUM" 
                  className="h-11"
                />
                <p className="text-[11px] text-zinc-500">
                  Teks ini akan muncul di bawah logo pada layar loading (SplashScreen). Warnanya akan otomatis mengikuti warna Tema Utama Anda.
                </p>
              </div>
            </div>

          </CardContent>
          <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-6 pb-6 mt-auto">
            <Button type="submit" disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto disabled:opacity-70 h-11 px-8 rounded-full shadow-md shadow-primary/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Logo
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
