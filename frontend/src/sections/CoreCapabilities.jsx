import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mic, Brain, FileText, LineChart, Target, Shield } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const capabilities = [
  {
    title: 'Voice & Text',
    description: 'Chat or talk naturally.',
    icon: Mic,
  },
  {
    title: 'Emotion-aware',
    description: 'Responses that match your state.',
    icon: Brain,
  },
  {
    title: 'Session Summaries',
    description: 'Key takeaways, saved privately.',
    icon: FileText,
  },
  {
    title: 'Mood Tracking',
    description: 'Spot patterns over time.',
    icon: LineChart,
  },
  {
    title: 'Personalized Goals',
    description: 'Small steps, big progress.',
    icon: Target,
  },
  {
    title: 'Crisis Resources',
    description: 'Immediate help when needed.',
    icon: Shield,
  },
];

export default function CoreCapabilities() {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const headlineRef = useRef(null);
  const subheadRef = useRef(null);
  const cardsRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        panelRef.current,
        { y: '-60vh' },
        { y: 0, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        headlineRef.current,
        { x: '-40vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.06
      );

      scrollTl.fromTo(
        subheadRef.current,
        { y: '6vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.12
      );

      // Cards stagger from bottom
      const cards = cardsRef.current?.children;
      if (cards) {
        scrollTl.fromTo(
          cards,
          { y: '40vh', opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.02, ease: 'none' },
          0
        );
      }

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        [panelRef.current, headlineRef.current, subheadRef.current],
        { y: 0, opacity: 1 },
        { y: '-18vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      if (cards) {
        scrollTl.fromTo(
          cards,
          { y: 0, opacity: 1 },
          { y: '12vh', opacity: 0, ease: 'power2.in' },
          0.7
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-[#F5EDE4] z-40"
    >
      {/* Amber Panel */}
      <div
        ref={panelRef}
        className="absolute top-0 left-0 w-full h-[52vh] bg-[#F5B94A] will-change-transform"
      />

      {/* Content */}
      <div className="relative h-full">
        {/* Headline on Amber */}
        <h2
          ref={headlineRef}
          className="absolute top-[14vh] left-[6vw] text-headline text-[#111111] max-w-[70vw] will-change-transform"
        >
          Built for real conversations.
        </h2>

        {/* Subhead on Amber */}
        <p
          ref={subheadRef}
          className="absolute top-[34vh] left-[6vw] text-lg text-[#111111] max-w-[46vw] will-change-transform"
        >
          Privacy-first design. Clinically informed. Always improving.
        </p>

        {/* Capability Cards */}
        <div
          ref={cardsRef}
          className="absolute top-[46vh] left-[6vw] right-[6vw] grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
        >
          {capabilities.map((cap, index) => (
            <div
              key={cap.title}
              className="feature-card bg-white will-change-transform"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className="w-10 h-10 rounded-full bg-[#F5EDE4] flex items-center justify-center mb-4">
                <cap.icon className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] mb-2">
                {cap.title}
              </h3>
              <p className="text-sm text-[#6B6B6B]">
                {cap.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
