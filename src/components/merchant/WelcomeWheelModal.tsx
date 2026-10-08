import React, { useEffect, useRef, useState } from 'react';
import { Gift, Sparkles, X, PartyPopper, LoaderCircle } from 'lucide-react';
import { Store } from '../../types';
import { api } from '../../lib/api';

const PRIZES = [15, 20, 25, 30, 10] as const;
const SEGMENT_COLORS = ['#4f46e5', '#0f766e', '#d97706', '#be185d', '#2563eb'];

interface WelcomeWheelModalProps {
  store: Store;
  onClose: () => void;
  onStoreUpdated: (store: Store) => void;
}

export const WelcomeWheelModal: React.FC<WelcomeWheelModalProps> = ({
  store,
  onClose,
  onStoreUpdated,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeDays, setPrizeDays] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [animationDone, setAnimationDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleSpin = async () => {
    if (isSpinning || prizeDays !== null) return;
    setError('');
    setIsSpinning(true);

    const result = await api.spinTrialWheel();
    if (!result.ok || !result.data?.store || !Number.isFinite(Number(result.data?.prizeDays))) {
      setError(result.error || result.data?.message || 'تعذر تدوير العجلة الآن. حاول مرة أخرى.');
      setIsSpinning(false);
      return;
    }

    const days = Number(result.data.prizeDays);
    const index = PRIZES.indexOf(days as (typeof PRIZES)[number]);
    if (index < 0) {
      setError('وصلتنا نتيجة غير معروفة. يرجى التواصل مع الدعم.');
      setIsSpinning(false);
      return;
    }

    setPrizeDays(days);
    onStoreUpdated(result.data.store as Store);

    const segmentCenter = index * 72 + 36;
    setRotation(360 * 6 + (360 - segmentCenter));

    timerRef.current = setTimeout(() => {
      setAnimationDone(true);
      setIsSpinning(false);
    }, 5200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-5" dir="rtl">
      <div className="relative w-full max-w-xl max-h-[95vh] overflow-y-auto rounded-3xl border border-white/20 bg-white p-5 sm:p-8 text-center shadow-2xl">
        {prizeDays === null && (
          <button
            type="button"
            onClick={onClose}
            disabled={isSpinning}
            aria-label="إغلاق وإكمال لاحقًا"
            className="absolute left-3 top-3 rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          {prizeDays === null ? <Gift className="h-7 w-7" /> : <PartyPopper className="h-7 w-7" />}
        </div>

        <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
          {prizeDays === null ? '🎡 عجلة الحظ من YOUmi' : '🎉 مبروك! ربحت هدية من YOUmi'}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">
          {prizeDays === null
            ? `أهلاً ${store.merchantName || store.name}! أدر العجلة واربح أيامًا إضافية مجانية لمتجرك. لديك محاولة واحدة فقط.`
            : animationDone
              ? 'تمت إضافة الأيام المجانية إلى تاريخ انتهاء تجربة متجرك.'
              : 'العجلة تتوقف على جائزتك...'}
        </p>

        <div className="relative mx-auto my-6 h-[270px] w-[270px] max-w-full sm:h-[320px] sm:w-[320px]">
          <div className="absolute -top-1 left-1/2 z-20 -translate-x-1/2">
            <div className="h-0 w-0 border-l-[13px] border-r-[13px] border-t-[30px] border-l-transparent border-r-transparent border-t-slate-900 drop-shadow-md" />
          </div>
          <div
            className="absolute inset-1 overflow-hidden rounded-full border-[8px] border-slate-900 shadow-xl"
            style={{
              background: `conic-gradient(${SEGMENT_COLORS[0]} 0deg 72deg, ${SEGMENT_COLORS[1]} 72deg 144deg, ${SEGMENT_COLORS[2]} 144deg 216deg, ${SEGMENT_COLORS[3]} 216deg 288deg, ${SEGMENT_COLORS[4]} 288deg 360deg)`,
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 5s cubic-bezier(0.12, 0.75, 0.12, 1)',
            }}
          >
            {PRIZES.map((days, index) => {
              const angle = index * 72 + 36;
              return (
                <div
                  key={days}
                  className="absolute left-1/2 top-1/2 w-24 -translate-x-1/2 -translate-y-1/2 text-center font-black text-white drop-shadow-md"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-86px) rotate(-${angle}deg)`,
                  }}
                >
                  <span className="text-xl sm:text-2xl">{days}</span>
                  <span className="block text-[10px] sm:text-xs">يوم إضافي</span>
                </div>
              );
            })}
          </div>
          <div className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-amber-300 shadow-lg">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        {prizeDays !== null && animationDone ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5">
              <div className="text-sm font-bold text-emerald-800">جائزتك</div>
              <div className="mt-1 text-4xl font-black text-emerald-700">{prizeDays} يومًا إضافيًا 🎁</div>
              <p className="mt-2 text-xs leading-6 text-emerald-800">تم حفظ الجائزة في حسابك ولا يمكن تدوير العجلة مرة أخرى.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700"
            >
              الانتقال إلى لوحة تحكم المتجر
            </button>
          </div>
        ) : prizeDays !== null ? (
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-700">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            جارٍ تحديد جائزتك...
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 text-base font-black text-white shadow-lg transition hover:from-amber-600 hover:to-orange-600 disabled:cursor-wait disabled:opacity-70"
            >
              {isSpinning ? 'جارٍ تجهيز العجلة...' : 'أدر العجلة الآن'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSpinning}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40"
            >
              سأديرها لاحقًا
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
