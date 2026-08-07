"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Plus, Trash2, MessageSquareQuote, User, Star, Calendar } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

type Testimonial = {
  id: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
};

const PremiumStar = ({ filled, className }: { filled: boolean, className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    stroke={filled ? "none" : "currentColor"}
    strokeWidth={filled ? 0 : 1.5}
    fill={filled ? "url(#starGradient)" : "none"}
  >
    {filled && (
      <defs>
        <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    )}
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
    />
  </svg>
);

export default function TestimoniPage() {
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data && !error) {
      setTestimonials(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const confirmDelete = async () => {
    if (!deleteId) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error("Gagal menghapus testimoni.");
    } else {
      toast.success("Testimoni berhasil dihapus.");
      setTestimonials(testimonials.filter(t => t.id !== deleteId));
      setDeleteId(null);
    }
    setIsSubmitting(false);
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) return toast.error("Semua kolom harus diisi!");
    
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('testimonials')
      .insert({ name: formName, rating: formRating, text: formText })
      .select('*')
      .single();

    if (error) {
      toast.error("Gagal menambahkan testimoni: " + error.message);
    } else if (data) {
      toast.success("Testimoni manual berhasil ditambahkan!");
      setTestimonials([data, ...testimonials]);
      setShowAddForm(false);
      setFormName("");
      setFormRating(5);
      setFormText("");
    }
    setIsSubmitting(false);
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <MessageSquareQuote className="h-6 w-6" /> Testimoni Pelanggan
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola ulasan dari pelanggan yang tampil di halaman depan website Anda.
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="font-bold shadow-md shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Tambah Testimoni Manual
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 mb-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle>Tambah Testimoni Manual</CardTitle>
            <CardDescription>
              Gunakan ini untuk memasukkan ulasan bagus yang Anda terima lewat WhatsApp atau Instagram agar tampil di website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddManual} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nama Pelanggan</Label>
                  <Input 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)} 
                    placeholder="Contoh: Siska Dewi" 
                    className="bg-zinc-50 dark:bg-zinc-950"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Rating Bintang</Label>
                  <div className="flex gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 w-fit">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        className="focus:outline-none transform hover:scale-110 transition-transform"
                      >
                        <PremiumStar 
                          filled={star <= formRating} 
                          className={`h-7 w-7 ${star <= formRating ? "drop-shadow-md text-amber-500" : "text-zinc-300 dark:text-zinc-700"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pesan Ulasan</Label>
                <Textarea 
                  value={formText}
                  onChange={e => setFormText(e.target.value)}
                  className="min-h-[100px] bg-zinc-50 dark:bg-zinc-950"
                  placeholder="Ketik ulasan pelanggan di sini..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Simpan Testimoni
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {testimonials.map((testi) => (
          <Card key={testi.id} className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative group transition-all hover:border-zinc-300 dark:hover:border-zinc-700 flex flex-col">
            <CardContent className="p-6 flex flex-col h-full relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <PremiumStar 
                      key={j} 
                      filled={j < testi.rating} 
                      className={`h-5 w-5 ${j < testi.rating ? "" : "text-zinc-200 dark:text-zinc-800"}`} 
                    />
                  ))}
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDeleteId(testi.id)}
                  className="text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus Testimoni"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-zinc-700 dark:text-zinc-300 italic mb-6 leading-relaxed flex-grow text-sm">
                &ldquo;{testi.text}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{testi.name}</h5>
                    <div className="flex items-center text-[10px] text-zinc-500 mt-0.5">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(parseISO(testi.created_at), "d MMM yyyy", { locale: localeId })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {testimonials.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <MessageSquareQuote className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Belum ada testimoni pelanggan.</p>
          <Button onClick={() => setShowAddForm(true)} variant="link" className="text-primary mt-2">
            Tambah Testimoni Pertama
          </Button>
        </div>
      )}

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Testimoni</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus ulasan ini? Tindakan ini tidak dapat dibatalkan dan testimoni akan hilang dari halaman depan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setDeleteId(null)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="button" onClick={confirmDelete} disabled={isSubmitting} className="bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 font-medium">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Hapus Testimoni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
