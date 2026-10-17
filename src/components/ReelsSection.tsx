import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Volume2, VolumeX, X, Play, Store as StoreIcon } from 'lucide-react';
import { Product, Store, StoreReel } from '../types';

export interface ReelFeedItem {
  reel: StoreReel;
  store: Store;
}

interface ReelsSectionProps {
  items: ReelFeedItem[];
  id?: string;
  title?: string;
  onSelectStore?: (store: Store) => void;
  onSelectProduct: (product: Product, store: Store) => void;
}

export const ReelsSection: React.FC<ReelsSectionProps> = ({
  items,
  id,
  title = 'ريلز الموردين',
  onSelectStore,
  onSelectProduct,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    if (!isOpen) return;

    const feed = feedRef.current;
    if (!feed) return;

    feed.scrollTo({ top: activeIndex * feed.clientHeight });
  }, [isOpen]);

  useEffect(() => {
    const handleBack = (event: Event) => {
      if (!isOpen) return;
      event.preventDefault();
      setIsOpen(false);
    };

    window.addEventListener('youmi:android-back', handleBack);
    return () => window.removeEventListener('youmi:android-back', handleBack);
  }, [isOpen]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      video.muted = muted;
      if (!isOpen || index !== activeIndex) {
        video.pause();
      } else {
        void video.play().catch(() => {
          // Playback may require a user gesture in some browsers.
        });
      }
    });
  }, [activeIndex, isOpen, muted]);

  if (items.length === 0) return null;

  const openReel = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const handleFeedScroll = () => {
    const feed = feedRef.current;
    if (!feed || feed.clientHeight === 0) return;
    setActiveIndex(Math.max(0, Math.min(
      items.length - 1,
      Math.round(feed.scrollTop / feed.clientHeight)
    )));
  };

  const openStore = (store: Store) => {
    setIsOpen(false);
    onSelectStore?.(store);
  };

  const openProduct = (product: Product, store: Store) => {
    setIsOpen(false);
    onSelectProduct(product, store);
  };

  return (
    <>
      <section id={id} className="mx-auto w-full max-w-[1500px] px-3 sm:px-4 lg:px-8 mt-4 sm:mt-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-3 sm:p-5">
            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900 sm:text-lg">
                <Play className="h-5 w-5 fill-rose-500 text-rose-500" />
                {title}
              </h2>
              <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                شاهد المنتجات وتجارب الموردين بفيديوهات قصيرة
              </p>
            </div>
            <button
              type="button"
              onClick={() => openReel(0)}
              className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-indigo-700 sm:px-4 sm:text-xs"
            >
              مشاهدة الكل ({items.length})
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto p-3 sm:p-4">
            {items.slice(0, 10).map(({ reel, store }, index) => (
              <button
                key={`${store.id}-${reel.id}`}
                type="button"
                onClick={() => openReel(index)}
                className="group relative h-44 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-900 text-right sm:h-56 sm:w-36"
                aria-label={`مشاهدة ريل ${store.name}`}
              >
                <video
                  src={reel.videoUrl}
                  poster={store.bannerUrl || store.logoUrl}
                  preload="metadata"
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/10" />
                <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <span className="absolute inset-x-2 bottom-2">
                  <span className="block truncate text-[10px] font-black text-white sm:text-xs">
                    {store.name}
                  </span>
                  <span className="mt-1 block line-clamp-2 text-[9px] leading-4 text-white/80 sm:text-[10px]">
                    {reel.caption}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
            aria-label="إغلاق الريلز"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setMuted((current) => !current)}
            className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
            aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <div
            ref={feedRef}
            onScroll={handleFeedScroll}
            className="h-[100dvh] w-full max-w-lg snap-y snap-mandatory overflow-y-auto overscroll-contain bg-black"
          >
            {items.map(({ reel, store }, index) => {
              const product = store.products?.find(
                (candidate) => candidate.id === reel.productId
              );

              return (
                <article
                  key={`${store.id}-${reel.id}`}
                  className="relative h-[100dvh] w-full snap-start overflow-hidden bg-slate-950"
                >
                  <video
                    ref={(element) => { videoRefs.current[index] = element; }}
                    src={reel.videoUrl}
                    poster={store.bannerUrl || store.logoUrl}
                    muted={muted}
                    playsInline
                    loop
                    controls
                    preload={index === activeIndex ? 'auto' : 'metadata'}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 to-transparent" />

                  <div className="absolute bottom-8 left-4 right-4 space-y-3 text-white">
                    <button
                      type="button"
                      onClick={() => openStore(store)}
                      className="flex items-center gap-2 text-sm font-black"
                    >
                      <img
                        src={store.logoUrl}
                        alt=""
                        className="h-9 w-9 rounded-full border border-white/70 object-cover"
                      />
                      <span>{store.name}</span>
                      <StoreIcon className="h-4 w-4" />
                    </button>
                    {reel.caption && (
                      <p className="max-w-sm text-sm leading-6">{reel.caption}</p>
                    )}
                    {product ? (
                      <button
                        type="button"
                        onClick={() => openProduct(product, store)}
                        className="w-full rounded-xl bg-white px-4 py-3 text-right text-xs font-black text-slate-900 shadow-lg"
                      >
                        عرض المنتج: {product.title}
                        <span className="mr-2 text-indigo-700">
                          {product.price.toLocaleString()} {store.currency}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openStore(store)}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-right text-xs font-black text-white shadow-lg"
                      >
                        زيارة المتجر
                      </button>
                    )}
                  </div>

                  {index < items.length - 1 && (
                    <button
                      type="button"
                      onClick={() => feedRef.current?.scrollTo({
                        top: (index + 1) * (feedRef.current?.clientHeight || 0),
                        behavior: 'smooth',
                      })}
                      className="absolute bottom-36 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
                      aria-label="الريل التالي"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
