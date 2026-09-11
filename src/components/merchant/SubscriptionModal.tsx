import React, { useState } from 'react';
import { Store } from '../../types';
import { saveStore } from '../../lib/storage';
import { 
  X, 
  Gift, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ShieldCheck,
  Send,
  Building
} from 'lucide-react';

interface SubscriptionModalProps {
  store: Store;
  onClose: () => void;
  onUpdateStore: (updatedStore: Store) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  store,
  onClose,
  onUpdateStore,
}) => {
  const [txId, setTxId] = useState('');
  const [notes, setNotes] = useState('');
  const [isCopiedRip, setIsCopiedRip] = useState(false);
  const [isCopiedCcp, setIsCopiedCcp] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const sub = store.subscription || {
    planName: 'خطة تجار الجملة - Youmi B2B Pro',
    trialDaysLeft: 30,
    trialStartDate: new Date().toISOString().split('T')[0],
    trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isTrialActive: true,
    status: 'active_trial' as const,
    monthlyFeeDzd: 3500,
    baridimobPaymentDetails: {
      ripNumber: '0079999900238129038201',
      ccpAccount: '002381290 مفتاح 88',
      accountHolder: 'مؤسسة منصة يومي للتجارة والحلول الرقمية (Youmi Market DZ)',
    },
  };

  const handleCopy = (text: string, type: 'rip' | 'ccp') => {
    navigator.clipboard.writeText(text);
    if (type === 'rip') {
      setIsCopiedRip(true);
      setTimeout(() => setIsCopiedRip(false), 2000);
    } else {
      setIsCopiedCcp(true);
      setTimeout(() => setIsCopiedCcp(false), 2000);
    }
  };

  const handleSubmitBaridiMob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId) return;

    const updatedStore: Store = {
      ...store,
      subscription: {
        ...sub,
        trialDaysLeft: Math.max(30, sub.trialDaysLeft + 30),
        status: 'subscribed',
        lastPaymentTxId: txId,
        lastPaymentDate: new Date().toLocaleDateString('ar-DZ'),
      },
    };

    saveStore(updatedStore);
    onUpdateStore(updatedStore);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl text-slate-800">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl mb-1">
            <Gift className="w-3.5 h-3.5 text-amber-600" />
            <span>فترة التجربة المجانية: 30 يوماً مجاناً ترحيباً بك</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <span>اشتراك المنصة وسداد بريدي موب (BaridiMob)</span>
          </h2>
          <p className="text-xs text-slate-500">
            تتمتع بـ 30 يوماً تجربة مجانية كاملة. يمكنك تجديد اشتراكك شهرياً بقيمة 3,500 دج عن طريق بريدي موب.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-950 font-['Cairo']">تم تأكيد سداد الاشتراك بنجاح!</h3>
              <p className="text-xs text-emerald-800 mt-1">
                رقم عملية بريدي موب المسجلة: <span className="font-mono font-bold">{txId}</span>
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                تم تمديد اشتراك متجرك بـ 30 يوماً إضافية بنجاح 🎉
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition"
            >
              إغلاق النافذة
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Trial Status Card */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  30
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-950">الفترة المجانية المفعلة حالياً</p>
                  <p className="text-[11px] text-indigo-700">متبقي {sub.trialDaysLeft} يوماً مجاناً (حتى {sub.trialEndDate})</p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>30 يوماً مجاناً</span>
              </span>
            </div>

            {/* Platform Official BaridiMob Details Box */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-900 font-bold flex items-center justify-center text-xs">
                    BM
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-['Cairo']">بيانات حساب بريدي موب (BaridiMob RIP)</h3>
                    <p className="text-[10px] text-slate-400">منصة يومي لتجارة الجملة بالجزائر</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                  {sub.monthlyFeeDzd.toLocaleString()} دج / شهرياً
                </span>
              </div>

              {/* RIP Number */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400">رقم الـ RIP لتطبيق بريدي موب:</p>
                <div className="flex items-center justify-between bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-700 font-mono text-xs text-amber-300 dir-ltr">
                  <span>{sub.baridimobPaymentDetails.ripNumber}</span>
                  <button
                    onClick={() => handleCopy(sub.baridimobPaymentDetails.ripNumber, 'rip')}
                    className="p-1 text-slate-400 hover:text-white transition"
                    title="نسخ رقم الـ RIP"
                  >
                    {isCopiedRip ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CCP Account */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400">حساب البريد الجاري CCP:</p>
                <div className="flex items-center justify-between bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-700 font-mono text-xs text-slate-200 dir-ltr">
                  <span>{sub.baridimobPaymentDetails.ccpAccount}</span>
                  <button
                    onClick={() => handleCopy(sub.baridimobPaymentDetails.ccpAccount, 'ccp')}
                    className="p-1 text-slate-400 hover:text-white transition"
                    title="نسخ CCP"
                  >
                    {isCopiedCcp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>صاحب الحساب: {sub.baridimobPaymentDetails.accountHolder}</span>
              </div>
            </div>

            {/* Form to submit BaridiMob Transaction ID */}
            <form onSubmit={handleSubmitBaridiMob} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  رقم عملية التحويل في تطبيق بريدي موب (Transaction ID / Reference) *
                </label>
                <input
                  type="text"
                  required
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="مثال: 981023812039 أو BM-2026-9812"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات أو اسم المحول (اختياري)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اسم الحساب المحول منه ببريدي موب..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <button
                type="submit"
                disabled={!txId}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>إرسال وتأكيد سداد الاشتراك بـ بريدي موب (3,500 دج)</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
