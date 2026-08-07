"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, MoreHorizontal, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatIDR } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getStatusColor = (status: string) => {
  switch(status) {
    case "Pesanan Baru": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "Diproses": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "Dikirim": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "Selesai": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    default: return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

export default function PesananPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('short_id', 'like', 'CS-%')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    }
    fetchOrders();

    // Opsional: Realtime subscription (jika ingin otomatis update)
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        setOrders(current => [payload.new, ...current]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // 1. Update state local
    setOrders(current => current.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // 2. Update Supabase
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error("Gagal mengubah status pesanan");
      console.error(error);
    } else {
      toast.success("Status pesanan berhasil diubah");
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) {
      toast.error("Silakan pilih pesanan terlebih dahulu dengan mencentang kotak di sebelah kiri.");
      return;
    }
    
    // Update state local
    setOrders(current => current.map(o => selectedOrderIds.includes(o.id) ? { ...o, status: newStatus } : o));

    // Update Supabase
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .in('id', selectedOrderIds);

    if (error) {
      toast.error("Gagal mengubah status pesanan terpilih");
      console.error(error);
    } else {
      toast.success(`${selectedOrderIds.length} pesanan berhasil diubah menjadi ${newStatus}`);
      setSelectedOrderIds([]); // Reset selection
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.short_id?.toLowerCase().includes(q) ||
      order.customer_name?.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Helper untuk Title Case
    const toTitleCase = (str: string) => {
      if (!str) return "-";
      return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Header CSV
    const headers = ["ID Pesanan", "Tanggal", "Nama Pelanggan", "WhatsApp", "Alamat", "Status", "Total Pembayaran"];
    
    // Data CSV
    const csvData = orders.map(order => [
      order.short_id || "-",
      `"${new Date(order.created_at).toLocaleString("id-ID")}"`, // Wrap in quotes to prevent comma splitting
      `"${toTitleCase(order.customer_name).replace(/"/g, '""')}"`, // Title Case & Wrap in quotes
      `="${order.customer_whatsapp || "-"}"`, // Force Excel to treat as string instead of scientific notation
      `"${toTitleCase(order.customer_address).replace(/"/g, '""')}"`, // Title Case
      order.status || "-",
      order.total || 0 // Angka polos tanpa Rp
    ]);

    // Hitung Total Semua Penjualan
    const totalSemua = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    csvData.push(["", "", "", "", "", "Total", totalSemua]);

    // Gabungkan Header dan Data
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    // Buat Blob dan download
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Pesanan_Cumita_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Data pesanan berhasil diekspor!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Semua Pesanan</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Kelola semua pesanan yang masuk dari pelanggan (Live dari Database).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
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
                placeholder="Cari ID Pesanan atau Nama..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="gap-2 bg-primary hover:bg-primary/90 text-white" disabled={selectedOrderIds.length === 0}>
                    Ubah Status {selectedOrderIds.length > 0 ? `(${selectedOrderIds.length})` : ''} <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("Pesanan Baru")}>Pesanan Baru</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("Diterima")}>Diterima</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("Dalam Perjalanan")}>Dalam Perjalanan</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("Selesai")}>Selesai</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange("Dibatalkan")} className="text-red-500 focus:text-red-500">Dibatalkan</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filter Status
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-y border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                      checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrderIds(filteredOrders.map(o => o.id));
                        } else {
                          setSelectedOrderIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">ID Pesanan</th>
                  <th className="px-4 py-3 font-medium">Pelanggan</th>
                  <th className="px-4 py-3 font-medium">Item Pembelian</th>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary mb-2"></div>
                        Memuat data pesanan...
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                      {orders.length === 0 ? "Belum ada pesanan yang masuk." : "Tidak ada pesanan yang sesuai dengan pencarian Anda."}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const itemsText = Array.isArray(order.items) 
                      ? order.items.map((i: any) => `${i.qty}x ${i.name}`).join(", ")
                      : "-";

                    const orderDate = new Date(order.created_at).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    });

                    return (
                      <tr key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrderIds(prev => [...prev, order.id]);
                              } else {
                                setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{order.short_id}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          <div>{order.customer_name}</div>
                          <div className="text-xs text-zinc-400">{order.customer_whatsapp}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate" title={itemsText}>{itemsText}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{orderDate}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{formatIDR(order.total)}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={`relative flex items-center justify-center w-[145px] font-semibold text-xs rounded-md px-3 py-1.5 border outline-none transition-colors ${
                                  order.status === 'Pesanan Baru' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                  order.status === 'Diterima' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' :
                                  order.status === 'Dalam Perjalanan' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                                  order.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                                  'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                }`}
                              >
                                <span>{order.status}</span>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40">
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Pesanan Baru")}>Pesanan Baru</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Diterima")}>Diterima</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Dalam Perjalanan")}>Dalam Perjalanan</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Selesai")}>Selesai</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Dibatalkan")} className="text-red-500 focus:text-red-500">Dibatalkan</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                Lihat Detail
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Detail Pesanan</h3>
                <p className="text-sm text-zinc-500 font-medium">{selectedOrder.short_id}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800" onClick={() => setSelectedOrder(null)}>
                <span className="sr-only">Tutup</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </Button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Informasi Pelanggan</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">Nama</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">WhatsApp</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedOrder.customer_whatsapp}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-zinc-500">Alamat Pengiriman</span>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800 leading-relaxed">
                      {selectedOrder.customer_address}
                    </p>
                  </div>
                  {selectedOrder.notes && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-zinc-500">Catatan/Pesan</span>
                      <p className="font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30 italic">
                        "{selectedOrder.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Daftar Item</h4>
                <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md text-xs">{item.qty}x</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</span>
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">{formatIDR(item.price * item.qty)}</span>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-sm">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal</span>
                      <span>{formatIDR(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Ongkos Kirim</span>
                      <span>{formatIDR(selectedOrder.shipping)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-zinc-900 dark:text-zinc-100 pt-3 mt-1 border-t border-zinc-200 dark:border-zinc-800">
                      <span>Total Pembayaran</span>
                      <span className="text-primary">{formatIDR(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
              <Button onClick={() => setSelectedOrder(null)} className="px-6 rounded-full font-semibold shadow-sm">Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
