import React, { useState, useEffect } from 'react';
import { Store, Order } from '../../types';
import { getMerchantCode } from '../../lib/storage';
import { api } from '../../lib/api';
import { YoumiLogo } from '../YoumiLogo';
import { OverviewTab } from './OverviewTab';
import { ProductsTab } from './ProductsTab';
import { OrdersTab } from './OrdersTab';
import { CustomizerTab } from './CustomizerTab';
import { CouponsTab } from './CouponsTab';
import { AiAssistantTab } from './AiAssistantTab';
import { MerchantAdsTab } from './MerchantAdsTab';
import { SubscriptionModal } from './SubscriptionModal';
import { getAdminBaridimob, getMerchantNotifications, MerchantNotification, markNotificationAsRead } from '../../lib/adminSettings';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Palette, 
  Tag, 
  Bot, 
  ExternalLink, 
  ArrowRight,
  ChevronDown,
  Gift,
  CreditCard,
  Clock,
  Globe,
  Bell,
  X,
  Megaphone,
  CheckCircle2
} from 'lucide-react';

interface MerchantDashboardProps {
  currentStore: Store;
  allStores: Store[];
  onSelectStore?: (store: Store) => void;
  onUpdateStore?: (updatedStore: Store) => void;
  onNavigateHome?: () => void;
  onOpenStorefront?: (store: Store) => void;
  onOpenInfinityFreeModal?: () => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  currentStore,
  allStores,
  onSelectStore = (_store: Store) => {},
  onUpdateStore = (_updatedStore: Store) => {},
  onNavigateHome = () => {},
  onOpenStorefront = (_store: Store) => {},
  onOpenInfinityFreeModal = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customizer' | 'coupons' | 'ai' | 'ads'>('overview');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAdminNotifsModal, setShowAdminNotifsModal] = useState(false);
  const [isRefreshingStore, setIsRefreshingStore] = useState(false);

