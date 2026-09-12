import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, CheckCircle2, X, Volume2, VolumeX, Sparkles, ShoppingBag } from 'lucide-react';
import { Order } from '../types';

export interface OrderNotification {
  id: string;
  storeName: string;
  storeSlug?: string;
  order: Order;
  timestamp: string;
  isRead: boolean;
}

interface NotificationSystemProps {
  onSelectStoreOrder?: (storeSlug: string, orderId: string) => void;
  hideFloatingButton?: boolean;
}

// Simple Web Audio API Synthesizer Chime for New Order alert
function playNewOrderChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    
    // First tone (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now); // G5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (C6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, now + 0.12); // C6
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (err) {
    // Audio context play error ignored if user hasn't interacted yet
  }
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ onSelectStoreOrder, hideFloatingButton = false }) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [activeToast, setActiveToast] = useState<OrderNotification | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sound preference state
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Handle incoming order notifications via window event
  useEffect(() => {
    const handleNewOrder = (event: Event) => {
      const customEvent = event as CustomEvent<{
        storeName: string;
        storeSlug?: string;
        order: Order;
      }>;

      if (!customEvent.detail || !customEvent.detail.order) return;

      const { storeName, storeSlug, order } = customEvent.detail;
      const newNotif: OrderNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        storeName: storeName || 'متجر بالمنصة',
        storeSlug,
        order,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setActiveToast(newNotif);

      if (soundEnabledRef.current) {
        playNewOrderChime();
      }
    };

    window.addEventListener('new_order_created', handleNewOrder);
    return () => {
      window.removeEventListener('new_order_created', handleNewOrder);
    };
  }, []);

  // Auto-dismiss active toast after 7 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Helper function to simulate a test order
  const handleSimulateTestOrder = () => {
    const testNames = ['ياسين بن علي', 'كريم بومدين', 'أمينة زروقي', 'حمزة بلحاج', 'فاطمة الزهراء'];
    const testCities = ['16 - الجزائر العاصمة', '31 - وهران', '25 - قسنطينة', '19 - سطيف', '09 - البليدة'];
    const testStores = [
      { name: 'متجر الهواتف والإلكترونيات', slug: 'electronics-dz' },
      { name: 'دار العطور والبخور الأصيلة', slug: 'perfumes-dz' },
      { name: 'مؤسسة الألبسة والجملة', slug: 'fashion-dz' },
    ];

    const randomStore = testStores[Math.floor(Math.random() * testStores.length)];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomCity = testCities[Math.floor(Math.random() * testCities.length)];
    const randomAmount = Math.floor(Math.random() * 450 + 50) * 100; // e.g. 12,000 to 50,000 DZD

    const mockOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 89999 + 10000)}`,
      customerName: randomName,
      customerPhone: '0770123456',
      customerCity: randomCity,
      customerAddress: 'حي المستقبل - الشارع الرئيسي',
      items: [
        {
          productId: 'p-test',
          productTitle: 'حزمة طرد جملة تجريبية (12 قطعة)',
          price: randomAmount,
          quantity: 1,
          packageUnit: 'طرد جملة',
        },
      ],
      subtotal: randomAmount,
      shippingFee: 800,
      discount: 0,
      totalAmount: randomAmount + 800,
      paymentMethod: 'cod',
      status: 'جديد',
      createdAt: new Date().toLocaleDateString('ar-DZ'),
      trackingNumber: `YAL-${Math.floor(Math.random() * 89999 + 10000)}`,
    };

    window.dispatchEvent(
      new CustomEvent('new_order_created', {
        detail: {
          storeName: randomStore.name,
          storeSlug: randomStore.slug,
          order: mockOrder,
        },
      })
    );
  };

  return (
    <div className="fixed top-3 left-3 z-[9999] dir-rtl font-['Tajawal'] text-slate-800">
      {/* Toast Notification Box in the Top Left Corner */}
      {activeToast && (
        <div className="mb-2 w-80 md:w-96 bg-slate-900/95 backdrop-blur-md text-white border border-indigo-500/40 rounded-2xl shadow-2xl p-4 transition-all transform animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
          {/* Animated top indicator bar */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-400 via-indigo-500 to-amber-400 animate-pulse" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 animate-bounce">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md">
                    طلب جديد 📦
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{activeToast.timestamp}</span>
                </div>
                <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1">{activeToast.storeName}</h4>
              </div>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">{activeToast.order.customerName}</span>
              <span className="text-emerald-400 font-black font-mono">
                {activeToast.order.totalAmount.toLocaleString()} دج
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>📍 {activeToast.order.customerCity}</span>
              <span>•</span>
              <span className="font-mono text-indigo-300">{activeToast.order.id}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              <span>{soundEnabled ? 'الصوت مفعّل' : 'الصوت مكتوم'}</span>
            </button>

            {activeToast.storeSlug && onSelectStoreOrder && (
              <button
                onClick={() => {
                  onSelectStoreOrder(activeToast.storeSlug!, activeToast.order.id);
                  setActiveToast(null);
                }}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition"
              >
                عرض الطلب
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Bell Trigger Button & Dropdown */}
      {!hideFloatingButton && (
        <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) markAllAsRead();
          }}
          className={`relative p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition flex items-center gap-2 ${
            unreadCount > 0
              ? 'bg-slate-900 text-amber-300 border-amber-400/40 hover:border-amber-400'
              : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white hover:text-indigo-600'
          }`}
          title="نظام إشعارات الطلبات"
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-wiggle text-amber-400' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="text-xs font-bold hidden sm:inline">الإشعارات</span>
        </button>

        {/* Dropdown History Panel */}
        {isOpen && (
          <div className="absolute top-12 right-0 sm:left-0 sm:right-auto w-80 md:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 space-y-3 z-50 text-slate-800 max-h-[85vh] flex flex-col dir-rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Cairo']">سجل تنبيهات الطلبات</h3>
                  <p className="text-[11px] text-slate-500">إشعارات فورية عند إرسال طلب جديد</p>
                </div>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                title={soundEnabled ? 'تعطيل الصوت' : 'تفعيل الصوت'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
            </div>

            {/* Quick Test Simulation Button */}
            <button
              onClick={handleSimulateTestOrder}
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-indigo-600 text-white rounded-xl text-xs font-bold hover:brightness-110 transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>محاكاة وصول طلب جديد الآن ⚡</span>
            </button>

            {/* Notification List */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1 max-h-80">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">لا توجد إشعارات طلبات جديدة حالياً</p>
                  <p className="text-[11px] text-slate-400">جرب الضغط على "محاكاة وصول طلب جديد"</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-200 transition space-y-1.5 text-right"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 font-['Cairo']">{n.storeName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{n.timestamp}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">{n.order.customerName}</span>
                      <span className="font-black text-indigo-600 font-mono">
                        {n.order.totalAmount.toLocaleString()} دج
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>📍 {n.order.customerCity}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{n.order.status}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => setNotifications([])}
                  className="text-[11px] text-slate-400 hover:text-red-500 transition"
                >
                  مسح كافة الإشعارات
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};
