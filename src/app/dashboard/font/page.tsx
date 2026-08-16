"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Save, Loader2, Type, ArrowLeft } from "lucide-react";
import { 
  Poppins, Playfair_Display, Inter, Outfit, Plus_Jakarta_Sans, Roboto, Montserrat, Nunito, Lora,
  Merriweather, Lato, Open_Sans, Raleway, Cormorant_Garamond, Bebas_Neue, Pacifico, Space_Grotesk 
} from "next/font/google";
import { toast } from "sonner";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["300", "400", "700", "900"] });
const lato = Lato({ subsets: ["latin"], weight: ["300", "400", "700", "900"] });
const openSans = Open_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: ["400"] });
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

const fontOptions = [
  { id: "poppins", name: "Poppins", description: "Modern, bulat, dan ramah (Default CUMITA)", className: poppins.className },
  { id: "inter", name: "Inter", description: "Sangat bersih, profesional, dan mudah dibaca", className: inter.className },
  { id: "outfit", name: "Outfit", description: "Geometris, trendi, dan elegan", className: outfit.className },
  { id: "jakarta", name: "Plus Jakarta Sans", description: "Berani, khas, dan kontemporer", className: jakarta.className },
  { id: "roboto", name: "Roboto", description: "Klasik, netral, dan fungsional", className: roboto.className },
  { id: "montserrat", name: "Montserrat", description: "Geometris, luas, dan terlihat sangat premium", className: montserrat.className },
  { id: "nunito", name: "Nunito", description: "Membulat, ramah, dan sangat nyaman dibaca", className: nunito.className },
  { id: "lora", name: "Lora", description: "Serif elegan dengan lengkungan yang artistik", className: lora.className },
  { id: "playfair", name: "Playfair Display", description: "Klasik dengan sentuhan serif yang mewah", className: playfair.className },
  { id: "merriweather", name: "Merriweather", description: "Klasik, formal, dan sangat mudah dibaca", className: merriweather.className },
  { id: "lato", name: "Lato", description: "Profesional, hangat, dan sangat seimbang", className: lato.className },
  { id: "opensans", name: "Open Sans", description: "Netral, bersih, dan sangat optimal untuk layar", className: openSans.className },
  { id: "raleway", name: "Raleway", description: "Elegan, tipis, dan sangat modern", className: raleway.className },
  { id: "cormorant", name: "Cormorant Garamond", description: "Klasik premium dengan detail yang sangat indah", className: cormorant.className },
  { id: "bebas", name: "Bebas Neue", description: "Unik! Tebal, rapat, dan sangat mencolok (All Caps)", className: bebas.className },
  { id: "pacifico", name: "Pacifico", description: "Unik! Gaya tulisan tangan sambung yang santai", className: pacifico.className },
  { id: "spacegrotesk", name: "Space Grotesk", description: "Unik! Futuristik dan sedikit bernuansa teknologi", className: spaceGrotesk.className },
];

export default function FontPage() {
  const [themeFont, setThemeFont] = useState("poppins");
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
        
      if (data && !error && data.theme_font) {
        setThemeFont(data.theme_font);
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
      .update({ theme_font: themeFont })
      .eq('id', 'default');

    if (error) {
      if (error.message.includes('does not exist')) {
        toast.error("Gagal! Anda belum menjalankan kode SQL untuk menambahkan kolom theme_font di Supabase.");
      } else {
        toast.error("Gagal menyimpan: " + error.message);
      }
    } else {
      toast.success("Tipografi (Font) berhasil disimpan!");
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
            <Type className="h-6 w-6" /> Tipografi (Font)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Pilih gaya huruf yang paling cocok dengan karakter dan identitas bisnis Anda.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 w-full max-w-none">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-lg font-bold">Keluarga Font (Font Family)</CardTitle>
            <CardDescription>Perubahan ini akan diterapkan ke seluruh teks di website pembeli.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fontOptions.map((font) => {
                const isSelected = themeFont === font.id;
                return (
                  <div 
                    key={font.id}
                    onClick={() => setThemeFont(font.id)}
                    className={`flex flex-col gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-lg text-zinc-900 dark:text-white">
                        {font.name}
                      </span>
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected 
                          ? 'border-primary bg-primary' 
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}>
                        <div className={`h-2 w-2 rounded-full bg-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                    </div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 leading-snug">
                      {font.description}
                    </span>
                    
                    {/* Preview Text */}
                    <div className="mt-3 p-3 bg-zinc-100 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800/50">
                      <p className={`text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-semibold uppercase tracking-wider ${font.className}`}>Pratinjau</p>
                      <p className={`text-sm text-zinc-800 dark:text-zinc-200 ${font.className}`}>
                        Cita Rasa Pedas yang Menggoda.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 p-4 flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[120px] font-semibold">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan Font"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
