"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Mail } from "lucide-react";
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

export default function PelangganPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        const customerMap = new Map<string, CustomerData>();

        data.forEach(order => {
          const phone = order.customer_whatsapp;
          if (!customerMap.has(phone)) {
            customerMap.set(phone, {
              phone: phone,
              name: order.customer_name,
              email: order.customer_email || "-",
              joinDate: order.created_at, // First order date
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
        setCustomers(sortedCustomers);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, []);

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
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Lihat dan kelola semua pelanggan yang pernah memesan di Cumita.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
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
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-y border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Pelanggan</th>
                  <th className="px-4 py-3 font-medium">No. WA</th>
                  <th className="px-4 py-3 font-medium">Bergabung</th>
                  <th className="px-4 py-3 font-medium text-center">Total Pesanan</th>
                  <th className="px-4 py-3 font-medium text-right">Total Belanja</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      Memuat data pelanggan...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      Tidak ada pelanggan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{customer.name}</div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{customer.phone}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {format(new Date(customer.joinDate), 'dd MMM yyyy', { locale: localeId })}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-300">{customer.totalOrders}x</td>
                      <td className="px-4 py-3 font-medium text-right text-zinc-900 dark:text-zinc-100">
                        {formatIDR(customer.totalSpent)}
                      </td>
                      <td className="px-4 py-3">
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
