import React, { useState } from 'react';
import { Store, Order, OrderItem } from '../../types';
import { addOrderToStore } from '../../lib/storage';
import { ALGERIAN_WILAYAS_69 } from '../../data/algeriaData';
import { 
  X, 
  CreditCard, 
  User, 
  Truck, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Check
} from 'lucide-react';

interface CartItem {
  product: any;
  quantity: number;
  selectedVariant?: string;
}

interface CheckoutModalProps {
  store: Store;
  cartItems: CartItem[];
  onClose: () => void;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  store,
  cartItems,
  onClose,
  onOrderCompleted,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // 69 Wilayas, Dairas, Baladiyas State
  const [selectedWilayaCode, setSelectedWilayaCode] = useState('16');
  const [selectedDaira, setSelectedDaira] = useState('سيدي امحمد');
  const [selectedBaladiya, setSelectedBaladiya] = useState('الجزائر الوسطى');

  const currentWilayaObject = ALGERIAN_WILAYAS_69.find((w) => w.code === selectedWilayaCode) || ALGERIAN_WILAYAS_69[15];
  const availableDairas = currentWilayaObject.dairas;
  const currentDairaObject = availableDairas.find((d) => d.name === selectedDaira) || availableDairas[0];
  const availableBaladiyas = currentDairaObject ? currentDairaObject.baladiyas : [];

  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'stopdesk'>('home');
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('cod');

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string>('');
  const [couponErrorMsg, setCouponErrorMsg] = useState<string>('');

  const shippingApi = store.settings.shippingApiSettings || {
    providerName: 'ياليدين إكسبريس (Yalidine Express API)',
    homeDeliveryFee: 800,
    stopDeskFee: 400,
    active: true,
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const minWholesaleTotal = store.settings.minWholesaleCartTotal || 10000;
  const isMinTotalMet = subtotal >= minWholesaleTotal;

  const isFreeShipping = subtotal >= store.settings.freeShippingThreshold;
  const baseShippingFee = deliveryType === 'home' 
    ? (shippingApi.homeDeliveryFee || store.settings.shippingFee || 800)
    : (shippingApi.stopDeskFee || 400);

  const shippingFee = isFreeShipping ? 0 : baseShippingFee;
  const totalAmount = Math.max(0, subtotal + shippingFee - appliedDiscount);

  const handleWilayaChange = (code: string) => {
    setSelectedWilayaCode(code);
    const wilayaObj = ALGERIAN_WILAYAS_69.find((w) => w.code === code);
    if (wilayaObj && wilayaObj.dairas.length > 0) {
      const firstDaira = wilayaObj.dairas[0];
      setSelectedDaira(firstDaira.name);
      if (firstDaira.baladiyas.length > 0) {
        setSelectedBaladiya(firstDaira.baladiyas[0]);
      } else {
        setSelectedBaladiya('');
      }
    }
  };

  const handleDairaChange = (dairaName: string) => {
    setSelectedDaira(dairaName);
    const dairaObj = availableDairas.find((d) => d.name === dairaName);
    if (dairaObj && dairaObj.baladiyas.length > 0) {
      setSelectedBaladiya(dairaObj.baladiyas[0]);
    } else {
      setSelectedBaladiya('');
    }
  };

  const handleApplyCoupon = () => {
    setCouponSuccessMsg('');
    setCouponErrorMsg('');

    if (!couponCodeInput) return;

    const codeClean = couponCodeInput.trim().toUpperCase();
    const foundCoupon = store.coupons.find((c) => c.code === codeClean && c.isActive);

    if (!foundCoupon) {
      setCouponErrorMsg('كود الخصم غير صحيح أو غير متاح للطلب');
      return;
    }

    if (subtotal < foundCoupon.minOrderAmount) {
      setCouponErrorMsg(`الكود يتطلب حداً أدنى للشراء بقيمة ${foundCoupon.minOrderAmount.toLocaleString()} ${store.currency}`);
      return;
    }

    let calculatedDiscount = 0;
    if (foundCoupon.discountType === 'percentage') {
      calculatedDiscount = (subtotal * foundCoupon.discountValue) / 100;
    } else {
      calculatedDiscount = foundCoupon.discountValue;
    }

    setAppliedDiscount(calculatedDiscount);
    setCouponSuccessMsg(`تم تطبيق الخصم بقيمة ${calculatedDiscount.toLocaleString()} ${store.currency} بنجاح!`);
  };

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMinTotalMet) return;
    if (!customerName || !customerPhone || !customerAddress) return;

    const orderItems: OrderItem[] = cartItems.map((ci) => ({
      productId: ci.product.id,
      productTitle: ci.product.title,
      price: ci.product.price,
      quantity: ci.quantity,
      selectedVariant: ci.selectedVariant,
      image: ci.product.images[0],
    }));

    const providerPrefix = shippingApi.providerName?.includes('Yalidine') ? 'YAL' : 'SHIP';
    const trackingCode = `${providerPrefix}-${Math.floor(Math.random() * 89999 + 10000)}`;

