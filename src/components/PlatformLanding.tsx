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
  Play,
  Download,
} from 'lucide-react';
import { B2BMember } from './MemberAuthModal';
import { ReelsSection } from './ReelsSection';
import { getPlatformAnnouncements, PlatformAnnouncement } from '../lib/adminSettings';
import { AdPlacement } from './ads/AdPlacement';
import { GoogleAd } from './ads/GoogleAd';
import { api } from '../lib/api';

interface PlatformLandingProps {
  stores: Store[];
  onNavigate?: (view: AppView) => void;
  onOpenReels?: () => void;
  onSelectStore?: (store: Store, view: 'MERCHANT_DASHBOARD' | 'STORE_FRONT') => void;
  onOpenLoginModal?: () => void;
  onOpenMerchantDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
  isLoggedIn?: boolean;
  isAdminLoggedIn?: boolean;
  currentMember?: B2BMember | null;
  onOpenMemberAuthModal?: () => void;
  onLogoutMember?: () => void;
  onOpenInfinityFreeModal?: () => void;
  onOpenAdminLoginModal?: () => void;
}

const formatDzd = (value: number) => `${value.toLocaleString('fr-DZ')} دج`;

type HomeReel = {
  id: string;
  caption?: string;
  videoUrl: string;
  likesCount?: number;
  storeId: string;
  store?: { id?: string; name?: string; logoUrl?: string; category?: string };
  product?: { title?: string; image?: string | null } | null;
};

