"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  Utensils,
  MessageSquare,
  BarChart3,
  CalendarClock,
  Image as ImageIcon,
  Palette,
  Image,
  MapPin,
  LayoutTemplate
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const sidebarLinks = [
  { name: "Dasbor", href: "/dashboard", icon: LayoutDashboard },
  { name: "Statistik", href: "/dashboard/statistik", icon: BarChart3 },
  { name: "Pesanan", href: "/dashboard/pesanan", icon: ShoppingBag },
  { name: "Menu", href: "/dashboard/menu", icon: Utensils },
  { name: "Pesan", href: "/dashboard/message", icon: MessageSquare },
  { name: "Pelanggan", href: "/dashboard/pelanggan", icon: Users },
  { name: "Jadwal", href: "/dashboard/jadwal", icon: CalendarClock },
  { name: "Edit Website", href: "/dashboard/edit-website", icon: LayoutTemplate },
  { name: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dasbor",
  "/dashboard/statistik": "Statistik",
  "/dashboard/pesanan": "Pesanan",
  "/dashboard/menu": "Menu",
  "/dashboard/message": "Pesan",
  "/dashboard/pelanggan": "Pelanggan",
  "/dashboard/jadwal": "Jadwal",
  "/dashboard/edit-website": "Edit Website",
  "/dashboard/banner": "Pengaturan Banner",
  "/dashboard/tema": "Tema Warna",
  "/dashboard/logo": "Pengaturan Logo",
  "/dashboard/maps": "Pengaturan Maps",
  "/dashboard/font": "Tipografi (Font)",
  "/dashboard/kontak": "Sosial Media & Kontak",
  "/dashboard/pengumuman": "Pengaturan Teks Pengumuman",
  "/dashboard/seo": "SEO & Pencarian",
  "/dashboard/faq": "FAQ (Tanya Jawab)",
  "/dashboard/pengaturan": "Pengaturan",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [logoLight, setLogoLight] = useState("/logo_cumita.png");
  const [logoDark, setLogoDark] = useState("/logo_tema_gelap.png");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        // Fetch custom logos
        const { data: settingsData } = await supabase
          .from('store_settings')
          .select('logo_light_url, logo_dark_url')
          .eq('id', 'default')
          .single();
        
        if (settingsData) {
          if (settingsData.logo_light_url) setLogoLight(settingsData.logo_light_url);
          if (settingsData.logo_dark_url) setLogoDark(settingsData.logo_dark_url);
        }
        setIsLoadingAuth(false);
      }
    };

    checkAuth();

    // Listen for instant logo updates from LogoPage
    const handleLogoUpdate = (e: any) => {
      if (e.detail?.logoLightUrl) setLogoLight(e.detail.logoLightUrl);
      if (e.detail?.logoDarkUrl) setLogoDark(e.detail.logoDarkUrl);
    };

    window.addEventListener('logo-updated', handleLogoUpdate);

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push("/login");
      }
    });

    // Real-time subscription untuk pesanan baru
    const channel = supabase
      .channel('layout-orders-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        setNotifCount(prev => prev + 1);
        toast("Pesanan Baru Masuk! 🎉", {
          description: "Seseorang baru saja melakukan pemesanan di website.",
          action: {
            label: "Lihat",
            onClick: () => router.push("/dashboard/pesanan"),
          },
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-zinc-200 transition-transform duration-300 lg:static lg:translate-x-0 dark:bg-zinc-900 dark:border-zinc-800 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 justify-center py-2 mb-2 hover:opacity-80 transition-opacity">
            <img src={logoLight} alt="Cumita Logo" className="h-14 w-auto object-contain dark:hidden drop-shadow-md" />
            <img src={logoDark} alt="Cumita Logo" className="h-14 w-auto object-contain hidden dark:block drop-shadow-md" />
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  (isActive || (link.href === "/dashboard/edit-website" && ["/dashboard/banner", "/dashboard/tema", "/dashboard/logo", "/dashboard/maps"].includes(pathname)))
                    ? "bg-primary/10 text-primary" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-20 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6 lg:px-8 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-zinc-500 hover:text-zinc-900 lg:hidden dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {pageTitles[pathname] || "Dasbor"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              className="relative text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              onClick={() => {
                setNotifCount(0);
                router.push("/dashboard/pesanan");
              }}
            >
              <Bell className="h-5 w-5" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </button>
            <div className="h-8 w-8 rounded-full bg-zinc-200 border-2 border-zinc-300 overflow-hidden dark:bg-zinc-700 dark:border-zinc-600">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-zinc-50 p-4 sm:p-6 lg:p-8 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}
