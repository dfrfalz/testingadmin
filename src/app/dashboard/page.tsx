"use client";

import { useEffect, useState } from "react";
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

  // Statistics State
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [processingOrdersCount, setProcessingOrdersCount] = useState(0);
  const [uniqueCustomersCount, setUniqueCustomersCount] = useState(0);

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : formatIDR(totalRevenue)}
            </div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> Live update
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pesanan Baru</CardTitle>
            <ShoppingBag className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : newOrdersCount}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Belum diproses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : uniqueCustomersCount}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Pelanggan terdaftar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pesanan Diproses</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : processingOrdersCount}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Menunggu pengiriman</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pesanan Terbaru (Live)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">ID Pesanan</th>
                  <th className="px-4 py-3 font-medium">Pelanggan</th>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      Memuat data dari database...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      Belum ada pesanan yang masuk.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((order) => {
                    const orderDate = new Date(order.created_at).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    });

                    return (
                      <tr key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{order.short_id}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{order.customer_name}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{orderDate}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{formatIDR(order.total)}</td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(order.status)} variant="outline">
                            {order.status}
                          </Badge>
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
