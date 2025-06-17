/* --- Fromtheriver.org | script.js --- */
/* Logic for "The Unfolding Map" concept - V2 (Optimized for Smooth Scrolling) */

// Wait for the entire HTML document to be loaded and parsed before running the script.
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const contentNodes = document.querySelectorAll('.content-node');
    const svgPath = document.getElementById('river-path');
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');

    if (!svgPath || !header || !footer || contentNodes.length === 0) {
        console.error("Essential elements for the interactive map are missing.");
        return;
    }

    // --- Intersection Observer for Content Node Animation ---
    // This logic remains the same, as it is already highly performant.
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    contentNodes.forEach(node => observer.observe(node));

    // --- SVG Path Drawing & Animation Logic ---
    let isDrawing = false;

    function drawSVGPath() {
        if (isDrawing) return;
        isDrawing = true;

        const isMobile = window.innerWidth < 768;
        const pathStartX = window.innerWidth / 2;
        const pathStartY = header.offsetHeight;

        let pathData = `M ${pathStartX} ${pathStartY}`;

        contentNodes.forEach((node, index) => {
            const rect = node.getBoundingClientRect();
            const nodeCenterY = rect.top + window.scrollY + rect.height / 2;
            const nodeConnectX = isMobile ? pathStartX : rect.left + (index % 2 === 0 ? 0 : rect.width);
            const controlPointY1 = pathStartY + (nodeCenterY - pathStartY) * 0.5;
            const controlPointY2 = nodeCenterY - (nodeCenterY - pathStartY) * 0.5;
            const controlPointX1 = pathStartX;
            const controlPointX2 = nodeConnectX;
            pathData += ` C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${nodeConnectX} ${nodeCenterY}`;
        });

        const footerTop = footer.getBoundingClientRect().top + window.scrollY;
        pathData += ` L ${pathStartX} ${footerTop}`;
        svgPath.setAttribute('d', pathData);

        const pathLength = svgPath.getTotalLength();
        svgPath.style.strokeDasharray = pathLength;
        svgPath.style.strokeDashoffset = pathLength;
        
        // Initial animation update after drawing
        animatePathOnScroll();
        
        isDrawing = false;
    }

    // --- OPTIMIZED SCROLL ANIMATION ---
    let ticking = false; // This flag prevents multiple animation frames from being requested at once.

    /**
     * The function that performs the actual DOM update (the expensive part).
     */
    function animatePathOnScroll() {
        const scrollPercentage = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const pathLength = svgPath.getTotalLength();
        if (pathLength <= 0) return; // Don't run if path isn't drawn yet

        const drawLength = pathLength * scrollPercentage;
        svgPath.style.strokeDashoffset = Math.max(0, pathLength - drawLength * 1.2);
    }

    // The scroll event listener is now much simpler.
    // It only requests an animation frame if one isn't already pending.
    document.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                animatePathOnScroll();
                ticking = false; // Allow the next animation frame to be requested.
            });
            ticking = true; // Mark that an animation frame is pending.
        }
    }, { passive: true });


    // --- Event Listeners ---
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        // Redraw path on resize, which will also trigger an animation update.
        resizeTimeout = setTimeout(drawSVGPath, 250);
    });

    // Initial draw of the path.
    setTimeout(drawSVGPath, 300);
});
