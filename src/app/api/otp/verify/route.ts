import { NextResponse } from 'next/server';
import { verifyOTPToken } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { otp, token } = body;

    if (!otp || !token) {
      return NextResponse.json({ error: 'Data OTP tidak lengkap' }, { status: 400 });
    }

    const isValid = verifyOTPToken(otp.toUpperCase().trim(), token);

    if (!isValid) {
      return NextResponse.json({ error: 'Kode OTP salah atau sudah kedaluwarsa' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'OTP terverifikasi' });
  } catch (error: any) {
    console.error("API OTP Verify Error:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
