/* --- Fromtheriver.org | script.js --- */
/* Logic for "The Unfolding Map" concept - V4 (Consolidated with Accordion & Modal Logic) */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM Element Selection ---
    const contentNodes = document.querySelectorAll('.content-node');
    const svgPath = document.getElementById('river-path');
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');
    const toolkitModal = document.getElementById('toolkit-modal');
    const openModalBtn = document.getElementById('open-toolkit-modal');
    const closeModalBtn = document.getElementById('close-toolkit-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const accordionTriggers = document.querySelectorAll('.accordion-trigger'); // NEW: Accordion triggers

    // Fail gracefully if essential visual elements are missing
    if (!svgPath || !header || !footer || contentNodes.length === 0) {
        console.error("Praxis Analysis: Essential elements for the interactive map are missing. Operation cannot proceed.");
        return;
    }

    // --- 2. MODAL LOGIC ---
    if (toolkitModal && openModalBtn && closeModalBtn && modalOverlay) {
        const openModal = () => {
            toolkitModal.classList.remove('hidden');
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && toolkitModal.classList.contains('is-visible')) {
                closeModal();
            }
        });
    } else {
        // Log error only if the button exists but modal doesn't, to avoid noise on pages without it.
        if(openModalBtn) {
            console.error("Praxis Analysis: Modal elements for the toolkit are missing. Operation cannot proceed.");
        }
    }

    // --- 3. ACCORDION LOGIC (NEW) ---
    accordionTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            const panelId = trigger.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);

            trigger.setAttribute('aria-expanded', String(!isExpanded));
            
            if (panel) {
                if (isExpanded) {
                    // Start closing
                    panel.classList.remove('open');
                    // When transition ends, add hidden for accessibility
                    panel.addEventListener('transitionend', () => {
                        panel.classList.add('hidden');
                    }, { once: true });
                } else {
                    // Start opening
                    panel.classList.remove('hidden');
                    // Use a timeout to allow the 'display' property to apply before starting transition
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
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    contentNodes.forEach(node => nodeObserver.observe(node));

    // --- 5. SVG Path Drawing & Animation Logic ---
    let pathLength = 0;

    function calculateAndDrawPath() {
        // Recalculation might be unnecessary if the window dimensions haven't changed meaningfully
        const isMobile = window.innerWidth < 768;
        const pathStartX = window.innerWidth / 2;
        let pathData = `M ${pathStartX} ${header.offsetHeight}`;
        let lastY = header.offsetHeight;

        contentNodes.forEach((node, index) => {
            const rect = node.getBoundingClientRect();
            const nodeConnectX = isMobile ? pathStartX : (index % 2 === 0 ? rect.left + rect.width : rect.left);
            const nodeCenterY = rect.top + window.scrollY + rect.height / 2;

            const controlPointY1 = lastY + (nodeCenterY - lastY) * 0.5;
            const controlPointY2 = nodeCenterY - (nodeCenterY - lastY) * 0.5;

            pathData += ` C ${pathStartX} ${controlPointY1}, ${nodeConnectX} ${controlPointY2}, ${nodeConnectX} ${nodeCenterY}`;
            lastY = nodeCenterY;
        });

        const footerTop = footer.getBoundingClientRect().top + window.scrollY;
        pathData += ` L ${pathStartX} ${footerTop}`;

        svgPath.setAttribute('d', pathData);
        pathLength = svgPath.getTotalLength();
        svgPath.style.strokeDasharray = pathLength;
        svgPath.style.strokeDashoffset = pathLength;

        updatePathAnimation();
    }

    function updatePathAnimation() {
        if (pathLength <= 0) return;

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        // Prevent division by zero if content is smaller than viewport
        if (scrollableHeight <= 0) {
             svgPath.style.strokeDashoffset = 0;
             return;
        }
        const scrollPercentage = Math.min(1, Math.max(0, window.scrollY / scrollableHeight));
        
        const drawLength = pathLength * scrollPercentage * 1.2; 
        svgPath.style.strokeDashoffset = Math.max(0, pathLength - drawLength);
    }

    // --- 6. Event Listeners & Optimization ---
    let ticking = false;
    document.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updatePathAnimation();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(calculateAndDrawPath, 250);
    });

    // --- 7. Initial Execution ---
    // A small timeout ensures all fonts and images have likely loaded and the
    // layout is stable before we do our initial path calculation.
    setTimeout(calculateAndDrawPath, 150);
});
