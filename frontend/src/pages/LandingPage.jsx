import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Hero from '../sections/Hero';
import MeetYourTherapist from '../sections/MeetYourTherapist';
import HowItWorks from '../sections/HowItWorks';
import CoreCapabilities from '../sections/CoreCapabilities';
import InsideSession from '../sections/InsideSession';
import Dashboard from '../sections/Dashboard';
import Privacy from '../sections/Privacy';
import Testimonials from '../sections/Testimonials';
import Pricing from '../sections/Pricing';
import Closing from '../sections/Closing';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const mainRef = useRef(null);
  const snapTriggerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter((st) => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map((st) => {
        const start = st.start / maxScroll;
        const end = (st.end ?? st.start) / maxScroll;
        const settleRatio = 0.5;
        const center = start + (end - start) * settleRatio;
        return { start, end, center };
      });

      snapTriggerRef.current = ScrollTrigger.create({
        snap: {
          snapTo: (value) => {
            const inPinned = pinnedRanges.some(
              (r) => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            if (!inPinned) return value;
            const target = pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (snapTriggerRef.current) snapTriggerRef.current.kill();
    };
  }, []);

  useEffect(() => {
    return () => { ScrollTrigger.getAll().forEach((st) => st.kill()); };
  }, []);

  return (
    <>
      <div className="grain-overlay" />
      <main ref={mainRef} className="relative">
        <Hero />
        <MeetYourTherapist />
        <HowItWorks />
        <CoreCapabilities />
        <InsideSession />
        <Dashboard />
        <Privacy />
        <Testimonials />
        <Pricing />
        <Closing />
      </main>
    </>
  );
}
