import React, { useState } from 'react';
import { Store, Product, AdPackage, AdType, AdPlacement, Advertisement } from '../../types';
import { getAdPackages, getAdSettings, createAdvertisement, AD_LABELS } from '../../lib/adSystem';
import { getAdminBaridimob } from '../../lib/adminSettings';
import { Megaphone, X, Package, Upload, CheckCircle2, DollarSign, Image, Tag, ArrowRight, ArrowLeft } from 'lucide-react';

interface CreateAdModalProps {
  store: Store;
  onClose: () => void;
  onSuccess: () => void;
  lang?: 'AR' | 'FR';
}

export const CreateAdModal: React.FC<CreateAdModalProps> = ({
  store,
  onClose,
  onSuccess,
  lang = 'AR',
}) => {
  const labels = AD_LABELS[lang] || AD_LABELS.AR;
  const packages = getAdPackages().filter((p) => p.active);
  const baridimob = getAdminBaridimob();

  const [selectedPackage, setSelectedPackage] = useState<AdPackage | null>(packages[0] || null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    store.products.length > 0 ? store.products[0] : null
  );

  const [titleAr, setTitleAr] = useState(selectedProduct ? selectedProduct.title : store.name);
  const [descriptionAr, setDescriptionAr] = useState(
    selectedProduct ? selectedProduct.description : store.description
  );
  const [imageUrl, setImageUrl] = useState(
    selectedProduct?.images[0] || store.bannerUrl || store.logoUrl || ''
  );
  const [paymentTxId, setPaymentTxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BaridiMob' | 'CCP'>('BaridiMob');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductSelect = (p: Product) => {
    setSelectedProduct(p);
    setTitleAr(p.title);
    setDescriptionAr(p.description);
    if (p.images && p.images.length > 0) {
      setImageUrl(p.images[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr) {
      alert(lang === 'FR' ? 'Veuillez remplir le titre' : 'يرجى إدخال عنوان الإعلان');
      return;
    }
    if (!selectedPackage) {
      alert(lang === 'FR' ? 'Veuillez choisir un pack' : 'يرجى اختيار الباقة الإعلانية');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + selectedPackage.durationDays * 86400000);

      createAdvertisement({
        merchantUserId: store.merchantUserId || 'merchant-owner',
        merchantName: store.merchantName || store.name,
        storeId: store.id,
        storeSlug: store.slug,
        storeName: store.name,
        productId: selectedProduct?.id,
        productTitle: selectedProduct?.title,
        adType: selectedPackage.adType,
        placement: selectedPackage.placement,
        category: store.category,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        titleAr,
        titleFr: titleAr,
        descriptionAr,
        descriptionFr: descriptionAr,
        targetUrl: `/store/${store.slug}`,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        priceDzd: selectedPackage.priceDzd,
        packageId: selectedPackage.id,
        status: 'pending_approval',
        paymentStatus: 'pending',
        paymentTxId: paymentTxId || undefined,
        paymentMethod,
        priority: selectedPackage.priority || 1,
      });

      alert(
        lang === 'FR'
          ? 'Publicité soumise avec succès ! Elle sera validée dès confirmation du paiement.'
          : 'تم إرسال طلب الإعلان بنجاح! سيتم تفعيله بعد مراجعة تأكيد السداد من الإدارة.'
      );
      onSuccess();
    } catch (err: any) {
      alert(err?.message || 'خطأ في إنشاء الإعلان');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {labels.createAd}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'FR' ? 'Boostez la visibilité de vos produits sur Youmi' : 'زد مبيعاتك برفع منتجاتك ومتجرك لأعلى أقسام المنصة'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* STEP 1: Select Package */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              1. {lang === 'FR' ? 'Choisissez votre Pack Publicitaire' : 'اختر الباقة الإعلانية المناسبة:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">
                        {pkg.durationDays} {labels.days}
                      </span>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">
                        {lang === 'FR' ? pkg.nameFr : pkg.nameAr}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {lang === 'FR' ? pkg.descriptionFr : pkg.descriptionAr}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {pkg.priceDzd.toLocaleString()} دج
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Select Product or Custom Store Ad */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              2. {lang === 'FR' ? 'Sélectionnez le produit à promouvoir (Optionnel)' : 'اختر المنتج المراد ترويجه:'}
            </label>
            {store.products.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {store.products.map((p) => {
                  const isSel = selectedProduct?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductSelect(p)}
                      className={`shrink-0 w-44 cursor-pointer p-2.5 rounded-xl border-2 transition-all ${
                        isSel
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-full h-20 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden mb-2">
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</div>
                      <div className="text-[11px] text-emerald-600 font-semibold">{p.price.toLocaleString()} دج</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs">
                {lang === 'FR' ? "Aucun produit trouvé. La publicité ciblera votre boutique." : "لا يوجد منتجات بالمتجر. سيتم إنشاء إعلان مباشر للمتجر."}
              </div>
            )}
          </div>

          {/* STEP 3: Content & Banner Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان الإعلان البارز
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: خصم حصري بالجملة على أجهزة الكمبيوتر للموزعين"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                وصف العرض الممول
              </label>
              <textarea
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                rows={2}
                placeholder="تفاصيل العرض أو التخفيضات التي تقدمها للزبائن..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رابط صورة البانر/المنتج (Banner Image URL)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono"
              />
            </div>
          </div>

          {/* STEP 4: BaridiMob / Payment Information */}
          <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>{labels.paymentDetails}</span>
            </h4>
            <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div>• رقم المعرف البريدي RIP: <strong className="font-mono text-sm">{baridimob.ripNumber}</strong></div>
              <div>• رقم الـ CCP: <strong>{baridimob.ccpAccount}</strong></div>
              <div>• المستفيد: <strong>{baridimob.accountHolder}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                {labels.txId}
              </label>
              <input
                type="text"
                value={paymentTxId}
                onChange={(e) => setPaymentTxId(e.target.value)}
                placeholder="أدخل رقم المعاملة بعد التحويل (e.g. BM-98230192)"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-sm font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{labels.submitAd}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
