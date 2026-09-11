import React from 'react';
import { Order, Store } from '../../types';
import { 
  CheckCircle2, 
  Printer, 
  X, 
  Truck, 
  ShoppingBag, 
  Share2,
  ArrowRight
} from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order;
  store: Store;
  onClose: () => void;
  onOpenTracker: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  store,
  onClose,
  onOpenTracker,
}) => {
  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative text-center printable-invoice">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl transition no-print"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white font-['Cairo']">شُكراً لطلبك! تم استلام الطلب بنجاح 🎉</h2>
          <p className="text-xs text-slate-400">
            تم إرسال تفاصيل الشحنة إلى متجر <strong className="text-white">{store.name}</strong> وسيتم تجهيز طلبك فوراً.
          </p>
        </div>

        {/* Order Identifier */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">رقم الطلب: </span>
            <strong className="text-white font-mono font-bold text-sm">#{order.id}</strong>
          </div>
          <div>
            <span className="text-slate-500">رمز التتبع: </span>
            <span className="text-indigo-400 font-mono font-semibold">{order.trackingNumber}</span>
          </div>
        </div>

        {/* Items Purchased List */}
        <div className="text-right space-y-2">
          <h4 className="text-xs font-bold text-slate-300">ملخص المنتجات الفاتورة:</h4>
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{item.productTitle}</p>
                  <p className="text-[11px] text-slate-500">الكمية: {item.quantity}</p>
                </div>
                <span className="font-black text-white font-['Cairo']">
                  {item.price * item.quantity} {store.currency}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-right">
          <div className="flex justify-between text-slate-400">
            <span>المجموع الفرعي:</span>
            <span>{order.subtotal} {store.currency}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>رسوم الشحن:</span>
            <span>{order.shippingFee === 0 ? 'مجاني' : `${order.shippingFee} ${store.currency}`}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>تخفيض كود الخصم:</span>
              <span>-{order.discount} {store.currency}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white font-['Cairo']">
            <span>الإجمالي المدفوع:</span>
            <span className="text-emerald-400">{order.totalAmount} {store.currency}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 no-print">
          <button
            onClick={onOpenTracker}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>تتبع حالة الشحنة والطلب</span>
          </button>

          <button
            onClick={handlePrintInvoice}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الفاتورة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
