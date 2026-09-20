import React, { useState } from 'react';
import { Product, Store } from '../../types';
import { 
  X, 
  ShoppingBag, 
  Star, 
  ShieldCheck, 
  Truck, 
  Minus, 
  Plus,
  Package
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product;
  store: Store;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedVariant?: string) => void;
  isLoggedIn?: boolean;
  onOpenMemberAuthModal?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  store,
  onClose,
  onAddToCart,
  isLoggedIn = false,
  onOpenMemberAuthModal = () => {},
}) => {
  const minQty = product.minOrderQuantity && product.minOrderQuantity > 0 ? product.minOrderQuantity : 1;
  const [selectedImage, setSelectedImage] = useState<string>(product.images[0] || '');
  const [quantity, setQuantity] = useState<number>(minQty);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string,string>>(
    Object.fromEntries((product.variants || []).map((v) => [v.name, v.options[0] || '']))
  );

  const effectivePrice = [...(product.tierPrices || [])]
    .filter((t) => t.minQuantity <= quantity && t.price > 0)
    .sort((a,b) => b.minQuantity - a.minQuantity)[0]?.price ?? product.price;
  const selectedVariant = Object.entries(selectedVariantOptions)
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}: ${value}`)
    .join(' | ');

  const [addedNotice, setAddedNotice] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedVariant || undefined);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden relative">
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span className="absolute top-3 right-3 px-3 py-1 bg-amber-400 text-slate-900 font-black text-xs rounded-xl shadow-sm">
                  {product.badge}
                </span>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                      selectedImage === img ? 'border-indigo-600' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Actions */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{product.category}</span>
                <span className="text-[10px] text-slate-400 font-mono">/ SKU: {product.sku}</span>
              </div>

              <h2 className="text-xl font-black text-slate-900 font-['Cairo']">{product.title}</h2>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold">{product.ratings.score}</span>
                </div>
                <span className="text-xs text-slate-400">({product.ratings.count} تقييمات من المشتريين)</span>
              </div>

              <div className="pt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700 font-['Cairo']">
                  {effectivePrice.toLocaleString()} {store.currency}
                </span>
                {product.compareAtPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    {product.compareAtPrice} {store.currency}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                {product.description}
              </p>
            </div>

            {/* Quantity & Variant Pickers */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {(product.variants || []).map((variant) => (
                <div key={variant.name}>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر {variant.name}:</label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((opt) => (
                      <button key={opt} type="button" onClick={() => setSelectedVariantOptions((prev) => ({ ...prev, [variant.name]: opt }))} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${selectedVariantOptions[variant.name] === opt ? 'bg-indigo-50 border-indigo-500 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
              ))}

              {(product.tierPrices || []).length > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="text-xs font-black text-emerald-950 mb-2">سعر الجملة حسب الكمية</div>
                  <div className="flex flex-wrap gap-2">
                    {product.tierPrices.map((tier) => <span key={`${tier.minQuantity}-${tier.price}`} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${quantity >= tier.minQuantity ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-800 border-emerald-200'}`}>{tier.minQuantity}+ = {tier.price.toLocaleString()} {store.currency}</span>)}
                  </div>
                </div>
              )}

              {/* Minimum Order Quantity (MOQ) Notice */}
              <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>الحد الأدنى لطلب هذا المنتج (تحديد البائع):</span>
                </span>
                <span className="font-black text-indigo-700 font-mono bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-2xs">
                  {minQty} {product.packageUnit || 'قطع'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700">الكمية المطلوبة:</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                    disabled={quantity <= minQty}
                    className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={`الحد الأدنى للطلب هو ${minQty}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-slate-500 hover:text-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {addedNotice ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-700">
                  ✓ تم إضافة المنتج إلى سلة الشراء بنجاح!
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>إضافة المنتج للسلة المشتريات</span>
                </button>
              )}

              <div className="flex items-center justify-around text-[11px] text-slate-500 pt-2">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>توصيل سريع</span>
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ضمان الأصالة</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
