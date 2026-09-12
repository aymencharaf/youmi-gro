import React, { useState, useEffect } from 'react';
import { Advertisement, AdPackage, AdSettings, AdStatus, AdPaymentStatus, AdType, AdPlacement as PlacementType, Store } from '../../types';
import {
  getAdvertisements,
  saveAdvertisements,
  getAdPackages,
  saveAdPackages,
  getAdSettings,
  saveAdSettings,
  updateAdvertisementStatus,
  createAdvertisement,
  calculateCTR,
  AD_LABELS,
} from '../../lib/adSystem';
import {
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  PauseCircle,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  PlusCircle,
  Edit,
  Trash2,
  Settings,
  Package,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface AdminAdsManagerProps {
  stores?: Store[];
  lang?: 'AR' | 'FR';
}

export const AdminAdsManager: React.FC<AdminAdsManagerProps> = ({ stores = [], lang = 'AR' }) => {
  const labels = AD_LABELS[lang] || AD_LABELS.AR;
  const isRtl = lang === 'AR';

  const [activeTab, setActiveTab] = useState<'ads' | 'packages' | 'settings'>('ads');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [ads, setAds] = useState<Advertisement[]>(() => getAdvertisements());
  const [packages, setPackages] = useState<AdPackage[]>(() => getAdPackages());
  const [settings, setSettingsState] = useState<AdSettings>(() => getAdSettings());

  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [editingPackage, setEditingPackage] = useState<AdPackage | null>(null);
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [rejectionModalAd, setRejectionModalAd] = useState<Advertisement | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const reloadData = () => {
    setAds(getAdvertisements());
    setPackages(getAdPackages());
    setSettingsState(getAdSettings());
  };

  useEffect(() => {
    const handleUpdate = () => reloadData();
    window.addEventListener('youmi_ads_updated', handleUpdate);
    window.addEventListener('youmi_ad_packages_updated', handleUpdate);
    window.addEventListener('youmi_ad_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('youmi_ads_updated', handleUpdate);
      window.removeEventListener('youmi_ad_packages_updated', handleUpdate);
      window.removeEventListener('youmi_ad_settings_updated', handleUpdate);
    };
  }, []);

  // Filtered Ads
  const filteredAds = ads.filter((ad) => {
    if (statusFilter !== 'all' && ad.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        ad.titleAr?.toLowerCase().includes(term) ||
        ad.titleFr?.toLowerCase().includes(term) ||
        ad.storeName?.toLowerCase().includes(term) ||
        ad.merchantName?.toLowerCase().includes(term) ||
        ad.id.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Analytics Totals
  const totalRevenue = ads
    .filter((a) => a.paymentStatus === 'paid')
    .reduce((sum, a) => sum + (a.priceDzd || 0), 0);
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const activeCount = ads.filter((a) => a.status === 'approved' && a.paymentStatus === 'paid').length;
  const pendingCount = ads.filter((a) => a.status === 'pending_approval').length;

  // Handlers for Ads
  const handleApprove = (ad: Advertisement) => {
    updateAdvertisementStatus(ad.id, 'approved', 'paid');
    reloadData();
  };

  const handleRejectSubmit = () => {
    if (rejectionModalAd) {
      updateAdvertisementStatus(rejectionModalAd.id, 'rejected', 'failed', rejectionReasonInput || 'لم يستوف الشروط');
      setRejectionModalAd(null);
      setRejectionReasonInput('');
      reloadData();
    }
  };

  const handleTogglePause = (ad: Advertisement) => {
    const nextStatus: AdStatus = ad.status === 'paused' ? 'approved' : 'paused';
    updateAdvertisementStatus(ad.id, nextStatus);
    reloadData();
  };

  const handleDeleteAd = (id: string) => {
    if (confirm(lang === 'FR' ? 'Voulez-vous supprimer cette publicité ?' : 'هل أنت تأكد من حذف هذا الإعلان؟')) {
      const updated = ads.filter((a) => a.id !== id);
      saveAdvertisements(updated);
      reloadData();
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdSettings(settings);
    alert(lang === 'FR' ? 'Paramètres sauvegardés avec succès !' : 'تم حفظ إعدادات الإعلانات بنجاح!');
  };

  // Package Management Handlers
  const handleSavePackage = (pkg: AdPackage) => {
    const current = getAdPackages();
    const idx = current.findIndex((p) => p.id === pkg.id);
    let updated: AdPackage[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = pkg;
    } else {
      updated = [pkg, ...current];
    }
    saveAdPackages(updated);
    setEditingPackage(null);
    reloadData();
  };

  const handleDeletePackage = (pkgId: string) => {
    if (confirm(lang === 'FR' ? 'Supprimer ce pack ?' : 'حذف هذه الباقة الإعلانية؟')) {
      const updated = packages.filter((p) => p.id !== pkgId);
      saveAdPackages(updated);
      reloadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {labels.adSystemTitle}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {lang === 'FR' ? 'Gérez les campagnes, packs publicitaires et Google AdSense' : 'إدارة الحملات الإعلانية للبائعين، الباقات، وإعدادات Google AdSense'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'ads'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>{labels.allAds}</span>
            {pendingCount > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'packages'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>{labels.adPackages}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>{labels.adSettings}</span>
          </button>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{lang === 'FR' ? 'Revenu Total Pub' : 'إجمالي مداخيل الإعلانات'}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalRevenue.toLocaleString()} دج</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{labels.impressions}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalImpressions.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <MousePointer className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{labels.clicks}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalClicks.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{lang === 'FR' ? 'Pubs Actives / En attente' : 'إعلانات نشطة / معلقة'}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {activeCount} / <span className="text-amber-600">{pendingCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: ALL ADS MANAGEMENT */}
      {activeTab === 'ads' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'FR' ? 'Rechercher une pub, boutique...' : 'بحث بعنوان الإعلان أو المتجر...'}
                className="w-full pr-9 pl-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              {['all', 'pending_approval', 'approved', 'paused', 'expired', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' && (lang === 'FR' ? 'Tous' : 'الكل')}
                  {st === 'pending_approval' && labels.pendingApproval}
                  {st === 'approved' && labels.approved}
                  {st === 'paused' && labels.paused}
                  {st === 'expired' && labels.expired}
                  {st === 'rejected' && labels.rejected}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">{lang === 'FR' ? 'Publicité & Vendeur' : 'الإعلان والتاجر'}</th>
                  <th className="px-4 py-3">{lang === 'FR' ? 'Type & Emplacement' : 'نوع الإعلان ومكانه'}</th>
                  <th className="px-4 py-3">{lang === 'FR' ? 'Dates & Prix' : 'التاريخ والسعر'}</th>
                  <th className="px-4 py-3">{lang === 'FR' ? 'Statut & Paiement' : 'الحالة والدفع'}</th>
                  <th className="px-4 py-3">{lang === 'FR' ? 'Stats (Imp / Clics / CTR)' : 'الإحصائيات (ظهور/نقرات/CTR)'}</th>
                  <th className="px-4 py-3 text-left">{lang === 'FR' ? 'Actions' : 'الإجراءات'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredAds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      {lang === 'FR' ? 'Aucune publicité trouvée' : 'لا توجد إعلانات مسجلة بحسب الفلتر المحدد.'}
                    </td>
                  </tr>
                ) : (
                  filteredAds.map((ad) => {
                    const ctrStr = calculateCTR(ad.clicks, ad.impressions);
                    return (
                      <tr key={ad.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600">
                              <img
                                src={ad.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'}
                                alt={ad.titleAr}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{ad.titleAr}</div>
                              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{ad.storeName}</div>
                              <div className="text-[10px] text-slate-400">ID: {ad.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
                            {ad.adType}
                          </span>
                          <div className="text-xs text-slate-500 mt-1">{ad.placement}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">{ad.priceDzd.toLocaleString()} دج</div>
                          <div className="text-xs text-slate-400">
                            {new Date(ad.startDate).toLocaleDateString('ar-DZ')} ➔ {new Date(ad.endDate).toLocaleDateString('ar-DZ')}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                ad.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : ad.status === 'pending_approval'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : ad.status === 'paused'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              }`}
                            >
                              {ad.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                              {ad.status === 'pending_approval' && <Clock className="h-3 w-3" />}
                              {ad.status === 'paused' && <PauseCircle className="h-3 w-3" />}
                              {ad.status === 'rejected' && <XCircle className="h-3 w-3" />}
                              <span>
                                {ad.status === 'approved' && labels.approved}
                                {ad.status === 'pending_approval' && labels.pendingApproval}
                                {ad.status === 'paused' && labels.paused}
                                {ad.status === 'rejected' && labels.rejected}
                                {ad.status === 'expired' && labels.expired}
                              </span>
                            </span>

                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <span>الدفع:</span>
                              <span className={`font-semibold ${ad.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {ad.paymentStatus === 'paid' ? labels.paid : labels.unpaid}
                              </span>
                              {ad.paymentTxId && <span className="text-[10px] text-slate-400">({ad.paymentTxId})</span>}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs space-y-0.5">
                            <div>👁️ {ad.impressions || 0} {labels.impressions}</div>
                            <div>🖱️ {ad.clicks || 0} {labels.clicks}</div>
                            <div className="font-bold text-amber-600 dark:text-amber-400">CTR: {ctrStr}</div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            {ad.status === 'pending_approval' && (
                              <>
                                <button
                                  onClick={() => handleApprove(ad)}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                >
                                  قبول
                                </button>
                                <button
                                  onClick={() => setRejectionModalAd(ad)}
                                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                                >
                                  رفض
                                </button>
                              </>
                            )}

                            {ad.status === 'approved' && (
                              <button
                                onClick={() => handleTogglePause(ad)}
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                              >
                                إيقاف
                              </button>
                            )}

                            {ad.status === 'paused' && (
                              <button
                                onClick={() => handleTogglePause(ad)}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                              >
                                تفعيل
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteAd(ad.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-600 dark:hover:bg-red-950/40"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
      )}

      {/* TAB 2: AD PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'FR' ? 'Boutique des Packs Publicitaires' : 'باقات الإعلانات المتاحة للبائعين'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'FR' ? 'Définissez le prix, la durée et la priorité de chaque pack' : 'قم بتحديد الأسعار والمدة والمزايا لكل باقة يختار منها البائع'}
              </p>
            </div>
            <button
              onClick={() =>
                setEditingPackage({
                  id: `pkg-${Date.now()}`,
                  nameAr: 'باقة جديدة',
                  nameFr: 'Nouveau Pack',
                  priceDzd: 3000,
                  durationDays: 10,
                  adType: 'sponsored_product',
                  placement: 'sponsored_grid',
                  priority: 2,
                  descriptionAr: 'وصف الباقة الإعلانية...',
                  descriptionFr: 'Description du pack...',
                  active: true,
                })
              }
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow flex items-center gap-2 hover:bg-amber-400"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{lang === 'FR' ? 'Nouveau Pack' : 'إضافة باقة جديدة'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold">
                      {pkg.durationDays} {labels.days}
                    </span>
                    <span className="text-xs text-slate-400">أولوية: {pkg.priority}</span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    {lang === 'FR' ? pkg.nameFr : pkg.nameAr}
                  </h3>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
                    {pkg.priceDzd.toLocaleString()} دج
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    {lang === 'FR' ? pkg.descriptionFr : pkg.descriptionAr}
                  </p>

                  <div className="text-xs text-slate-500 space-y-1 mb-6 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                    <div>📌 {lang === 'FR' ? 'Type:' : 'النوع:'} <strong>{pkg.adType}</strong></div>
                    <div>🎯 {lang === 'FR' ? 'Emplacement:' : 'مكان الظهور:'} <strong>{pkg.placement}</strong></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => setEditingPackage(pkg)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-900 dark:text-white font-bold text-xs"
                  >
                    تعديل الباقة
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AD SETTINGS & GOOGLE ADSENSE */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
          {/* Google AdSense Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {labels.googleAdSenseTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.googleAdsenseEnabled}
                  onChange={(e) => setSettingsState({ ...settings, googleAdsenseEnabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{labels.enableAdSense}</span>
                  <span className="text-xs text-slate-500">إظهار وحدات Google AdSense في الصفحة الرئيسية والتصنيفات</span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {labels.adSenseClientId} (e.g. ca-pub-1234567890123456)
                </label>
                <input
                  type="text"
                  value={settings.googleAdsenseClientId}
                  onChange={(e) => setSettingsState({ ...settings, googleAdsenseClientId: e.target.value })}
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Seller Advertising Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Megaphone className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {labels.sellerAdsTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sellerAdvertisingEnabled}
                  onChange={(e) => setSettingsState({ ...settings, sellerAdvertisingEnabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{labels.enableSellerAds}</span>
                  <span className="text-xs text-slate-500">السماح للبائعين بإنشاء وحجز إعلانات مدفوعة لمتاجرهم ومنتجاتهم</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireAdminApproval}
                  onChange={(e) => setSettingsState({ ...settings, requireAdminApproval: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{labels.requireApproval}</span>
                  <span className="text-xs text-slate-500">يتطلب الإعلان مراجعة وموافقة الإدارة قبل نشره للعملاء</span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {labels.maxAdsPerPos}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxAdsPerPosition}
                  onChange={(e) => setSettingsState({ ...settings, maxAdsPerPosition: parseInt(e.target.value) || 4 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {labels.defaultDuration}
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.defaultAdDurationDays}
                  onChange={(e) => setSettingsState({ ...settings, defaultAdDurationDays: parseInt(e.target.value) || 15 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm shadow-lg flex items-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>{lang === 'FR' ? 'Enregistrer les paramètres' : 'حفظ إعدادات الإعلانات'}</span>
            </button>
          </div>
        </form>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalAd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'FR' ? 'Refuser la publicité' : 'سبب رفض الإعلان'}
            </h3>
            <p className="text-xs text-slate-500">
              يرجى توضيح سبب الرفض ليصل للتوجيه في حساب التاجر:
            </p>
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="مثال: الصورة غير واضحة، أو تفاصيل المنتج غير صحيحة..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalAd(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PACKAGE MODAL */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              تعديل الباقة الإعلانية
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">الاسم بالعربية</label>
                <input
                  type="text"
                  value={editingPackage.nameAr}
                  onChange={(e) => setEditingPackage({ ...editingPackage, nameAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">الاسم بالفرنسية</label>
                <input
                  type="text"
                  value={editingPackage.nameFr}
                  onChange={(e) => setEditingPackage({ ...editingPackage, nameFr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">السعر (دج)</label>
                <input
                  type="number"
                  value={editingPackage.priceDzd}
                  onChange={(e) => setEditingPackage({ ...editingPackage, priceDzd: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">المدة (أيام)</label>
                <input
                  type="number"
                  value={editingPackage.durationDays}
                  onChange={(e) => setEditingPackage({ ...editingPackage, durationDays: parseInt(e.target.value) || 7 })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">الوصف بالعربية</label>
              <textarea
                value={editingPackage.descriptionAr}
                onChange={(e) => setEditingPackage({ ...editingPackage, descriptionAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingPackage(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSavePackage(editingPackage)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
              >
                حفظ الباقة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
