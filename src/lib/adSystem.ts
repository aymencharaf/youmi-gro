import { Advertisement, AdPackage, AdSettings, AdType, AdPlacement, AdStatus, AdPaymentStatus } from '../types';
import { api } from './api';

// ==========================================
// DEFAULT CONFIGURATIONS
// ==========================================

export const DEFAULT_AD_SETTINGS: AdSettings = {
  googleAdsenseEnabled: ((import.meta as any).env?.VITE_ADSENSE_ENABLED === 'true') || false,
  googleAdsenseClientId: ((import.meta as any).env?.VITE_ADSENSE_CLIENT_ID as string) || '',
  sellerAdvertisingEnabled: true,
  requireAdminApproval: true,
  maxAdsPerPosition: 4,
  defaultAdDurationDays: 15,
};

export const DEFAULT_AD_PACKAGES: AdPackage[] = [
  {
    id: 'pkg-basic',
    nameAr: 'باقة Basic البرونزية',
    nameFr: 'Pack Basic Bronze',
    priceDzd: 2500,
    durationDays: 7,
    adType: 'sponsored_product',
    placement: 'sponsored_grid',
    priority: 1,
    descriptionAr: 'ترويج منتج في قسم المنتجات الممولة لمدة 7 أيام',
    descriptionFr: 'Promotion de produit dans la grille sponsorisée pendant 7 jours',
    active: true,
  },
  {
    id: 'pkg-standard',
    nameAr: 'باقة Standard الفضية',
    nameFr: 'Pack Standard Argent',
    priceDzd: 5000,
    durationDays: 15,
    adType: 'featured_product',
    placement: 'homepage_middle',
    priority: 3,
    descriptionAr: 'ظهور مميز أعلى تصنيفات الجملة والصفحة الرئيسية لمدة 15 يوماً',
    descriptionFr: 'Affichage en vedette en haut des catégories B2B pendant 15 jours',
    active: true,
  },
  {
    id: 'pkg-premium',
    nameAr: 'باقة Premium الذهبية',
    nameFr: 'Pack Premium Or',
    priceDzd: 9500,
    durationDays: 30,
    adType: 'homepage_banner',
    placement: 'homepage_top',
    priority: 5,
    descriptionAr: 'بانر رئيسي ضخم في أعلى المنصة + متجر مميز لمدة 30 يوماً كاملة',
    descriptionFr: 'Bannière principale en haut du site + Boutique en vedette pendant 30 jours',
    active: true,
  },
];

export const INITIAL_DEMO_ADS: Advertisement[] = [
  {
    id: 'ad-demo-1',
    merchantUserId: 'demo-merchant-1',
    merchantName: 'مؤسسة الجزائر للإلكترونيات B2B',
    storeId: 'store-demo-1',
    storeSlug: 'algeria-tech',
    storeName: 'الجزائر تيك بالجملة',
    productId: 'p-demo-1',
    productTitle: 'حاسوب محمول مستورد - جملة المصنع',
    adType: 'sponsored_product',
    placement: 'sponsored_grid',
    category: 'إلكترونيات وتكنولوجيا',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    titleAr: 'عرض حصري: حواسيب محمولة بالجملة للموزعين',
    titleFr: 'Offre Exclusive: Laptops en Gros pour Revendeurs',
    descriptionAr: 'أسعار خيالية للكميات الكبيرة مع ضمان 12 شهراً وشحن سريع.',
    descriptionFr: 'Prix imbattables pour les grandes quantités avec garantie 12 mois.',
    targetUrl: '/store/algeria-tech',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    priceDzd: 9500,
    packageId: 'pkg-premium',
    status: 'approved',
    paymentStatus: 'paid',
    paymentTxId: 'BM-88392019',
    paymentMethod: 'BaridiMob',
    priority: 5,
    impressions: 1420,
    clicks: 185,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad-demo-2',
    merchantUserId: 'demo-merchant-2',
    merchantName: 'مصنع الأوراس للألبسة والملابس',
    storeId: 'store-demo-2',
    storeSlug: 'auras-fashion',
    storeName: 'الأوراس فاشن بالجملة',
    adType: 'featured_store',
    placement: 'featured_store_section',
    category: 'ملابس وأزياء',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    titleAr: 'متجر الأوراس فاشن - أصل الملابس الجاهزة',
    titleFr: 'Boutique Auras Fashion - Grossiste Textile',
    descriptionAr: 'تخفيضات موسمية على تشكيلة الملابس الصيفية والشتوية للتجار.',
    descriptionFr: 'Remises saisonnières sur la collection de vêtements.',
    targetUrl: '/store/auras-fashion',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    priceDzd: 5000,
    packageId: 'pkg-standard',
    status: 'approved',
    paymentStatus: 'paid',
    paymentTxId: 'BM-19302847',
    paymentMethod: 'BaridiMob',
    priority: 3,
    impressions: 890,
    clicks: 94,
    createdAt: new Date().toISOString(),
  },
];

