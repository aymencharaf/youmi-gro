import React, { useState, useMemo } from 'react';
import { Store, AppView, Product } from '../types';
import {
  ShoppingBag,
  Search,
  Truck,
  ShieldCheck,
  Headphones,
  User,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Star,
  Heart,
  Store as StoreIcon,
  PlusCircle,
  ExternalLink,
  Flame,
  Menu,
  Laptop,
  Smartphone,
  Home,
  Shirt,
  Sparkles,
  Dumbbell,
  Baby,
  Car,
  BookOpen,
  Utensils,
  Wrench,
  Grid,
  X,
  CheckCircle2,
  ArrowRight,
  Package,
  Clock,
  Check,
  Building2,
  Tag,
  ShoppingCart,
  Phone,
  HelpCircle,
  CreditCard,
  Award,
  Zap,
  TrendingUp,
  Box,
  Eye,
  SlidersHorizontal,
  Gift,
  Lock,
  UserCheck,
  LogOut,
  Globe
} from 'lucide-react';
import { B2BMember } from './MemberAuthModal';

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
  onOpenInfinityFreeModal = () => {},
  onOpenAdminLoginModal = () => {},
}) => {
  const canViewWholesalePrices = isLoggedIn || isAdminLoggedIn;
  const [lang, setLang] = useState<'AR' | 'FR'>('AR');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('جميع التصنيفات');
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [activeProductTab, setActiveProductTab] = useState<'all' | 'popular' | 'new' | 'discount'>('all');
  const [selectedProduct, setSelectedProduct] = useState<{ product: Product; store: Store } | null>(null);
  const [cartItems, setCartItems] = useState<{ product: Product; store: Store; qty: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [likedProducts, setLikedProducts] = useState<Record<string, boolean>>({});

  // Hero B2B Slides
  const heroSlides = [
    {
      title: 'سوق الجملة المباشر الأول بالجزائر 🇩🇿',
      subtitle: 'ربط مباشر بين كبار المستوردين والمصانع مع تجار التجزئة. أطلب كميات الجملة بأفضل الأسعار مع الشحن لـ 69 ولاية.',
      badge: 'B2B Wholesale DZ 2026',
      ctaText: 'استكشف الموردين المعتمدين',
      bgGradient: 'from-slate-950 via-indigo-950 to-blue-950',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
    },
    {
      title: 'شحن آمن لـ 69 ولاية مع الدفع عند الاستلام',
      subtitle: 'تغطية كاملة لكافة ولايات الجزائر عبر التوصيل للمنزل أو المكتب (Yalidine Express API). لا حاجة للدفع المسبق!',
      badge: 'تغطية شحن 100% مضمونة',
      ctaText: 'تصفح منتجات الجملة',
      bgGradient: 'from-slate-950 via-blue-950 to-emerald-950',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&auto=format&fit=crop&q=80',
    },
    {
      title: 'افتح متجر جملة خاص بك مجاناً لمدة 30 يوماً',
      subtitle: 'لوحة تحكم متكاملة، ربط شركات الشحن الفوري، إدارة فواتير الجملة وتتبع المبيعات عبر بريدي موب وبدون عمولات.',
      badge: 'عرض التجار 🎁 30 يوماً مجاناً',
      ctaText: 'أنشئ متجرك الإلكتروني الآن',
      bgGradient: 'from-slate-950 via-amber-950 to-slate-900',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    },
  ];

  // B2B Wholesale Categories
  const wholesaleCategories = [
    { icon: Wrench, nameAr: 'خردوات ومواد البناء', nameFr: 'Quincaillerie & Matériaux', count: '180+ مورد', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { icon: Home, nameAr: 'أواني وأدوات منزلية', nameFr: 'Ustensiles & Arts de Table', count: '130+ مورد', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { icon: Box, nameAr: 'أثاث ومفروشات وديكور', nameFr: 'Meubles & Ameublement', count: '90+ مورد', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { icon: Car, nameAr: 'قطع غيار ولوازم السيارات', nameFr: 'Pièces Auto & Accessoires', count: '110+ مورد', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
    { icon: Utensils, nameAr: 'مواد غذائية وسوبرماركت', nameFr: 'Agroalimentaire & Épicerie', count: '210+ مورد', color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { icon: ShieldCheck, nameAr: 'مستلزمات ومواد طبية', nameFr: 'Matériel Médical & Pharma', count: '75+ مورد', color: 'bg-teal-50 text-teal-600 border-teal-200' },
    { icon: Smartphone, nameAr: 'إلكترونيات وهواتف', nameFr: 'Électronique & High-Tech', count: '160+ مورد', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { icon: Shirt, nameAr: 'ملابس وأقمشة وموضة', nameFr: 'Mode & Textiles', count: '140+ مورد', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { icon: Sparkles, nameAr: 'عطور ومستحضرات تجميل', nameFr: 'Parfums & Cosmétiques', count: '95+ مورد', color: 'bg-pink-50 text-pink-600 border-pink-200' },
    { icon: Gift, nameAr: 'ألعاب وهدايا ومكتبية', nameFr: 'Jouets, Cadeaux & Papeterie', count: '85+ مورد', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  ];

  // Aggregate all products across all stores
  const allWholesaleProducts = useMemo(() => {
    const list: { product: Product; store: Store }[] = [];
    stores.forEach((store) => {
      if (store.products && store.products.length > 0) {
        store.products.forEach((prod) => {
          list.push({ product: prod, store });
        });
      }
    });
    return list;
  }, [stores]);

  // Filtered products by search & category & active tab
  const filteredWholesaleProducts = useMemo(() => {
    return allWholesaleProducts.filter(({ product, store }) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === 'جميع التصنيفات' ||
        product.category.includes(selectedCategory) ||
        store.category.includes(selectedCategory);

      let matchesTab = true;
      if (activeProductTab === 'popular') matchesTab = (product.ratings?.score || 0) >= 4.5;
      if (activeProductTab === 'new') matchesTab = !!product.badge;
      if (activeProductTab === 'discount') matchesTab = !!product.compareAtPrice && product.compareAtPrice > product.price;

      return matchesSearch && matchesCat && matchesTab;
    });
  }, [allWholesaleProducts, searchTerm, selectedCategory, activeProductTab]);

  // Handle Add to Cart
  const handleAddToCart = (product: Product, store: Store, qtyToAdd?: number) => {
    const minQty = qtyToAdd || product.minOrderQuantity || 1;
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty += minQty;
        return updated;
      }
      return [...prev, { product, store, qty: minQty }];
    });
    setIsCartOpen(true);
  };

  // Cart Totals
  const totalCartItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalCartPriceDzd = cartItems.reduce((acc, item) => acc + item.product.price * item.qty, 0);

  const toggleLike = (id: string) => {
    setLikedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-800 font-['Tajawal',sans-serif] ${lang === 'AR' ? 'dir-rtl' : 'dir-ltr'} antialiased selection:bg-indigo-600 selection:text-white`}>

      {/* 1. TOP PLATFORM ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-xs py-2 px-4 lg:px-8 border-b border-indigo-900/50 shadow-inner">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          
          <div className="flex items-center gap-2 text-center sm:text-right">
            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-md shadow-sm flex items-center gap-1 shrink-0">
              <Building2 className="w-3 h-3" />
              <span>منصة جملة B2B</span>
            </span>
            <span className="text-slate-200 font-medium">
              🇩🇿 المنصة الجزائرية الأولى لتجارة الجملة والربط المباشر بين المصنعين والموردين وتجار التجزئة.
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">

            <button
              onClick={onOpenInfinityFreeModal}
              className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition hidden md:flex"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>InfinityFree Ready 🌐</span>
            </button>

            <div className="flex items-center gap-1.5 text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg">
              <Gift className="w-3.5 h-3.5" />
              <span>30 يوماً تجربة مجانية للمتاجر</span>
            </div>

            <div className="h-3.5 w-px bg-slate-700 hidden sm:block" />

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setLang('AR')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  lang === 'AR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                عربية
              </button>
              <button
                onClick={() => setLang('FR')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  lang === 'FR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Français
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 2. MAIN LOGO & SEARCH HEADER */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 lg:px-8 sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo & Platform Name */}
          <div
            onClick={() => onNavigate('PLATFORM_HOME')}
            className="flex items-center gap-3 cursor-pointer shrink-0 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-['Cairo'] leading-none">
                  Youmi
                </span>
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-md border border-indigo-200">
                  Wholesale B2B
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                سوق تجارة الجملة والربط المباشر بالجزائر
              </p>
            </div>
          </div>

          {/* Integrated Search Bar with Filter Dropdown */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center bg-slate-50 border border-slate-300 rounded-2xl overflow-hidden focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/15 transition shadow-xs">
            <div className="px-3.5 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن منتجات بالجملة، مصنعين، أو موردين معتمدين..."
              className="flex-1 bg-transparent py-2.5 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />

            {/* Category Selector inside search */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-100 border-r border-slate-200 text-slate-700 text-xs px-3 py-2.5 focus:outline-none font-semibold cursor-pointer hover:bg-slate-200 transition"
            >
              <option value="جميع التصنيفات">جميع التصنيفات</option>
              <option value="هواتف وإلكترونيات">هواتف وإلكترونيات</option>
              <option value="أزياء وقماش بالجملة">أزياء وقماش بالجملة</option>
              <option value="عطور ومواد التجميل">عطور ومواد التجميل</option>
              <option value="أجهزة كهرومنزلي">أجهزة كهرومنزلي</option>
              <option value="أدوات ومعدات البناء">أدوات ومعدات البناء</option>
              <option value="مواد غذائية وحلويات">مواد غذائية وحلويات</option>
            </select>

            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shrink-0">
              <span>بحث الجملة</span>
            </button>
          </div>

          {/* Action Buttons: Member Auth, Merchant Login & Cart Drawer */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Member Wholesale Auth Toggle / Badge */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-900 text-xs font-bold shadow-xs">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-[11px] font-black text-slate-900 leading-tight truncate max-w-[120px]">{currentMember?.name || 'عضو مسجل'}</span>
                  <span className="text-[9px] text-emerald-700 font-semibold">أسعار الجملة مفعلة 🔓</span>
                </div>
                <button
                  onClick={onLogoutMember}
                  title="تسجيل الخروج"
                  className="p-1 hover:bg-emerald-100 rounded-lg text-slate-400 hover:text-rose-600 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenMemberAuthModal}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs border border-indigo-200"
              >
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">دخول / تسجيل المشتري</span>
                <span className="sm:hidden">دخول</span>
              </button>
            )}

            {/* Merchant Access Button */}
            <button
              onClick={onOpenLoginModal}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm border border-slate-800"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline">دخول الموردين</span>
              <span className="lg:hidden">التُجار</span>
            </button>

            {/* Create Wholesale Store CTA */}
            <button
              onClick={() => onNavigate('CREATE_STORE')}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xl:inline">إنشاء متجر جملة</span>
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition text-slate-700 flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              {totalCartItemsCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {totalCartItemsCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* 3. QUICK WHOLESALE CATEGORIES STRIP */}
      <nav className="bg-white border-b border-slate-200 py-2.5 px-4 lg:px-8 shadow-xs">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
            <Menu className="w-4 h-4 text-indigo-600" />
            <span>تصنيفات الجملة المعتمدة:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedCategory('جميع التصنيفات')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'جميع التصنيفات'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>

            {wholesaleCategories.map((cat, idx) => {
              const isSelected = selectedCategory === cat.nameAr;
              const IconComp = cat.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat.nameAr)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                  <span>{cat.nameAr}</span>
                </button>
              );
            })}
          </div>

        </div>
      </nav>

      {/* 4. MAIN HERO SECTION (B2B WHOLESALE BANNER + SUPPLIER QUICK CARDS) */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* MAIN HERO CAROUSEL BANNER (8 cols) */}
          <div className="lg:col-span-8 bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 relative min-h-[380px] flex flex-col justify-between p-6 md:p-10 text-white">
            <img
              src={heroSlides[activeHeroSlide].image}
              alt="Hero Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${heroSlides[activeHeroSlide].bgGradient} opacity-90`} />

            {/* Banner Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-sm inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>{heroSlides[activeHeroSlide].badge}</span>
              </span>

              <span className="text-xs font-mono text-slate-300 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700">
                58 ولاية شحن ومتابعة
              </span>
            </div>

            {/* Banner Main Content */}
            <div className="relative z-10 my-auto py-6 space-y-4 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-['Cairo'] leading-tight">
                {heroSlides[activeHeroSlide].title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {heroSlides[activeHeroSlide].subtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigate('CREATE_STORE')}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 group"
                >
                  <span>{heroSlides[activeHeroSlide].ctaText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>

                <a
                  href="#suppliers"
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition border border-white/20 backdrop-blur-md"
                >
                  عرض قائمة الموردين والمصانع
                </a>
              </div>
            </div>

            {/* Slider Dots & Navigation Arrows */}
            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveHeroSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      activeHeroSlide === idx ? 'w-8 bg-amber-400' : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveHeroSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveHeroSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))}
                  className="w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* SIDE CALLOUT CARDS (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4">
            
            {/* Merchant Promo Card */}
            <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-indigo-800 shadow-md flex-1 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold rounded-lg">
                  <Gift className="w-3.5 h-3.5" />
                  <span>تجار ومستوردو الجملة</span>
                </div>
                <h3 className="text-lg font-black font-['Cairo']">هل تملك سلعة أو مصنع بالجملة؟</h3>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  أنشئ متجرك الإلكتروني للبيع بالجملة مجاناً لمدة 30 يوماً. تحكم كامل في الأسعار، فواتير الشراء، وربط تلقائي لشركة الشحن.
                </p>
              </div>

              <button
                onClick={() => onNavigate('CREATE_STORE')}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 relative z-10"
              >
                <PlusCircle className="w-4 h-4" />
                <span>أنشئ متجرك (تجربة 30 يوماً مجاناً)</span>
              </button>
            </div>

            {/* Platform Stats Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-800 font-['Cairo'] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>إحصائيات منصة يومي بالجملة (2026)</span>
              </h4>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-extrabold text-indigo-600 text-sm font-mono">+1,200</p>
                  <p className="text-[10px] text-slate-500 font-medium">مورد معتمد</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-extrabold text-emerald-600 text-sm font-mono">58 ولاية</p>
                  <p className="text-[10px] text-slate-500 font-medium">شحن وتوصيل</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-extrabold text-amber-600 text-sm font-mono">100% COD</p>
                  <p className="text-[10px] text-slate-500 font-medium">دفع عند الاستلام</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. VERIFIED SUPPLIERS & STORES SECTION */}
      <section id="suppliers" className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>المحلات والمصانع المعتمدة</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 font-['Cairo']">
              متاجر وموردو الجملة المعتمدون بالجزائر
            </h2>
          </div>

          <button
            onClick={onOpenLoginModal}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
          >
            <span>دخول لوحة تحكم التاجر ←</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Store Header & Logo */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.logoUrl}
                      alt={s.name}
                      className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0 group-hover:scale-105 transition"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition font-['Cairo']">
                        {s.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">{s.category}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>مورد معتمد</span>
                  </span>
                </div>

                {/* Description & Slogan */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {s.slogan || s.description}
                </p>

                {/* Shipping & Min Order Badges */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-1.5 text-slate-700">
                    <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate font-semibold">شحن 58 ولاية (Yalidine)</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-1.5 text-slate-700">
                    <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate font-semibold">أدنى حد: {s.settings?.minWholesaleCartTotal ? `${s.settings.minWholesaleCartTotal.toLocaleString()} دج` : '10,000 دج'}</span>
                  </div>
                </div>
              </div>

              {/* Visit Store Action Button */}
              <button
                onClick={() => onSelectStore(s, 'STORE_FRONT')}
                className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-900 hover:text-white font-bold text-xs rounded-2xl border border-indigo-200 transition flex items-center justify-center gap-2 group/btn"
              >
                <span>زيارة متجر الجملة والتسوق</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FEATURED WHOLESALE PRODUCTS GRID */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
          
          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span>عروض الجملة المباشرة</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 font-['Cairo']">
                منتجات الجملة المتاحة للطلب الآن
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {[
                { id: 'all', label: 'جميع المنتجات' },
                { id: 'popular', label: 'الأعلى تقييماً' },
                { id: 'new', label: 'جديد المصانع' },
                { id: 'discount', label: 'تخفيضات الكرتونة' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProductTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeProductTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {filteredWholesaleProducts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">لا توجد منتجات جملة مطابقة للبحث حالياً</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('جميع التصنيفات');
                  setActiveProductTab('all');
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
              >
                إعادة ضبط خيارات البحث
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredWholesaleProducts.map(({ product, store }) => {
                const isLiked = likedProducts[product.id];
                return (
                  <div
                    key={product.id}
                    className="bg-slate-50/60 border border-slate-200 hover:border-indigo-400 hover:bg-white rounded-2xl p-3.5 transition flex flex-col justify-between space-y-3 group shadow-2xs hover:shadow-md"
                  >
                    <div className="space-y-2">
                      {/* Product Image & Badges */}
                      <div className="aspect-square rounded-xl bg-white overflow-hidden relative border border-slate-200/80">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {product.badge && (
                          <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                            {product.badge}
                          </span>
                        )}

                        <button
                          onClick={() => toggleLike(product.id)}
                          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-600 flex items-center justify-center shadow-xs backdrop-blur-sm transition"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        <button
                          onClick={() => setSelectedProduct({ product, store })}
                          className="absolute bottom-2 left-2 right-2 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition backdrop-blur-xs flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة تفاصيل الجملة</span>
                        </button>
                      </div>

                      {/* Store Tag & Title */}
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                          <StoreIcon className="w-3 h-3 text-indigo-500" />
                          <span className="truncate">{store.name}</span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 font-['Cairo']">
                          {product.title}
                        </h3>

                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                          <Package className="w-3 h-3 text-amber-600" />
                          <span>أدنى طلب: <strong className="text-slate-800">{product.minOrderQuantity || 1} {product.packageUnit || 'قطع'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Add to Cart */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-black text-rose-600 block leading-none font-mono">
                            {product.price.toLocaleString()} دج
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-[10px] text-slate-400 line-through font-mono">
                              {product.compareAtPrice.toLocaleString()} دج
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          دفع عند الاستلام
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product, store)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>طلب بالجملة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* 7. WHY CHOOSE YOUMI B2B FEATURES GRID */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold text-xs rounded-full inline-block">
              منظومة تجارة الجملة المتكاملة بالجزائر
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-['Cairo']">
              لماذا يفضل التُجّار والموردون منصة يومي؟
            </h2>
            <p className="text-xs text-slate-400">
              نوفر البيئة الآمنة والتكنولوجية الأحدث لتسريع مبايعات الجملة والشحن المباشر لـ 58 ولاية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-['Cairo']">1. الدفع عند الاستلام 100% (COD)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                سداد قيمة طلبية الجملة نقداً لمندوب الشحن عند المعاينة والاستلام في عنوان التاجر دون مخاطرة الدفع المسبق.
              </p>
            </div>

            <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-['Cairo']">2. ربط شركات الشحن الفوري</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                إدخال مفتاح API لشركة الشحن المعتمدة للتاجر (Yalidine, ZR Express) وتوليد ورقات الشحن والتتبع الفوري.
              </p>
            </div>

            <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-['Cairo']">3. تجربة مجانية 30 يوماً</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                استمتع بـ 30 يوماً مجاناً لتجربة كافة أدوات المتجر والذكاء الاصطناعي، ثم التجديد بـ 3,500 دج شهرياً عبر بريدي موب.
              </p>
            </div>

            <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-['Cairo']">4. أسعار جملة ومصانع مباشرة</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تعامل مباشر بين أصحاب المحلات والموردين بالعملة الوطنية (دج) بدون وسائط أو عمولات خفية.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 8. PRODUCT QUICK VIEW MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedProduct.product.images[0]}
                  alt={selectedProduct.product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                    <StoreIcon className="w-3.5 h-3.5" />
                    <span>متجر: {selectedProduct.store.name}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 font-['Cairo']">
                    {selectedProduct.product.title}
                  </h3>
                  <p className="text-xs text-slate-500">التصنيف: {selectedProduct.product.category}</p>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>شروط كميات الجملة:</span>
                  </p>
                  <p className="text-[11px]">الحد الأدنى للطلب: <strong className="font-bold">{selectedProduct.product.minOrderQuantity || 1} {selectedProduct.product.packageUnit || 'قطعة'}</strong></p>
                </div>

                <div>
                  <div>
                    <span className="text-2xl font-black text-rose-600 font-mono">
                      {selectedProduct.product.price.toLocaleString()} دج
                    </span>
                    <span className="text-xs text-slate-400 mr-2">للقطعة / العلبة</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProduct.product.description}
                </p>

                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct.product, selectedProduct.store);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>إضافة للسلّة وطلب الجملة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. CART DRAWER MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end dir-rtl">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900 font-['Cairo']">سلّة طلبات الجملة</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">سلّة طلبات الجملة فارغة حالياً</p>
                  <p className="text-[11px] text-slate-400">تصفح المتاجر والمنتجات وأضف كميات الجملة للطلب</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.title}</h4>
                        <p className="text-[10px] text-slate-500">{item.store.name}</p>
                        <p className="text-xs font-black text-rose-600 font-mono mt-0.5">
                          {item.product.price.toLocaleString()} دج × {item.qty}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setCartItems((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>المجموع الإجمالي للطلبية:</span>
                  <span className="text-base text-rose-600 font-mono font-black">
                    {totalCartPriceDzd.toLocaleString()} دج
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>طريقة السداد: الدفع نقداً عند استلام شحنة الجملة (COD)</span>
                </div>

                <button
                  onClick={() => {
                    if (cartItems.length > 0) {
                      onSelectStore(cartItems[0].store, 'STORE_FRONT');
                      setIsCartOpen(false);
                    }
                  }}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>متابعة إتمام الطلب بالمتجر المختص</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 10. B2B FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-10 px-4 lg:px-8 border-t border-slate-800 mt-12">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  Y
                </div>
                <span className="text-white font-black text-lg font-['Cairo']">Youmi B2B Market</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                منصة تجارة الجملة والربط المباشر بين المصنعين والموردين وأصحاب المحلات بالجزائر.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white font-['Cairo']">روابط الاستضافة والدعم</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={() => onNavigate('CREATE_STORE')} className="hover:text-amber-400 transition">أنشئ متجر جملة (30 يوماً مجاناً)</button></li>
                <li><a href="#suppliers" className="hover:text-amber-400 transition">دليل الموردين والمصانع</a></li>
                <li><button onClick={onOpenLoginModal} className="hover:text-amber-400 transition">لوحة تحكم التجّار</button></li>
                <li><button onClick={onOpenInfinityFreeModal} className="text-emerald-400 font-bold hover:underline transition flex items-center gap-1">🌐 دليل الرفع على InfinityFree</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white font-['Cairo']">الشحن والدفع</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-indigo-400" /><span>شحن 58 ولاية عبر Yalidine API</span></li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>الدفع عند الاستلام 100% (COD)</span></li>
                <li className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-amber-400" /><span>سداد الاشتراكات عبر BaridiMob</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white font-['Cairo']">الدعم والمساعدة</h4>
              <p className="text-xs text-slate-400">فريق خدمة العملاء متواجد لمساعدتك في إنشاء وافتتاح متجرك بالجملة.</p>
              <p className="font-mono text-amber-400 font-bold">+213 (0) 550 12 34 56</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>جميع الحقوق محفوظة © 2026 لمنصة يومي لتجارة الجملة بالجزائر (Youmi Market DZ)</p>
            <div className="flex items-center gap-4">
              <span>🇩🇿 تغطية كاملة لـ 58 ولاية</span>
              <span>•</span>
              <span>100% دفع عند الاستلام</span>
            </div>
            <button
              type="button"
              onClick={onOpenAdminLoginModal}
              aria-label="إدارة المنصة"
              title="إدارة المنصة"
              className="text-[9px] text-slate-700/40 hover:text-slate-400 transition px-1 py-0.5"
            >
              إدارة
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
};
