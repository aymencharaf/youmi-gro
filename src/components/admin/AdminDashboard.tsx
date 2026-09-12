import React, { useEffect, useMemo, useState } from 'react';
import { Store, Product, Order } from '../../types';
import { api } from '../../lib/api';
import {
  Building2,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Search,
  ExternalLink,
  LogOut,
  RefreshCw,
  Globe,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Ban,
  PlayCircle,
  Edit3,
  Trash2,
  Save,
  X,
  Megaphone,
  Bell,
  Send,
  Plus,
  Check,
  PlusCircle,
  AlertCircle,
  Info,
  Sparkles,
  Phone,
  FileText,
  Building
} from 'lucide-react';
import {
  AdminBaridimobDetails,
  PlatformAnnouncement,
  MerchantNotification,
  getAdminBaridimob,
  saveAdminBaridimob,
  getPlatformAnnouncements,
  savePlatformAnnouncements,
  getMerchantNotifications,
  saveMerchantNotifications,
  sendNotificationToMerchants,
} from '../../lib/adminSettings';
import { AdminAdsManager } from './AdminAdsManager';

interface AdminDashboardProps {
  stores: Store[];
  onUpdateStore: (updatedStore: Store) => void;
  onNavigateHome: () => void;
  onLogoutAdmin: () => void;
  onOpenStorefront: (store: Store) => void;
  onOpenInfinityFreeModal: () => void;
}

