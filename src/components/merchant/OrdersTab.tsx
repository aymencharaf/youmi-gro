import React, { useEffect, useMemo, useState } from 'react';
import { Store, Order, OrderStatus } from '../../types';
import { updateOrderStatus } from '../../lib/storage';
import {
  ShoppingBag, Search, Eye, Printer, X, User, Phone, MapPin, CreditCard,
  ChevronDown, Truck, Hash, FileText, Save, ExternalLink, PackageCheck,
  Clock3, CircleCheck, Ban, RefreshCw
} from 'lucide-react';

interface OrdersTabProps {
  store: Store;
  onUpdateStore: (updatedStore: Store) => void;
  selectedOrderForModal?: Order | null;
  onClearSelectedOrderModal?: () => void;
}

const shippingProviders = ['Yalidine Express', 'ZR Express', 'Ecotrack', 'EMS', 'مكتب بريد الجزائر', 'تسليم يدوي', 'أخرى'];
const statusOptions: OrderStatus[] = ['جديد', 'قيد المعالجة', 'تم الشحن', 'تم التوصيل', 'ملغي'];

const statusMeta: Record<OrderStatus, { icon: React.ReactNode; cls: string }> = {
  'جديد': { icon: <Clock3 className="w-3.5 h-3.5" />, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'قيد المعالجة': { icon: <RefreshCw className="w-3.5 h-3.5" />, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  'تم الشحن': { icon: <Truck className="w-3.5 h-3.5" />, cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'تم التوصيل': { icon: <CircleCheck className="w-3.5 h-3.5" />, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'ملغي': { icon: <Ban className="w-3.5 h-3.5" />, cls: 'bg-red-50 text-red-700 border-red-200' },
};

export const OrdersTab: React.FC<OrdersTabProps> = ({
  store,
  onUpdateStore,
  selectedOrderForModal,
  onClearSelectedOrderModal,
}) => {
  const [activeTab, setActiveTab] = useState<string>('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(selectedOrderForModal || null);
  const [shippingProvider, setShippingProvider] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [merchantNote, setMerchantNote] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (selectedOrderForModal) setViewingOrder(selectedOrderForModal);
  }, [selectedOrderForModal]);

  useEffect(() => {
    if (!viewingOrder) return;
    setShippingProvider(viewingOrder.shippingProvider || '');
    setTrackingNumber(viewingOrder.trackingNumber || '');
    setMerchantNote(viewingOrder.merchantNote || '');
    setShippingNotes(viewingOrder.shippingNotes || '');
    setSavedMessage('');
  }, [viewingOrder?.id]);

  const filteredOrders = useMemo(() => store.orders.filter((order) => {
    const matchesStatus = activeTab === 'الكل' || order.status === activeTab;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || [order.id, order.customerName, order.customerPhone, order.customerCity]
      .some(v => String(v || '').toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }), [store.orders, activeTab, searchTerm]);

  const counts = useMemo(() => ({
    all: store.orders.length,
    new: store.orders.filter(o => o.status === 'جديد').length,
    processing: store.orders.filter(o => o.status === 'قيد المعالجة').length,
    shipped: store.orders.filter(o => o.status === 'تم الشحن').length,
    delivered: store.orders.filter(o => o.status === 'تم التوصيل').length,
    cancelled: store.orders.filter(o => o.status === 'ملغي').length,
  }), [store.orders]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updated = updateOrderStatus(store.slug, orderId, newStatus);
    if (updated) {
      onUpdateStore(updated);
      if (viewingOrder?.id === orderId) setViewingOrder({ ...viewingOrder, status: newStatus });
    }
  };

  const saveShippingData = () => {
    if (!viewingOrder) return;
    setSaving(true);
    const extra = {
      shippingProvider: shippingProvider.trim(),
      trackingNumber: trackingNumber.trim(),
      merchantNote: merchantNote.trim(),
      shippingNotes: shippingNotes.trim(),
    };
    const updated = updateOrderStatus(store.slug, viewingOrder.id, viewingOrder.status, extra);
    if (updated) {
      onUpdateStore(updated);
      const latest = updated.orders.find(o => o.id === viewingOrder.id) || { ...viewingOrder, ...extra };
      setViewingOrder(latest);
      setSavedMessage('تم حفظ بيانات الشحن والطلب');
      window.setTimeout(() => setSavedMessage(''), 2500);
    }
    setSaving(false);
  };

  const printInvoice = () => window.print();

  const closeModal = () => {
    setViewingOrder(null);
    onClearSelectedOrderModal?.();
  };

  const trackingUrl = trackingNumber
    ? `https://www.google.com/search?q=${encodeURIComponent(`${shippingProvider || ''} ${trackingNumber}`.trim())}`
    : '';

  return (
    <div className="space-y-6 dir-rtl">
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-purple-600" /> إدارة الطلبات
            </h2>
            <p className="text-xs text-slate-500 mt-1">تأكيد الطلبات، تجهيز الشحن، أرقام التتبع وطباعة الفواتير.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              ['الكل', counts.all], ['جديد', counts.new], ['قيد المعالجة', counts.processing],
              ['تم الشحن', counts.shipped], ['تم التوصيل', counts.delivered], ['ملغي', counts.cancelled]
            ].map(([label, count]) => (
              <button key={String(label)} onClick={() => setActiveTab(String(label))}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition ${activeTab === label ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'}`}>
                {label} <span className="opacity-75">({count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="ابحث برقم الطلب، اسم العميل، الهاتف أو الولاية..."
          className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-600 shadow-sm" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredOrders.length ? filteredOrders.map(order => {
          const meta = statusMeta[order.status];
          return <div key={order.id} className="p-4 md:p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-100">#{order.id.slice(-5)}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{order.customerName}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold ${meta.cls}`}>{meta.icon}{order.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{order.customerCity} • {order.customerAddress}</p>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">{order.items.map(i => `${i.productTitle} ×${i.quantity}`).join('، ')}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {order.shippingProvider && <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-600"><Truck className="w-3 h-3 inline ml-1" />{order.shippingProvider}</span>}
                    {order.trackingNumber && <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-600 font-mono">#{order.trackingNumber}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between xl:justify-end gap-3 border-t xl:border-0 pt-3 xl:pt-0">
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{order.totalAmount} {store.currency}</p>
                  <p className="text-[10px] text-slate-400">{order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : order.paymentMethod}</p>
                </div>
                <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none">
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setViewingOrder(order)} className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl" title="تفاصيل الطلب"><Eye className="w-4 h-4" /></button>
              </div>
            </div>
          </div>;
        }) : <div className="text-center py-14"><ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" /><p className="text-sm font-semibold text-slate-700 mt-2">لا توجد طلبات في هذا القسم</p></div>}
      </div>

      {viewingOrder && <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[94vh] overflow-y-auto shadow-2xl text-slate-800">
          <div className="sticky top-0 z-10 bg-white p-5 border-b border-slate-100 flex items-center justify-between">
            <div><h3 className="text-lg font-black text-slate-900">تفاصيل الطلب #{viewingOrder.id}</h3><p className="text-[11px] text-slate-500">{viewingOrder.createdAt}</p></div>
            <div className="flex gap-2"><button onClick={printInvoice} className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5"><Printer className="w-4 h-4" /> طباعة</button><button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button></div>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-2"><div className="flex items-center gap-2 font-bold"><User className="w-4 h-4 text-indigo-600" />{viewingOrder.customerName}</div><div className="flex items-center gap-2 text-slate-500"><Phone className="w-4 h-4" />{viewingOrder.customerPhone}</div></div>
              <div><div className="flex items-center gap-2 font-bold"><MapPin className="w-4 h-4 text-indigo-600" />{viewingOrder.customerCity}</div><p className="text-slate-500 mt-1 mr-6">{viewingOrder.customerAddress}</p></div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              {viewingOrder.items.map((item, i) => <div key={i} className="p-3 border-b last:border-0 border-slate-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">{item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />}<div className="min-w-0"><p className="font-bold truncate">{item.productTitle}</p>{item.selectedVariant && <p className="text-[10px] text-slate-500">{item.selectedVariant}</p>}</div></div>
                <b className="shrink-0">{item.price} × {item.quantity} = {item.price * item.quantity} {store.currency}</b>
              </div>)}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-3">
                <h4 className="text-xs font-black text-indigo-900 flex items-center gap-2"><Truck className="w-4 h-4" /> بيانات الشحن</h4>
                <select value={shippingProvider} onChange={e => setShippingProvider(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"><option value="">اختر شركة/طريقة الشحن</option>{shippingProviders.map(p => <option key={p}>{p}</option>)}</select>
                <div className="relative"><Hash className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="رقم التتبع / البوليصة" className="w-full pr-9 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs" /></div>
                {trackingUrl && <a href={trackingUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-700 font-bold inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> البحث عن رقم التتبع</a>}
                <textarea value={shippingNotes} onChange={e => setShippingNotes(e.target.value)} placeholder="ملاحظات للشحن (الحي، نقطة التسليم، وقت الاتصال...)" rows={3} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs resize-none" />
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-600" /> ملاحظات البائع</h4>
                <textarea value={merchantNote} onChange={e => setMerchantNote(e.target.value)} placeholder="مثلاً: تم الاتصال بالعميل، تم تجهيز الطرد..." rows={5} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs resize-none" />
                <div className="flex items-center gap-2"><span className="text-[10px] text-slate-500">الحالة:</span><select value={viewingOrder.status} onChange={e => { const s=e.target.value as OrderStatus; handleStatusChange(viewingOrder.id,s); setViewingOrder({...viewingOrder,status:s}); }} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold">{statusOptions.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-500"><span>المجموع الفرعي</span><span>{viewingOrder.subtotal} {store.currency}</span></div>
              <div className="flex justify-between text-slate-500"><span>الشحن</span><span>{viewingOrder.shippingFee === 0 ? 'مجاني' : `${viewingOrder.shippingFee} ${store.currency}`}</span></div>
              {viewingOrder.discount > 0 && <div className="flex justify-between text-emerald-600"><span>الخصم</span><span>-{viewingOrder.discount} {store.currency}</span></div>}
              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-200"><span>الإجمالي</span><span>{viewingOrder.totalAmount} {store.currency}</span></div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="text-xs text-emerald-700 font-bold">{savedMessage}</div>
              <button disabled={saving} onClick={saveShippingData} className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2"><Save className="w-4 h-4" />{saving ? 'جاري الحفظ...' : 'حفظ بيانات الطلب والشحن'}</button>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
};
