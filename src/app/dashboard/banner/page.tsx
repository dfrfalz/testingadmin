"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, ImageIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BannerModal, BannerData } from "@/components/BannerModal";

export default function BannerPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerData | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      toast.error("Gagal mengambil data banner");
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleEdit = (banner: BannerData) => {
    setSelectedBanner(banner);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedBanner(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) return;

    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      toast.success("Banner berhasil dihapus");
      fetchBanners();
    } catch (error: any) {
      toast.error("Gagal menghapus banner: " + error.message);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === banners.length - 1) return;

    const newBanners = [...banners];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newBanners[index];
    newBanners[index] = newBanners[swapIndex];
    newBanners[swapIndex] = temp;

    setBanners(newBanners);

    try {
      // Update in background
      await Promise.all([
        supabase.from('banners').update({ order_index: swapIndex }).eq('id', newBanners[swapIndex].id),
        supabase.from('banners').update({ order_index: index }).eq('id', newBanners[index].id)
      ]);
    } catch (error) {
      toast.error("Gagal mengubah urutan");
      fetchBanners(); // revert
    }
  };

  const toggleActive = async (banner: BannerData) => {
    try {
      const newStatus = !banner.is_active;
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: newStatus } : b));
      
      const { error } = await supabase
        .from('banners')
        .update({ is_active: newStatus })
        .eq('id', banner.id);
        
      if (error) throw error;
      toast.success(`Banner ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
      toast.error("Gagal mengubah status banner");
      fetchBanners(); // revert
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/dashboard/edit-website" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Edit Website
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Manajemen Banner</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Atur gambar carousel yang tampil di halaman depan website pembeli.</p>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Banner</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
              <ImageIcon className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Belum ada banner</h3>
              <p className="text-sm text-zinc-500 mt-1 mb-4">Tambahkan banner untuk memunculkan carousel di halaman depan.</p>
              <Button onClick={handleAdd} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Tambah Sekarang
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner, index) => (
                <div 
                  key={banner.id} 
                  className={`flex flex-col sm:flex-row gap-4 p-4 border rounded-xl items-center transition-all ${
                    banner.is_active 
                      ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950' 
                      : 'border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50 opacity-75'
                  }`}
                >
                  <div className="w-full sm:w-48 aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-100 dark:border-zinc-800 relative">
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                    {!banner.is_active && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge variant="secondary" className="bg-white/90 text-black border-none">Nonaktif</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate">{banner.title}</h3>
                      {banner.is_active && <Badge className="bg-emerald-500 hover:bg-emerald-600">Aktif</Badge>}
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm truncate">{banner.subtitle}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                        Tombol: <strong className="text-zinc-700 dark:text-zinc-300">{banner.link_text || '-'}</strong>
                      </span>
                      <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                        Link: <strong className="text-zinc-700 dark:text-zinc-300">{banner.link_url || '-'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0 justify-between sm:justify-end">
                    <div className="flex flex-col gap-1 mr-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === banners.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant={banner.is_active ? "outline" : "default"} 
                        size="sm"
                        onClick={() => toggleActive(banner)}
                      >
                        {banner.is_active ? 'Matikan' : 'Aktifkan'}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(banner)}>
                        <Edit2 className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(banner.id!)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBanners}
        initialData={selectedBanner}
      />
    </div>
  );
}
