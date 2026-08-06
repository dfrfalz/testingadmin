"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Megaphone, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AnnouncementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();
        
      if (data && !error) {
        setText(data.announcement_text || "");
        setIsActive(data.announcement_is_active || false);
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
        announcement_text: text,
        announcement_is_active: isActive
      })
      .eq('id', 'default');

    if (error) {
      if (error.message.includes('does not exist')) {
        toast.error("Gagal! Anda belum menjalankan kode SQL untuk menambahkan kolom pengumuman di Supabase.");
      } else {
        toast.error("Gagal menyimpan: " + error.message);
      }
    } else {
      toast.success("Teks Pengumuman berhasil disimpan!");
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      <div className="mb-4">
        <Link href="/dashboard/edit-website" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Edit Website
        </Link>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Megaphone className="h-6 w-6" /> Teks Pengumuman
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Atur teks berjalan (promo/info) di bagian paling atas website.
        </p>
      </div>

      <form onSubmit={handleSave} className="w-full max-w-none">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Pengaturan Marquee
            </CardTitle>
            <CardDescription>Informasi penting ini akan terus berjalan di atas Navbar Anda agar pembeli tidak melewatkannya.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <div className="space-y-0.5">
                <Label htmlFor="active-status" className="text-base font-semibold">Tampilkan Pengumuman</Label>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Nyalakan sakelar ini untuk menampilkan teks berjalan di website utama.</p>
              </div>
              <Switch 
                id="active-status" 
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="announcementText" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Isi Teks Pengumuman <span className="text-red-500">*</span>
              </Label>
              <Input
                id="announcementText"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Contoh: 🎉 Promo Diskon 20% khusus Pre-Order hari ini! Buruan sebelum kehabisan."
                className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary h-11"
                required
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                Gunakan emoji agar lebih menarik perhatian pembeli.
              </p>
            </div>

            {/* Preview */}
            <div className="pt-4 mt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Pratinjau:</h4>
              <div className="w-full bg-primary text-primary-foreground py-2 overflow-hidden whitespace-nowrap rounded-md relative shadow-sm">
                <div className="animate-marquee inline-block text-sm font-medium px-4">
                  {text || "Ketik teks pengumuman Anda di atas..."} <span className="mx-8 opacity-50">•</span>
                  {text || "Ketik teks pengumuman Anda di atas..."} <span className="mx-8 opacity-50">•</span>
                  {text || "Ketik teks pengumuman Anda di atas..."} <span className="mx-8 opacity-50">•</span>
                  {text || "Ketik teks pengumuman Anda di atas..."} <span className="mx-8 opacity-50">•</span>
                  {text || "Ketik teks pengumuman Anda di atas..."}
                </div>
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 p-4 flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[120px] font-semibold">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan Teks"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
