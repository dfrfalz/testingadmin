"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Mail, Users, ShoppingBag, DollarSign } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type CustomerData = {
  phone: string;
  name: string;
  email: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  status: string;
};

type OrderData = {
  id: string;
  customer_whatsapp: string;
  customer_name: string;
  customer_email: string;
  total: number;
  created_at: string;
};

export default function PelangganPage() {
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("semua");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_whatsapp, customer_name, customer_email, total, created_at')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setAllOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const { customers, stats } = useMemo(() => {
    let filteredOrders = allOrders;
    const now = new Date();
    
    // Filter by time
    if (timeFilter !== "semua") {
      filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        if (timeFilter === "hari") {
          return orderDate.toDateString() === now.toDateString();
        } else if (timeFilter === "minggu") {
          const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
          firstDay.setHours(0,0,0,0);
          return orderDate >= firstDay;
        } else if (timeFilter === "bulan") {
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === "tahun") {
          return orderDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    const customerMap = new Map<string, CustomerData>();
    let totalRevenue = 0;

    filteredOrders.forEach(order => {
      totalRevenue += Number(order.total);
      const phone = order.customer_whatsapp;
      
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          phone: phone,
          name: order.customer_name,
          email: order.customer_email || "-",
          joinDate: order.created_at, // First order date in this period
          totalOrders: 1,
          totalSpent: Number(order.total),
          status: "Aktif",
        });
      } else {
        const existing = customerMap.get(phone)!;
        existing.totalOrders += 1;
        existing.totalSpent += Number(order.total);
        if (existing.totalOrders >= 5 || existing.totalSpent >= 500000) {
          existing.status = "VIP";
        }
      }
    });

    const sortedCustomers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    
    return {
      customers: sortedCustomers,
      stats: {
        totalCustomers: customerMap.size,
        totalOrders: filteredOrders.length,
        totalRevenue: totalRevenue
      }
    };
  }, [allOrders, timeFilter]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Data Pelanggan</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Lihat dan kelola statistik pelanggan yang pernah memesan di Cumita.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="semua">Semua</TabsTrigger>
              <TabsTrigger value="hari">Hari Ini</TabsTrigger>
              <TabsTrigger value="minggu">Minggu Ini</TabsTrigger>
              <TabsTrigger value="bulan">Bulan Ini</TabsTrigger>
              <TabsTrigger value="tahun">Tahun Ini</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Pelanggan</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.totalCustomers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Pesanan</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.totalOrders}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Belanja (IDR)</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatIDR(stats.totalRevenue)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Cari nama, email, atau WA..." 
                className="pl-9" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 border-y border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Pelanggan</th>
                  <th className="px-6 py-4 font-medium">No. WA</th>
                  <th className="px-6 py-4 font-medium">Bergabung</th>
                  <th className="px-6 py-4 font-medium text-center">Total Pesanan</th>
                  <th className="px-6 py-4 font-medium text-right">Total Belanja</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                      Memuat data pelanggan...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                      Tidak ada pelanggan yang ditemukan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <tr key={index} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 dark:border-zinc-800/80 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{customer.name}</div>
                            {customer.email !== "-" && (
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{customer.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{customer.phone}</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                        {format(new Date(customer.joinDate), 'dd MMM yyyy', { locale: localeId })}
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-600 dark:text-zinc-300">{customer.totalOrders}x</td>
                      <td className="px-6 py-4 font-medium text-right text-zinc-900 dark:text-zinc-100">
                        {formatIDR(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={customer.status === "VIP" ? "default" : "outline"} 
                          className={customer.status === "VIP" ? "bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700" : ""}
                        >
                          {customer.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
