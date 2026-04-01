import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, Heart, Shield } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 87, suffix: '%', label: 'feel better within 2 weeks', icon: TrendingUp },
  { value: 4.9, suffix: '/5', label: 'session rating', icon: Heart },
  { value: 100, suffix: '%', label: 'private by design', icon: Shield },
];

function AnimatedNumber({ value, suffix }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(
          { val: 0 },
          {
            val: value,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: function () {
              setDisplayValue(Number(this.targets()[0].val.toFixed(1)));
            },
          }
        );
      },
      once: true,
    });

    return () => trigger.kill();
  }, [value]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
}

export default function Dashboard() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const bodyRef = useRef(null);
  const statsRef = useRef(null);
  const dashboardRef = useRef(null);

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

      // Body animation
      gsap.fromTo(
        bodyRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: 0.1,
          scrollTrigger: {
            trigger: bodyRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Stats animation
      gsap.fromTo(
        statsRef.current?.children || [],
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Dashboard card animation
      gsap.fromTo(
        dashboardRef.current,
        { x: '10vw', opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: dashboardRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-flowing bg-[#F5EDE4] z-[60] py-24 md:py-32"
    >
      <div className="px-[6vw]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            <h2
              ref={headingRef}
              className="text-headline text-[#111111] mb-6 will-change-transform"
            >
              Your progress, visualized.
            </h2>

            <p
              ref={bodyRef}
              className="text-subhead mb-10 will-change-transform"
            >
              See patterns, celebrate wins, and adjust your routine with insights that actually make sense.
            </p>
          </div>

          {/* Right Dashboard Preview */}
          <div
            ref={dashboardRef}
            className="bg-white border border-[#111111] p-6 will-change-transform"
          >
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#111111]">Your Mood Journey</h3>
              <span className="text-micro text-[#6B6B6B]">Last 30 days</span>
            </div>

            {/* Mood Chart */}
            <div className="mb-6">
              <div className="h-32 flex items-end gap-2">
                {[65, 45, 70, 55, 80, 60, 75, 50, 85, 65, 70, 90].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${height}%`,
                      backgroundColor: i === 11 ? '#F5B94A' : '#F5EDE4',
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-[#6B6B6B]">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="border-t border-[#111111] pt-4">
              <h4 className="font-medium text-sm text-[#111111] mb-3">Weekly Insights</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#7CBDB6]" />
                  <p className="text-sm text-[#6B6B6B]">Mood improved 23% this week</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#D85A7D]" />
                  <p className="text-sm text-[#6B6B6B]">Best day: Wednesday</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F5B94A]" />
                  <p className="text-sm text-[#6B6B6B]">4 sessions completed</p>
                </div>
              </div>
            </div>

            {/* Goal Card */}
            <div className="mt-4 bg-[#F5EDE4] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111111]">Current Goal</p>
                  <p className="text-xs text-[#6B6B6B]">Practice mindfulness 3x/week</p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-[#F5B94A] flex items-center justify-center">
                  <span className="text-sm font-bold">75%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
