import React from 'react';
import { Store, Order } from '../../types';
import { 
  TrendingUp, 
  ShoppingBag, 
  PackageCheck, 
  Users, 
  PlusCircle, 
  ExternalLink, 
  Clock, 
  ArrowUpRight,
  Eye,
  DollarSign
} from 'lucide-react';

interface OverviewTabProps {
  store: Store;
  onNavigateTab: (tab: 'products' | 'orders' | 'customizer' | 'coupons' | 'ai') => void;
  onOpenStorefront: () => void;
  onSelectOrder: (order: Order) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  store,
  onNavigateTab,
  onOpenStorefront,
  onSelectOrder,
}) => {
  const activeProducts = store.products.filter((p) => p.isAvailable).length;
  const recentOrders = store.orders.slice(0, 5);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'جديد':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'قيد المعالجة':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'تم الشحن':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'تم التوصيل':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ملغي':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 dir-rtl">
      {/* Top Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white border border-indigo-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-indigo-100 backdrop-blur-md">
              متجر نشط ({store.category})
            </span>
            <span className="text-xs text-indigo-200 font-mono">youmi.sa/m/{store.slug}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-['Cairo'] mt-2">
            مرحباً بك، {store.merchantName} 👋
          </h1>
          <p className="text-xs md:text-sm text-indigo-100 mt-1">
            إليك نظرة عامة على ملخص مبيعات ونشاط متجر <strong className="text-white">{store.name}</strong> اليوم.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenStorefront}
            className="px-4 py-2.5 text-xs font-bold bg-white text-indigo-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>عرض المتجر المستقل</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي المبيعات</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-['Cairo']">
              {store.stats.totalSales.toLocaleString('ar-SA')} <span className="text-xs text-emerald-600 font-normal">{store.currency}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>مبيعات تراكمية للمتجر</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي الطلبات</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-['Cairo']">{store.orders.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">طلبات تم استلامها</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">المنتجات النشطة</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-['Cairo']">{activeProducts}</p>
            <p className="text-[11px] text-slate-500 mt-1">من إجمالي {store.products.length} منتج</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">عدد الزوار</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-['Cairo']">{store.stats.visitorsCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">زيارة فريدة للمتجر</p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('products')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition text-right flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Cairo']">إضافة منتج جديد</h4>
              <p className="text-xs text-slate-500">أضف منتجاتك وزود وصفها بالذكاء الاصطناعي</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-[-2px] transition" />
        </button>

        <button
          onClick={() => onNavigateTab('orders')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-md transition text-right flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Cairo']">متابعة الطلبات والشحن</h4>
              <p className="text-xs text-slate-500">تحديث حالة الطلبات وطباعة الفواتير</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-[-2px] transition" />
        </button>

        <button
          onClick={() => onNavigateTab('ai')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition text-right flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Cairo']">كاتب المحتوى الإعلاني</h4>
              <p className="text-xs text-slate-500">إنشاء منشورات إنستغرام وسناب بالذكاء الاصطناعي</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-[-2px] transition" />
        </button>
      </div>

      {/* Recent Orders List */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Cairo']">أحدث الطلبات القادمة</h3>
            <p className="text-xs text-slate-500">تابع الطلبات الواردة من عملاء المتجر في الوقت الفعلي</p>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            عرض جميع الطلبات ({store.orders.length})
          </button>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 p-2.5 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    #{order.id.slice(-4)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{order.customerName}</h4>
                    <p className="text-xs text-slate-500">
                      {order.customerCity} • {order.items.length} منتجات • {order.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>

                  <span className="text-sm font-black text-slate-900 font-['Cairo']">
                    {order.totalAmount} {store.currency}
                  </span>

                  <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600 transition" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 space-y-2">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">لا توجد طلبات واردة بعد</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              عندما يقوم العملاء بالشراء من رابط متجرك المستقل ستظهر تفاصيل الطلب هنا فوراً.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
