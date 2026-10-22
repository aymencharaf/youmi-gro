import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Store as StoreIcon, Play, Send, X, LockKeyhole } from 'lucide-react';
import { api } from '../lib/api';
import { B2BMember } from './MemberAuthModal';

type Reel = {
  id: string; storeId: string; productId?: string | null; caption: string; tags?: string;
  videoUrl: string; likesCount: number; likedByMe?: boolean; createdAt?: string;
  store: { id: string; name: string; slug?: string; logoUrl?: string; category?: string };
  product?: { id: string; title: string; price?: number | null; image?: string | null } | null;
};
type Comment = { id: string; userName: string; text: string; createdAt?: string };

interface ReelsViewProps {
  currentMember: B2BMember | null;
  isLoggedIn?: boolean;
  onBack: () => void;
  onOpenLogin: () => void;
  onVisitStore: (storeId: string, productId?: string) => void;
}

const mediaUrl = (url: string) => /^(https?:|data:|blob:)/i.test(url) ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;

export const ReelsView: React.FC<ReelsViewProps> = ({ currentMember, isLoggedIn: loggedInProp = false, onBack, onOpenLogin, onVisitStore }) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentsFor, setCommentsFor] = useState<Reel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const hasFocusedSharedReel = useRef(false);
  const isLoggedIn = loggedInProp || !!currentMember?.isLoggedIn;

  const loadFeed = useCallback(async () => {
    setLoading(true); setError('');
    const result = await api.reelsFeed();
    if (result.ok) setReels((result.data?.reels || []) as Reel[]);
    else setError(result.error || 'تعذر تحميل الفيديوهات.');
    setLoading(false);
  }, []);
  useEffect(() => { void loadFeed(); }, [loadFeed]);

  useEffect(() => {
    const requestedId = new URLSearchParams(window.location.search).get('reel');
    if (!requestedId || loading || !reels.length || hasFocusedSharedReel.current) return;
    hasFocusedSharedReel.current = true;
    const timer = window.setTimeout(() => {
      document.getElementById(`youmi-reel-${requestedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [loading, reels]);

  const toggleLike = async (reel: Reel) => {
    if (!isLoggedIn) { onOpenLogin(); return; }
    const result = await api.reelsLike(reel.id);
    if (!result.ok) { setError(result.error || 'تعذر تسجيل الإعجاب.'); return; }
    setReels(old => old.map(item => item.id === reel.id ? { ...item, likedByMe: !!result.data?.liked, likesCount: Number(result.data?.likesCount ?? item.likesCount) } : item));
  };

  const openComments = async (reel: Reel) => {
    setCommentsFor(reel); setComments([]); setCommentText('');
    const result = await api.reelsComments(reel.id);
    if (result.ok) setComments((result.data?.comments || []) as Comment[]);
  };

  const sendComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentsFor || !commentText.trim()) return;
    if (!isLoggedIn) { onOpenLogin(); return; }
    setCommentLoading(true);
    const result = await api.reelsAddComment(commentsFor.id, commentText.trim());
    if (result.ok && result.data?.comment) {
      setComments(old => [...old, result.data.comment as Comment]); setCommentText('');
    } else setError(result.error || 'تعذر نشر التعليق.');
    setCommentLoading(false);
  };

  const shareReel = async (reel: Reel) => {
    const url = `${window.location.origin}/?reel=${encodeURIComponent(reel.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: 'YOUmi Reels', text: reel.caption || reel.store?.name || 'شاهد هذا الفيديو على YOUmi', url });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(url); alert('تم نسخ رابط الفيديو.'); }
      else window.prompt('انسخ رابط الفيديو:', url);
    } catch { /* User cancelled the native share sheet. */ }
  };

  return <div dir="rtl" className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 bg-gradient-to-b from-black/65 via-black/25 to-transparent px-3 pb-8 pt-[calc(env(safe-area-inset-top)+12px)] sm:px-5">
      <button onClick={onBack} className="pointer-events-auto flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-3 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition hover:bg-black/45"><ArrowLeft className="h-4 w-4"/> العودة إلى YOUmi</button>
      <div className="min-w-0 text-center drop-shadow-lg"><div className="text-base font-black tracking-wide sm:text-lg"><span className="text-amber-400">YOUmi</span> Reels</div><div className="text-[10px] text-white/80 sm:text-xs">فيديوهات قصيرة من الموردين</div></div>
      <button onClick={() => void loadFeed()} className="pointer-events-auto shrink-0 rounded-full border border-white/20 bg-black/25 px-3 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition hover:bg-black/45">تحديث</button>
    </header>
    {error && <div className="absolute left-3 right-3 top-24 z-40 mx-auto max-w-xl rounded-xl border border-rose-300/20 bg-rose-950/80 p-3 text-center text-sm text-rose-100 backdrop-blur">{error}</div>}
    {loading ? <div className="grid h-full place-items-center bg-[#110D17] pt-20 text-white/70">جارٍ تحميل الفيديوهات...</div> : reels.length === 0 ? <div className="grid h-full place-items-center bg-[#110D17] px-6 pt-20 text-center"><div><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-fuchsia-500/20"><Play className="h-8 w-8 text-fuchsia-300"/></div><h1 className="text-2xl font-black">أول فيديو يبدأ الحكاية!</h1><p className="mt-2 max-w-sm text-sm leading-7 text-white/65">لا توجد فيديوهات منشورة حالياً. يمكن للبائعين إضافة فيديوهات منتجاتهم من لوحة تحكم المتجر.</p><button onClick={onBack} className="mt-5 rounded-xl bg-amber-400 px-5 py-3 font-black text-[#251531]">استكشاف المتاجر</button></div></div> :
      <main className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {reels.map(reel => <article id={`youmi-reel-${reel.id}`} key={reel.id} className="relative mx-auto h-[100dvh] min-h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black sm:max-w-[520px] sm:border-x sm:border-white/10">
            <video src={mediaUrl(reel.videoUrl)} controls autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/15" />
            <div className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[10px] font-bold backdrop-blur">YOUmi · REELS</div>
            <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 left-[4.5rem] z-10 space-y-3">
              <button onClick={() => onVisitStore(reel.storeId)} className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-black/45 px-3 py-2 text-right backdrop-blur hover:bg-black/65">
                {reel.store?.logoUrl ? <img src={mediaUrl(reel.store.logoUrl)} className="h-8 w-8 rounded-full object-cover" alt=""/> : <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-[#251531]"><StoreIcon className="h-4 w-4"/></span>}
                <span className="min-w-0"><span className="block truncate text-sm font-black">{reel.store?.name || 'متجر YOUmi'}</span><span className="block text-[10px] text-white/65">{reel.store?.category || 'مورد على YOUmi'}</span></span>
                <span className="mr-1 shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-[10px] font-black text-[#251531]">زيارة المتجر</span>
              </button>
              {reel.caption && <p className="whitespace-pre-wrap text-sm font-semibold leading-6 drop-shadow">{reel.caption}</p>}
              {reel.tags && <p className="text-xs font-bold text-amber-300">{reel.tags.split(/[ ,،]+/).filter(Boolean).map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}</p>}
              {reel.product && <button onClick={() => onVisitStore(reel.storeId, reel.product?.id)} className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-2 text-right backdrop-blur hover:bg-white/15">
                {reel.product.image && <img src={mediaUrl(reel.product.image)} alt="" className="h-12 w-12 rounded-xl object-cover"/>}
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-black">{reel.product.title}</span>{isLoggedIn && reel.product.price != null ? <span className="mt-1 block text-xs font-black text-amber-300">سعر الجملة: {Number(reel.product.price).toLocaleString('fr-DZ')} دج</span> : <span className="mt-1 flex items-center gap-1 text-[10px] text-white/70"><LockKeyhole className="h-3 w-3"/> سجّل الدخول لعرض سعر الجملة</span>}</span>
                <span className="shrink-0 rounded-lg bg-white px-2 py-2 text-[10px] font-black text-[#251531]">عرض المنتج</span>
              </button>}
            </div>
            <div className="absolute bottom-[max(7rem,calc(env(safe-area-inset-bottom)+6rem))] left-3 z-10 flex flex-col items-center gap-5">
              <button onClick={() => void toggleLike(reel)} aria-label="إعجاب" className="flex flex-col items-center gap-1"><span className={`grid h-12 w-12 place-items-center rounded-full backdrop-blur ${reel.likedByMe ? 'bg-rose-500 text-white' : 'bg-black/45 text-white'}`}><Heart className={`h-6 w-6 ${reel.likedByMe ? 'fill-current' : ''}`}/></span><span className="text-xs font-black drop-shadow">{reel.likesCount || 0}</span></button>
              <button onClick={() => void openComments(reel)} className="flex flex-col items-center gap-1"><span className="grid h-12 w-12 place-items-center rounded-full bg-black/45 backdrop-blur"><MessageCircle className="h-6 w-6"/></span><span className="text-xs font-black">تعليق</span></button>
              <button onClick={() => void shareReel(reel)} className="flex flex-col items-center gap-1"><span className="grid h-12 w-12 place-items-center rounded-full bg-black/45 backdrop-blur"><Share2 className="h-6 w-6"/></span><span className="text-xs font-black">مشاركة</span></button>
            </div>
          </article>)}
      </main>}
    {commentsFor && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={() => setCommentsFor(null)}><section className="flex max-h-[82vh] w-full max-w-lg flex-col rounded-t-3xl border border-white/10 bg-[#21192A] sm:rounded-3xl" onClick={e => e.stopPropagation()}><header className="flex items-center justify-between border-b border-white/10 p-4"><div><h2 className="font-black">التعليقات</h2><p className="text-xs text-white/50">{comments.length} تعليق</p></div><button onClick={() => setCommentsFor(null)} className="rounded-full p-2 hover:bg-white/10"><X className="h-5 w-5"/></button></header><div className="flex-1 space-y-3 overflow-y-auto p-4">{comments.length === 0 ? <p className="py-8 text-center text-sm text-white/50">كن أول من يعلّق.</p> : comments.map(comment => <div key={comment.id} className="rounded-2xl bg-white/5 p-3"><div className="text-xs font-black text-amber-300">{comment.userName}</div><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{comment.text}</p></div>)}</div><form onSubmit={sendComment} className="flex gap-2 border-t border-white/10 p-3"><input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={isLoggedIn ? 'اكتب تعليقك...' : 'سجّل الدخول للتعليق'} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none focus:border-amber-400"/><button disabled={commentLoading || !commentText.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400 text-[#251531] disabled:opacity-50"><Send className="h-4 w-4"/></button></form></section></div>}
  </div>;
};
