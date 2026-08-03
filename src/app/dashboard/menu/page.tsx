"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { Plus, Edit2, Trash2, Archive, Flame, Search } from "lucide-react";
import MenuModal, { MenuType } from "@/components/MenuModal";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MenuPage() {
  const [menus, setMenus] = useState<MenuType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuType | null>(null);
  
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("Semua");

  const fetchMenus = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .order('id', { ascending: true });
      
    if (!error && data) {
      setMenus(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMenus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:menus')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menus' }, () => {
        fetchMenus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleEdit = (menu: MenuType) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedMenu(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini?")) return;
    
    const { error } = await supabase.from('menus').delete().eq('id', id);
    if (error) {
      toast.error("Gagal menghapus menu");
    } else {
      toast.success("Menu berhasil dihapus");
    }
  };

  const handleToggleStatus = async (menu: MenuType) => {
    const newStatus = menu.status === 'aktif' ? 'arsip' : 'aktif';
    const { error } = await supabase.from('menus').update({ status: newStatus }).eq('id', menu.id);
    if (error) {
      toast.error("Gagal mengubah status menu");
    } else {
      toast.success(`Menu berhasil di${newStatus === 'arsip' ? 'arsipkan' : 'aktifkan'}`);
    }
  };

  const filteredMenus = menus.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const category = m.category || "Uncategorized";
    const matchFolder = selectedFolder === "Semua" || category === selectedFolder;
    return matchSearch && matchFolder;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Manajemen Menu</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Kelola daftar produk, harga, dan ketersediaan stok.</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Menu
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Tabs value={selectedFolder} onValueChange={setSelectedFolder}>
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="Semua">Semua Kategori</TabsTrigger>
              {Array.from(new Set(menus.map(m => m.category || "Uncategorized"))).map(folder => (
                <TabsTrigger key={folder} value={folder}>{folder}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Cari nama menu..." 
            className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center border border-zinc-200 dark:border-zinc-800 text-zinc-500">
          Belum ada menu yang ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenus.map((menu) => (
            <Card key={menu.id} className={`overflow-hidden transition-opacity ${menu.status === 'arsip' ? 'opacity-60 grayscale-[50%]' : ''}`}>
              <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800">
                {menu.image_url ? (
                  <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">No Image</div>
                )}
                {menu.status === 'arsip' && (
                  <div className="absolute top-2 right-2 bg-zinc-900/80 text-white text-xs px-2 py-1 rounded font-medium backdrop-blur-sm">
                    Diarsipkan
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{menu.name}</h3>
                    <p className="text-primary font-bold">{formatIDR(menu.price)}</p>
                  </div>
                </div>
                
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 h-10">
                  {menu.desc}
                </p>
                
                <div className="flex items-center gap-4 text-xs font-medium mb-4">
                  <div className="flex items-center gap-1 text-red-500">
                    <Flame className="w-3 h-3" />
                    Lv. {menu.spicy_level}
                  </div>
                  <div className="text-zinc-500">
                    Stok: {menu.stock}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(menu)} className="gap-1">
                    <Edit2 className="w-3 h-3" /> Edit
                  </Button>
                  <Button 
                    variant={menu.status === 'aktif' ? 'secondary' : 'default'} 
                    size="sm" 
                    onClick={() => handleToggleStatus(menu)} 
                    className="gap-1"
                  >
                    <Archive className="w-3 h-3" /> {menu.status === 'aktif' ? 'Arsip' : 'Aktif'}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(menu.id)} className="gap-1">
                    <Trash2 className="w-3 h-3" /> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MenuModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        menu={selectedMenu} 
        onSuccess={fetchMenus}
      />
    </div>
  );
}
