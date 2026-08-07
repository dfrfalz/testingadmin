"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { ImagePlus, X, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

export type BannerData = {
  id?: string;
  image_url: string;
  background_url: string;
  background_mobile_url?: string;
  title: string;
  subtitle: string;
  description: string;
  link_text: string;
  link_url: string;
  is_active: boolean;
  order_index: number;
};

type BannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: BannerData | null;
};

export function BannerModal({ isOpen, onClose, onSuccess, initialData }: BannerModalProps) {
  const [formData, setFormData] = useState<BannerData>({
    image_url: "",
    background_url: "",
    background_mobile_url: "",
    title: "",
    subtitle: "",
    description: "Nikmati sensasi pedas premium dari CUMITA. Olahan cumi segar berpadu dengan sambal khas rumahan yang menggugah selera. Tersedia melalui sistem Pre-Order.",
    link_text: "Pesan Sekarang",
    link_url: "OLAHAN CUMI PREMIUM #1",
    is_active: true,
    order_index: 0,
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingBgMobile, setUploadingBgMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const bgMobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        image_url: "",
        background_url: "",
        background_mobile_url: "",
        title: "",
        subtitle: "",
        description: "Nikmati sensasi pedas premium dari CUMITA. Olahan cumi segar berpadu dengan sambal khas rumahan yang menggugah selera. Tersedia melalui sistem Pre-Order.",
        link_text: "Pesan Sekarang",
        link_url: "OLAHAN CUMI PREMIUM #1",
        is_active: true,
        order_index: 0,
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('menus')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('menus')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      toast.success('Gambar berhasil diunggah');
    } catch (error: any) {
      toast.error('Gagal mengunggah gambar: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    try {
      setUploadingBg(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `bg-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menus')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('menus')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, background_url: publicUrlData.publicUrl }));
      toast.success('Gambar latar belakang berhasil diunggah');
    } catch (error: any) {
      toast.error('Gagal mengunggah gambar latar belakang: ' + error.message);
    } finally {
      setUploadingBg(false);
      if (bgInputRef.current) {
        bgInputRef.current.value = '';
      }
    }
  };

  const handleBgMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    try {
      setUploadingBgMobile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `bg-mobile-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menus')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('menus')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, background_mobile_url: publicUrlData.publicUrl }));
      toast.success('Gambar latar belakang mobile berhasil diunggah');
    } catch (error: any) {
      toast.error('Gagal mengunggah gambar latar belakang mobile: ' + error.message);
    } finally {
      setUploadingBgMobile(false);
      if (bgMobileInputRef.current) {
        bgMobileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  const removeBg = () => {
    setFormData(prev => ({ ...prev, background_url: "" }));
  };

  const removeBgMobile = () => {
    setFormData(prev => ({ ...prev, background_mobile_url: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast.error("Gambar banner wajib diisi");
      return;
    }
    if (!formData.title || !formData.subtitle) {
      toast.error("Judul dan Subjudul wajib diisi");
      return;
    }

    setLoading(true);
    try {
      if (initialData?.id) {
        // Update
        const { error } = await supabase
          .from('banners')
          .update(formData)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success("Banner berhasil diperbarui");
      } else {
        // Insert
        const { error } = await supabase
          .from('banners')
          .insert([formData]);
        if (error) throw error;
        toast.success("Banner berhasil ditambahkan");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Gagal menyimpan banner: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{initialData ? "Edit Banner" : "Tambah Banner Baru"}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Atur detail banner yang akan ditampilkan di halaman depan.</p>
        </div>
        <Button type="button" variant="outline" onClick={onClose}>
          Kembali ke Daftar Banner
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Gambar Banner</Label>
                {formData.image_url ? (
                  <div className="relative rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-sm aspect-square w-[140px]">
                    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-4 right-4 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square w-[140px] border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-full flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all bg-zinc-50/50 dark:bg-zinc-900/20 overflow-hidden"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <>
                        <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-700">
                          <ImagePlus className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Unggah Gambar Banner</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5 px-4">Rekomendasi rasio 1:1 (Lingkaran)</div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="space-y-2">
                <Label>Gambar Latar Belakang (Desktop & Mobile)</Label>
                <div className="flex gap-3 h-[200px]">
                  
                  {/* Desktop Background */}
                  <div className="flex-1 relative">
                    {formData.background_url ? (
                      <div className="relative h-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-sm">
                        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900">
                          <img src={formData.background_url} alt="Preview Background" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={removeBg}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => bgInputRef.current?.click()}
                        className="h-full w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all bg-zinc-50/50 dark:bg-zinc-900/20 px-2 text-center"
                      >
                        {uploadingBg ? (
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        ) : (
                          <>
                            <div className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-700">
                              <ImagePlus className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                            </div>
                            <div>
                              <div className="text-[13px] text-zinc-700 dark:text-zinc-300 font-medium leading-tight">Latar Landscape</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">Untuk Web/PC</div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={bgInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleBgUpload}
                    />
                  </div>

                  {/* Mobile Background */}
                  <div className="w-[112px] flex-shrink-0 relative">
                    {formData.background_mobile_url ? (
                      <div className="relative h-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-sm">
                        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900">
                          <img src={formData.background_mobile_url} alt="Preview Mobile Background" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={removeBgMobile}
                          className="absolute top-2 right-2 p-1 bg-red-500/90 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => bgMobileInputRef.current?.click()}
                        className="h-full w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all bg-zinc-50/50 dark:bg-zinc-900/20 px-2 text-center"
                      >
                        {uploadingBgMobile ? (
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        ) : (
                          <>
                            <div className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-700">
                              <ImagePlus className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                            </div>
                            <div>
                              <div className="text-[13px] text-zinc-700 dark:text-zinc-300 font-medium leading-tight">Latar Potrait</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">Untuk HP</div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={bgMobileInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleBgMobileUpload}
                    />
                  </div>
                  
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Judul Utama - Baris Atas</Label>
                <Input name="title" value={formData.title} onChange={handleChange} placeholder="Misal: Cita Rasa Pedas" className="h-11" required />
              </div>
              <div className="space-y-2">
                <Label>Judul Bawah - Baris Bawah</Label>
                <Input name="subtitle" value={formData.subtitle} onChange={handleChange} placeholder="Misal: yang Bikin Nagih" className="h-11" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi Paragraf</Label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tuliskan deskripsi banner di sini..."
                className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Teks Tombol</Label>
                <Input name="link_text" value={formData.link_text} onChange={handleChange} placeholder="Pesan Sekarang" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Teks Badge</Label>
                <Input name="link_url" value={formData.link_url} onChange={handleChange} placeholder="Misal: Promo Spesial!" className="h-11" />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <div className="flex flex-col">
                <Label htmlFor="is_active" className="cursor-pointer font-semibold text-zinc-900 dark:text-zinc-100">Aktifkan banner ini</Label>
                <span className="text-[11px] text-zinc-500">Banner yang aktif akan ditampilkan di halaman depan.</span>
              </div>
            </div>

            {/* PRATINJAU BANNER */}
            <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800 mt-2">
              <Label className="text-base font-bold text-zinc-800 dark:text-zinc-200">Pratinjau Banner (Desktop & Mobile)</Label>
              <div className="flex flex-col xl:flex-row gap-6 items-start">
                
                {/* Desktop Preview */}
                <div className="relative flex-1 w-full aspect-[16/9] xl:aspect-[21/9] min-h-[250px] sm:min-h-[400px] lg:min-h-[500px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-[#0a0a0a] flex items-center p-4 sm:p-8 lg:p-12 shadow-sm">
                  {/* Background Desktop */}
                  {formData.background_url && (
                    <div 
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{ backgroundImage: `url(${formData.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                  )}
                  {/* Content Desktop */}
                  <div className="relative z-10 w-full flex flex-row items-center justify-between gap-4 sm:gap-8 max-w-6xl mx-auto">
                    <div className="flex-1 space-y-2 sm:space-y-6 text-left">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-4 sm:py-2 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                        <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-[#06b6d4] fill-[#06b6d4]/30" />
                        <span className="text-[10px] sm:text-xs font-bold text-zinc-300">{formData.link_url || 'OLAHAN CUMI PREMIUM #1'}</span>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <h1 className="text-xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold text-white tracking-tight leading-tight">
                          {formData.title || 'Judul Utama'}
                        </h1>
                        <h2 className="text-lg sm:text-3xl lg:text-4xl xl:text-6xl font-bold text-[#06b6d4] tracking-tight leading-tight">
                          {formData.subtitle || 'Subjudul'}
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm lg:text-lg text-zinc-400 line-clamp-2 sm:line-clamp-3 max-w-xl">
                        {formData.description || 'Deskripsi banner akan muncul di sini...'}
                      </p>
                      <div className="pt-2 sm:pt-4 flex items-center gap-2 sm:gap-4">
                        <Button type="button" className="pointer-events-none h-8 px-4 sm:h-12 text-xs sm:text-base sm:px-8 bg-[#06b6d4] hover:bg-[#0891b2] text-white font-semibold">
                          {formData.link_text || 'Pesan Sekarang'} &rarr;
                        </Button>
                        <div className="hidden sm:flex items-center gap-2">
                           <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center bg-zinc-900/50 text-zinc-400">&lt;</div>
                           <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center bg-zinc-900/50 text-zinc-400">&gt;</div>
                        </div>
                      </div>
                    </div>
                    {/* Image Desktop */}
                    <div className="w-[120px] sm:w-[200px] lg:w-[400px] xl:w-[450px] shrink-0">
                      <div className="aspect-square rounded-full p-2 sm:p-5" style={{ background: "conic-gradient(from 0deg, rgba(220,38,38,0.3), rgba(255,100,0,0.15), transparent, rgba(220,38,38,0.3))" }}>
                        <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden shadow-2xl">
                          {formData.image_url ? (
                            <img src={formData.image_url} alt="Hero" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                              <ImagePlus className="h-6 w-6 sm:h-12 sm:w-12 text-zinc-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Preview */}
                <div className="relative w-[300px] h-[600px] shrink-0 rounded-[2.5rem] overflow-hidden border-[10px] border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 shadow-xl mx-auto xl:mx-0">
                  {/* Notch mockup */}
                  <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
                    <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-b-xl"></div>
                  </div>
                  
                  {/* Background Mobile */}
                  {(formData.background_mobile_url || formData.background_url) && (
                    <div 
                      className="absolute inset-0 opacity-15 pointer-events-none"
                      style={{ backgroundImage: `url(${formData.background_mobile_url || formData.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                  )}
                  {/* Content Mobile */}
                  <div className="relative z-10 w-full flex flex-col items-center text-center gap-6 mt-6">
                    <div className="w-[180px] mx-auto">
                      <div className="aspect-square rounded-full p-3" style={{ background: "conic-gradient(from 0deg, rgba(220,38,38,0.3), rgba(255,100,0,0.15), transparent, rgba(220,38,38,0.3))" }}>
                        <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                          {formData.image_url ? (
                            <img src={formData.image_url} alt="Hero Mobile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                              <ImagePlus className="h-6 w-6 text-zinc-300" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800">
                        <Crown className="h-3 w-3 text-[#06b6d4] fill-[#06b6d4]/30" />
                        <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">{formData.link_url || 'OLAHAN CUMI PREMIUM #1'}</span>
                      </div>
                      <div>
                        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white leading-[1.1]">
                          <span className="block">{formData.title || 'Judul Utama'}</span>
                          <span className="block text-primary mt-1.5">{formData.subtitle || 'Subjudul'}</span>
                        </h1>
                      </div>
                      <p className="text-[13px] text-zinc-600 dark:text-zinc-400 line-clamp-3">
                        {formData.description || 'Deskripsi banner akan muncul di sini...'}
                      </p>
                      <Button type="button" className="pointer-events-none w-full h-11 text-sm mt-2">
                        {formData.link_text || 'Pesan Sekarang'}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 md:left-[280px] p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex justify-end z-50">
            <div className="w-full max-w-none mx-auto flex justify-end gap-3 pr-4 md:pr-8">
              <Button type="button" variant="outline" onClick={onClose} size="lg">Batal</Button>
              <Button type="submit" disabled={loading || uploading || uploadingBg || uploadingBgMobile} size="lg" className="min-w-[150px] font-bold shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </form>
    </div>
  );
}
