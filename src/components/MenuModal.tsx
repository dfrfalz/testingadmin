"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X, Upload, Loader2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type MenuType = {
  id: number;
  slug: string;
  name: string;
  desc: string;
  ingredients: string;
  price: number;
  weight: string;
  spicy_level: number;
  category: string;
  image_url: string;
  is_best_seller: boolean;
  shelf_life: string;
  serving_prep: string;
  stock: number;
  status: string;
};

export default function MenuModal({
  isOpen,
  onClose,
  menu,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  menu?: MenuType | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<MenuType>>({
    name: "",
    desc: "",
    price: 0,
    category: "Sambal Merah",
    spicy_level: 0,
    stock: 0,
    image_url: "",
    status: "aktif",
    is_best_seller: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [folders, setFolders] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchFolders = async () => {
        const { data } = await supabase.from('folders').select('name').order('name');
        if (data) setFolders(data.map(f => f.name));
      };
      fetchFolders();
    }
  }, [isOpen]);

  useEffect(() => {
    if (menu) {
      setFormData(menu);
      setPreviewUrl(menu.image_url);
    } else {
      setFormData({
        name: "",
        desc: "",
        price: 0,
        category: "Sambal Merah",
        spicy_level: 0,
        stock: 0,
        image_url: "",
        status: "aktif",
      });
      setPreviewUrl("");
      setFile(null);
      setIngredientInput("");
    }
  }, [menu, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const uploadImage = async () => {
    if (!file) return formData.image_url;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`; // bucket name is 'menus', so this is inside it

    const { error: uploadError } = await supabase.storage
      .from('menus')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('menus').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = formData.image_url;
      if (file) {
        finalImageUrl = await uploadImage();
      }

      const slug = formData.slug || generateSlug(formData.name || "");

      const payload = {
        ...formData,
        slug,
        image_url: finalImageUrl,
      };

      if (menu?.id) {
        // Edit
        const { error } = await supabase.from('menus').update(payload).eq('id', menu.id);
        if (error) throw error;
        toast.success("Menu berhasil diperbarui!");
      } else {
        // Add
        const { error } = await supabase.from('menus').insert([payload]);
        if (error) throw error;
        toast.success("Menu berhasil ditambahkan!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold">{menu ? "Edit Menu" : "Tambah Menu Baru"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="menuForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Image Upload */}
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium mb-2">Foto Menu</label>
                <div className="relative aspect-square rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary transition-colors group overflow-hidden bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 cursor-pointer">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-zinc-400 group-hover:text-primary transition-colors" />
                      <span className="text-xs text-center px-4">Klik untuk unggah foto</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                </div>
                
                <div 
                  className="mt-4 flex items-center space-x-3 bg-zinc-50 dark:bg-zinc-900/50 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors" 
                  onClick={() => setFormData({...formData, is_best_seller: !formData.is_best_seller})}
                >
                  <input 
                    type="checkbox" 
                    id="is_best_seller"
                    checked={formData.is_best_seller || false}
                    onChange={(e) => setFormData({...formData, is_best_seller: e.target.checked})}
                    className="w-4 h-4 text-primary bg-white border-zinc-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 cursor-pointer accent-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="is_best_seller" className="text-sm font-medium cursor-pointer flex-1 text-zinc-900 dark:text-zinc-100">
                    Jadikan Best Seller
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="w-full sm:w-2/3 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Nama Menu</label>
                    <Input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="Contoh: Cumi Sambal Merah"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Folder</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-between font-normal bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          {formData.category || 'Tanpa Folder'}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] max-h-60 overflow-y-auto" align="start" style={{ zIndex: 105 }}>
                        <DropdownMenuItem onClick={() => setFormData({...formData, category: ""})} className="cursor-pointer">
                          Tanpa Folder
                        </DropdownMenuItem>
                        {folders.map(folder => (
                          <DropdownMenuItem key={folder} onClick={() => setFormData({...formData, category: folder})} className="cursor-pointer">
                            {folder}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Harga</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-zinc-500 sm:text-sm">Rp</span>
                      </div>
                      <Input 
                        required 
                        type="text"
                        className="pl-9"
                        value={formData.price ? formData.price.toLocaleString("id-ID") : ""} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({...formData, price: Number(val)});
                        }} 
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Stok</label>
                    <Input 
                      required 
                      type="text"
                      value={formData.stock !== undefined ? formData.stock : ""} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, stock: Number(val)});
                      }} 
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Level Pedas</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-between font-normal bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          {formData.spicy_level !== undefined ? `Level ${formData.spicy_level}` : 'Pilih Level'}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px]" align="start" style={{ zIndex: 105 }}>
                        {[0, 1, 2, 3, 4, 5].map(level => (
                          <DropdownMenuItem key={level} onClick={() => setFormData({...formData, spicy_level: level})} className="cursor-pointer">
                            Level {level}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-between font-normal bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          {formData.status === 'aktif' ? 'Aktif - Tampilkan' : 'Arsip - Sembunyikan'}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px]" align="start" style={{ zIndex: 105 }}>
                        <DropdownMenuItem onClick={() => setFormData({...formData, status: 'aktif'})} className="cursor-pointer">
                          Aktif - Tampilkan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData({...formData, status: 'arsip'})} className="cursor-pointer">
                          Arsip - Sembunyikan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi Singkat</label>
              <Input 
                value={formData.desc} 
                onChange={e => setFormData({...formData, desc: e.target.value})} 
                placeholder="Deskripsi menarik untuk ditampilkan di card menu"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Bahan-bahan (Opsional)</label>
              <div className="w-full flex flex-wrap gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-within:border-primary dark:border-zinc-800 dark:bg-zinc-950 min-h-[80px] items-start content-start">
                {(() => {
                  const ingredientsList = formData.ingredients ? formData.ingredients.split(',').map(s => s.trim()).filter(Boolean) : [];
                  return (
                    <>
                      {ingredientsList.map((ing, i) => (
                        <div key={i} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-sm">
                          <span>{ing}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              const newList = ingredientsList.filter((_, index) => index !== i);
                              setFormData({...formData, ingredients: newList.join(', ')});
                            }}
                            className="text-zinc-500 hover:text-red-500 ml-1 focus:outline-none"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <input 
                        type="text" 
                        className="flex-1 min-w-[150px] bg-transparent outline-none h-7" 
                        placeholder={ingredientsList.length === 0 ? "Ketik lalu tekan koma (,) atau Enter..." : ""}
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === ',' || e.key === 'Enter') {
                            e.preventDefault();
                            const val = ingredientInput.trim();
                            if (val) {
                              if (!ingredientsList.includes(val)) {
                                setFormData({...formData, ingredients: [...ingredientsList, val].join(', ')});
                              }
                              setIngredientInput("");
                            }
                          } else if (e.key === 'Backspace' && !ingredientInput && ingredientsList.length > 0) {
                            e.preventDefault();
                            const newList = [...ingredientsList];
                            newList.pop();
                            setFormData({...formData, ingredients: newList.join(', ')});
                          }
                        }}
                      />
                    </>
                  );
                })()}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Tekan <kbd className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">koma (,)</kbd> atau <kbd className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">Enter</kbd> untuk menambahkan.</p>
            </div>
          </form>
        </div>
        
        <div className="flex border-t border-zinc-200 dark:border-zinc-800 overflow-hidden rounded-b-2xl mt-auto shrink-0">
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1 rounded-none py-5 h-auto border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            onClick={onClose} 
            disabled={loading}
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            form="menuForm" 
            variant="destructive"
            className="flex-1 rounded-none py-5 h-auto text-white dark:text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {menu ? "Simpan Perubahan" : "Tambah Menu"}
          </Button>
        </div>
      </div>
    </div>
  );
}
