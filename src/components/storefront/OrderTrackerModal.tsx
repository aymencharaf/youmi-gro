import React, { useState } from 'react';
import { Store, Order } from '../../types';
import { 
  X, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Package, 
  ShoppingBag 
} from 'lucide-react';

interface OrderTrackerModalProps {
  store: Store;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ store, onClose }) => {
  const [searchInput, setSearchInput] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput) return;
    setHasSearched(true);
    const cleanQuery = searchInput.trim().toLowerCase().replace('#', '');
    try {
      const res = await fetch('/api.php?action=track_order', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({query: cleanQuery}) });
      const data = await res.json();
      if (res.ok && data.status === 'success') { setFoundOrder(data.order as Order); return; }
    } catch {}
    const match = store.orders.find((o) => o.id.toLowerCase().includes(cleanQuery) || o.customerPhone.includes(cleanQuery) || (o.trackingNumber && o.trackingNumber.toLowerCase().includes(cleanQuery)));
    setFoundOrder(match || null);
  };

  const getStepProgress = (status: Order['status']) => {
    switch (status) {
      case 'جديد':
        return 1;
      case 'قيد المعالجة':
        return 2;
      case 'تم الشحن':
        return 3;
      case 'تم التوصيل':
        return 4;
      case 'ملغي':
        return 0;
      default:
        return 1;
    }
  };

  const currentStep = foundOrder ? getStepProgress(foundOrder.status) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-black text-white font-['Cairo'] flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-400" />
            <span>تتبع حالة شحنتك والطلب</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">أدخل رقم الطلب أو رقم الجوال للاستعلام عن مسار شحنتك.</p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchOrder} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="رقم الطلب (مثال: ORD-9821) أو رقم الجوال..."
              className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            استعلام
          </button>
        </form>

        {/* Search Results Display */}
        {foundOrder ? (
          <div className="space-y-6 pt-2">
            {/* Order Info Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm font-['Cairo']">طلب #{foundOrder.id}</span>
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-bold rounded-full">
                  {foundOrder.status}
                </span>
              </div>
              <p className="text-slate-400">تاريخ الطلب: {foundOrder.createdAt}</p>
              <p className="text-slate-400">العميل: {foundOrder.customerName} ({foundOrder.customerCity})</p>
              {foundOrder.trackingNumber && (
                <p className="text-indigo-400 font-mono font-semibold pt-1">
                  رمز التتبع الشحن: {foundOrder.trackingNumber}
                </p>
              )}
            </div>

            {/* Status Timeline Progress Bar */}
            {foundOrder.status !== 'ملغي' ? (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-200">مسار الشحنة المباشر:</h4>

                <div className="space-y-3">
                  <div className={`flex items-center gap-3 text-xs ${currentStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${currentStep >= 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'}`}>
                      1
                    </div>
                    <span>1. تم استلام الطلب وتأكيده</span>
                  </div>

                  <div className={`flex items-center gap-3 text-xs ${currentStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${currentStep >= 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'}`}>
                      2
                    </div>
                    <span>2. جاري التجهيز والمعالجة بالمستودع</span>
                  </div>

                  <div className={`flex items-center gap-3 text-xs ${currentStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${currentStep >= 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'}`}>
                      3
                    </div>
                    <span>3. تم تسليم الشحنة لشركة الشحن</span>
                  </div>

                  <div className={`flex items-center gap-3 text-xs ${currentStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${currentStep >= 4 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'}`}>
                      4
                    </div>
                    <span>4. تم التوصيل والإنهاء</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-center text-rose-300 text-xs">
                ⚠️ هذا الطلب ملغي. يُرجى التواصل مع المتجر لمزيد من التفاصيل.
              </div>
            )}
          </div>
        ) : (
          hasSearched && (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">لم نجد طلباً بهذة البيانات</p>
              <p className="text-[11px] text-slate-500">تأكد من كتابة رقم الطلب أو الجوال بشكل صحيح.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
