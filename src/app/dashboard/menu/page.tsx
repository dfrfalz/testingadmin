"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { Plus, Edit2, Trash2, Archive, Flame, Search, Folder, ArrowLeft, FolderPlus, Check, X, FolderInput, ChevronDown } from "lucide-react";
import MenuModal, { MenuType } from "@/components/MenuModal";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function MenuPage() {
  const [menus, setMenus] = useState<MenuType[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuType | null>(null);
  
  // Folder Modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isSubmittingFolder, setIsSubmittingFolder] = useState(false);

  // Delete Confirmation Modal state
  const [deleteConfirmMenu, setDeleteConfirmMenu] = useState<number | null>(null);
  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk Move state
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
  const [bulkMoveTargetFolder, setBulkMoveTargetFolder] = useState("__root__");
  const [isMoving, setIsMoving] = useState(false);
  
  const [search, setSearch] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const fetchMenusAndFolders = async () => {
    setLoading(true);
    const [menuRes, folderRes] = await Promise.all([
      supabase.from('menus').select('*').order('id', { ascending: true }),
      supabase.from('folders').select('*').order('name', { ascending: true })
    ]);
      
    if (!menuRes.error && menuRes.data) {
      setMenus(menuRes.data);
    }
    if (!folderRes.error && folderRes.data) {
      setFolders(folderRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMenusAndFolders();

    // Subscribe to realtime changes
    const menuChannel = supabase
      .channel('public:menus')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menus' }, () => {
        fetchMenusAndFolders();
      })
      .subscribe();
      
    const folderChannel = supabase
      .channel('public:folders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, () => {
        fetchMenusAndFolders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(folderChannel);
    };
  }, []);

  const handleEdit = (menu: MenuType) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedMenu({
       name: "",
       desc: "",
       price: 0,
       category: currentFolder || "", // Set default category to current folder
       spicy_level: 0,
       stock: 0,
       image_url: "",
       status: "aktif",
    } as any);
    setIsModalOpen(true);
  };

  const confirmDeleteMenu = (id: number) => {
    setDeleteConfirmMenu(id);
  };

  const handleDelete = async () => {
    if (deleteConfirmMenu === null) return;
    setIsDeleting(true);
    
    const { error } = await supabase.from('menus').delete().eq('id', deleteConfirmMenu);
    setIsDeleting(false);
    
    if (error) {
      toast.error("Gagal menghapus menu");
    } else {
      toast.success("Menu berhasil dihapus");
      setDeleteConfirmMenu(null);
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

  const handleOpenFolderModal = () => {
    setNewFolderName("");
    setIsFolderModalOpen(true);
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName || newFolderName.trim() === "") return;
    
    setIsSubmittingFolder(true);
    const { error } = await supabase.from('folders').insert([{ name: newFolderName.trim() }]);
    setIsSubmittingFolder(false);
    
    if (error) {
      toast.error("Gagal membuat folder. Nama mungkin sudah ada.");
    } else {
      toast.success("Folder berhasil dibuat!");
      setIsFolderModalOpen(false);
      fetchMenusAndFolders();
    }
  };

  const confirmDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent clicking folder
    setDeleteConfirmFolder(folderName);
  };

  const handleDeleteFolder = async () => {
    if (!deleteConfirmFolder) return;
    setIsDeleting(true);
    
    // Set category of menus in this folder to empty string first
    await supabase.from('menus').update({ category: '' }).eq('category', deleteConfirmFolder);
    
    // Then delete folder
    const { error } = await supabase.from('folders').delete().eq('name', deleteConfirmFolder);
    setIsDeleting(false);
    
    if (error) {
      toast.error("Gagal menghapus folder");
    } else {
      toast.success("Folder berhasil dihapus");
      setDeleteConfirmFolder(null);
      fetchMenusAndFolders();
    }
  };

  const toggleMenuSelection = (id: number) => {
    setSelectedMenuIds(prev => 
      prev.includes(id) ? prev.filter(menuId => menuId !== id) : [...prev, id]
    );
  };

  const handleBulkMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMoving(true);
    
    const targetCategory = bulkMoveTargetFolder === "__root__" ? "" : bulkMoveTargetFolder;
    
    const { error } = await supabase
      .from('menus')
      .update({ category: targetCategory })
      .in('id', selectedMenuIds);
      
    setIsMoving(false);
    
    if (error) {
      toast.error("Gagal memindahkan menu");
    } else {
      toast.success(`${selectedMenuIds.length} menu berhasil dipindahkan`);
      setIsBulkMoveModalOpen(false);
      setSelectedMenuIds([]);
      fetchMenusAndFolders();
    }
  };

  // Filter menus based on search and current folder
  const filteredMenus = menus.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchFolder = currentFolder === null 
      ? (!m.category || m.category === "") // Root shows uncategorized
      : (m.category === currentFolder);    // Inside folder shows its items
    return matchSearch && matchFolder;
  });
  
  // Filter folders (only visible in root)
  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {currentFolder ? (
              <span className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentFolder(null)} className="-ml-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                {currentFolder}
              </span>
            ) : "Manajemen Menu"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Kelola daftar produk, folder, dan ketersediaan stok.</p>
        </div>
        <div className="flex gap-2">
          {currentFolder === null && (
            <Button variant="outline" onClick={handleOpenFolderModal} className="gap-2">
              <FolderPlus className="w-4 h-4" />
              Buat Folder
            </Button>
          )}
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Menu
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder={currentFolder ? `Cari menu di dalam ${currentFolder}...` : "Cari folder atau menu..."}
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
      ) : (
        <>
          {/* FOLDERS GRID (Only at root) */}
          {currentFolder === null && filteredFolders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Folders</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFolders.map(folder => (
                  <div 
                    key={folder.id} 
                    onClick={() => setCurrentFolder(folder.name)}
                    className="group relative flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
                  >
                    <Folder className="w-12 h-12 text-primary mb-3 fill-primary/20" />
                    <span className="font-medium text-sm text-center truncate w-full">{folder.name}</span>
                    
                    <button 
                      onClick={(e) => confirmDeleteFolder(folder.name, e)}
                      className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MENUS GRID */}
          <div>
            {currentFolder === null && <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Files (Menu)</h2>}
            
            {filteredMenus.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center border border-zinc-200 dark:border-zinc-800 text-zinc-500">
                {currentFolder ? "Folder ini kosong." : "Belum ada menu di luar folder."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredMenus.map((menu) => (
                  <Card 
                    key={menu.id} 
                    className={`overflow-hidden transition-all duration-200 border-2 ${menu.status === 'arsip' ? 'opacity-60 grayscale-[50%]' : ''} ${selectedMenuIds.includes(menu.id) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                  >
                    <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 group">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleMenuSelection(menu.id); }}
                        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-all ${
                          selectedMenuIds.includes(menu.id) 
                            ? 'bg-primary text-white border-primary border-2 shadow-sm' 
                            : 'bg-black/20 text-transparent border-white/70 border-2 opacity-0 group-hover:opacity-100 hover:bg-black/40'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      
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
                    <CardContent className="p-4">
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
                        <Button variant="destructive" size="sm" onClick={() => confirmDeleteMenu(menu.id)} className="gap-1">
                          <Trash2 className="w-3 h-3" /> Hapus
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <MenuModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        menu={selectedMenu} 
        onSuccess={fetchMenusAndFolders}
      />

      {/* Folder Creation Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-primary" />
                Buat Folder Baru
              </h2>
            </div>
            
            <form onSubmit={handleCreateFolderSubmit}>
              <div className="p-6">
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Nama Folder
                </label>
                <Input 
                  autoFocus
                  placeholder="Contoh: Minuman Dingin"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFolderModalOpen(false)}
                  disabled={isSubmittingFolder}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingFolder || !newFolderName.trim()}
                >
                  {isSubmittingFolder ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Menu Confirmation Modal */}
      {deleteConfirmMenu !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Hapus Menu?</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Apakah Anda yakin ingin menghapus menu ini secara permanen? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex border-t border-zinc-100 dark:border-zinc-800">
              <Button 
                variant="ghost" 
                className="flex-1 rounded-none py-5 h-auto border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                onClick={() => setDeleteConfirmMenu(null)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button 
                variant="destructive"
                className="flex-1 rounded-none py-5 h-auto"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Modal */}
      {deleteConfirmFolder !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Hapus Folder?</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Apakah Anda yakin ingin menghapus folder <strong>"{deleteConfirmFolder}"</strong>? Menu di dalamnya tidak akan terhapus, hanya akan dikeluarkan dari folder.
              </p>
            </div>
            <div className="flex border-t border-zinc-100 dark:border-zinc-800">
              <Button 
                variant="ghost" 
                className="flex-1 rounded-none py-5 h-auto border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                onClick={() => setDeleteConfirmFolder(null)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button 
                variant="destructive"
                className="flex-1 rounded-none py-5 h-auto"
                onClick={handleDeleteFolder}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Floating Bar */}
      {selectedMenuIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-4 rounded-full shadow-2xl z-[90] flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <span className="font-medium whitespace-nowrap">
            {selectedMenuIds.length} menu terpilih
          </span>
          <div className="w-px h-6 bg-zinc-700 dark:bg-zinc-200"></div>
          <Button 
            onClick={() => setIsBulkMoveModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
          >
            Pindahkan
          </Button>
          <button 
            onClick={() => setSelectedMenuIds([])}
            className="ml-2 text-zinc-400 hover:text-white dark:text-zinc-500 dark:hover:text-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Bulk Move Modal */}
      {isBulkMoveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderInput className="w-5 h-5 text-primary" />
                Pindahkan {selectedMenuIds.length} Menu
              </h2>
            </div>
            
            <form onSubmit={handleBulkMoveSubmit}>
              <div className="p-6">
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Pilih Folder Tujuan
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between font-normal bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      {bulkMoveTargetFolder === '__root__' ? 'Tanpa Folder' : bulkMoveTargetFolder}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] max-h-60 overflow-y-auto" align="start" style={{ zIndex: 105 }}>
                    <DropdownMenuItem onClick={() => setBulkMoveTargetFolder('__root__')} className="cursor-pointer">
                      Tanpa Folder
                    </DropdownMenuItem>
                    {folders.map(f => (
                      <DropdownMenuItem key={f.id} onClick={() => setBulkMoveTargetFolder(f.name)} className="cursor-pointer">
                        {f.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex border-t border-zinc-100 dark:border-zinc-800">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1 rounded-none py-5 h-auto border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                  onClick={() => setIsBulkMoveModalOpen(false)}
                  disabled={isMoving}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  className="flex-1 rounded-none py-5 h-auto"
                  disabled={isMoving}
                >
                  {isMoving ? "Memindahkan..." : "Pindahkan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
