import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyOTPToken } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, token, newPassword } = body;

    if (!email || !otp || !token || !newPassword) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // 1. Verify OTP
    const isValid = verifyOTPToken(otp.toUpperCase().trim(), token);
    
    // Tambahan bypass fallback (opsional, dihapus untuk production)
    // if (!isValid && otp.trim() !== "123456") 
    if (!isValid) {
      return NextResponse.json({ error: 'Kode OTP salah atau sudah kedaluwarsa' }, { status: 400 });
    }

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Konfigurasi server tidak lengkap' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 3. Cari ID User berdasarkan Email
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("List users error:", listError);
      return NextResponse.json({ error: 'Gagal mengambil data user' }, { status: 500 });
    }

    const user = usersData.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ error: 'Email admin tidak ditemukan di sistem' }, { status: 404 });
    }

    // 4. Update Password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      console.error("Update password error:", updateError);
      return NextResponse.json({ error: 'Gagal memperbarui kata sandi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Kata sandi berhasil diperbarui' });
  } catch (error: any) {
    console.error("API Reset Password Error:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
