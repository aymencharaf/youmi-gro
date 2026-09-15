import React, { useState } from 'react';
import { Store, Product, Order } from '../../types';
import { getMerchantCode } from '../../lib/storage';
import { ProductDetailModal } from './ProductDetailModal';
import { CheckoutModal } from './CheckoutModal';
import { OrderSuccessModal } from './OrderSuccessModal';
import { OrderTrackerModal } from './OrderTrackerModal';
import { AdPlacement } from '../ads/AdPlacement';
import { GoogleAd } from '../ads/GoogleAd';
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
  UserCheck,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Share2,
  PhoneCall,
  ExternalLink,
  Building2,
  CheckCircle,
  Copy
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
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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

  const handleAddToCart = (product: Product, quantity?: number, selectedVariant?: string) => {
    const minQty = product.minOrderQuantity && product.minOrderQuantity > 0 ? product.minOrderQuantity : 1;
    const finalQty = quantity !== undefined ? quantity : minQty;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedVariant === selectedVariant
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += finalQty;
        return updated;
      }
      return [...prev, { product, quantity: finalQty, selectedVariant }];
    });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    const item = cart[index];
    const minQty = item?.product.minOrderQuantity && item.product.minOrderQuantity > 0 ? item.product.minOrderQuantity : 1;
    if (newQty < minQty) {
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

            {/* Merchant Contact Button for Customers */}
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition flex items-center gap-1.5 shadow-2xs"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">اتصل بالتاجر</span>
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

        {/* SPONSORED ADVERTISEMENT BANNER FOR STORE / CATEGORY */}
        <AdPlacement
          placement="category_header"
          category={selectedCategory !== 'الكل' ? selectedCategory : store.category}
          stores={[store]}
        />

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
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-[11px] text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-bold">{product.ratings.score}</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      أدنى طلب: {product.minOrderQuantity || 1} {product.packageUnit || 'قطع'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Add to Cart Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-base font-black text-emerald-700 font-['Cairo']">
                    {product.price} <span className="text-xs">{store.currency}</span>
                  </div>
                  {product.compareAtPrice && (
                    <div className="text-[11px] text-slate-400 line-through">
                      {product.compareAtPrice} {store.currency}
                    </div>
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

      {/* Storefront Merchant Contact Footer */}
      <footer id="contact-footer" className="bg-slate-900 text-white mt-16 pt-12 pb-8 px-4 lg:px-8 border-t-4 border-indigo-600 dir-rtl font-['Tajawal']">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Store & Merchant Info */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500 bg-white"
                />
                <div>
                  <h3 className="font-black text-white text-base font-['Cairo']">{store.name}</h3>
                  <span className="font-mono text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 inline-block mt-0.5">
                    رقم البائع: {getMerchantCode(store)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {store.description || store.slogan}
              </p>
              <div className="text-[11px] text-slate-400">
                <span>التاجر المسجل: </span>
                <strong className="text-white">{store.merchantName}</strong>
              </div>
            </div>

            {/* Col 2: Direct Contact Phones & WhatsApp */}
            <div className="space-y-3">
              <h4 className="font-bold text-amber-400 text-sm font-['Cairo'] flex items-center gap-2">
                <PhoneCall className="w-4 h-4" />
                <span>أرقام الاتصال والطلب</span>
              </h4>
              <div className="space-y-2 text-xs">
                {(store.settings.contactInfo?.phone || store.phone) && (
                  <a
                    href={`tel:${store.settings.contactInfo?.phone || store.phone}`}
                    className="flex items-center gap-2 text-slate-200 hover:text-emerald-400 transition bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 dir-ltr justify-end"
                  >
                    <span className="font-bold font-mono">{store.settings.contactInfo?.phone || store.phone}</span>
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </a>
                )}

                {store.settings.contactInfo?.phone2 && (
                  <a
                    href={`tel:${store.settings.contactInfo.phone2}`}
                    className="flex items-center gap-2 text-slate-200 hover:text-blue-400 transition bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 dir-ltr justify-end"
                  >
                    <span className="font-bold font-mono">{store.settings.contactInfo.phone2}</span>
                    <PhoneCall className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  </a>
                )}

                {(store.settings.contactInfo?.whatsapp || store.settings.socialLinks?.whatsapp || store.phone) && (
                  <a
                    href={`https://wa.me/${(store.settings.contactInfo?.whatsapp || store.phone).replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-950/60 hover:bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-800/60 transition justify-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة عبر الواتساب (WhatsApp)</span>
                  </a>
                )}
              </div>
            </div>

            {/* Col 3: Email & Address & Hours */}
            <div className="space-y-3">
              <h4 className="font-bold text-amber-400 text-sm font-['Cairo'] flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>المقر وأوقات العمل</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                {(store.settings.contactInfo?.email || store.email) && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <a href={`mailto:${store.settings.contactInfo?.email || store.email}`} className="hover:text-indigo-300 font-mono">
                      {store.settings.contactInfo?.email || store.email}
                    </a>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100 block">{store.settings.contactInfo?.wilaya || store.settings.shippingApiSettings?.originWilaya || 'الجزائر'}</span>
                    <span className="text-[11px] text-slate-400">{store.settings.contactInfo?.address || 'المقر التجاري والمستودع الرئيسي'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-amber-200/90 text-[11px] bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{store.settings.contactInfo?.workingHours || 'من الأحد إلى الخميس: 08:00 ص - 05:00 م'}</span>
                </div>
              </div>
            </div>

            {/* Col 4: Social Media & Trust */}
            <div className="space-y-3">
              <h4 className="font-bold text-amber-400 text-sm font-['Cairo'] flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>شبكات التواصل والتفاعل</span>
              </h4>

              <div className="flex flex-wrap gap-2">
                {(store.settings.contactInfo?.facebook || store.settings.socialLinks?.facebook) && (
                  <a
                    href={store.settings.contactInfo?.facebook || store.settings.socialLinks?.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs font-bold rounded-xl border border-blue-500/30 flex items-center gap-1.5 transition"
                  >
                    <span>Facebook</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {(store.settings.contactInfo?.instagram || store.settings.socialLinks?.instagram) && (
                  <a
                    href={store.settings.contactInfo?.instagram || store.settings.socialLinks?.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 text-xs font-bold rounded-xl border border-pink-500/30 flex items-center gap-1.5 transition"
                  >
                    <span>Instagram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {store.settings.contactInfo?.telegram && (
                  <a
                    href={store.settings.contactInfo.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 text-xs font-bold rounded-xl border border-sky-500/30 flex items-center gap-1.5 transition"
                  >
                    <span>Telegram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>متجر موثوق ومسجل بالمنصة</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  جميع معاملة ومشتريات الجملة محمية والدفع حصرياً عند التسليم والمعاينة (COD).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لمتجر {store.name} — منصة يومي للجملة Youmi.dz</p>
            <div className="flex items-center gap-3 text-[11px]">
              <span>رقم البائع: <strong className="text-slate-300 font-mono">{getMerchantCode(store)}</strong></span>
              <span>•</span>
              <span>ولاية النشاط: <strong className="text-slate-300">{store.settings.contactInfo?.wilaya || store.settings.shippingApiSettings?.originWilaya || 'الجزائر'}</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Slide-out Cart Drawer */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border-r border-slate-200 h-full flex flex-col justify-between p-6 shadow-2xl text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900 font-['Cairo']">سلة المشتريات ({cartItemsCount})</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl bg-slate-100 transition flex items-center gap-1.5 border border-slate-200"
                  title="إغلاق السلة"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق السلة</span>
                </button>
              </div>

              {/* Free Shipping Progress Indicator */}
              {store.settings.showFreeShippingMessage !== false && (
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
              )}

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
                  <div className="text-center py-12 text-slate-400 space-y-3">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">السلة فارغة حالياً</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-2 px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition inline-flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>إغلاق السلة والتصفح</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Footer Total, Checkout & Close Button */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              {cart.length > 0 && (
                <>
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
                </>
              )}

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>إغلاق السلة</span>
              </button>
            </div>
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

      {/* Merchant Contact Modal for Customers */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 border border-slate-200 shadow-2xl relative dir-rtl animate-in fade-in zoom-in-95 duration-200 font-['Tajawal']">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <img
                src={store.logoUrl}
                alt={store.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
              />
              <div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-mono">
                  رقم البائع: {getMerchantCode(store)}
                </span>
                <h3 className="text-lg font-black text-slate-900 font-['Cairo'] mt-0.5">{store.name}</h3>
                <p className="text-xs text-indigo-600 font-semibold">{store.slogan}</p>
              </div>
            </div>

            {/* Contact Details List */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-500 font-['Cairo']">معلومات وتفاصيل التواصل المباشر مع التاجر:</h4>

              {/* Phone Primary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">الهاتف الرئيسي</span>
                    <span className="text-sm font-bold font-mono text-slate-900 dir-ltr inline-block">
                      {store.settings.contactInfo?.phone || store.phone}
                    </span>
                  </div>
                </div>
                <a
                  href={`tel:${store.settings.contactInfo?.phone || store.phone}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>اتصال</span>
                </a>
              </div>

              {/* Secondary Phone if exists */}
              {store.settings.contactInfo?.phone2 && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block">رقم خدمة العملاء</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dir-ltr inline-block">
                        {store.settings.contactInfo.phone2}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`tel:${store.settings.contactInfo.phone2}`}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>اتصال</span>
                  </a>
                </div>
              )}

              {/* WhatsApp direct chat */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-900 block">محادثة الواتساب الفورية</span>
                    <span className="text-xs text-emerald-800">تواصل مباشر وسريع للطلب والاستفسارات</span>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${(store.settings.contactInfo?.whatsapp || store.phone).replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>مراسلة</span>
                </a>
              </div>

              {/* Email */}
              {(store.settings.contactInfo?.email || store.email) && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">البريد الإلكتروني</span>
                    <a href={`mailto:${store.settings.contactInfo?.email || store.email}`} className="text-xs font-bold font-mono text-indigo-700 hover:underline">
                      {store.settings.contactInfo?.email || store.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Location & Address */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">مقر النشاط والمستودع الرئيسي</span>
                  <span className="text-xs font-bold text-slate-900 block">
                    {store.settings.contactInfo?.wilaya || store.settings.shippingApiSettings?.originWilaya || 'الجزائر العاصمة'}
                  </span>
                  <span className="text-xs text-slate-600 block mt-0.5">
                    {store.settings.contactInfo?.address || 'المنطقة التجارية للبيع بالجملة'}
                  </span>
                </div>
              </div>

              {/* Working Hours */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-bold text-amber-950">
                  {store.settings.contactInfo?.workingHours || 'من الأحد إلى الخميس: 08:00 صباحاً - 05:00 مساءً'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
