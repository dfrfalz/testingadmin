"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Loader2,
  ShoppingBag,
  CalendarClock,
  Hammer,
  RefreshCw,
  BookMarked,
  Repeat2,
  Users,
  Sliders,
  ArrowLeft,
  CalendarIcon,
  Save,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type SystemId =
  | "ready_stock"
  | "po"
  | "mto"
  | "open_order"
  | "booking"
  | "subscription"
  | "grosir"
  | "custom";

type Settings = {
  sellingSystem: SystemId;
  status: string;
  startDate: string;
  endDate: string;
  deliveryDate: string;
  schedule: string;
};

type SystemDef = {
  id: SystemId;
  name: string;
  description: string;
  icon: React.ElementType;
};

// ─── System Definitions ───────────────────────────────────────────────────────

const systems: SystemDef[] = [
  { id: "ready_stock",  name: "Ready Stock",            description: "Produk selalu tersedia, langsung dikirim.",           icon: ShoppingBag  },
  { id: "po",           name: "Pre-Order (PO)",          description: "Pesanan dikumpulkan, lalu diproses sesuai jadwal.",   icon: CalendarClock },
  { id: "mto",          name: "Made to Order (MTO)",     description: "Dibuat setelah ada pesanan, tanpa jadwal PO.",        icon: Hammer        },
  { id: "open_order",   name: "Open Order (OO)",         description: "Dibuka dalam periode atau kuota tertentu.",           icon: RefreshCw     },
  { id: "booking",      name: "Booking / Reservasi",     description: "Pelanggan amankan stok lebih dulu dengan DP.",        icon: BookMarked    },
  { id: "subscription", name: "Subscription / Langganan",description: "Pengiriman berkala — mingguan atau bulanan.",         icon: Repeat2       },
  { id: "grosir",       name: "Grosir / Reseller",       description: "Harga khusus berdasarkan jumlah pembelian.",          icon: Users         },
  { id: "custom",       name: "Custom Order",            description: "Pelanggan sesuaikan pesanan sendiri.",                icon: Sliders       },
];

// ─── Primitives (defined at module level — NEVER inside another component) ───

