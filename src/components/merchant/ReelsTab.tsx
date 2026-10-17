import React, { useState } from 'react';
import { Play, Plus, Trash2, Video } from 'lucide-react';
import { Store, StoreReel } from '../../types';
import { api } from '../../lib/api';

interface ReelsTabProps {
  store: Store;
  onUpdateStore: (store: Store) => void;
}

const MAX_REELS_PER_STORE = 20;

export const ReelsTab: React.FC<ReelsTabProps> = ({
  store,
  onUpdateStore,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [productId, setProductId] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reels = store.reels || [];

  const persistReels = async (nextReels: StoreReel[]) => {
    setIsSaving(true);
    setError('');

    try {
      const result = await api.saveStore({
        ...store,
        reels: nextReels,
      });

      if (!result.ok || !result.data?.store) {
        setError(result.error || 'تعذر حفظ الريلز. حاول مرة أخرى.');
        return false;
      }

      onUpdateStore(result.data.store as Store);
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'تعذر حفظ الريلز. تحقق من الاتصال وحاول مجدداً.'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUrl = videoUrl.trim();
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setError('أدخل رابط فيديو صحيحاً يبدأ بـ https:// أو http://.');
      return;
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setError('يجب أن يبدأ رابط الفيديو بـ https:// أو http://.');
      return;
    }
    if (reels.length >= MAX_REELS_PER_STORE) {
      setError(`يمكنك إضافة ${MAX_REELS_PER_STORE} ريل كحد أقصى للمتجر.`);
      return;
    }

    const reel: StoreReel = {
      id: `reel-${Date.now()}`,
      videoUrl: parsedUrl.toString(),
      caption: caption.trim(),
      productId: productId || undefined,
      createdAt: new Date().toISOString(),
    };

    if (await persistReels([reel, ...reels])) {
      setVideoUrl('');
      setCaption('');
      setProductId('');
    }
  };

  const handleDeleteReel = async (reelId: string) => {
    const nextReels = reels.filter((reel) => reel.id !== reelId);
    await persistReels(nextReels);
  };

  return (
    <div className="space-y-5 dir-rtl">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              ريلز المتجر ({reels.length}/{MAX_REELS_PER_STORE})
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              أضف فيديو عمودياً عبر رابط مباشر لملف الفيديو، وسيظهر في صفحة متجرك وخلاصة الريلز العامة.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddReel} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700">رابط الفيديو المباشر</span>
            <input
              type="url"
              required
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs text-slate-800 outline-none focus:border-indigo-500"
              dir="ltr"
            />
            <span className="block text-[10px] text-slate-400">
              استخدم رابطاً مباشراً لملف MP4 أو WebM؛ رابط صفحة TikTok أو Instagram لا يعمل كملف فيديو.
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700">الوصف</span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={180}
              rows={2}
              placeholder="اكتب وصفاً قصيراً للفيديو..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700">ربط بمنتج (اختياري)</span>
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
            >
              <option value="">بدون منتج مرتبط</option>
              {store.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving || reels.length >= MAX_REELS_PER_STORE}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {isSaving ? 'جارٍ الحفظ...' : 'إضافة الريل'}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {reels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-500">
            لم تضف أي ريل بعد. أضف أول فيديو ليظهر للعملاء.
          </div>
        ) : (
          reels.map((reel) => {
            const product = store.products.find((item) => item.id === reel.productId);
            return (
              <article
                key={reel.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <video
                  src={reel.videoUrl}
                  poster={store.bannerUrl || store.logoUrl}
                  preload="metadata"
                  muted
                  playsInline
                  className="h-20 w-14 shrink-0 rounded-xl bg-slate-900 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-bold text-slate-900">
                    {reel.caption || 'ريل بدون وصف'}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-slate-500" dir="ltr">
                    {reel.videoUrl}
                  </p>
                  {product && (
                    <p className="mt-1 text-[10px] font-semibold text-indigo-600">
                      المنتج: {product.title}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteReel(reel.id)}
                  disabled={isSaving}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                  aria-label="حذف الريل"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
