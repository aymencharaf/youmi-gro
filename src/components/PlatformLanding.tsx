import React, { useMemo, useState } from 'react';
import { Store, AppView, Product } from '../types';
import { YoumiLogo } from './YoumiLogo';
import {
  Search, ShoppingBag, User, Store as StoreIcon, Menu, ChevronLeft, ChevronRight,
  Flame, Laptop, Smartphone, Shirt, Home, Wrench, Sparkles, Dumbbell, Baby,
  BookOpen, MoreHorizontal, Star, Heart, CheckCircle2, Truck, ShieldCheck,
  Headphones, Plus, ArrowLeft, ArrowRight, X, ShoppingCart, MapPin, Package,
  Instagram, Facebook, Youtube, Gift, Tag, Building2
} from 'lucide-react';
import { B2BMember } from './MemberAuthModal';
import { getPlatformAnnouncements, PlatformAnnouncement } from '../lib/adminSettings';

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

type CartItem = { product: Product; store: Store; qty: number };

const categoryItems = [
  { name: 'إلكترونيات', icon: Laptop, cls: 'bg-blue-50 text-blue-600' },
  { name: 'هواتف وملحقاتها', icon: Smartphone, cls: 'bg-indigo-50 text-indigo-600' },
  { name: 'أزياء وموضة', icon: Shirt, cls: 'bg-orange-50 text-orange-500' },
  { name: 'أحذية وحقائب', icon: Tag, cls: 'bg-violet-50 text-violet-600' },
  { name: 'منزل ومطبخ', icon: Home, cls: 'bg-emerald-50 text-emerald-600' },
  { name: 'أدوات ومواد البناء', icon: Wrench, cls: 'bg-red-50 text-red-500' },
  { name: 'تجميل وصحة', icon: Sparkles, cls: 'bg-pink-50 text-pink-500' },
  { name: 'رياضة وترفيه', icon: Dumbbell, cls: 'bg-cyan-50 text-cyan-600' },
  { name: 'أطفال ورضع', icon: Baby, cls: 'bg-rose-50 text-rose-500' },
  { name: 'مستلزمات مكتبية', icon: BookOpen, cls: 'bg-sky-50 text-sky-600' },
];

