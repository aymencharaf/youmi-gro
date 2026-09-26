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

export interface StoreContactInfo {
  phone?: string;
  phone2?: string;
  whatsapp?: string;
  email?: string;
  address?: string;          // العنوان ومقر المستودع / المحل
  wilaya?: string;           // الولاية
  workingHours?: string;     // أوقات العمل والتواصل مع الزبائن
  facebook?: string;
  instagram?: string;
  telegram?: string;
  tiktok?: string;
  displayOnStorefront?: boolean; // إظهار بيانات الاتصال للزبائن بالمتجر
}

export interface StoreSettings {
  paymentMethods: PaymentSettings;
  shippingFee: number;
  freeShippingThreshold: number;
  showFreeShippingMessage?: boolean; // إظهار/إخفاء رسالة الحصول على الشحن المجاني
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
  contactInfo?: StoreContactInfo;
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
  merchantNote?: string;
  shippingNotes?: string;
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
  merchantCode?: string;      // رقم تسجيل البائع بالمنصة (مثال: Y0012)
  name: string;
  slug: string;
  category: string;
  description: string;
  slogan: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  theme: StoreTheme;
  /**
   * Authenticated user ID that owns this store.
   * The API may return merchant_user_id / user_id; storage.ts normalizes
   * those variants into this canonical field.
   */
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

// ==========================================
// ADVERTISING SYSTEM TYPES (نظام الإعلانات)
// ==========================================

export type AdType = 
  | 'featured_product'    // منتج مميز
  | 'sponsored_product'   // منتج ممول يظهر في أماكن بارزة
  | 'featured_store'     // متجر مميز
  | 'homepage_banner'    // Banner في الصفحة الرئيسية
  | 'category_banner';   // Banner داخل تصنيف محدد

export type AdPlacement = 
  | 'homepage_top'            // أعلى الصفحة الرئيسية
  | 'homepage_middle'         // بين الأقسام
  | 'sponsored_grid'          // شبكة المنتجات الممولة
  | 'category_header'         // أعلى التصنيف
  | 'featured_store_section'; // قسم المتاجر المميزة

export type AdStatus = 'pending_approval' | 'approved' | 'rejected' | 'paused' | 'expired';
export type AdPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface AdPackage {
  id: string;
  nameAr: string;
  nameFr: string;
  priceDzd: number;
  durationDays: number;
  adType: AdType;
  placement: AdPlacement;
  priority: number;
  descriptionAr: string;
  descriptionFr: string;
  maxImpressions?: number;
  active: boolean;
}

export interface Advertisement {
  id: string;
  merchantUserId: string;
  merchantName: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  productId?: string;
  productTitle?: string;
  adType: AdType;
  placement: AdPlacement;
  category?: string;
  imageUrl?: string;
  titleAr: string;
  titleFr?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  targetUrl?: string;
  startDate: string;
  endDate: string;
  priceDzd: number;
  packageId?: string;
  status: AdStatus;
  paymentStatus: AdPaymentStatus;
  paymentTxId?: string;
  paymentMethod?: string;
  priority: number;
  impressions: number;
  clicks: number;
  createdAt: string;
  rejectionReason?: string;
}

export interface AdSettings {
  googleAdsenseEnabled: boolean;
  googleAdsenseClientId: string;
  sellerAdvertisingEnabled: boolean;
  requireAdminApproval: boolean;
  maxAdsPerPosition: number;
  defaultAdDurationDays: number;
}


