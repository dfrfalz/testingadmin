"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, UserPlus, Users, Shield, ChefHat } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteStaffData, setDeleteStaffData] = useState<{id: string, email: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Staff form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Kasir");

  useEffect(() => {
    // Check if the current user is Admin
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userRole = session?.user?.user_metadata?.role || "Admin";
      if (userRole !== "Admin") {
        router.push("/dashboard");
      }
    });

    fetchStaff();
  }, [router]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStaff(data.staff);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil data staf");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role) {
      return toast.error("Semua field wajib diisi");
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (password.length < 6 || !hasUpperCase || !hasLowerCase || !hasNumber) {
      return toast.error("Kata sandi harus minimal 6 karakter, mengandung huruf besar, huruf kecil, dan angka.");
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Akun staf berhasil dibuat!");
      setShowAddDialog(false);
      setEmail("");
      setPassword("");
      setRole("Kasir");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat akun staf");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: string, email: string) => {
    setDeleteStaffData({ id, email });
  };

  const executeDelete = async () => {
    if (!deleteStaffData) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteStaffData.id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Akun staf berhasil dihapus");
      setDeleteStaffData(null);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus staf");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName === "Admin") return <Shield className="h-4 w-4 text-primary" />;
    if (roleName === "Dapur") return <ChefHat className="h-4 w-4 text-amber-500" />;
    return <Users className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Manajemen Staf</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Atur akses login untuk akun Kasir.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 shadow-sm rounded-full">
          <UserPlus className="h-4 w-4" /> Tambah Staf
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Email / Username</th>
                  <th className="px-6 py-4 font-medium">Peran (Role)</th>
                  <th className="px-6 py-4 font-medium">Tanggal Dibuat</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-primary mb-2"></div>
                        Memuat data staf...
                      </div>
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                      Belum ada staf yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  staff.map((user) => (
                    <tr key={user.id} className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{user.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="font-semibold">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== "Admin" ? (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => confirmDelete(user.id, user.email)}
                            className="h-8 gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Hapus
                          </Button>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Utama</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white dark:bg-zinc-950">
          <div className="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950 px-6 pt-8 pb-6 border-b border-zinc-100 dark:border-zinc-800/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Tambah Akun Staf Baru</DialogTitle>
              <DialogDescription className="mt-2 leading-relaxed">
                Buat akun Kasir agar staf dapat login ke Dashboard untuk memproses pesanan dan memantau menu.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleAddStaff} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Staf</label>
              <Input
                type="email"
                placeholder="kasir1@cumita.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Kata Sandi</label>
              <Input
                type="text"
                placeholder="P4ssw0rdK4sir"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl"
                minLength={6}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Peran Akses</label>
              <div className="w-full h-11 px-3 flex items-center bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 cursor-not-allowed">
                Kasir
              </div>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Kasir memiliki akses ke Dasbor, Kasir POS, Pesanan, Pelanggan, Menu, dan Pesan.
              </p>
            </div>

            <DialogFooter className="pt-4 pb-2">
              <Button type="button" variant="ghost" onClick={() => setShowAddDialog(false)} className="rounded-xl h-11 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/25 font-semibold">
                {isSubmitting ? "Menyimpan..." : "Buat Akun Sekarang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteStaffData} onOpenChange={(open) => !open && setDeleteStaffData(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Akun Staf</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akses untuk <strong className="text-zinc-900 dark:text-zinc-100">{deleteStaffData?.email}</strong>? Akun ini tidak akan bisa login ke dashboard lagi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteStaffData(null)} className="rounded-xl h-11">
              Batal
            </Button>
            <Button type="button" variant="destructive" onClick={executeDelete} disabled={isSubmitting} className="rounded-xl h-11">
              {isSubmitting ? "Menghapus..." : "Ya, Hapus Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
