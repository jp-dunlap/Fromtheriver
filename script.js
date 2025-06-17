/* --- Fromtheriver.org | script.js --- */
/* Logic for "The Unfolding Map" concept */

// Wait for the entire HTML document to be loaded and parsed before running the script.
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    // Select all the major components we need to interact with.
    const contentNodes = document.querySelectorAll('.content-node');
    const svgPath = document.getElementById('river-path');
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');

    // If any essential element is missing, stop the script to avoid errors.
    if (!svgPath || !header || !footer || contentNodes.length === 0) {
        console.error("Essential elements for the interactive map are missing.");
        return;
    }

    // --- Intersection Observer for Content Node Animation ---
    // This observer will watch for when our content nodes enter the viewport.
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // If a node is intersecting (visible), add the 'is-visible' class.
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Once visible, we don't need to watch it anymore. This is a performance optimization.
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null, // Observing relative to the viewport.
        threshold: 0.2, // Trigger when 20% of the element is visible.
        rootMargin: '0px 0px -50px 0px' // Start triggering 50px before it's fully in view.
    });

    // Tell the observer to start watching each of our content nodes.
    contentNodes.forEach(node => observer.observe(node));


    // --- SVG Path Drawing & Animation Logic ---

    let isDrawing = false; // A flag to prevent multiple redraws at the same time.

    /**
     * Calculates and draws the SVG path connecting the content nodes.
     * This function is designed to be called on load and on window resize.
     */
    function drawSVGPath() {
        if (isDrawing) return; // Prevent overlapping function calls
        isDrawing = true;

        const isMobile = window.innerWidth < 768; // Check for mobile viewport
        const pathStartX = window.innerWidth / 2; // Center of the screen
        const pathStartY = header.offsetHeight; // Start path below the header

        // Start the SVG path data string. 'M' means "Move To".
        let pathData = `M ${pathStartX} ${pathStartY}`;

        // Loop through each content node to draw connecting curves.
        contentNodes.forEach((node, index) => {
            const rect = node.getBoundingClientRect();
            // Calculate the vertical center of the node, adjusted for scroll position.
            const nodeCenterY = rect.top + window.scrollY + rect.height / 2;
            
            // On mobile, the path is simpler. On desktop, it alternates sides.
            const nodeConnectX = isMobile ? pathStartX : rect.left + (index % 2 === 0 ? 0 : rect.width);
            
            // Calculate control points for a smooth Bezier curve.
            // This creates the organic, flowing "river" effect.
            const controlPointY1 = pathStartY + (nodeCenterY - pathStartY) * 0.5;
            const controlPointY2 = nodeCenterY - (nodeCenterY - pathStartY) * 0.5;
            const controlPointX1 = pathStartX;
            const controlPointX2 = nodeConnectX;

            // Add the curve to our path data string. 'C' stands for "Curve To".
            pathData += ` C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${nodeConnectX} ${nodeCenterY}`;
        });

        // Finally, draw a line to the top of the footer. 'L' means "Line To".
        const footerTop = footer.getBoundingClientRect().top + window.scrollY;
        pathData += ` L ${pathStartX} ${footerTop}`;

        // Apply the generated path data to the SVG element.
        svgPath.setAttribute('d', pathData);

        // --- Prepare for Scroll Animation ---
        // Get the total length of the path we just drew.
        const pathLength = svgPath.getTotalLength();
        // Set up the 'stroke-dasharray' and 'stroke-dashoffset' to hide the path initially.
        // This is the "magic" that allows us to animate the drawing of the line.
        svgPath.style.strokeDasharray = pathLength;
        svgPath.style.strokeDashoffset = pathLength;
        
        isDrawing = false; // Release the flag
    }

    /**
     * Animates the SVG path based on the user's scroll position.
     */
    function animatePathOnScroll() {
        // Calculate how far the user has scrolled down the page as a percentage.
        const scrollPercentage = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        
        const pathLength = svgPath.getTotalLength();
        // Calculate how much of the path to reveal.
        const drawLength = pathLength * scrollPercentage;

        // Update the 'stroke-dashoffset'. As this value gets smaller, more of the line is revealed.
        // We use a clamp to ensure the value doesn't go out of bounds.
        svgPath.style.strokeDashoffset = Math.max(0, pathLength - drawLength * 1.2); // *1.2 makes it finish a bit early
    }

    // --- Event Listeners ---
    // Animate the path when the user scrolls.
    window.addEventListener('scroll', animatePathOnScroll, { passive: true });
    
    // Use a 'debounce' function for resizing to avoid excessive calculations.
    // It waits until the user has stopped resizing for a moment before redrawing.
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(drawSVGPath, 250); // Redraw after 250ms of no resizing.
    });

    // Initial draw of the path.
    // We use a small timeout to ensure all assets and fonts are loaded and the layout is stable.
    setTimeout(drawSVGPath, 300);
});
