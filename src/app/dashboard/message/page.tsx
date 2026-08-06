"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Headset, MessageSquare, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type ChatGroup = {
  orderId: string;
  customerName: string;
  lastMessage: string;
  lastUpdate: string;
  unread: boolean; // Just a mock for now
};

export default function AdminMessagePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'cs' | 'ord'>('all');
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState("/logo_cumita.png");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch all chats initially
  useEffect(() => {
    const fetchAllMessages = async () => {
      // Fetch logo
      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('logo_light_url')
        .eq('id', 'default')
        .single();
      if (settingsData?.logo_light_url) {
        setLogoUrl(settingsData.logo_light_url);
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false }); // Get newest first to group

      if (data) {
        // Find unique orderIds
        const orderIds = Array.from(new Set(data.map(m => m.order_id)));
        
        // Fetch orders to get customer names
        const orderNamesMap = new Map<string, string>();
        if (orderIds.length > 0) {
          const { data: orders } = await supabase
            .from('orders')
            .select('short_id, customer_name')
            .in('short_id', orderIds);
            
          if (orders) {
            orders.forEach(o => orderNamesMap.set(o.short_id, o.customer_name));
          }
        }

        // Group by order_id
        const groupsMap = new Map<string, ChatGroup>();
        
        // Reverse array to build chat history for the selected chat later
        const ascendingData = [...data].reverse();
        setMessages(ascendingData);

        data.forEach((msg) => {
          if (!groupsMap.has(msg.order_id)) {
            groupsMap.set(msg.order_id, {
              orderId: msg.order_id,
              customerName: orderNamesMap.get(msg.order_id) || 'Pelanggan',
              lastMessage: msg.content,
              lastUpdate: msg.created_at,
              unread: false,
            });
          }
        });
        
        setChatGroups(Array.from(groupsMap.values()));
      }
      setLoading(false);
    };

    fetchAllMessages();

    // Subscribe to new messages globally
    const channel = supabase
      .channel('admin_chat_global')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, async payload => {
        const newMsg = payload.new;
        
        // Update messages array
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        
        // Check if group exists, if not fetch the name
        let custName = 'Pelanggan';
        setChatGroups(prev => {
           const exists = prev.find(g => g.orderId === newMsg.order_id);
           if (exists) custName = exists.customerName;
           return prev; 
        });

        if (custName === 'Pelanggan') {
          const { data: orderData } = await supabase.from('orders').select('customer_name').eq('short_id', newMsg.order_id).single();
          if (orderData) custName = orderData.customer_name;
        }

        // Update sidebar groups
        setChatGroups(prev => {
          const exists = prev.find(g => g.orderId === newMsg.order_id);
          const newGroup: ChatGroup = {
            orderId: newMsg.order_id,
            customerName: exists ? exists.customerName : custName,
            lastMessage: newMsg.content,
            lastUpdate: newMsg.created_at,
            unread: newMsg.sender_role === 'customer'
          };
          
          if (exists) {
            return [newGroup, ...prev.filter(g => g.orderId !== newMsg.order_id)];
          } else {
            return [newGroup, ...prev];
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedOrderId]);

  const activeMessages = messages.filter(m => m.order_id === selectedOrderId);

  const filteredChatGroups = chatGroups.filter(group => {
    if (activeTab === 'all') return true;
    if (activeTab === 'cs') return group.orderId.startsWith('CS-');
    if (activeTab === 'ord') return group.orderId.startsWith('ORD-') || !group.orderId.startsWith('CS-');
    return true;
  });

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedOrderId) return;

    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from('messages').insert([
      {
        order_id: selectedOrderId,
        sender_role: 'admin',
        content: content,
      }
    ]);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 sm:-m-6 lg:-m-8 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
      
      {/* Sidebar Chat List */}
      <div className={`${selectedOrderId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex-col bg-zinc-50 dark:bg-zinc-950 shrink-0`}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-3">
          <h2 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Kotak Masuk
          </h2>
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button 
              className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-all duration-200 ${activeTab === 'all' ? 'bg-white dark:bg-zinc-700 shadow-sm font-semibold text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              onClick={() => setActiveTab('all')}
            >
              Semua
            </button>
            <button 
              className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-all duration-200 ${activeTab === 'cs' ? 'bg-white dark:bg-zinc-700 shadow-sm font-semibold text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              onClick={() => setActiveTab('cs')}
            >
              CS
            </button>
            <button 
              className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-all duration-200 ${activeTab === 'ord' ? 'bg-white dark:bg-zinc-700 shadow-sm font-semibold text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              onClick={() => setActiveTab('ord')}
            >
              Order
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-300 border-t-primary"></div>
            </div>
          ) : filteredChatGroups.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Belum ada pesan masuk di kategori ini.
            </div>
          ) : (
            filteredChatGroups.map((group) => (
              <div 
                key={group.orderId}
                onClick={() => {
                  setSelectedOrderId(group.orderId);
                  // Mark as read locally
                  setChatGroups(prev => prev.map(g => g.orderId === group.orderId ? { ...g, unread: false } : g));
                }}
                className={`p-4 border-b border-zinc-100 dark:border-zinc-800/50 cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50 ${
                  selectedOrderId === group.orderId ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold text-sm truncate pr-2 ${group.unread ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {group.customerName}
                  </h3>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 shrink-0">
                    {format(new Date(group.lastUpdate), 'HH:mm', { locale: id })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                    {group.orderId}
                  </span>
                </div>
                <p className={`text-xs truncate ${group.unread ? 'text-zinc-800 dark:text-zinc-200 font-medium' : 'text-zinc-500'}`}>
                  {group.lastMessage}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!selectedOrderId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white dark:bg-zinc-900 w-full`}>
        {selectedOrderId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden h-9 w-9 shrink-0 text-zinc-500"
                  onClick={() => setSelectedOrderId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">
                    {chatGroups.find(g => g.orderId === selectedOrderId)?.customerName || 'Pelanggan'}
                  </h2>
                  <p className="text-xs text-zinc-500">Pesanan: <span className="font-medium text-primary">{selectedOrderId}</span></p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50 dark:bg-zinc-950/50">
              {activeMessages.map((msg) => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[75%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${isAdmin ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                        {isAdmin ? <img src={logoUrl} className="h-full w-full object-contain" alt="Admin" /> : <User className="h-4 w-4" />}
                      </div>
                      <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                          isAdmin 
                            ? 'bg-primary text-white rounded-tr-sm' 
                            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-tl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1.5 font-medium px-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(msg.created_at), 'HH:mm', { locale: id })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
              <form onSubmit={sendMessage} className="flex gap-3 max-w-4xl mx-auto">
                <Input 
                  placeholder="Tulis balasan untuk pelanggan..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 rounded-full bg-zinc-50 border-zinc-200 focus-visible:ring-primary dark:bg-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-primary h-12 px-6"
                />
                <Button type="submit" size="icon" className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 shrink-0 shadow-md transition-transform active:scale-95" disabled={!newMessage.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <div className="h-24 w-24 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Pilih Percakapan</h3>
            <p className="text-sm mt-1">Pilih salah satu pesanan di sebelah kiri untuk membalas pesan pelanggan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
