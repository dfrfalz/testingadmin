"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type BannerData = {
  id?: string;
  image_url: string;
  background_url: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        image_url: "",
        background_url: "",
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

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  const removeBg = () => {
    setFormData(prev => ({ ...prev, background_url: "" }));
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{initialData ? "Edit Banner" : "Tambah Banner Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Gambar Banner</Label>
                {formData.image_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-sm">
                    <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-900">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all bg-zinc-50/50 dark:bg-zinc-900/20"
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
                          <div className="text-[11px] text-zinc-500 mt-0.5">Rekomendasi rasio 1:1 atau 16:9</div>
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
                <Label>Gambar Latar Belakang</Label>
                {formData.background_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-sm">
                    <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-900">
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
                    className="aspect-video w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all bg-zinc-50/50 dark:bg-zinc-900/20"
                  >
                    {uploadingBg ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <>
                        <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-700">
                          <ImagePlus className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Unggah Latar Belakang</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">Gambar akan diredupkan (15%)</div>
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading || uploading || uploadingBg}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan Banner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
