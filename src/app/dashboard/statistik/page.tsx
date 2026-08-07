"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { supabase } from "@/lib/supabase";
import { formatIDR } from "@/lib/utils";
import { TrendingUp, Users, ShoppingBag, DollarSign, Calendar } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StatistikPage() {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0
  });
  
  const [salesByDay, setSalesByDay] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStatistik() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('short_id', 'like', 'CS-%')
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        let revenue = 0;
        const uniqueCustomers = new Set();
        const dailySalesMap = new Map();
        const itemSalesMap = new Map();
        const statusMap = new Map();

        data.forEach(order => {
          // Summary
          revenue += order.total;
          uniqueCustomers.add(order.customer_whatsapp);

          // Daily Sales
          const date = new Date(order.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
          dailySalesMap.set(date, (dailySalesMap.get(date) || 0) + order.total);

          // Top Items
          if (Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              itemSalesMap.set(item.name, (itemSalesMap.get(item.name) || 0) + item.qty);
            });
          }

          // Order Status
          statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
        });

        setSummaryData({
          totalRevenue: revenue,
          totalOrders: data.length,
          totalCustomers: uniqueCustomers.size,
          avgOrderValue: data.length > 0 ? revenue / data.length : 0
        });

        // Format Daily Sales Data
        const salesChartData = Array.from(dailySalesMap.entries()).map(([date, total]) => ({
          date,
          total
        }));
        setSalesByDay(salesChartData);

        // Format Top Items Data
        const topItemsData = Array.from(itemSalesMap.entries())
          .map(([name, qty]) => ({ name, value: qty }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5
        setTopItems(topItemsData);

        // Format Status Data
        const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({
          name,
          value
        }));
        setOrderStatusData(statusData);
      }
      setLoading(false);
    }

    fetchStatistik();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
          <p className="text-primary font-bold">
            {formatIDR(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{payload[0].name}</p>
          <p className="text-primary font-bold">
            {payload[0].value} Terjual
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Statistik Penjualan</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Laporan analitik performa penjualan Cumita Anda secara keseluruhan.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : formatIDR(summaryData.totalRevenue)}
            </div>
            <p className="text-xs text-blue-100 mt-1 opacity-80">Dari seluruh pesanan</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Pesanan</CardTitle>
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {loading ? "..." : summaryData.totalOrders}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Transaksi tercatat</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {loading ? "..." : summaryData.totalCustomers}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Pelanggan unik</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Rata-rata Pesanan</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {loading ? "..." : formatIDR(summaryData.avgOrderValue)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Per transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-4 border-none shadow-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Tren Pendapatan Harian</CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Grafik pendapatan kotor penjualan per hari.</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-zinc-500">Memuat grafik...</div>
            ) : salesByDay.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-zinc-500">Belum ada data penjualan.</div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `Rp${value / 1000}k`}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Items Chart */}
        <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Menu Terlaris</CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">5 Menu dengan penjualan terbanyak.</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-zinc-500">Memuat grafik...</div>
            ) : topItems.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-zinc-500">Belum ada data pesanan.</div>
            ) : (
              <div className="h-[300px] w-full flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topItems}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {topItems.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
