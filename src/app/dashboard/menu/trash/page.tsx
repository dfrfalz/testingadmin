"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { Trash2, RotateCcw, ArrowLeft, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import type { MenuType } from "@/components/MenuModal";

export default function TrashPage() {
  const [menus, setMenus] = useState<MenuType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDeletedMenus = async () => {
    setLoading(true);
    // Cleanup first just in case
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('menus').delete().not('deleted_at', 'is', null).lt('deleted_at', threeDaysAgo);

    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
      
    if (!error && data) {
      setMenus(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeletedMenus();
  }, []);

  const handleRestore = async (id: number) => {
    setIsProcessing(true);
    const { error } = await supabase
      .from('menus')
      .update({ deleted_at: null })
      .eq('id', id);
      
    setIsProcessing(false);
    
    if (error) {
      toast.error("Gagal memulihkan menu");
    } else {
      toast.success("Menu berhasil dipulihkan");
      fetchDeletedMenus();
    }
  };

  const handleHardDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini secara permanen? Tindakan ini tidak dapat dibatalkan.")) return;
    
    setIsProcessing(true);
    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', id);
      
    setIsProcessing(false);
    
    if (error) {
      toast.error("Gagal menghapus menu secara permanen");
    } else {
      toast.success("Menu berhasil dihapus permanen");
      fetchDeletedMenus();
    }
  };

  const getDaysRemaining = (deletedAtStr: string) => {
    const deletedAt = new Date(deletedAtStr).getTime();
    const expiryDate = deletedAt + (3 * 24 * 60 * 60 * 1000);
    const now = Date.now();
    const diff = expiryDate - now;
    
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredMenus = menus.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Link href="/dashboard/menu" passHref>
              <Button variant="ghost" size="icon" className="-ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            Keranjang Sampah
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Menu di sini akan otomatis terhapus permanen setelah 3 hari.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex gap-3 text-amber-800 dark:text-amber-400 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>
          Fitur ini bergantung pada kolom <code>deleted_at</code> di database Anda. Menu yang Anda hapus sementara akan tersimpan di sini.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Cari menu terhapus..." 
            className="pl-9 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary mb-4"></div>
          Memuat keranjang sampah...
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <Trash2 className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400">Keranjang sampah kosong.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMenus.map((menu) => {
            const daysLeft = menu.deleted_at ? getDaysRemaining(menu.deleted_at) : 0;
            return (
              <Card key={menu.id} className="overflow-hidden group hover:shadow-md transition-shadow border-zinc-200 dark:border-zinc-800 flex flex-col opacity-75 hover:opacity-100">
                <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900">
                  {menu.image_url ? (
                    <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                    {daysLeft} hari lagi
                  </div>
                </div>
                
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base line-clamp-1 mb-1">{menu.name}</h3>
                    <div className="text-sm font-semibold text-primary">{formatIDR(menu.price)}</div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 h-8"
                      onClick={() => handleRestore(menu.id)}
                      disabled={isProcessing}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Pulihkan
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8"
                      onClick={() => handleHardDelete(menu.id)}
                      disabled={isProcessing}
                      title="Hapus Permanen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
