import React, { RefObject, useEffect, useRef } from 'react';

interface RiverPathProps {
  headerRef: RefObject<HTMLElement>;
  footerRef: RefObject<HTMLElement>;
  nodeRefs: Array<RefObject<HTMLElement>>;
}

const RiverPath: React.FC<RiverPathProps> = ({ headerRef, footerRef, nodeRefs }) => {
  const svgPathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    if (!svgPathRef.current) return;

    const pathElement = svgPathRef.current;

    const calculateAndDrawPath = () => {
      const header = headerRef.current;
      const footer = footerRef.current;
      const nodes = nodeRefs
        .map((ref) => ref.current)
        .filter((element): element is HTMLElement => Boolean(element));

      if (!header || !footer || nodes.length === 0) {
        return;
      }

      const isMobile = window.innerWidth < 768;
      const pathStartX = window.innerWidth / 2;
      let pathData = `M ${pathStartX} ${header.offsetHeight}`;
      let lastY = header.offsetHeight;

      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const nodeConnectX = isMobile
          ? pathStartX
          : index % 2 === 0
          ? rect.left + rect.width + window.scrollX
          : rect.left + window.scrollX;
        const nodeCenterY = rect.top + window.scrollY + rect.height / 2;

        const controlPointY1 = lastY + (nodeCenterY - lastY) * 0.5;
        const controlPointY2 = nodeCenterY - (nodeCenterY - lastY) * 0.5;

        pathData += ` C ${pathStartX} ${controlPointY1}, ${nodeConnectX} ${controlPointY2}, ${nodeConnectX} ${nodeCenterY}`;
        lastY = nodeCenterY;
      });

      const footerRect = footer.getBoundingClientRect();
      const footerTop = footerRect.top + window.scrollY;
      pathData += ` L ${pathStartX} ${footerTop}`;

      pathElement.setAttribute('d', pathData);
      const pathLength = pathElement.getTotalLength();
      pathElement.style.strokeDasharray = `${pathLength}`;
      pathElement.style.strokeDashoffset = `${pathLength}`;

      updatePathAnimation(pathLength);
    };

    const updatePathAnimation = (pathLength: number) => {
      if (pathLength <= 0) return;
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        pathElement.style.strokeDashoffset = '0';
        return;
      }
      const scrollPercentage = Math.min(1, Math.max(0, window.scrollY / scrollableHeight));
      const drawLength = pathLength * scrollPercentage * 1.2;
      pathElement.style.strokeDashoffset = `${Math.max(0, pathLength - drawLength)}`;
    };

    let resizeTimer: number | undefined;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const pathLength = pathElement.getTotalLength();
        updatePathAnimation(pathLength);
        ticking = false;
      });
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(calculateAndDrawPath, 200);
    };

    calculateAndDrawPath();
    const initTimer = window.setTimeout(calculateAndDrawPath, 150);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.clearTimeout(initTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [footerRef, headerRef, nodeRefs]);

  return (
    <div id="svg-path-container" aria-hidden="true">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="hand-drawn-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <path ref={svgPathRef} id="river-path" fill="none" />
      </svg>
    </div>
  );
};

export default RiverPath;
