"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Globe, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SeoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();
        
      if (data && !error) {
        setSeoTitle(data.seo_title || "");
        setSeoDescription(data.seo_description || "");
        setSeoKeywords(data.seo_keywords || "");
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
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords
      })
      .eq('id', 'default');

    if (error) {
      if (error.message.includes('does not exist')) {
        toast.error("Gagal! Anda belum menjalankan kode SQL untuk menambahkan kolom SEO di Supabase.");
      } else {
        toast.error("Gagal menyimpan: " + error.message);
      }
    } else {
      toast.success("Pengaturan SEO berhasil disimpan!");
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
    <div className="space-y-6 w-full max-w-none">
      <div className="mb-4">
        <Link href="/dashboard/edit-website" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Edit Website
        </Link>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Globe className="h-6 w-6" /> SEO & Pencarian
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Atur judul, deskripsi, dan kata kunci website untuk mesin pencari Google.
        </p>
      </div>

      <form onSubmit={handleSave} className="w-full max-w-none">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-lg font-bold">Metadata Website</CardTitle>
            <CardDescription>Informasi ini yang akan dibaca oleh mesin pencari seperti Google atau saat link website Anda dibagikan di WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            <div className="space-y-3">
              <Label htmlFor="seoTitle" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Judul Website (SEO Title)
              </Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Contoh: CUMITA - Cita Rasa Pedas yang Menggoda"
                className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Akan muncul sebagai teks biru besar di hasil pencarian Google dan tab browser. Disarankan 50-60 karakter.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="seoDescription" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Deskripsi Website (SEO Description)
              </Label>
              <Textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Contoh: Pesan berbagai macam olahan cumi premium dengan sambal khas rumahan yang super pedas. Pesan sekarang melalui Pre-Order (PO)."
                className="min-h-[100px] bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Akan muncul sebagai teks abu-abu di bawah judul di hasil pencarian Google. Disarankan maksimal 160 karakter.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="seoKeywords" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Kata Kunci (Keywords)
              </Label>
              <Input
                id="seoKeywords"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="Contoh: cumi pedas, sambal cumi, makanan pedas, cumi jakarta"
                className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pisahkan dengan koma (,). Meskipun peranannya kecil di Google saat ini, tapi membantu algoritma pencarian internal sistem.
              </p>
            </div>

            {/* Preview Google */}
            <div className="pt-4 mt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Pratinjau Hasil Pencarian Google:</h4>
              <div className="p-4 bg-white dark:bg-black rounded-lg border border-zinc-200 dark:border-zinc-800 max-w-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">C</div>
                  <div>
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-tight">CUMITA</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">https://cumita.vercel.app</p>
                  </div>
                </div>
                <h3 className="text-lg text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer break-words">
                  {seoTitle || "CUMITA - Cita Rasa Pedas yang Bikin Nagih"}
                </h3>
                <p className="text-sm text-[#4d5156] dark:text-[#bdc1c6] mt-1 break-words">
                  {seoDescription || "CUMITA menyediakan berbagai olahan cumi premium dengan sambal khas rumahan yang pedas dan lezat. Pesan sekarang melalui Pre-Order (PO)."}
                </p>
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 p-4 flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[120px] font-semibold">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan SEO"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
