"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR } from "@/lib/utils";
import { Search, Plus, Minus, Trash2, ShoppingBag, Receipt, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { MenuType } from "@/components/MenuModal";

interface CartItem extends MenuType {
  qty: number;
}

export default function PosPage() {
  const [menus, setMenus] = useState<MenuType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout Info
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .is('deleted_at', null)
        .eq('status', 'aktif')
        .order('id', { ascending: true });
        
      if (!error && data) {
        setMenus(data);
      }
      setLoading(false);
    };
    fetchMenus();
  }, []);

  const filteredMenus = menus.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (menu: MenuType) => {
    if (menu.stock <= 0) {
      toast.error("Stok habis!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === menu.id);
      if (existing) {
        if (existing.qty >= menu.stock) {
          toast.error("Stok tidak mencukupi");
          return prev;
        }
        return prev.map(item => item.id === menu.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...menu, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty > item.stock) {
          toast.error("Stok maksimal tercapai");
          return item;
        }
        if (newQty < 1) return item;
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("Walk-in Customer");
    setNotes("");
    setPaymentMethod("Cash");
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong!");
      return;
    }

    setIsSubmitting(true);
    try {
      const shortId = `POS-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          short_id: shortId,
          customer_name: customerName || "Pelanggan POS",
          customer_whatsapp: "-",
          customer_address: "Beli di tempat (POS)",
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            image_url: item.image_url
          })),
          subtotal: subtotal,
          shipping: 0,
          total: subtotal,
          status: "Selesai",
          notes: notes,
          payment_method: paymentMethod
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Update stok
      for (const item of cart) {
        await supabase
          .from('menus')
          .update({ stock: item.stock - item.qty })
          .eq('id', item.id);
      }

      setSuccessOrder(shortId);
      toast.success("Transaksi POS berhasil disimpan!");
      
    } catch (err: any) {
      toast.error(`Gagal menyimpan pesanan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] w-full">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Transaksi Berhasil!</h2>
          <p className="text-zinc-500 mb-6">Order ID: <strong className="text-zinc-900 dark:text-white">{successOrder}</strong></p>
          <div className="flex gap-4 w-full">
            <Button onClick={() => {
              setSuccessOrder(null);
              clearCart();
            }} className="flex-1">
              Pesanan Baru
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open("/dashboard/pesanan", "_blank")}>
              <Receipt className="w-4 h-4" /> Riwayat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const groupedMenus = filteredMenus.reduce((acc, menu) => {
    const cat = menu.category || 'Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(menu);
    return acc;
  }, {} as Record<string, MenuType[]>);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 -m-2 sm:-m-4">
      {/* Left Area: Product List */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-4">
        <div className="flex justify-between items-center mb-4 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> Katalog POS
          </h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Cari produk..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredMenus.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Tidak ada produk yang tersedia.
            </div>
          ) : (
            Object.entries(groupedMenus).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                  <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                  {category}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(menu => (
                    <button
                      key={menu.id}
                      onClick={() => addToCart(menu)}
                      disabled={menu.stock <= 0}
                      className={`text-left flex flex-col bg-zinc-50 dark:bg-zinc-900/50 rounded-xl overflow-hidden border transition-all ${
                        menu.stock <= 0 
                          ? 'border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:shadow-md cursor-pointer group'
                      }`}
                    >
                      <div className="w-full aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                        {menu.image_url ? (
                          <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No Image</div>
                        )}
                        {menu.stock <= 0 && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="bg-red-500 text-white font-bold px-3 py-1 text-xs rounded-full">Habis</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight h-8 mb-1">{menu.name}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-bold text-primary text-sm">{formatIDR(menu.price)}</span>
                          <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400 font-medium">Stok: {menu.stock}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Area: Cart Sidebar */}
      <div className="w-full lg:w-[400px] flex flex-col h-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
          <h2 className="font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Pesanan Saat Ini
          </h2>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-2 text-xs">
              Kosongkan
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4 opacity-50">
              <ShoppingBag className="w-16 h-16" />
              <p>Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</h4>
                    <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-sm text-primary">{formatIDR(item.price)}</span>
                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-full px-1 py-0.5">
                      <button 
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-zinc-500">Nama Pelanggan</Label>
              <Input 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                className="h-9 mt-1 bg-white dark:bg-zinc-950" 
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-500">Catatan Tambahan (Opsional)</Label>
              <Input 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Misal: Dibungkus, tidak pedas..."
                className="h-9 mt-1 bg-white dark:bg-zinc-950" 
              />
            </div>
            
            <div className="pt-2">
              <Label className="text-xs text-zinc-500 mb-1.5 block">Metode Pembayaran</Label>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant={paymentMethod === "Cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("Cash")}
                  className={`flex-1 rounded-lg h-9 ${paymentMethod === "Cash" ? "shadow-sm shadow-primary/20" : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400"}`}
                >
                  Cash
                </Button>
                <Button 
                  type="button"
                  variant={paymentMethod === "QRIS" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("QRIS")}
                  className={`flex-1 rounded-lg h-9 ${paymentMethod === "QRIS" ? "shadow-sm shadow-primary/20" : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400"}`}
                >
                  QRIS
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center font-bold text-lg mb-4">
              <span>Total tagihan</span>
              <span className="text-primary">{formatIDR(subtotal)}</span>
            </div>
            <Button 
              className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20" 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memproses...</>
              ) : (
                "Simpan Pembayaran"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
