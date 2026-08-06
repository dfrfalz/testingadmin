"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Save, Loader2, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
    </div>
  )
});

export default function MapsPage() {
  const [mapsInput, setMapsInput] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [currentLat, setCurrentLat] = useState(-6.200000);
  const [currentLng, setCurrentLng] = useState(106.816666);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const extractMapUrl = (input: string) => {
    const text = input.trim();
    if (!text) return "";

    if (text.toLowerCase().includes('<iframe') && text.includes('src="')) {
      const match = text.match(/src="([^"]+)"/);
      if (match && match[1]) return match[1];
    }
    
    if (text.includes('google.com/maps/embed') || text.includes('output=embed')) {
      return text;
    }

    return `https://maps.google.com/maps?q=${encodeURIComponent(text)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const extractLatLng = (url: string) => {
    if (!url) return false;
    const match = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match && match[1] && match[2]) {
      setCurrentLat(parseFloat(match[1]));
      setCurrentLng(parseFloat(match[2]));
      return true;
    }
    return false;
  };

  const fetchCoordinatesFromText = async (text: string) => {
    if (!text) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setCurrentLat(parseFloat(data[0].lat));
        setCurrentLng(parseFloat(data[0].lon));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('maps_link')
        .eq('id', 'default')
        .single();
        
      if (data && !error && data.maps_link) {
        setMapsInput(data.maps_link);
        const link = extractMapUrl(data.maps_link);
        setMapsLink(link);
        extractLatLng(link);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
       if (mapsInput && !loading) {
          const extracted = extractMapUrl(mapsInput);
          const hasCoords = extractLatLng(extracted);
          
          if (!hasCoords) {
             let queryToSearch = mapsInput;
             
             if (mapsInput.includes('q=')) {
               const match = mapsInput.match(/q=([^&]+)/);
               if (match && match[1]) {
                 queryToSearch = decodeURIComponent(match[1]);
               }
             }
             
             if (!queryToSearch.includes('<iframe') && !queryToSearch.includes('output=embed')) {
                fetchCoordinatesFromText(queryToSearch);
             }
          }
       }
    }, 1000);
    return () => clearTimeout(timer);
  }, [mapsInput, loading]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    const newMapsLink = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    setMapsLink(newMapsLink);
    setMapsInput(newMapsLink);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMapsInput(val);
    const extracted = extractMapUrl(val);
    setMapsLink(extracted);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const finalUrl = extractMapUrl(mapsInput);

    const { error } = await supabase
      .from('store_settings')
      .update({
        maps_link: finalUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');

    if (error) {
      toast.error(`Gagal menyimpan peta: ${error.message}`);
      console.error(error);
    } else {
      toast.success("Titik lokasi peta berhasil diperbarui! Perubahan akan langsung tampil di website.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 w-full max-w-none">
      <div className="mb-2">
        <Link href="/dashboard/edit-website" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Edit Website
        </Link>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <MapPin className="h-6 w-6" /> Pengaturan Maps Interaktif
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Atur lokasi persis toko Anda yang akan ditampilkan di bagian Footer website pembeli.
        </p>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm relative overflow-hidden">
        {loading && <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>}
        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80">
          <CardTitle className="text-lg">Ketik Alamat atau Paste Link</CardTitle>
          <CardDescription>
            Masukkan teks alamat, *link* Google Maps biasa, atau *link iframe*. Titik peta di bawah akan langsung menyesuaikan secara otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Textarea 
            id="mapsInput" 
            value={mapsInput} 
            onChange={handleInputChange} 
            placeholder='Contoh: Jl. Sudirman No. 1, Jakarta Pusat...' 
            className="min-h-[100px] text-sm"
          />
        </CardContent>
      </Card>

      <div className="w-full">
        <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm overflow-hidden flex flex-col h-full">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80">
            <CardTitle className="text-lg">Pratinjau & Pilih Lokasi (Google Maps)</CardTitle>
            <CardDescription>
              Tampilan peta yang akan disematkan di website CUMITA. Anda juga bisa menggeser Pin merah secara langsung.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {!loading && (
              <div className="w-full h-[400px] rounded-xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800">
                <MapPicker 
                  initialLat={currentLat} 
                  initialLng={currentLng} 
                  onLocationSelect={handleLocationSelect} 
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 flex justify-between items-center">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              Koordinat: {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
            </div>
            <Button type="submit" disabled={saving || !mapsLink} className="gap-2 bg-primary hover:bg-primary/90 text-white h-10 px-6 rounded-full shadow-md shadow-primary/20 w-full sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Perubahan
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
