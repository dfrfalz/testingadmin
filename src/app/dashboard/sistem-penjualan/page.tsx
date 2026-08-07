"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Loader2, 
  ShoppingBag, 
  CalendarClock, 
  Hammer, 
  RefreshCw, 
  BookMarked, 
  Repeat2, 
  Users, 
  Sliders,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

type SellingSystem = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  scheduleNote: string;
};

const sellingSystems: SellingSystem[] = [
  {
    id: "ready_stock",
    name: "Ready Stock",
    description: "Produk sudah tersedia dan bisa langsung dibeli.",
    icon: ShoppingBag,
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    scheduleNote: "Halaman jadwal akan menampilkan status buka/tutup toko dan jam operasional."
  },
  {
    id: "po",
    name: "Pre-Order (PO)",
    description: "Produk dibuat atau diproses setelah ada pesanan, biasanya mengikuti jadwal tertentu.",
    icon: CalendarClock,
    color: "bg-primary/10 text-primary border-primary/20",
    scheduleNote: "Halaman jadwal tetap sama — menampilkan Mulai PO, Batas PO, dan Jadwal Pengiriman."
  },
  {
    id: "mto",
    name: "Made to Order (MTO)",
    description: "Produk dibuat setelah pelanggan memesan dan langsung diproses, tanpa menunggu periode PO.",
    icon: Hammer,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    scheduleNote: "Halaman jadwal menampilkan status penerimaan pesanan dan estimasi waktu proses."
  },
  {
    id: "open_order",
    name: "Open Order (OO)",
    description: "Pemesanan dibuka dalam periode atau kuota tertentu, lalu ditutup saat kuota terpenuhi.",
    icon: RefreshCw,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    scheduleNote: "Halaman jadwal menampilkan periode pemesanan, kuota, dan status slot."
  },
  {
    id: "booking",
    name: "Booking / Reservasi",
    description: "Pelanggan memesan dan mengamankan stok terlebih dahulu, biasanya dengan DP.",
    icon: BookMarked,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    scheduleNote: "Halaman jadwal menampilkan jadwal pengambilan/pengiriman dan info DP."
  },
  {
    id: "subscription",
    name: "Subscription / Langganan",
    description: "Pelanggan berlangganan dan menerima produk secara berkala (mingguan/bulanan).",
    icon: Repeat2,
    color: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    scheduleNote: "Halaman jadwal menampilkan jadwal pengiriman berkala dan periode berlangganan."
  },
  {
    id: "grosir",
    name: "Grosir / Reseller",
    description: "Penjualan dengan harga khusus berdasarkan jumlah pembelian.",
    icon: Users,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    scheduleNote: "Halaman jadwal menampilkan jam operasional dan info pemesanan grosir."
  },
  {
    id: "custom",
    name: "Custom Order",
    description: "Pelanggan dapat menyesuaikan pesanan, misalnya tingkat pedas, ukuran, atau varian.",
    icon: Sliders,
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    scheduleNote: "Halaman jadwal menampilkan info kustomisasi yang tersedia dan jam penerimaan."
  }
];

export default function SistemPenjualanPage() {
  const [currentSystem, setCurrentSystem] = useState<string>("po");
  const [selectedSystem, setSelectedSystem] = useState<string>("po");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCurrent = async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("selling_system")
        .eq("id", "default")
        .single();

      if (data?.selling_system) {
        setCurrentSystem(data.selling_system);
        setSelectedSystem(data.selling_system);
      }
      setLoading(false);
    };
    fetchCurrent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ selling_system: selectedSystem, updated_at: new Date().toISOString() })
      .eq("id", "default");

    if (error) {
      toast.error("Gagal menyimpan sistem penjualan.");
    } else {
      setCurrentSystem(selectedSystem);
      toast.success("Sistem penjualan berhasil diperbarui!");
    }
    setSaving(false);
  };

  const hasChanged = selectedSystem !== currentSystem;
  const selectedData = sellingSystems.find(s => s.id === selectedSystem);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Link 
            href="/dashboard/edit-website" 
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Sistem Penjualan</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-8">
          Pilih sistem penjualan yang sesuai dengan model bisnis toko Anda. Pilihan ini akan mengubah tampilan halaman Jadwal di website pelanggan.
        </p>
      </div>

      {/* Current System Badge */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Sistem saat ini: <strong className="text-zinc-900 dark:text-zinc-100">
            {sellingSystems.find(s => s.id === currentSystem)?.name ?? currentSystem}
          </strong>
        </span>
      </div>

      {/* System Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
        {sellingSystems.map((system) => {
          const Icon = system.icon;
          const isSelected = selectedSystem === system.id;
          const isCurrent = currentSystem === system.id;

          return (
            <button
              key={system.id}
              onClick={() => setSelectedSystem(system.id)}
              className={`text-left w-full rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg border shrink-0 mt-0.5 ${system.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-zinc-900 dark:text-zinc-100"}`}>
                      {system.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {system.description}
                  </p>
                </div>
                <div className={`mt-1 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  isSelected ? "border-primary bg-primary" : "border-zinc-300 dark:border-zinc-700"
                }`}>
                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Schedule Preview Note */}
      {selectedData && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Tampilan Jadwal:</strong> {selectedData.scheduleNote}
          </p>
        </div>
      )}

      {/* PO Settings Link */}
      {selectedSystem === "po" && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Atur Jadwal Pre-Order</p>
            <p className="text-xs text-zinc-500 mt-0.5">Atur tanggal buka, tutup, dan pengiriman PO.</p>
          </div>
          <Link href="/dashboard/jadwal">
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarClock className="h-4 w-4" /> Atur Jadwal PO
            </Button>
          </Link>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanged || saving}
          className="gap-2 min-w-[160px] bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}
