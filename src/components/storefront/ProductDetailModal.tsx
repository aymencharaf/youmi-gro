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
  Lock
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
  const [selectedImage, setSelectedImage] = useState<string>(product.images[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariantOption, setSelectedVariantOption] = useState<string>(
    product.variants?.[0]?.options[0] || ''
  );
  const [addedNotice, setAddedNotice] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedVariantOption || undefined);
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

              {isLoggedIn ? (
                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-700 font-['Cairo']">
                    {product.price} {store.currency}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {product.compareAtPrice} {store.currency}
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 my-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>الأسعار محميّة: تظهر للأعضاء المسجلين فقط 🔐</span>
                  </div>
                  <button
                    onClick={onOpenMemberAuthModal}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition shadow-xs"
                  >
                    دخول / تسجيل
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                {product.description}
              </p>
            </div>

            {/* Quantity & Variant Pickers */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {product.variants && product.variants.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اختر {product.variants[0].name}:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants[0].options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedVariantOption(opt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                          selectedVariantOption === opt
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700">الكمية:</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-slate-500 hover:text-slate-800"
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