  const refreshMerchantStore = async () => {
    if (isRefreshingStore) return;
    setIsRefreshingStore(true);
    try {
      const result = await api.merchantStore(currentStore.id);
      if (result.ok && result.data?.store) {
        onUpdateStore(result.data.store as Store);
      }
    } finally {
      setIsRefreshingStore(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshMerchantStore();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [currentStore.id]);

  const [adminBaridimob, setAdminBaridimob] = useState(getAdminBaridimob());
  const [adminNotifications, setAdminNotifications] = useState<MerchantNotification[]>(() =>
    getMerchantNotifications().filter((n) => n.targetMerchantId === 'all' || n.targetMerchantId === currentStore.id)
  );

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setAdminBaridimob(getAdminBaridimob());
      setAdminNotifications(
        getMerchantNotifications().filter((n) => n.targetMerchantId === 'all' || n.targetMerchantId === currentStore.id)
      );
    };
    window.addEventListener('youmi_settings_updated', handleSettingsUpdate);
    window.addEventListener('youmi_new_admin_notification', handleSettingsUpdate);
    return () => {
      window.removeEventListener('youmi_settings_updated', handleSettingsUpdate);
      window.removeEventListener('youmi_new_admin_notification', handleSettingsUpdate);
    };
  }, [currentStore.id]);

  const unreadNotifsCount = adminNotifications.filter((n) => !n.readBy.includes(currentStore.id)).length;

  const sub = currentStore.subscription || {
    planName: 'خطة تجار الجملة - Youmi B2B Pro',
    trialDaysLeft: 30,
    trialStartDate: new Date().toISOString().split('T')[0],
    trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isTrialActive: true,
    status: 'active_trial' as const,
    monthlyFeeDzd: 3500,
    baridimobPaymentDetails: {
      ripNumber: adminBaridimob.ripNumber,
      ccpAccount: adminBaridimob.ccpAccount,
      accountHolder: adminBaridimob.accountHolder,
    },
  };

  const handleSelectOrderFromOverview = (order: Order) => {
    setSelectedOrderForModal(order);
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800 flex flex-col dir-rtl">
      {/* 30-Day Free Trial & BaridiMob Subscription Top Announcement Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-400 text-slate-900 font-extrabold text-[10px] rounded-md flex items-center gap-1 shadow-sm">
              <Gift className="w-3 h-3" />
              <span>30 يوماً مجاناً</span>
            </span>
            <span className="font-semibold text-slate-100">
              أهلاً بك في يومي! فترة التجربة المجانية لمتجرك مفعلة لمدة <strong className="text-amber-300 font-extrabold">30 يوماً كاملة</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>سداد الاشتراك عبر بريدي موب (3,500 دج)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Merchant Dashboard Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition"
              title="العودة للرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
              <YoumiLogo variant="header" size="sm" />
            </button>

            {/* Store Switcher Dropdown */}
            <div className="relative group">
              <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                <img
                  src={currentStore.logoUrl}
                  alt={currentStore.name}
                  className="w-8 h-8 rounded-lg object-cover bg-white border border-slate-200"
                />
                <div>
                  <h2 className="text-xs font-bold text-slate-900 font-['Cairo'] flex items-center gap-1">
                    <span>{currentStore.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono">/{currentStore.slug}</p>
                </div>
              </div>

              {/* Stores Dropdown menu */}
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 hidden group-hover:block z-50">
                <p className="text-[10px] font-bold text-slate-400 px-2 py-1">اختر متجراً للتحكم به:</p>
                {allStores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectStore(s)}
                    className={`w-full p-2.5 rounded-xl text-right transition flex items-center gap-2.5 ${
                      s.id === currentStore.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <img src={s.logoUrl} alt={s.name} className="w-6 h-6 rounded object-cover" />
                    <span className="text-xs truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* Merchant Registration Code Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold shadow-2xs">
              <span className="text-slate-500 font-normal">رقم البائع:</span>
              <span className="font-mono font-black text-amber-700">{getMerchantCode(currentStore)}</span>
            </div>

            {/* Admin Notifications Bell Button */}
            <button
              onClick={() => setShowAdminNotifsModal(true)}
              className="relative p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition border border-indigo-200"
              title="إشعارات إدارة المنصة"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onOpenStorefront(currentStore)}
              className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">معاينة المتجر المستقل</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav Tabs */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>الملخص والإحصائيات</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" />
              <span>إدارة المنتجات</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {currentStore.products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              <span>طلبات العملاء</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {currentStore.orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('customizer')}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
              activeTab === 'customizer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>تخصيص الثيم والشحن</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
              activeTab === 'coupons'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>الكوبونات والتسويق</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
              activeTab === 'ads'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-amber-700 hover:bg-white hover:text-amber-900'
            }`}
          >
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span>إعلاناتي والترويج 📣</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-purple-600 hover:bg-white hover:text-purple-700'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-600" />
            <span>مساعد الذكاء الاصطناعي</span>
          </button>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="w-full p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-2xl text-xs font-bold transition flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-amber-600" />
                <div className="text-right">
                  <p className="font-bold text-amber-950">اشتراك بريدي موب</p>
                  <p className="text-[10px] text-amber-700 font-normal">30 يوماً مجاناً (متبقي {sub.trialDaysLeft} يوم)</p>
                </div>
              </div>
              <CreditCard className="w-4 h-4 text-amber-600" />
            </button>
          </div>
        </aside>

        {/* Tab Content Display */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab
              store={currentStore}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenStorefront={() => onOpenStorefront(currentStore)}
              onSelectOrder={handleSelectOrderFromOverview}
              onRefreshStore={refreshMerchantStore}
              isRefreshing={isRefreshingStore}
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab store={currentStore} onUpdateStore={onUpdateStore} />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              store={currentStore}
              onUpdateStore={onUpdateStore}
              selectedOrderForModal={selectedOrderForModal}
              onClearSelectedOrderModal={() => setSelectedOrderForModal(null)}
            />
          )}

          {activeTab === 'customizer' && (
            <CustomizerTab store={currentStore} onUpdateStore={onUpdateStore} />
          )}

          {activeTab === 'coupons' && (
            <CouponsTab store={currentStore} onUpdateStore={onUpdateStore} />
          )}

          {activeTab === 'ads' && (
            <MerchantAdsTab store={currentStore} />
          )}

          {activeTab === 'ai' && <AiAssistantTab store={currentStore} />}
        </main>
      </div>

      {showSubscriptionModal && (
        <SubscriptionModal
          store={currentStore}
          onClose={() => setShowSubscriptionModal(false)}
          onUpdateStore={onUpdateStore}
        />
      )}

      {/* Admin Notifications Modal */}
      {showAdminNotifsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base font-['Cairo']">إشعارات وتنبيهات إدارة المنصة</h3>
              </div>
              <button onClick={() => setShowAdminNotifsModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {adminNotifications.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">لا توجد إشعارات جديدة من إدارة المنصة حالياً.</div>
              ) : (
                adminNotifications.map((notif) => {
                  const isRead = notif.readBy.includes(currentStore.id);
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border space-y-2 transition ${
                        !isRead ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(notif.createdAt).toLocaleDateString('ar-DZ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{notif.message}</p>

                      {!isRead && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              markNotificationAsRead(notif.id, currentStore.id);
                              setAdminNotifications((x) =>
                                x.map((n) => (n.id === notif.id ? { ...n, readBy: [...n.readBy, currentStore.id] } : n))
                              );
                            }}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>تعليم كتم قراءة</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setShowAdminNotifsModal(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
