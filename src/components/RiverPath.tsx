
import React, { RefObject, useEffect, useRef } from 'react';

interface RiverPathProps {
  headerRef: RefObject<HTMLElement>;
  footerRef: RefObject<HTMLElement>;
  nodeRefs: Array<RefObject<HTMLElement>>;
  activeSceneIndex: number;
  sceneCount: number;
}

const RiverPath: React.FC<RiverPathProps> = ({
  headerRef,
  footerRef,
  nodeRefs,
  activeSceneIndex,
  sceneCount,
}) => {
  const svgPathRef = useRef<SVGPathElement | null>(null);
  const pathLengthRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const targetProgressRef = useRef(0);
  const activeAnimationRef = useRef<Animation | null>(null);

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
      pathLengthRef.current = pathLength;
      pathElement.style.strokeDasharray = `${pathLength}`;
      const targetOffset = pathLength * (1 - targetProgressRef.current);
      currentOffsetRef.current = targetOffset;
      pathElement.style.strokeDashoffset = `${targetOffset}`;
    };

    const onResize = () => {
      calculateAndDrawPath();
    };

    calculateAndDrawPath();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => calculateAndDrawPath());
      resizeObserver.observe(document.body);
    }
    window.addEventListener('resize', onResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [footerRef, headerRef, nodeRefs]);

  useEffect(() => {
    if (!svgPathRef.current) return;
    if (sceneCount <= 0) return;

    const pathElement = svgPathRef.current;
    const pathLength = pathLengthRef.current || pathElement.getTotalLength();
    if (!Number.isFinite(pathLength) || pathLength === 0) {
      return;
    }

    const progress = activeSceneIndex >= 0 ? Math.min(1, (activeSceneIndex + 1) / sceneCount) : 0;
    targetProgressRef.current = progress;

    const targetOffset = pathLength * (1 - progress);
    const currentOffset = currentOffsetRef.current || pathLength;

    if (activeAnimationRef.current) {
      activeAnimationRef.current.cancel();
    }

    const animation = pathElement.animate(
      [
        { strokeDashoffset: `${currentOffset}` },
        { strokeDashoffset: `${targetOffset}` },
      ],
      {
        duration: 900,
        easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
        fill: 'forwards',
      }
    );

    activeAnimationRef.current = animation;

    animation.onfinish = () => {
      pathElement.style.strokeDashoffset = `${targetOffset}`;
      currentOffsetRef.current = targetOffset;
    };

    animation.oncancel = () => {
      pathElement.style.strokeDashoffset = `${targetOffset}`;
      currentOffsetRef.current = targetOffset;
    };

    return () => {
      animation.cancel();
    };
  }, [activeSceneIndex, sceneCount]);

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
