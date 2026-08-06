"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Presentation, Palette, Stamp, MapPin, ChevronRight, LayoutTemplate, Megaphone, Share2, Type, Globe, HelpCircle, Sparkles, ListOrdered } from "lucide-react";

const editOptions = [
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
    title: "Peta Lokasi (Maps)",
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
    title: "Tipografi (Font)",
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
    title: "FAQ (Tanya Jawab)",
    description: "Atur daftar pertanyaan dan jawaban yang sering diajukan pelanggan.",
    icon: HelpCircle,
    href: "/dashboard/faq",
    color: "bg-amber-500/10 text-amber-500 border border-amber-500/20"
  },
  {
    title: "Keunggulan",
    description: "Ubah teks sub-judul dan daftar keunggulan produk (Kenapa Memilih Kami).",
    icon: Sparkles,
    href: "/dashboard/keunggulan",
    color: "bg-fuchsia-500/10 text-fuchsia-500 border border-fuchsia-500/20"
  },
  {
    title: "Cara Pesan",
    description: "Ubah teks sub-judul, judul, dan langkah-langkah pemesanan (Cara Mudah Pesan).",
    icon: ListOrdered,
    href: "/dashboard/cara-pesan",
    color: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
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
              <Card className="h-full border-zinc-200 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all hover:border-primary/50 dark:hover:border-primary/50 bg-white dark:bg-zinc-900 group-focus-visible:ring-2 ring-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                   <Icon className="h-24 w-24" />
                </div>
                <CardContent className="p-6 flex items-start gap-5 relative z-10">
                  <div className={`p-3.5 rounded-2xl ${option.color} shadow-inner`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-1.5 pt-1">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors flex justify-between items-center gap-2">
                      <span className="flex items-center gap-2">
                        {option.title}
                        {(option as any).isComingSoon && (
                          <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Segera</span>
                        )}
                      </span>
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full group-hover:bg-primary/10 transition-colors shrink-0">
                        <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-zinc-500 group-hover:text-primary" />
                      </div>
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pr-6">
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
