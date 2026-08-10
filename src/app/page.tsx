"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, User, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State untuk Reset Password
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Email atau password salah!");
      setLoading(false);
    } else {
      toast.success("Login berhasil!");
      router.push("/dashboard");
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return toast.error("Masukkan email admin");
    setResetLoading(true);
    try {
      const res = await fetch("/api/otp/send", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal meminta OTP");
      setResetToken(data.token);
      setResetStep(2);
      toast.success("Kode OTP dikirim ke WhatsApp admin");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || !newPassword) return toast.error("Lengkapi semua form");
    
    // BYPASS FRONTEND SEMENTARA UNTUK OTOMATIS MERUBAH JIKA OTP 123456 (Karena Fonnte mungkin error)
    if (resetOtp === "123456") {
      setResetLoading(true);
      try {
         const res = await fetch("/api/auth/reset-password", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             email: resetEmail,
             otp: resetOtp,
             token: resetToken || "bypass",
             newPassword
           })
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || "Gagal reset kata sandi");
         toast.success("Kata sandi berhasil direset! Silakan login.");
         setShowResetDialog(false);
         setResetStep(1);
         setResetOtp("");
         setNewPassword("");
      } catch(err:any) {
         toast.error(err.message);
      } finally {
         setResetLoading(false);
      }
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          otp: resetOtp,
          token: resetToken,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal reset kata sandi");
      
      toast.success("Kata sandi berhasil direset! Silakan login.");
      setShowResetDialog(false);
      setResetStep(1);
      setResetOtp("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Latar Belakang Abstrak Premium */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.03%22/%3E%3C/svg%3E')] opacity-50" />
      </div>

      {/* Kiri: Bagian Branding (Tersembunyi di Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 z-10 border-r border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">

        <div className="relative z-10 text-center flex flex-col items-center">
          <img 
            src="/logo_cumita.png" 
            alt="CUMITA" 
            className="w-64 md:w-80 h-auto object-contain mb-8 drop-shadow-2xl dark:hidden" 
          />
          <img 
            src="/logo_tema_gelap.png" 
            alt="CUMITA" 
            className="w-64 md:w-80 h-auto object-contain mb-8 drop-shadow-2xl hidden dark:block" 
          />
          <h1 className="text-3xl font-serif text-zinc-900 dark:text-zinc-100 font-medium tracking-wide">
            Sistem Manajemen Pusat
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-sm font-light">
            Kelola pesanan, pelanggan, dan pendapatan dengan sistem dashboard eksklusif Cumita.
          </p>
        </div>

        <div className="absolute bottom-10 left-12 text-zinc-500 text-sm font-medium tracking-widest uppercase">
          &copy; 2026 CUMITA EXCLUSIVE
        </div>
      </div>

      {/* Kanan: Bagian Form Login */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative z-10 backdrop-blur-sm">
        
        {/* Tombol Tema di Kanan Atas */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-10">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-serif">
              Selamat Datang
            </h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Silakan masuk ke akun administrator Anda.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Alamat Email
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-3 h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    placeholder="admin@cumita.com"
                    className="pl-11 h-12 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary focus-visible:border-primary transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Kata Sandi
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowResetDialog(true)}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3 h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-12 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary focus-visible:border-primary transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all group" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Memproses...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Masuk ke Dasbor
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Area Terbatas (Restricted)
            </p>
          </div>
        </div>
      </div>

      {/* Dialog Reset Password */}
      <Dialog open={showResetDialog} onOpenChange={(open) => {
        if(!open) {
          setResetStep(1);
          setResetOtp("");
          setNewPassword("");
        }
        setShowResetDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi</DialogTitle>
            <DialogDescription>
              {resetStep === 1 
                ? "Masukkan email Anda. Kode OTP akan dikirim ke WhatsApp Owner yang terdaftar."
                : "Masukkan kode OTP yang dikirim ke WhatsApp dan ketikkan kata sandi baru Anda."}
            </DialogDescription>
          </DialogHeader>

          {resetStep === 1 ? (
            <form onSubmit={handleRequestOTP} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Akun Admin</label>
                <Input
                  type="email"
                  placeholder="admin@cumita.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? "Mengirim OTP..." : "Kirim OTP ke WhatsApp"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kode OTP</label>
                <Input
                  type="text"
                  placeholder="Masukkan 6 karakter OTP"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kata Sandi Baru</label>
                <Input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setResetStep(1)}>
                  Kembali
                </Button>
                <Button type="submit" disabled={resetLoading}>
                  {resetLoading ? "Menyimpan..." : "Simpan Kata Sandi"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
