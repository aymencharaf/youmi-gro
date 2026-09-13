import React, { useState, useEffect } from 'react';
import { Store } from '../types';
import { YoumiLogo } from './YoumiLogo';
import { createNewStore, createStoreOnApi, loadMyStoresFromApi } from '../lib/storage';
import { B2BMember } from './MemberAuthModal';
import { BUSINESS_CATEGORIES } from '../data/algeriaData';
import { 
  Store as StoreIcon, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Palette, 
  User, 
  Mail, 
  Phone, 
  Check,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';

interface CreateStoreWizardProps {
  onBackToHome?: () => void;
  onCancel?: () => void;
  onStoreCreated?: (store: Store) => void;
  currentMember?: B2BMember | null;
}

export const CreateStoreWizard: React.FC<CreateStoreWizardProps> = ({
  onBackToHome = () => {},
  onCancel,
  onStoreCreated = (_store: Store) => {},
  currentMember = null,
}) => {
  const handleBack = () => {
    if (onCancel) onCancel();
    else onBackToHome();
  };
  const [step, setStep] = useState<number>(1);
  const [existingStore, setExistingStore] = useState<Store | null>(null);
  const [isCheckingStore, setIsCheckingStore] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<string>(BUSINESS_CATEGORIES[0]);
  const [merchantName, setMerchantName] = useState(currentMember?.name || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(currentMember?.phone || '');
  const [slogan, setSlogan] = useState('');
  const [theme, setTheme] = useState<Store['theme']>('modern');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentMember) {
      if (currentMember.name && !merchantName) setMerchantName(currentMember.name);
      if (currentMember.phone && !phone) setPhone(currentMember.phone);
    }
  }, [currentMember]);

  useEffect(() => {
    let cancelled = false;
    async function checkExisting() {
      if (currentMember?.role === 'merchant') {
        try {
          const myStores = await loadMyStoresFromApi();
          if (!cancelled && myStores && myStores.length > 0) {
            setExistingStore(myStores[0]);
          }
        } catch (e) {
          console.warn('تعذر التحقق من متاجر البائع:', e);
        }
      }
      if (!cancelled) setIsCheckingStore(false);
    }
    checkExisting();
    return () => { cancelled = true; };
  }, [currentMember]);

  const categories = BUSINESS_CATEGORIES;

  const themeOptions: { id: Store['theme']; title: string; desc: string; color: string }[] = [
    { id: 'modern', title: 'عصري وحديث (Youmi Modern)', desc: 'تصميم شبكي انسيابي يلائم المتاجر والمنتجات المبتكرة', color: '#4F46E5' },
    { id: 'luxury', title: 'فاخر ومناسبات (Luxury)', desc: 'ألوان دافئة تناسب العود والعطور والمنتجات الفاخرة', color: '#7C2D12' },
    { id: 'minimal', title: 'بسيط وهادئ (Minimal)', desc: 'تركيز كامل على صوَر المنتجات والهوية دون تشتيت', color: '#0F172A' },
    { id: 'vibrant', title: 'حيوي وجذاب (Vibrant)', desc: 'ألوان ساطعة للتقنية والأجهزة والساعات الذكية', color: '#2563EB' },
  ];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === val.toLowerCase().replace(/\s+/g, '-')) {
      const generatedSlug = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug || `store-${Math.floor(Math.random() * 8999 + 1000)}`);
    }
  };

  const generateAiSlogan = async () => {
    if (!name) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'slogan',
          prompt: `اقترح شعاراً تسويقياً موجزاً وجذاباً باللغة العربية لمتجر إلكتروني باسم "${name}" في مجال "${category}".`,
        }),
      });
      const data = await res.json();
      if (data.result) {
        const cleanSlogan = data.result.split('\n')[0].replace(/^[0-9.-/*\s]+/, '').trim();
        setSlogan(cleanSlogan);
      }
    } catch (err) {
      console.error(err);
      setSlogan('متجرك الفاخر لتجربة تسوق استثنائية وبأعلى جودة');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleFinishWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (existingStore) {
      setError('لديك متجر بالفعل. يُسمح بإنشاء متجر واحد فقط لكل حساب بائع.');
      return;
    }
    if (!name || !merchantName || !email) return;
    if (!currentMember || currentMember.role !== 'merchant') { setError('يجب تسجيل الدخول بحساب بائع قبل إنشاء متجر.'); return; }
    setIsSaving(true);
    try {
      const newStore = createNewStore({
        name, slug: slug || `store-${Date.now()}`, category, merchantName, email,
        phone: phone || '+213550000000', slogan: slogan || `متجرك المفضل لمنتجات ${category}`, theme, primaryColor,
      });
      newStore.merchantUserId = currentMember.id;
      const saved = await createStoreOnApi(newStore);
      onStoreCreated(saved);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر إنشاء المتجر على الخادم.'); }
    finally { setIsSaving(false); }
  };

  if (existingStore) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] text-slate-800 flex flex-col dir-rtl items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full text-center shadow-xl space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-amber-200">
            <StoreIcon className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 font-['Cairo']">لديك متجر بالفعل 🏪</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              وفقاً لنظام منصة Youmi، يُسمح بمتجر واحد فقط لكل حساب بائع لتركيز إدارة منتجاتك وطلباتك بفعالية أعلى.
            </p>
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 font-semibold text-right space-y-1">
              <div>متجرك المسجل: <span className="font-bold text-slate-900">{existingStore.name}</span></div>
              <div className="text-[11px] text-slate-500 dir-ltr text-right">slug: {existingStore.slug}</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onStoreCreated(existingStore)}
              className="flex-1 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>الانتقال إلى لوحة تحكم متجرك</span>
            </button>
            <button
              onClick={handleBack}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              العودة للمنصة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800 flex flex-col dir-rtl">
      {/* Wizard Top Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمنصة الرئيسية</span>
          </button>

          <div className="flex items-center gap-2">
            <YoumiLogo variant="header" size="sm" />
          </div>
        </div>
      </header>

      {/* Wizard Progress Steps */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between text-xs">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
              1
            </div>
            <span>بيانات المتجر والتاجر</span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
              2
            </div>
            <span>الهوية والثيم والتصميم</span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
              3
            </div>
            <span>المراجعة والإطلاق</span>
          </div>
        </div>
      </div>

      {/* Main Wizard Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 md:p-8">
        <form onSubmit={handleFinishWizard} className="space-y-6">
          {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm font-bold">{error}</div>}
          {/* STEP 1 */}
          {step === 1 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
                  <StoreIcon className="w-6 h-6 text-indigo-600" />
                  <span>الخطوة الأولى: معلومات المتجر</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">أدخل الاسم والنشاط لتجهيز متجرك المستقل.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">اسم المتجر الإلكتروني *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={handleNameChange}
                    placeholder="مثال: متجر العود الملكي، أزياء النخبة..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">نوع النشاط والتصنيف *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-600 transition"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">اسم التاجر / مالك المتجر *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        placeholder="اسمك الكريم"
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">البريد الإلكتروني للتاجر *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="merchant@example.com"
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">رقم التواصل / الواتساب</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966500000000"
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  disabled={!name || !merchantName || !email}
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  <span>التالي: اختيار الهوية والرابط</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
                  <Palette className="w-6 h-6 text-purple-600" />
                  <span>الخطوة الثانية: الرابط المخصص والتصميم</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">خصص الرابط، الشعار والتصميم الظاهري لمتجرك.</p>
              </div>

              <div className="space-y-5">
                {/* Store Domain Slug */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">رابط المتجر الإلكتروني (Slug / URL)</label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden text-sm dir-ltr">
                    <span className="px-3 text-slate-500 border-r border-slate-200 text-xs font-mono">youmi.sa/m/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="my-store-slug"
                      className="w-full px-3 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none font-mono text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">سيكون هذا رابط متجرك المستقل الذي تشاركه مع عملائك.</p>
                </div>

                {/* Slogan with AI Generator Button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">الشعار التسويقي (Slogan)</label>
                    <button
                      type="button"
                      onClick={generateAiSlogan}
                      disabled={isGeneratingAi}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGeneratingAi ? 'جاري التوليد...' : 'اقترح لي بالذكاء الاصطناعي'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="مثال: عبق الأصالة وخيرة المنتجات العصرية..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                {/* Themes Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">اختر الثيم المفضل للمتجر</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {themeOptions.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setPrimaryColor(t.color);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                          theme === t.id
                            ? 'bg-indigo-50/60 border-indigo-500 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shrink-0 mt-1"
                          style={{ backgroundColor: t.color }}
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Color Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">اللون الرئيسي للهوية</label>
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

              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  السابق
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  <span>التالي: المراجعة والإطلاق</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                  <span>الخطوة الثالثة: مراجعة متجرك وإطلاقه</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">تأكد من البيانات واضغط على إطلاق المتجر لنجهز لك لوحة التحكم فوراً.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs text-slate-500">اسم المتجر:</span>
                  <strong className="text-sm font-bold text-slate-900 font-['Cairo']">{name}</strong>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs text-slate-500">رابط المتجر المستقل:</span>
                  <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    youmi.dz/m/{slug}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs text-slate-500">فترة التجربة المجانية:</span>
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                    🎁 30 يوماً مجاناً متوفرة فوراً
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs text-slate-500">التاجر المسجل:</span>
                  <span className="text-xs text-slate-800">{merchantName} ({email})</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">طريقة سداد الزبائن:</span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>الدفع عند الاستلام والتسليم (COD)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  السابق
                </button>

                <button
                  type="submit"
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-600/20 transition transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>إطلاق المتجر الإلكتروني الآن 🚀</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
