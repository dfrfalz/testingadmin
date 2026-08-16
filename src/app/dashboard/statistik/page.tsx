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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4'];

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
  const [period, setPeriod] = useState("semua");

  useEffect(() => {
    async function fetchStatistik() {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('*')
        .not('short_id', 'like', 'CS-%')
        .order('created_at', { ascending: true });
      
      if (period !== 'semua') {
        const now = new Date();
        let startDate = new Date();
        if (period === 'minggu') {
          startDate.setDate(now.getDate() - 7);
        } else if (period === 'bulan') {
          startDate.setDate(now.getDate() - 30);
        } else if (period === 'tahun') {
          startDate.setFullYear(now.getFullYear() - 1);
        }
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      
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
  }, [period]);

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

  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 pt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center text-xs">
            <div 
              className="w-2.5 h-2.5 rounded-full mr-1.5 shrink-0" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-[130px]" title={entry.value}>
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    );
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Tren Pendapatan Harian</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Grafik pendapatan kotor penjualan per hari.</p>
            </div>
            
            <Select value={period} onValueChange={(val) => setPeriod(val as string)}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-900 h-8">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Waktu</SelectItem>
                <SelectItem value="minggu">7 Hari Terakhir</SelectItem>
                <SelectItem value="bulan">30 Hari Terakhir</SelectItem>
                <SelectItem value="tahun">1 Tahun Terakhir</SelectItem>
              </SelectContent>
            </Select>
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
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      cornerRadius={4}
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
                      content={<CustomLegend />}
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
