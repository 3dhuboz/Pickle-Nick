import { useLayoutEffect, type RefObject } from 'react';

export const usePageMotion = (rootRef: RefObject<HTMLElement | null>, dependencyKey = '') => {
  useLayoutEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (cancelled || !rootRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const context = gsap.context(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;

        gsap.from('[data-reveal]', {
          y: 24,
          opacity: 0,
          duration: 0.82,
          stagger: 0.07,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        });

        gsap.utils.toArray<HTMLElement>('[data-scroll-reveal]').forEach((element, index) => {
          gsap.from(element, {
            y: 36,
            opacity: 0,
            duration: 0.86,
            delay: Math.min(index * 0.025, 0.12),
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: element,
              start: 'top 88%',
              once: true,
            },
          });
        });

        gsap.utils.toArray<HTMLElement>('[data-parallax-media]').forEach(element => {
          gsap.fromTo(element, { scale: 1.02 }, {
            scale: 1.08,
            yPercent: -2,
            ease: 'none',
            scrollTrigger: {
              trigger: element.parentElement || element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          });
        });
      }, rootRef);

      cleanup = () => context.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [dependencyKey, rootRef]);
};
