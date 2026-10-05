import React, { useMemo, useState } from 'react';
import { Store, AppView, Product } from '../types';
import {
  ShoppingBag,
  Search,
  Truck,
  ShieldCheck,
  User,
  ChevronRight,
  ChevronLeft,
  Star,
  Heart,
  Store as StoreIcon,
  PlusCircle,
  Flame,
  Menu,
  Smartphone,
  Home,
  Shirt,
  Sparkles,
  Car,
  Utensils,
  Wrench,
  X,
  CheckCircle2,
  ArrowRight,
  Package,
  Building2,
  ShoppingCart,
  CreditCard,
  Award,
  Zap,
  Eye,
  Gift,
  Lock,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { B2BMember } from './MemberAuthModal';

interface PlatformLandingProps {
  stores: Store[];
  onNavigate?: (view: AppView) => void;
  onSelectStore?: (
    store: Store,
    view: 'MERCHANT_DASHBOARD' | 'STORE_FRONT'
  ) => void;
  onOpenLoginModal?: () => void;
  isLoggedIn?: boolean;
  isAdminLoggedIn?: boolean;
  currentMember?: B2BMember | null;
  onOpenMemberAuthModal?: () => void;
  onLogoutMember?: () => void;
  onOpenInfinityFreeModal?: () => void;
  onOpenAdminLoginModal?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenMerchantDashboard?: () => void;
}

export const PlatformLanding: React.FC<PlatformLandingProps> = ({
  stores = [],
  onNavigate = (_view: AppView) => {},
  onSelectStore = (_store: Store, _view) => {},
  onOpenLoginModal = () => {},
  isLoggedIn = false,
  isAdminLoggedIn = false,
  currentMember = null,
  onOpenMemberAuthModal = () => {},
  onLogoutMember = () => {},
  onOpenInfinityFreeModal: _onOpenInfinityFreeModal = () => {},
  onOpenAdminLoginModal = () => {},
  onOpenAdminDashboard = () => {},
  onOpenMerchantDashboard = () => {},
}) => {
  const [lang, setLang] = useState<'AR' | 'FR'>('AR');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<string>('جميع التصنيفات');

  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  const [activeProductTab, setActiveProductTab] = useState<
    'all' | 'popular' | 'new' | 'discount'
  >('all');

  const [selectedProduct, setSelectedProduct] = useState<{
    product: Product;
    store: Store;
  } | null>(null);

  const [cartItems, setCartItems] = useState<
    { product: Product; store: Store; qty: number }[]
  >([]);

  const [isCartOpen, setIsCartOpen] = useState(false);

  const [likedProducts, setLikedProducts] = useState<Record<string, boolean>>(
    {}
  );

  const heroSlides = [
    {
      title: 'اكتشف أسعار الجملة من الموردين مباشرة',
      subtitle:
        'منتجات بالجملة من متاجر وموردين داخل الجزائر. قارن المنتجات، اختر الكمية، وتواصل مع المورد المناسب.',
      badge: 'YOUmi B2B',
      image:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&auto=format&fit=crop&q=85',
    },
    {
      title: 'توصيل إلى 69 ولاية',
      subtitle:
        'اطلب من متاجر الجملة عبر YOUmi واستفد من حلول الشحن والتوصيل المتاحة حسب المتجر.',
      badge: 'شحن داخل الجزائر 🇩🇿',
      image:
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1400&auto=format&fit=crop&q=85',
    },
    {
      title: 'هل أنت مورد أو تاجر جملة؟',
      subtitle:
        'أنشئ متجرك الخاص واعرض منتجاتك أمام تجار التجزئة والمشترين بالجملة.',
      badge: '30 يوماً مجاناً',
      image:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=85',
    },
  ];

  const wholesaleCategories = [
    {
      icon: Wrench,
      nameAr: 'خردوات ومواد البناء',
      nameFr: 'Quincaillerie',
      keywords: ['خردوات', 'بناء', 'معدات'],
    },
    {
      icon: Home,
      nameAr: 'أواني وأدوات منزلية',
      nameFr: 'Maison',
      keywords: ['أواني', 'أدوات منزلية', 'منزلية'],
    },
    {
      icon: Building2,
      nameAr: 'أثاث وديكور',
      nameFr: 'Meubles & Déco',
      keywords: ['أثاث', 'مفروشات', 'ديكور'],
    },
    {
      icon: Car,
      nameAr: 'قطع غيار السيارات',
      nameFr: 'Pièces Auto',
      keywords: ['سيارات', 'قطع غيار', 'إكسسوارات'],
    },
    {
      icon: Utensils,
      nameAr: 'مواد غذائية',
      nameFr: 'Agroalimentaire',
      keywords: ['غذائية', 'سوبرماركت', 'حلويات', 'أغذية'],
    },
    {
      icon: ShieldCheck,
      nameAr: 'مواد طبية',
      nameFr: 'Médical',
      keywords: ['طبية', 'صيدلية', 'pharma'],
    },
    {
      icon: Smartphone,
      nameAr: 'إلكترونيات وهواتف',
      nameFr: 'Électronique',
      keywords: ['هواتف', 'إلكترونيات', 'سماعات', 'شواحن'],
    },
    {
      icon: Shirt,
      nameAr: 'ملابس وأقمشة',
      nameFr: 'Mode & Textiles',
      keywords: ['ملابس', 'أقمشة', 'عبايات', 'فساتين', 'موضة'],
    },
    {
      icon: Sparkles,
      nameAr: 'عطور وتجميل',
      nameFr: 'Parfums & Cosmétiques',
      keywords: ['عطور', 'تجميل', 'بخور', 'عود', 'cosm'],
    },
    {
      icon: Gift,
      nameAr: 'ألعاب وهدايا',
      nameFr: 'Jouets & Cadeaux',
      keywords: ['ألعاب', 'هدايا', 'مكتبية', 'papeterie'],
    },
  ];

  const allWholesaleProducts = useMemo(() => {
    const list: { product: Product; store: Store }[] = [];

    stores.forEach((store) => {
      if (store.products?.length) {
        store.products.forEach((product) => {
          list.push({ product, store });
        });
      }
    });

    return list;
  }, [stores]);

  const filteredWholesaleProducts = useMemo(() => {
    return allWholesaleProducts.filter(({ product, store }) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        product.title.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        store.name.toLowerCase().includes(search);

      const selectedCat = wholesaleCategories.find(
        (cat) => cat.nameAr === selectedCategory
      );

      const categoryText =
        `${product.category} ${store.category} ${product.title}`.toLowerCase();

      const matchesCategory =
        selectedCategory === 'جميع التصنيفات' ||
        (selectedCat
          ? selectedCat.keywords.some((keyword) =>
              categoryText.includes(keyword.toLowerCase())
            )
          : categoryText.includes(selectedCategory.toLowerCase()));

      let matchesTab = true;

      if (activeProductTab === 'popular') {
        matchesTab = (product.ratings?.score || 0) >= 4.5;
      }

      if (activeProductTab === 'new') {
        matchesTab = !!product.badge;
      }

      if (activeProductTab === 'discount') {
        matchesTab =
          !!product.compareAtPrice &&
          product.compareAtPrice > product.price;
      }

      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [
    allWholesaleProducts,
    searchTerm,
    selectedCategory,
    activeProductTab,
  ]);

  const totalProducts = allWholesaleProducts.length;

  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const totalCartPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  );

  const scrollToProducts = () => {
    document
      .getElementById('wholesale-products')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  };

  const handleAddToCart = (
    product: Product,
    store: Store,
    qtyToAdd?: number
  ) => {
    if (!isLoggedIn) {
      onOpenMemberAuthModal();
      return;
    }

    const quantity = qtyToAdd || product.minOrderQuantity || 1;

    setCartItems((previous) => {
      const existing = previous.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.store.id === store.id
      );

      if (existing >= 0) {
        const updated = [...previous];

        updated[existing] = {
          ...updated[existing],
          qty: updated[existing].qty + quantity,
        };

        return updated;
      }

      return [
        ...previous,
        {
          product,
          store,
          qty: quantity,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const toggleLike = (id: string) => {
    setLikedProducts((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('جميع التصنيفات');
    setActiveProductTab('all');
  };

  const handleMobileAccount = () => {
    if (isAdminLoggedIn) {
      onOpenAdminDashboard();
      return;
    }

    if (currentMember?.role === 'merchant') {
      onOpenMerchantDashboard();
      return;
    }

    if (isLoggedIn) {
      onLogoutMember();
      return;
    }

    onOpenMemberAuthModal();
  };

  return (
    <div
      className={`min-h-screen pb-16 md:pb-0 bg-[#f5f5f5] text-slate-800 ${
        lang === 'AR' ? 'dir-rtl' : 'dir-ltr'
      }`}
    >
      {/* TOP BAR */}
      <div className="bg-[#111827] text-white text-[10px] sm:text-[11px]">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8 py-1.5 sm:py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-black text-amber-300 shrink-0">
              YOUmi B2B
            </span>

            <span className="hidden sm:inline text-slate-300 truncate">
              سوق الجملة الجزائري
            </span>

            <span className="hidden md:inline text-slate-500">
              |
            </span>

            <span className="hidden md:inline text-slate-300">
              أسعار الجملة للمسجلين فقط
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <span className="hidden lg:inline text-slate-300">
              🚚 شحن إلى 69 ولاية
            </span>

            <button
              onClick={() => setLang('AR')}
              className={`px-1.5 sm:px-2 py-1 rounded ${
                lang === 'AR'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400'
              }`}
            >
              العربية
            </button>

            <button
              onClick={() => setLang('FR')}
              className={`px-1.5 sm:px-2 py-1 rounded ${
                lang === 'FR'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400'
              }`}
            >
              Français
            </button>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8 py-2.5 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {/* LOGO */}
            <button
              onClick={() => onNavigate('PLATFORM_HOME')}
              className="flex items-center gap-2 shrink-0"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-700 to-blue-500 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md">
                Y
              </div>

              <div className="hidden lg:block text-right">
                <div className="text-xl font-black text-slate-900 leading-none">
                  YOUmi
                </div>

                <div className="text-[9px] text-indigo-600 font-bold mt-1">
                  WHOLESALE MARKET
                </div>
              </div>
            </button>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:block flex-1 max-w-3xl">
              <div className="h-12 flex items-stretch border-2 border-indigo-600 rounded-xl overflow-hidden bg-white">
                <div className="flex items-center px-3 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>

                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      scrollToProducts();
                    }
                  }}
                  placeholder="ابحث عن منتج، مورد أو متجر..."
                  className="flex-1 min-w-0 outline-none text-sm"
                />

                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value)
                  }
                  className="hidden lg:block border-r border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none"
                >
                  <option value="جميع التصنيفات">
                    جميع التصنيفات
                  </option>

                  {wholesaleCategories.map((cat) => (
                    <option key={cat.nameAr} value={cat.nameAr}>
                      {cat.nameAr}
                    </option>
                  ))}
                </select>

                <button
                  onClick={scrollToProducts}
                  className="px-5 lg:px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
                >
                  بحث
                </button>
              </div>
            </div>

            {/* ACCOUNT ACTIONS */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* MOBILE ACCOUNT */}
              <button
                onClick={handleMobileAccount}
                className="sm:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center"
                title={
                  isAdminLoggedIn
                    ? 'لوحة الإدارة'
                    : currentMember?.role === 'merchant'
                    ? 'لوحة البائع'
                    : isLoggedIn
                    ? 'تسجيل الخروج'
                    : 'تسجيل الدخول'
                }
              >
                {isAdminLoggedIn ? (
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                ) : currentMember?.role === 'merchant' ? (
                  <StoreIcon className="w-4 h-4 text-indigo-600" />
                ) : isLoggedIn ? (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <User className="w-4 h-4 text-slate-600" />
                )}
              </button>

              {isAdminLoggedIn ? (
                <>
                  <button
                    onClick={onOpenAdminDashboard}
                    className="hidden md:flex items-center gap-2 px-3 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Admin
                  </button>

                  <button
                    onClick={onLogoutMember}
                    className="hidden sm:block p-2.5 border border-slate-200 rounded-lg hover:bg-rose-50"
                    title="تسجيل خروج Admin"
                  >
                    <LogOut className="w-4 h-4 text-slate-500" />
                  </button>
                </>
              ) : (
                <>
                  {isLoggedIn ? (
                    <div className="hidden lg:flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 rounded-lg">
                      <UserCheck className="w-4 h-4 text-emerald-600" />

                      <div className="text-right">
                        <div className="text-[11px] font-bold">
                          {currentMember?.name || 'عضو'}
                        </div>

                        <div className="text-[9px] text-emerald-700">
                          أسعار الجملة مفعلة
                        </div>
                      </div>

                      <button
                        onClick={onLogoutMember}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onOpenMemberAuthModal}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black"
                    >
                      <Lock className="w-4 h-4" />
                      أسعار الجملة
                    </button>
                  )}

                  {currentMember?.role === 'merchant' ? (
                    <button
                      onClick={onOpenMerchantDashboard}
                      className="hidden lg:flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                    >
                      <UserCheck className="w-4 h-4" />
                      لوحة البائع
                    </button>
                  ) : (
                    <button
                      onClick={onOpenLoginModal}
                      className="hidden lg:flex items-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                    >
                      <User className="w-4 h-4 text-amber-400" />
                      دخول الموردين
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => onNavigate('CREATE_STORE')}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                <PlusCircle className="w-4 h-4" />
                إنشاء متجر
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 sm:p-2.5 border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50"
                aria-label="السلة"
              >
                <ShoppingBag className="w-5 h-5 text-indigo-600" />

                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-black">
                    {totalCartItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* MOBILE SEARCH */}
          <div className="mt-2.5 md:hidden">
            <div className="flex h-11 border-2 border-indigo-500 rounded-lg overflow-hidden bg-white">
              <div className="flex items-center px-2.5 text-slate-400">
                <Search className="w-4 h-4" />
              </div>

              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    scrollToProducts();
                  }
                }}
                placeholder="ابحث عن منتج أو مورد..."
                className="flex-1 min-w-0 px-1 text-xs outline-none"
              />

              <button
                onClick={scrollToProducts}
                className="px-4 bg-indigo-600 text-white"
                aria-label="بحث"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CATEGORY BAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar snap-x">
            <button
              onClick={() =>
                setSelectedCategory('جميع التصنيفات')
              }
              className={`flex items-center gap-1.5 shrink-0 snap-start px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold ${
                selectedCategory === 'جميع التصنيفات'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Menu className="w-4 h-4" />
              جميع التصنيفات
            </button>

            {wholesaleCategories.map((cat) => {
              const Icon = cat.icon;

              return (
                <button
                  key={cat.nameAr}
                  onClick={() =>
                    setSelectedCategory(cat.nameAr)
                  }
                  className={`flex items-center gap-1.5 shrink-0 snap-start px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold ${
                    selectedCategory === cat.nameAr
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.nameAr}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          {/* MAIN BANNER */}
          <div className="lg:col-span-8 min-h-[290px] sm:min-h-[350px] relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-950">
            <img
              src={heroSlides[activeHeroSlide].image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-indigo-950/40" />

            <div className="relative z-10 h-full min-h-[290px] sm:min-h-[350px] p-5 sm:p-7 md:p-10 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-400 text-slate-950 rounded-md text-[10px] sm:text-xs font-black">
                  <Zap className="w-3.5 h-3.5" />
                  {heroSlides[activeHeroSlide].badge}
                </span>

                <h1 className="mt-4 sm:mt-5 max-w-2xl text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                  {heroSlides[activeHeroSlide].title}
                </h1>

                <p className="mt-3 sm:mt-4 max-w-xl text-xs sm:text-sm leading-6 sm:leading-7 text-slate-300">
                  {heroSlides[activeHeroSlide].subtitle}
                </p>

                <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={scrollToProducts}
                    className="px-5 sm:px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black"
                  >
                    تسوق منتجات الجملة
                  </button>

                  <button
                    onClick={() => onNavigate('CREATE_STORE')}
                    className="px-5 sm:px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold"
                  >
                    أنشئ متجرك
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-5">
                <div className="flex gap-1.5">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveHeroSlide(index)}
                      aria-label={`الشريحة ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        activeHeroSlide === index
                          ? 'w-8 bg-amber-400'
                          : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setActiveHeroSlide((current) =>
                        current === 0
                          ? heroSlides.length - 1
                          : current - 1
                      )
                    }
                    className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setActiveHeroSlide((current) =>
                        current === heroSlides.length - 1
                          ? 0
                          : current + 1
                      )
                    }
                    className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SIDE DEALS */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>

                <div>
                  <div className="text-[10px] text-slate-500">
                    عرض خاص للموردين
                  </div>

                  <div className="text-sm font-black">
                    افتح متجرك الآن
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-6 text-slate-500">
                30 يوماً مجاناً لتجربة متجر الجملة وإدارة منتجاتك وطلباتك.
              </p>

              <button
                onClick={() => onNavigate('CREATE_STORE')}
                className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                إنشاء متجر جملة
              </button>
            </div>

            <div className="bg-indigo-700 text-white rounded-xl sm:rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-300" />

                <div className="font-black text-sm">
                  YOUmi B2B
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-5">
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <div className="font-black text-lg">
                    {stores.length}
                  </div>

                  <div className="text-[9px] text-indigo-200">
                    متجر
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <div className="font-black text-lg">
                    {totalProducts}
                  </div>

                  <div className="text-[9px] text-indigo-200">
                    منتج
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <div className="font-black text-lg">
                    69
                  </div>

                  <div className="text-[9px] text-indigo-200">
                    ولاية
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK CATEGORIES */}
      <section className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                تسوق حسب التصنيف
              </h2>

              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                اكتشف منتجات الجملة حسب نشاطك التجاري
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
            {wholesaleCategories.map((cat) => {
              const Icon = cat.icon;

              return (
                <button
                  key={cat.nameAr}
                  onClick={() =>
                    setSelectedCategory(cat.nameAr)
                  }
                  className={`group p-2.5 sm:p-3 rounded-xl border text-center transition ${
                    selectedCategory === cat.nameAr
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 mx-auto rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:scale-105 transition">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>

                  <div className="mt-2 text-[9px] sm:text-[10px] font-bold text-slate-700 leading-4">
                    {cat.nameAr}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FLASH DEALS */}
      <section className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8 mt-4 sm:mt-5">
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl">
          <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />

              <div>
                <h2 className="font-black text-base sm:text-lg">
                  عروض الجملة
                </h2>

                <p className="text-[9px] sm:text-[10px] text-slate-500">
                  أفضل المنتجات المتاحة حالياً
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveProductTab('discount');
                scrollToProducts();
              }}
              className="text-[10px] sm:text-xs font-bold text-indigo-600"
            >
              مشاهدة الكل ←
            </button>
          </div>

          <div className="p-2.5 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {allWholesaleProducts
              .filter(
                ({ product }) =>
                  product.compareAtPrice &&
                  product.compareAtPrice > product.price
              )
              .slice(0, 4)
              .map(({ product, store }) => (
                <button
                  key={product.id}
                  onClick={() =>
                    setSelectedProduct({ product, store })
                  }
                  className="text-right group min-w-0"
                >
                  <div className="aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                    <img
                      src={product.images?.[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />

                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-rose-500 text-white px-1.5 sm:px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-black">
                      تخفيض
                    </span>
                  </div>

                  <div className="mt-2 text-[10px] sm:text-xs font-bold line-clamp-2">
                    {product.title}
                  </div>

                  <div className="mt-1 text-[9px] sm:text-[10px] text-slate-500 truncate">
                    {store.name}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </section>

      {/* SUPPLIERS */}
      <section
        id="suppliers"
        className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8 mt-4 sm:mt-5"
      >
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl">
          <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black">
                موردو ومتاجر الجملة
              </h2>

              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                اكتشف المتاجر التي توفر منتجات بالجملة
              </p>
            </div>

            <button
              onClick={
                currentMember?.role === 'merchant'
                  ? onOpenMerchantDashboard
                  : onOpenLoginModal
              }
              className="text-[10px] sm:text-xs font-bold text-indigo-600 whitespace-nowrap"
            >
              {currentMember?.role === 'merchant'
                ? 'لوحة البائع ←'
                : 'دخول الموردين ←'}
            </button>
          </div>

          <div className="p-3 sm:p-4 flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto md:overflow-visible no-scrollbar">
            {stores.slice(0, 8).map((store) => (
              <div
                key={store.id}
                className="min-w-[270px] md:min-w-0 border border-slate-200 rounded-xl p-3 sm:p-4 hover:border-indigo-400 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />

                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">
                      {store.name}
                    </h3>

                    <p className="text-[10px] text-slate-500 truncate">
                      {store.category}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  مورد معتمد
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2 text-[9px] font-bold text-slate-600">
                    <Package className="w-3 h-3 text-indigo-500 mb-1" />
                    {store.products?.length || 0} منتج
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2 text-[9px] font-bold text-slate-600">
                    <Truck className="w-3 h-3 text-indigo-500 mb-1" />
                    69 ولاية
                  </div>
                </div>

                <button
                  onClick={() =>
                    onSelectStore(store, 'STORE_FRONT')
                  }
                  className="mt-3 w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-[10px] font-black transition"
                >
                  زيارة المتجر
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="wholesale-products"
        className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8 mt-4 sm:mt-5"
      >
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl">
          <div className="p-3 sm:p-5 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />

                  <h2 className="text-lg sm:text-xl font-black">
                    منتجات الجملة
                  </h2>

                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-bold">
                    {filteredWholesaleProducts.length}
                  </span>
                </div>

                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                  الأسعار بالجملة متاحة للأعضاء المسجلين
                </p>
              </div>

              <div className="flex gap-1 overflow-x-auto no-scrollbar">
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
                        id as
                          | 'all'
                          | 'popular'
                          | 'new'
                          | 'discount'
                      )
                    }
                    className={`px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                      activeProductTab === id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredWholesaleProducts.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />

              <p className="mt-3 text-sm font-bold text-slate-600">
                لا توجد منتجات مطابقة
              </p>

              <button
                onClick={resetFilters}
                className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <div className="p-2 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {filteredWholesaleProducts.map(
                ({ product, store }) => {
                  const liked = likedProducts[product.id];

                  const discount =
                    product.compareAtPrice &&
                    product.compareAtPrice > product.price
                      ? Math.round(
                          (1 -
                            product.price /
                              product.compareAtPrice) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={`${store.id}-${product.id}`}
                      className="group bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg rounded-lg sm:rounded-xl overflow-hidden transition"
                    >
                      {/* IMAGE */}
                      <div
                        className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer"
                        onClick={() =>
                          setSelectedProduct({
                            product,
                            store,
                          })
                        }
                      >
                        <img
                          src={product.images?.[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />

                        {discount > 0 && (
                          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-rose-500 text-white px-1.5 sm:px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-black">
                            -{discount}%
                          </span>
                        )}

                        {product.badge && (
                          <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 max-w-[45%] truncate bg-amber-400 text-slate-950 px-1.5 sm:px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-black">
                            {product.badge}
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(product.id);
                          }}
                          className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 flex items-center justify-center shadow-md"
                          aria-label="إضافة للمفضلة"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                              liked
                                ? 'fill-rose-500 text-rose-500'
                                : 'text-slate-500'
                            }`}
                          />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            setSelectedProduct({
                              product,
                              store,
                            });
                          }}
                          className="hidden sm:flex absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition bg-slate-900/90 text-white px-2.5 py-1.5 rounded-md text-[9px] font-bold items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          التفاصيل
                        </button>
                      </div>

                      {/* INFO */}
                      <div className="p-2 sm:p-3">
                        <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-indigo-600 font-bold">
                          <StoreIcon className="w-3 h-3 shrink-0" />

                          <span className="truncate">
                            {store.name}
                          </span>
                        </div>

                        <h3 className="mt-1 text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-2 min-h-[32px]">
                          {product.title}
                        </h3>

                        <div className="mt-2 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 text-amber-500 min-w-0">
                            <Star className="w-3 h-3 fill-current shrink-0" />

                            <span className="text-[8px] sm:text-[9px] font-bold">
                              {product.ratings?.score?.toFixed(1) ||
                                '0.0'}
                            </span>

                            <span className="hidden sm:inline text-[8px] text-slate-400">
                              ({product.ratings?.count || 0})
                            </span>
                          </div>

                          <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold whitespace-nowrap">
                            MOQ {product.minOrderQuantity || 1}
                          </span>
                        </div>

                        <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100">
                          {isLoggedIn ? (
                            <div>
                              <div className="text-sm sm:text-base font-black text-rose-600 truncate">
                                {product.price.toLocaleString()} دج
                              </div>

                              {product.compareAtPrice &&
                                product.compareAtPrice >
                                  product.price && (
                                  <div className="text-[8px] sm:text-[9px] text-slate-400 line-through truncate">
                                    {product.compareAtPrice.toLocaleString()}{' '}
                                    دج
                                  </div>
                                )}
                            </div>
                          ) : (
                            <button
                              onClick={onOpenMemberAuthModal}
                              className="w-full flex items-center justify-center gap-1 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-[8px] sm:text-[9px] text-amber-800 font-black leading-4"
                            >
                              <Lock className="w-3 h-3 shrink-0" />
                              الأسعار للمسجلين فقط
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleAddToCart(
                                product,
                                store
                              )
                            }
                            className="mt-2 w-full py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />

                            <span className="sm:hidden">
                              طلب
                            </span>

                            <span className="hidden sm:inline">
                              طلب بالجملة
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8 mt-4 sm:mt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black">
                شحن 69 ولاية
              </div>

              <div className="text-[8px] sm:text-[9px] text-slate-500">
                حلول توصيل داخل الجزائر
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black">
                موردون ومتاجر
              </div>

              <div className="text-[8px] sm:text-[9px] text-slate-500">
                سوق B2B موحد
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>

            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black">
                أسعار الجملة
              </div>

              <div className="text-[8px] sm:text-[9px] text-slate-500">
                للمشترين المسجلين
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>

            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black">
                BaridiMob
              </div>

              <div className="text-[8px] sm:text-[9px] text-slate-500">
                اشتراكات البائعين
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY YOUmi */}
      <section className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-8 mt-4 sm:mt-5">
        <div className="bg-slate-900 rounded-xl sm:rounded-2xl p-5 sm:p-7 text-white">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-amber-400 text-[10px] sm:text-xs font-bold">
              YOUmi B2B MARKET
            </span>

            <h2 className="mt-2 text-xl sm:text-2xl font-black">
              منصة واحدة لتجارة الجملة
            </h2>

            <p className="mt-2 text-[10px] sm:text-xs text-slate-400 leading-6">
              اجمع الموردين والمتاجر والمنتجات بالجملة في مكان واحد.
            </p>
          </div>

          <div className="mt-6 sm:mt-7 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
              <Building2 className="w-6 h-6 text-indigo-400" />

              <h3 className="mt-3 font-bold text-sm">
                للموردين والبائعين
              </h3>

              <p className="mt-2 text-xs text-slate-400 leading-6">
                أنشئ متجرك واعرض منتجاتك أمام المشترين بالجملة.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
              <ShoppingBag className="w-6 h-6 text-amber-400" />

              <h3 className="mt-3 font-bold text-sm">
                للمشترين بالجملة
              </h3>

              <p className="mt-2 text-xs text-slate-400 leading-6">
                ابحث وقارن المنتجات واكتشف المورد المناسب لنشاطك.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
              <Truck className="w-6 h-6 text-emerald-400" />

              <h3 className="mt-3 font-bold text-sm">
                توصيل داخل الجزائر
              </h3>

              <p className="mt-2 text-xs text-slate-400 leading-6">
                حلول شحن وتوصيل حسب المتجر وشركة الشحن المعتمدة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] overflow-y-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-slate-100"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid md:grid-cols-2">
              <div className="bg-slate-100 p-2 sm:p-5">
                <div className="aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-white border border-slate-200">
                  <img
                    src={selectedProduct.product.images?.[0]}
                    alt={selectedProduct.product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold">
                  <StoreIcon className="w-4 h-4" />
                  <span className="truncate">
                    {selectedProduct.store.name}
                  </span>
                </div>

                <h2 className="mt-3 text-lg sm:text-xl font-black text-slate-900 leading-7 sm:leading-8">
                  {selectedProduct.product.title}
                </h2>

                <div className="mt-2 text-xs text-slate-500">
                  {selectedProduct.product.category}
                </div>

                <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />

                    <span className="text-xs font-bold">
                      الحد الأدنى للطلب
                    </span>
                  </div>

                  <div className="mt-2 text-sm font-black">
                    {selectedProduct.product.minOrderQuantity || 1}{' '}
                    {selectedProduct.product.packageUnit || 'قطعة'}
                  </div>
                </div>

                <div className="mt-5">
                  {isLoggedIn ? (
                    <>
                      <div className="text-2xl sm:text-3xl font-black text-rose-600">
                        {selectedProduct.product.price.toLocaleString()}{' '}
                        دج
                      </div>

                      {selectedProduct.product.compareAtPrice &&
                        selectedProduct.product.compareAtPrice >
                          selectedProduct.product.price && (
                          <div className="text-xs text-slate-400 line-through mt-1">
                            {selectedProduct.product.compareAtPrice.toLocaleString()}{' '}
                            دج
                          </div>
                        )}
                    </>
                  ) : (
                    <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                        <Lock className="w-5 h-5 text-amber-600" />
                        سعر الجملة محمي
                      </div>

                      <p className="mt-2 text-xs text-amber-800">
                        سجّل الدخول أو أنشئ حساب B2B لرؤية سعر الجملة.
                      </p>

                      <button
                        onClick={onOpenMemberAuthModal}
                        className="mt-3 px-4 py-2 bg-amber-400 text-slate-950 rounded-lg text-xs font-black"
                      >
                        تسجيل / دخول
                      </button>
                    </div>
                  )}
                </div>

                {selectedProduct.product.description && (
                  <p className="mt-5 text-sm text-slate-600 leading-7">
                    {selectedProduct.product.description}
                  </p>
                )}

                <button
                  onClick={() => {
                    handleAddToCart(
                      selectedProduct.product,
                      selectedProduct.store
                    );
                    setSelectedProduct(null);
                  }}
                  className="mt-6 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  إضافة للسلة وطلب بالجملة
                </button>

                <button
                  onClick={() => {
                    onSelectStore(
                      selectedProduct.store,
                      'STORE_FRONT'
                    );
                    setSelectedProduct(null);
                  }}
                  className="mt-2 w-full py-3 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold text-xs"
                >
                  زيارة متجر المورد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end">
          <div className="w-full max-w-md bg-white h-full flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />

                <h3 className="font-black">
                  سلة طلبات الجملة
                </h3>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 bg-slate-100 rounded-lg"
                aria-label="إغلاق السلة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              {cartItems.length === 0 ? (
                <div className="py-20 text-center">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />

                  <p className="mt-3 text-sm font-bold text-slate-600">
                    السلة فارغة
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div
                      key={`${item.product.id}-${index}`}
                      className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <img
                        src={item.product.images?.[0]}
                        alt={item.product.title}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate">
                          {item.product.title}
                        </h4>

                        <p className="text-[10px] text-slate-500 mt-1 truncate">
                          {item.store.name}
                        </p>

                        <p className="text-xs font-black text-rose-600 mt-1">
                          {item.product.price.toLocaleString()} دج ×{' '}
                          {item.qty}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setCartItems((previous) =>
                            previous.filter(
                              (_, itemIndex) =>
                                itemIndex !== index
                            )
                          )
                        }
                        className="text-rose-500 p-1 shrink-0"
                        aria-label="حذف المنتج"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold">
                    إجمالي الطلب
                  </span>

                  <span className="text-lg sm:text-xl font-black text-rose-600">
                    {totalCartPrice.toLocaleString()} دج
                  </span>
                </div>

                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-800">
                  الدفع عند الاستلام حسب شروط المتجر وشركة الشحن.
                </div>

                <button
                  onClick={() => {
                    if (cartItems.length > 0) {
                      onSelectStore(
                        cartItems[0].store,
                        'STORE_FRONT'
                      );

                      setIsCartOpen(false);
                    }
                  }}
                  className="mt-3 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2"
                >
                  متابعة الطلب
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-6 sm:mt-8 bg-slate-950 text-slate-400">
        <div className="max-w-[1500px] mx-auto px-4 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">
                  Y
                </div>

                <span className="text-white font-black text-lg">
                  YOUmi B2B
                </span>
              </div>

              <p className="mt-3 text-xs leading-6">
                منصة تجارة الجملة الجزائرية التي تربط الموردين والبائعين
                بالمشترين بالجملة.
              </p>
            </div>

            <div>
              <h4 className="text-white text-xs font-black">
                الموردون
              </h4>

              <button
                onClick={onOpenLoginModal}
                className="mt-3 text-xs hover:text-white"
              >
                دخول الموردين
              </button>

              <button
                onClick={() => onNavigate('CREATE_STORE')}
                className="block mt-2 text-xs hover:text-white"
              >
                إنشاء متجر
              </button>
            </div>

            <div>
              <h4 className="text-white text-xs font-black">
                المشترون
              </h4>

              <button
                onClick={onOpenMemberAuthModal}
                className="mt-3 block text-xs hover:text-white"
              >
                تسجيل B2B
              </button>

              <a
                href="#wholesale-products"
                className="block mt-2 text-xs hover:text-white"
              >
                منتجات الجملة
              </a>
            </div>

            <div>
              <h4 className="text-white text-xs font-black">
                الشحن والدفع
              </h4>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <Truck className="w-4 h-4 text-indigo-400" />
                شحن إلى 69 ولاية
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs">
                <CreditCard className="w-4 h-4 text-amber-400" />
                اشتراكات البائعين عبر BaridiMob
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
            <span>
              © 2026 YOUmi B2B Market - جميع الحقوق محفوظة
            </span>

            <div className="flex items-center gap-3">
              <span>🇩🇿 الجزائر</span>

              <button
                type="button"
                onClick={onOpenAdminLoginModal}
                className="text-slate-700 hover:text-slate-300"
              >
                إدارة المنصة
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => onNavigate('PLATFORM_HOME')}
            className="flex flex-col items-center justify-center gap-1 text-indigo-600"
          >
            <Home className="w-5 h-5" />

            <span className="text-[9px] font-bold">
              الرئيسية
            </span>
          </button>

          <button
            onClick={scrollToProducts}
            className="flex flex-col items-center justify-center gap-1 text-slate-500"
          >
            <Menu className="w-5 h-5" />

            <span className="text-[9px] font-bold">
              المنتجات
            </span>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex flex-col items-center justify-center gap-1 text-slate-500"
          >
            <ShoppingBag className="w-5 h-5" />

            {totalCartItems > 0 && (
              <span className="absolute top-1.5 left-1/2 translate-x-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[8px] flex items-center justify-center font-black">
                {totalCartItems}
              </span>
            )}

            <span className="text-[9px] font-bold">
              السلة
            </span>
          </button>

          <button
            onClick={handleMobileAccount}
            className="flex flex-col items-center justify-center gap-1 text-slate-500"
          >
            {isAdminLoggedIn ? (
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            ) : currentMember?.role === 'merchant' ? (
              <StoreIcon className="w-5 h-5 text-indigo-600" />
            ) : isLoggedIn ? (
              <UserCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <User className="w-5 h-5" />
            )}

            <span className="text-[9px] font-bold">
              {isAdminLoggedIn
                ? 'الإدارة'
                : currentMember?.role === 'merchant'
                ? 'البائع'
                : isLoggedIn
                ? 'حسابي'
                : 'دخول'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
