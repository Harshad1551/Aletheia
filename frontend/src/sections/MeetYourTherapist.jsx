import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageCircle, Mic, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

export default function MeetYourTherapist() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const mediaCardRef = useRef(null);
  const headlineRef = useRef(null);
  const bodyRef = useRef(null);
  const ctaRef = useRef(null);
  const portraitRef = useRef(null);

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
        mediaCardRef.current,
        { x: '-60vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        headlineRef.current,
        { x: '40vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.06
      );

      scrollTl.fromTo(
        [bodyRef.current, ctaRef.current],
        { y: '8vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.12
      );

      scrollTl.fromTo(
        portraitRef.current,
        { y: '-10vh', scale: 0.9, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'none' },
        0.1
      );

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        mediaCardRef.current,
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        headlineRef.current,
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        [bodyRef.current, ctaRef.current],
        { y: 0, opacity: 1 },
        { y: '10vh', opacity: 0, ease: 'power2.in' },
        0.75
      );

      scrollTl.fromTo(
        portraitRef.current,
        { y: 0, opacity: 1 },
        { y: '-8vh', opacity: 0, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-[#F5EDE4] z-20"
    >
      <div className="relative h-full flex items-center">
        {/* Left Media Card - Chat UI Mock */}
        <div
          ref={mediaCardRef}
          className="hidden lg:block absolute left-[6vw] top-[18vh] w-[42vw] h-[56vh] bg-white border border-[#111111] will-change-transform overflow-hidden"
        >
          {/* Chat UI Header */}
          <div className="bg-[#111111] text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F5B94A] flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#111111]" />
            </div>
            <div>
              <p className="font-medium text-sm">Aletheia</p>
              <p className="text-xs text-[#6B6B6B]">Online</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-4 space-y-4 h-[calc(100%-140px)] overflow-hidden">
            {/* AI Message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F5B94A] flex-shrink-0 flex items-center justify-center">
                <Heart className="w-4 h-4 text-[#111111]" />
              </div>
              <div className="bg-[#F5EDE4] rounded-lg rounded-tl-none p-3 max-w-[80%]">
                <p className="text-sm">Hi there! I'm Aletheia. How are you feeling today?</p>
              </div>
            </div>

            {/* User Message */}
            <div className="flex gap-3 justify-end">
              <div className="bg-[#111111] text-white rounded-lg rounded-tr-none p-3 max-w-[80%]">
                <p className="text-sm">I've been feeling a bit anxious lately...</p>
              </div>
            </div>

            {/* AI Message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F5B94A] flex-shrink-0 flex items-center justify-center">
                <Heart className="w-4 h-4 text-[#111111]" />
              </div>
              <div className="bg-[#F5EDE4] rounded-lg rounded-tl-none p-3 max-w-[80%]">
                <p className="text-sm">I hear you. Anxiety can be really challenging. Would you like to talk about what's been on your mind?</p>
              </div>
            </div>

            {/* User Message */}
            <div className="flex gap-3 justify-end">
              <div className="bg-[#111111] text-white rounded-lg rounded-tr-none p-3 max-w-[80%]">
                <p className="text-sm">Work has been overwhelming...</p>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#111111]">
            <div className="flex gap-2">
              <div className="flex-1 bg-[#F5EDE4] rounded-full px-4 py-2 text-sm text-[#6B6B6B]">
                Type a message...
              </div>
              <button className="w-10 h-10 rounded-full bg-[#F5B94A] flex items-center justify-center">
                <Mic className="w-5 h-5 text-[#111111]" />
              </button>
              <button className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Small Portrait Insert */}
        <div
          ref={portraitRef}
          className="hidden lg:block absolute left-[40vw] top-[14vh] w-[12vw] h-[12vw] border-4 border-[#F5EDE4] rounded-full overflow-hidden will-change-transform z-10"
        >
          <div className="w-full h-full bg-gradient-to-br from-[#7CBDB6] to-[#D85A7D] flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
        </div>

        {/* Right Content */}
        <div className="w-full lg:w-[40vw] lg:absolute lg:right-[6vw] lg:top-[30vh] px-[6vw] lg:px-0">
          <h2
            ref={headlineRef}
            className="text-headline text-[#111111] mb-6 will-change-transform"
          >
            Meet your AI therapist.
          </h2>

          <p
            ref={bodyRef}
            className="text-subhead mb-8 will-change-transform"
          >
            Text or talk. Aletheia listens, understands, and helps you navigate what's going on—without judgment.
          </p>

          <button
            ref={ctaRef}
            className="btn-primary rounded-sm will-change-transform"
            onClick={() => navigate('/login')}
          >
            Try a demo chat
          </button>
        </div>
      </div>
    </section>
  );
}
