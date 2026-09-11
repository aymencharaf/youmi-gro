import React, { useState } from 'react';
import { Store, Product, Order } from '../../types';
import { ProductDetailModal } from './ProductDetailModal';
import { CheckoutModal } from './CheckoutModal';
import { OrderSuccessModal } from './OrderSuccessModal';
import { OrderTrackerModal } from './OrderTrackerModal';
import { 
  ShoppingBag, 
  Search, 
  Star, 
  Tag, 
  Truck, 
  ShieldCheck, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  LayoutDashboard,
  ChevronLeft,
  Lock,
  UserCheck
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

interface StoreFrontViewProps {
  store: Store;
  onNavigateHome?: () => void;
  onNavigateMerchant?: (store: Store) => void;
  isLoggedIn?: boolean;
  onOpenMemberAuthModal?: () => void;
}

export const StoreFrontView: React.FC<StoreFrontViewProps> = ({
  store,
  onNavigateHome = () => {},
  onNavigateMerchant = (_store: Store) => {},
  isLoggedIn = false,
  onOpenMemberAuthModal = () => {},
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  const categories = ['الكل', ...Array.from(new Set(store.products.map((p) => p.category)))];

  const filteredProducts = store.products.filter((p) => {
    const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const isFreeShipping = cartSubtotal >= store.settings.freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, store.settings.freeShippingThreshold - cartSubtotal);

  const handleAddToCart = (product: Product, quantity = 1, selectedVariant?: string) => {
    if (!isLoggedIn) { onOpenMemberAuthModal(); return; }
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedVariant === selectedVariant
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, selectedVariant }];
    });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCart((prev) => {
        const updated = [...prev];
        updated[index].quantity = newQty;
        return updated;
      });
    }
  };

  const handleOrderCompleted = (order: Order) => {
    setCart([]);
    setIsCheckoutOpen(false);
    setCompletedOrder(order);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800 flex flex-col dir-rtl font-['Tajawal']">
      {/* Floating Top Merchant Switcher Banner for Testing/Demo */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold">معاينة المتجر المستقل - منصة يومي</span>
          <span className="text-slate-400 font-mono hidden sm:inline">(youmi.dz/m/{store.slug})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateMerchant(store)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center gap-1 text-[11px]"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>لوحة تحكم التاجر</span>
          </button>
          <button
            onClick={onNavigateHome}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition text-[11px]"
          >
            المنصة الرئيسية
          </button>
        </div>
      </div>

      {/* Store Announcement Bar */}
      {store.settings.announcementBar && (
        <div className="bg-indigo-600 text-white py-2 px-4 text-center text-xs font-bold tracking-wide shadow-sm font-['Cairo'] flex items-center justify-center gap-2">
          <Tag className="w-3.5 h-3.5" />
          <span>{store.settings.announcementBar}</span>
        </div>
      )}

      {/* Main Store Header */}
      <header className="bg-white border-b border-slate-200 sticky top-9 z-30 px-4 lg:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src={store.logoUrl}
              alt={store.name}
              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover bg-white border border-slate-200 shadow-sm"
            />
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 font-['Cairo'] tracking-tight">
                {store.name}
              </h1>
              <p className="text-xs text-indigo-600 font-medium">{store.slogan}</p>
            </div>
          </div>

          {/* Search Bar & Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالمتجر..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <button
              onClick={() => setIsTrackerOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">تتبع شحنتك</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm relative"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>السلة</span>
              {cartItemsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-black">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-white py-12 md:py-16 px-4 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              تسوق بثقة وأمان 100%
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-['Cairo'] leading-tight">
              أجود المنتجات المختارة بعناية في متجر <span className="text-indigo-600">{store.name}</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
              {store.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>شحن سريع لجميع المدن</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>دفع إلكتروني معتمد</span>
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[16/9] md:aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
              <img
                src={store.bannerUrl}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Catalog Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10 flex-1 space-y-8 w-full">
        {/* Category Filters Pill Row */}
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 shrink-0">
            عرض {filteredProducts.length} منتج
          </span>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 transition flex flex-col justify-between space-y-4 group shadow-sm"
            >
              <div className="space-y-3">
                {/* Product Image & Badge */}
                <div
                  onClick={() => setSelectedProduct(product)}
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 relative cursor-pointer group-hover:scale-[1.02] transition duration-300"
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.badge && (
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-amber-400 text-slate-900 font-black text-[10px] rounded-lg shadow-sm font-['Cairo']">
                      {product.badge}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">{product.category}</span>
                  <h3
                    onClick={() => setSelectedProduct(product)}
                    className="text-sm font-bold text-slate-900 font-['Cairo'] truncate hover:text-indigo-600 transition cursor-pointer"
                  >
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-amber-500 mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">{product.ratings.score}</span>
                    <span className="text-slate-400">({product.ratings.count})</span>
                  </div>
                </div>
              </div>

              {/* Price & Add to Cart Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {isLoggedIn ? (
                    <>
                      <div className="text-base font-black text-emerald-700 font-['Cairo']">
                        {product.price} <span className="text-xs">{store.currency}</span>
                      </div>
                      {product.compareAtPrice && (
                        <div className="text-[11px] text-slate-400 line-through">
                          {product.compareAtPrice} {store.currency}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={onOpenMemberAuthModal}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-900 rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-2xs group"
                      title="انقر لتسجيل الدخول ورؤية سعر الجملة"
                    >
                      <Lock className="w-3 h-3 text-amber-600 group-hover:scale-110 transition" />
                      <span>الأسعار للمسجلين فقط 🔐</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Slide-out Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white border-r border-slate-200 h-full flex flex-col justify-between p-6 shadow-2xl text-slate-800">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900 font-['Cairo']">سلة المشتريات ({cartItemsCount})</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Shipping Progress Indicator */}
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 my-4 text-xs space-y-1.5">
                {isFreeShipping ? (
                  <p className="text-emerald-700 font-bold text-center">🎉 تهانينا! حصلت على شحن مجاني للطلب!</p>
                ) : (
                  <p className="text-slate-700 text-center">
                    أضف بقيمة <strong className="text-indigo-700">{remainingForFreeShipping} {store.currency}</strong> إضافية للحصول على شحن مجاني!
                  </p>
                )}
                <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (cartSubtotal / store.settings.freeShippingThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-12 h-12 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{item.product.title}</h4>
                      <p className="text-emerald-700 font-bold text-xs mt-0.5">
                        {item.product.price} {store.currency}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                        <button
                          onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleUpdateQuantity(idx, 0)}
                        className="p-1 text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">السلة فارغة حالياً</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Footer Total & Checkout */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 font-['Cairo']">
                  <span>المجموع الفرعي:</span>
                  <span className="text-emerald-700 text-base">{cartSubtotal} {store.currency}</span>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>متابعة الشراء وإتمام الطلب</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals Mounting */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          store={store}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          isLoggedIn={isLoggedIn}
          onOpenMemberAuthModal={onOpenMemberAuthModal}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal
          store={store}
          cartItems={cart}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderCompleted={handleOrderCompleted}
        />
      )}

      {completedOrder && (
        <OrderSuccessModal
          order={completedOrder}
          store={store}
          onClose={() => setCompletedOrder(null)}
          onOpenTracker={() => {
            setCompletedOrder(null);
            setIsTrackerOpen(true);
          }}
        />
      )}

      {isTrackerOpen && (
        <OrderTrackerModal store={store} onClose={() => setIsTrackerOpen(false)} />
      )}
    </div>
  );
};
