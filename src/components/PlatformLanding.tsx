import React, { useEffect, useMemo, useState } from 'react';
import { Store, AppView, Product } from '../types';
import { YoumiLogo } from './YoumiLogo';
import {
  Search,
  User,
  ShoppingCart,
  Menu,
  Home,
  Laptop,
  Smartphone,
  Shirt,
  Footprints,
  Wrench,
  Sparkles,
  Dumbbell,
  Baby,
  Sofa,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Truck,
  ShieldCheck,
  Headphones,
  Store as StoreIcon,
  PlusCircle,
  X,
  ArrowLeft,
  ArrowRight,
  Flame,
  Package,
  CheckCircle2,
  Building2,
  Tag,
  Lock,
  LogOut,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { B2BMember } from './MemberAuthModal';
import { getPlatformAnnouncements, PlatformAnnouncement } from '../lib/adminSettings';
import { AdPlacement } from './ads/AdPlacement';
import { GoogleAd } from './ads/GoogleAd';

interface PlatformLandingProps {
  stores: Store[];
  onNavigate?: (view: AppView) => void;
  onSelectStore?: (store: Store, view: 'MERCHANT_DASHBOARD' | 'STORE_FRONT') => void;
  onOpenLoginModal?: () => void;
  isLoggedIn?: boolean;
  isAdminLoggedIn?: boolean;
  currentMember?: B2BMember | null;
  onOpenMemberAuthModal?: () => void;
  onLogoutMember?: () => void;
  onOpenInfinityFreeModal?: () => void;
  onOpenAdminLoginModal?: () => void;
}

const formatDzd = (value: number) => `${value.toLocaleString('fr-DZ')} دج`;

export const PlatformLanding: React.FC<PlatformLandingProps> = ({
  stores = [],
  onNavigate = (_view: AppView) => {},
  onSelectStore = (_store: Store, _view: 'MERCHANT_DASHBOARD' | 'STORE_FRONT') => {},
  onOpenLoginModal = () => {},
  isLoggedIn = false,
  isAdminLoggedIn = false,
  currentMember = null,
  onOpenMemberAuthModal = () => {},
  onLogoutMember = () => {},
  onOpenInfinityFreeModal: _onOpenInfinityFreeModal = () => {},
  onOpenAdminLoginModal = () => {},
}) => {
  const [lang, setLang] = useState<'AR' | 'FR'>('AR');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [heroSlide, setHeroSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<{ product: Product; store: Store } | null>(null);
  const [cartItems, setCartItems] = useState<{ product: Product; store: Store; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>(() =>
    getPlatformAnnouncements().filter(
      (a) => a.active && (a.targetAudience === 'all' || a.targetAudience === 'buyers')
    )
  );

  useEffect(() => {
    const update = () => {
      setAnnouncements(
        getPlatformAnnouncements().filter(
          (a) => a.active && (a.targetAudience === 'all' || a.targetAudience === 'buyers')
        )
      );
    };
    window.addEventListener('youmi_settings_updated', update);
    return () => window.removeEventListener('youmi_settings_updated', update);
  }, []);

  const categories = [
    { name: 'إلكترونيات', icon: Laptop, bg: 'bg-blue-50', color: 'text-blue-600' },
    { name: 'هواتف وملحقاتها', icon: Smartphone, bg: 'bg-indigo-50', color: 'text-indigo-600' },
    { name: 'أزياء وموضة', icon: Shirt, bg: 'bg-orange-50', color: 'text-orange-500' },
    { name: 'أحذية وحقائب', icon: Footprints, bg: 'bg-violet-50', color: 'text-violet-600' },
    { name: 'منزل ومطبخ', icon: Home, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { name: 'أدوات ومواد البناء', icon: Wrench, bg: 'bg-rose-50', color: 'text-rose-500' },
    { name: 'تجميل وصحة', icon: Sparkles, bg: 'bg-pink-50', color: 'text-pink-500' },
    { name: 'رياضة وترفيه', icon: Dumbbell, bg: 'bg-cyan-50', color: 'text-cyan-600' },
    { name: 'أطفال ورضع', icon: Baby, bg: 'bg-sky-50', color: 'text-sky-600' },
    { name: 'مستلزمات مكتبية', icon: Sofa, bg: 'bg-slate-100', color: 'text-slate-600' },
  ];

  const heroSlides = [
    {
      title: 'سوقك الجزائري للشراء والبيع بالجملة',
      subtitle: 'اكتشف آلاف المنتجات من متاجر موثوقة في جميع أنحاء الجزائر.',
      image:
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1800&auto=format&fit=crop&q=85',
      badge: 'من أنحاء الوطن 🇩🇿',
    },
    {
      title: 'أفضل المنتجات من متاجر موثوقة',
      subtitle: 'تصفح مجموعة واسعة من المنتجات والأسعار والعروض في مكان واحد.',
      image:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&auto=format&fit=crop&q=85',
      badge: 'متاجر موثوقة',
    },
    {
      title: 'البيع بالجملة أصبح أسهل',
      subtitle: 'تواصل مع الموردين والتجار واكتشف أسعار الجملة للأعضاء المسجلين.',
      image:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1800&auto=format&fit=crop&q=85',
      badge: 'B2B Marketplace',
    },
  ];

  const allProducts = useMemo(() => {
    const result: { product: Product; store: Store }[] = [];
    stores.forEach((store) => {
      (store.products || []).forEach((product) => result.push({ product, store }));
    });
    return result;
  }, [stores]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allProducts.filter(({ product, store }) => {
      const matchesSearch =
        !q ||
        product.title.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        store.name.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'الكل' ||
        product.category.includes(selectedCategory) ||
        store.category.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchTerm, selectedCategory]);

  const featuredProducts = useMemo(() => {
    const source = filteredProducts.length ? filteredProducts : allProducts;
    return [...source]
      .sort((a, b) => (b.product.ratings?.score || 0) - (a.product.ratings?.score || 0))
      .slice(0, 6);
  }, [filteredProducts, allProducts]);

  const featuredStores = useMemo(() => stores.slice(0, 4), [stores]);

  const addToCart = (product: Product, store: Store) => {
    const qty = product.minOrderQuantity || 1;
    setCartItems((items) => {
      const existing = items.findIndex((item) => item.product.id === product.id);
      if (existing >= 0) {
        const next = [...items];
        next[existing] = { ...next[existing], qty: next[existing].qty + qty };
        return next;
      }
      return [...items, { product, store, qty }];
    });
    setCartOpen(true);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const canViewWholesalePrices = isLoggedIn || isAdminLoggedIn || !!currentMember?.isLoggedIn;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  return (
    <div
      dir={lang === 'AR' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white text-slate-800 font-['Tajawal',sans-serif] antialiased"
    >
      {/* Announcement bar */}
      <div className="bg-[#0d1835] text-white text-[12px]">
        <div className="max-w-[1240px] mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 px-2.5 py-1 font-black shrink-0">
              <Flame className="w-3 h-3" />
              {announcements[0]?.badge || 'إعلان المنصة'}
            </span>
            <span className="truncate text-slate-200">
              {announcements[0]
                ? `${announcements[0].title}: ${announcements[0].content}`
                : 'منصة Youmi الجزائرية للتجارة والبيع بالجملة'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button onClick={() => setLang('FR')} className={lang === 'FR' ? 'font-black' : 'opacity-60'}>
              FR 🇫🇷
            </button>
            <span className="opacity-30">|</span>
            <button onClick={() => setLang('AR')} className={lang === 'AR' ? 'font-black' : 'opacity-60'}>
              عربي 🇩🇿
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-[0_2px_15px_rgba(15,23,42,0.04)]">
        <div className="max-w-[1240px] mx-auto px-4 h-[76px] flex items-center gap-5">
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button onClick={() => onNavigate('PLATFORM_HOME')} className="shrink-0">
            <YoumiLogo variant="full" size="md" />
          </button>

          <div className="hidden md:flex flex-1 max-w-[520px] relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && scrollTo('featured-products')}
              placeholder="إبحث عن منتج، متجر أو فئة..."
              className="w-full h-12 rounded-full border border-slate-200 bg-slate-50 pr-12 pl-14 text-sm outline-none focus:border-blue-400 focus:bg-white transition"
            />
            <button
              onClick={() => scrollTo('featured-products')}
              className="absolute left-1 top-1 w-10 h-10 rounded-full bg-[#1769e8] text-white flex items-center justify-center hover:bg-[#1259c7] transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="mr-auto flex items-center gap-2">
            {currentMember?.isLoggedIn ? (
              <button
                onClick={onLogoutMember}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-blue-600"
              >
                <LogOut className="w-4 h-4" /> خروج
              </button>
            ) : (
              <button
                onClick={onOpenMemberAuthModal}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-blue-600"
              >
                <User className="w-4 h-4" /> تسجيل الدخول
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative w-11 h-11 rounded-full hover:bg-slate-50 flex items-center justify-center"
              aria-label="السلة"
            >
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('CREATE_STORE')}
              className="hidden lg:flex items-center gap-2 bg-[#1769e8] hover:bg-[#1259c7] text-white font-black text-xs rounded-xl px-5 py-3 shadow-sm transition"
            >
              <StoreIcon className="w-4 h-4" />
              إنشاء متجر مجاني
            </button>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden lg:block border-t border-slate-100">
          <div className="max-w-[1240px] mx-auto h-12 px-4 flex items-center gap-8 text-[13px] font-bold">
            <button onClick={() => scrollTo('categories')} className="flex items-center gap-2 hover:text-blue-600">
              <Menu className="w-4 h-4" /> جميع الفئات
            </button>
            <button onClick={() => scrollTo('featured-products')} className="hover:text-blue-600">المنتجات</button>
            <button onClick={() => scrollTo('featured-stores')} className="hover:text-blue-600">المتاجر</button>
            <button onClick={() => scrollTo('b2b')} className="flex items-center gap-1.5 hover:text-blue-600">
              <Package className="w-4 h-4" /> البيع بالجملة
            </button>
            <button onClick={() => scrollTo('offers')} className="flex items-center gap-1.5 hover:text-blue-600">
              <Tag className="w-4 h-4" /> العروض
            </button>
            <button onClick={() => scrollTo('support')} className="flex items-center gap-1.5 hover:text-blue-600">
              <Headphones className="w-4 h-4" /> اتصل بنا
            </button>
            <button onClick={() => onNavigate('PLATFORM_HOME')} className="mr-auto w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2">
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن منتج أو متجر..."
                className="w-full h-11 bg-slate-50 rounded-xl pr-10 pl-3 text-sm outline-none"
              />
            </div>
            {[
              ['categories', 'جميع الفئات'],
              ['featured-products', 'المنتجات'],
              ['featured-stores', 'المتاجر'],
              ['b2b', 'البيع بالجملة'],
              ['offers', 'العروض'],
              ['support', 'اتصل بنا'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="w-full text-right px-3 py-2.5 rounded-lg hover:bg-slate-50 font-bold text-sm">
                {label}
              </button>
            ))}
            <button onClick={onOpenMemberAuthModal} className="w-full text-right px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm">
              تسجيل الدخول
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="relative min-h-[410px] md:min-h-[455px]">
          <img
            src={heroSlides[heroSlide].image}
            alt="Youmi Marketplace"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#062b63]/95 via-[#0756a8]/75 to-[#08213f]/35" />
          <div className="relative max-w-[1240px] mx-auto px-5 md:px-8 min-h-[410px] md:min-h-[455px] flex items-center">
            <div className="max-w-[650px] text-white py-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 backdrop-blur px-4 py-2 text-xs font-bold mb-5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                {heroSlides[heroSlide].badge}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-[48px] leading-[1.2] font-black mb-4 font-['Cairo',sans-serif]">
                {heroSlides[heroSlide].title}
              </h1>
              <p className="text-base md:text-lg text-white/85 leading-8 mb-7 max-w-xl">
                {heroSlides[heroSlide].subtitle}
              </p>

              <div className="bg-white rounded-xl p-1.5 max-w-[570px] flex shadow-2xl mb-4">
                <Search className="w-5 h-5 text-slate-400 m-3 shrink-0" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scrollTo('featured-products')}
                  placeholder="إبحث عن منتج، متجر أو فئة..."
                  className="flex-1 min-w-0 text-sm text-slate-800 outline-none"
                />
                <button onClick={() => scrollTo('featured-products')} className="bg-[#1769e8] hover:bg-[#1259c7] text-white rounded-lg px-5 font-black text-sm">
                  بحث
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => scrollTo('featured-products')}
                  className="bg-[#1769e8] hover:bg-[#1259c7] px-6 py-3.5 rounded-xl font-black text-sm shadow-lg flex items-center gap-2"
                >
                  استكشف المنتجات <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('CREATE_STORE')}
                  className="bg-white text-slate-800 hover:bg-slate-100 px-6 py-3.5 rounded-xl font-black text-sm shadow-lg flex items-center gap-2"
                >
                  افتح متجرك مجاناً <StoreIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setHeroSlide(index)}
                className={`h-2 rounded-full transition-all ${heroSlide === index ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setHeroSlide((v) => (v === 0 ? heroSlides.length - 1 : v - 1))}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/35 text-white hidden md:flex items-center justify-center backdrop-blur"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setHeroSlide((v) => (v + 1) % heroSlides.length)}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/35 text-white hidden md:flex items-center justify-center backdrop-blur"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-100 bg-white">
        <div className="max-w-[1240px] mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            [ShieldCheck, 'متاجر موثوقة', 'نبني الثقة بين المشترين والبائعين'],
            [Truck, 'توصيل سريع', 'لجميع ولايات الجزائر'],
            [Headphones, 'دعم العملاء', 'متابعة ومساعدة عند الحاجة'],
            [Lock, 'دفع آمن', 'خيارات دفع متعددة حسب المتجر'],
          ].map(([Icon, title, text]) => (
            <div key={String(title)} className="flex items-center justify-center gap-3 text-center md:text-right">
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                {React.createElement(Icon as React.ElementType, { className: 'w-5 h-5' })}
              </div>
              <div>
                <p className="font-black text-sm">{String(title)}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{String(text)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="max-w-[1240px] mx-auto px-4 py-7 scroll-mt-28">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-black font-['Cairo',sans-serif] text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> الفئات الرئيسية
          </h2>
          <button onClick={() => setSelectedCategory('الكل')} className="text-blue-600 font-bold text-xs flex items-center gap-1">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const active = selectedCategory === category.name;
            return (
              <button
                key={category.name}
                onClick={() => {
                  setSelectedCategory(category.name);
                  scrollTo('featured-products');
                }}
                className="group flex flex-col items-center gap-2"
              >
                <span className={`w-[68px] h-[68px] rounded-full ${category.bg} ${category.color} ${active ? 'ring-2 ring-blue-500 ring-offset-2' : ''} flex items-center justify-center transition group-hover:-translate-y-1`}>
                  <Icon className="w-7 h-7" />
                </span>
                <span className={`text-[11px] sm:text-xs font-bold text-center leading-5 ${active ? 'text-blue-600' : 'text-slate-700'}`}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4">
        <AdPlacement placement="homepage_top" stores={stores} onSelectStore={(s) => onSelectStore(s, 'STORE_FRONT')} />
      </div>

      {/* Products */}
      <section id="featured-products" className="max-w-[1240px] mx-auto px-4 py-8 scroll-mt-28">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-black font-['Cairo',sans-serif] text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> منتجات مميزة
          </h2>
          <button onClick={() => setSelectedCategory('الكل')} className="text-blue-600 font-bold text-xs flex items-center gap-1">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-500">
            لا توجد منتجات متاحة حاليًا.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {featuredProducts.map(({ product, store }) => {
              const discount = product.compareAtPrice && product.compareAtPrice > product.price
                ? Math.round((1 - product.price / product.compareAtPrice) * 100)
                : 0;
              return (
                <article key={`${store.id}-${product.id}`} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <div className="relative aspect-square bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => setLiked((p) => ({ ...p, [product.id]: !p[product.id] }))}
                      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                    >
                      <Heart className={`w-4 h-4 ${liked[product.id] ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                    </button>
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 z-10 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
                        -{discount}%
                      </span>
                    )}
                    {product.badge && (
                      <span className="absolute bottom-2 right-2 z-10 bg-emerald-600 text-white text-[9px] font-black px-2 py-1 rounded-full">
                        {product.badge}
                      </span>
                    )}
                    <img
                      src={product.images?.[0] || '/logo.svg'}
                      alt={product.title}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <button onClick={() => setSelectedProduct({ product, store })} className="text-right w-full">
                      <p className="text-[10px] text-slate-400 mb-1 truncate">{store.name}</p>
                      <h3 className="font-bold text-xs text-slate-800 line-clamp-2 min-h-[34px]">{product.title}</h3>
                    </button>
                    <div className="flex items-center gap-1 mt-2 text-[10px]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-black">{product.ratings?.score?.toFixed(1) || '0.0'}</span>
                      <span className="text-slate-400">({product.ratings?.count || 0})</span>
                    </div>
                    <div className="mt-2 min-h-[46px]">
                      {canViewWholesalePrices ? (
                        <>
                          <div className="font-black text-blue-700 text-sm">{formatDzd(product.price)}</div>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <div className="text-[10px] text-slate-400 line-through mt-0.5">{formatDzd(product.compareAtPrice)}</div>
                          )}
                        </>
                      ) : (
                        <button onClick={onOpenMemberAuthModal} className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> سجل الدخول لرؤية سعر الجملة
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product, store)}
                      className="w-full mt-2 h-9 rounded-lg border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-black text-[10px] transition flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> أضف للسلة
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="max-w-[1240px] mx-auto px-4">
        <AdPlacement placement="homepage_middle" stores={stores} onSelectStore={(s) => onSelectStore(s, 'STORE_FRONT')} />
      </div>

      {/* Stores */}
      <section id="featured-stores" className="max-w-[1240px] mx-auto px-4 py-8 scroll-mt-28">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-black font-['Cairo',sans-serif] text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> متاجر مميزة
          </h2>
          <button onClick={() => onOpenMemberAuthModal()} className="text-blue-600 font-bold text-xs flex items-center gap-1">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredStores.map((store) => {
            const firstProduct = store.products?.[0];
            return (
              <article key={store.id} className="rounded-xl border border-slate-200 bg-white p-3 hover:shadow-lg transition">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    <img src={store.logoUrl || firstProduct?.images?.[0] || '/logo.svg'} alt={store.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-sm truncate">{store.name}</h3>
                    <p className="text-[10px] text-slate-500 truncate mt-1">{store.category}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{firstProduct?.ratings?.score?.toFixed(1) || '4.7'}</span>
                      <span className="text-emerald-600 font-bold">• متجر موثوق</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => onSelectStore(store, 'STORE_FRONT')} className="w-full mt-3 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 py-2 text-xs font-black transition">
                  زيارة المتجر
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* B2B role strip */}
      <section id="b2b" className="max-w-[1240px] mx-auto px-4 py-4 scroll-mt-28">
        <div className="rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3">
          <div className="bg-[#1670e8] text-white p-6 flex flex-col justify-between min-h-[150px]">
            <div>
              <p className="text-[11px] font-bold opacity-80">للتجار والمشترين</p>
              <h3 className="text-xl font-black mt-1">البيع بالجملة</h3>
              <p className="text-xs opacity-85 mt-2">أسعار الجملة متاحة للأعضاء المسجلين.</p>
            </div>
            <button onClick={onOpenMemberAuthModal} className="mt-4 self-start bg-white text-blue-700 px-4 py-2 rounded-lg text-xs font-black">تسجيل الدخول</button>
          </div>
          <div className="bg-[#10a36a] text-white p-6 flex flex-col justify-between min-h-[150px]">
            <div>
              <p className="text-[11px] font-bold opacity-80">للموردين والتجار</p>
              <h3 className="text-xl font-black mt-1">افتح متجرك</h3>
              <p className="text-xs opacity-85 mt-2">ابدأ البيع على Youmi ووصل إلى عملاء جدد.</p>
            </div>
            <button onClick={() => onNavigate('CREATE_STORE')} className="mt-4 self-start bg-white text-emerald-700 px-4 py-2 rounded-lg text-xs font-black">أنشئ متجرك مجاناً</button>
          </div>
          <div className="bg-[#a92bb6] text-white p-6 flex flex-col justify-between min-h-[150px]">
            <div>
              <p className="text-[11px] font-bold opacity-80">عروض المنصة</p>
              <h3 className="text-xl font-black mt-1">خصومات تصل إلى 50%</h3>
              <p className="text-xs opacity-85 mt-2">اكتشف المنتجات والعروض المتاحة الآن.</p>
            </div>
            <button onClick={() => scrollTo('featured-products')} className="mt-4 self-start bg-white text-fuchsia-700 px-4 py-2 rounded-lg text-xs font-black">تسوق الآن</button>
          </div>
        </div>
      </section>

      <section id="offers" className="max-w-[1240px] mx-auto px-4 py-6 scroll-mt-28">
        <AdPlacement placement="sponsored_grid" stores={stores} onSelectStore={(s) => onSelectStore(s, 'STORE_FRONT')} />
      </section>

      <div className="max-w-[1240px] mx-auto px-4 py-4">
        <GoogleAd slot="homepage_footer_banner" format="horizontal" responsive={true} />
      </div>

      {/* Footer */}
      <footer id="support" className="mt-8 bg-slate-50 border-t border-slate-200 scroll-mt-28">
        <div className="max-w-[1240px] mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <YoumiLogo variant="full" size="md" />
            <p className="text-xs text-slate-500 leading-6 mt-4">
              Youmi منصة جزائرية للتجارة الإلكترونية والبيع بالجملة، تجمع المشترين والتجار والموردين في مكان واحد.
            </p>
          </div>
          <div>
            <h4 className="font-black text-sm mb-4">روابط مهمة</h4>
            <div className="space-y-2 text-xs text-slate-600">
              <button onClick={() => onNavigate('CREATE_STORE')} className="block hover:text-blue-600">إنشاء متجر مجاني</button>
              <button onClick={() => scrollTo('featured-products')} className="block hover:text-blue-600">تصفح المنتجات</button>
              <button onClick={() => scrollTo('featured-stores')} className="block hover:text-blue-600">المتاجر</button>
            </div>
          </div>
          <div>
            <h4 className="font-black text-sm mb-4">خدمة العملاء</h4>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2"><Headphones className="w-4 h-4 text-blue-600" /> مركز المساعدة</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-600" /> تواصل معنا</div>
              <div className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-blue-600" /> الأسئلة الشائعة</div>
            </div>
          </div>
          <div>
            <h4 className="font-black text-sm mb-4">عن Youmi</h4>
            <p className="text-xs text-slate-500 leading-6">منصة تسوق جزائرية تهدف إلى تسهيل الشراء والبيع وربط التجار بالموردين في جميع أنحاء الوطن 🇩🇿.</p>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <div className="max-w-[1240px] mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3 items-center justify-between text-[10px] text-slate-400">
            <span>© 2026 Youmi — جميع الحقوق محفوظة</span>
            <div className="flex items-center gap-3">
              <span>الجزائر 🇩🇿</span>
              <button onClick={onOpenAdminLoginModal} className="opacity-50 hover:opacity-100">إدارة المنصة</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Product detail */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-black text-sm">تفاصيل المنتج</h3>
              <button onClick={() => setSelectedProduct(null)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid md:grid-cols-2 gap-6">
              <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden">
                <img src={selectedProduct.product.images?.[0] || '/logo.svg'} alt={selectedProduct.product.title} className="w-full h-full object-contain p-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-blue-600 font-bold">{selectedProduct.store.name}</p>
                <h2 className="text-2xl font-black mt-2">{selectedProduct.product.title}</h2>
                <div className="flex items-center gap-2 mt-3"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /><span className="font-bold">{selectedProduct.product.ratings?.score || 0}</span><span className="text-xs text-slate-400">({selectedProduct.product.ratings?.count || 0})</span></div>
                <p className="text-sm text-slate-600 leading-7 mt-5">{selectedProduct.product.description}</p>
                <div className="mt-auto pt-6">
                  {canViewWholesalePrices ? (
                    <div className="text-2xl font-black text-blue-700">{formatDzd(selectedProduct.product.price)}</div>
                  ) : (
                    <button onClick={onOpenMemberAuthModal} className="text-sm font-bold text-blue-600 flex items-center gap-2"><Lock className="w-4 h-4" /> سجل الدخول لرؤية سعر الجملة</button>
                  )}
                  <p className="text-xs text-slate-500 mt-2">الحد الأدنى للطلب: {selectedProduct.product.minOrderQuantity || 1} {selectedProduct.product.packageUnit || 'قطعة'}</p>
                  <button
                    onClick={() => {
                      if (!canViewWholesalePrices) {
                        onOpenMemberAuthModal();
                        return;
                      }
                      addToCart(selectedProduct.product, selectedProduct.store);
                      setSelectedProduct(null);
                    }}
                    className="w-full mt-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" /> إضافة إلى السلة
                  </button>
                  <button onClick={() => onSelectStore(selectedProduct.store, 'STORE_FRONT')} className="w-full mt-2 py-3 rounded-xl border border-slate-200 font-bold text-sm">زيارة المتجر</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart */}
      {cartOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50" onClick={() => setCartOpen(false)}>
          <aside className="absolute top-0 bottom-0 right-0 w-full max-w-md bg-white shadow-2xl p-5 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-black flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-blue-600" /> السلة ({cartCount})</h3>
              <button onClick={() => setCartOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-20 text-center text-slate-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="text-sm font-bold">السلة فارغة</p></div>
              ) : cartItems.map((item, index) => (
                <div key={`${item.product.id}-${index}`} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <img src={item.product.images?.[0] || '/logo.svg'} alt={item.product.title} className="w-16 h-16 rounded-lg object-contain bg-white" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs line-clamp-2">{item.product.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{item.store.name}</p>
                    <p className="text-xs text-blue-700 font-black mt-1">{formatDzd(item.product.price)} × {item.qty}</p>
                  </div>
                  <button onClick={() => setCartItems((items) => items.filter((_, i) => i !== index))} className="text-rose-500 self-start"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4 font-black text-sm"><span>الإجمالي</span><span className="text-blue-700">{formatDzd(cartTotal)}</span></div>
              <button
                disabled={cartItems.length === 0}
                onClick={() => {
                  if (cartItems.length) {
                    onSelectStore(cartItems[0].store, 'STORE_FRONT');
                    setCartOpen(false);
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm"
              >
                متابعة الطلب <ArrowLeft className="inline w-4 h-4 mr-1" />
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
