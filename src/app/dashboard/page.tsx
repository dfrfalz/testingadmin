"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { formatIDR } from "@/lib/utils";

const getStatusColor = (status: string) => {
  switch(status) {
    case "Pesanan Baru": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "Diproses": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "Dikirim": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "Selesai": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    default: return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("Admin");

  // Statistics State
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [processingOrdersCount, setProcessingOrdersCount] = useState(0);
  const [uniqueCustomersCount, setUniqueCustomersCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const role = session?.user?.user_metadata?.role || "Admin";
      setUserRole(role);
    });

    async function fetchDashboardData() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('short_id', 'like', 'CS-%')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setOrders(data);
        
        // Calculate stats
        let revenue = 0;
        let newOrders = 0;
        let processingOrders = 0;
        const uniqueCustomers = new Set();

        data.forEach((order) => {
          revenue += order.total;
          uniqueCustomers.add(order.customer_whatsapp); // Gunakan WA sebagai penanda unik pelanggan
          
          if (order.status === 'Pesanan Baru') newOrders++;
          if (order.status === 'Diproses') processingOrders++;
        });

        setTotalRevenue(revenue);
        setNewOrdersCount(newOrders);
        setProcessingOrdersCount(processingOrders);
        setUniqueCustomersCount(uniqueCustomers.size);
      }
      setLoading(false);
    }
    
    fetchDashboardData();

    // Opsional: Realtime subscription
    const channel = supabase
      .channel('public:orders:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        // Refresh data on any change
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Dapatkan tanggal hari ini untuk greeting
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Selamat Datang kembali, {userRole}!
          </h1>
          <p className="mt-1 text-[14px] text-zinc-500 dark:text-zinc-400">
            Berikut adalah ringkasan performa toko Anda pada hari {today}.
          </p>
        </div>
      </div>

      {/* Stats Cards dengan Glassmorphism & Soft Gradients */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Pendapatan */}
        <Card className="relative overflow-hidden border border-zinc-200/50 dark:border-orange-500/20 shadow-sm bg-white dark:bg-zinc-900/40 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 dark:bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
          <div className="absolute left-0 bottom-0 w-24 h-24 bg-orange-500/5 dark:bg-orange-500/5 rounded-full blur-2xl -ml-10 -mb-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Pendapatan</CardTitle>
            <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400 ring-1 ring-orange-100 dark:ring-orange-500/20 shadow-sm">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : formatIDR(totalRevenue)}
            </div>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-3 flex items-center bg-emerald-50 dark:bg-emerald-500/10 w-fit px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20">
              <TrendingUp className="h-3 w-3 mr-1" /> Live Update
            </p>
          </CardContent>
        </Card>
        
        {/* Card 2: Pesanan Baru */}
        <Card className="relative overflow-hidden border border-zinc-200/50 dark:border-blue-500/20 shadow-sm bg-white dark:bg-zinc-900/40 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
          <div className="absolute left-0 bottom-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-2xl -ml-10 -mb-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Pesanan Baru</CardTitle>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-500/20 shadow-sm">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : newOrdersCount}
            </div>
            <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mt-3">
              Menunggu untuk diproses
            </p>
          </CardContent>
        </Card>
        
        {/* Card 3: Total Pelanggan */}
        <Card className="relative overflow-hidden border border-zinc-200/50 dark:border-purple-500/20 shadow-sm bg-white dark:bg-zinc-900/40 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
          <div className="absolute left-0 bottom-0 w-24 h-24 bg-purple-500/5 dark:bg-purple-500/5 rounded-full blur-2xl -ml-10 -mb-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Pelanggan</CardTitle>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 ring-1 ring-purple-100 dark:ring-purple-500/20 shadow-sm">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : uniqueCustomersCount}
            </div>
            <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mt-3">
              Pelanggan terdaftar unik
            </p>
          </CardContent>
        </Card>
        
        {/* Card 4: Pesanan Diproses */}
        <Card className="relative overflow-hidden border border-zinc-200/50 dark:border-amber-500/20 shadow-sm bg-white dark:bg-zinc-900/40 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
          <div className="absolute left-0 bottom-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-2xl -ml-10 -mb-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Dalam Proses</CardTitle>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-500/20 shadow-sm">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : processingOrdersCount}
            </div>
            <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mt-3">
              Pesanan sedang disiapkan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table - Modernized */}
      <Card className="border border-zinc-200/50 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/40 backdrop-blur-xl overflow-hidden mt-2">
        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-5">
          <CardTitle className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100">Aktivitas Pesanan Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs font-semibold text-zinc-500 uppercase bg-zinc-50/80 dark:bg-zinc-900/50 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider">ID Pesanan</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Pelanggan</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Waktu</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Total Pembayaran</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Alamat Pengiriman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-zinc-500 text-sm">Menyinkronkan data...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShoppingBag className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                        <p>Belum ada pesanan yang masuk hari ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 6).map((order) => {
                    const orderDate = new Date(order.created_at).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    });

                    return (
                      <tr key={order.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30 transition-colors group">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {order.short_id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-700 dark:text-zinc-300">{order.customer_name}</div>
                          <div className="text-xs text-zinc-400 mt-0.5">{order.customer_whatsapp}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{orderDate}</td>
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{formatIDR(order.total)}</td>
                        <td className="px-6 py-4">
                          <Badge className={`${getStatusColor(order.status)} border-0 rounded-full px-3 py-1 font-medium shadow-sm`} variant="outline">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2" title={order.customer_address || '-'}>
                            {order.customer_address || '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
