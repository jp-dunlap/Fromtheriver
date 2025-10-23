import React, { useEffect, useRef } from 'react';

interface ContentNodeProps extends React.HTMLAttributes<HTMLElement> {
  alignment: 'left' | 'right';
  children: React.ReactNode;
}

const ContentNode = React.forwardRef<HTMLElement, ContentNodeProps>(
  ({ alignment, className = '', children, ...rest }, ref) => {
    const localRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      const element = (ref as React.MutableRefObject<HTMLElement | null>)?.current ?? localRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
      );

      observer.observe(element);
      return () => observer.disconnect();
    }, [ref]);

    const mergedRef = (node: HTMLElement | null) => {
      localRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    };

    const alignmentClass = alignment === 'left' ? 'justify-start' : 'justify-end';
    const composedClass = ['content-node node-container mb-24 md:mb-32 flex', alignmentClass, className]
      .filter(Boolean)
      .join(' ');

    return (
      <section ref={mergedRef} className={composedClass} {...rest}>
        {children}
      </section>
    );
  }
);

ContentNode.displayName = 'ContentNode';

export default ContentNode;
