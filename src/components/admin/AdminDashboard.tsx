import React, { useEffect, useMemo, useState } from 'react';
import { Store, Product, Order } from '../../types';
import { api } from '../../lib/api';
import { getStoresFromStorage, saveStoresToStorage, getMerchantCode } from '../../lib/storage';
import { YoumiLogo } from '../YoumiLogo';
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
  Building,
  CalendarDays,
  Clock,
  ToggleLeft,
  ToggleRight
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

type SubscriptionPlan = {
  id?: string;
  name: string;
  type: 'free' | 'paid';
  priceDzd: number;
  durationDays: number;
  maxProducts: number | null;
  maxStores: number;
  trialDays: number;
  active: boolean;
  isDefault: boolean;
};

const emptySubscriptionPlan: SubscriptionPlan = {
  name: '',
  type: 'free',
  priceDzd: 0,
  durationDays: 30,
  maxProducts: 20,
  maxStores: 1,
  trialDays: 30,
  active: true,
  isDefault: false,
};

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

  // Subscription plans management
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(false);
  const [subscriptionPlanModalOpen, setSubscriptionPlanModalOpen] = useState(false);
  const [editingSubscriptionPlan, setEditingSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [assignPlanStore, setAssignPlanStore] = useState<Store | null>(null);
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignPlanTrial, setAssignPlanTrial] = useState(false);
  const [extendStore, setExtendStore] = useState<Store | null>(null);
  const [extendDays, setExtendDays] = useState(30);

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

  const loadSubscriptionPlans = async () => {
    setSubscriptionPlansLoading(true);
    try {
      const r = await api.adminSubscriptionPlans();
      if (!r.ok) throw new Error(r.error || 'تعذر تحميل خطط الاشتراك');
      const raw = r.data?.plans || r.data?.subscriptionPlans || r.data?.data || [];
      setSubscriptionPlans(Array.isArray(raw) ? raw : []);
    } catch (e: any) {
      setError(e.message || 'تعذر تحميل خطط الاشتراك.');
    } finally {
      setSubscriptionPlansLoading(false);
    }
  };

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

      await loadSubscriptionPlans();
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
  
  const allMerchantsList = useMemo(() => {
    const map = new Map<string, any>();
    merchants.forEach((m) => {
      map.set(m.id, m);
    });
    adminStores.forEach((s) => {
      const key = s.merchantUserId || s.id;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: s.merchantName || s.name,
          email: s.email,
          phone: s.phone,
          company_name: s.name,
          role: 'merchant',
          status: 'active',
          storeId: s.id,
          storeName: s.name,
          storeSlug: s.slug,
        });
      }
    });
    return Array.from(map.values());
  }, [merchants, adminStores]);

  const filteredMerchants = allMerchantsList.filter((m) => {
    const associatedStore = adminStores.find((s) => s.merchantUserId === m.id || s.id === m.id || s.id === m.storeId);
    const mCode = getMerchantCode(associatedStore);
    return `${m.name || ''} ${m.phone || ''} ${m.email || ''} ${m.company_name || ''} ${m.storeName || ''} ${mCode}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });
  const filteredStores = adminStores.filter((s) => `${s.name} ${s.merchantName} ${s.category} ${s.slug} ${getMerchantCode(s)}`.toLowerCase().includes(search.toLowerCase()));
  const filteredProducts = products.filter(({ p, s }) => `${p.title} ${p.sku} ${s.name}`.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = orders.filter((o) => `${o.id} ${o.store_name || ''} ${o.merchant_name || ''} ${o.order?.customerName || ''} ${o.order?.customerPhone || ''}`.toLowerCase().includes(search.toLowerCase()));

  const setMerchantStatus = async (id: string, status: 'active' | 'suspended') => {
    setError('');
    const r = await api.merchantStatus(id, status);
    if (!r.ok && r.error && !r.error.includes('HTTP')) {
      setError(r.error || 'فشل تحديث حالة البائع');
      return;
    }
    setMerchants((prev) => {
      const exists = prev.some((m) => m.id === id);
      if (exists) {
        return prev.map((m) => (m.id === id ? { ...m, status } : m));
      } else {
        const storeFound = adminStores.find((s) => s.merchantUserId === id || s.id === id);
        return [
          ...prev,
          {
            id,
            name: storeFound?.merchantName || storeFound?.name || 'تاجر',
            phone: storeFound?.phone || '',
            email: storeFound?.email || '',
            company_name: storeFound?.name || '',
            role: 'merchant',
            status,
          },
        ];
      }
    });
    showTempSuccess(status === 'suspended' ? 'تم إيقاف حساب البائع بنجاح 🔴' : 'تم تفعيل حساب البائع بنجاح 🟢');
  };

  const deleteMerchant = async (merchantId: string, merchantName: string) => {
    if (!confirm(`هل أنت تأكد من حذف حساب البائع "${merchantName}" وجميع بيانات متجره نهائياً؟`)) {
      return;
    }
    setError('');
    const r = await api.deleteMerchant(merchantId);
    if (!r.ok && r.error && !r.error.includes('HTTP')) {
      setError(r.error || 'فشل حذف البائع');
      return;
    }

    setMerchants((prev) => prev.filter((m) => m.id !== merchantId));
    const storesToRemove = adminStores.filter((s) => s.merchantUserId === merchantId || s.id === merchantId);
    setAdminStores((prev) => prev.filter((s) => s.merchantUserId !== merchantId && s.id !== merchantId));

    storesToRemove.forEach((st) => {
      try {
        const cached = getStoresFromStorage().filter((s) => s.id !== st.id);
        saveStoresToStorage(cached);
      } catch {}
    });

    showTempSuccess(`تم حذف البائع "${merchantName}" ومتجره بنجاح 🗑️`);
  };

  const deleteStore = async (storeId: string, storeName: string) => {
    if (!confirm(`هل أنت تأكد من حذف المتجر "${storeName}" وجميع منتجاته نهائياً؟`)) {
      return;
    }
    setError('');
    const r = await api.deleteStore(storeId);
    if (!r.ok && r.error && !r.error.includes('HTTP')) {
      setError(r.error || 'فشل حذف المتجر');
      return;
    }
    setAdminStores((prev) => prev.filter((s) => s.id !== storeId));
    try {
      const cached = getStoresFromStorage().filter((s) => s.id !== storeId);
      saveStoresToStorage(cached);
    } catch {}
    showTempSuccess(`تم حذف المتجر "${storeName}" بنجاح 🗑️`);
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

  const openNewSubscriptionPlan = () => {
    setEditingSubscriptionPlan({ ...emptySubscriptionPlan });
    setSubscriptionPlanModalOpen(true);
  };

  const openEditSubscriptionPlan = (plan: SubscriptionPlan) => {
    setEditingSubscriptionPlan({
      ...emptySubscriptionPlan,
      ...plan,
      priceDzd: Number(plan.priceDzd || 0),
      durationDays: Number(plan.durationDays || 30),
      maxProducts: plan.maxProducts === null || plan.maxProducts === undefined || Number(plan.maxProducts) < 0
        ? null
        : Number(plan.maxProducts),
      maxStores: Number(plan.maxStores || 1),
      trialDays: Number(plan.trialDays || 0),
      active: plan.active !== false,
      isDefault: plan.isDefault === true,
    });
    setSubscriptionPlanModalOpen(true);
  };

  const saveSubscriptionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubscriptionPlan) return;

    const plan: SubscriptionPlan = {
      ...editingSubscriptionPlan,
      name: editingSubscriptionPlan.name.trim(),
      type: editingSubscriptionPlan.type === 'paid' ? 'paid' : 'free',
      priceDzd: editingSubscriptionPlan.type === 'free' ? 0 : Math.max(0, Number(editingSubscriptionPlan.priceDzd || 0)),
      durationDays: Math.max(1, Number(editingSubscriptionPlan.durationDays || 30)),
      maxProducts:
        editingSubscriptionPlan.maxProducts === null ||
        editingSubscriptionPlan.maxProducts === undefined ||
        Number(editingSubscriptionPlan.maxProducts) < 0
          ? null
          : Math.max(0, Number(editingSubscriptionPlan.maxProducts)),
      maxStores: Math.max(1, Number(editingSubscriptionPlan.maxStores || 1)),
      trialDays: Math.max(0, Number(editingSubscriptionPlan.trialDays || 0)),
      active: editingSubscriptionPlan.active !== false,
      isDefault: editingSubscriptionPlan.isDefault === true,
    };

    if (!plan.name) {
      setError('اسم خطة الاشتراك مطلوب.');
      return;
    }

    setError('');
    const r = await api.adminSaveSubscriptionPlan(plan);

    if (!r.ok) {
      setError(r.error || 'فشل حفظ خطة الاشتراك.');
      return;
    }

    const saved = r.data?.plan || r.data?.subscriptionPlan || plan;

    setSubscriptionPlans((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      const next = exists
        ? prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p))
        : [saved, ...prev];

      if (saved.isDefault) {
        return next.map((p) => ({
          ...p,
          isDefault: p.id === saved.id,
        }));
      }

      return next;
    });

    setSubscriptionPlanModalOpen(false);
    setEditingSubscriptionPlan(null);
    showTempSuccess('تم حفظ خطة الاشتراك بنجاح 💾');
  };

  const deleteSubscriptionPlan = async (plan: SubscriptionPlan) => {
    if (!plan.id) return;
    if (!confirm(`هل تريد حذف خطة "${plan.name}"؟`)) return;

    setError('');
    const r = await api.adminDeleteSubscriptionPlan(plan.id);

    if (!r.ok) {
      setError(r.error || 'فشل حذف خطة الاشتراك.');
      return;
    }

    setSubscriptionPlans((prev) => prev.filter((p) => p.id !== plan.id));
    showTempSuccess('تم حذف خطة الاشتراك بنجاح.');
  };

  const assignSubscriptionPlan = async () => {
    if (!assignPlanStore || !assignPlanId) {
      setError('اختر المتجر وخطة الاشتراك أولاً.');
      return;
    }

    const plan = subscriptionPlans.find((p) => p.id === assignPlanId);

    if (!plan) {
      setError('خطة الاشتراك المحددة غير موجودة.');
      return;
    }

    setError('');

    const r = await api.adminAssignSubscriptionPlan(
      assignPlanStore.id,
      assignPlanId,
      {
        durationDays: plan.durationDays,
        status: assignPlanTrial ? 'active_trial' : 'subscribed',
        isTrialActive: assignPlanTrial,
        trialDays: assignPlanTrial ? plan.trialDays : 0,
      }
    );

    if (!r.ok) {
      setError(r.error || 'فشل تعيين خطة الاشتراك.');
      return;
    }

    const updated = r.data?.store as Store | undefined;

    if (updated) {
      setAdminStores((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      onUpdateStore(updated);
    } else {
      await load();
    }

    setAssignPlanStore(null);
    setAssignPlanId('');
    setAssignPlanTrial(false);
    showTempSuccess(`تم تعيين خطة "${plan.name}" للمتجر بنجاح.`);
  };

  const extendSubscription = async () => {
    if (!extendStore) return;

    const days = Math.max(1, Number(extendDays || 0));

    if (!days) {
      setError('عدد أيام التمديد مطلوب.');
      return;
    }

    setError('');
    const r = await api.adminExtendSubscription(extendStore.id, days);

    if (!r.ok) {
      setError(r.error || 'فشل تمديد الاشتراك.');
      return;
    }

    const updated = r.data?.store as Store | undefined;

    if (updated) {
      setAdminStores((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      onUpdateStore(updated);
    }

    setExtendStore(null);
    setExtendDays(30);
    showTempSuccess(`تم تمديد اشتراك "${extendStore.name}" لمدة ${days} يومًا.`);
  };

  const toggleSubscriptionPlanActive = async (plan: SubscriptionPlan) => {
    const r = await api.adminSaveSubscriptionPlan({
      ...plan,
      active: !plan.active,
    });

    if (!r.ok) {
      setError(r.error || 'فشل تغيير حالة الخطة.');
      return;
    }

    const saved = r.data?.plan || r.data?.subscriptionPlan || {
      ...plan,
      active: !plan.active,
    };

    setSubscriptionPlans((prev) =>
      prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p))
    );

    showTempSuccess(saved.active ? 'تم تفعيل الخطة.' : 'تم تعطيل الخطة.');
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
            <div onClick={onNavigateHome} className="cursor-pointer hover:opacity-90 transition">
              <YoumiLogo variant="full" size="sm" isDark={true} />
            </div>
            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg">لوحة الإدارة</span>
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
                <h2 className="font-black mb-4">آخر البائعين المسجلين</h2>
                {merchants.slice(0, 6).map((m) => {
                  const st = adminStores.find((s) => s.merchantUserId === m.id || s.id === m.id);
                  return (
                    <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0" key={m.id}>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <b className="text-sm font-bold text-slate-900">{m.name}</b>
                          <span className="font-mono text-[10px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                            {getMerchantCode(st)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{m.company_name || m.phone || '—'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${m.status === 'suspended' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {m.status === 'suspended' ? 'موقوف' : 'نشط'}
                      </span>
                    </div>
                  );
                })}
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
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>إدارة البائعين والتجار</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  التحكم في حسابات البائعين بالجملة، تفعيل أو إيقاف الحسابات، وحذف الحسابات غير المرغوبة.
                </p>
              </div>

              {/* Stats Summary Pill */}
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 text-xs shadow-2xs">
                <span className="px-3 py-1 rounded-xl bg-slate-100 font-bold text-slate-700">
                  الإجمالي: <strong>{allMerchantsList.length}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 font-bold text-emerald-700 border border-emerald-100">
                  نشط: <strong>{allMerchantsList.filter((m) => m.status !== 'suspended').length}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-rose-50 font-bold text-rose-700 border border-rose-100">
                  موقوف: <strong>{allMerchantsList.filter((m) => m.status === 'suspended').length}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredMerchants.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Users className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="font-bold text-sm text-slate-600">لا يوجد بائعون مطابقون للبحث</p>
                  <p className="text-xs">جرب تغيير كلمات البحث أو إعادة تعيين الفلتر</p>
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="p-4 font-extrabold">رقم التسجيل</th>
                      <th className="p-4 font-extrabold">البائع / الشركة</th>
                      <th className="p-4 font-extrabold">بيانات التواصل</th>
                      <th className="p-4 font-extrabold">المتجر المربوط</th>
                      <th className="p-4 font-extrabold">حالة الحساب</th>
                      <th className="p-4 font-extrabold text-center">الإجراءات والتحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMerchants.map((m) => {
                      const associatedStore = adminStores.find(
                        (s) => s.merchantUserId === m.id || s.id === m.id || s.id === m.storeId
                      );
                      const isSuspended = m.status === 'suspended';
                      const mCode = getMerchantCode(associatedStore);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4">
                            <span className="font-mono font-black text-amber-950 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 shadow-2xs text-xs">
                              {mCode}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                            {m.company_name && (
                              <div className="text-[11px] text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                <span>{m.company_name}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-mono text-slate-800">{m.phone || '—'}</div>
                            {m.email && <div className="text-[10px] text-slate-400 font-mono truncate">{m.email}</div>}
                          </td>
                          <td className="p-4">
                            {associatedStore ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">{associatedStore.name}</span>
                                <button
                                  onClick={() => onOpenStorefront(associatedStore)}
                                  title="معاينة المتجر"
                                  className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">بدون متجر</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold ${
                                isSuspended
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isSuspended ? 'bg-rose-600' : 'bg-emerald-600'}`}></span>
                              <span>{isSuspended ? 'موقوف' : 'نشط'}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Toggle Active / Suspended */}
                              <button
                                onClick={() => setMerchantStatus(m.id, isSuspended ? 'active' : 'suspended')}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-2xs ${
                                  isSuspended
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {isSuspended ? (
                                  <>
                                    <PlayCircle className="w-4 h-4" />
                                    <span>تفعيل الحساب</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4 text-amber-600" />
                                    <span>إيقاف الحساب</span>
                                  </>
                                )}
                              </button>

                              {/* Delete Seller Button */}
                              <button
                                onClick={() => deleteMerchant(m.id, m.name)}
                                className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 flex items-center gap-1.5 transition shadow-2xs"
                                title="حذف حساب البائع والمتجر نهائياً"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>حذف بائع</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* 6. STORES TAB */}
        {tab === 'stores' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>إدارة المتاجر الفرعية</span>
              </h2>
              <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-xl">
                إجمالي المتاجر: {filteredStores.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold">المتجر</th>
                    <th className="p-4 font-bold">البائع</th>
                    <th className="p-4 font-bold">التصنيف</th>
                    <th className="p-4 font-bold">المنتجات</th>
                    <th className="p-4 font-bold">الاشتراك</th>
                    <th className="p-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStores.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <b className="text-slate-900 text-sm">{s.name}</b>
                        <p className="font-mono text-[10px] text-indigo-600">/{s.slug}</p>
                      </td>
                      <td className="p-4 font-medium text-slate-800">
                        <div>{s.merchantName}</div>
                        <span className="font-mono text-[10px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                          {getMerchantCode(s)}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{s.category}</td>
                      <td className="p-4 font-bold text-slate-900">{s.products?.length || 0} منتج</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-[11px]">
                          {s.subscription?.status || 'active_trial'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onOpenStorefront(s)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1"
                            title="فتح الواجهة"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>عرض</span>
                          </button>
                          <button
                            onClick={() => deleteStore(s.id, s.name)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 transition"
                            title="حذف المتجر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
          <div className="space-y-5">
            <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h2 className="font-black text-base flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span>خطط اشتراك البائعين</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    إنشاء وتعديل الخطط المجانية والمدفوعة وتحديد السعر والمدة وحدود المنتجات والمتاجر.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={loadSubscriptionPlans} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50">
                    <RefreshCw className={`w-4 h-4 ${subscriptionPlansLoading ? 'animate-spin' : ''}`} />
                    تحديث الخطط
                  </button>
                  <button onClick={() => setTab('baridimob')} className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    بريدي موب
                  </button>
                  <button onClick={openNewSubscriptionPlan} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm">
                    <Plus className="w-4 h-4" />
                    إضافة خطة
                  </button>
                </div>
              </div>

              <div className="p-5">
                {subscriptionPlansLoading && subscriptionPlans.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    <RefreshCw className="w-7 h-7 mx-auto mb-2 animate-spin text-indigo-500" />
                    جاري تحميل خطط الاشتراك...
                  </div>
                ) : subscriptionPlans.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">لا توجد خطط اشتراك بعد</p>
                    <p className="text-xs mt-1">أضف أول خطة مجانية أو مدفوعة.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {subscriptionPlans.map((plan) => (
                      <div key={plan.id || plan.name} className={`rounded-3xl border p-5 relative overflow-hidden ${plan.type === 'free' ? 'border-emerald-200 bg-emerald-50/30' : 'border-indigo-200 bg-indigo-50/20'} ${plan.active ? '' : 'opacity-60'}`}>
                        {plan.isDefault && (
                          <span className="absolute top-3 left-3 text-[9px] font-black px-2 py-1 rounded-lg bg-amber-400 text-slate-950">الافتراضية</span>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black ${plan.type === 'free' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                              {plan.type === 'free' ? 'مجانية' : 'مدفوعة'}
                            </span>
                            <h3 className="font-black text-slate-900 mt-2">{plan.name}</h3>
                          </div>
                          <button onClick={() => toggleSubscriptionPlanActive(plan)} title={plan.active ? 'تعطيل الخطة' : 'تفعيل الخطة'} className={`p-1.5 rounded-lg ${plan.active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                            {plan.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        </div>

                        <div className="mt-4">
                          <b className="text-2xl font-black text-slate-900">{Number(plan.priceDzd || 0).toLocaleString()}</b>
                          <span className="text-xs text-slate-500 mr-1">دج</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
                          <div className="p-2 rounded-xl bg-white border border-slate-100"><span className="block text-slate-400">المدة</span><b>{Number(plan.durationDays || 0)} يوم</b></div>
                          <div className="p-2 rounded-xl bg-white border border-slate-100"><span className="block text-slate-400">المتاجر</span><b>{Number(plan.maxStores || 1)} متجر</b></div>
                          <div className="p-2 rounded-xl bg-white border border-slate-100"><span className="block text-slate-400">المنتجات</span><b>{plan.maxProducts === null || plan.maxProducts === undefined ? 'غير محدود' : Number(plan.maxProducts)}</b></div>
                          <div className="p-2 rounded-xl bg-white border border-slate-100"><span className="block text-slate-400">التجربة</span><b>{Number(plan.trialDays || 0)} يوم</b></div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button onClick={() => openEditSubscriptionPlan(plan)} className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-indigo-700 font-bold text-[10px] flex items-center justify-center gap-1 hover:bg-indigo-50">
                            <Edit3 className="w-3.5 h-3.5" />
                            تعديل
                          </button>
                          <button onClick={() => deleteSubscriptionPlan(plan)} className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100" title="حذف الخطة">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b bg-slate-50/50">
                <h2 className="font-black text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>تعيين الخطط وتمديد اشتراكات البائعين</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">اختر الخطة لكل متجر، أو مدّد الاشتراك الحالي بعدد أيام إضافية.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-5">
                {adminStores.map((s) => {
                  const currentPlanName = s.subscription?.planName || 'بدون خطة';

                  return (
                    <div key={s.id} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <b className="text-sm font-bold text-slate-900">{s.name}</b>
                            <span className="font-mono text-[10px] font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">{getMerchantCode(s)}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{s.merchantName} ({s.phone || 'بدون هاتف'})</p>
                        </div>
                        <span className="shrink-0 text-[10px] px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold">{s.subscription?.status || 'غير محدد'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"><span className="block text-slate-400">الخطة الحالية</span><b className="text-slate-800">{currentPlanName}</b></div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"><span className="block text-slate-400">الانتهاء</span><b className="text-slate-800">{s.subscription?.expiresAt ? new Date(s.subscription.expiresAt).toLocaleDateString('ar-DZ') : 'غير محدد'}</b></div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const current = subscriptionPlans.find((p) => p.name === currentPlanName) || subscriptionPlans.find((p) => p.isDefault && p.active) || subscriptionPlans.find((p) => p.active);
                            setAssignPlanStore(s);
                            setAssignPlanId(current?.id || '');
                            setAssignPlanTrial(current?.type === 'free' && Number(current?.trialDays || 0) > 0);
                          }}
                          className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black flex items-center justify-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          تعيين خطة
                        </button>
                        <button
                          onClick={() => { setExtendStore(s); setExtendDays(30); }}
                          className="py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black flex items-center justify-center gap-1.5"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          تمديد الاشتراك
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {(['active_trial', 'subscribed', 'pending_baridimob', 'expired'] as const).map((st) => (
                          <button key={st} onClick={() => setSubscription(s, st)} className={`py-2 rounded-xl border text-[10px] font-bold transition ${s.subscription?.status === st ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 hover:bg-indigo-50'}`}>
                            {st === 'active_trial' ? 'تجربة' : st === 'subscribed' ? 'مفعل' : st === 'pending_baridimob' ? 'معلق' : 'منتهٍ'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

      </main>


      {/* Subscription Plan Create/Edit Modal */}
      {subscriptionPlanModalOpen && editingSubscriptionPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={saveSubscriptionPlan} className="bg-white rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  {editingSubscriptionPlan.id ? 'تعديل خطة الاشتراك' : 'إضافة خطة اشتراك جديدة'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">يمكن أن تكون الخطة مجانية أو مدفوعة، مع تحديد الحدود والمدة.</p>
              </div>
              <button type="button" onClick={() => { setSubscriptionPlanModalOpen(false); setEditingSubscriptionPlan(null); }}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">اسم الخطة</label>
                <input value={editingSubscriptionPlan.name} onChange={(e) => setEditingSubscriptionPlan((x) => x ? { ...x, name: e.target.value } : x)} placeholder="مثال: Youmi Pro" className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold outline-none focus:border-indigo-500" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نوع الخطة</label>
                <select value={editingSubscriptionPlan.type} onChange={(e) => setEditingSubscriptionPlan((x) => x ? { ...x, type: e.target.value as 'free' | 'paid', priceDzd: e.target.value === 'free' ? 0 : x.priceDzd } : x)} className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold bg-white outline-none">
                  <option value="free">مجانية</option>
                  <option value="paid">مدفوعة</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">السعر بالدينار الجزائري</label>
                <input type="number" min="0" disabled={editingSubscriptionPlan.type === 'free'} value={editingSubscriptionPlan.priceDzd} onChange={(e) => setEditingSubscriptionPlan((x) => x ? { ...x, priceDzd: Number(e.target.value) } : x)} className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold outline-none disabled:bg-slate-100" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">مدة الاشتراك بالأيام</label>
                <input type="number" min="1" value={editingSubscriptionPlan.durationDays} onChange={(e) => setEditingSubscriptionPlan((x) => x ? { ...x, durationDays: Number(e.target.value) } : x)} className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">مدة التجربة المجانية بالأيام</label>
                <input type="number" min="0" value={editingSubscriptionPlan.trialDays} onChange={(e) => setEditingSubscriptionPlan((x) => x ? { ...x, trialDays: Number(e.target.value) } : x)} className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">الحد الأقصى للمنتجات</label>
                <input type="number" min="-1" value={editingSubscriptionPlan.maxProducts === null ? -1 : editingSubscriptionPlan.maxProducts} onChange={(e) => { const value = Number(e.target.value); setEditingSubscriptionPlan((x) => x ? { ...x, maxProducts: value < 0 ? null : value } : x); }} className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold outline-none" />
                <p className="text-[10px] text-slate-400">اكتب -1 للمنتجات غير المحدودة.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">الحد الأقصى للمتاجر</label>
                <input type="number" min="1" value={editingSubscriptionPlan.maxStores} onChange={(e) => setEditingSubscriptionPlan((x) => x ? { ...x, maxStores: Number(e.target.value) } : x)} className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold outline-none" />
              </div>
            </div>

            <div className="flex flex-wrap gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={editingSubscriptionPlan.active} onChange={(e) => setEditingSubscriptionPlan((x) => x ? { ...x, active: e.target.checked } : x)} className="w-4 h-4 accent-indigo-600" />
                الخطة مفعلة
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={editingSubscriptionPlan.isDefault} onChange={(e) => setEditingSubscriptionPlan((x) => x ? { ...x, isDefault: e.target.checked } : x)} className="w-4 h-4 accent-amber-500" />
                الخطة الافتراضية للبائعين الجدد
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setSubscriptionPlanModalOpen(false); setEditingSubscriptionPlan(null); }} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs">إلغاء</button>
              <button type="submit" className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                حفظ الخطة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Subscription Plan Modal */}
      {assignPlanStore && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-black text-slate-900">تعيين خطة للبائع</h3>
                <p className="text-[11px] text-slate-500 mt-1">{assignPlanStore.name}</p>
              </div>
              <button onClick={() => setAssignPlanStore(null)} className="p-1"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">خطة الاشتراك</label>
              <select value={assignPlanId} onChange={(e) => setAssignPlanId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-sm font-bold">
                <option value="">اختر الخطة...</option>
                {subscriptionPlans.filter((p) => p.active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {Number(p.priceDzd || 0).toLocaleString()} دج / {Number(p.durationDays || 0)} يوم</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold cursor-pointer">
              <input type="checkbox" checked={assignPlanTrial} onChange={(e) => setAssignPlanTrial(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
              تفعيل الخطة كتجربة مجانية حسب مدة التجربة المحددة في الخطة
            </label>

            <div className="flex gap-2">
              <button onClick={() => setAssignPlanStore(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 font-bold text-xs">إلغاء</button>
              <button onClick={assignSubscriptionPlan} disabled={!assignPlanId} className="flex-1 py-3 rounded-2xl bg-indigo-600 disabled:bg-slate-300 text-white font-black text-xs flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                تعيين الخطة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Subscription Modal */}
      {extendStore && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                  تمديد اشتراك البائع
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">{extendStore.name}</p>
              </div>
              <button onClick={() => setExtendStore(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-900 leading-relaxed">
                إذا كان الاشتراك الحالي ما زال صالحًا، ستضاف الأيام إلى تاريخ انتهائه. وإذا كان منتهيًا، يبدأ التمديد من اليوم.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">عدد أيام التمديد</label>
              <input type="number" min="1" value={extendDays} onChange={(e) => setExtendDays(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold outline-none focus:border-amber-500" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setExtendStore(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 font-bold text-xs">إلغاء</button>
              <button onClick={extendSubscription} className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                تمديد الآن
              </button>
            </div>
          </div>
        </div>
      )}

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