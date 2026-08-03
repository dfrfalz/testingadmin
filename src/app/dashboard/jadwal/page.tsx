"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, CalendarClock, Loader2, AlertCircle, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function DatePicker({
  date,
  setDate,
  placeholder
}: {
  date: string;
  setDate: (d: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  
  let parsedDate: Date | undefined = undefined;
  if (date) {
    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) parsedDate = undefined;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start text-left font-normal bg-zinc-950/50 border-zinc-800 text-zinc-100 hover:bg-zinc-900 hover:text-white",
          !date && "text-zinc-500"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {parsedDate ? format(parsedDate, "PPP", { locale: id }) : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-zinc-800 bg-zinc-950" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={(d) => {
            setDate(d ? d.toISOString() : "");
            setOpen(false);
          }}
          className="text-zinc-300"
        />
      </PopoverContent>
    </Popover>
  );
}

export default function JadwalPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    poStatus: "open",
    poStartDate: "",
    poEndDate: "",
    poDeliveryDate: "",
    operationalSchedule: "Senin - Jumat: 09:00 - 17:00\nSabtu: 09:00 - 15:00\nMinggu: Libur (Tutup PO)"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();
        
      if (data && !error) {
        setSettings({
          poStatus: data.po_status || "open",
          poStartDate: data.po_start_date || "",
          poEndDate: data.po_end_date || "",
          poDeliveryDate: data.po_delivery_date || "",
          operationalSchedule: data.operational_schedule || "Senin - Jumat: 09:00 - 17:00\nSabtu: 09:00 - 15:00\nMinggu: Libur (Tutup PO)"
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleTogglePO = (checked: boolean) => {
    setSettings(prev => ({ ...prev, poStatus: checked ? "open" : "closed" }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from('store_settings')
      .update({
        po_status: settings.poStatus,
        po_start_date: settings.poStartDate,
        po_end_date: settings.poEndDate,
        po_delivery_date: settings.poDeliveryDate,
        operational_schedule: settings.operationalSchedule,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');

    if (error) {
      toast.error("Gagal: Pastikan Anda sudah menjalankan script SQL di Supabase!");
    } else {
      toast.success("Jadwal berhasil diperbarui!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Jadwal & PO</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Atur jadwal operasional toko dan kelola sistem Pre-Order (PO).</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" /> Status Pre-Order
                </CardTitle>
                <CardDescription className="mt-1">
                  Buka atau tutup pemesanan PO saat ini.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${settings.poStatus === 'open' ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                  {settings.poStatus === 'open' ? 'PO BUKA' : 'PO TUTUP'}
                </span>
                <Switch 
                  checked={settings.poStatus === "open"} 
                  onCheckedChange={handleTogglePO} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {!settings.poStatus || settings.poStatus === "closed" ? (
               <Alert className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle>PO Sedang Ditutup</AlertTitle>
                <AlertDescription>
                  Pelanggan akan melihat notifikasi bahwa PO sedang tutup, namun mereka tetap dapat melihat daftar menu.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/20 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                <Label htmlFor="poStartDate" className="text-sm font-semibold">Mulai Pre-Order</Label>
                <DatePicker 
                  date={settings.poStartDate} 
                  setDate={(d) => setSettings(p => ({...p, poStartDate: d}))} 
                  placeholder="Pilih Tanggal Mulai"
                />
                <p className="text-xs text-zinc-500">Kapan pre-order ini mulai dibuka untuk pelanggan.</p>
              </div>
              <div className="space-y-3 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/20 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                <Label htmlFor="poEndDate" className="text-sm font-semibold">Batas Pre-Order</Label>
                <DatePicker 
                  date={settings.poEndDate} 
                  setDate={(d) => setSettings(p => ({...p, poEndDate: d}))} 
                  placeholder="Pilih Tanggal Tutup"
                />
                <p className="text-xs text-zinc-500">Tenggat waktu maksimal pelanggan dapat memesan.</p>
              </div>
              <div className="space-y-3 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/20 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                <Label htmlFor="poDeliveryDate" className="text-sm font-semibold">Jadwal Pengiriman</Label>
                <DatePicker 
                  date={settings.poDeliveryDate} 
                  setDate={(d) => setSettings(p => ({...p, poDeliveryDate: d}))} 
                  placeholder="Pilih Tanggal Pengiriman"
                />
                <p className="text-xs text-zinc-500">Kapan pesanan akan mulai didistribusikan.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80">
            <CardTitle className="text-lg">Jam Operasional Reguler</CardTitle>
            <CardDescription>
              Teks ini akan ditampilkan di bagian Footer website pembeli.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 w-full">
              <Label htmlFor="operationalSchedule" className="text-sm font-semibold">Deskripsi Jadwal</Label>
              <Textarea 
                id="operationalSchedule" 
                rows={5}
                value={settings.operationalSchedule} 
                onChange={handleChange}
                placeholder="Senin - Jumat: 09:00 - 17:00&#10;Sabtu: 09:00 - 15:00&#10;Minggu: Libur (Tutup PO)"
                className="font-mono text-sm"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Tiap baris akan ditampilkan secara berurutan di bagian Kontak website.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-6 pb-6 mt-4">
            <Button type="submit" disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-white ml-auto disabled:opacity-70">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Jadwal
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
