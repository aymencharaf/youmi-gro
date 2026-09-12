import React, { useEffect, useState } from 'react';
import { Advertisement, Store, Product, AdPlacement as PlacementType } from '../../types';
import {
  getActiveAdvertisements,
  recordAdImpression,
  recordAdClick,
  AD_LABELS,
} from '../../lib/adSystem';
import { Megaphone, ExternalLink, Star, Store as StoreIcon, ShieldCheck, Tag, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface AdPlacementProps {
  placement: PlacementType;
  category?: string;
  lang?: 'AR' | 'FR';
  canViewWholesalePrices?: boolean;
  onSelectProduct?: (product: Product, store: Store) => void;
  onSelectStore?: (store: Store, view: 'STORE_FRONT') => void;
  stores?: Store[];
  className?: string;
}

export const AdPlacement: React.FC<AdPlacementProps> = ({
  placement,
  category,
  lang = 'AR',
  canViewWholesalePrices = false,
  onSelectProduct,
  onSelectStore,
  stores = [],
  className = '',
}) => {
  const labels = AD_LABELS[lang] || AD_LABELS.AR;
  const isRtl = lang === 'AR';
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const fetchAds = () => {
    const active = getActiveAdvertisements(placement, category);
    setAds(active);
  };

  useEffect(() => {
    fetchAds();
    const handleUpdate = () => fetchAds();
    window.addEventListener('youmi_ads_updated', handleUpdate);
    return () => window.removeEventListener('youmi_ads_updated', handleUpdate);
  }, [placement, category]);

  // Record impression for visible active ads
  useEffect(() => {
    if (ads.length > 0) {
      ads.forEach((ad) => recordAdImpression(ad.id));
    }
  }, [ads]);

  if (ads.length === 0) return null;

  const handleAdClick = (ad: Advertisement) => {
    recordAdClick(ad.id);
    if (ad.productId && ad.storeId && stores.length > 0) {
      const matchedStore = stores.find((s) => s.id === ad.storeId || s.slug === ad.storeSlug);
      if (matchedStore) {
        const matchedProduct = matchedStore.products.find((p) => p.id === ad.productId);
        if (matchedProduct && onSelectProduct) {
          onSelectProduct(matchedProduct, matchedStore);
          return;
        }
      }
    }
    if (ad.storeId && stores.length > 0 && onSelectStore) {
      const matchedStore = stores.find((s) => s.id === ad.storeId || s.slug === ad.storeSlug);
      if (matchedStore) {
        onSelectStore(matchedStore, 'STORE_FRONT');
        return;
      }
    }
    if (ad.targetUrl) {
      window.location.href = ad.targetUrl;
    }
  };

  // RENDER HOMEPAGE TOP BANNER OR MIDDLE BANNER
  if (placement === 'homepage_top' || placement === 'homepage_middle' || placement === 'category_header') {
    const currentAd = ads[currentBannerIndex % ads.length];
    const isMulti = ads.length > 1;

    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-xl ${className}`}>
        {/* Sponsored Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold text-slate-950 backdrop-blur-md shadow-md">
          <Megaphone className="h-3.5 w-3.5" />
          <span>{labels.sponsored}</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6">
          <div className="flex-1 space-y-3 text-right">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <StoreIcon className="h-4 w-4" />
              <span>{currentAd.storeName}</span>
              {currentAd.category && (
                <>
                  <span>•</span>
                  <span className="bg-emerald-700/60 px-2 py-0.5 rounded-md">{currentAd.category}</span>
                </>
              )}
            </div>

            <h3 className="text-xl md:text-3xl font-black text-white leading-tight">
              {lang === 'FR' && currentAd.titleFr ? currentAd.titleFr : currentAd.titleAr}
            </h3>

            <p className="text-emerald-100 text-sm md:text-base line-clamp-2 max-w-2xl leading-relaxed">
              {lang === 'FR' && currentAd.descriptionFr ? currentAd.descriptionFr : currentAd.descriptionAr}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => handleAdClick(currentAd)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <span>{lang === 'FR' ? 'Découvrir la publicité' : 'استعرض العرض الممول'}</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>

          {currentAd.imageUrl && (
            <div className="w-full md:w-80 h-44 md:h-52 rounded-xl overflow-hidden bg-slate-950/40 relative group shrink-0 shadow-2xl border border-white/10">
              <img
                src={currentAd.imageUrl}
                alt={currentAd.titleAr}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            </div>
          )}
        </div>

        {/* Carousel controls if multiple banners */}
        {isMulti && (
          <div className="flex items-center justify-between px-6 py-2 bg-emerald-950/40 border-t border-emerald-700/40 text-xs text-emerald-200">
            <span>
              {lang === 'FR' ? `Publicité ${currentBannerIndex + 1} sur ${ads.length}` : `إعلان ${currentBannerIndex + 1} من ${ads.length}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + ads.length) % ads.length)}
                className="p-1 rounded bg-emerald-800/60 hover:bg-emerald-700 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % ads.length)}
                className="p-1 rounded bg-emerald-800/60 hover:bg-emerald-700 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER FEATURED STORES
  if (placement === 'featured_store_section') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'FR' ? 'Boutiques en Vedette (Sponsorisées)' : 'متاجر مميزة برعاية المنصة'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'FR' ? 'Grossistes recommandés et vérifiés' : 'كبار الموردين والمستوردين المميزين'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {labels.sponsored}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => {
            const matchedStore = stores.find((s) => s.id === ad.storeId || s.slug === ad.storeSlug);
            return (
              <div
                key={ad.id}
                onClick={() => handleAdClick(ad)}
                className="cursor-pointer group relative rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-900 dark:to-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-bold">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{labels.featuredStore}</span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600">
                    <img
                      src={matchedStore?.logoUrl || ad.imageUrl || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=200&q=80'}
                      alt={ad.titleAr}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="truncate">{matchedStore?.merchantName || ad.merchantName}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-base truncate group-hover:text-emerald-600 transition-colors">
                      {ad.titleAr}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {ad.descriptionAr}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>{lang === 'FR' ? 'Visiter la boutique' : 'زيارة المتجر'}</span>
                      <ChevronLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // RENDER SPONSORED PRODUCTS GRID
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
            <Megaphone className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {lang === 'FR' ? 'Produits Sponsorisés' : 'منتجات ممولة وموصى بها'}
          </h3>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
          {labels.sponsored}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ads.map((ad) => {
          const matchedStore = stores.find((s) => s.id === ad.storeId || s.slug === ad.storeSlug);
          const matchedProduct = matchedStore?.products.find((p) => p.id === ad.productId);

          return (
            <div
              key={ad.id}
              onClick={() => handleAdClick(ad)}
              className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-300/70 dark:border-amber-600/50 p-4 shadow-sm hover:shadow-md transition-all duration-200 relative flex flex-col justify-between"
            >
              {/* Sponsored Banner Badge */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-amber-500 text-slate-950 px-2.5 py-0.5 text-[10px] font-black shadow-md">
                <Tag className="h-3 w-3" />
                <span>{labels.sponsored}</span>
              </div>

              <div>
                <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 relative mb-3">
                  <img
                    src={ad.imageUrl || matchedProduct?.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                    alt={ad.titleAr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1 flex items-center gap-1">
                  <StoreIcon className="h-3.5 w-3.5" />
                  <span className="truncate">{ad.storeName}</span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug mb-2 group-hover:text-emerald-600 transition-colors">
                  {lang === 'FR' && ad.titleFr ? ad.titleFr : ad.titleAr}
                </h4>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                {/* STRICT B2B PRICE CHECK */}
                {canViewWholesalePrices ? (
                  <div>
                    <span className="text-xs text-slate-500 block">{lang === 'FR' ? 'Prix de gros' : 'سعر الجملة'}</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {(matchedProduct?.price || ad.priceDzd || 0).toLocaleString()} دج
                    </span>
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                    🔒 {lang === 'FR' ? 'Connexion B2B requise' : 'سجل دخول لرؤية السعر'}
                  </div>
                )}

                <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors">
                  {lang === 'FR' ? 'Voir' : 'عرض'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
