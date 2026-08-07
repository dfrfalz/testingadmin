"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Trash2, Ticket, ArrowLeft, Calendar as CalendarIcon, MoreHorizontal, Edit } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Promo {
  id: number;
  code: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  min_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  daily_quota: number | null;
}

export default function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<number | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [dailyQuota, setDailyQuota] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('Could not find')) {
        toast.error("Tabel promos belum ada di database.");
      } else {
        toast.error(error.message || "Gagal memuat data promo");
      }
    } else if (data) {
      setPromos(data as Promo[]);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) {
      toast.error("Kode dan nilai diskon wajib diisi");
      return;
    }

    const valueNum = Number(discountValue.replace(/\./g, ''));
    if (discountType === 'percentage' && (valueNum < 1 || valueNum > 100)) {
      toast.error("Nilai diskon persentase harus antara 1 - 100");
      return;
    }

    if (startDate && endDate && new Date(new Date(endDate).setHours(0,0,0,0)) < new Date(new Date(startDate).setHours(0,0,0,0))) {
      toast.error("Tanggal berakhir tidak boleh sebelum tanggal mulai");
      return;
    }

    setSaving(true);
    const promoData = {
      code: code.toUpperCase().replace(/\s/g, ''),
      discount_type: discountType,
      discount_value: valueNum,
      min_order: Number(minOrder.replace(/\./g, '')) || 0,
      is_active: isActive,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      daily_quota: dailyQuota ? Number(dailyQuota) : null
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('promos').update(promoData).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('promos').insert([promoData]);
      error = insertError;
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingId ? "Promo berhasil diperbarui" : "Promo berhasil ditambahkan");
      resetForm();
      fetchPromos();
    }
    setSaving(false);
  };

  const handleEdit = (promo: Promo) => {
    setEditingId(promo.id);
    setCode(promo.code);
    setDiscountType(promo.discount_type);
    if (promo.discount_type === 'percentage') {
      setDiscountValue(promo.discount_value.toString());
    } else {
      setDiscountValue(promo.discount_value.toLocaleString('id-ID'));
    }
    setMinOrder(promo.min_order > 0 ? promo.min_order.toLocaleString('id-ID') : "");
    setDailyQuota(promo.daily_quota ? promo.daily_quota.toString() : "");
    setIsActive(promo.is_active);
    setStartDate(promo.start_date ? new Date(promo.start_date) : undefined);
    setEndDate(promo.end_date ? new Date(promo.end_date) : undefined);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setCode("");
    setDiscountValue("");
    setMinOrder("");
    setDailyQuota("");
    setStartDate(undefined);
    setEndDate(undefined);
    setIsActive(true);
    setDiscountType("percentage");
  };

  const togglePromoStatus = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('promos')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error("Gagal mengubah status");
    } else {
      setPromos(promos.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      toast.success("Status promo diperbarui");
    }
  };

  const deletePromo = async (id: number) => {
    setDeletingId(id);
    const { error } = await supabase.from('promos').delete().eq('id', id);
    
    if (error) {
      toast.error("Gagal menghapus promo");
    } else {
      setPromos(promos.filter(p => p.id !== id));
      toast.success("Promo berhasil dihapus");
    }
    setDeletingId(null);
    setPromoToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" /> Promo & Diskon
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola kode voucher potongan harga untuk pelanggan Anda.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Promo
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <form onSubmit={handleSave}>
            <CardHeader>
              <CardTitle>{editingId ? "Edit Promo" : "Tambah Promo Baru"}</CardTitle>
              <CardDescription>{editingId ? "Ubah detail voucher promo Anda." : "Buat kode voucher baru untuk pelanggan."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kode Voucher</Label>
                  <Input 
                    placeholder="Contoh: HEMAT20" 
                    value={code} 
                    onChange={e => setCode(e.target.value.replace(/\s/g, ''))} 
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipe Diskon</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      type="button" 
                      variant={discountType === 'percentage' ? 'default' : 'outline'} 
                      onClick={() => { setDiscountType('percentage'); setDiscountValue(''); }}
                      className={discountType === 'percentage' ? 'bg-primary text-primary-foreground border-primary' : 'border-zinc-200 dark:border-zinc-800 text-muted-foreground'}
                    >
                      Persentase (%)
                    </Button>
                    <Button 
                      type="button" 
                      variant={discountType === 'flat' ? 'default' : 'outline'} 
                      onClick={() => { setDiscountType('flat'); setDiscountValue(''); }}
                      className={discountType === 'flat' ? 'bg-primary text-primary-foreground border-primary' : 'border-zinc-200 dark:border-zinc-800 text-muted-foreground'}
                    >
                      Nominal (Rp)
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nilai Diskon</Label>
                  <Input 
                    type="text" 
                    placeholder={discountType === 'percentage' ? "Contoh: 20" : "Contoh: 15.000"} 
                    value={discountValue} 
                    onChange={e => {
                      let rawValue = e.target.value.replace(/\./g, '').replace(/\D/g, '');
                      if (discountType === 'percentage') {
                        if (Number(rawValue) > 100) rawValue = "100";
                        setDiscountValue(rawValue);
                      } else {
                        if (!rawValue) setDiscountValue("");
                        else setDiscountValue(Number(rawValue).toLocaleString('id-ID'));
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {discountType === 'percentage' ? "Masukkan angka persen (1-100)" : "Masukkan nominal"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Minimal Belanja</Label>
                  <Input 
                    type="text" 
                    placeholder="Contoh: 50.000 (Kosongkan jika tidak ada)" 
                    value={minOrder} 
                    onChange={e => {
                      let rawValue = e.target.value.replace(/\./g, '').replace(/\D/g, '');
                      if (!rawValue) setMinOrder("");
                      else setMinOrder(Number(rawValue).toLocaleString('id-ID'));
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Batas Kuota per Hari</Label>
                  <Input 
                    type="number" 
                    placeholder="Contoh: 15 (Kosongkan jika tak terbatas)" 
                    value={dailyQuota} 
                    onChange={e => setDailyQuota(e.target.value)} 
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP", { locale: idLocale }) : <span>Pilih tanggal mulai</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Berakhir</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP", { locale: idLocale }) : <span>Pilih tanggal berakhir</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => startDate ? date < new Date(new Date(startDate).setHours(0,0,0,0)) : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <Label className="mb-3">Status Aktif</Label>
                  <div className="flex items-center space-x-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-4 border-zinc-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={resetForm}>Batal</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? "Simpan Perubahan" : "Simpan Promo"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : promos.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Belum ada promo yang dibuat.
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kode</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nilai</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Min. Belanja</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kuota per Hari</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Periode</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {promos.map((promo) => (
                    <tr key={promo.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-bold text-primary">{promo.code}</td>
                      <td className="p-4 align-middle">
                        {promo.discount_type === 'percentage' 
                          ? `${promo.discount_value}%` 
                          : `Rp ${promo.discount_value.toLocaleString('id-ID')}`
                        }
                      </td>
                      <td className="p-4 align-middle">
                        {promo.min_order > 0 ? `Rp ${promo.min_order.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {promo.daily_quota ? `${promo.daily_quota} Pengguna` : 'Tanpa Batas'}
                      </td>
                      <td className="p-4 align-middle text-xs text-muted-foreground">
                        {promo.start_date || promo.end_date ? (
                          <>
                            {promo.start_date ? new Date(promo.start_date).toLocaleDateString('id-ID') : 'Selamanya'} <br/> 
                            - {promo.end_date ? new Date(promo.end_date).toLocaleDateString('id-ID') : 'Selamanya'}
                          </>
                        ) : 'Selamanya'}
                      </td>
                      <td className="p-4 align-middle">
                        <Switch 
                          checked={promo.is_active} 
                          onCheckedChange={() => togglePromoStatus(promo.id, promo.is_active)}
                        />
                      </td>
                      <td className="p-4 align-middle text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(promo)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer" 
                              onClick={() => setPromoToDelete(promo.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={promoToDelete !== null} onOpenChange={(open) => !open && setPromoToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Promo</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus promo ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoToDelete(null)} disabled={deletingId !== null}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => promoToDelete && deletePromo(promoToDelete)} disabled={deletingId !== null}>
              {deletingId !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
