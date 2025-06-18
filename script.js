/* --- Fromtheriver.org | script.js --- */
/* Logic for "The Unfolding Map" concept - V5 (Unified Accordion & Multi-Modal Logic) */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM Element Selection ---
    const contentNodes = document.querySelectorAll('.content-node');
    const svgPath = document.getElementById('river-path');
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');
    const accordionTriggers = document.querySelectorAll('.accordion-trigger');
    
    // --- Modal Selections (NEW & GENERALIZED) ---
    const modalTriggers = document.querySelectorAll('.modal-trigger');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal-btn');
    const modalOverlays = document.querySelectorAll('.modal-overlay');

    // Fail gracefully if essential visual elements are missing
    if (!svgPath || !header || !footer || contentNodes.length === 0) {
        console.error("Praxis Analysis: Essential elements for the interactive map are missing. Operation cannot proceed.");
        return;
    }

    // --- 2. MODAL LOGIC (GENERALIZED) ---
    const openModal = (modal) => {
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('is-visible'), 10);
        }
    };

    const closeModal = (modal) => {
        if (modal) {
            modal.classList.remove('is-visible');
            modal.addEventListener('transitionend', () => {
                modal.classList.add('hidden');
            }, { once: true });
        }
    };

    // Attach open listeners to all modal triggers
    document.getElementById('open-toolkit-modal')?.addEventListener('click', () => openModal(document.getElementById('toolkit-modal')));
    document.getElementById('open-nakba-modal')?.addEventListener('click', () => openModal(document.getElementById('nakba-modal')));
    document.getElementById('open-zionism-modal')?.addEventListener('click', () => openModal(document.getElementById('zionism-modal')));
    document.getElementById('open-sumud-modal')?.addEventListener('click', () => openModal(document.getElementById('sumud-modal')));

    // Attach close listeners to all close buttons and overlays
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });

    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.modal');
            closeModal(modal);
        });
    });

    // Close any open modal with the Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const visibleModal = document.querySelector('.modal.is-visible');
            if (visibleModal) {
                closeModal(visibleModal);
            }
        }
    });

    // --- 3. ACCORDION LOGIC ---
    accordionTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            const panelId = trigger.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);

            trigger.setAttribute('aria-expanded', String(!isExpanded));
            
            if (panel) {
                if (isExpanded) {
                    panel.classList.remove('open');
                    panel.addEventListener('transitionend', () => {
                        panel.classList.add('hidden');
                    }, { once: true });
                } else {
                    panel.classList.remove('hidden');
                    setTimeout(() => panel.classList.add('open'), 10);
                }
            }
        });
    });


    // --- 4. Intersection Observer for Content Node Fade-in Animation ---
    const nodeObserver = new IntersectionObserver((entries, observer) => {
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

    contentNodes.forEach(node => nodeObserver.observe(node));

    // --- 5. SVG Path Drawing & Animation Logic ---
    let pathLength = 0;

    function calculateAndDrawPath() {
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
    setTimeout(calculateAndDrawPath, 150);
});