type Tab = 'overview' | 'ads' | 'merchants' | 'stores' | 'products' | 'orders' | 'subscriptions' | 'announcements' | 'baridimob' | 'notifications';
const statuses = ['جديد', 'قيد المعالجة', 'تم الشحن', 'تم التوصيل', 'ملغي'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stores,
  onUpdateStore,
  onNavigateHome,
  onLogoutAdmin,
  onOpenStorefront,
  onOpenInfinityFreeModal,
}) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [stats, setStats] = useState<any>({});
  const [merchants, setMerchants] = useState<any[]>([]);
  const [adminStores, setAdminStores] = useState<Store[]>(stores);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<{ storeId: string; product: Product } | null>(null);

  // New Admin Features State: Announcements, BaridiMob details, Merchant Notifications
  const [baridimobForm, setBaridimobForm] = useState<AdminBaridimobDetails>(getAdminBaridimob());
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>(getPlatformAnnouncements());
  const [notificationsList, setNotificationsList] = useState<MerchantNotification[]>(getMerchantNotifications());

  // Announcement Edit Form Modal
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<PlatformAnnouncement>>({
    title: '',
    content: '',
    badge: 'تنبيه هام 📢',
    ctaText: '',
    targetAudience: 'all',
    active: true,
  });

  // Notification Compose Form State
  const [notifForm, setNotifForm] = useState<{
    title: string;
    message: string;
    targetMerchantId: string;
    type: 'info' | 'warning' | 'payment' | 'success';
  }>({
    title: '',
    message: '',
    targetMerchantId: 'all',
    type: 'info',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [d, m, s, o, settingsRes] = await Promise.all([
        api.dashboard(),
        api.merchants(),
        api.stores(),
        api.orders(),
        api.getPlatformSettings().catch(() => ({ ok: false, data: null })),
      ]);

      if (!d.ok) throw new Error(d.error);
      if (!m.ok) throw new Error(m.error);
      if (!s.ok) throw new Error(s.error);
      if (!o.ok) throw new Error(o.error);

      setStats(d.data?.stats || {});
      setMerchants(d.data?.merchants || m.data?.merchants || []);
      setAdminStores(s.data?.stores || []);
      setOrders(o.data?.orders || []);

      const sData = (settingsRes as any)?.data;
      if (settingsRes.ok && sData) {
        if (sData.baridimob) setBaridimobForm(sData.baridimob);
        if (sData.announcements) setAnnouncements(sData.announcements);
        if (sData.notifications) setNotificationsList(sData.notifications);
      }
    } catch (e: any) {
      setError(e.message || 'تعذر تحميل بيانات الإدارة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const products = useMemo(() => adminStores.flatMap((s) => (s.products || []).map((p) => ({ p, s }))), [adminStores]);
  const filteredMerchants = merchants.filter((m) => `${m.name} ${m.phone || ''} ${m.email || ''} ${m.company_name || ''}`.toLowerCase().includes(search.toLowerCase()));
  const filteredStores = adminStores.filter((s) => `${s.name} ${s.merchantName} ${s.category} ${s.slug}`.toLowerCase().includes(search.toLowerCase()));
  const filteredProducts = products.filter(({ p, s }) => `${p.title} ${p.sku} ${s.name}`.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = orders.filter((o) => `${o.id} ${o.store_name || ''} ${o.merchant_name || ''} ${o.order?.customerName || ''} ${o.order?.customerPhone || ''}`.toLowerCase().includes(search.toLowerCase()));

  const setMerchantStatus = async (id: string, status: 'active' | 'suspended') => {
    setError('');
    const r = await api.merchantStatus(id, status);
    if (!r.ok) {
      setError(r.error || 'فشل تحديث البائع');
      return;
    }
    setMerchants((x) => x.map((m) => (m.id === id ? { ...m, status } : m)));
    showTempSuccess('تم تحديث حالة البائع بنجاح');
  };

  const setOrderStatus = async (id: string, status: string) => {
    const r = await api.orderStatus(id, status);
    if (!r.ok) {
      setError(r.error || 'فشل تحديث الطلب');
      return;
    }
    setOrders((x) => x.map((o) => (o.id === id ? { ...o, status, order: { ...(o.order || {}), status } } : o)));
    showTempSuccess('تم تحديث حالة الطلب بنجاح');
  };

  const setSubscription = async (store: Store, status: 'active_trial' | 'subscribed' | 'pending_baridimob' | 'expired') => {
    const sub = {
      ...(store.subscription || {}),
      planName: 'خطة تجار الجملة - Youmi B2B Pro',
      status,
      monthlyFeeDzd: 3500,
      isTrialActive: status === 'active_trial',
      trialDaysLeft: status === 'active_trial' ? 30 : 0,
      baridimobPaymentDetails: {
        ripNumber: baridimobForm.ripNumber,
        ccpAccount: baridimobForm.ccpAccount,
        accountHolder: baridimobForm.accountHolder,
      },
    };
    const r = await api.adminSubscription(store.id, sub);
    if (!r.ok) {
      setError(r.error || 'فشل تحديث الاشتراك');
      return;
    }
    const updated = r.data?.store as Store;
    if (updated) {
      setAdminStores((x) => x.map((s) => (s.id === updated.id ? updated : s)));
      onUpdateStore(updated);
      showTempSuccess('تم تحديث اشتراك المتجر بنجاح');
    }
  };

  const saveProduct = async () => {
    if (!editingProduct) return;
    const r = await api.adminSaveProduct(editingProduct.storeId, editingProduct.product);
    if (!r.ok) {
      setError(r.error || 'فشل حفظ المنتج');
      return;
    }
    if (r.data?.store) {
      setAdminStores((x) => x.map((s) => (s.id === r.data.store.id ? r.data.store : s)));
      onUpdateStore(r.data.store);
    }
    setEditingProduct(null);
    showTempSuccess('تم حفظ المنتج بنجاح');
  };

  const deleteProduct = async (storeId: string, productId: string) => {
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;
    const r = await api.adminDeleteProduct(storeId, productId);
    if (!r.ok) {
      setError(r.error || 'فشل حذف المنتج');
      return;
    }
    if (r.data?.store) {
      setAdminStores((x) => x.map((s) => (s.id === r.data.store.id ? r.data.store : s)));
      onUpdateStore(r.data.store);
    }
    showTempSuccess('تم حذف المنتج بنجاح');
  };

  // BaridiMob Admin Save Handler
  const handleSaveBaridimob = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdminBaridimob(baridimobForm);
    showTempSuccess('تم حفظ بيانات حساب بريدي موب و CCP بنجاح 💾');
  };

  // Announcement Handlers
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnnouncement.title || !currentAnnouncement.content) {
      setError('العنوان والمحتوى مطلوبان للإعلان');
      return;
    }

    let updated: PlatformAnnouncement[];
    if (currentAnnouncement.id) {
      updated = announcements.map((a) => (a.id === currentAnnouncement.id ? ({ ...a, ...currentAnnouncement } as PlatformAnnouncement) : a));
    } else {
      const newAnn: PlatformAnnouncement = {
        id: `ann-${Date.now()}`,
        title: currentAnnouncement.title,
        content: currentAnnouncement.content,
        badge: currentAnnouncement.badge || 'تنبيه',
        ctaText: currentAnnouncement.ctaText || '',
        targetAudience: currentAnnouncement.targetAudience || 'all',
        active: currentAnnouncement.active !== false,
        createdAt: new Date().toISOString(),
      };
      updated = [newAnn, ...announcements];
    }

    setAnnouncements(updated);
    savePlatformAnnouncements(updated);
    setAnnouncementModalOpen(false);
    showTempSuccess('تم حفظ إعلان المنصة بنجاح 📢');
  };

  const toggleAnnouncementActive = (id: string) => {
    const updated = announcements.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
    setAnnouncements(updated);
    savePlatformAnnouncements(updated);
    showTempSuccess('تم تغيير حالة تفعيل الإعلان');
  };

  const deleteAnnouncement = (id: string) => {
    if (!confirm('هل أنت تأكد من حذف هذا الإعلان؟')) return;
    const updated = announcements.filter((a) => a.id !== id);
    setAnnouncements(updated);
    savePlatformAnnouncements(updated);
    showTempSuccess('تم حذف الإعلان');
  };

  // Merchant Notification Handlers
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) {
      setError('يرجى ملء عنوان ونص الإشعار');
      return;
    }

    const created = sendNotificationToMerchants(notifForm);
    setNotificationsList(getMerchantNotifications());
    setNotifForm({ title: '', message: '', targetMerchantId: 'all', type: 'info' });
    showTempSuccess(`تم إرسال الإشعار بنجاح إلى البائعين 🚀`);
  };

  const handleDeleteNotification = (id: string) => {
    if (!confirm('هل تريد مسح هذا الإشعار المرسل؟')) return;
    const updated = notificationsList.filter((n) => n.id !== id);
    setNotificationsList(updated);
    saveMerchantNotifications(updated);
    showTempSuccess('تم حذف الإشعار من السجل');
  };

  const showTempSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const nav = (id: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => {
        setTab(id);
        setSearch('');
      }}
      className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition shrink-0 ${
        tab === id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-['Tajawal'] dir-rtl">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white border-b border-indigo-900 shadow-md">
        <div className="max-w-[1500px] mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black font-['Cairo'] text-lg">لوحة إدارة Marketplace — Youmi</h1>
              <p className="text-[11px] text-indigo-200">الإعلانات • بريدي موب • الإشعارات • البائعون • المتاجر • الطلبات</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold flex gap-1.5 items-center hover:bg-white/20 transition">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
            <button onClick={onOpenInfinityFreeModal} className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-bold flex gap-1.5 items-center hover:bg-emerald-500/30 transition">
              <Globe className="w-4 h-4" />
              الاستضافة
            </button>
            <button onClick={onNavigateHome} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold hover:bg-white/20 transition">
              الرئيسية
            </button>
            <button onClick={onLogoutAdmin} className="px-3 py-2 rounded-xl bg-rose-600 text-xs font-bold flex gap-1.5 items-center hover:bg-rose-700 transition">
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-4 lg:px-8 py-6 space-y-5">
        {error && <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2"><XCircle className="w-4 h-4"/>{error}</div>}
        {successMsg && <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in"><CheckCircle2 className="w-4 h-4 text-emerald-600"/>{successMsg}</div>}
        {loading && <div className="text-xs font-bold text-indigo-600 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin"/>جاري تحديث لوحة الإدارة من الخادم...</div>}

        {/* Navigation Tabs Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {nav('overview', 'نظرة عامة', <TrendingUp className="w-4 h-4" />)}
          {nav('ads', 'إدارة الإعلانات 📣', <Megaphone className="w-4 h-4 text-amber-500 font-bold" />)}
          {nav('announcements', 'شريط المنصة 📢', <Megaphone className="w-4 h-4 text-amber-500" />)}
          {nav('baridimob', 'بريدي موب المدير 💳', <CreditCard className="w-4 h-4 text-emerald-500" />)}
          {nav('notifications', 'إشعارات البائعين 🚀', <Bell className="w-4 h-4 text-indigo-500" />)}
          {nav('merchants', 'البائعون', <Users className="w-4 h-4" />)}
          {nav('stores', 'المتاجر', <Building2 className="w-4 h-4" />)}
          {nav('products', 'المنتجات', <Package className="w-4 h-4" />)}
          {nav('orders', 'الطلبات', <ShoppingBag className="w-4 h-4" />)}
          {nav('subscriptions', 'الاشتراكات', <CreditCard className="w-4 h-4" />)}
        </div>

        {tab !== 'overview' && tab !== 'baridimob' && tab !== 'announcements' && tab !== 'notifications' && tab !== 'ads' && (
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في بيانات القسم الحالي..."
              className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                ['البائعون', stats.merchants, Users],
                ['المتاجر', stats.stores, Building2],
                ['المنتجات', stats.products, Package],
                ['الطلبات', stats.orders, ShoppingBag],
                ['المبيعات', `${Number(stats.sales || 0).toLocaleString()} دج`, TrendingUp],
              ].map(([l, v, I]: any) => (
                <div className="bg-white border border-slate-200 rounded-3xl p-5" key={String(l)}>
                  <I className="w-5 h-5 text-indigo-600 mb-3" />
                  <p className="text-xs text-slate-500 font-bold">{l}</p>
                  <p className="text-2xl font-black mt-1">{v || 0}</p>
                </div>
              ))}
            </div>

            {/* Platform Shortcuts Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase">إدارة المنصة المتقدمة</span>
                <h3 className="text-lg font-black font-['Cairo']">تحكم كامل بالإعلانات وبيانات الدفع والتنبيهات ⚡</h3>
                <p className="text-xs text-indigo-200">قم بتحديث حساب بريدي موب للمدير، نشر بنرات الإعلانات على واجهة المنصة، وإرسال تنبيهات فورية لكافة المتاجر.</p>
              </div>
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button onClick={() => setTab('announcements')} className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl transition flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4" />
                  <span>إدارة الإعلانات</span>
                </button>
                <button onClick={() => setTab('baridimob')} className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs rounded-2xl transition flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>تعديل بريدي موب</span>
                </button>
                <button onClick={() => setTab('notifications')} className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-black text-xs rounded-2xl transition flex items-center gap-1.5 border border-white/20">
                  <Send className="w-4 h-4" />
                  <span>إرسال إشعار للبائعين</span>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <section className="bg-white rounded-3xl border border-slate-200 p-5">
                <h2 className="font-black mb-4">آخر البائعين</h2>
                {merchants.slice(0, 6).map((m) => (
                  <div className="flex justify-between py-3 border-b last:border-0" key={m.id}>
                    <div>
                      <b className="text-sm">{m.name}</b>
                      <p className="text-[11px] text-slate-500">{m.company_name || m.phone || '—'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${m.status === 'suspended' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {m.status === 'suspended' ? 'موقوف' : 'نشط'}
                    </span>
                  </div>
                ))}
              </section>
              <section className="bg-white rounded-3xl border border-slate-200 p-5">
                <h2 className="font-black mb-4">آخر الطلبات</h2>
                {orders.slice(0, 6).map((o) => (
                  <div className="flex justify-between py-3 border-b last:border-0" key={o.id}>
                    <div>
                      <b className="font-mono text-xs">#{o.id}</b>
                      <p className="text-[11px] text-slate-500">{o.store_name || '—'} • {o.order?.customerName || '—'}</p>
                    </div>
                    <b className="text-emerald-700 text-xs">{Number(o.total_amount || o.order?.totalAmount || 0).toLocaleString()} دج</b>
                  </div>
                ))}
              </section>
            </div>
          </>
        )}

        {/* ADS SYSTEM TAB */}
        {tab === 'ads' && <AdminAdsManager stores={adminStores} />}

        {/* 2. PLATFORM ANNOUNCEMENTS TAB */}
        {tab === 'announcements' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h2 className="font-black text-base flex items-center gap-2 text-slate-900 font-['Cairo']">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  <span>إدارة إعلانات وبنرات المنصة</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">قم بنشر إعلانات وبنرات ترويجية تظهر في أعلى المنصة الرئيسية وتنبيهات البائعين والمتاجر.</p>
              </div>
              <button
                onClick={() => {
                  setCurrentAnnouncement({
                    title: '',
                    content: '',
                    badge: 'تنبيه هام 📢',
                    ctaText: 'تصفح الآن',
                    targetAudience: 'all',
                    active: true,
                  });
                  setAnnouncementModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition flex items-center gap-2 shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة إعلان جديد للمنصة</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Megaphone className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-bold">لا توجد إعلانات منشورة حالياً</p>
                  <p className="text-xs">اضغط على زر "إضافة إعلان جديد" لنشر أول إعلان بالمنصة.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className={`border rounded-3xl p-5 space-y-3 transition relative overflow-hidden ${
                        ann.active ? 'bg-gradient-to-br from-white via-amber-50/20 to-white border-amber-300/80 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg shadow-xs">
                          {ann.badge || 'إعلان'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAnnouncementActive(ann.id)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
                              ann.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {ann.active ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                            <span>{ann.active ? 'مفعل ومباشر' : 'غير مفعل'}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{ann.content}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span>الجمهور: <strong className="text-slate-800">{ann.targetAudience === 'all' ? 'جميع الزوار والتجار' : ann.targetAudience === 'merchants' ? 'البائعين فقط' : 'المشترين فقط'}</strong></span>
                          {ann.ctaText && (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">الزر: {ann.ctaText}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setCurrentAnnouncement(ann);
                              setAnnouncementModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAnnouncement(ann.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. BARIDIMOB ADMIN DETAILS TAB */}
        {tab === 'baridimob' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b bg-slate-50/50">
              <h2 className="font-black text-base flex items-center gap-2 text-slate-900 font-['Cairo']">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>إعداد وتعديل بيانات بريدي موب (BaridiMob RIP & CCP) للمدير</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">تستخدم هذه البيانات من طرف البائعين والتجار لتسديد رسوم الاشتراك الشهري أو السنوي عبر تطبيق بريدي موب والحساب البريدي.</p>
            </div>

            <div className="p-6 grid lg:grid-cols-12 gap-6">
              {/* Form Input Section */}
              <form onSubmit={handleSaveBaridimob} className="lg:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">رقم الـ RIP لتطبيق بريدي موب (20 رقم):</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={baridimobForm.ripNumber}
                      onChange={(e) => setBaridimobForm({ ...baridimobForm, ripNumber: e.target.value })}
                      placeholder="0079999900238129038201"
                      className="w-full pr-4 pl-4 py-3 rounded-2xl border border-slate-300 font-mono text-sm text-slate-900 dir-ltr text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none font-bold"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">رقم المعرف البريدي RIP المكون من 20 رقم لتطبيق بريدي موب الجزائر.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">رقم الحساب البريدي الجاري CCP والمفتاح:</label>
                  <input
                    type="text"
                    value={baridimobForm.ccpAccount}
                    onChange={(e) => setBaridimobForm({ ...baridimobForm, ccpAccount: e.target.value })}
                    placeholder="002381290 مفتاح 88"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 font-mono text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">اسم صاحب الحساب (Titulaire du Compte):</label>
                  <input
                    type="text"
                    value={baridimobForm.accountHolder}
                    onChange={(e) => setBaridimobForm({ ...baridimobForm, accountHolder: e.target.value })}
                    placeholder="مؤسسة منصة يومي للتجارة والحلول الرقمية"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">رقم الهاتف لتأكيد الوصل عبر الواتساب:</label>
                  <input
                    type="text"
                    value={baridimobForm.phone}
                    onChange={(e) => setBaridimobForm({ ...baridimobForm, phone: e.target.value })}
                    placeholder="0669964145"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 font-mono text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">إرشادات وتعليمات التحويل للبائعين:</label>
                  <textarea
                    rows={3}
                    value={baridimobForm.instructions}
                    onChange={(e) => setBaridimobForm({ ...baridimobForm, instructions: e.target.value })}
                    placeholder="يرجى تحويل مبلغ الاشتراك ثم إرسال وصل التحويل عبر بريدي موب للتفعيل..."
                    className="w-full p-3 rounded-2xl border border-slate-300 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>حفظ وتحديث بيانات بريدي موب للمدير 💾</span>
                </button>
              </form>

              {/* Live Preview Card */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-600">معاينة مباشرة لكيفية ظهور الحساب للتجار:</h3>
                
                <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-500 to-indigo-500" />

                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
                        BM
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-['Cairo']">بيانات دفع بريدي موب للمدير</h4>
                        <p className="text-[10px] text-slate-400">منصة Youmi B2B الجزائر</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      مفعل ومحدث
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">رقم المعرف البريدي (RIP):</span>
                      <span className="text-amber-300 font-black text-sm dir-ltr block text-right">{baridimobForm.ripNumber || '—'}</span>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                      <span className="text-[10px] text-slate-400 font-sans block mb-1">حساب الـ CCP:</span>
                      <span className="text-slate-200 font-bold block">{baridimobForm.ccpAccount || '—'}</span>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 font-sans text-xs space-y-1">
                      <span className="text-[10px] text-slate-400 block">صاحب الحساب:</span>
                      <span className="text-white font-bold block">{baridimobForm.accountHolder || '—'}</span>
                      {baridimobForm.phone && (
                        <span className="text-[11px] text-emerald-400 font-mono block">واتساب للتأكيد: {baridimobForm.phone}</span>
                      )}
                    </div>
                  </div>

                  {baridimobForm.instructions && (
                    <div className="text-[11px] text-slate-300 bg-indigo-950/60 p-3 rounded-2xl border border-indigo-900/50 leading-relaxed font-sans">
                      💡 {baridimobForm.instructions}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. MERCHANT PUSH NOTIFICATIONS TAB */}
        {tab === 'notifications' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b bg-slate-50/50">
              <h2 className="font-black text-base flex items-center gap-2 text-slate-900 font-['Cairo']">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>إرسال إشعارات وتنبيهات مباشرة للبائعين والتجار</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">يمكنك توجيه رسائل وتنبيهات فورية لجميع المتاجر أو لمتجر محدد تظهر له فور دخول لوحة التحكم.</p>
            </div>

            <div className="p-6 grid lg:grid-cols-12 gap-6">
              {/* Compose Notification Form */}
              <form onSubmit={handleSendNotification} className="lg:col-span-5 space-y-4 border-l pl-0 lg:pl-6 border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-600" />
                  <span>كتابة وإرسال إشعار جديد</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">عنوان التنبيه:</label>
                  <input
                    type="text"
                    value={notifForm.title}
                    onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                    placeholder="مثال: تنبيه هام بشأن تحديثات الشحن المباشر 🚚"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">نص الإشعار / الرسالة:</label>
                  <textarea
                    rows={4}
                    value={notifForm.message}
                    onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                    placeholder="اكتب هنا تفاصيل الرسالة الموجهة للتجار..."
                    className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 outline-none leading-relaxed"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">نوع التنبيه:</label>
                    <select
                      value={notifForm.type}
                      onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                    >
                      <option value="info">معلومات ℹ️</option>
                      <option value="warning">تنبيه ⚠️</option>
                      <option value="success">بشرى/نجاح ✅</option>
                      <option value="payment">اشتراك ودفع 💳</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">المتلقي (Target):</label>
                    <select
                      value={notifForm.targetMerchantId}
                      onChange={(e) => setNotifForm({ ...notifForm, targetMerchantId: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                    >
                      <option value="all">جميع البائعين 📢</option>
                      {adminStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.merchantName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الإشعار للبائعين الآن 🚀</span>
                </button>
              </form>

              {/* Notification Log List */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>سجل الإشعارات المرسلة سابقاً ({notificationsList.length})</span>
                  <button onClick={() => setNotificationsList([])} className="text-[11px] text-rose-600 hover:underline">
                    مسح السجل
                  </button>
                </h3>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {notificationsList.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">لا توجد إشعارات مرسلة في السجل.</div>
                  ) : (
                    notificationsList.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-2xl border space-y-2 relative transition ${
                          notif.type === 'warning'
                            ? 'bg-amber-50/50 border-amber-200'
                            : notif.type === 'success'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : notif.type === 'payment'
                            ? 'bg-purple-50/50 border-purple-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border font-mono">
                              {notif.type.toUpperCase()}
                            </span>
                            <b className="text-xs text-slate-900">{notif.title}</b>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(notif.createdAt).toLocaleDateString('ar-DZ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">{notif.message}</p>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                          <span>المتلقي: <strong>{notif.targetMerchantId === 'all' ? 'كافة البائعين' : 'متجر محدد'}</strong></span>
                          <button
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold"
                          >
                            حذف الإشعار
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. MERCHANTS TAB */}
        {tab === 'merchants' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="font-black">إدارة البائعين</h2>
              <p className="text-xs text-slate-500 mt-1">تفعيل أو إيقاف حسابات البائعين.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4">البائع</th>
                    <th className="p-4">الشركة</th>
                    <th className="p-4">التواصل</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMerchants.map((m) => (
                    <tr key={m.id}>
                      <td className="p-4 font-bold">{m.name}</td>
                      <td className="p-4">{m.company_name || '—'}</td>
                      <td className="p-4">{m.phone || m.email || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg font-bold ${m.status === 'suspended' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {m.status === 'suspended' ? 'موقوف' : 'نشط'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setMerchantStatus(m.id, m.status === 'suspended' ? 'active' : 'suspended')}
                          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1 ${
                            m.status === 'suspended' ? 'bg-emerald-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {m.status === 'suspended' ? <PlayCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          {m.status === 'suspended' ? 'تفعيل' : 'إيقاف'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 6. STORES TAB */}
        {tab === 'stores' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="font-black">إدارة المتاجر الفرعية</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4">المتجر</th>
                    <th className="p-4">البائع</th>
                    <th className="p-4">التصنيف</th>
                    <th className="p-4">المنتجات</th>
                    <th className="p-4">الاشتراك</th>
                    <th className="p-4">فتح</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStores.map((s) => (
                    <tr key={s.id}>
                      <td className="p-4">
                        <b>{s.name}</b>
                        <p className="font-mono text-[10px] text-slate-500">/{s.slug}</p>
                      </td>
                      <td className="p-4">{s.merchantName}</td>
                      <td className="p-4">{s.category}</td>
                      <td className="p-4 font-bold">{s.products?.length || 0}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold">{s.subscription?.status || '—'}</span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => onOpenStorefront(s)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 7. PRODUCTS TAB */}
        {tab === 'products' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="font-black">إدارة جميع المنتجات</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
              {filteredProducts.map(({ p, s }) => (
                <div className="border border-slate-200 rounded-2xl p-3" key={`${s.id}-${p.id}`}>
                  <img src={p.images?.[0]} className="w-full aspect-square object-cover rounded-xl bg-slate-50" />
                  <p className="text-[10px] text-indigo-600 font-bold mt-2">{s.name}</p>
                  <b className="text-sm line-clamp-1">{p.title}</b>
                  <p className="font-mono font-black text-emerald-700">{Number(p.price).toLocaleString()} دج</p>
                  <p className="text-[10px] text-slate-500">
                    المخزون: {p.stock} • SKU: {p.sku}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setEditingProduct({ storeId: s.id, product: { ...p } })}
                      className="flex-1 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex justify-center gap-1 hover:bg-indigo-100 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                      تعديل
                    </button>
                    <button onClick={() => deleteProduct(s.id, p.id)} className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. ORDERS TAB */}
        {tab === 'orders' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="font-black">إدارة الطلبات والشحن</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4">الطلب</th>
                    <th className="p-4">المتجر / البائع</th>
                    <th className="p-4">العميل</th>
                    <th className="p-4">القيمة</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="p-4 font-mono font-bold">#{o.id}</td>
                      <td className="p-4">
                        {o.store_name}
                        <br />
                        <span className="text-[10px] text-slate-500">{o.merchant_name}</span>
                      </td>
                      <td className="p-4">
                        {o.order?.customerName}
                        <br />
                        <span className="text-[10px]">{o.order?.customerPhone}</span>
                      </td>
                      <td className="p-4 font-black text-emerald-700">{Number(o.total_amount || o.order?.totalAmount || 0).toLocaleString()} دج</td>
                      <td className="p-4">
                        <select
                          value={o.status || o.order?.status || 'جديد'}
                          onChange={(e) => setOrderStatus(o.id, e.target.value)}
                          className="px-2 py-2 rounded-xl border bg-white text-xs font-bold"
                        >
                          <option>{statuses[0]}</option>
                          <option>{statuses[1]}</option>
                          <option>{statuses[2]}</option>
                          <option>{statuses[3]}</option>
                          <option>{statuses[4]}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 9. SUBSCRIPTIONS TAB */}
        {tab === 'subscriptions' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black">إدارة اشتراكات البائعين</h2>
                <p className="text-xs text-slate-500 mt-1">تأكيد تحويلات بريدي موب وتفعيل حسابات الاشتراكات للبائعين.</p>
              </div>
              <button onClick={() => setTab('baridimob')} className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>تعديل بريدي موب المدير</span>
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 p-5">
              {adminStores.map((s) => (
                <div key={s.id} className="border rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <b>{s.name}</b>
                      <p className="text-xs text-slate-500">{s.merchantName} ({s.phone || 'بدون هاتف'})</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold">
                      {s.subscription?.status || 'غير محدد'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {(['active_trial', 'subscribed', 'pending_baridimob', 'expired'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setSubscription(s, st)}
                        className={`py-2 rounded-xl border text-[10px] font-bold transition ${
                          s.subscription?.status === st ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 hover:bg-indigo-50'
                        }`}
                      >
                        {st === 'active_trial' ? 'تجربة 30 يوم' : st === 'subscribed' ? 'مفعل ومسدد' : st === 'pending_baridimob' ? 'معلق (وصل)' : 'منتهٍ'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black">تعديل المنتج</h3>
              <button onClick={() => setEditingProduct(null)}>
                <X />
              </button>
            </div>
            <input
              value={editingProduct.product.title}
              onChange={(e) => setEditingProduct((x) => x && { ...x, product: { ...x.product, title: e.target.value } })}
              className="w-full border rounded-xl p-3 text-sm"
              placeholder="اسم المنتج"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={editingProduct.product.price}
                onChange={(e) => setEditingProduct((x) => x && { ...x, product: { ...x.product, price: Number(e.target.value) } })}
                className="border rounded-xl p-3 text-sm"
                placeholder="السعر"
              />
              <input
                type="number"
                value={editingProduct.product.stock}
                onChange={(e) => setEditingProduct((x) => x && { ...x, product: { ...x.product, stock: Number(e.target.value) } })}
                className="border rounded-xl p-3 text-sm"
                placeholder="المخزون"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingProduct(null)} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-xs">
                إلغاء
              </button>
              <button onClick={saveProduct} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Edit/Create Modal */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveAnnouncement} className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-black text-slate-900 text-base font-['Cairo'] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <span>{currentAnnouncement.id ? 'تعديل إعلان المنصة' : 'إنشاء إعلان منصة جديد'}</span>
              </h3>
              <button type="button" onClick={() => setAnnouncementModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">عنوان الإعلان الرئيسي:</label>
              <input
                type="text"
                value={currentAnnouncement.title || ''}
                onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, title: e.target.value })}
                placeholder="مثال: تخفيضات باقات اشتراك المتاجر لـ 50% ⚡"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">تفاصيل ومحتوى الإعلان:</label>
              <textarea
                rows={3}
                value={currentAnnouncement.content || ''}
                onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, content: e.target.value })}
                placeholder="تفاصيل العروض الإعلانية الموجهة للتجار أو الزوار..."
                className="w-full p-3 rounded-2xl border border-slate-300 text-xs text-slate-900 focus:border-amber-500 outline-none leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">نص الوسام / الشارة:</label>
                <input
                  type="text"
                  value={currentAnnouncement.badge || ''}
                  onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, badge: e.target.value })}
                  placeholder="عرض خاص 🎁"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">الجمهور المستهدف:</label>
                <select
                  value={currentAnnouncement.targetAudience || 'all'}
                  onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, targetAudience: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="all">جميع المنصة (عام)</option>
                  <option value="merchants">البائعين فقط 🏪</option>
                  <option value="buyers">المشترين فقط 🛒</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="ann_active"
                checked={currentAnnouncement.active !== false}
                onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, active: e.target.checked })}
                className="w-4 h-4 text-amber-500 rounded accent-amber-500 cursor-pointer"
              />
              <label htmlFor="ann_active" className="text-xs font-bold text-slate-800 cursor-pointer">
                تفعيل الإعلان ونشره فورا بالمنصة 🟢
              </label>
            </div>

            <div className="flex gap-2 pt-3">
              <button type="button" onClick={() => setAnnouncementModalOpen(false)} className="flex-1 py-3 rounded-2xl bg-slate-100 font-bold text-xs text-slate-700">
                إلغاء
              </button>
              <button type="submit" className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20">
                <Save className="w-4 h-4" />
                <span>نشر الإعلان</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
