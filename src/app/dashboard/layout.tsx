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
  LayoutTemplate,
  Ticket
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const sidebarLinks = [
  { name: "Dasbor", href: "/dashboard", icon: LayoutDashboard, roles: ["Admin", "Kasir"] },
  { name: "Kasir POS", href: "/dashboard/pos", icon: ShoppingBag, roles: ["Admin", "Kasir"] },
  { name: "Pesanan", href: "/dashboard/pesanan", icon: ShoppingBag, roles: ["Admin", "Kasir", "Dapur"] },
  { name: "Menu", href: "/dashboard/menu", icon: Utensils, roles: ["Admin", "Kasir", "Dapur"] },
  { name: "Statistik", href: "/dashboard/statistik", icon: BarChart3, roles: ["Admin"] },
  { name: "Pesan", href: "/dashboard/message", icon: MessageSquare, roles: ["Admin", "Kasir"] },
  { name: "Pelanggan", href: "/dashboard/pelanggan", icon: Users, roles: ["Admin", "Kasir"] },
  { name: "Edit Website", href: "/dashboard/edit-website", icon: LayoutTemplate, roles: ["Admin"] },
  { name: "Promo", href: "/dashboard/promo", icon: Ticket, roles: ["Admin"] },
  { name: "Staf", href: "/dashboard/staf", icon: Users, roles: ["Admin"] },
  { name: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings, roles: ["Admin"] },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dasbor",
  "/dashboard/pos": "Kasir POS",
  "/dashboard/statistik": "Statistik",
  "/dashboard/pesanan": "Pesanan",
  "/dashboard/menu": "Menu",
  "/dashboard/message": "Pesan",
  "/dashboard/pelanggan": "Pelanggan",
  "/dashboard/jadwal": "Jadwal & PO",
  "/dashboard/edit-website": "Edit Website",
  "/dashboard/qr-code": "QR Code Toko",
  "/dashboard/sistem-penjualan": "Sistem Penjualan",
  "/dashboard/banner": "Pengaturan Banner",
  "/dashboard/tema": "Tema Warna",
  "/dashboard/logo": "Pengaturan Logo",
  "/dashboard/maps": "Pengaturan Maps",
  "/dashboard/font": "Tipografi (Font)",
  "/dashboard/kontak": "Sosial Media & Kontak",
  "/dashboard/pengumuman": "Pengaturan Teks Pengumuman",
  "/dashboard/seo": "SEO & Pencarian",
  "/dashboard/faq": "FAQ (Tanya Jawab)",
  "/dashboard/promo": "Promo & Diskon",
  "/dashboard/pengaturan": "Pengaturan",
  "/dashboard/staf": "Manajemen Staf",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [logoLight, setLogoLight] = useState("/logo_cumita.png");
  const [logoDark, setLogoDark] = useState<string>("/logo_tema_gelap.png");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userRole, setUserRole] = useState("Admin");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        const role = session.user?.user_metadata?.role || "Admin";
        setUserRole(role);
        
        // Whitelist approach for maximum security
        const allowedPathsKasir = ["/dashboard", "/dashboard/pesanan", "/dashboard/pelanggan", "/dashboard/menu", "/dashboard/message", "/dashboard/pos"];
        const allowedPathsDapur = ["/dashboard", "/dashboard/pesanan", "/dashboard/menu"];
        
        let hasAccess = true;
        
        // Exact match or sub-path (e.g. /dashboard/pesanan/123)
        const isPathAllowed = (allowedPaths: string[]) => {
          if (pathname === "/dashboard") return true;
          return allowedPaths.some(path => path !== "/dashboard" && (pathname === path || pathname.startsWith(path + "/")));
        };

        if (role === "Kasir") {
           hasAccess = isPathAllowed(allowedPathsKasir);
        } else if (role === "Dapur") {
           hasAccess = isPathAllowed(allowedPathsDapur);
        }
        
        if (!hasAccess) {
          toast.error("Anda tidak memiliki akses ke halaman ini");
          router.push("/dashboard");
          return;
        }

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
        router.push("/");
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
    };
  }, [router]);

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await supabase.auth.signOut();
    router.push("/");
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
        <div className="px-6 py-4">
          <Link href="/dashboard" className="flex items-center justify-center hover:opacity-80 transition-opacity">
            <img src={logoLight} alt="Cumita Logo" className="h-20 w-auto object-contain dark:hidden drop-shadow-md" />
            <img src={logoDark} alt="Cumita Logo" className="h-20 w-auto object-contain hidden dark:block drop-shadow-md" />
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {sidebarLinks.filter(link => link.roles.includes(userRole)).map((link, index, array) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <div key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    (isActive || (link.href === "/dashboard/edit-website" && ["/dashboard/banner", "/dashboard/tema", "/dashboard/logo", "/dashboard/maps", "/dashboard/qr-code"].includes(pathname)))
                      ? "bg-primary/10 text-primary" 
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.name}
                </Link>
                {index < array.length - 1 && (
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800/60 my-1 mx-2" />
                )}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => setShowLogoutDialog(true)}
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

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Keluar</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin keluar dari akun administrator?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end space-x-2 sm:space-x-4 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Batal
            </Button>
            <Button type="button" variant="destructive" onClick={handleLogout}>
              Ya, Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
