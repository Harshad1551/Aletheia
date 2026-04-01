import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const subheadRef = useRef(null);
  const ctaRef = useRef(null);
  const portraitRef = useRef(null);
  const scrollHintRef = useRef(null);
  const stripsRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Auto-play entrance animation
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Color strips slide in
      tl.fromTo(
        stripsRef.current?.children || [],
        { x: '120%' },
        { x: '0%', duration: 0.4, stagger: 0.05 },
        0
      );

      // Headline lines rise + fade
      tl.fromTo(
        headlineRef.current?.children || [],
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
        0.15
      );

      // Subheadline + CTAs fade up
      tl.fromTo(
        [subheadRef.current, ctaRef.current],
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 },
        0.45
      );

      // Hero portrait slides in
      tl.fromTo(
        portraitRef.current,
        { x: '18vw', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7 },
        0.35
      );

      // Scroll hint fades in
      tl.fromTo(
        scrollHintRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 },
        0.85
      );

      // Scroll-driven exit animation (pinned)
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            gsap.set([headlineRef.current?.children, subheadRef.current, ctaRef.current, portraitRef.current], {
              opacity: 1,
              x: 0,
              y: 0,
            });
          },
        },
      });

      // EXIT phase (70% - 100%)
      scrollTl.fromTo(
        headlineRef.current,
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        portraitRef.current,
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        [subheadRef.current, ctaRef.current],
        { y: 0, opacity: 1 },
        { y: '10vh', opacity: 0, ease: 'power2.in' },
        0.75
      );

      scrollTl.fromTo(
        scrollHintRef.current,
        { opacity: 1 },
        { opacity: 0 },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-[#F5EDE4] z-10"
    >
      {/* Color Strips Navigation */}
      <div
        ref={stripsRef}
        className="fixed right-0 top-0 h-full flex flex-col z-50 hidden lg:flex"
      >
        <div className="color-strip strip-teal" title="Home" />
        <div className="color-strip strip-pink" title="How it works" />
        <div className="color-strip strip-coral" title="Features" />
        <div className="color-strip strip-amber" title="Pricing" />
      </div>

      {/* Logo */}
      <div className="absolute top-[4vh] left-[4vw] z-20">
        <span className="text-2xl font-bold tracking-tight">Aletheia</span>
      </div>

      {/* CTA Button */}
      <div className="absolute top-[4vh] right-[calc(4vw+3rem)] z-20 hidden lg:block">
        <button className="btn-primary text-sm rounded-sm" onClick={() => navigate('/signup')}>
          Talk to Aletheia
        </button>
      </div>

      {/* Main Content */}
      <div className="relative h-full flex items-center">
        {/* Left Content */}
        <div className="w-full lg:w-[50vw] pl-[6vw] pr-[6vw] lg:pr-0 pt-20 lg:pt-0">
          {/* Headline */}
          <div ref={headlineRef} className="mb-6">
            <h1 className="text-display text-[#111111]">AI therapy</h1>
            <h1 className="text-display text-[#111111]">that actually gets you.</h1>
          </div>

          {/* Subheadline */}
          <p
            ref={subheadRef}
            className="text-subhead max-w-[34vw] mb-8 hidden lg:block"
          >
            Private, personalized sessions. Real-time insights. Always available.
          </p>
          <p className="text-subhead mb-8 lg:hidden">
            Private, personalized sessions. Real-time insights. Always available.
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-wrap gap-4">
            <button className="btn-primary rounded-sm" onClick={() => navigate('/signup')}>Start a free session</button>
            <button className="btn-outline rounded-sm" onClick={() => {
              const el = document.querySelector('.section-flowing');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}>See how it works</button>
          </div>
        </div>

        {/* Right Portrait */}
        <div
          ref={portraitRef}
          className="hidden lg:block absolute right-[8vw] top-[18vh] w-[30vw] h-[38vw] border border-[#111111] overflow-hidden will-change-transform"
        >
          <img
            src="/images/Woman at Desk with Laptop.png"
            alt="Hero portrait"
            className="w-full h-full object-cover object-[20%_center]"
          />
        </div>
      </div>

      {/* Scroll Hint */}
      <div
        ref={scrollHintRef}
        className="absolute bottom-[8vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-micro text-[#6B6B6B]">Scroll to explore</span>
        <ChevronDown className="w-4 h-4 text-[#6B6B6B] animate-bounce" />
      </div>
    </section>
  );
}