// ==========================================
// KEYS & LOCALSTORAGE HELPERS
// ==========================================

const STORAGE_AD_SETTINGS_KEY = 'youmi_ad_settings';
const STORAGE_AD_PACKAGES_KEY = 'youmi_ad_packages';
const STORAGE_ADS_KEY = 'youmi_advertisements';
const STORAGE_IMPRESSIONS_SET = 'youmi_recorded_impressions_session';

// Ad Settings Methods
export function getAdSettings(): AdSettings {
  try {
    const raw = localStorage.getItem(STORAGE_AD_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_AD_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {}
  return DEFAULT_AD_SETTINGS;
}

export function saveAdSettings(settings: AdSettings): void {
  localStorage.setItem(STORAGE_AD_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('youmi_ad_settings_updated', { detail: settings }));
  api.savePlatformSettings({ adSettings: settings }).catch(() => {});
}

// Ad Packages Methods
export function getAdPackages(): AdPackage[] {
  try {
    const raw = localStorage.getItem(STORAGE_AD_PACKAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_AD_PACKAGES;
}

export function saveAdPackages(packages: AdPackage[]): void {
  localStorage.setItem(STORAGE_AD_PACKAGES_KEY, JSON.stringify(packages));
  window.dispatchEvent(new CustomEvent('youmi_ad_packages_updated', { detail: packages }));
  api.savePlatformSettings({ adPackages: packages }).catch(() => {});
}

// Advertisements Methods
export function getAdvertisements(): Advertisement[] {
  try {
    const raw = localStorage.getItem(STORAGE_ADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_DEMO_ADS;
}

export function saveAdvertisements(ads: Advertisement[]): void {
  localStorage.setItem(STORAGE_ADS_KEY, JSON.stringify(ads));
  window.dispatchEvent(new CustomEvent('youmi_ads_updated', { detail: ads }));
  api.savePlatformSettings({ ads }).catch(() => {});
}

export function getActiveAdvertisements(placement?: AdPlacement, category?: string): Advertisement[] {
  const now = new Date();
  const settings = getAdSettings();
  const all = getAdvertisements();

  let filtered = all.filter((ad) => {
    if (ad.status !== 'approved' || ad.paymentStatus !== 'paid') return false;
    const end = new Date(ad.endDate);
    const start = new Date(ad.startDate);
    if (now > end || now < start) return false;
    if (placement && ad.placement !== placement && ad.adType !== (placement as any)) return false;
    if (category && category !== 'جميع التصنيفات' && category !== 'Tous' && ad.category && ad.category !== category) return false;
    return true;
  });

  // Sort by priority desc, then date desc
  filtered.sort((a, b) => (b.priority || 0) - (a.priority || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Cap max per position
  if (settings.maxAdsPerPosition > 0) {
    filtered = filtered.slice(0, settings.maxAdsPerPosition);
  }

  return filtered;
}

export function createAdvertisement(adData: Omit<Advertisement, 'id' | 'impressions' | 'clicks' | 'createdAt'>): Advertisement {
  const current = getAdvertisements();
  const settings = getAdSettings();

  const newAd: Advertisement = {
    ...adData,
    id: `ad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    status: settings.requireAdminApproval ? 'pending_approval' : 'approved',
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };

  const updated = [newAd, ...current];
  saveAdvertisements(updated);
  return newAd;
}

export function updateAdvertisementStatus(
  id: string,
  status: AdStatus,
  paymentStatus?: AdPaymentStatus,
  rejectionReason?: string
): Advertisement | null {
  const current = getAdvertisements();
  let updatedAd: Advertisement | null = null;

  const updated = current.map((ad) => {
    if (ad.id === id) {
      const u: Advertisement = {
        ...ad,
        status,
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(rejectionReason !== undefined ? { rejectionReason } : {}),
      };
      updatedAd = u;
      return u;
    }
    return ad;
  });

  if (updatedAd) saveAdvertisements(updated);
  return updatedAd;
}

export function recordAdImpression(adId: string): void {
  try {
    // Avoid spamming impressions in single session for same ad
    const sessionKey = `${STORAGE_IMPRESSIONS_SET}_${adId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');

    const current = getAdvertisements();
    const updated = current.map((ad) => (ad.id === adId ? { ...ad, impressions: (ad.impressions || 0) + 1 } : ad));
    saveAdvertisements(updated);
  } catch (e) {}
}

export function recordAdClick(adId: string): void {
  try {
    const current = getAdvertisements();
    const updated = current.map((ad) => (ad.id === adId ? { ...ad, clicks: (ad.clicks || 0) + 1 } : ad));
    saveAdvertisements(updated);
  } catch (e) {}
}

export function calculateCTR(clicks: number, impressions: number): string {
  if (!impressions || impressions <= 0) return '0.00%';
  const ctr = (clicks / impressions) * 100;
  return `${ctr.toFixed(2)}%`;
}

// ==========================================
// TRANSLATION STRINGS & LABELS (AR / FR)
// ==========================================

export const AD_LABELS = {
  AR: {
    adSystemTitle: 'نظام إعلانات المنصة والترويج المأجور',
    sponsored: 'ممول / إعلان',
    featured: 'مميز',
    featuredStore: 'متجر مميز',
    adBadge: 'إعلان 📢',
    adSenseBadge: 'إعلان Google',
    myAds: 'إعلاناتي والترويج 📣',
    createAd: 'إنشاء إعلان جديد 🚀',
    allAds: 'جميع الإعلانات',
    pendingApproval: 'معلقة للموافقة',
    approved: 'مقبول ومباشر',
    rejected: 'مرفوض',
    paused: 'متوقف مؤقتاً',
    expired: 'منتهي الصلاحية',
    paid: 'تم السداد ✅',
    unpaid: 'في انتظار السداد ⏳',
    refunded: 'مسترّد',
    failed: 'فشل الدفع',
    adPackages: 'الباقات الإعلانية',
    adSettings: 'إعدادات الإعلانات',
    impressions: 'مرات الظهور',
    clicks: 'عدد النقرات',
    ctr: 'معدل النقر (CTR)',
    price: 'السعر',
    duration: 'المدة',
    days: 'يوم',
    priority: 'الأولوية',
    paymentDetails: 'بيانات سداد الإعلان عبر بريدي موب / CCP',
    txId: 'رقم وصل التحويل (TxID)',
    submitAd: 'تقديم الإعلان وسداد الاشتراك',
    approveAd: 'قبول وتفعيل الإعلان',
    rejectAd: 'رفض الإعلان',
    pauseAd: 'إيقاف مؤقت',
    resumeAd: 'إعادة تفعيل',
    googleAdSenseTitle: 'إعدادات إعلانات Google AdSense',
    enableAdSense: 'تفعيل Google AdSense',
    adSenseClientId: 'معرف العميل (Client ID)',
    sellerAdsTitle: 'إعلانات البائعين والتجار',
    enableSellerAds: 'تفعيل إعلانات البائعين',
    requireApproval: 'اشتراط موافقة الأدمن على الإعلانات',
    maxAdsPerPos: 'الحد الأقصى للإعلانات في المكان الواحد',
    defaultDuration: 'المدة الافتراضية للإعلان (أيام)',
  },
  FR: {
    adSystemTitle: "Système de Publicité & Promotion Payante",
    sponsored: "Sponsorisé",
    featured: "En vedette",
    featuredStore: "Boutique en Vedette",
    adBadge: "Publicité 📢",
    adSenseBadge: "Pub Google",
    myAds: "Mes Publicités 📣",
    createAd: "Créer une Publicité 🚀",
    allAds: "Toutes les pubs",
    pendingApproval: "En attente d'approbation",
    approved: "Approuvé & En ligne",
    rejected: "Refusé",
    paused: "En pause",
    expired: "Expiré",
    paid: "Payé ✅",
    unpaid: "En attente de paiement ⏳",
    refunded: "Remboursé",
    failed: "Paiement échoué",
    adPackages: "Packs Publicitaires",
    adSettings: "Paramètres de Publicité",
    impressions: "Impressions",
    clicks: "Clics",
    ctr: "Taux de Clic (CTR)",
    price: "Prix",
    duration: "Durée",
    days: "jours",
    priority: "Priorité",
    paymentDetails: "Détails de paiement via BaridiMob / CCP",
    txId: "Numéro de récépissé (TxID)",
    submitAd: "Soumettre & Payer la pub",
    approveAd: "Approuver la publicité",
    rejectAd: "Refuser la publicité",
    pauseAd: "Mettre en pause",
    resumeAd: "Réactiver",
    googleAdSenseTitle: "Configuration Google AdSense",
    enableAdSense: "Activer Google AdSense",
    adSenseClientId: "Client ID AdSense",
    sellerAdsTitle: "Publicités Vendeurs",
    enableSellerAds: "Activer les pubs vendeurs",
    requireApproval: "Exiger l'approbation de l'admin",
    maxAdsPerPos: "Max de pubs par emplacement",
    defaultDuration: "Durée par défaut (jours)",
  },
};
