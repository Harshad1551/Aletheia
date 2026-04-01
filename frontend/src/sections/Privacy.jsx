import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lock, EyeOff, Trash2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const privacyFeatures = [
  { title: 'End-to-end encryption', description: 'Your conversations are encrypted and secure.', icon: Lock, color: '#7CBDB6' },
  { title: 'No ads, no data brokers', description: 'We never sell your data or show you ads.', icon: EyeOff, color: '#D85A7D' },
  { title: 'Delete anytime', description: 'You have full control over your data.', icon: Trash2, color: '#F27B53' },
];

export default function Privacy() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const bodyRef = useRef(null);
  const cardsRef = useRef(null);
  const microcopyRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: headingRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(bodyRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.1, scrollTrigger: { trigger: bodyRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } });
      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.fromTo(cards, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, scrollTrigger: { trigger: cardsRef.current, start: 'top 70%', toggleActions: 'play none none reverse' } });
      }
      gsap.fromTo(microcopyRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: microcopyRef.current, start: 'top 85%', toggleActions: 'play none none reverse' } });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-flowing bg-[#F5EDE4] z-[70] py-24 md:py-32">
      <div className="px-[6vw]">
        <h2 ref={headingRef} className="text-headline text-[#111111] mb-4 will-change-transform">You're in control.</h2>
        <p ref={bodyRef} className="text-subhead max-w-2xl mb-12 will-change-transform">Your data is encrypted, anonymized, and never sold. You can delete your history anytime.</p>
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {privacyFeatures.map((f) => (
            <div key={f.title} className="feature-card bg-white will-change-transform">
              <div className="icon-wrapper w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: f.color }}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">{f.title}</h3>
              <p className="text-sm text-[#6B6B6B]">{f.description}</p>
            </div>
          ))}
        </div>
        <p ref={microcopyRef} className="text-micro text-[#6B6B6B] text-center will-change-transform">Aletheia is built to support—not replace—professional care when you need it.</p>
      </div>
    </section>
  );
}
