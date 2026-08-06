"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Sparkles, ArrowLeft, Plus, Trash2, Flame, ShieldCheck, Leaf, Clock, Heart, Star, ThumbsUp, Zap, Award, CheckCircle2, Coffee, Utensils, Truck, Package, Gift, ShoppingBag, Smile, MapPin, PhoneCall, Droplet } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Feature = {
  icon: string;
  title: string;
  description: string;
};

const DEFAULT_FEATURES: Feature[] = [
  {
    icon: "Flame",
    title: "Sambal Homemade",
    description: "Dibuat dari cabai pilihan segar dengan resep rahasia keluarga."
  },
  {
    icon: "ShieldCheck",
    title: "Higienis",
    description: "Proses pengolahan bersih dan aman, dikemas kedap udara."
  },
  {
    icon: "Leaf",
    title: "Tanpa Pengawet",
    description: "100% bahan alami, sehat dan aman dikonsumsi setiap hari."
  },
  {
    icon: "Clock",
    title: "Rasa Konsisten",
    description: "Kualitas dan rasa selalu terjaga di setiap batch produksi."
  }
];

const ICON_OPTIONS = [
  { label: 'Flame', value: 'Flame', icon: Flame },
  { label: 'ShieldCheck', value: 'ShieldCheck', icon: ShieldCheck },
  { label: 'Leaf', value: 'Leaf', icon: Leaf },
  { label: 'Clock', value: 'Clock', icon: Clock },
  { label: 'Heart', value: 'Heart', icon: Heart },
  { label: 'Star', value: 'Star', icon: Star },
  { label: 'ThumbsUp', value: 'ThumbsUp', icon: ThumbsUp },
  { label: 'Zap', value: 'Zap', icon: Zap },
  { label: 'Award', value: 'Award', icon: Award },
  { label: 'CheckCircle', value: 'CheckCircle2', icon: CheckCircle2 },
  { label: 'Coffee', value: 'Coffee', icon: Coffee },
  { label: 'Utensils', value: 'Utensils', icon: Utensils },
  { label: 'Truck', value: 'Truck', icon: Truck },
  { label: 'Package', value: 'Package', icon: Package },
  { label: 'Gift', value: 'Gift', icon: Gift },
  { label: 'ShoppingBag', value: 'ShoppingBag', icon: ShoppingBag },
  { label: 'Smile', value: 'Smile', icon: Smile },
  { label: 'MapPin', value: 'MapPin', icon: MapPin },
  { label: 'PhoneCall', value: 'PhoneCall', icon: PhoneCall },
  { label: 'Droplet', value: 'Droplet', icon: Droplet },
];

export default function KeunggulanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subtitle, setSubtitle] = useState("Kualitas Premium di Setiap Gigitan");
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();
        
      if (data && !error) {
        if (data.keunggulan_subtitle) {
          setSubtitle(data.keunggulan_subtitle);
        }
        if (data.keunggulan_features && Array.isArray(data.keunggulan_features) && data.keunggulan_features.length > 0) {
          setFeatures(data.keunggulan_features);
        } else {
          setFeatures(DEFAULT_FEATURES);
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Filter out empty features
    const validFeatures = features.filter(f => f.title.trim() !== "" && f.description.trim() !== "");

    const { error } = await supabase
      .from('store_settings')
      .update({ 
        keunggulan_subtitle: subtitle,
        keunggulan_features: validFeatures 
      })
      .eq('id', 'default');

    if (error) {
      if (error.message.includes('does not exist')) {
        toast.error("Gagal! Anda belum menjalankan kode SQL untuk menambahkan kolom keunggulan di Supabase.");
      } else {
        toast.error("Gagal menyimpan: " + error.message);
      }
    } else {
      toast.success("Bagian Keunggulan berhasil disimpan!");
      if (validFeatures.length !== features.length) {
        setFeatures(validFeatures);
      }
    }
    
    setSaving(false);
  };

  const addFeature = () => {
    setFeatures([...features, { icon: "Star", title: "", description: "" }]);
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...features];
    newFeatures.splice(index, 1);
    setFeatures(newFeatures);
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
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
            <Sparkles className="h-6 w-6" /> Keunggulan Produk
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Ubah sub-judul dan fitur/manfaat produk yang ditampilkan di halaman depan (Kenapa Memilih Kami).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="w-full pb-24 space-y-8">
        
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg">Teks Sub-Judul</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Teks (Maksimal 60 karakter disarankan)</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Contoh: Kualitas Premium di Setiap Gigitan"
                className="font-medium bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary max-w-xl"
                required
              />
              <p className="text-xs text-zinc-500 mt-1">Ini adalah teks tebal berukuran besar di bawah tulisan "KENAPA MEMILIH KAMI".</p>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Daftar Keunggulan</h3>
            <Button type="button" onClick={addFeature} disabled={features.length >= 8} variant="outline" className="bg-white dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="h-4 w-4 mr-2" />
              {features.length >= 8 ? "Maksimal 8" : "Tambah Keunggulan"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative group transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
              
              <CardHeader className="py-3 px-5 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-base">
                    {index + 1}
                  </div>
                  <CardTitle className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Keunggulan #{index + 1}
                  </CardTitle>
                </div>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeFeature(index)}
                  className="text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 w-8 -mr-2"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Icon
                  </Label>
                  <Select
                    value={feature.icon}
                    onValueChange={(val) => updateFeature(index, 'icon', val)}
                  >
                    <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary">
                      {feature.icon ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const opt = ICON_OPTIONS.find(o => o.value === feature.icon);
                            const IconComponent = opt?.icon || Star;
                            return (
                              <>
                                <IconComponent className="h-4 w-4" />
                                <span className="truncate">{opt?.label || feature.icon}</span>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <SelectValue placeholder="Pilih Icon" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(opt => {
                        const IconComponent = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Judul
                  </Label>
                  <Input
                    value={feature.title}
                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                    placeholder="Contoh: Sambal Homemade"
                    className="font-medium bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Deskripsi Singkat
                  </Label>
                  <Textarea
                    value={feature.description}
                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                    placeholder="Contoh: Dibuat dari cabai pilihan segar."
                    className="min-h-[80px] bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>

        {features.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
            <Sparkles className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Belum ada fitur keunggulan.</p>
            <Button type="button" onClick={addFeature} variant="link" className="text-primary mt-2">
              Tambah Sekarang
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
