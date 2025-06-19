/* --- Fromtheriver.org | script.js --- */
/* Logic for "The Unfolding Map" concept - V5 (Integrated Donate Modal) */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM Element Selection ---
    const contentNodes = document.querySelectorAll('.content-node');
    const svgPath = document.getElementById('river-path');
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');
    
    // Toolkit Modal Elements
    const toolkitModal = document.getElementById('toolkit-modal');
    const openToolkitModalBtn = document.getElementById('open-toolkit-modal');
    const closeToolkitModalBtn = document.getElementById('close-toolkit-modal');
    const toolkitModalOverlay = document.getElementById('modal-overlay');

    // Donate Modal Elements
    const donateModal = document.getElementById('donate-modal');
    const openDonateModalBtn = document.getElementById('open-donate-modal');
    const closeDonateModalBtn = document.getElementById('close-donate-modal');
    const donateModalOverlay = document.getElementById('donate-modal-overlay');

    // Accordion Triggers
    const accordionTriggers = document.querySelectorAll('.accordion-trigger');

    // Fail gracefully if essential visual elements are missing
    if (!svgPath || !header || !footer || contentNodes.length === 0) {
        console.error("Praxis Analysis: Essential elements for the interactive map are missing. Operation cannot proceed.");
        return;
    }

    // --- 2. MODAL LOGIC (Generalized Function) ---
    // This function handles the opening and closing of any modal.
    const setupModal = (modal, openBtn, closeBtn, overlay) => {
        if (!modal || !openBtn || !closeBtn || !overlay) {
            // Log error only if the button exists but modal doesn't, to avoid noise on pages without it.
            if(openBtn) {
                console.error(`Praxis Analysis: Modal elements for '${modal.id}' are incomplete. Interactivity cannot be initialized.`);
            }
            return;
        }

        const openModal = () => {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('is-visible'), 10); // For fade-in transition
        };

        const closeModal = () => {
            modal.classList.remove('is-visible');
            // Wait for the transition to finish before hiding it completely.
            // Using a transitionend event listener ensures the timing is perfect.
            modal.addEventListener('transitionend', () => {
                modal.classList.add('hidden');
            }, { once: true });
        };

        openBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('is-visible')) {
                closeModal();
            }
        });
    };
    
    // Initialize both modals with the generalized function
    setupModal(toolkitModal, openToolkitModalBtn, closeToolkitModalBtn, toolkitModalOverlay);
    setupModal(donateModal, openDonateModalBtn, closeDonateModalBtn, donateModalOverlay);


    // --- 3. ACCORDION LOGIC ---
    accordionTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            const panelId = trigger.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);

            trigger.setAttribute('aria-expanded', String(!isExpanded));
            
            if (panel) {
                if (isExpanded) {
                    // Start closing the panel
                    panel.classList.remove('open');
                    // When the transition ends, add the 'hidden' class for accessibility and layout.
                    panel.addEventListener('transitionend', () => {
                        panel.classList.add('hidden');
                    }, { once: true });
                } else {
                    // Start opening the panel
                    panel.classList.remove('hidden');
                    // Use a timeout to allow the 'display' property to apply before starting the transition.
                    // This prevents the transition from failing to run.
                    setTimeout(() => {
                        panel.classList.add('open');
                    }, 10);
                }
            }
        });
    });


    // --- 4. Intersection Observer for Content Node Fade-in Animation ---
    const nodeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                nodeObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.2, // Trigger when 20% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Adjust the bounding box to trigger a bit earlier
    });

    contentNodes.forEach(node => nodeObserver.observe(node));

    // --- 5. SVG Path Drawing & Animation Logic ---
    let pathLength = 0;

    function calculateAndDrawPath() {
        // Recalculates the SVG path based on the positions of the content nodes.
        const isMobile = window.innerWidth < 768;
        const pathStartX = window.innerWidth / 2;
        let pathData = `M ${pathStartX} ${header.offsetHeight}`;
        let lastY = header.offsetHeight;

        contentNodes.forEach((node, index) => {
            const rect = node.getBoundingClientRect();
            // In mobile view, the path stays centered. On desktop, it zig-zags.
            const nodeConnectX = isMobile ? pathStartX : (index % 2 === 0 ? rect.left + rect.width : rect.left);
            const nodeCenterY = rect.top + window.scrollY + rect.height / 2;

            // Use Bezier curves for a more organic, flowing "river" effect.
            const controlPointY1 = lastY + (nodeCenterY - lastY) * 0.5;
            const controlPointY2 = nodeCenterY - (nodeCenterY - lastY) * 0.5;

            pathData += ` C ${pathStartX} ${controlPointY1}, ${nodeConnectX} ${controlPointY2}, ${nodeConnectX} ${nodeCenterY}`;
            lastY = nodeCenterY;
        });

        // Extend the path to the top of the footer.
        const footerTop = footer.getBoundingClientRect().top + window.scrollY;
        pathData += ` L ${pathStartX} ${footerTop}`;

        svgPath.setAttribute('d', pathData);
        pathLength = svgPath.getTotalLength();
        svgPath.style.strokeDasharray = pathLength;
        svgPath.style.strokeDashoffset = pathLength;

        // Initial call to set the path drawing based on the initial scroll position.
        updatePathAnimation();
    }

    function updatePathAnimation() {
        if (pathLength <= 0) return;

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        // Prevent division by zero if content is smaller than the viewport.
        if (scrollableHeight <= 0) {
             svgPath.style.strokeDashoffset = 0;
             return;
        }
        // Calculate the percentage of the page scrolled.
        const scrollPercentage = Math.min(1, Math.max(0, window.scrollY / scrollableHeight));
        
        // The path "draws" itself as the user scrolls down.
        // Multiplying by 1.2 ensures the path is fully drawn before the user hits the absolute bottom.
        const drawLength = pathLength * scrollPercentage * 1.2; 
        svgPath.style.strokeDashoffset = Math.max(0, pathLength - drawLength);
    }

    // --- 6. Event Listeners & Optimization ---
    let ticking = false;
    document.addEventListener('scroll', () => {
        // Use requestAnimationFrame to optimize scroll event handling and prevent performance issues.
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updatePathAnimation();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true }); // Use a passive listener for better scroll performance.

    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Use a debounce timeout to avoid excessive recalculations during window resizing.
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(calculateAndDrawPath, 250);
    });

    // --- 7. Initial Execution ---
    // A small timeout ensures all fonts and images have likely loaded and the
    // layout is stable before we do our initial path calculation. This prevents layout shift issues.
    setTimeout(calculateAndDrawPath, 150);
});
