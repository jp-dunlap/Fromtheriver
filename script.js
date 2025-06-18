/* --- Fromtheriver.org | script.js --- */
/* Logic for "The Unfolding Map" concept - V3 (Consolidated & Optimized) */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM Element Selection ---
    const contentNodes = document.querySelectorAll('.content-node');
    const svgPath = document.getElementById('river-path');
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');

    // --- 1a. MODAL ELEMENT SELECTION (NEW) ---
    const toolkitModal = document.getElementById('toolkit-modal');
    const openModalBtn = document.getElementById('open-toolkit-modal');
    const closeModalBtn = document.getElementById('close-toolkit-modal');
    const modalOverlay = document.getElementById('modal-overlay');

    // --- MODAL LOGIC (NEW) ---
    if (toolkitModal && openModalBtn && closeModalBtn && modalOverlay) {
        const openModal = () => {
            toolkitModal.classList.remove('hidden');
            // A tiny delay allows the display property to apply before starting the opacity transition
            setTimeout(() => toolkitModal.classList.add('is-visible'), 10);
        };

        const closeModal = () => {
            toolkitModal.classList.remove('is-visible');
            // Wait for the transition to finish before hiding it completely
            setTimeout(() => toolkitModal.classList.add('hidden'), 300);
        };

        openModalBtn.addEventListener('click', openModal);
        closeModalBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);

        // Allow closing with the Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && toolkitModal.classList.contains('is-visible')) {
                closeModal();
            }
        });
    } else {
        console.error("Praxis Analysis: Modal elements for the toolkit are missing. Operation cannot proceed.");
    }

    // Fail gracefully if essential elements are missing
    if (!svgPath || !header || !footer || contentNodes.length === 0) {
        console.error("Praxis Analysis: Essential elements for the interactive map are missing. Operation cannot proceed.");
        return;
    }

    // --- 2. Intersection Observer for Content Node Fade-in Animation ---
    // This observer triggers the 'is-visible' class on content nodes when they enter the viewport.
    const nodeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                nodeObserver.unobserve(entry.target); // Stop observing once visible
            }
        });
    }, {
        root: null, // viewport
        threshold: 0.2, // 20% of the element must be visible
        rootMargin: '0px 0px -50px 0px' // Start animation a little early
    });

    contentNodes.forEach(node => nodeObserver.observe(node));

    // --- 3. SVG Path Drawing & Animation Logic ---
    let pathLength = 0; // Will store the total length of the SVG path

    // This function calculates and sets the SVG path's 'd' attribute.
    // It should be called on load and on window resize.
    function calculateAndDrawPath() {
        const isMobile = window.innerWidth < 768;
        const pathStartX = window.innerWidth / 2;
        let pathData = `M ${pathStartX} ${header.offsetHeight}`;
        let lastY = header.offsetHeight;

        contentNodes.forEach((node, index) => {
            const rect = node.getBoundingClientRect();
            // The point where the river connects to the node.
            const nodeConnectX = isMobile ? pathStartX : (index % 2 === 0 ? rect.left + rect.width : rect.left);
            const nodeCenterY = rect.top + window.scrollY + rect.height / 2;

            // Use a Bezier curve for a smooth, organic flow.
            // Control points are calculated to create an 'S' shape between nodes.
            const controlPointY1 = lastY + (nodeCenterY - lastY) * 0.5;
            const controlPointY2 = nodeCenterY - (nodeCenterY - lastY) * 0.5;

            pathData += ` C ${pathStartX} ${controlPointY1}, ${nodeConnectX} ${controlPointY2}, ${nodeConnectX} ${nodeCenterY}`;
            lastY = nodeCenterY;
        });

        // Extend the path to the top of the footer.
        const footerTop = footer.getBoundingClientRect().top + window.scrollY;
        pathData += ` L ${pathStartX} ${footerTop}`;

        svgPath.setAttribute('d', pathData);

        // After drawing the path, get its total length for the animation.
        // This is a "costly" operation, so we do it only when the path is recalculated.
        pathLength = svgPath.getTotalLength();
        svgPath.style.strokeDasharray = pathLength;
        svgPath.style.strokeDashoffset = pathLength;

        // Perform an initial animation update.
        updatePathAnimation();
    }

    // This function updates the stroke-dashoffset based on scroll position.
    // It's designed to be "cheap" and run inside requestAnimationFrame.
    function updatePathAnimation() {
        if (pathLength <= 0) return;

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        // Ensure scroll percentage is between 0 and 1.
        const scrollPercentage = Math.min(1, Math.max(0, window.scrollY / scrollableHeight));
        
        // The animation effect: "draw" the path by reducing the dash offset.
        // The multiplier makes the drawing feel slightly ahead of the scroll.
        const drawLength = pathLength * scrollPercentage * 1.2; 
        svgPath.style.strokeDashoffset = Math.max(0, pathLength - drawLength);
    }

    // --- 4. Event Listeners & Optimization ---

    // Use requestAnimationFrame to ensure smooth scroll animations.
    // The 'ticking' flag prevents the browser from running our animation logic
    // more than once per frame.
    let ticking = false;
    document.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updatePathAnimation();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true }); // 'passive' tells the browser this listener won't block scrolling.

    // Use a debounced resize listener to recalculate the path only after
    // the user has finished resizing the window.
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(calculateAndDrawPath, 250);
    });

    // --- 5. Initial Execution ---
    // A small timeout ensures all fonts and images have likely loaded and the
    // layout is stable before we do our initial path calculation.
    setTimeout(calculateAndDrawPath, 150);
});
