import React, { useEffect, useState } from 'react';
import { Store } from '../../types';
import { api } from '../../lib/api';
import { Film, Upload, Trash2, RefreshCw, Video } from 'lucide-react';

type MerchantReel = { id: string; caption: string; tags?: string; videoUrl: string; likesCount: number; createdAt?: string; productId?: string | null };
export const MerchantReelsTab: React.FC<{ store: Store }> = ({ store }) => {
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [productId, setProductId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [reels, setReels] = useState<MerchantReel[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const refresh = async () => { setLoading(true); const result = await api.reelsMine(store.id); if (result.ok) setReels((result.data?.reels || []) as MerchantReel[]); else setMessage(result.error || 'تعذر تحميل فيديوهاتك.'); setLoading(false); };
  useEffect(() => { void refresh(); }, [store.id]);
  const publish = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage('');
    if (!file) { setMessage('اختر فيديو قبل النشر.'); return; }
    if (!file.type.startsWith('video/')) { setMessage('الملف المختار ليس فيديو.'); return; }
    if (file.size > 35 * 1024 * 1024) { setMessage('حجم الفيديو الأقصى 35 ميغابايت.'); return; }
    setBusy(true);
    const result = await api.reelsUpload({ storeId: store.id, productId, caption, tags, file });
    if (result.ok) { setCaption(''); setTags(''); setProductId(''); setFile(null); const input = document.getElementById('youmi-reel-file') as HTMLInputElement | null; if (input) input.value = ''; setMessage('تم نشر الفيديو. أصبح متاحاً لجميع مستخدمي YOUmi.'); await refresh(); }
    else setMessage(result.error || 'تعذر نشر الفيديو.');
    setBusy(false);
  };
  const remove = async (reel: MerchantReel) => { if (!window.confirm('هل تريد حذف هذا الفيديو نهائياً؟')) return; const result = await api.reelsDelete(reel.id); if (result.ok) { setReels(old => old.filter(item => item.id !== reel.id)); setMessage('تم حذف الفيديو.'); } else setMessage(result.error || 'تعذر حذف الفيديو.'); };
  return <div className="space-y-6" dir="rtl">
    <div className="rounded-3xl border border-fuchsia-100 bg-gradient-to-br from-[#251431] via-[#3D1C50] to-[#6C287D] p-6 text-white shadow-lg"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-[#251531]"><Film className="h-6 w-6"/></span><div><h2 className="text-xl font-black">YOUmi Reels</h2><p className="mt-1 text-sm text-white/70">عرّف العملاء بمنتجاتك عبر فيديوهات قصيرة.</p></div></div><p className="mt-4 text-xs leading-6 text-white/70">الفيديو المنشور يُحفظ على خادم المنصة ويظهر في قسم Reels لجميع المستخدمين. الصيغ المدعومة MP4 وWebM وMOV، والحد الأقصى 35 ميغابايت.</p></div>
    <form onSubmit={publish} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-slate-900">نشر فيديو جديد</h3>
      <label className="block text-sm font-bold text-slate-700">ملف الفيديو *<input id="youmi-reel-file" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm file:ml-3 file:rounded-lg file:border-0 file:bg-fuchsia-50 file:px-3 file:py-2 file:font-bold file:text-fuchsia-800" required/></label>
      <label className="block text-sm font-bold text-slate-700">ربط بمنتج (اختياري)<select value={productId} onChange={e => setProductId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"><option value="">فيديو عام للمتجر</option>{store.products.map(product => <option key={product.id} value={product.id}>{product.title}</option>)}</select></label>
      <label className="block text-sm font-bold text-slate-700">وصف الفيديو<textarea value={caption} onChange={e => setCaption(e.target.value)} maxLength={500} rows={3} placeholder="اكتب وصف المنتج أو العرض..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-fuchsia-400"/></label>
      <label className="block text-sm font-bold text-slate-700">الوسوم<input value={tags} onChange={e => setTags(e.target.value)} maxLength={1000} placeholder="#أبواب #جملة #مورد" className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-fuchsia-400"/></label>
      {file && <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><Video className="h-4 w-4 text-fuchsia-700"/><span className="truncate">{file.name}</span><span className="mr-auto shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span></div>}
      {message && <p role="status" className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-700 px-4 py-3 font-black text-white transition hover:bg-fuchsia-800 disabled:cursor-wait disabled:opacity-60">{busy ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}{busy ? 'جارٍ رفع الفيديو...' : 'نشر الفيديو على YOUmi Reels'}</button>
    </form>
    <section className="rounded-3xl border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-black text-slate-900">فيديوهاتي ({reels.length})</h3><button onClick={() => void refresh()} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/> تحديث</button></div>
      {loading ? <p className="py-8 text-center text-sm text-slate-500">جارٍ التحميل...</p> : reels.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">لم تنشر فيديوهات بعد.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{reels.map(reel => <article key={reel.id} className="overflow-hidden rounded-2xl border border-slate-200"><video src={reel.videoUrl.startsWith('http') ? reel.videoUrl : `${window.location.origin}${reel.videoUrl.startsWith('/') ? '' : '/'}${reel.videoUrl}`} controls playsInline preload="metadata" className="h-48 w-full bg-black object-contain"/><div className="space-y-2 p-3"><p className="line-clamp-2 text-sm font-bold text-slate-800">{reel.caption || 'فيديو بدون وصف'}</p><div className="flex items-center justify-between text-xs text-slate-500"><span>♥ {reel.likesCount || 0}</span><button onClick={() => void remove(reel)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/> حذف</button></div></div></article>)}</div>}
    </section>
  </div>;
};