    const fullLocationInfo = selectedBaladiya
      ? `بلدية ${selectedBaladiya} - دائرة ${selectedDaira}`
      : `دائرة ${selectedDaira}`;

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 89999 + 10000)}`,
      customerName: companyName ? `${customerName} (${companyName})` : customerName,
      customerPhone,
      customerCity: currentWilayaObject.name,
      customerAddress: `${fullLocationInfo} - ${customerAddress} (${deliveryType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب StopDesk'})`,
      items: orderItems,
      subtotal,
      shippingFee,
      discount: appliedDiscount,
      totalAmount,
      paymentMethod,
      status: 'جديد',
      createdAt: new Date().toLocaleDateString('ar-DZ'),
      trackingNumber: trackingCode,
      couponCode: couponSuccessMsg ? couponCodeInput.trim().toUpperCase() : undefined,
    };

    const updatedStore = addOrderToStore(store.slug, newOrder);
    if (updatedStore) {
      onOrderCompleted(newOrder);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[11px] font-bold rounded-lg">طلب جملة B2B</span>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1">
              <Truck className="w-3 h-3" />
              <span>ربط API: {shippingApi.providerName || 'شركات الشحن بالجزائر'}</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <span>إتمام طلب الشراء بالجملة</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">أدخل بيانات المؤسسة/المحل التجاري وعنوان التوصيل لـ 58 ولاية.</p>
        </div>

        {!isMinTotalMet && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">تنبيه: الحد الأدنى لسلة الجملة هو {minWholesaleTotal.toLocaleString()} {store.currency}</p>
              <p className="text-amber-800">
                إجمالي منتجاتك حالياً هو {subtotal.toLocaleString()} {store.currency}. يرجى زيادة الكمية للوصول لأصل الجملة وسداد الطلب.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleCompleteOrder} className="space-y-6">
          {/* Customer & Business Details */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>معلومات المشتري والمؤسسة</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">اسم المشتري / المسؤول *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="محمد قادري..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">اسم المحل / الشركة (اختياري)</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مؤسسة النور للتجارة والتوزيع..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">رقم الهاتف للاتصال والتاكيد *</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0550123456 / 0770123456"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">الولاية (69 ولاية جزائرية) *</label>
                <select
                  value={selectedWilayaCode}
                  onChange={(e) => handleWilayaChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  {ALGERIAN_WILAYAS_69.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">الدائرة *</label>
                <select
                  value={selectedDaira}
                  onChange={(e) => handleDairaChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  {availableDairas.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">البلدية *</label>
                <select
                  value={selectedBaladiya}
                  onChange={(e) => setSelectedBaladiya(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  {availableBaladiyas.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">العنوان التفصيلي ومكان التسليم / المحل *</label>
              <input
                type="text"
                required
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="اسم الحي، الشارع الرئيسي، رقم المحل أو المستودع بالتفصيل..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Shipping API Delivery Type Options (التحكم بواسطة API شركة الشحن) */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>طريقة التوصيل المتاحة عبر API ({shippingApi.providerName})</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                تتبع آلي
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setDeliveryType('home')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  deliveryType === 'home'
                    ? 'bg-white border-indigo-600 shadow-sm text-indigo-950 font-bold'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="text-xs">توصيل إلى باب عنوانك/المستودع</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">تسليم مباشر للمشتري</p>
                </div>
                <span className="text-xs font-black text-indigo-700">
                  {isFreeShipping ? 'مجاني' : `${shippingApi.homeDeliveryFee || 800} ${store.currency}`}
                </span>
              </div>

              <div
                onClick={() => setDeliveryType('stopdesk')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  deliveryType === 'stopdesk'
                    ? 'bg-white border-indigo-600 shadow-sm text-indigo-950 font-bold'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="text-xs">استلام من مكتب شركة الشحن (StopDesk)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">استلام من الفرع بالولايات</p>
                </div>
                <span className="text-xs font-black text-indigo-700">
                  {isFreeShipping ? 'مجاني' : `${shippingApi.stopDeskFee || 400} ${store.currency}`}
                </span>
              </div>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600">كوبون تخفيض الجملة؟</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
                placeholder="أدخل الكود (مثال: JOUMLA10)..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-800 focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
              >
                تطبيق
              </button>
            </div>
            {couponSuccessMsg && <p className="text-[11px] text-emerald-600 font-semibold">{couponSuccessMsg}</p>}
            {couponErrorMsg && <p className="text-[11px] text-rose-600 font-semibold">{couponErrorMsg}</p>}
          </div>

          {/* Payment Method Selector - COD Only */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
            <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
              <span>طريقة الدفع وسداد الشحنة: الدفع عند الاستلام فقط (COD)</span>
            </h3>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              يتم سداد قيمة الطلبية نقداً لمندوب شركة الشحن المعتمدة عند استلام شحنة الجملة في عنوانك أو بالمكتب.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs font-bold text-emerald-900">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>خيارات الدفع المفعّلة: الدفع عند الاستلام (100% مضمونة وآمنة)</span>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>إجمالي بضائع الجملة:</span>
              <span className="font-bold">{subtotal.toLocaleString()} {store.currency}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>رسوم الشحن عبر API ({deliveryType === 'home' ? 'منزل' : 'StopDesk'}):</span>
              <span className="font-bold">{shippingFee === 0 ? 'مجاني 🎉' : `${shippingFee.toLocaleString()} ${store.currency}`}</span>
            </div>

            {appliedDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>الخصم المطبق:</span>
                <span>- {appliedDiscount.toLocaleString()} {store.currency}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>الإجمالي الكلي المطلوب:</span>
              <span className="text-indigo-600 font-mono text-base">{totalAmount.toLocaleString()} {store.currency}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isMinTotalMet}
            className={`w-full py-4 text-white font-black text-base rounded-2xl shadow-md transition flex items-center justify-center gap-2 ${
              isMinTotalMet
                ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>تأكيد وشراء طلبيّة الجملة الآن ({totalAmount.toLocaleString()} {store.currency})</span>
          </button>
        </form>
      </div>
    </div>
  );
};

