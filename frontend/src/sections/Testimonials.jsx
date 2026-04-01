import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  { quote: "I didn't expect an AI to actually listen. It helped me show up for myself between therapy sessions.", name: 'Jordan' },
  { quote: "The summaries keep me grounded. I can see how far I've come.", name: 'Priya' },
  { quote: "It's like a check-in with a friend who remembers everything—and never judges.", name: 'Alex' },
];

export default function Testimonials() {
  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const stackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: '+=130%', pin: true, scrub: 0.6 } });
      scrollTl.fromTo(headlineRef.current, { y: '-10vh', opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0);
      scrollTl.fromTo(stackRef.current, { y: '60vh', opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.1);
      const cardTexts = stackRef.current?.querySelectorAll('.card-text');
      if (cardTexts) { scrollTl.fromTo(cardTexts, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, ease: 'none' }, 0.18); }
      scrollTl.fromTo(stackRef.current, { x: 0, opacity: 1 }, { x: '18vw', opacity: 0, ease: 'power2.in' }, 0.7);
      scrollTl.fromTo(headlineRef.current, { opacity: 1 }, { opacity: 0, ease: 'power2.in' }, 0.7);
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-pinned bg-[#F5EDE4] z-[80]">
      <div className="relative h-full flex flex-col items-center">
        <h2 ref={headlineRef} className="text-headline text-[#111111] mt-[12vh] mb-8 text-center will-change-transform">Real people. Real progress.</h2>
        <div ref={stackRef} className="relative w-[min(72vw,980px)] h-[44vh] will-change-transform">
          {testimonials.map((t, index) => {
            const offset = (index - activeIndex) * 20;
            const scale = 1 - (index - activeIndex) * 0.05;
            const opacity = index < activeIndex ? 0 : 1 - (index - activeIndex) * 0.3;
            return (
              <div key={t.name} className="absolute inset-0 bg-[#F5EDE4] border border-[#111111] p-8 md:p-12 transition-all duration-500 cursor-pointer"
                style={{ transform: `translateY(${offset}px) scale(${Math.max(scale, 0.9)})`, opacity: Math.max(opacity, 0), zIndex: testimonials.length - index }}
                onClick={() => setActiveIndex((prev) => (prev + 1) % testimonials.length)}>
                <Quote className="w-10 h-10 text-[#F5B94A] mb-6" />
                <p className="card-text text-xl md:text-2xl text-[#111111] leading-relaxed mb-8">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7CBDB6] to-[#D85A7D] flex items-center justify-center text-white font-bold">{t.name[0]}</div>
                  <span className="font-medium text-[#111111]">{t.name}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button key={index} onClick={() => setActiveIndex(index)} className={`w-2 h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-[#F5B94A] w-6' : 'bg-[#111111] opacity-30'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
