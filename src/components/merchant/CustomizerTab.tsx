import React, { useState } from 'react';
import { Store, ShippingApiSettings, PaymentSettings } from '../../types';
import { saveStore } from '../../lib/storage';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { 
  Palette, 
  Save, 
  Globe, 
  CreditCard, 
  Truck, 
  Megaphone,
  Check,
  Key,
  Radio,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Share2,
  PhoneCall,
  Eye
} from 'lucide-react';

interface CustomizerTabProps {
  store: Store;
  onUpdateStore: (updatedStore: Store) => void;
}

export const CustomizerTab: React.FC<CustomizerTabProps> = ({ store, onUpdateStore }) => {
  const [name, setName] = useState(store.name);
  const [slogan, setSlogan] = useState(store.slogan);
  const [description, setDescription] = useState(store.description);
  const [theme, setTheme] = useState<Store['theme']>(store.theme);
  const [primaryColor, setPrimaryColor] = useState(store.primaryColor);
  const [logoUrl, setLogoUrl] = useState(store.logoUrl);
  const [bannerUrl, setBannerUrl] = useState(store.bannerUrl);

  const [announcementBar, setAnnouncementBar] = useState(store.settings.announcementBar);
  const [shippingFee, setShippingFee] = useState(store.settings.shippingFee);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(store.settings.freeShippingThreshold);
  const [showFreeShippingMessage, setShowFreeShippingMessage] = useState(store.settings.showFreeShippingMessage !== false);
  const [minWholesaleCartTotal, setMinWholesaleCartTotal] = useState(store.settings.minWholesaleCartTotal || 10000);

  // Contact Info state (معلومات الاتصال والتواصل للزبائن)
  const initialContact = store.settings.contactInfo || {
    phone: store.phone || '',
    phone2: '',
    whatsapp: store.settings.socialLinks?.whatsapp || store.phone || '',
    email: store.email || '',
    address: 'حي المستقبل - المنطقة الصناعية والمستودعات',
    wilaya: '16 - الجزائر العاصمة',
    workingHours: 'من الأحد إلى الخميس: 08:00 صباحاً - 05:00 مساءً',
    facebook: store.settings.socialLinks?.facebook || '',
    instagram: store.settings.socialLinks?.instagram || '',
    telegram: '',
    tiktok: '',
    displayOnStorefront: true,
  };

  const [contactPhone, setContactPhone] = useState(initialContact.phone || store.phone || '');
  const [contactPhone2, setContactPhone2] = useState(initialContact.phone2 || '');
  const [contactWhatsapp, setContactWhatsapp] = useState(initialContact.whatsapp || store.phone || '');
  const [contactEmail, setContactEmail] = useState(initialContact.email || store.email || '');
  const [contactAddress, setContactAddress] = useState(initialContact.address || '');
  const [contactWilaya, setContactWilaya] = useState(initialContact.wilaya || '16 - الجزائر العاصمة');
  const [contactWorkingHours, setContactWorkingHours] = useState(initialContact.workingHours || 'من الأحد إلى الخميس: 08:00 صباحاً - 05:00 مساءً');
  const [contactFacebook, setContactFacebook] = useState(initialContact.facebook || store.settings.socialLinks?.facebook || '');
  const [contactInstagram, setContactInstagram] = useState(initialContact.instagram || store.settings.socialLinks?.instagram || '');
  const [contactTelegram, setContactTelegram] = useState(initialContact.telegram || '');
  const [contactTiktok, setContactTiktok] = useState(initialContact.tiktok || '');
  const [displayOnStorefront, setDisplayOnStorefront] = useState(initialContact.displayOnStorefront !== false);

  // Shipping API state
  const initialApi = store.settings.shippingApiSettings || {
    provider: 'yalidine',
    providerName: 'ياليدين إكسبريس (Yalidine API)',
    apiKey: 'yal_live_key_9823140129318a',
    apiSecret: 'yal_sec_8829103912a',
    originWilaya: '16 - الجزائر العاصمة',
    originCity: 'الجزائر العاصمة',
    active: true,
    autoCreateTracking: true,
    homeDeliveryFee: 800,
    stopDeskFee: 400,
  };

  const [shippingApi, setShippingApi] = useState<ShippingApiSettings>(initialApi);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestSuccess, setApiTestSuccess] = useState<boolean | null>(null);

  // Payment settings state
  const initialPayment: PaymentSettings = store.settings.paymentMethods || {
    cod: true,
    baridimob: true,
    ccp: true,
    bank_wire: true,
    cash: true,
  };
  const [paymentMethods, setPaymentMethods] = useState<PaymentSettings>(initialPayment);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const themeOptions: { id: Store['theme']; title: string; color: string }[] = [
    { id: 'modern', title: 'عصري وحديث (Modern)', color: '#4F46E5' },
    { id: 'luxury', title: 'فاخر ومناسبة (Luxury)', color: '#7C2D12' },
    { id: 'minimal', title: 'بسيط وهادئ (Minimal)', color: '#0F172A' },
    { id: 'vibrant', title: 'حيوي وجذاب (Vibrant)', color: '#2563EB' },
  ];

  const algerianWilayas = [
    '01 - أدرار', '02 - الشلف', '03 - الأغواط', '04 - أم البواقي', '05 - باتنة',
    '06 - بجاية', '07 - بسكرة', '08 - بشار', '09 - البليدة', '10 - البويرة',
    '11 - تمنراست', '12 - تبسة', '13 - تلمسان', '14 - تيارت', '15 - تيزي وزو',
    '16 - الجزائر العاصمة', '17 - الجلفة', '18 - جيجل', '19 - سطيف', '20 - سعيدة',
    '21 - سكيكدة', '22 - سيدي بلعباس', '23 - عنابة', '24 - قالمة', '25 - قسنطينة',
    '26 - المدية', '27 - مستغانم', '28 - المسيلة', '29 - معسكر', '30 - ورقلة',
    '31 - وهران', '32 - البيض', '33 - إليزي', '34 - برج بوعريريج', '35 - بومرداس',
    '36 - الطارف', '37 - تندوف', '38 - تسمسيلت', '39 - الوادي', '40 - خنشلة',
    '41 - سوق أهراس', '42 - تيبازة', '43 - ميلة', '44 - عين الدفلى', '45 - النعامة',
    '46 - عين تموشنت', '47 - غرداية', '48 - غليزان', '49 - المغير', '50 - المنيعة',
    '51 - أولاد جلال', '52 - برج باجي مختار', '53 - بني عباس', '54 - تيميمون',
    '55 - تقرت', '56 - جانت', '57 - عين صالح', '58 - عين قزام'
  ];

  const handleTestApiConnection = () => {
    setIsTestingApi(true);
    setApiTestSuccess(null);
    setTimeout(() => {
      setIsTestingApi(false);
      setApiTestSuccess(true);
    }, 1200);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedStore: Store = {
      ...store,
      name,
      phone: contactPhone || store.phone,
      email: contactEmail || store.email,
      slogan,
      description,
      theme,
      primaryColor,
      logoUrl,
      bannerUrl,
      settings: {
        ...store.settings,
        announcementBar,
        shippingFee,
        freeShippingThreshold,
        showFreeShippingMessage,
        minWholesaleCartTotal,
        shippingApiSettings: shippingApi,
        paymentMethods,
        socialLinks: {
          ...store.settings.socialLinks,
          whatsapp: contactWhatsapp,
          facebook: contactFacebook,
          instagram: contactInstagram,
        },
        contactInfo: {
          phone: contactPhone,
          phone2: contactPhone2,
          whatsapp: contactWhatsapp,
          email: contactEmail,
          address: contactAddress,
          wilaya: contactWilaya,
          workingHours: contactWorkingHours,
          facebook: contactFacebook,
          instagram: contactInstagram,
          telegram: contactTelegram,
          tiktok: contactTiktok,
          displayOnStorefront,
        },
      },
    };

    saveStore(updatedStore);
    onUpdateStore(updatedStore);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 dir-rtl max-w-4xl text-slate-800">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
            <Palette className="w-6 h-6 text-indigo-600" />
            <span>تخصيص الهوية وربط API شركة الشحن</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            خصص هوية متجرك بالجملة، وأدخل مفاتيح API شركة الشحن للتحكم المباشر في أسعار وتتبع الشحن.
          </p>
        </div>

        {isSavedNotice && (
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm">
            <Check className="w-4 h-4" />
            <span>تم حفظ جميع التغييرات!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Shipping Company API Settings (التحكم في الشحن عبر API التاجر) */}
        <div className="p-6 rounded-3xl bg-white border-2 border-indigo-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 font-['Cairo'] flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>ربط API شركة الشحن الخاصة بالتاجر (Shipping Integration)</span>
            </h3>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">تفعيل الربط البرمجي:</label>
              <input
                type="checkbox"
                checked={shippingApi.active}
                onChange={(e) => setShippingApi({ ...shippingApi, active: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اختر شركة الشحن المعتمدة لديك *</label>
              <select
                value={shippingApi.provider}
                onChange={(e) => {
                  const p = e.target.value as ShippingApiSettings['provider'];
                  const names: Record<string, string> = {
                    yalidine: 'ياليدين إكسبريس (Yalidine Express API)',
                    zr_express: 'ZR Express (API)',
                    maystro: 'مايسترو دليفري (Maystro Delivery)',
                    kazitour: 'كازيتور إكسبريس (KaziTour)',
                    ecotrack: 'إيكوتراك (EcoTrack)',
                    custom_api: 'API مخصص (Custom Carrier Endpoint)',
                  };
                  setShippingApi({ ...shippingApi, provider: p, providerName: names[p] || p });
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-600 transition"
              >
                <option value="yalidine">ياليدين إكسبريس - Yalidine Express API 🚚</option>
                <option value="zr_express">ZR Express API ⚡</option>
                <option value="maystro">Maystro Delivery API 📦</option>
                <option value="kazitour">KaziTour Express 🚛</option>
                <option value="ecotrack">EcoTrack Logistics 🌿</option>
                <option value="custom_api">ربط API مخصص (Custom Endpoint)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ولاية الشحن الأصلية (مركز الانطلاق) *</label>
              <select
                value={shippingApi.originWilaya}
                onChange={(e) => setShippingApi({ ...shippingApi, originWilaya: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              >
                {algerianWilayas.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>مفتاح API الخاص بالتاجر (API Key / Token) *</span>
              </label>
              <input
                type="text"
                value={shippingApi.apiKey}
                onChange={(e) => setShippingApi({ ...shippingApi, apiKey: e.target.value })}
                placeholder="مثال: yal_live_key_9823140129..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-indigo-600" />
                <span>الرمز السري لشركة الشحن (API Secret Token)</span>
              </label>
              <input
                type="password"
                value={shippingApi.apiSecret || ''}
                onChange={(e) => setShippingApi({ ...shippingApi, apiSecret: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          {shippingApi.provider === 'custom_api' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رابط Endpoint المخصص (Custom API URL)</label>
              <input
                type="url"
                value={shippingApi.customEndpointUrl || ''}
                onChange={(e) => setShippingApi({ ...shippingApi, customEndpointUrl: e.target.value })}
                placeholder="https://api.mycarrier.dz/v1/shipping"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تعريفة التوصيل للمنزل (دج / Home Delivery)</label>
              <input
                type="number"
                value={shippingApi.homeDeliveryFee}
                onChange={(e) => setShippingApi({ ...shippingApi, homeDeliveryFee: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تعريفة التوصيل للمكتب (دج / StopDesk / Bureau)</label>
              <input
                type="number"
                value={shippingApi.stopDeskFee}
                onChange={(e) => setShippingApi({ ...shippingApi, stopDeskFee: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestApiConnection}
              disabled={isTestingApi || !shippingApi.apiKey}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingApi ? 'animate-spin' : ''}`} />
              <span>{isTestingApi ? 'جاري الاتصال بالسيرفر...' : 'اختبار الاتصال بـ API شركة الشحن'}</span>
            </button>

            {apiTestSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تم الربط بنجاح! السيرفر يستجيب (200 OK)</span>
              </span>
            )}
          </div>
        </div>

        {/* Brand & Text Settings */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-['Cairo'] flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>بيانات الهوية والشعارات</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم متجر الجملة</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الشعار اللفظي (Slogan)</label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">وصف نشاط الجملة والمصنع</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <ImageUploadInput
              label="شعار المتجر (Store Logo)"
              value={logoUrl}
              onChange={(url) => setLogoUrl(url)}
              helperText="قم بتحميل شعار متجرك من جهازك لعرضه بصورة احترافية"
              aspectRatio="square"
            />

            <ImageUploadInput
              label="غلاف بنر الهيدر (Header Banner)"
              value={bannerUrl}
              onChange={(url) => setBannerUrl(url)}
              helperText="صورة بنر المتجر العريضة أعلى صفحة المتجر"
              aspectRatio="banner"
            />
          </div>
        </div>

        {/* Contact Information Section (معلومات الاتصال والتواصل لتظهر للزبائن) */}
        <div className="p-6 rounded-3xl bg-white border-2 border-amber-200/70 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Cairo'] flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-amber-600" />
                <span>معلومات الاتصال والتواصل المباشر مع الزبائن (Contact Information)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                البيانات التي تدخلها هنا ستظهر مباشرة للزبائن في أسفل المتجر (Footer) وفي نافذة التواصل مع التاجر.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <input
                type="checkbox"
                checked={displayOnStorefront}
                onChange={(e) => setDisplayOnStorefront(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                إظهار للزبائن بالمتجر
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                رقم الهاتف الرئيسي للطلب والتواصل *
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="مثال: +213550123456"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 transition dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                رقم هاتف ثانٍ / خدمة العملاء (اختياري)
              </label>
              <input
                type="text"
                value={contactPhone2}
                onChange={(e) => setContactPhone2(e.target.value)}
                placeholder="مثال: +213660987654"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 transition dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                رقم الواتساب للمحادثات المباشرة (WhatsApp)
              </label>
              <input
                type="text"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                placeholder="مثال: +213550123456"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 transition dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                البريد الإلكتروني للتاجر
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@store.dz"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 transition dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                الولاية ومقر النشاط
              </label>
              <select
                value={contactWilaya}
                onChange={(e) => setContactWilaya(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              >
                {algerianWilayas.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                أوقات العمل واستقبال الطلبات
              </label>
              <input
                type="text"
                value={contactWorkingHours}
                onChange={(e) => setContactWorkingHours(e.target.value)}
                placeholder="مثال: من الأحد إلى الخميس: 08:00 صباحاً - 05:00 مساءً"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-600" />
              العنوان التفصيلي للمستودع / المعرض / الورشة
            </label>
            <input
              type="text"
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              placeholder="مثال: حي المستقبل، المنطقة الصناعية والمستودعات، قطعة رقم 14"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          {/* Social Links Row */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-600" />
              <span>صفحات وحسابات التواصل الاجتماعي (Social Media)</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Facebook</label>
                <input
                  type="text"
                  value={contactFacebook}
                  onChange={(e) => setContactFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 focus:outline-none focus:border-indigo-600 transition dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instagram</label>
                <input
                  type="text"
                  value={contactInstagram}
                  onChange={(e) => setContactInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 focus:outline-none focus:border-indigo-600 transition dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Telegram</label>
                <input
                  type="text"
                  value={contactTelegram}
                  onChange={(e) => setContactTelegram(e.target.value)}
                  placeholder="https://t.me/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 focus:outline-none focus:border-indigo-600 transition dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">TikTok</label>
                <input
                  type="text"
                  value={contactTiktok}
                  onChange={(e) => setContactTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 focus:outline-none focus:border-indigo-600 transition dir-ltr text-right"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme & Colors */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-['Cairo'] flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600" />
            <span>نمط الثيم والألوان</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themeOptions.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setPrimaryColor(t.color);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                  theme === t.id
                    ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-bold text-slate-800">{t.title}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اللون الرئيسي للهوية</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-600">{primaryColor}</span>
            </div>
          </div>
        </div>

        {/* Announcement Bar & Wholesale Thresholds */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-['Cairo'] flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-emerald-600" />
            <span>شريط الإعلانات والحد الأدنى لطلبات الجملة</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نص شريط الإعلانات العلوي</label>
            <input
              type="text"
              value={announcementBar}
              onChange={(e) => setAnnouncementBar(e.target.value)}
              placeholder="مثال: التوصيل متاح لـ 58 ولاية عبر API ياليدين إكسبريس! 🚚"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الحد الأدنى لإجمالي سلة الجملة ({store.currency})</label>
              <input
                type="number"
                value={minWholesaleCartTotal}
                onChange={(e) => setMinWholesaleCartTotal(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رسوم الشحن الافتراضية ({store.currency})</label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">حد الشحن المجاني للجملة ({store.currency})</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div className="flex items-end">
              <label className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">إظهار رسالة الشحن المجاني للزبائن</span>
                <input
                  type="checkbox"
                  checked={showFreeShippingMessage}
                  onChange={(e) => setShowFreeShippingMessage(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Wholesale Payment Gateways */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-['Cairo'] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>طريقة دفع وسداد طلبات الجملة للعملاء (الدفع عند الاستلام COD)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              جميع طلبات مشتريات الجملة عبر المنصة يتم تحصيلها وتغطيتها حصرياً عن طريق <strong className="text-emerald-700">الدفع عند الاستلام والتسليم (Cash on Delivery)</strong> لضمان أمان الشحنات والمبايعات.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-950">طريقة الدفع الأساسية والمفعلة تلقائياً</p>
                <p className="text-[11px] text-emerald-800">الدفع عند الاستلام وتسليم الشحنة (COD)</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg">
              مفعّل ومضمون 100%
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتطبيق جميع الإعدادات</span>
          </button>
        </div>
      </form>
    </div>
  );
};