function DatePicker({ date, setDate, placeholder }: { date: string; setDate: (d: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  let parsedDate: Date | undefined;
  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) parsedDate = d;
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start text-left font-normal",
          !date && "text-zinc-500"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {parsedDate ? format(parsedDate, "PPP", { locale: id }) : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={(d) => { setDate(d ? d.toISOString() : ""); setOpen(false); }}
        />
      </PopoverContent>
    </Popover>
  );
}

function StatusToggle({
  isOpen,
  openLabel,
  closedLabel,
  onToggle,
}: {
  isOpen: boolean;
  openLabel: string;
  closedLabel: string;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Status</p>
        <p className="text-xs text-zinc-500 mt-0.5">{isOpen ? openLabel : closedLabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold ${isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}>
          {isOpen ? "Buka" : "Tutup"}
        </span>
        <Switch
          checked={isOpen}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

// ─── Settings Panel (defined at module level, NOT inside page component) ──────

function SettingsPanel({
  settings,
  onStatusToggle,
  onStartDateChange,
  onEndDateChange,
  onDeliveryDateChange,
  onScheduleChange,
}: {
  settings: Settings;
  onStatusToggle: (v: boolean) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onDeliveryDateChange: (v: string) => void;
  onScheduleChange: (v: string) => void;
}) {
  const { sellingSystem: sys, status, startDate, endDate, deliveryDate, schedule } = settings;
  const isOpen = status === "open";

  if (sys === "ready_stock") return (
    <div className="space-y-5">
      <StatusToggle isOpen={isOpen} onToggle={onStatusToggle} openLabel="Toko sedang buka — pesanan langsung diproses." closedLabel="Toko sedang tutup sementara." />
      <FieldRow label="Jam Operasional" hint="Tampil di footer website.">
        <Textarea rows={4} value={schedule} onChange={(e) => onScheduleChange(e.target.value)} placeholder={"Senin – Jumat: 09.00 – 17.00\nSabtu: 09.00 – 14.00\nMinggu: Tutup"} className="font-mono text-sm resize-none" />
      </FieldRow>
    </div>
  );

  if (sys === "po") return (
    <div className="space-y-5">
      <StatusToggle isOpen={isOpen} onToggle={onStatusToggle} openLabel="Pre-Order sedang dibuka untuk pelanggan." closedLabel="Pre-Order sedang ditutup." />
      <FieldRow label="Tanggal Mulai PO" hint="Kapan periode PO ini mulai dibuka.">
        <DatePicker date={startDate} setDate={onStartDateChange} placeholder="Pilih tanggal mulai" />
      </FieldRow>
      <FieldRow label="Batas Pemesanan" hint="Tenggat terakhir pelanggan dapat memesan.">
        <DatePicker date={endDate} setDate={onEndDateChange} placeholder="Pilih tanggal tutup" />
      </FieldRow>
      <FieldRow label="Jadwal Pengiriman" hint="Kapan pesanan mulai didistribusikan.">
        <DatePicker date={deliveryDate} setDate={onDeliveryDateChange} placeholder="Pilih tanggal pengiriman" />
      </FieldRow>
      <FieldRow label="Catatan PO" hint="Informasi tambahan yang ditampilkan ke pelanggan.">
        <Textarea rows={3} value={schedule} onChange={(e) => onScheduleChange(e.target.value)} placeholder="Contoh: Minimal order 2 pcs. Pembayaran full di depan." className="text-sm resize-none" />
      </FieldRow>
    </div>
  );

  if (sys === "mto") return (
    <div className="space-y-5">
      <StatusToggle isOpen={isOpen} onToggle={onStatusToggle} openLabel="Sedang menerima pesanan Made-to-Order." closedLabel="Sementara tidak menerima pesanan baru." />
      <FieldRow label="Estimasi Waktu Proses" hint="Berapa hari pesanan selesai dibuat.">
        <Input value={schedule} onChange={(e) => onScheduleChange(e.target.value)} placeholder="Contoh: 2 – 3 hari kerja" />
      </FieldRow>
    </div>
  );

  if (sys === "open_order") return (
    <div className="space-y-5">
      <StatusToggle isOpen={isOpen} onToggle={onStatusToggle} openLabel="Open Order sedang aktif." closedLabel="Open Order sedang ditutup." />
      <FieldRow label="Periode Mulai" hint="Kapan pemesanan dibuka.">
        <DatePicker date={startDate} setDate={onStartDateChange} placeholder="Pilih tanggal mulai" />
      </FieldRow>
      <FieldRow label="Periode Tutup" hint="Kapan pemesanan ditutup atau kuota habis.">
        <DatePicker date={endDate} setDate={onEndDateChange} placeholder="Pilih tanggal tutup" />
      </FieldRow>
      <FieldRow label="Jadwal Pengiriman" hint="Kapan pesanan dikirim setelah periode tutup.">
        <DatePicker date={deliveryDate} setDate={onDeliveryDateChange} placeholder="Pilih tanggal pengiriman" />
      </FieldRow>
      <FieldRow label="Info Kuota" hint="Tampilkan info kuota atau slot yang tersedia.">
        <Input value={schedule} onChange={(e) => onScheduleChange(e.target.value)} placeholder="Contoh: Kuota 50 pcs per periode" />
      </FieldRow>
    </div>
  );

  if (sys === "booking") return (
    <div className="space-y-5">
      <StatusToggle isOpen={isOpen} onToggle={onStatusToggle} openLabel="Booking sedang dibuka." closedLabel="Booking sedang ditutup." />
      <FieldRow label="Deadline Booking" hint="Batas terakhir pelanggan bisa melakukan booking.">
        <DatePicker date={endDate} setDate={onEndDateChange} placeholder="Pilih deadline booking" />
      </FieldRow>
      <FieldRow label="Jadwal Pengambilan / Pengiriman" hint="Kapan produk bisa diambil atau dikirim.">
        <DatePicker date={deliveryDate} setDate={onDeliveryDateChange} placeholder="Pilih tanggal ambil/kirim" />
      </FieldRow>
      <FieldRow label="Info DP & Ketentuan" hint="Ditampilkan ke pelanggan di halaman jadwal.">
        <Textarea rows={3} value={schedule} onChange={(e) => onScheduleChange(e.target.value)} placeholder="Contoh: DP minimal 50% untuk konfirmasi slot." className="text-sm resize-none" />
      </FieldRow>
    </div>
  );

  if (sys === "subscription") return (
    <div className="space-y-5">
      <StatusToggle isOpen={isOpen} onToggle={onStatusToggle} openLabel="Pendaftaran langganan dibuka." closedLabel="Pendaftaran langganan ditutup." />
      <FieldRow label="Frekuensi Pengiriman" hint="Seberapa sering produk dikirim ke pelanggan.">
        <Input value={startDate} onChange={(e) => onStartDateChange(e.target.value)} placeholder="Contoh: Setiap minggu / Setiap bulan" />
      </FieldRow>
      <FieldRow label="Hari Pengiriman" hint="Hari apa produk dikirim setiap periode.">
        <Input value={endDate} onChange={(e) => onEndDateChange(e.target.value)} placeholder="Contoh: Setiap Senin" />
      </FieldRow>
      <FieldRow label="Info Langganan" hint="Ketentuan dan cara daftar langganan.">
        <Textarea rows={3} value={schedule} onChange={(e) => onScheduleChange(e.target.value)} placeholder="Contoh: Langganan mingguan. Pembayaran di awal setiap bulan." className="text-sm resize-none" />
      </FieldRow>
    </div>
  );

  if (sys === "grosir") return (
    <div className="space-y-5">
      <StatusToggle isOpen={isOpen} onToggle={onStatusToggle} openLabel="Menerima pesanan grosir." closedLabel="Pesanan grosir sementara ditutup." />
      <FieldRow label="Minimum Order" hint="Jumlah minimum pembelian untuk harga grosir.">
        <Input value={startDate} onChange={(e) => onStartDateChange(e.target.value)} placeholder="Contoh: Minimal 10 pcs per item" />
      </FieldRow>
      <FieldRow label="Jam Layanan & Info Pemesanan" hint="Tampil di halaman jadwal website.">
        <Textarea rows={4} value={schedule} onChange={(e) => onScheduleChange(e.target.value)} placeholder={"Senin – Jumat: 09.00 – 17.00\nHub. WhatsApp untuk negosiasi harga."} className="text-sm resize-none" />
      </FieldRow>
    </div>
  );

  if (sys === "custom") return (
    <div className="space-y-5">
      <StatusToggle isOpen={isOpen} onToggle={onStatusToggle} openLabel="Menerima pesanan custom." closedLabel="Pesanan custom sementara ditutup." />
      <FieldRow label="Estimasi Waktu Pengerjaan" hint="Berapa hari pesanan custom selesai.">
        <Input value={startDate} onChange={(e) => onStartDateChange(e.target.value)} placeholder="Contoh: 3 – 5 hari kerja" />
      </FieldRow>
      <FieldRow label="Opsi Kustomisasi & Ketentuan" hint="Ditampilkan ke pelanggan di halaman jadwal.">
        <Textarea rows={4} value={schedule} onChange={(e) => onScheduleChange(e.target.value)} placeholder={"Tersedia: tingkat pedas, ukuran porsi, varian bumbu.\nMinimal order 2 pcs untuk custom order."} className="text-sm resize-none" />
      </FieldRow>
    </div>
  );

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const defaultSettings: Settings = {
  sellingSystem: "po",
  status: "open",
  startDate: "",
  endDate: "",
  deliveryDate: "",
  schedule: "",
};

export default function SistemPenjualanPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [savedSystem, setSavedSystem] = useState<SystemId>("po");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("selling_system, po_status, po_start_date, po_end_date, po_delivery_date, operational_schedule")
        .eq("id", "default")
        .single();

      if (data) {
        const sys = (data.selling_system as SystemId) || "po";
        setSavedSystem(sys);
        setSettings({
          sellingSystem: sys,
          status: data.po_status || "open",
          startDate: data.po_start_date || "",
          endDate: data.po_end_date || "",
          deliveryDate: data.po_delivery_date || "",
          schedule: data.operational_schedule || "",
        });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Stable callbacks — one per field to avoid re-creating on every render
  const handleStatusToggle = useCallback((v: boolean) => setSettings(p => ({ ...p, status: v ? "open" : "closed" })), []);
  const handleStartDateChange = useCallback((v: string) => setSettings(p => ({ ...p, startDate: v })), []);
  const handleEndDateChange = useCallback((v: string) => setSettings(p => ({ ...p, endDate: v })), []);
  const handleDeliveryDateChange = useCallback((v: string) => setSettings(p => ({ ...p, deliveryDate: v })), []);
  const handleScheduleChange = useCallback((v: string) => setSettings(p => ({ ...p, schedule: v })), []);

  const handleSystemSelect = (sys: SystemId) => {
    setSettings(prev => ({ ...prev, sellingSystem: sys }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .update({
        selling_system: settings.sellingSystem,
        po_status: settings.status,
        po_start_date: settings.startDate || null,
        po_end_date: settings.endDate || null,
        po_delivery_date: settings.deliveryDate || null,
        operational_schedule: settings.schedule,
        is_midtrans_production: isMidtransProduction,
      })
      .eq("id", "default");

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      setSavedSystem(settings.sellingSystem);
      toast.success("Pengaturan sistem penjualan disimpan!");
    }
    setSaving(false);
  };

  const selectedDef = systems.find(s => s.id === settings.sellingSystem);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Link href="/dashboard/edit-website" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Sistem Penjualan</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-8">
          Pilih model bisnis toko Anda. Tampilan halaman jadwal di website pelanggan akan menyesuaikan secara otomatis.
        </p>
      </div>

      {/* Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* LEFT — System List */}
        <div className="lg:w-[320px] shrink-0 w-full">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {systems.map((sys) => {
              const Icon = sys.icon;
              const isSelected = settings.sellingSystem === sys.id;
              const isSaved = savedSystem === sys.id;

              return (
                <button
                  key={sys.id}
                  onClick={() => handleSystemSelect(sys.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors ${
                    isSelected
                      ? "bg-primary/5 dark:bg-primary/10"
                      : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-zinc-800 dark:text-zinc-200"}`}>
                        {sys.name}
                      </span>
                      {isSaved && (
                        <span className="text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{sys.description}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? "text-primary" : "text-zinc-300 dark:text-zinc-600"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Settings Panel */}
        <div className="flex-1 w-full">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            {/* Panel Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                {selectedDef && (
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <selectedDef.icon className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedDef?.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{selectedDef?.description}</p>
                </div>
              </div>
            </div>

            {/* Panel Body */}
            <div className="p-6">
              <SettingsPanel
                settings={settings}
                onStatusToggle={handleStatusToggle}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onDeliveryDateChange={handleDeliveryDateChange}
                onScheduleChange={handleScheduleChange}
              />
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
