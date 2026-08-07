import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateOTPToken, generateRandomOTP } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const { data: settings } = await supabase
      .from('store_settings')
      .select('owner_whatsapp')
      .eq('id', 'default')
      .single();

    const currentOwnerWa = settings?.owner_whatsapp;

    // Jika belum ada nomor owner, tidak perlu OTP, langsung izinkan ganti.
    if (!currentOwnerWa) {
      return NextResponse.json({ requireOtp: false });
    }

    // Jika ada nomor owner lama, kirim OTP ke nomor lama.
    const otp = generateRandomOTP();
    const token = generateOTPToken(otp, 5); // 5 menit

    const fonnteToken = process.env.FONNTE_TOKEN;
    if (!fonnteToken) {
      return NextResponse.json({ 
        requireOtp: true, 
        token, 
        message: 'Fonnte token missing, simulated OTP', 
        debug_otp: otp 
      });
    }

    const message = `*PERMINTAAN GANTI NOMOR OWNER*\n\nSeseorang mencoba mengganti Nomor WhatsApp Owner di Dashboard Cumita.\n\nJika ini Anda, masukkan kode OTP berikut:\n*${otp}*\n\nJangan berikan kode ini kepada staf atau siapapun! Kode kedaluwarsa dalam 5 menit.`;

    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken,
      },
      body: new URLSearchParams({
        target: currentOwnerWa,
        message: message,
      }),
    });

    const fonnteData = await fonnteRes.json();
    if (!fonnteData.status) {
      return NextResponse.json({ error: 'Gagal mengirim pesan OTP ke nomor lama' }, { status: 500 });
    }

    return NextResponse.json({ requireOtp: true, token, message: 'OTP terkirim ke nomor owner lama' });
  } catch (error: any) {
    console.error("API Change Owner OTP Error:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
