import React, { useState, useEffect } from 'react';
import { Store, Advertisement } from '../../types';
import { getAdvertisements, calculateCTR, AD_LABELS } from '../../lib/adSystem';
import { CreateAdModal } from './CreateAdModal';
import {
  Megaphone,
  PlusCircle,
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface MerchantAdsTabProps {
  store: Store;
  lang?: 'AR' | 'FR';
}

export const MerchantAdsTab: React.FC<MerchantAdsTabProps> = ({ store, lang = 'AR' }) => {
  const labels = AD_LABELS[lang] || AD_LABELS.AR;

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchAds = () => {
    const all = getAdvertisements();
    // Scope strict: only ads belonging to this store / merchant
    const myAds = all.filter(
      (a) => a.storeId === store.id || (store.merchantUserId && a.merchantUserId === store.merchantUserId)
    );
    setAds(myAds);
  };

  useEffect(() => {
    fetchAds();
    const handleUpdate = () => fetchAds();
    window.addEventListener('youmi_ads_updated', handleUpdate);
    return () => window.removeEventListener('youmi_ads_updated', handleUpdate);
  }, [store.id]);

  // Merchant Analytics
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const totalSpent = ads
    .filter((a) => a.paymentStatus === 'paid')
    .reduce((acc, a) => acc + (a.priceDzd || 0), 0);
  const activeAdsCount = ads.filter((a) => a.status === 'approved' && a.paymentStatus === 'paid').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {labels.myAds}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'FR' ? 'Boostez la visibilité de votre boutique et suivez vos statistiques' : 'ترويج منتجاتك ومتجرك في أعلى أقسام منصة Youmi ومتابعة النقرات والظهور'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm shadow-lg flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          <span>{labels.createAd}</span>
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">{lang === 'FR' ? 'Publicités Actives' : 'إعلاناتك النشطة'}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{activeAdsCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">{labels.impressions}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalImpressions.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
            <MousePointer className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">{labels.clicks}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalClicks.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">{lang === 'FR' ? 'المبلغ المستثمر' : 'إجمالي المنفق على الإعلانات'}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalSpent.toLocaleString()} دج</span>
          </div>
        </div>
      </div>

      {/* Ads List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base">
          {lang === 'FR' ? 'Historique des Publicités' : 'سجل إعلانات متجرك'}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">{lang === 'FR' ? 'Publicité' : 'الإعلان'}</th>
                <th className="px-4 py-3">{lang === 'FR' ? 'Type' : 'النوع والمكان'}</th>
                <th className="px-4 py-3">{lang === 'FR' ? 'Durée & Prix' : 'المدة والسعر'}</th>
                <th className="px-4 py-3">{lang === 'FR' ? 'Statut' : 'الحالة والدفع'}</th>
                <th className="px-4 py-3">{lang === 'FR' ? 'Statistiques' : 'المشاهدات والنقرات'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <div className="max-w-xs mx-auto text-center space-y-3">
                      <Megaphone className="h-10 w-10 mx-auto text-amber-500 opacity-60" />
                      <p className="text-sm">
                        {lang === 'FR'
                          ? "Vous n'avez créé aucune publicité pour le moment."
                          : 'لم تقم بإنشاء أي إعلان مأجور بعد. اضغط على إنشاء إعلان جديد للبدء.'}
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        {labels.createAd}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                ads.map((ad) => {
                  const ctrStr = calculateCTR(ad.clicks, ad.impressions);
                  return (
                    <tr key={ad.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            <img
                              src={ad.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'}
                              alt={ad.titleAr}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{ad.titleAr}</div>
                            {ad.productTitle && <div className="text-xs text-slate-500">المنتج: {ad.productTitle}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold">
                          {ad.adType}
                        </span>
                        <div className="text-xs text-slate-400 mt-0.5">{ad.placement}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-emerald-600">{ad.priceDzd.toLocaleString()} دج</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(ad.startDate).toLocaleDateString('ar-DZ')} ➔ {new Date(ad.endDate).toLocaleDateString('ar-DZ')}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              ad.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ad.status === 'pending_approval'
                                ? 'bg-amber-100 text-amber-800'
                                : ad.status === 'paused'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {ad.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                            {ad.status === 'pending_approval' && <Clock className="h-3 w-3" />}
                            {ad.status === 'rejected' && <XCircle className="h-3 w-3" />}
                            <span>
                              {ad.status === 'approved' && labels.approved}
                              {ad.status === 'pending_approval' && labels.pendingApproval}
                              {ad.status === 'paused' && labels.paused}
                              {ad.status === 'rejected' && labels.rejected}
                              {ad.status === 'expired' && labels.expired}
                            </span>
                          </span>

                          <div className="text-xs text-slate-500">
                            الدفع: <strong className={ad.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>{ad.paymentStatus === 'paid' ? labels.paid : labels.unpaid}</strong>
                          </div>

                          {ad.rejectionReason && ad.status === 'rejected' && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg mt-1">
                              سبب الرفض: {ad.rejectionReason}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-xs space-y-0.5">
                          <div>👁️ {ad.impressions || 0} ظهور</div>
                          <div>🖱️ {ad.clicks || 0} نقرة</div>
                          <div className="font-bold text-amber-600">CTR: {ctrStr}</div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateAdModal
          store={store}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAds();
          }}
          lang={lang}
        />
      )}
    </div>
  );
};
