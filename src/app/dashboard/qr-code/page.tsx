"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Download, Loader2, QrCode as QrCodeIcon, Sun, Moon, Palette } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function QrCodePage() {
  const [url, setUrl] = useState("cumita.vercel.app");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Styling states
  const [dotType, setDotType] = useState<string>("rounded");
  const [cornerOuter, setCornerOuter] = useState<string>("extra-rounded");
  const [cornerInner, setCornerInner] = useState<string>("dot");
  
  // Color styling states
  const [colorMode, setColorMode] = useState<"solid" | "gradient">("solid");
  const [dotsColor, setDotsColor] = useState<string>("#000000"); // default for light theme
  const [gradColor1, setGradColor1] = useState<string>("#f97316");
  const [gradColor2, setGradColor2] = useState<string>("#ec4899");
  
  const [customCornerColor, setCustomCornerColor] = useState(false);
  const [cornerColor, setCornerColor] = useState<string>("#f97316");
  
  const [logoLight, setLogoLight] = useState("/logo_cumita.png");
  const [logoDark, setLogoDark] = useState("/logo_tema_gelap.png");
  const [loading, setLoading] = useState(true);
  
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeObj = useRef<any>(null); // To store QRCodeStyling instance

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data } = await supabase.from('store_settings').select('logo_light_url, logo_dark_url, theme_color').eq('id', 'default').single();
      
      if (data) {
        if (data.logo_light_url) setLogoLight(data.logo_light_url);
        if (data.logo_dark_url) setLogoDark(data.logo_dark_url);
        if (data.theme_color) {
          setCornerColor(data.theme_color);
          setGradColor1(data.theme_color);
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  // Update dots color default when theme changes
  useEffect(() => {
    if (colorMode === "solid") {
      setDotsColor(theme === "light" ? "#000000" : "#ffffff");
    }
  }, [theme, colorMode]);

  const makeCircularImage = (imgUrl: string, bgColor: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.max(img.width, img.height); // Make square
        const padding = size * 0.02; // 2% padding
        const totalSize = size + padding * 2;
        
        canvas.width = totalSize;
        canvas.height = totalSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(imgUrl);
        
        // Draw circular background
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(totalSize / 2, totalSize / 2, totalSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
        
        // Draw image centered
        const xOffset = (totalSize - img.width) / 2;
        const yOffset = (totalSize - img.height) / 2;
        ctx.drawImage(img, xOffset, yOffset, img.width, img.height);
        
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(imgUrl);
      img.src = imgUrl;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const renderQR = async () => {
      if (loading || typeof window === 'undefined') return;
      
      try {
        const QRCodeStyling = (await import("qr-code-styling")).default;
        
        const bgColor = theme === "light" ? "#ffffff" : "#09090b";
        const rawLogo = theme === "light" ? logoLight : logoDark;
        
        const circleLogo = await makeCircularImage(rawLogo, bgColor);
        const fullUrl = url ? `https://${url}` : "https://cumita.vercel.app";

        const dotsOptionsConfig: any = {
          type: dotType as any,
        };

        if (colorMode === "gradient") {
          dotsOptionsConfig.gradient = {
            type: "linear",
            rotation: Math.PI / 4,
            colorStops: [
              { offset: 0, color: gradColor1 },
              { offset: 1, color: gradColor2 }
            ]
          };
        } else {
          dotsOptionsConfig.color = dotsColor;
        }

        const cornersColor = customCornerColor ? cornerColor : undefined;

        if (!isMounted) return;

        const qrConfig = {
          width: 1024,
          height: 1024,
          margin: 80, // Memberikan ruang kosong yang cukup luas di sekeliling QR
          type: "svg" as const,
          data: fullUrl,
          image: circleLogo,
          dotsOptions: dotsOptionsConfig,
          cornersSquareOptions: {
            color: cornersColor,
            type: cornerOuter as any,
          },
          cornersDotOptions: {
            color: cornersColor,
            type: cornerInner as any,
          },
          qrOptions: {
            errorCorrectionLevel: "H" as const
          },
          backgroundOptions: {
            color: bgColor,
          },
          imageOptions: {
            crossOrigin: "anonymous",
            margin: 15,
            imageSize: 0.5,
            hideBackgroundDots: true
          }
        };

        if (!qrCodeObj.current) {
          qrCodeObj.current = new QRCodeStyling(qrConfig);
        } else {
          qrCodeObj.current.update(qrConfig);
        }

        if (qrRef.current) {
          qrRef.current.innerHTML = "";
          qrCodeObj.current.append(qrRef.current);
          
          const svg = qrRef.current.querySelector("svg");
          if (svg) {
            svg.style.width = "100%";
            svg.style.height = "auto";
            svg.style.maxWidth = "300px";
          }
        }
      } catch (err) {
        console.error("Failed to render QR Code", err);
      }
    };

    renderQR();

    return () => {
      isMounted = false;
    };
  }, [url, theme, dotType, cornerOuter, cornerInner, loading, logoLight, logoDark, colorMode, dotsColor, gradColor1, gradColor2, customCornerColor, cornerColor]);

  const [isApplying, setIsApplying] = useState(false);

  const handleApplyToWebsite = async () => {
    if (!qrCodeObj.current) return;
    
    setIsApplying(true);
    try {
      const blob = await qrCodeObj.current.getRawData("png");
      if (!blob) throw new Error("Gagal membuat gambar QR Code");

      const file = new File([blob], "qr_code.png", { type: "image/png" });
      const filePath = `website_qr/qr_code.png`;

      const { error: uploadError } = await supabase.storage
        .from('menus')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Force a small update in store_settings to trigger any real-time listeners or just update timestamp if we had one.
      // But we can just show success toast.
      toast.success("QR Code berhasil diterapkan di website!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal menerapkan QR Code: " + error.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeObj.current) return;
    qrCodeObj.current.download({ name: `QR_Code_${theme}`, extension: "png" });
    toast.success("QR Code berhasil diunduh (Resolusi Tinggi)");
  };

  return (
    <div className="space-y-6 w-full max-w-none pb-12">
      <div className="mb-4">
        <Link href="/dashboard/edit-website" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Edit Website
        </Link>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <QrCodeIcon className="h-6 w-6" /> QR Code Toko
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Buat dan unduh kode QR beresolusi tinggi dengan berbagai gaya yang menarik untuk dicetak.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80">
            <CardTitle className="text-lg">Pengaturan Gaya</CardTitle>
            <CardDescription>
              Kustomisasi tampilan QR Code Anda agar lebih unik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            
            {/* 1. Tautan & Tema Dasar */}
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tautan Tujuan</Label>
                <div className="flex rounded-md shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:ring-offset-white dark:focus-within:ring-offset-zinc-950 transition-shadow">
                  <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-sm font-medium">
                    https://
                  </span>
                  <Input 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value.replace(/^https?:\/\//, ''))} 
                    placeholder="cumita.vercel.app" 
                    className="h-11 rounded-l-none border-l-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tema Latar Belakang</Label>
                <div className="flex gap-4">
                  <Button 
                    type="button"
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className={`flex-1 gap-2 h-11 ${theme === "light" ? "bg-primary text-white border-primary" : "border-zinc-200 dark:border-zinc-800"}`}
                  >
                    <Sun className="h-4 w-4" /> Terang
                  </Button>
                  <Button 
                    type="button"
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className={`flex-1 gap-2 h-11 ${theme === "dark" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100" : "border-zinc-200 dark:border-zinc-800"}`}
                  >
                    <Moon className="h-4 w-4" /> Gelap
                  </Button>
                </div>
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800/80" />

            {/* 2. Gaya Bentuk (Shape) */}
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Gaya Titik</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "rounded", label: "Rounded" },
                    { id: "dots", label: "Titik" },
                    { id: "classy", label: "Classy" },
                    { id: "classy-rounded", label: "Classy Rnd" },
                    { id: "square", label: "Kotak" },
                    { id: "extra-rounded", label: "Extra Rnd" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDotType(item.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        dotType === item.id 
                          ? "bg-primary/10 border-primary text-primary shadow-sm" 
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Gaya Sudut</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "extra-rounded-dot", outer: "extra-rounded", inner: "dot", label: "Memudar & Titik" },
                    { id: "extra-rounded-square", outer: "extra-rounded", inner: "square", label: "Memudar & Kotak" },
                    { id: "dot-dot", outer: "dot", inner: "dot", label: "Titik Penuh" },
                    { id: "square-square", outer: "square", inner: "square", label: "Kotak Penuh" },
                    { id: "square-dot", outer: "square", inner: "dot", label: "Kotak & Titik" },
                    { id: "dot-square", outer: "dot", inner: "square", label: "Titik & Kotak" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCornerOuter(item.outer);
                        setCornerInner(item.inner);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        (cornerOuter === item.outer && cornerInner === item.inner)
                          ? "bg-primary/10 border-primary text-primary shadow-sm" 
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-primary/50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800/80" />

            {/* 3. Gaya Warna */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" /> Pewarnaan Pola
                </Label>
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                  <button 
                    type="button"
                    onClick={() => setColorMode("solid")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${colorMode === "solid" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                  >
                    Solid
                  </button>
                  <button 
                    type="button"
                    onClick={() => setColorMode("gradient")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${colorMode === "gradient" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                  >
                    Gradien
                  </button>
                </div>
              </div>

              {colorMode === "solid" ? (
                <div className="flex items-center gap-4">
                   <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
                     <input type="color" value={dotsColor} onChange={(e) => setDotsColor(e.target.value)} className="absolute inset-[-10px] w-20 h-20 cursor-pointer" />
                   </div>
                   <div className="text-sm text-zinc-500">
                     Pilih warna solid untuk titik-titik QR Code Anda.
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
                       <input type="color" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)} className="absolute inset-[-10px] w-20 h-20 cursor-pointer" />
                     </div>
                     <span className="text-zinc-400 font-medium text-xs">ke</span>
                     <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
                       <input type="color" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)} className="absolute inset-[-10px] w-20 h-20 cursor-pointer" />
                     </div>
                   </div>
                   <div className="text-sm text-zinc-500">
                     Kombinasi warna gradien linear menyilang.
                   </div>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Bedakan Warna Sudut</Label>
                    <p className="text-xs text-zinc-500 mt-0.5">Berikan warna berbeda khusus untuk tiga kotak sudut (mata QR).</p>
                  </div>
                  <Switch checked={customCornerColor} onCheckedChange={setCustomCornerColor} />
                </div>
                
                {customCornerColor && (
                  <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
                      <input type="color" value={cornerColor} onChange={(e) => setCornerColor(e.target.value)} className="absolute inset-[-10px] w-20 h-20 cursor-pointer" />
                    </div>
                    <div className="text-sm text-zinc-500">
                      Pilih warna untuk sudut (Corner).
                    </div>
                 </div>
                )}
              </div>
            </div>

          </CardContent>
          <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-6 pb-6 mt-auto flex flex-col xl:flex-row gap-3">
             <Button onClick={handleDownload} variant="outline" className="w-full xl:w-1/3 h-11 rounded-full gap-2 font-semibold border-zinc-200 dark:border-zinc-800">
               <Download className="w-4 h-4" /> Download
             </Button>
             <Button onClick={handleApplyToWebsite} disabled={isApplying} className="w-full xl:w-2/3 h-11 rounded-full gap-2 font-semibold bg-primary hover:bg-primary/90 text-white">
               {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCodeIcon className="w-4 h-4" />}
               {isApplying ? "Menerapkan..." : "Terapkan di Website"}
             </Button>
          </CardFooter>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm overflow-hidden sticky top-6">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80">
            <CardTitle className="text-lg">Pratinjau</CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            {loading ? (
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
               <div 
                 className={`p-6 rounded-3xl flex items-center justify-center ${theme === 'light' ? 'bg-white shadow-xl border border-zinc-100' : 'bg-zinc-950 shadow-xl border border-zinc-800'}`}
               >
                  <div ref={qrRef} className="flex items-center justify-center w-full max-w-[300px]"></div>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
