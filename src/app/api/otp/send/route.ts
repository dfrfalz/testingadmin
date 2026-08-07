import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateOTPToken, generateRandomOTP } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    // 1. Verify user session
    // In a real app we'd get the token from cookies, but since this is a simple backend API
    // we'll assume the frontend will pass the authorization header or we can just 
    // fetch the single store_settings whatsapp number.
    const { data: settings } = await supabase
      .from('store_settings')
      .select('store_whatsapp, owner_whatsapp')
      .eq('id', 'default')
      .single();

    const waNumber = settings?.owner_whatsapp;

    if (!waNumber) {
      return NextResponse.json({ error: 'Nomor WhatsApp Owner (Keamanan) belum diatur di Dashboard.' }, { status: 400 });
    }

    // 2. Generate OTP and Token
    const otp = generateRandomOTP();
    const token = generateOTPToken(otp, 5); // 5 minutes expiry

    // 3. Send via Fonnte
    const fonnteToken = process.env.FONNTE_TOKEN;
    if (!fonnteToken) {
      console.warn("Fonnte Token is missing, skipping sending WA message.");
      // For local testing if token is missing
      return NextResponse.json({ token, message: 'Fonnte token missing, simulated OTP send', debug_otp: otp });
    }

    const message = `*KODE OTP CUMITA*\n\nJangan berikan kode ini kepada siapapun!\nKode OTP Anda: *${otp}*\n\nKode ini akan kedaluwarsa dalam 5 menit.`;

    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken,
      },
      body: new URLSearchParams({
        target: waNumber,
        message: message,
      }),
    });

    const fonnteData = await fonnteRes.json();
    if (!fonnteData.status) {
      console.error("Fonnte Error:", fonnteData);
      return NextResponse.json({ error: 'Gagal mengirim pesan OTP ke WhatsApp' }, { status: 500 });
    }

    return NextResponse.json({ token, message: 'OTP terkirim' });
  } catch (error: any) {
    console.error("API OTP Send Error:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