const heroImage = 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1800&q=85';

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
  onOpenAdminLoginModal = () => {},
}) => {
  const [lang, setLang] = useState<'AR' | 'FR'>('AR');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('جميع التصنيفات');
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'new' | 'discount'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ product: Product; store: Store } | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [announcements] = useState<PlatformAnnouncement[]>(() =>
    getPlatformAnnouncements().filter(a => a.active && (a.targetAudience === 'all' || a.targetAudience === 'buyers'))
  );

  const allProducts = useMemo(() => stores.flatMap(store => (store.products || []).map(product => ({ product, store }))), [stores]);
  const products = useMemo(() => allProducts.filter(({ product, store }) => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q || product.title.toLowerCase().includes(q) || product.category.toLowerCase().includes(q) || store.name.toLowerCase().includes(q);
    const matchCategory = selectedCategory === 'جميع التصنيفات' || product.category.includes(selectedCategory) || store.category.includes(selectedCategory);
    const matchTab = activeTab === 'all' || (activeTab === 'popular' && product.ratings?.score >= 4.5) || (activeTab === 'new' && !!product.badge) || (activeTab === 'discount' && !!product.compareAtPrice && product.compareAtPrice > product.price);
    return matchSearch && matchCategory && matchTab;
  }), [allProducts, searchTerm, selectedCategory, activeTab]);

  const visibleProducts = products.slice(0, 12);
  const cartCount = cart.reduce((n, i) => n + i.qty, 0);
  const cartTotal = cart.reduce((n, i) => n + i.qty * i.product.price, 0);

  const addToCart = (product: Product, store: Store) => {
    const qty = product.minOrderQuantity || 1;
    setCart(prev => {
      const found = prev.find(i => i.product.id === product.id);
      if (found) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product, store, qty }];
    });
    setCartOpen(true);
  };

  const slides = [
    { title: 'سوقك الجزائري للشراء والبيع بالجملة', subtitle: 'اكتشف آلاف المنتجات من متاجر موثوقة في جميع أنحاء الجزائر', button: 'استكشف المنتجات' },
    { title: 'من أنحاء الجزائر... لجميع أنحاء الوطن', subtitle: 'متاجر موثوقة، منتجات متنوعة، وتجربة شراء بسيطة وآمنة', button: 'اكتشف المتاجر' },
    { title: 'افتح متجرك الآن على Youmi', subtitle: 'انضم إلى آلاف البائعين وابدأ البيع والوصول إلى زبائن جدد', button: 'إنشاء متجر مجاني' },
  ];

  return (
    <div dir={lang === 'AR' ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f7f9fc] text-[#10244d] antialiased font-['Tajawal',sans-serif]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-10 h-[72px] flex items-center gap-5">
          <button onClick={() => onNavigate('PLATFORM_HOME')} className="shrink-0 hover:opacity-90 transition"><YoumiLogo variant="full" size="md" /></button>
          <div className="flex-1 max-w-[600px] mx-auto hidden md:flex h-11 rounded-full border border-[#b9c7dd] overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <div className="flex items-center px-4 text-slate-400"><Search className="w-5 h-5" /></div>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="إبحث عن منتج، متجر أو فئة..." className="flex-1 outline-none text-sm bg-transparent" />
            <button onClick={() => setActiveTab('all')} className="w-14 bg-[#155bd7] text-white flex items-center justify-center hover:bg-[#0f4ebd] transition"><Search className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold shrink-0">
            <button onClick={() => setLang('FR')} className={lang === 'FR' ? 'text-blue-600' : 'text-slate-500'}>FR 🇫🇷</button>
            <button onClick={() => setLang('AR')} className={lang === 'AR' ? 'text-blue-600' : 'text-slate-500'}>عربي 🇩🇿</button>
            <div className="hidden lg:block w-px h-7 bg-slate-200" />
            {isLoggedIn ? <button onClick={onLogoutMember} className="flex items-center gap-1.5 text-slate-700"><User className="w-4 h-4" />{currentMember?.name || 'حسابي'}</button> : <button onClick={onOpenMemberAuthModal} className="flex items-center gap-1.5 text-slate-700"><User className="w-4 h-4" />تسجيل الدخول</button>}
            <button onClick={() => onNavigate('CREATE_STORE')} className="hidden sm:flex items-center gap-2 bg-[#155bd7] hover:bg-[#0e4dbb] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm"><StoreIcon className="w-4 h-4" />إنشاء متجر مجاني</button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="bg-white border-b border-slate-100 shadow-[0_2px_8px_rgba(15,35,70,.04)]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-10 h-[48px] flex items-center justify-between">
          <div className="flex items-center gap-8 text-sm font-extrabold">
            <button onClick={() => setSelectedCategory('جميع التصنيفات')} className="flex items-center gap-2 text-slate-800"><Menu className="w-5 h-5" />جميع الفئات</button>
            <button className="hover:text-blue-600">الأكثر مبيعاً <Flame className="inline w-4 h-4 text-orange-500" /></button>
            <button className="hover:text-blue-600">العروض</button>
            <button className="hover:text-blue-600">البيع بالجملة</button>
            <button onClick={() => document.getElementById('stores')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-600">المتاجر</button>
            <button onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} className="text-blue-600">المنتجات</button>
          </div>
          <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 text-slate-700"><ShoppingBag className="w-5 h-5 text-blue-600" />{cartCount > 0 && <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] min-w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}</button>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[322px] lg:min-h-[324px]">
        <img src={heroImage} alt="Youmi" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#083a78]/90 via-[#07539a]/88 to-[#063667]/94" />
        <div className="relative max-w-[1440px] mx-auto px-8 lg:px-16 min-h-[322px] flex items-center">
          <div className="w-full lg:w-[58%] text-white py-10">
            <h1 className="text-3xl md:text-5xl font-black leading-[1.15] tracking-tight">{slides[activeSlide].title}</h1>
            <p className="mt-4 text-sm md:text-lg text-blue-50/95 max-w-[690px] leading-8">{slides[activeSlide].subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} className="px-7 py-3 bg-[#1262e7] hover:bg-[#0d52c7] rounded-xl font-black text-sm flex items-center gap-2 shadow-lg"><span>{slides[activeSlide].button}</span><ArrowLeft className="w-4 h-4" /></button>
              <button onClick={() => onNavigate('CREATE_STORE')} className="px-7 py-3 bg-white text-[#123568] hover:bg-blue-50 rounded-xl font-black text-sm flex items-center gap-2"><StoreIcon className="w-4 h-4" />افتح متجرك مجاناً</button>
            </div>
            <div className="mt-6 flex flex-wrap gap-7 text-xs font-bold text-white/95">
              <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" />دفع آمن</span>
              <span className="flex items-center gap-2"><Truck className="w-5 h-5" />توصيل سريع</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />متاجر موثوقة</span>
              <span className="flex items-center gap-2"><Headphones className="w-5 h-5" />دعم العملاء 24/7</span>
            </div>
          </div>
          <div className="hidden lg:block absolute left-8 bottom-5 w-36 h-10 bg-white/10 rounded-full blur-xl" />
          <button onClick={() => setActiveSlide(s => (s + slides.length - 1) % slides.length)} className="absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 text-white flex items-center justify-center"><ChevronLeft /></button>
          <button onClick={() => setActiveSlide(s => (s + 1) % slides.length)} className="absolute right-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 text-white flex items-center justify-center"><ChevronRight /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">{slides.map((_, i) => <button key={i} onClick={() => setActiveSlide(i)} className={`h-2 rounded-full transition-all ${i === activeSlide ? 'w-7 bg-white' : 'w-2 bg-white/50'}`} />)}</div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-10 py-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_3px_18px_rgba(15,35,70,.04)] p-4">
          <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-black">الفئات الرئيسية <span className="text-orange-500">🔥</span></h2><button className="text-blue-600 text-xs font-black">عرض الكل ←</button></div>
          <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-10 gap-3">
            {categoryItems.map(cat => { const Icon = cat.icon; return <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className="group text-center"><div className={`mx-auto w-14 h-14 rounded-full ${cat.cls} flex items-center justify-center border border-white shadow-sm group-hover:scale-105 transition`}><Icon className="w-7 h-7" /></div><span className="block mt-2 text-[11px] font-bold text-slate-700 leading-4">{cat.name}</span></button>; })}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="max-w-[1440px] mx-auto px-4 lg:px-10 py-4">
        <div className="flex items-center justify-between mb-3"><h2 className="text-xl font-black">منتجات مميزة <span className="text-orange-500">🔥</span></h2><button onClick={() => { setActiveTab('all'); setSearchTerm(''); setSelectedCategory('جميع التصنيفات'); }} className="text-blue-600 text-xs font-black">عرض الكل ←</button></div>
        <div className="bg-white border border-slate-100 rounded-2xl p-3 mb-4 flex gap-2 overflow-x-auto">
          {[['all','جميع المنتجات'],['popular','الأكثر تقييماً'],['new','جديد'],['discount','تخفيضات']].map(([id,label]) => <button key={id} onClick={() => setActiveTab(id as any)} className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap ${activeTab === id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}>{label}</button>)}
        </div>
        {visibleProducts.length ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {visibleProducts.map(({ product, store }) => {
            const discount = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
            return <article key={`${store.id}-${product.id}`} className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition overflow-hidden group">
              <div className="relative aspect-square bg-slate-50 p-2"><img src={product.images?.[0]} alt={product.title} className="w-full h-full object-contain mix-blend-multiply" /><div className="absolute top-2 right-2 flex gap-1">{discount > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-1 rounded-full font-black">-{discount}%</span>}{product.badge === 'جديد' && <span className="bg-emerald-500 text-white text-[9px] px-2 py-1 rounded-full font-black">جديد</span>}</div><button onClick={() => setLiked(p => ({ ...p, [product.id]: !p[product.id] }))} className="absolute top-2 left-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm"><Heart className={`w-4 h-4 ${liked[product.id] ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} /></button></div>
              <div className="p-3"><button onClick={() => setSelectedProduct({ product, store })} className="text-right w-full"><h3 className="font-black text-xs text-slate-800 line-clamp-2 min-h-8 group-hover:text-blue-600">{product.title}</h3></button><div className="mt-2 flex items-center gap-1 text-[10px]"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><b>{product.ratings?.score?.toFixed(1) || '4.8'}</b><span className="text-slate-400">({product.ratings?.count || 0})</span></div><div className="mt-2 flex items-end justify-between gap-2"><div><div className="text-sm font-black text-red-500">{product.price.toLocaleString()} دج</div>{product.compareAtPrice && <div className="text-[9px] text-slate-400 line-through">{product.compareAtPrice.toLocaleString()} دج</div>}</div><button onClick={() => addToCart(product, store)} className="w-9 h-9 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center"><ShoppingCart className="w-4 h-4" /></button></div></div>
            </article>;
          })}
        </div> : <div className="bg-white rounded-2xl p-12 text-center text-sm font-bold text-slate-500">لا توجد منتجات مطابقة حالياً.</div>}
      </section>

      {/* Stores */}
      <section id="stores" className="max-w-[1440px] mx-auto px-4 lg:px-10 py-5">
        <div className="flex items-center justify-between mb-3"><h2 className="text-xl font-black">متاجر مميزة</h2><button className="text-blue-600 text-xs font-black">عرض الكل ←</button></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stores.slice(0, 8).map(store => <div key={store.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 hover:shadow-md transition"><img src={store.logoUrl} alt={store.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100" /><div className="min-w-0 flex-1"><h3 className="font-black text-sm truncate">{store.name}</h3><p className="text-[10px] text-slate-500 truncate mt-1">{store.category}</p><div className="flex items-center gap-2 mt-2"><span className="text-[9px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black">متجر موثوق</span><span className="text-[10px] text-amber-500 font-black">★ 4.7</span></div><button onClick={() => onSelectStore(store, 'STORE_FRONT')} className="mt-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black">زيارة المتجر</button></div></div>)}
        </div>
      </section>

      {/* Promotional banners */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-10 py-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl overflow-hidden bg-gradient-to-l from-blue-700 to-cyan-500 text-white p-5 min-h-[120px] flex items-center justify-between"><div><h3 className="font-black text-lg">افتح متجرك الآن</h3><p className="text-xs mt-1 text-white/85">انضم إلى آلاف البائعين على Youmi</p><button onClick={() => onNavigate('CREATE_STORE')} className="mt-3 bg-white text-blue-700 rounded-lg px-4 py-2 text-[10px] font-black">إنشاء متجر مجاني</button></div><StoreIcon className="w-20 h-20 opacity-30" /></div>
        <div className="rounded-xl overflow-hidden bg-gradient-to-l from-emerald-700 to-green-500 text-white p-5 min-h-[120px] flex items-center justify-between"><div><h3 className="font-black text-lg">البيع بالجملة</h3><p className="text-xs mt-1 text-white/85">أفضل الأسعار للمصنعين والتجار</p><button onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} className="mt-3 bg-white text-emerald-700 rounded-lg px-4 py-2 text-[10px] font-black">اكتشف المزيد</button></div><Package className="w-20 h-20 opacity-30" /></div>
        <div className="rounded-xl overflow-hidden bg-gradient-to-l from-fuchsia-700 to-pink-500 text-white p-5 min-h-[120px] flex items-center justify-between"><div><h3 className="font-black text-lg">عروض خاصة</h3><p className="text-xs mt-1 text-white/85">تخفيضات تصل إلى 50%</p><button onClick={() => setActiveTab('discount')} className="mt-3 bg-white text-fuchsia-700 rounded-lg px-4 py-2 text-[10px] font-black">تسوق الآن</button></div><Gift className="w-20 h-20 opacity-30" /></div>
      </section>

      {/* Trust strip */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-10 py-4"><div className="bg-white border border-slate-100 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-5"><div className="flex items-center gap-3"><ShieldCheck className="w-8 h-8 text-blue-600" /><div><b className="block text-sm">تسوق بأمان</b><span className="text-[10px] text-slate-500">حماية وموثوقية</span></div></div><div className="flex items-center gap-3"><Truck className="w-8 h-8 text-emerald-600" /><div><b className="block text-sm">توصيل سريع</b><span className="text-[10px] text-slate-500">إلى مختلف الولايات</span></div></div><div className="flex items-center gap-3"><Building2 className="w-8 h-8 text-orange-500" /><div><b className="block text-sm">متاجر موثوقة</b><span className="text-[10px] text-slate-500">بائعون معتمدون</span></div></div><div className="flex items-center gap-3"><Headphones className="w-8 h-8 text-violet-600" /><div><b className="block text-sm">دعم العملاء</b><span className="text-[10px] text-slate-500">نساعدك دائماً</span></div></div></div></section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-4">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-9 grid grid-cols-1 md:grid-cols-4 gap-8"><div><YoumiLogo variant="full" size="md" /><p className="text-xs text-slate-500 leading-6 mt-3">Youmi، سوقك الجزائري للشراء والبيع بالجملة، يجمع المشترين والبائعين في تجربة تجارة إلكترونية سهلة.</p><div className="flex gap-2 mt-4"><span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Facebook className="w-4 h-4" /></span><span className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center"><Instagram className="w-4 h-4" /></span><span className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><Youtube className="w-4 h-4" /></span></div></div><div><h4 className="font-black text-sm mb-3">روابط مهمة</h4><div className="space-y-2 text-xs text-slate-500"><button className="block">من نحن</button><button className="block">شروط الاستخدام</button><button className="block">سياسة الخصوصية</button></div></div><div><h4 className="font-black text-sm mb-3">خدمة العملاء</h4><div className="space-y-2 text-xs text-slate-500"><button className="block">مركز المساعدة</button><button className="block">تواصل معنا</button><button className="block">تتبع الطلب</button></div></div><div><h4 className="font-black text-sm mb-3">Youmi</h4><p className="text-xs text-slate-500 leading-6">معاً نبني سوقاً أفضل في الجزائر 🇩🇿</p><div className="mt-4 text-xs font-black text-blue-600">+213 550 12 34 56</div></div></div>
        <div className="border-t border-slate-100 py-4 text-center text-[10px] text-slate-400">جميع الحقوق محفوظة © 2026 لمنصة Youmi</div>
      </footer>

      {/* Product modal */}
      {selectedProduct && <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}><div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"><div className="flex justify-between items-center p-4 border-b"><b>تفاصيل المنتج</b><button onClick={() => setSelectedProduct(null)}><X /></button></div><div className="grid md:grid-cols-2 gap-5 p-5"><div className="bg-slate-50 rounded-xl aspect-square flex items-center justify-center"><img src={selectedProduct.product.images?.[0]} alt="" className="w-full h-full object-contain" /></div><div className="flex flex-col justify-center"><span className="text-xs text-blue-600 font-bold">{selectedProduct.store.name}</span><h3 className="text-2xl font-black mt-2">{selectedProduct.product.title}</h3><div className="flex items-center gap-1 mt-3 text-sm"><Star className="w-4 h-4 fill-amber-400 text-amber-400" />{selectedProduct.product.ratings?.score?.toFixed(1)}</div><div className="text-2xl font-black text-red-500 mt-4">{selectedProduct.product.price.toLocaleString()} دج</div><p className="text-sm text-slate-500 leading-7 mt-3">{selectedProduct.product.description}</p><button onClick={() => { addToCart(selectedProduct.product, selectedProduct.store); setSelectedProduct(null); }} className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black flex items-center justify-center gap-2"><ShoppingCart className="w-5 h-5" />إضافة إلى السلة</button></div></div></div></div>}

      {/* Cart */}
      {cartOpen && <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCartOpen(false)}><aside onClick={e => e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl p-5 flex flex-col"><div className="flex items-center justify-between border-b pb-4"><h3 className="font-black text-lg flex items-center gap-2"><ShoppingBag className="text-blue-600" />السلة</h3><button onClick={() => setCartOpen(false)}><X /></button></div><div className="flex-1 overflow-y-auto py-4 space-y-3">{cart.length ? cart.map((item, i) => <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><img src={item.product.images?.[0]} className="w-14 h-14 object-contain rounded-lg bg-white" /><div className="flex-1 min-w-0"><b className="text-xs block truncate">{item.product.title}</b><span className="text-[10px] text-slate-500">{item.qty} × {item.product.price.toLocaleString()} دج</span></div><button onClick={() => setCart(c => c.filter((_, idx) => idx !== i))} className="text-red-500"><X className="w-4 h-4" /></button></div>) : <div className="h-full flex flex-col items-center justify-center text-center text-slate-400"><ShoppingBag className="w-12 h-12 mb-3" /><b>السلة فارغة</b><span className="text-xs mt-1">أضف منتجات للمتابعة</span></div>}</div>{cart.length > 0 && <div className="border-t pt-4"><div className="flex justify-between font-black mb-3"><span>الإجمالي</span><span className="text-red-500">{cartTotal.toLocaleString()} دج</span></div><button onClick={() => { onSelectStore(cart[0].store, 'STORE_FRONT'); setCartOpen(false); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black">متابعة الطلب</button></div>}</aside></div>}
    </div>
  );
};
