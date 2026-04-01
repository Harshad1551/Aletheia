import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, MessageCircle, Mic, FileText, BarChart3, Target } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const frames = [
  {
    title: 'Chat that feels human',
    description: 'Natural conversations that adapt to your communication style.',
    icon: MessageCircle,
  },
  {
    title: 'Voice, when you need it',
    description: 'Speak freely and get thoughtful responses.',
    icon: Mic,
  },
  {
    title: 'Summaries you can revisit',
    description: 'Key insights from every session, saved securely.',
    icon: FileText,
  },
  {
    title: 'Mood trends at a glance',
    description: 'Track your emotional journey over time.',
    icon: BarChart3,
  },
  {
    title: 'Goals that grow with you',
    description: 'Personalized objectives based on your progress.',
    icon: Target,
  },
];

export default function InsideSession() {
  const sectionRef = useRef(null);
  const counterRef = useRef(null);
  const headlineRef = useRef(null);
  const buttonRef = useRef(null);
  const filmstripRef = useRef(null);
  const arrowsRef = useRef(null);

  const [currentFrame, setCurrentFrame] = useState(0);

  const nextFrame = () => {
    setCurrentFrame((prev) => (prev + 1) % frames.length);
  };

  const prevFrame = () => {
    setCurrentFrame((prev) => (prev - 1 + frames.length) % frames.length);
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        [counterRef.current, headlineRef.current, buttonRef.current],
        { y: '-10vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        filmstripRef.current,
        { y: '60vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.1
      );

      scrollTl.fromTo(
        arrowsRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'none' },
        0.18
      );

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        filmstripRef.current,
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        [counterRef.current, headlineRef.current, buttonRef.current],
        { y: 0, opacity: 1 },
        { y: '-8vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        arrowsRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-[#F5EDE4] z-50"
    >
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-[6vw] pt-[10vh]">
          {/* Counter */}
          <div
            ref={counterRef}
            className="text-micro text-[#6B6B6B] will-change-transform"
          >
            0{currentFrame + 1} / 0{frames.length}
          </div>

          {/* Headline */}
          <h2
            ref={headlineRef}
            className="text-headline text-[#111111] will-change-transform"
          >
            Inside a session.
          </h2>

          {/* View All Button */}
          <button
            ref={buttonRef}
            className="btn-outline text-sm rounded-sm will-change-transform hidden md:block"
          >
            View all features
          </button>
        </div>

        {/* Filmstrip Carousel */}
        <div
          ref={filmstripRef}
          className="flex-1 mx-[6vw] mt-8 filmstrip relative will-change-transform overflow-hidden"
        >
          {/* Frame Content */}
          <div className="absolute inset-x-8 inset-y-6 flex items-center justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-full">
              {/* Previous Frame Preview */}
              <div className="hidden md:flex items-center justify-center opacity-40">
                <div className="bg-[#F5EDE4] p-8 max-w-xs">
                  <div className="w-12 h-12 rounded-full bg-[#7CBDB6] flex items-center justify-center mb-4">
                    {(() => {
                      const Icon = frames[(currentFrame - 1 + frames.length) % frames.length].icon;
                      return <Icon className="w-6 h-6 text-white" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-bold text-[#111111] mb-2">
                    {frames[(currentFrame - 1 + frames.length) % frames.length].title}
                  </h3>
                </div>
              </div>

              {/* Current Frame */}
              <div className="col-span-1 md:col-span-1 flex items-center justify-center">
                <div className="bg-[#F5EDE4] p-8 max-w-sm w-full">
                  <div className="w-16 h-16 rounded-full bg-[#F5B94A] flex items-center justify-center mb-6">
                    {(() => {
                      const Icon = frames[currentFrame].icon;
                      return <Icon className="w-8 h-8 text-[#111111]" />;
                    })()}
                  </div>
                  <h3 className="text-2xl font-bold text-[#111111] mb-4">
                    {frames[currentFrame].title}
                  </h3>
                  <p className="text-[#6B6B6B]">
                    {frames[currentFrame].description}
                  </p>
                </div>
              </div>

              {/* Next Frame Preview */}
              <div className="hidden md:flex items-center justify-center opacity-40">
                <div className="bg-[#F5EDE4] p-8 max-w-xs">
                  <div className="w-12 h-12 rounded-full bg-[#D85A7D] flex items-center justify-center mb-4">
                    {(() => {
                      const Icon = frames[(currentFrame + 1) % frames.length].icon;
                      return <Icon className="w-6 h-6 text-white" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-bold text-[#111111] mb-2">
                    {frames[(currentFrame + 1) % frames.length].title}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div
          ref={arrowsRef}
          className="absolute top-1/2 left-0 right-0 flex justify-between px-[4vw] -translate-y-1/2 pointer-events-none will-change-transform"
        >
          <button
            onClick={prevFrame}
            className="w-12 h-12 rounded-full bg-white border border-[#111111] flex items-center justify-center pointer-events-auto hover:bg-[#111111] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextFrame}
            className="w-12 h-12 rounded-full bg-white border border-[#111111] flex items-center justify-center pointer-events-auto hover:bg-[#111111] hover:text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
