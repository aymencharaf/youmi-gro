export type StoreTheme = 'modern' | 'luxury' | 'minimal' | 'vibrant';

export interface PaymentSettings {
  cod: boolean;        // الدفع عند الاستلام والتسليم
  baridimob: boolean;  // بريدي موب / البطاقة الذهبية CIB
  ccp: boolean;        // الحساب البريدي الجاري CCP
  bank_wire: boolean;  // تحويل بنكي للمؤسسات والشركات
  cash: boolean;       // تسليم واستلام بمقر المحل/المستودع
}

export interface ShippingApiSettings {
  provider: 'yalidine' | 'zr_express' | 'maystro' | 'kazitour' | 'ecotrack' | 'custom_api';
  providerName: string;
  apiKey: string;
  apiSecret?: string;
  originWilaya: string;
  originCity?: string;
  active: boolean;
  autoCreateTracking: boolean;
  customEndpointUrl?: string;
  homeDeliveryFee: number;
  stopDeskFee: number;
}

export interface StoreSettings {
  paymentMethods: PaymentSettings;
  shippingFee: number;
  freeShippingThreshold: number;
  minWholesaleCartTotal: number; // الحد الأدنى لإجمالي طلب الجملة (بالدج)
  announcementBar: string;
  shippingApiSettings: ShippingApiSettings;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
    snapchat?: string;
    facebook?: string;
  };
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;              // سعر القطعة بالجملة (دج)
  compareAtPrice?: number;    // سعر التجزئة أو السعر الأصلي
  costPrice?: number;         // تكلفة المصنع/المستورد
  minOrderQuantity: number;   // أصل الجملة / الحد الأدنى للطلب (مثلاً: 10، 20، 50)
  packageUnit: string;        // وحدة الجملة (مثلاً: "كرتونة (12 قطعة)", "طرد (50 قطعة)", "علبة")
  stock: number;              // المخزون المتاح بالوحدات
  sku: string;
  description: string;
  images: string[];
  badge?: 'الأكثر مبيعاً' | 'جديد' | 'عرض خاص' | 'أصل جملة' | 'مصنع مباشر';
  isAvailable: boolean;
  variants?: ProductVariant[];
  ratings: {
    score: number;
    count: number;
  };
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  price: number;
  quantity: number;           // عدد قطع/وحدات الجملة
  packageUnit?: string;
  selectedVariant?: string;
  image?: string;
}

export type OrderStatus = 'جديد' | 'قيد المعالجة' | 'تم الشحن' | 'تم التوصيل' | 'ملغي';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;       // الولاية / المدينة
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'baridimob' | 'ccp' | 'bank_wire' | 'cash';
  status: OrderStatus;
  createdAt: string;
  trackingNumber?: string;
  shippingProvider?: string;
  couponCode?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  usageCount: number;
  isActive: boolean;
}

export interface MerchantSubscription {
  planName: string;            // اسم الخطة (مثلاً: "خطة تجار الجملة - Youmi B2B Pro")
  trialDaysLeft: number;       // الأيام المتبقية من فترة التجربة 30 يوماً
  trialStartDate: string;      // تاريخ بدء التجربة المجانية
  trialEndDate: string;        // تاريخ انتهاء التجربة المجانية
  isTrialActive: boolean;      // حالة فترة التجربة المجانية (30 يوماً مجاناً)
  status: 'active_trial' | 'subscribed' | 'pending_baridimob' | 'expired';
  monthlyFeeDzd: number;       // قيمة اشتراك التاجر بالمنصة (مثلاً: 3,500 دج / شهرياً)
  baridimobPaymentDetails: {
    ripNumber: string;         // رقم الـ RIP لتطبيق بريدي موب (مثلاً: 00799999002381290382)
    ccpAccount: string;        // حساب الـ CCP (مثلاً: 2381290 Cle 88)
    accountHolder: string;     // اسم صاحب الحساب (مؤسسة منصة يومي للتجارة بالجملة)
  };
  lastPaymentTxId?: string;    // رقم عملية بريدي موب المسجلة
  lastPaymentDate?: string;    // تاريخ آخر سداد
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  slogan: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  theme: StoreTheme;
  merchantUserId?: string;
  merchantName: string;
  email: string;
  phone: string;
  currency: string;           // دائماً "دج" (دينار جزائري)
  createdAt: string;
  subscription?: MerchantSubscription; // اشتراك التاجر في المنصة (30 يوماً مجاناً + بريدي موب)
  settings: StoreSettings;
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  stats: {
    totalSales: number;
    visitorsCount: number;
  };
}

export type AppView = 'PLATFORM_HOME' | 'CREATE_STORE' | 'MERCHANT_DASHBOARD' | 'STORE_FRONT' | 'ADMIN_DASHBOARD';

