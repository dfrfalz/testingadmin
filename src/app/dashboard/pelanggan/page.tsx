"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Mail } from "lucide-react";

// Dummy data for customers
const allCustomers = [
  { id: "CUST-101", name: "Budi Santoso", email: "budi.santoso@email.com", joinDate: "12 Mar 2024", totalOrders: 5, totalSpent: "Rp 750.000", status: "Aktif" },
  { id: "CUST-102", name: "Siti Rahma", email: "siti.rahma22@email.com", joinDate: "15 Mar 2024", totalOrders: 2, totalSpent: "Rp 150.000", status: "Aktif" },
  { id: "CUST-103", name: "Agus Pratama", email: "agus.p@email.com", joinDate: "20 Mar 2024", totalOrders: 8, totalSpent: "Rp 1.250.000", status: "VIP" },
  { id: "CUST-104", name: "Lina Marlina", email: "lina.marl@email.com", joinDate: "05 Apr 2024", totalOrders: 1, totalSpent: "Rp 50.000", status: "Aktif" },
  { id: "CUST-105", name: "Dedi Haryanto", email: "haryanto.d@email.com", joinDate: "10 Apr 2024", totalOrders: 3, totalSpent: "Rp 800.000", status: "Aktif" },
  { id: "CUST-106", name: "Eka Yulianti", email: "eka.yuli@email.com", joinDate: "01 Mei 2024", totalOrders: 4, totalSpent: "Rp 950.000", status: "Aktif" },
  { id: "CUST-107", name: "Fajar Rizky", email: "fajar.rzky@email.com", joinDate: "15 Mei 2024", totalOrders: 0, totalSpent: "Rp 0", status: "Tidak Aktif" },
];

export default function PelangganPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Data Pelanggan</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Lihat dan kelola semua pelanggan yang mendaftar di Cumita.</p>
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
              <Input placeholder="Cari nama atau email..." className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filter Member
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
                  <th className="px-4 py-3 font-medium">Bergabung</th>
                  <th className="px-4 py-3 font-medium">Total Pesanan</th>
                  <th className="px-4 py-3 font-medium">Total Belanja</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {allCustomers.map((customer, index) => (
                  <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{customer.name}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{customer.joinDate}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{customer.totalOrders} Pesanan</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{customer.totalSpent}</td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant={customer.status === "VIP" ? "default" : "outline"} 
                        className={customer.status === "VIP" ? "bg-amber-500 text-white dark:bg-amber-600" : (customer.status === "Tidak Aktif" ? "text-zinc-400 border-zinc-200" : "")}
                      >
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-primary">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