const reelMediaUrl = (url?: string) => {
  if (!url) return '';
  return /^(https?:|data:|blob:)/i.test(url)
    ? url
    : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const PlatformLanding: React.FC<PlatformLandingProps> = ({
  stores = [],
  onNavigate = (_view: AppView) => {},
  onOpenReels = () => {},
  onSelectStore = (_store: Store, _view: 'MERCHANT_DASHBOARD' | 'STORE_FRONT') => {},
  onOpenLoginModal = () => {},
  onOpenMerchantDashboard = () => {},
  onOpenAdminDashboard = () => {},
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
  const [activeProductTab, setActiveProductTab] = useState<
    'all' | 'popular' | 'new' | 'discount'
  >('all');
  const [androidAppUrl, setAndroidAppUrl] = useState('');
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
  const [homeReels, setHomeReels] = useState<HomeReel[]>([]);

  useEffect(() => {
    let active = true;
    api.reelsFeed().then((result) => {
      if (active && result.ok) {
        setHomeReels(((result.data?.reels || []) as HomeReel[]).slice(0, 8));
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

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

  useEffect(() => {
    let isMounted = true;

    void api.getPlatformSettings().then((result) => {
      if (!isMounted) return;
      if (!result.ok) {
        console.warn('تعذر تحميل رابط تطبيق أندرويد:', result.error);
        return;
      }

      const url = result.data?.androidAppUrl;
      setAndroidAppUrl(typeof url === 'string' ? url : '');
    }).catch((error: unknown) => {
      if (isMounted) {
        console.warn('تعذر تحميل رابط تطبيق أندرويد:', error);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { name: 'إلكترونيات', icon: Laptop, bg: 'bg-[#E8F3ED]', color: 'text-[#176653]' },
    { name: 'هواتف وملحقاتها', icon: Smartphone, bg: 'bg-[#E8F3ED]', color: 'text-[#176653]' },
    { name: 'أزياء وموضة', icon: Shirt, bg: 'bg-orange-50', color: 'text-orange-500' },
    { name: 'أحذية وحقائب', icon: Footprints, bg: 'bg-teal-50', color: 'text-teal-700' },
    { name: 'منزل ومطبخ', icon: Home, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { name: 'أدوات ومواد البناء', icon: Wrench, bg: 'bg-rose-50', color: 'text-rose-500' },
    { name: 'تجميل وصحة', icon: Sparkles, bg: 'bg-pink-50', color: 'text-pink-500' },
    { name: 'رياضة وترفيه', icon: Dumbbell, bg: 'bg-cyan-50', color: 'text-cyan-600' },
    { name: 'أطفال ورضع', icon: Baby, bg: 'bg-sky-50', color: 'text-sky-600' },
    { name: 'مستلزمات مكتبية', icon: Sofa, bg: 'bg-[#E8F3ED]', color: 'text-[#176653]' },
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

  const allStoreReels = useMemo(
    () =>
      stores.flatMap((store) =>
        (store.reels || []).map((reel) => ({ reel, store }))
      ),
    [stores]
  );

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

      const matchesTab =
        activeProductTab === 'all' ||
        (activeProductTab === 'popular' &&
          (product.ratings?.score || 0) >= 4.5) ||
        (activeProductTab === 'new' && !!product.badge) ||
        (activeProductTab === 'discount' &&
          !!product.compareAtPrice &&
          product.compareAtPrice > product.price);

      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [allProducts, searchTerm, selectedCategory, activeProductTab]);

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
      className="min-h-screen bg-[#F6FAF7] text-[#202C28] font-['Tajawal',sans-serif] antialiased"
    >
      {/* Announcement bar */}
      <div className="bg-[#12332D] text-white text-[12px]">
        <div className="max-w-[1240px] mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#F4C95D] text-[#12332D] px-2.5 py-1 font-black shrink-0">
              <Flame className="w-3 h-3" />
              {announcements[0]?.badge || 'إعلان المنصة'}
            </span>
            <span className="truncate text-[#D4E8DD]">
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
      <header className="bg-white border-b border-[#D9E8DF] sticky top-0 z-40 shadow-[0_2px_15px_rgba(15,23,42,0.04)]">
        <div className="max-w-[1240px] mx-auto px-4 h-[76px] flex items-center gap-5">
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden w-10 h-10 rounded-xl bg-[#F1F7F3] flex items-center justify-center"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button onClick={() => onNavigate('PLATFORM_HOME')} className="shrink-0">
            <YoumiLogo variant="full" size="md" />
          </button>

          <div className="hidden md:flex flex-1 max-w-[520px] relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#74847B] pointer-events-none" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && scrollTo('featured-products')}
              placeholder="إبحث عن منتج، متجر أو فئة..."
              className="w-full h-12 rounded-full border border-[#D9E8DF] bg-[#F6FAF7] pr-12 pl-14 text-sm outline-none focus:border-[#27866C] focus:bg-white transition"
            />
            <button
              onClick={() => scrollTo('featured-products')}
              className="absolute left-1 top-1 w-10 h-10 rounded-full bg-[#176653] text-white flex items-center justify-center hover:bg-[#12332D] transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="mr-auto flex items-center gap-2">
            {currentMember?.isLoggedIn && currentMember.role === 'merchant' && (
              <button
                onClick={onOpenMerchantDashboard}
                className="hidden sm:flex items-center gap-2 rounded-xl bg-[#176653] px-3 py-2 text-xs font-black text-white transition hover:bg-[#12332D]"
              >
                <StoreIcon className="w-4 h-4" /> لوحة التحكم
              </button>
            )}
            {isAdminLoggedIn && (
              <button
                onClick={onOpenAdminDashboard}
                className="hidden sm:flex items-center gap-2 rounded-xl bg-[#176653] px-3 py-2 text-xs font-black text-white transition hover:bg-[#12332D]"
              >
                <StoreIcon className="w-4 h-4" /> لوحة الإدارة
              </button>
            )}
            {(currentMember?.isLoggedIn || isAdminLoggedIn || isLoggedIn) ? (
              <button
                onClick={onLogoutMember}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#52635A] hover:text-rose-600"
              >
                <LogOut className="w-4 h-4" /> تسجيل الخروج
              </button>
            ) : (
              <button
                onClick={onOpenMemberAuthModal}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#52635A] hover:text-[#176653]"
              >
                <User className="w-4 h-4" /> تسجيل الدخول
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative w-11 h-11 rounded-full hover:bg-[#E8F3ED] flex items-center justify-center"
              aria-label="السلة"
            >
              <ShoppingCart className="w-5 h-5 text-[#42394A]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('CREATE_STORE')}
              className="hidden lg:flex items-center gap-2 bg-[#176653] hover:bg-[#12332D] text-white font-black text-xs rounded-xl px-5 py-3 shadow-sm transition"
            >
              <StoreIcon className="w-4 h-4" />
              إنشاء متجر مجاني
            </button>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden lg:block border-t border-[#D9E8DF]">
          <div className="max-w-[1240px] mx-auto h-12 px-4 flex items-center gap-8 text-[13px] font-bold">
            <button onClick={() => scrollTo('categories')} className="flex items-center gap-2 hover:text-[#176653]">
              <Menu className="w-4 h-4" /> جميع الفئات
            </button>
            <button onClick={() => scrollTo('featured-products')} className="hover:text-[#176653]">المنتجات</button>
            <button onClick={() => scrollTo('featured-stores')} className="hover:text-[#176653]">المتاجر</button>
            <button onClick={() => scrollTo('b2b')} className="flex items-center gap-1.5 hover:text-[#176653]">
              <Package className="w-4 h-4" /> البيع بالجملة
            </button>
            <button onClick={() => scrollTo('offers')} className="flex items-center gap-1.5 hover:text-[#176653]">
              <Tag className="w-4 h-4" /> العروض
            </button>
            <button onClick={onOpenReels} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-700 to-teal-600 px-3 py-1.5 text-white shadow-sm hover:opacity-90">
              <Play className="w-4 h-4" /> Reels
            </button>
            <button onClick={() => scrollTo('support')} className="flex items-center gap-1.5 hover:text-[#176653]">
              <Headphones className="w-4 h-4" /> اتصل بنا
            </button>
            <button onClick={() => onNavigate('PLATFORM_HOME')} className="mr-auto w-9 h-9 rounded-full bg-[#E8F3ED] text-[#176653] flex items-center justify-center">
              <Home className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#D9E8DF] bg-white px-4 py-4 space-y-2">
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#74847B]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن منتج أو متجر..."
                className="w-full h-11 bg-[#F6FAF7] rounded-xl pr-10 pl-3 text-sm outline-none"
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
              <button key={id} onClick={() => scrollTo(id)} className="w-full text-right px-3 py-2.5 rounded-lg hover:bg-[#E8F3ED] font-bold text-sm">
                {label}
              </button>
            ))}
            <button onClick={() => { onOpenReels(); setMobileMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 px-3 py-3 text-sm font-black text-white"><Play className="h-4 w-4"/> مشاهدة YOUmi Reels</button>
            {currentMember?.isLoggedIn && currentMember.role === 'merchant' && (
              <button
                onClick={() => { onOpenMerchantDashboard(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-xl bg-[#176653] px-3 py-3 text-right text-sm font-black text-white"
              >
                <StoreIcon className="h-4 w-4" /> لوحة تحكم البائع
              </button>
            )}
            {isAdminLoggedIn && (
              <button
                onClick={() => { onOpenAdminDashboard(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-xl bg-[#176653] px-3 py-3 text-right text-sm font-black text-white"
              >
                <StoreIcon className="h-4 w-4" /> لوحة الإدارة
              </button>
            )}
            {(currentMember?.isLoggedIn || isAdminLoggedIn || isLoggedIn) ? (
              <button
                onClick={() => { onLogoutMember(); setMobileMenuOpen(false); }}
                className="w-full rounded-lg px-3 py-2.5 text-right text-sm font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="ml-2 inline h-4 w-4" /> تسجيل الخروج
              </button>
            ) : (
              <button
                onClick={() => { onOpenMemberAuthModal(); setMobileMenuOpen(false); }}
                className="w-full rounded-lg bg-[#E8F3ED] px-3 py-2.5 text-right text-sm font-bold text-[#176653]"
              >
                <User className="ml-2 inline h-4 w-4" /> تسجيل الدخول
              </button>
            )}
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#12332D]">
        <div className="relative min-h-[410px] md:min-h-[455px]">
          <img
            src={heroSlides[heroSlide].image}
            alt="Youmi Marketplace"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#12332D]/95 via-[#176653]/75 to-[#27866C]/35" />
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
                <Search className="w-5 h-5 text-[#93899A] m-3 shrink-0" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scrollTo('featured-products')}
                  placeholder="إبحث عن منتج، متجر أو فئة..."
                  className="flex-1 min-w-0 text-sm text-[#27232D] outline-none"
                />
                <button onClick={() => scrollTo('featured-products')} className="bg-[#176653] hover:bg-[#12332D] text-white rounded-lg px-5 font-black text-sm">
                  بحث
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => scrollTo('featured-products')}
                  className="bg-[#176653] hover:bg-[#12332D] px-6 py-3.5 rounded-xl font-black text-sm shadow-lg flex items-center gap-2"
                >
                  استكشف المنتجات <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('CREATE_STORE')}
                  className="bg-white text-[#202C28] hover:bg-[#E8F3ED] px-6 py-3.5 rounded-xl font-black text-sm shadow-lg flex items-center gap-2"
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
      <section className="border-b border-[#D9E8DF] bg-white">
        <div className="max-w-[1240px] mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            [ShieldCheck, 'متاجر موثوقة', 'نبني الثقة بين المشترين والبائعين'],
            [Truck, 'توصيل سريع', 'لجميع ولايات الجزائر'],
            [Headphones, 'دعم العملاء', 'متابعة ومساعدة عند الحاجة'],
            [Lock, 'دفع آمن', 'خيارات دفع متعددة حسب المتجر'],
          ].map(([Icon, title, text]) => (
            <div key={String(title)} className="flex items-center justify-center gap-3 text-center md:text-right">
              <div className="w-11 h-11 rounded-full bg-[#E8F3ED] text-[#176653] flex items-center justify-center shrink-0">
                {React.createElement(Icon as React.ElementType, { className: 'w-5 h-5' })}
              </div>
              <div>
                <p className="font-black text-sm">{String(title)}</p>
                <p className="text-[11px] text-[#746A7B] mt-0.5">{String(text)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* YOUmi Reels preview on the platform homepage */}
      <section className="mx-auto max-w-[1240px] px-4 py-8 md:py-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#27866C]">YOUmi Social Commerce</p>
            <h2 className="flex items-center gap-2 text-xl font-black text-[#27232D] md:text-2xl">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md"><Play className="h-5 w-5 fill-current" /></span>
              اكتشف المنتجات عبر Reels
            </h2>
            <p className="mt-1 text-xs text-[#746A7B] md:text-sm">شاهد فيديوهات الموردين ومنتجاتهم مباشرة من الصفحة الرئيسية.</p>
          </div>
          <button onClick={onOpenReels} className="shrink-0 rounded-full bg-gradient-to-r from-emerald-700 to-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
            مشاهدة الكل <ArrowLeft className="mr-1 inline h-4 w-4" />
          </button>
        </div>
        {homeReels.length > 0 ? (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
            {homeReels.map((reel) => (
              <button key={reel.id} onClick={onOpenReels} className="group relative h-[270px] w-[165px] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#12332D] text-right shadow-md ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl sm:h-[320px] sm:w-[195px] md:h-[350px] md:w-[215px]">
                <video src={reelMediaUrl(reel.videoUrl)} muted loop autoPlay playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/15" />
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur"><Play className="h-3 w-3 fill-current" /> REELS</span>
                <span className="absolute bottom-3 right-3 left-3">
                  <span className="mb-2 block truncate text-xs font-black text-white">{reel.store?.name || 'مورد على YOUmi'}</span>
                  <span className="block line-clamp-2 text-[11px] leading-5 text-white/85">{reel.caption || reel.product?.title || 'اكتشف منتجات هذا المورد'}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-300"><Heart className="h-3 w-3" /> {reel.likesCount || 0} إعجاب</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <button onClick={onOpenReels} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-dashed border-[#D9E8DF] bg-white p-5 text-right transition hover:border-[#27866C] hover:bg-[#F1F7F3] md:p-7">
            <span className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white"><Play className="h-6 w-6 fill-current" /></span><span><span className="block font-black text-[#176653]">مساحة فيديوهات YOUmi Reels</span><span className="mt-1 block text-xs leading-5 text-[#68776F]">ستظهر هنا فيديوهات الموردين المنشورة. افتح Reels لمشاهدتها أو أضف فيديو من لوحة البائع.</span></span></span>
            <ArrowLeft className="h-5 w-5 shrink-0 text-[#176653]" />
          </button>
        )}
      </section>

      <ReelsSection
        id="store-reels"
        title="ريلز المتاجر"
        items={allStoreReels}
        onSelectStore={(store) => onSelectStore(store, 'STORE_FRONT')}
        onSelectProduct={(product, store) =>
          setSelectedProduct({ product, store })
        }
      />

      {/* Categories */}
      <section id="categories" className="max-w-[1240px] mx-auto px-4 py-7 scroll-mt-28">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-black font-['Cairo',sans-serif] text-[#202C28] flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> الفئات الرئيسية
          </h2>
          <button onClick={() => setSelectedCategory('الكل')} className="text-[#176653] font-bold text-xs flex items-center gap-1">
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
                <span className={`w-[68px] h-[68px] rounded-full ${category.bg} ${category.color} ${active ? 'ring-2 ring-[#27866C] ring-offset-2' : ''} flex items-center justify-center transition group-hover:-translate-y-1`}>
                  <Icon className="w-7 h-7" />
                </span>
                <span className={`text-[11px] sm:text-xs font-bold text-center leading-5 ${active ? 'text-[#176653]' : 'text-[#52635A]'}`}>
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
          <h2 className="text-xl md:text-2xl font-black font-['Cairo',sans-serif] text-[#27232D] flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> منتجات مميزة
          </h2>
          <button onClick={() => setSelectedCategory('الكل')} className="text-[#176653] font-bold text-xs flex items-center gap-1">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto">
          {[
            ['all', 'الكل'],
            ['popular', 'الأعلى تقييماً'],
            ['new', 'جديد'],
            ['discount', 'التخفيضات'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() =>
                setActiveProductTab(
                  id as 'all' | 'popular' | 'new' | 'discount'
                )
              }
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                activeProductTab === id
                  ? 'bg-[#176653] text-white'
                  : 'bg-white text-[#52635A] hover:bg-[#E8F3ED]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D9E8DF] py-16 text-center text-[#68776F]">
            لا توجد منتجات متاحة حاليًا.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {featuredProducts.map(({ product, store }) => {
              const discount = product.compareAtPrice && product.compareAtPrice > product.price
                ? Math.round((1 - product.price / product.compareAtPrice) * 100)
                : 0;
              return (
                <article key={`${store.id}-${product.id}`} className="group bg-white rounded-xl border border-[#D9E8DF] overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <div className="relative aspect-square bg-[#F1F7F3] overflow-hidden">
                    <button
                      onClick={() => setLiked((p) => ({ ...p, [product.id]: !p[product.id] }))}
                      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                    >
                      <Heart className={`w-4 h-4 ${liked[product.id] ? 'fill-rose-500 text-rose-500' : 'text-[#746A7B]'}`} />
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
                      <p className="text-[10px] text-[#93899A] mb-1 truncate">{store.name}</p>
                      <h3 className="font-bold text-xs text-[#27232D] line-clamp-2 min-h-[34px]">{product.title}</h3>
                    </button>
                    <div className="flex items-center gap-1 mt-2 text-[10px]">
                      <Star className="w-3.5 h-3.5 fill-[#F2B544] text-[#F2B544]" />
                      <span className="font-black">{product.ratings?.score?.toFixed(1) || '0.0'}</span>
                      <span className="text-[#93899A]">({product.ratings?.count || 0})</span>
                    </div>
                    <div className="mt-2 min-h-[46px]">
                      {canViewWholesalePrices ? (
                        <>
                          <div className="font-black text-[#176653] text-sm">{formatDzd(product.price)}</div>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <div className="text-[10px] text-[#93899A] line-through mt-0.5">{formatDzd(product.compareAtPrice)}</div>
                          )}
                        </>
                      ) : (
                        <button onClick={onOpenMemberAuthModal} className="text-[10px] text-[#176653] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> سجل الدخول لرؤية سعر الجملة
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product, store)}
                      className="w-full mt-2 h-9 rounded-lg border border-[#D9E8DF] bg-[#E8F3ED] text-[#176653] hover:bg-[#12332D] hover:text-white font-black text-[10px] transition flex items-center justify-center gap-1.5"
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
          <h2 className="text-xl md:text-2xl font-black font-['Cairo',sans-serif] text-[#27232D] flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> متاجر مميزة
          </h2>
          <button onClick={() => onOpenMemberAuthModal()} className="text-[#176653] font-bold text-xs flex items-center gap-1">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredStores.map((store) => {
            const firstProduct = store.products?.[0];
            return (
              <article key={store.id} className="rounded-xl border border-[#D9E8DF] bg-white p-3 hover:shadow-lg transition">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-[#F1F7F3] border border-[#D9E8DF] overflow-hidden shrink-0 flex items-center justify-center">
                    <img src={store.logoUrl || firstProduct?.images?.[0] || '/logo.svg'} alt={store.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-sm truncate">{store.name}</h3>
                    <p className="text-[10px] text-[#746A7B] truncate mt-1">{store.category}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px]">
                      <Star className="w-3.5 h-3.5 fill-[#F2B544] text-[#F2B544]" />
                      <span className="font-bold">{firstProduct?.ratings?.score?.toFixed(1) || '4.7'}</span>
                      <span className="text-emerald-600 font-bold">• متجر موثوق</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => onSelectStore(store, 'STORE_FRONT')} className="w-full mt-3 rounded-lg bg-[#E8F3ED] hover:bg-[#12332D] hover:text-white text-[#176653] py-2 text-xs font-black transition">
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
          <div className="bg-[#12332D] text-white p-6 flex flex-col justify-between min-h-[150px]">
            <div>
              <p className="text-[11px] font-bold opacity-80">للتجار والمشترين</p>
              <h3 className="text-xl font-black mt-1">البيع بالجملة</h3>
              <p className="text-xs opacity-85 mt-2">أسعار الجملة متاحة للأعضاء المسجلين.</p>
            </div>
            <button onClick={onOpenMemberAuthModal} className="mt-4 self-start bg-white text-[#12332D] px-4 py-2 rounded-lg text-xs font-black">تسجيل الدخول</button>
          </div>
          <div className="bg-[#176653] text-white p-6 flex flex-col justify-between min-h-[150px]">
            <div>
              <p className="text-[11px] font-bold opacity-80">للموردين والتجار</p>
              <h3 className="text-xl font-black mt-1">افتح متجرك</h3>
              <p className="text-xs opacity-85 mt-2">ابدأ البيع على Youmi ووصل إلى عملاء جدد.</p>
            </div>
            <button onClick={() => onNavigate('CREATE_STORE')} className="mt-4 self-start bg-white text-emerald-700 px-4 py-2 rounded-lg text-xs font-black">أنشئ متجرك مجاناً</button>
          </div>
          <div className="bg-[#27866C] text-white p-6 flex flex-col justify-between min-h-[150px]">
            <div>
              <p className="text-[11px] font-bold opacity-80">عروض المنصة</p>
              <h3 className="text-xl font-black mt-1">خصومات تصل إلى 50%</h3>
              <p className="text-xs opacity-85 mt-2">اكتشف المنتجات والعروض المتاحة الآن.</p>
            </div>
            <button onClick={() => scrollTo('featured-products')} className="mt-4 self-start bg-white text-emerald-800 px-4 py-2 rounded-lg text-xs font-black">تسوق الآن</button>
          </div>
        </div>
      </section>

      <section id="offers" className="max-w-[1240px] mx-auto px-4 py-6 scroll-mt-28">
        <AdPlacement placement="sponsored_grid" stores={stores} onSelectStore={(s) => onSelectStore(s, 'STORE_FRONT')} />
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-4">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 p-5 text-white sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="text-xs font-black text-amber-300">YOUmi للأندرويد</p>
            <h2 className="mt-2 text-lg font-black sm:text-xl">
              تسوّق وأدر متجرك من تطبيق YOUmi
            </h2>
            <p className="mt-1 text-xs leading-6 text-emerald-100">
              وصول أسرع إلى المتاجر والمنتجات والطلبات أينما كنت.
            </p>
          </div>
          <a
            href={androidAppUrl || '/YOUmi.apk'}
            download="YOUmi.apk"
            type="application/vnd.android.package-archive"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-xs font-blacktext-emerald-950 transition hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="تحميل تطبيق YOUmi للأندرويد"
          >
            <Download className="h-5 w-5" />
            تحميل تطبيق أندرويد
          </a>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 py-4">
        <GoogleAd slot="homepage_footer_banner" format="horizontal" responsive={true} />
      </div>

      {/* Footer */}
      <footer id="support" className="mt-8 bg-[#F1F7F3] border-t border-[#D9E8DF] scroll-mt-28">
        <div className="max-w-[1240px] mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <YoumiLogo variant="full" size="md" />
            <p className="text-xs text-[#746A7B] leading-6 mt-4">
              Youmi منصة جزائرية للتجارة الإلكترونية والبيع بالجملة، تجمع المشترين والتجار والموردين في مكان واحد.
            </p>
          </div>
          <div>
            <h4 className="font-black text-sm mb-4">روابط مهمة</h4>
            <div className="space-y-2 text-xs text-[#5D5365]">
              <button onClick={() => onNavigate('CREATE_STORE')} className="block hover:text-[#176653]">إنشاء متجر مجاني</button>
              <button onClick={() => scrollTo('featured-products')} className="block hover:text-[#176653]">تصفح المنتجات</button>
              <button onClick={() => scrollTo('featured-stores')} className="block hover:text-[#176653]">المتاجر</button>
            </div>
          </div>
          <div>
            <h4 className="font-black text-sm mb-4">خدمة العملاء</h4>
            <div className="space-y-3 text-xs text-[#5D5365]">
              <div className="flex items-center gap-2"><Headphones className="w-4 h-4 text-[#176653]" /> مركز المساعدة</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#176653]" /> تواصل معنا</div>
              <div className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-[#176653]" /> الأسئلة الشائعة</div>
            </div>
          </div>
          <div>
            <h4 className="font-black text-sm mb-4">عن Youmi</h4>
            <p className="text-xs text-[#746A7B] leading-6">منصة تسوق جزائرية تهدف إلى تسهيل الشراء والبيع وربط التجار بالموردين في جميع أنحاء الوطن 🇩🇿.</p>
          </div>
        </div>
        <div className="border-t border-[#D9E8DF]">
          <div className="max-w-[1240px] mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3 items-center justify-between text-[10px] text-[#93899A]">
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
        <div className="fixed inset-0 z-[70] bg-[#12332D]/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-black text-sm">تفاصيل المنتج</h3>
              <button onClick={() => setSelectedProduct(null)} className="w-9 h-9 rounded-full bg-[#E8F3ED] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid md:grid-cols-2 gap-6">
              <div className="aspect-square bg-[#F1F7F3] rounded-xl overflow-hidden">
                <img src={selectedProduct.product.images?.[0] || '/logo.svg'} alt={selectedProduct.product.title} className="w-full h-full object-contain p-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-[#176653] font-bold">{selectedProduct.store.name}</p>
                <h2 className="text-2xl font-black mt-2">{selectedProduct.product.title}</h2>
                <div className="flex items-center gap-2 mt-3"><Star className="w-4 h-4 fill-[#F2B544] text-[#F2B544]" /><span className="font-bold">{selectedProduct.product.ratings?.score || 0}</span><span className="text-xs text-[#93899A]">({selectedProduct.product.ratings?.count || 0})</span></div>
                <p className="text-sm text-[#5D5365] leading-7 mt-5">{selectedProduct.product.description}</p>
                <div className="mt-auto pt-6">
                  {canViewWholesalePrices ? (
                    <div className="text-2xl font-black text-[#176653]">{formatDzd(selectedProduct.product.price)}</div>
                  ) : (
                    <button onClick={onOpenMemberAuthModal} className="text-sm font-bold text-[#176653] flex items-center gap-2"><Lock className="w-4 h-4" /> سجل الدخول لرؤية سعر الجملة</button>
                  )}
                  <p className="text-xs text-[#746A7B] mt-2">الحد الأدنى للطلب: {selectedProduct.product.minOrderQuantity || 1} {selectedProduct.product.packageUnit || 'قطعة'}</p>
                  <button
                    onClick={() => {
                      if (!canViewWholesalePrices) {
                        onOpenMemberAuthModal();
                        return;
                      }
                      addToCart(selectedProduct.product, selectedProduct.store);
                      setSelectedProduct(null);
                    }}
                    className="w-full mt-5 py-3.5 rounded-xl bg-[#176653] hover:bg-[#12332D] text-white font-black text-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" /> إضافة إلى السلة
                  </button>
                  <button onClick={() => onSelectStore(selectedProduct.store, 'STORE_FRONT')} className="w-full mt-2 py-3 rounded-xl border border-[#D9E8DF] font-bold text-sm">زيارة المتجر</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart */}
      {cartOpen && (
        <div className="fixed inset-0 z-[80] bg-[#12332D]/50" onClick={() => setCartOpen(false)}>
          <aside className="absolute top-0 bottom-0 right-0 w-full max-w-md bg-white shadow-2xl p-5 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-black flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-[#176653]" /> السلة ({cartCount})</h3>
              <button onClick={() => setCartOpen(false)} className="w-9 h-9 rounded-full bg-[#E8F3ED] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-20 text-center text-[#93899A]"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="text-sm font-bold">السلة فارغة</p></div>
              ) : cartItems.map((item, index) => (
                <div key={`${item.product.id}-${index}`} className="flex gap-3 p-3 rounded-xl bg-[#F1F7F3] border border-[#D9E8DF]">
                  <img src={item.product.images?.[0] || '/logo.svg'} alt={item.product.title} className="w-16 h-16 rounded-lg object-contain bg-white" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs line-clamp-2">{item.product.title}</p>
                    <p className="text-[10px] text-[#93899A] mt-1">{item.store.name}</p>
                    <p className="text-xs text-[#176653] font-black mt-1">{formatDzd(item.product.price)} × {item.qty}</p>
                  </div>
                  <button onClick={() => setCartItems((items) => items.filter((_, i) => i !== index))} className="text-rose-500 self-start"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4 font-black text-sm"><span>الإجمالي</span><span className="text-[#176653]">{formatDzd(cartTotal)}</span></div>
              <button
                disabled={cartItems.length === 0}
                onClick={() => {
                  if (cartItems.length) {
                    onSelectStore(cartItems[0].store, 'STORE_FRONT');
                    setCartOpen(false);
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-[#176653] disabled:bg-[#D9E8DF] disabled:text-[#74847B] text-white font-black text-sm"
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
