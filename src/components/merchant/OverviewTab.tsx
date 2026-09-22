import React, { useMemo } from 'react';
import { Store, Order } from '../../types';
import {
  TrendingUp,
  ShoppingBag,
  PackageCheck,
  Users,
  PlusCircle,
  ExternalLink,
  ArrowUpRight,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Truck,
  XCircle,
  BarChart3,
  CircleDollarSign,
  Package,
  Store as StoreIcon,
  Settings2,
} from 'lucide-react';

interface OverviewTabProps {
  store: Store;
  onNavigateTab: (tab: 'products' | 'orders' | 'customizer' | 'coupons' | 'ai') => void;
  onOpenStorefront: () => void;
  onSelectOrder: (order: Order) => void;
  onRefreshStore?: () => void | Promise<void>;
  isRefreshing?: boolean;
}

const currency = (value: number, unit: string) => `${Math.max(0, value || 0).toLocaleString('ar-DZ')} ${unit}`;

export const OverviewTab: React.FC<OverviewTabProps> = ({
  store,
  onNavigateTab,
  onOpenStorefront,
  onSelectOrder,
  onRefreshStore,
  isRefreshing = false,
}) => {
  const analytics = useMemo(() => {
    const validOrders = store.orders.filter((o) => o.status !== 'ملغي');
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = validOrders.filter((o) => String(o.createdAt || '').slice(0, 10) === today);
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalSales = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = store.orders.filter((o) => o.status === 'جديد' || o.status === 'قيد المعالجة');
    const shippedOrders = store.orders.filter((o) => o.status === 'تم الشحن');
    const deliveredOrders = store.orders.filter((o) => o.status === 'تم التوصيل');
    const cancelledOrders = store.orders.filter((o) => o.status === 'ملغي');
    const lowStock = store.products.filter((p) => p.isAvailable && p.stock > 0 && p.stock <= 10);
    const outOfStock = store.products.filter((p) => p.stock <= 0 || !p.isAvailable);

    const topProducts = new Map<string, { title: string; quantity: number; revenue: number; image?: string }>();
    validOrders.forEach((order) => order.items.forEach((item) => {
      const existing = topProducts.get(item.productId) || { title: item.productTitle, quantity: 0, revenue: 0, image: item.image };
      existing.quantity += item.quantity || 0;
      existing.revenue += (item.quantity || 0) * (item.price || 0);
      topProducts.set(item.productId, existing);
    }));

    return {
      totalSales,
      todaySales,
      todayOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      lowStock,
      outOfStock,
      activeProducts: store.products.filter((p) => p.isAvailable && p.stock > 0).length,
      topProducts: Array.from(topProducts.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    };
  }, [store]);

  const getStatusBadge = (status: Order['status']) => {
    const map: Record<Order['status'], string> = {
      جديد: 'bg-blue-50 text-blue-700 border-blue-200',
      'قيد المعالجة': 'bg-amber-50 text-amber-700 border-amber-200',
      'تم الشحن': 'bg-purple-50 text-purple-700 border-purple-200',
      'تم التوصيل': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ملغي: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return map[status];
  };

  const profileChecks = [
    { label: 'شعار المتجر', done: Boolean(store.logoUrl) },
    { label: 'صورة الغلاف', done: Boolean(store.bannerUrl) },
    { label: 'وصف المتجر', done: Boolean(store.description?.trim()) },
    { label: 'بيانات التواصل', done: Boolean(store.phone || store.email) },
    { label: 'إعدادات الشحن', done: Boolean(store.settings?.shippingApiSettings?.providerName) },
  ];
  const completedProfile = profileChecks.filter((x) => x.done).length;
  const profilePercent = Math.round((completedProfile / profileChecks.length) * 100);
  const recentOrders = store.orders.slice(0, 5);

  return (
    <div className="space-y-6 dir-rtl">
      {/* Welcome + live controls */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white border border-indigo-800 shadow-lg">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-400/15 text-emerald-300 border border-emerald-300/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> المتجر متصل
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-indigo-100">{store.category}</span>
              <span className="text-[10px] text-indigo-300 font-mono">/m/{store.slug}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black mt-3 font-['Cairo']">مرحباً بك، {store.merchantName} 👋</h1>
            <p className="text-xs md:text-sm text-indigo-100 mt-1">هذه لوحة التحكم اليومية لمتابعة المبيعات والطلبات والمخزون.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onOpenStorefront} className="px-4 py-2.5 text-xs font-bold bg-white text-indigo-950 hover:bg-slate-100 rounded-xl transition flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> معاينة المتجر
            </button>
            <button
              onClick={() => void onRefreshStore?.()}
              disabled={isRefreshing}
              className="px-4 py-2.5 text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </button>
          </div>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="مبيعات اليوم" value={currency(analytics.todaySales, store.currency)} subtitle={`${analytics.todayOrders.length} طلب اليوم`} icon={<CircleDollarSign className="w-5 h-5" />} tone="emerald" />
        <MetricCard title="إجمالي المبيعات" value={currency(analytics.totalSales, store.currency)} subtitle={`${analytics.deliveredOrders.length} طلب تم توصيله`} icon={<DollarSign className="w-5 h-5" />} tone="indigo" />
        <MetricCard title="طلبات تحتاج متابعة" value={String(analytics.pendingOrders.length)} subtitle="جديد + قيد المعالجة" icon={<Clock3 className="w-5 h-5" />} tone="amber" />
        <MetricCard title="المنتجات النشطة" value={String(analytics.activeProducts)} subtitle={`${analytics.outOfStock.length} غير متاح حالياً`} icon={<PackageCheck className="w-5 h-5" />} tone="purple" />
      </div>

      {/* Order pipeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-slate-900 font-['Cairo']">حالة الطلبات</h3>
            <p className="text-[11px] text-slate-500 mt-1">نظرة سريعة على دورة الطلب داخل المتجر</p>
          </div>
          <button onClick={() => onNavigateTab('orders')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">إدارة الطلبات ←</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Pipeline label="قيد المعالجة" value={analytics.pendingOrders.length} icon={<Clock3 className="w-4 h-4" />} className="bg-amber-50 text-amber-700 border-amber-100" />
          <Pipeline label="تم الشحن" value={analytics.shippedOrders.length} icon={<Truck className="w-4 h-4" />} className="bg-purple-50 text-purple-700 border-purple-100" />
          <Pipeline label="تم التوصيل" value={analytics.deliveredOrders.length} icon={<CheckCircle2 className="w-4 h-4" />} className="bg-emerald-50 text-emerald-700 border-emerald-100" />
          <Pipeline label="ملغي" value={analytics.cancelledOrders.length} icon={<XCircle className="w-4 h-4" />} className="bg-rose-50 text-rose-700 border-rose-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 font-['Cairo']">أحدث الطلبات</h3>
              <p className="text-[11px] text-slate-500 mt-1">آخر العمليات الواردة إلى متجرك</p>
            </div>
            <button onClick={() => onNavigateTab('orders')} className="text-xs font-bold text-indigo-600">عرض الكل ({store.orders.length})</button>
          </div>
          {recentOrders.length ? (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <button key={order.id} onClick={() => onSelectOrder(order)} className="w-full p-4 text-right hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-mono text-[10px] font-black shrink-0">#{order.id.slice(-4)}</div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{order.customerName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{order.customerCity} • {order.items.length} منتج • {order.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusBadge(order.status)}`}>{order.status}</span>
                    <span className="text-sm font-black text-slate-900">{currency(order.totalAmount, store.currency)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={<ShoppingBag className="w-7 h-7" />} text="لا توجد طلبات بعد" />
          )}
        </div>

        {/* Inventory alerts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-slate-900 font-['Cairo']">تنبيهات المخزون</h3>
              <p className="text-[11px] text-slate-500 mt-1">تحتاج هذه المنتجات إلى متابعة</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          {analytics.lowStock.length || analytics.outOfStock.length ? (
            <div className="space-y-2.5">
              {analytics.outOfStock.slice(0, 3).map((p) => <StockRow key={p.id} title={p.title} stock={0} danger />)}
              {analytics.lowStock.slice(0, Math.max(0, 5 - analytics.outOfStock.length)).map((p) => <StockRow key={p.id} title={p.title} stock={p.stock} />)}
              <button onClick={() => onNavigateTab('products')} className="w-full mt-2 py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition">فتح إدارة المنتجات</button>
            </div>
          ) : (
            <EmptyState icon={<CheckCircle2 className="w-7 h-7 text-emerald-500" />} text="المخزون في وضع جيد" />
          )}
        </div>
      </div>

      {/* Top products + store profile */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-slate-900 font-['Cairo']">المنتجات الأكثر طلباً</h3>
              <p className="text-[11px] text-slate-500 mt-1">حسب الكميات المطلوبة من الطلبات المسجلة</p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-500" />
          </div>
          {analytics.topProducts.length ? analytics.topProducts.map((p, index) => (
            <div key={p.title + index} className="flex items-center gap-3 py-3 border-b last:border-0 border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black flex items-center justify-center">{index + 1}</span>
              {p.image ? <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" /> : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Package className="w-4 h-4 text-slate-400" /></div>}
              <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-800 truncate">{p.title}</p><p className="text-[10px] text-slate-500">{p.quantity.toLocaleString('ar-DZ')} وحدة</p></div>
              <span className="text-xs font-black text-slate-900">{currency(p.revenue, store.currency)}</span>
            </div>
          )) : <EmptyState icon={<Package className="w-7 h-7" />} text="ستظهر المنتجات الأكثر طلباً بعد استلام الطلبات" />}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-black text-slate-900 font-['Cairo']">جاهزية المتجر</h3><p className="text-[11px] text-slate-500 mt-1">أكمل البيانات الأساسية لتحسين تجربة العميل</p></div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center"><span className="text-sm font-black">{profilePercent}%</span><span className="text-[8px]">جاهز</span></div>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4"><div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${profilePercent}%` }} /></div>
          <div className="space-y-2">
            {profileChecks.map((check) => <div key={check.label} className="flex items-center justify-between py-2"><span className="text-xs text-slate-700">{check.label}</span>{check.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}</div>)}
          </div>
          <button onClick={() => onNavigateTab('customizer')} className="w-full mt-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-2"><Settings2 className="w-4 h-4" /> تحسين إعدادات المتجر</button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction icon={<PlusCircle className="w-5 h-5" />} title="إضافة منتج" subtitle="أضف منتج جملة جديد" onClick={() => onNavigateTab('products')} />
        <QuickAction icon={<ShoppingBag className="w-5 h-5" />} title="إدارة الطلبات" subtitle={`${analytics.pendingOrders.length} تحتاج متابعة`} onClick={() => onNavigateTab('orders')} />
        <QuickAction icon={<TagIcon />} title="العروض والكوبونات" subtitle="أنشئ عرضاً لعملائك" onClick={() => onNavigateTab('coupons')} />
        <QuickAction icon={<StoreIcon className="w-5 h-5" />} title="عرض المتجر" subtitle="شاهد تجربة العميل" onClick={onOpenStorefront} />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon, tone }: { title: string; value: string; subtitle: string; icon: React.ReactNode; tone: 'emerald' | 'indigo' | 'amber' | 'purple' }) => {
  const tones = { emerald: 'bg-emerald-50 text-emerald-600', indigo: 'bg-indigo-50 text-indigo-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600' };
  return <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{title}</span><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>{icon}</div></div><p className="text-2xl font-black text-slate-900 mt-3 font-['Cairo']">{value}</p><p className="text-[10px] text-slate-500 mt-1">{subtitle}</p></div>;
};

const Pipeline = ({ label, value, icon, className }: { label: string; value: number; icon: React.ReactNode; className: string }) => <div className={`rounded-2xl border p-4 ${className}`}><div className="flex items-center gap-2 text-[11px] font-bold">{icon}<span>{label}</span></div><p className="text-2xl font-black mt-2">{value}</p></div>;

const StockRow = ({ title, stock, danger = false }: { title: string; stock: number; danger?: boolean }) => <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}><AlertTriangle className="w-4 h-4" /></div><p className="text-xs font-bold text-slate-800 truncate flex-1">{title}</p><span className={`text-[10px] font-black ${danger ? 'text-rose-600' : 'text-amber-600'}`}>{danger ? 'نفد' : `${stock} وحدة`}</span></div>;

const QuickAction = ({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) => <button onClick={onClick} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition text-right flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">{icon}</div><div className="min-w-0"><p className="text-xs font-black text-slate-900">{title}</p><p className="text-[10px] text-slate-500 truncate">{subtitle}</p></div><ArrowUpRight className="w-4 h-4 text-slate-300 mr-auto" /></button>;

const EmptyState = ({ icon, text }: { icon: React.ReactNode; text: string }) => <div className="py-8 text-center text-slate-400"><div className="flex justify-center mb-2">{icon}</div><p className="text-xs">{text}</p></div>;
const TagIcon = () => <span className="text-base">🏷️</span>;
