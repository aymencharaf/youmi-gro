import React, { useState } from 'react';
import { Store, Coupon } from '../../types';
import { saveCouponToStore, deleteCouponFromStore } from '../../lib/storage';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Share2
} from 'lucide-react';

interface CouponsTabProps {
  store: Store;
  onUpdateStore: (updatedStore: Store) => void;
}

export const CouponsTab: React.FC<CouponsTabProps> = ({ store, onUpdateStore }) => {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(100);

  const [aiPostText, setAiPostText] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    const newCoupon: Coupon = {
      id: `c-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      usageCount: 0,
      isActive: true,
    };

    const updated = saveCouponToStore(store.slug, newCoupon);
    if (updated) {
      onUpdateStore(updated);
      setCode('');
    }
  };

  const handleDeleteCoupon = (couponId: string) => {
    const updated = deleteCouponFromStore(store.slug, couponId);
    if (updated) {
      onUpdateStore(updated);
    }
  };

  const handleGenerateAiPost = async () => {
    setIsGeneratingAi(true);
    try {
      const activeCoupon = store.coupons[0]?.code || 'WELCOME10';
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'marketing_post',
          prompt: `اكتب منشوراً تسويقياً مشوقاً وجذاباً لمنصات التواصل الاجتماعي (إنستغرام وسناب شات) لمتجر "${store.name}" بمناسبة إطلاق الخصومات باستخدام كود الخصم "${activeCoupon}". النشاط: ${store.category}.`,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setAiPostText(data.result);
      }
    } catch (err) {
      console.error(err);
      setAiPostText(`🎉 عروض حصرية من متجر ${store.name}! استمتع بأفضل منتجات ${store.category} بخصم خاص عند استخدام الكود الحصري. تسوق الآن عبر رابط المتجر!`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const copyPostToClipboard = () => {
    if (!aiPostText) return;
    navigator.clipboard.writeText(aiPostText);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2500);
  };

  return (
    <div className="space-y-8 dir-rtl max-w-4xl text-slate-800">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
          <Tag className="w-6 h-6 text-amber-600" />
          <span>إدارة أكواد الخصم والحملات التسويقية</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          أنشئ الكوبونات الترويجية لزيادة مبيعات متجرك واستخدم الذكاء الاصطناعي لكتابة منشورات الحملة الإعلانية.
        </p>
      </div>

      {/* Add Coupon Form & Current Coupons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-['Cairo'] flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>إنشاء كود خصم جديد</span>
          </h3>

          <form onSubmit={handleAddCoupon} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود الخصم (Coupon Code)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثال: SALE20، GUEST10"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الخصم</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت ({store.currency})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">قيمة الخصم</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الحد الأدنى للطلب ({store.currency})</label>
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>حفظ وتفعيل كود الخصم</span>
            </button>
          </form>
        </div>

        {/* Existing Coupons List */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-['Cairo'] flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-600" />
            <span>الأكواد الفعالة في المتجر ({store.coupons.length})</span>
          </h3>

          {store.coupons.length > 0 ? (
            <div className="space-y-3">
              {store.coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded text-xs">
                        {c.code}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold">
                        {c.discountType === 'percentage' ? `${c.discountValue}% خصم` : `${c.discountValue} ${store.currency}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      للطلبات فوق {c.minOrderAmount} {store.currency} • تم الاستخدام: {c.usageCount} مرات
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                    title="حذف الكود"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              لا يوجد أي كود خصم مضاف حالياً.
            </div>
          )}
        </div>
      </div>

      {/* AI Marketing Copywriter Section */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Cairo']">صانع المحتوى التسويقي للحملة</h3>
              <p className="text-xs text-slate-500">ولّد نصاً إعلانياً جاهزاً للنسخ والنشر في إنستغرام وسناب شات.</p>
            </div>
          </div>

          <button
            onClick={handleGenerateAiPost}
            disabled={isGeneratingAi}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingAi ? 'جاري التوليد...' : 'توليد منشور بالذكاء الاصطناعي'}</span>
          </button>
        </div>

        {aiPostText && (
          <div className="p-4 rounded-2xl bg-white border border-purple-200 text-slate-800 text-xs space-y-3">
            <p className="whitespace-pre-line leading-relaxed font-['Cairo']">{aiPostText}</p>
            <div className="flex justify-end pt-2 border-t border-purple-100">
              <button
                onClick={copyPostToClipboard}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition flex items-center gap-1.5 text-xs"
              >
                {copiedPost ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPost ? 'تم النسخ للحافظة!' : 'نسخ النص المنشور'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
