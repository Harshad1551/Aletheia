import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

export default function Closing() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const bodyRef = useRef(null);
  const ctaRef = useRef(null);
  const contactRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(headlineRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, scrollTrigger: { trigger: headlineRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(bodyRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.1, scrollTrigger: { trigger: bodyRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.2, scrollTrigger: { trigger: ctaRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(contactRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.3, scrollTrigger: { trigger: contactRef.current, start: 'top 85%', toggleActions: 'play none none reverse' } });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-flowing bg-[#111111] z-[100] py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08] mix-blend-screen pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      <div className="px-[6vw] relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 ref={headlineRef} className="text-headline text-[#F5EDE4] mb-6 will-change-transform">Ready when you are.</h2>
            <p ref={bodyRef} className="text-lg text-[#6B6B6B] mb-8 max-w-md will-change-transform">Take five minutes. Tell Aletheia what's on your mind. No pressure, no appointment needed.</p>
            <button ref={ctaRef} className="btn-primary rounded-sm will-change-transform hover:scale-105" style={{ boxShadow: '0 10px 30px rgba(245, 185, 74, 0.3)' }} onClick={() => navigate('/signup')}>Start a free session</button>
            <div ref={contactRef} className="mt-12 pt-8 border-t border-[#333333] will-change-transform">
              <div className="flex flex-wrap items-center gap-6 text-micro">
                <a href="mailto:hello@aletheia.app" className="text-[#6B6B6B] hover:text-[#F5EDE4] transition-colors">hello@aletheia.app</a>
                <a href="#" className="text-[#6B6B6B] hover:text-[#F5EDE4] transition-colors">Privacy</a>
                <a href="#" className="text-[#6B6B6B] hover:text-[#F5EDE4] transition-colors">Terms</a>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-6">© 2026 Aletheia. All rights reserved.</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative w-full aspect-[4/5] border border-[#F5EDE4] overflow-hidden">
              <img
                src="/images/Woman Using Smartphone.png"
                alt="Your journey starts here"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
