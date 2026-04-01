import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageSquare, Compass, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Check in',
    description: 'Share what\'s on your mind, in your own words. No pressure, no judgment.',
    icon: MessageSquare,
    color: '#7CBDB6',
  },
  {
    number: '02',
    title: 'Explore',
    description: 'Work through thoughts with techniques that adapt to your unique needs.',
    icon: Compass,
    color: '#D85A7D',
  },
  {
    number: '03',
    title: 'Keep momentum',
    description: 'Track patterns and build habits that stick with personalized insights.',
    icon: TrendingUp,
    color: '#F27B53',
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef(null);
  const pathRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        headingRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards stagger animation
      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.fromTo(
          cards,
          { y: '10vh', opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.15,
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Path draw animation
      if (pathRef.current) {
        const pathLength = pathRef.current.getTotalLength();
        gsap.set(pathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            end: 'bottom 40%',
            scrub: 0.5,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-flowing bg-[#F5EDE4] z-30 py-24 md:py-32"
    >
      <div className="px-[6vw]">
        {/* Heading */}
        <h2
          ref={headingRef}
          className="text-headline text-[#111111] mb-16 will-change-transform"
        >
          How it works
        </h2>

        {/* Steps Grid */}
        <div className="relative">
          {/* Decorative Path (desktop only) */}
          <svg
            className="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2 hidden lg:block"
            viewBox="0 0 1200 80"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              ref={pathRef}
              d="M0 40 Q 200 10, 400 40 T 800 40 T 1200 40"
              stroke="#F5B94A"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Cards */}
          <div
            ref={cardsRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {steps.map((step) => (
              <div
                key={step.number}
                className="feature-card bg-white will-change-transform"
              >
                {/* Step Number */}
                <div
                  className="text-micro mb-4"
                  style={{ color: step.color }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: step.color }}
                >
                  <step.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-[#111111] mb-3">
                  {step.title}
                </h3>
                <p className="text-[#6B6B6B] text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Row */}
        <div className="flex flex-wrap gap-4 mt-12">
          <button className="btn-primary rounded-sm" onClick={() => navigate('/signup')}>
            Start your first session
          </button>
          <button className="btn-outline rounded-sm" onClick={() => {
            const el = document.querySelector('[class*="z-40"]');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}>
            See features
          </button>
        </div>
      </div>
    </section>
  );
}
