"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Save, Loader2, Palette, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const PRESET_COLORS = [
  { name: "Merah (Bawaan)", hex: "#DC2626", gradientHex: "#F97316" },
  { name: "Biru", hex: "#2563EB", gradientHex: "#06B6D4" },
  { name: "Hijau", hex: "#16A34A", gradientHex: "#10B981" },
  { name: "Ungu", hex: "#9333EA", gradientHex: "#A855F7" },
  { name: "Oranye", hex: "#EA580C", gradientHex: "#F59E0B" },
  { name: "Pink", hex: "#DB2777", gradientHex: "#F43F5E" },
  { name: "Kuning", hex: "#EAB308", gradientHex: "#F97316" },
  { name: "Cyan", hex: "#0891B2", gradientHex: "#3B82F6" },
  { name: "Teal", hex: "#0D9488", gradientHex: "#34D399" },
  { name: "Indigo", hex: "#4F46E5", gradientHex: "#818CF8" },
  { name: "Violet", hex: "#7C3AED", gradientHex: "#A78BFA" },
  { name: "Rose", hex: "#E11D48", gradientHex: "#FB7185" },
  { name: "Emerald", hex: "#059669", gradientHex: "#34D399" },
  { name: "Fuchsia", hex: "#C026D3", gradientHex: "#E879F9" },
  { name: "Hitam Gelap", hex: "#18181B", gradientHex: "#3F3F46" },
  { name: "Emas", hex: "#D97706", gradientHex: "#FCD34D" },
];

export default function TemaPage() {
  const [themeColor, setThemeColor] = useState("#DC2626");
  const [themeGradient, setThemeGradient] = useState("#F97316");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('theme_color, theme_gradient')
        .eq('id', 'default')
        .single();
        
      if (data && !error) {
        if (data.theme_color) setThemeColor(data.theme_color);
        if (data.theme_gradient) setThemeGradient(data.theme_gradient);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('store_settings')
      .update({
        theme_color: themeColor,
        theme_gradient: themeGradient,
      })
      .eq('id', 'default');

    if (error) {
      toast.error(`Gagal menyimpan tema: ${error.message}`);
      console.error(error);
    } else {
      toast.success("Tema warna berhasil diperbarui! Silakan refresh halaman untuk melihat perubahan secara penuh.");
      document.documentElement.style.setProperty('--primary', themeColor);
      document.documentElement.style.setProperty('--primary-gradient', themeGradient);
      const darkEl = document.querySelector('.dark') as HTMLElement;
      if (darkEl) {
        darkEl.style.setProperty('--primary', themeColor);
        darkEl.style.setProperty('--primary-gradient', themeGradient);
      }
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
          <Palette className="h-6 w-6" /> Tema Warna
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Pilih warna utama untuk toko Anda. Warna ini akan diterapkan secara otomatis di panel admin maupun di halaman pembeli.
        </p>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm relative overflow-hidden">
        {loading && <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>}
        <form onSubmit={handleSave}>
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80">
            <CardTitle className="text-lg">Pilih Warna Utama</CardTitle>
            <CardDescription>
              Klik pada salah satu warna pilihan atau masukkan kode HEX kustom di bawah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Warna Pilihan</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {PRESET_COLORS.map((color) => {
                  const isActive = themeColor.toUpperCase() === color.hex.toUpperCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => {
                        setThemeColor(color.hex);
                        setThemeGradient(color.gradientHex);
                      }}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        isActive 
                          ? 'border-primary ring-1 ring-primary/20 bg-primary/5 dark:bg-primary/10' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                      }`}
                    >
                      <div 
                        className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center shrink-0 border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: color.hex }}
                      >
                        {isActive && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">{color.name}</span>
                        <span className="text-xs text-zinc-500 font-mono mt-0.5">{color.hex}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">Atau gunakan warna kustom</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="customColor" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Kode Warna Utama (HEX)</Label>
              <div className="flex gap-4 max-w-sm">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">#</div>
                  <Input 
                    id="customColor" 
                    value={themeColor.replace('#', '')} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                      setThemeColor(`#${val}`);
                    }} 
                    placeholder="DC2626" 
                    className="pl-7 font-mono uppercase" 
                  />
                </div>
                <input 
                  type="color" 
                  value={themeColor.length === 7 ? themeColor : '#cccccc'} 
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-10 h-10 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-sm shrink-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="gradientColor" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Kode Warna Gradasi (HEX)</Label>
              <div className="flex gap-4 max-w-sm">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">#</div>
                  <Input 
                    id="gradientColor" 
                    value={themeGradient.replace('#', '')} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                      setThemeGradient(`#${val}`);
                    }} 
                    placeholder="F97316" 
                    className="pl-7 font-mono uppercase" 
                  />
                </div>
                <input 
                  type="color" 
                  value={themeGradient.length === 7 ? themeGradient : '#cccccc'} 
                  onChange={(e) => setThemeGradient(e.target.value)}
                  className="w-10 h-10 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-sm shrink-0 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                Masukkan 6 digit kode hex kustom untuk warna utama dan gradasi. Hasilnya akan langsung terlihat saat disimpan.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500 font-medium">Pratinjau Elemen UI</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="space-y-4">
                  <Label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Tombol</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" className="text-white border-0 shadow-md h-9 px-4 text-sm" style={{ background: `linear-gradient(to right, ${themeColor}, ${themeGradient})` }}>Gradasi</Button>
                    <Button type="button" className="text-white border-0 shadow-sm h-9 px-4 text-sm" style={{ backgroundColor: themeColor }}>Solid</Button>
                    <Button type="button" variant="outline" className="h-9 px-4 text-sm bg-transparent" style={{ color: themeColor, borderColor: themeColor }}>Garis Tepi</Button>
                    <Button type="button" variant="ghost" className="h-9 px-4 text-sm hover:bg-transparent" style={{ color: themeColor }}>Teks Saja</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Label & Status</Label>
                  <div className="flex flex-wrap gap-3 items-center mt-1">
                    <div className="px-3 py-1 text-[11px] font-semibold rounded-full text-white shadow-sm" style={{ backgroundColor: themeColor }}>Pesanan Baru</div>
                    <div className="px-3 py-1 text-[11px] font-semibold rounded-full border" style={{ color: themeColor, borderColor: themeColor, backgroundColor: `${themeColor}15` }}>Diproses</div>
                    <div className="px-2 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider" style={{ color: themeColor, backgroundColor: `${themeColor}20` }}>Diskon</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Aksen & Ikon</Label>
                  <div className="flex gap-4 items-center">
                    <div className="p-3 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
                      <Palette className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-[10px] font-medium" style={{ color: themeColor }}>
                        <span>Kapasitas</span>
                        <span>70%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: '70%', background: `linear-gradient(to right, ${themeColor}, ${themeGradient})` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </CardContent>
          <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-6 pb-6 mt-4">
            <Button type="submit" disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto disabled:opacity-70 h-11 px-8 rounded-full shadow-md shadow-primary/20" style={{ backgroundColor: themeColor }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Tema
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
