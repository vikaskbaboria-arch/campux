import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Tag, 
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const SHOWCASE_PRODUCTS = [
  {
    id: 'cycles',
    title: 'Campus Cycles & Gear',
    category: 'Cycles',
    tag: 'Explore',
    description: 'Geared bikes, city cycles, helmets, and locks traded directly with seniors.',
    image: '/products/campus-cycle.png',
    imageAlt: 'Black commuter bicycle with yellow accents',
    imageBackdrop: 'bg-[#efecd9]',
  },
  {
    id: 'tech',
    title: 'Tech & Gadgets',
    category: 'Accessories',
    tag: 'Explore',
    description: 'TI-84 calculators, laptop chargers, headphones, and adapters at student prices.',
    image: '/products/student-tech.png',
    imageAlt: 'Scientific calculator and black headphones',
    imageBackdrop: 'bg-[#e8e5ef]',
  },
  {
    id: 'textbooks',
    title: 'Curriculum Textbooks',
    category: 'Books',
    tag: 'Explore',
    description: 'Engineering math, DSA, circuit theory, and semester notes passed down directly.',
    image: '/products/textbook-stack.png',
    imageAlt: 'Stack of textbooks with colorful study tabs',
    imageBackdrop: 'bg-[#ebe5db]',
  },
  {
    id: 'dorm',
    title: 'Dorm & Room Essentials',
    category: 'Living',
    tag: 'Explore',
    description: 'Study lamps, room heaters, electric kettles, and laundry storage organizers.',
    image: '/products/study-lamp.png',
    imageAlt: 'Adjustable warm-white study lamp',
    imageBackdrop: 'bg-[#46413b]',
  },
  {
    id: 'lab',
    title: 'Lab Kits & Drafters',
    category: 'Instruments',
    tag: 'Explore',
    description: 'Mini drafters, breadboards, multimeter probes, lab aprons, and component sets.',
    image: '/products/drafting-kit.png',
    imageAlt: 'Technical drawing board and drafting instruments',
    imageBackdrop: 'bg-[#dfe3e8]',
  },
];
const WORDMARK_LENS_SIZE = 128;
const WORDMARK_LENS_ZOOM = 1.8;
const ABOUT_MODES = {
  buy: {
    label: 'Buy',
    title: 'Find what your next semester needs.',
    description: 'Browse useful finds from students around your campus, from course books to the little things that make a room feel like yours.',
    action: 'Explore student listings',
  },
  sell: {
    label: 'Sell',
    title: 'Give good things another student life.',
    description: 'List what you no longer need and pass it on to someone nearby. Less clutter for you, a better find for another student.',
    action: 'Start selling',
  },
  exchange: {
    label: 'Exchange',
    title: 'Make a useful swap close to home.',
    description: 'Trade with people who share your campus. Find a fair match for the things you have and the things you need.',
    action: 'Discover exchanges',
  },
};
const ABOUT_PHOTOS = [
  {
    image: '/students-campus.png',
    alt: 'Three students sharing a textbook together in a university courtyard',
    caption: 'Made for the people on your campus.',
  },
  {
    image: '/students-book-handoff.png',
    alt: 'Two students passing a textbook to each other on campus',
    caption: 'Pass useful things on to someone nearby.',
  },
  {
    image: '/students-study-group.png',
    alt: 'A group of students studying together around a laptop outdoors',
    caption: 'Find your next good thing in the community.',
  },
];

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const wordmarkViewportRef = useRef(null);
  const wordmarkTextRefs = useRef([]);
  const wordmarkLensRef = useRef(null);
  const wordmarkPointerRef = useRef(null);
  const wordmarkLensFrameRef = useRef(null);
  const aboutRef = useRef(null);
  const [isAboutVisible, setIsAboutVisible] = useState(false);
  const [activeAboutMode, setActiveAboutMode] = useState('buy');
  const [activeAboutPhoto, setActiveAboutPhoto] = useState(0);

  const syncWordmarkLens = () => {
    const viewport = wordmarkViewportRef.current;
    const lens = wordmarkLensRef.current;
    const pointer = wordmarkPointerRef.current;
    if (!viewport || !lens || !pointer) return;

    const text = wordmarkTextRefs.current.find((candidate) => {
      if (!candidate) return false;
      const rect = candidate.getBoundingClientRect();
      return pointer.x >= rect.left && pointer.x <= rect.right &&
        pointer.y >= rect.top && pointer.y <= rect.bottom;
    });

    if (!text) {
      lens.classList.remove('is-visible');
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    const pointerX = pointer.x - textRect.left;
    const pointerY = pointer.y - textRect.top;
    const lensCenter = WORDMARK_LENS_SIZE / 2;
    const contentCenter = lensCenter - 3;

    lens.style.setProperty('--lens-left', `${pointer.x - viewportRect.left - lensCenter}px`);
    lens.style.setProperty('--lens-top', `${pointer.y - viewportRect.top - lensCenter}px`);
    lens.style.setProperty(
      '--lens-text-left',
      `${contentCenter - pointerX * WORDMARK_LENS_ZOOM}px`
    );
    lens.style.setProperty(
      '--lens-text-top',
      `${contentCenter - pointerY * WORDMARK_LENS_ZOOM}px`
    );
    lens.classList.add('is-visible');
  };

  const animateWordmarkLens = () => {
    if (!wordmarkPointerRef.current) {
      wordmarkLensFrameRef.current = null;
      return;
    }

    syncWordmarkLens();
    wordmarkLensFrameRef.current = requestAnimationFrame(animateWordmarkLens);
  };

  const updateWordmarkLens = (event) => {
    if (event.pointerType === 'touch') {
      hideWordmarkLens();
      return;
    }

    wordmarkPointerRef.current = { x: event.clientX, y: event.clientY };
    if (wordmarkLensFrameRef.current === null) {
      wordmarkLensFrameRef.current = requestAnimationFrame(animateWordmarkLens);
    }
  };

  const hideWordmarkLens = () => {
    wordmarkPointerRef.current = null;
    if (wordmarkLensFrameRef.current !== null) {
      cancelAnimationFrame(wordmarkLensFrameRef.current);
      wordmarkLensFrameRef.current = null;
    }
    wordmarkLensRef.current?.classList.remove('is-visible');
  };

  useEffect(() => {
    const aboutSection = aboutRef.current;
    if (!aboutSection) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setIsAboutVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsAboutVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });

    observer.observe(aboutSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (wordmarkLensFrameRef.current !== null) {
      cancelAnimationFrame(wordmarkLensFrameRef.current);
    }
  }, []);

  return (
    <div className="flex-1 w-full bg-black text-zinc-100">
      <section className="min-h-screen w-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-[1216px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-stretch my-auto">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between space-y-8 lg:space-y-12">
          
          {/* Top Brand & Multi-Column Navigation */}
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              {/* Brand Name matching Blyss */}
              <Link to="/" className="inline-block group">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase font-sans">
                  CAMPUX
                </span>
              </Link>

              {/* Multi-column Navigation Links matching screenshot */}
              <div className="flex items-start gap-8 sm:gap-12 text-xs sm:text-sm">
                <div className="space-y-1.5 font-medium text-zinc-400">
                  <div>
                    <Link to="/register" className="hover:text-white transition-colors">
                      Buy
                    </Link>
                  </div>
                  <div>
                    <Link to="/register" className="hover:text-white transition-colors">
                      Sell
                    </Link>
                  </div>
                  <div>
                    <Link to="/register" className="hover:text-white transition-colors">
                      Cycles
                    </Link>
                  </div>
                  <div>
                    <Link to="/register" className="hover:text-white transition-colors">
                      Textbooks
                    </Link>
                  </div>
                </div>

                <div className="space-y-1.5 font-medium text-zinc-400">
                  <div>
                    <Link to="/register" className="hover:text-white transition-colors">
                      Exchange
                    </Link>
                  </div>
                  <div>
                    <Link to="/register" className="hover:text-white transition-colors">
                      Gadgets
                    </Link>
                  </div>
                  <div>
                    <Link to="/register" className="hover:text-white transition-colors">
                      Colleges
                    </Link>
                  </div>
                  <div>
                    <a href="#about" className="hover:text-white transition-colors">
                      About
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Middle Paragraph Description & Action Buttons */}
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-lg">
              Securely buy, sell, and exchange college essentials — all in one student-only marketplace built for campus speed, verified safety, and zero commissions. Designed to support instant hostel handoffs, cash-on-meet, and real-time listings, it&apos;s your trusted gateway to university peer-to-peer commerce.
            </p>

            {/* App Store / Google Play styled buttons matching screenshot */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
              <Link
                to={isAuthenticated ? '/profile' : '/register'}
                className="px-5 py-3 rounded-full border border-white/10 bg-[#0e0e0e] hover:bg-[#181818] text-white text-xs font-semibold flex items-center gap-2.5 transition-all shadow-sm hover:border-white/30 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-zinc-300" />
                <span>Explore Marketplace</span>
              </Link>

              <Link
                to={isAuthenticated ? '/profile' : '/login'}
                className="px-5 py-3 rounded-full border border-white/10 bg-[#0e0e0e] hover:bg-[#181818] text-white text-xs font-semibold flex items-center gap-2.5 transition-all shadow-sm hover:border-white/30 cursor-pointer"
              >
                <Tag className="w-4 h-4 text-zinc-300" />
                <span>Start Selling</span>
              </Link>
            </div>
          </div>

          {/* Bottom Massive Typographic Wordmark matching "SWITCH" in screenshot */}
          <div
            ref={wordmarkViewportRef}
            onPointerMove={updateWordmarkLens}
            onPointerLeave={hideWordmarkLens}
            className="campux-wordmark-viewport pt-6 pb-4 sm:pt-10 sm:pb-8 select-none"
          >
            <div className="campux-wordmark-track gap-8 pr-8 sm:gap-12 sm:pr-12">
              <h1
                ref={(element) => { wordmarkTextRefs.current[0] = element; }}
                className="font-extrabold text-[68px] sm:text-[105px] md:text-[130px] lg:text-[120px] xl:text-[150px] tracking-tighter leading-none text-white uppercase font-sans whitespace-nowrap"
              >
                CAMPUX
              </h1>
              <span
                ref={(element) => { wordmarkTextRefs.current[1] = element; }}
                aria-hidden="true"
                className="font-extrabold text-[68px] sm:text-[105px] md:text-[130px] lg:text-[120px] xl:text-[150px] tracking-tighter leading-none text-white uppercase font-sans whitespace-nowrap"
              >
                CAMPUX
              </span>
            </div>
            <div ref={wordmarkLensRef} className="campux-magnifier" aria-hidden="true">
              <div className="campux-magnifier-window">
                <div className="campux-magnifier-text font-extrabold text-[68px] sm:text-[105px] md:text-[130px] lg:text-[120px] xl:text-[150px] tracking-tighter leading-none text-white uppercase font-sans whitespace-nowrap">
                  CAMPUX
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (Interactive Showcase Panel) ================= */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col">
          <div className="h-full rounded-3xl sm:rounded-[36px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative">
            
            {/* Top Bar of right panel with "Get started" button */}
            <div className="flex items-center justify-between pb-6 sm:pb-8">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Campus Marketplace Live
                </span>
              </div>

              <Link
                to={isAuthenticated ? '/profile' : '/register'}
                className="px-5 py-2 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {isAuthenticated ? 'My Profile' : 'Get started'}
              </Link>
            </div>

            {/* Product Showcase Carousel: Animated Transition moving from Right to Left */}
            <div className="my-auto py-4 overflow-hidden relative marquee-container">
              {/* Fade gradients on edges */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>

              {/* Carousel tracks with CSS marquee: pauses in place on hover without resetting */}
              <div
                className="flex gap-4 sm:gap-5 pb-2 animate-marquee-slow select-none"
              >
                {/* Render items twice to ensure seamless infinite looping */}
                {[...SHOWCASE_PRODUCTS, ...SHOWCASE_PRODUCTS].map((product, idx) => (
                  <div
                    key={`${product.id}-${idx}`}
                    className="w-[260px] sm:w-[280px] shrink-0 rounded-2xl bg-[#121212] border border-white/10 p-4 sm:p-5 flex flex-col justify-between hover:border-white/30 hover:bg-[#161616] transition-all hover:-translate-y-1 group"
                  >
                    {/* Top tag */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        {product.category}
                      </span>
                      <Link
                        to={isAuthenticated ? '/profile' : '/register'}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white text-zinc-300 hover:text-black text-[10px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>{product.tag}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Graphic illustration */}
                    <div className={`my-2 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl ${product.imageBackdrop}`}>
                      <img
                        src={product.image}
                        alt={product.imageAlt}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* Title & Description */}
                    <div className="pt-3">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mb-1 group-hover:text-zinc-200 transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-xs text-zinc-400 font-light line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 sm:pt-8 flex items-center justify-end border-t border-white/10 text-[11px] text-zinc-500 font-mono">
                Hover the carousel to pause • Click to explore
          </div>
        </div>

      </div>
      </div>
      </section>

      <section
        id="about"
        ref={aboutRef}
        className="px-4 pt-12 pb-20 sm:px-6 sm:pt-16 sm:pb-28 lg:px-8"
      >
        <div className="mx-auto grid w-full max-w-[1216px] gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className={`about-reveal lg:col-span-7 ${isAboutVisible ? 'is-visible' : ''}`}>
            <div className="group relative overflow-hidden rounded-[28px] sm:rounded-[36px]">
              <img
                key={ABOUT_PHOTOS[activeAboutPhoto].image}
                src={ABOUT_PHOTOS[activeAboutPhoto].image}
                alt={ABOUT_PHOTOS[activeAboutPhoto].alt}
                loading="lazy"
                decoding="async"
                className="about-photo-enter aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] sm:aspect-[16/10]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-5 pb-5 pt-16 sm:px-7 sm:pb-7">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/70">Good finds stay in the community</p>
                <p className="mt-1 text-lg font-medium tracking-tight text-white sm:text-xl">
                  {ABOUT_PHOTOS[activeAboutPhoto].caption}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                aria-label="Show previous campus photo"
                onClick={() => setActiveAboutPhoto((current) => (current - 1 + ABOUT_PHOTOS.length) % ABOUT_PHOTOS.length)}
                className="rounded-full p-2 text-zinc-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2" role="group" aria-label="Choose a campus photo">
                {ABOUT_PHOTOS.map((photo, index) => (
                  <button
                    key={photo.image}
                    type="button"
                    aria-label={`Show campus photo ${index + 1}`}
                    aria-pressed={activeAboutPhoto === index}
                    onClick={() => setActiveAboutPhoto(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 ${activeAboutPhoto === index ? 'w-7 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/70'}`}
                  />
                ))}
              </div>

              <span className="font-mono text-[10px] text-zinc-500" aria-live="polite">
                {String(activeAboutPhoto + 1).padStart(2, '0')} / {String(ABOUT_PHOTOS.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                aria-label="Show next campus photo"
                onClick={() => setActiveAboutPhoto((current) => (current + 1) % ABOUT_PHOTOS.length)}
                className="rounded-full p-2 text-zinc-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className={`about-reveal lg:col-span-5 ${isAboutVisible ? 'is-visible' : ''}`} style={{ '--reveal-delay': '160ms' }}>
            <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              About the platform
            </span>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Campus life works better when we share.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400 sm:text-base">
              Campux brings students together around the things they need, use, and pass along. Less searching far away, more useful finds right around campus.
            </p>

            <div className="mt-8 flex gap-7 border-b border-white/10" role="group" aria-label="Ways to use Campux">
              {Object.entries(ABOUT_MODES).map(([mode, content]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={activeAboutMode === mode}
                  onClick={() => setActiveAboutMode(mode)}
                  className={`relative pb-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 ${activeAboutMode === mode ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {content.label}
                  <span className={`absolute inset-x-0 -bottom-px h-px bg-white transition-transform duration-300 ${activeAboutMode === mode ? 'scale-x-100' : 'scale-x-0'}`} />
                </button>
              ))}
            </div>

            <div
              key={activeAboutMode}
              aria-live="polite"
              className="about-mode-copy pt-5"
            >
              <h3 className="text-lg font-medium tracking-tight text-white sm:text-xl">
                {ABOUT_MODES[activeAboutMode].title}
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-7 text-zinc-400">
                {ABOUT_MODES[activeAboutMode].description}
              </p>
              <Link
                to={isAuthenticated ? '/profile' : '/register'}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-emerald-300"
              >
                {ABOUT_MODES[activeAboutMode].action}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
