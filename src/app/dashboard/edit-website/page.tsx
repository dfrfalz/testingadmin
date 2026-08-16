"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Presentation, Palette, Stamp, MapPin, ChevronRight, LayoutTemplate, Megaphone, Share2, Type, Globe, HelpCircle, Medal, ListOrdered, MessageSquareQuote, ShoppingBag, QrCode, CreditCard } from "lucide-react";

const editOptions = [
  {
    title: "QR Code Toko",
    description: "Buat dan unduh QR Code khusus untuk website Anda (mendukung tema terang/gelap).",
    icon: QrCode,
    href: "/dashboard/qr-code",
    color: "bg-slate-500/10 text-slate-500 border border-slate-500/20"
  },
  {
    title: "Metode Pembayaran",
    description: "Atur rekening bank, e-wallet (seperti DANA), dan unggah QRIS toko Anda.",
    icon: CreditCard,
    href: "/dashboard/pembayaran",
    color: "bg-green-500/10 text-green-500 border border-green-500/20"
  },
  {
    title: "Banner Beranda",
    description: "Ubah gambar banner utama yang tampil di halaman depan website.",
    icon: Presentation,
    href: "/dashboard/banner",
    color: "bg-blue-500/10 text-blue-500 border border-blue-500/20"
  },
  {
    title: "Tema Warna",
    description: "Atur palet warna utama (Primer & Sekunder) untuk identitas merek.",
    icon: Palette,
    href: "/dashboard/tema",
    color: "bg-purple-500/10 text-purple-500 border border-purple-500/20"
  },
  {
    title: "Logo Website",
    description: "Ganti logo terang dan gelap yang muncul di navigasi atas.",
    icon: Stamp,
    href: "/dashboard/logo",
    color: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
  },
  {
    title: "Peta Lokasi Toko",
    description: "Atur titik kordinat Google Maps yang disematkan di Footer.",
    icon: MapPin,
    href: "/dashboard/maps",
    color: "bg-orange-500/10 text-orange-500 border border-orange-500/20"
  },
  {
    title: "Teks Pengumuman",
    description: "Atur teks berjalan (promo/info) di bagian paling atas website.",
    icon: Megaphone,
    href: "/dashboard/pengumuman",
    color: "bg-pink-500/10 text-pink-500 border border-pink-500/20"
  },
  {
    title: "Sosial Media & Kontak",
    description: "Ubah nomor WhatsApp, Instagram, dan tautan sosial media di Footer.",
    icon: Share2,
    href: "/dashboard/kontak",
    color: "bg-teal-500/10 text-teal-500 border border-teal-500/20"
  },
  {
    title: "Jenis Font",
    description: "Pilih gaya huruf (font) yang sesuai dengan karakter bisnis Anda.",
    icon: Type,
    href: "/dashboard/font",
    color: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
  },
  {
    title: "SEO & Pencarian",
    description: "Atur judul, deskripsi, dan kata kunci website untuk mesin pencari Google.",
    icon: Globe,
    href: "/dashboard/seo",
    color: "bg-rose-500/10 text-rose-500 border border-rose-500/20"
  },
  {
    title: "FAQ - Tanya Jawab",
    description: "Atur daftar pertanyaan dan jawaban yang sering diajukan pelanggan.",
    icon: HelpCircle,
    href: "/dashboard/faq",
    color: "bg-amber-500/10 text-amber-500 border border-amber-500/20"
  },
  {
    title: "Keunggulan",
    description: "Ubah teks sub-judul dan daftar keunggulan produk (Kenapa Memilih Kami).",
    icon: Medal,
    href: "/dashboard/keunggulan",
    color: "bg-fuchsia-500/10 text-fuchsia-500 border border-fuchsia-500/20"
  },
  {
    title: "Cara Pesan",
    description: "Ubah teks sub-judul, judul, dan langkah-langkah pemesanan (Cara Mudah Pesan).",
    icon: ListOrdered,
    href: "/dashboard/cara-pesan",
    color: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
  },
  {
    title: "Testimoni Pelanggan",
    description: "Kelola ulasan dan komentar dari pelanggan yang tampil di halaman depan.",
    icon: MessageSquareQuote,
    href: "/dashboard/testimoni",
    color: "bg-sky-500/10 text-sky-500 border border-sky-500/20"
  },
  {
    title: "Sistem Penjualan",
    description: "Pilih model bisnis toko Anda: Ready Stock, Pre-Order, MTO, Open Order, dan lainnya.",
    icon: ShoppingBag,
    href: "/dashboard/sistem-penjualan",
    color: "bg-violet-500/10 text-violet-500 border border-violet-500/20"
  }
];

export default function EditWebsitePage() {
  return (
    <div className="w-full max-w-none space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6" /> Edit Penampilan Website
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Kustomisasi tampilan visual, warna, logo, dan identitas website CUMITA Anda dari satu tempat terpusat. Pilih salah satu menu di bawah ini untuk mulai mengedit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {editOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link key={option.title} href={option.href} className="group outline-none block">
              <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 group-focus-visible:ring-2 ring-primary relative overflow-hidden">
                <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:-translate-x-2 group-hover:translate-y-2 transition-all duration-500">
                   <Icon className="h-24 w-24 text-zinc-900 dark:text-zinc-100" />
                </div>
                <CardContent className="p-5 flex items-start gap-4 relative z-10">
                  <div className="mt-0.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors flex items-center gap-2">
                        {option.title}
                        {(option as any).isComingSoon && (
                          <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Segera</span>
                        )}
                      </h3>
                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 pr-2 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
