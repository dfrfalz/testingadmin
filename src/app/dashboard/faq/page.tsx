"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2, HelpCircle, ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type FAQ = {
  q: string;
  a: string;
};

const DEFAULT_FAQS: FAQ[] = [
  {
    q: "Apakah produk CUMITA ready stock?",
    a: "Tidak, kami menggunakan sistem Pre-Order (PO) untuk menjaga kualitas dan kesegaran produk. Cumi baru dimasak setelah PO ditutup."
  },
  {
    q: "Berapa lama masa simpan produk?",
    a: "Karena tanpa bahan pengawet, CUMITA tahan 3-4 hari di suhu ruang, 1 minggu di kulkas (chiller), dan hingga 1 bulan di dalam freezer."
  },
  {
    q: "Apakah bisa kirim ke luar kota?",
    a: "Tentu bisa! Kami menggunakan kemasan vacuum seal yang aman untuk pengiriman ke seluruh Indonesia."
  },
  {
    q: "Bagaimana metode pembayarannya?",
    a: "Kami menerima pembayaran via Transfer Bank, Virtual Account, QRIS, dan berbagai E-Wallet (GoPay, OVO, Dana, dll)."
  }
];

export default function FAQPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();
        
      if (data && !error) {
        if (data.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) {
          setFaqs(data.faqs);
        } else {
          setFaqs(DEFAULT_FAQS);
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Filter out empty FAQs
    const validFaqs = faqs.filter(faq => faq.q.trim() !== "" && faq.a.trim() !== "");

    const { error } = await supabase
      .from('store_settings')
      .update({ faqs: validFaqs })
      .eq('id', 'default');

    if (error) {
      if (error.message.includes('does not exist')) {
        toast.error("Gagal! Anda belum menjalankan kode SQL untuk menambahkan kolom faqs di Supabase.");
      } else {
        toast.error("Gagal menyimpan: " + error.message);
      }
    } else {
      toast.success("Daftar FAQ berhasil disimpan!");
      if (validFaqs.length !== faqs.length) {
        setFaqs(validFaqs);
      }
    }
    
    setSaving(false);
  };

  const addFaq = () => {
    setFaqs([...faqs, { q: "", a: "" }]);
  };

  const removeFaq = (index: number) => {
    const newFaqs = [...faqs];
    newFaqs.splice(index, 1);
    setFaqs(newFaqs);
  };

  const updateFaq = (index: number, field: 'q' | 'a', value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <HelpCircle className="h-6 w-6" /> FAQ (Tanya Jawab)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Atur daftar pertanyaan dan jawaban yang sering ditanyakan oleh pelanggan Anda.
          </p>
        </div>
        <Button onClick={addFaq} variant="outline" className="bg-white dark:bg-zinc-900">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pertanyaan
        </Button>
      </div>

      <form onSubmit={handleSave} className="w-full pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative group transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
            
            <CardHeader className="py-3 px-5 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-base">
                  {index + 1}
                </div>
                <CardTitle className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Pertanyaan #{index + 1}
                </CardTitle>
              </div>
              
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => removeFaq(index)}
                className="text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 w-8 -mr-2"
                title="Hapus FAQ"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Pertanyaan
                </Label>
                <Input
                  value={faq.q}
                  onChange={(e) => updateFaq(index, 'q', e.target.value)}
                  placeholder="Contoh: Apakah produk ini pedas?"
                  className="font-medium bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Jawaban
                </Label>
                <Textarea
                  value={faq.a}
                  onChange={(e) => updateFaq(index, 'a', e.target.value)}
                  placeholder="Contoh: Ya, produk kami memiliki tingkat kepedasan yang bisa disesuaikan."
                  className="min-h-[80px] bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                  required
                />
              </div>
            </CardContent>
          </Card>
        ))}
        </div>

        {faqs.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
            <HelpCircle className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Belum ada pertanyaan FAQ.</p>
            <Button type="button" onClick={addFaq} variant="link" className="text-primary mt-2">
              Tambah FAQ Pertama Anda
            </Button>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 md:left-[280px] p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex justify-end z-50">
          <div className="w-full max-w-none mx-auto flex justify-end pr-4 md:pr-8">
            <Button type="submit" disabled={saving} size="lg" className="min-w-[150px] font-bold shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
