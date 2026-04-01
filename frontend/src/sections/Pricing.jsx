import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: 'Free', monthlyPrice: 0, yearlyPrice: 0, description: 'Perfect for getting started',
    features: [{ text: 'Text sessions', included: true }, { text: 'Mood tracking', included: true }, { text: 'Crisis resources', included: true }, { text: 'Voice sessions', included: false }, { text: 'Detailed insights', included: false }, { text: 'Priority support', included: false }],
    cta: 'Get started', popular: false
  },
  {
    name: 'Plus', monthlyPrice: 4, yearlyPrice: 2.5, description: 'For deeper personal growth',
    features: [{ text: 'Text sessions', included: true }, { text: 'Mood tracking', included: true }, { text: 'Crisis resources', included: true }, { text: 'Voice sessions', included: true }, { text: 'Detailed insights', included: true }, { text: 'Priority support', included: false }],
    cta: 'Start free trial', popular: false
  },
  {
    name: 'Pro', monthlyPrice: 7, yearlyPrice: 4.5, description: 'For power users',
    features: [{ text: 'Everything in Plus', included: true }, { text: 'Voice sessions', included: true }, { text: 'Detailed insights', included: true }, { text: 'Priority support', included: true }, { text: 'Custom exercises', included: true }, { text: 'Therapist matching', included: true }],
    cta: 'Start free trial', popular: true
  },
  {
    name: 'Premium', monthlyPrice: 11, yearlyPrice: 7.5, description: 'For organizations',
    features: [{ text: 'Everything in Pro', included: true }, { text: 'EAP integrations', included: true }, { text: 'Admin dashboard', included: true }, { text: 'Usage analytics', included: true }, { text: 'SSO & SAML', included: true }, { text: 'Dedicated support', included: true }],
    cta: 'Contact us', popular: false
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const toggleRef = useRef(null);
  const cardsRef = useRef(null);
  const [isYearly, setIsYearly] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: headingRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(toggleRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, scrollTrigger: { trigger: toggleRef.current, start: 'top 75%', toggleActions: 'play none none reverse' } });
      const cards = cardsRef.current?.children;
      if (cards) { gsap.fromTo(cards, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, scrollTrigger: { trigger: cardsRef.current, start: 'top 70%', toggleActions: 'play none none reverse' } }); }
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-flowing bg-[#F5EDE4] z-[90] py-24 md:py-32">
      <div className="px-[6vw]">
        <h2 ref={headingRef} className="text-headline text-[#111111] mb-8 text-center will-change-transform">Start free. Upgrade when you're ready.</h2>
        <div ref={toggleRef} className="flex items-center justify-center gap-4 mb-12 will-change-transform">
          <span className={`text-sm ${!isYearly ? 'font-medium text-[#111111]' : 'text-[#6B6B6B]'}`}>Monthly</span>
          <button onClick={() => setIsYearly(!isYearly)} className="relative w-14 h-7 bg-[#111111] rounded-full transition-colors">
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isYearly ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm ${isYearly ? 'font-medium text-[#111111]' : 'text-[#6B6B6B]'}`}>Yearly</span>
          <span className="text-micro text-[#F5B94A]">Save 20%</span>
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`feature-card bg-white will-change-transform relative ${plan.popular ? 'border-2 border-[#F5B94A]' : ''}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F5B94A] px-4 py-1 text-xs font-medium text-[#111111]">Most Popular</div>}
              <h3 className="text-xl font-bold text-[#111111] mb-2">{plan.name}</h3>
              <p className="text-sm text-[#6B6B6B] mb-4">{plan.description}</p>
              <div className="mb-6">
                {plan.monthlyPrice !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#111111]">${isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                    <span className="text-[#6B6B6B]">/month</span>
                  </div>
                ) : <span className="text-2xl font-bold text-[#111111]">Contact us</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-3">
                    {f.included ? <Check className="w-5 h-5 text-[#7CBDB6]" /> : <X className="w-5 h-5 text-[#6B6B6B]" />}
                    <span className={`text-sm ${f.included ? 'text-[#111111]' : 'text-[#6B6B6B]'}`}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/signup')} className={`w-full py-3 rounded-sm font-medium transition-all duration-300 ${plan.popular ? 'bg-[#F5B94A] text-[#111111] hover:scale-105' : 'border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white'}`}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
