/* --- Fromtheriver.org | script.js --- */
/* Logic for "The Unfolding Map" concept - V6 (Integrated Village Name Ticker) */

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
    
    // Village Ticker Element
    const villageTicker = document.getElementById('village-ticker');


    // Fail gracefully if essential visual elements are missing
    if (!svgPath || !header || !footer || contentNodes.length === 0) {
        console.error("Praxis Analysis: Essential elements for the interactive map are missing. Operation cannot proceed.");
        return;
    }

    // --- 2. MODAL LOGIC (Generalized Function) ---
    const setupModal = (modal, openBtn, closeBtn, overlay) => {
        if (!modal || !openBtn || !closeBtn || !overlay) {
            if(openBtn) {
                console.error(`Praxis Analysis: Modal elements for '${modal.id}' are incomplete. Interactivity cannot be initialized.`);
            }
            return;
        }

        const openModal = () => {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('is-visible'), 10);
        };

        const closeModal = () => {
            modal.classList.remove('is-visible');
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
                    panel.classList.remove('open');
                    panel.addEventListener('transitionend', () => {
                        panel.classList.add('hidden');
                    }, { once: true });
                } else {
                    panel.classList.remove('hidden');
                    setTimeout(() => {
                        panel.classList.add('open');
                    }, 10);
                }
            }
        });
    });

    // --- 4. DYNAMIC VILLAGE TICKER ---
    /**
     * Fetches village data and starts a rotating display of village names.
     * This creates a "living memorial" effect on the main page.
     */
    const initializeVillageTicker = () => {
        if (!villageTicker) {
            console.warn("Praxis Analysis: Village ticker element not found. Feature will not run.");
            return;
        }
        
        // Add transition styles directly via JS
        villageTicker.style.transition = 'opacity 0.5s ease-in-out';

        fetch('villages.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(villages => {
                if (villages && villages.length > 0) {
                    let currentIndex = 0;
                    
                    // Set the initial text
                    villageTicker.textContent = `Remembering ${villages[currentIndex].name}...`;

                    setInterval(() => {
                        // Fade out
                        villageTicker.style.opacity = '0';

                        // After fade out, change text and fade in
                        setTimeout(() => {
                            currentIndex = (currentIndex + 1) % villages.length; // Loop through the array
                            villageTicker.textContent = `Remembering ${villages[currentIndex].name}...`;
                            villageTicker.style.opacity = '1';
                        }, 500); // This timeout should match the CSS transition duration
                    }, 3000); // Change village name every 3 seconds
                }
            })
            .catch(error => {
                console.error("Praxis Analysis: Could not load village data for ticker.", error);
                villageTicker.textContent = "Could not load the historical record.";
            });
    };
    
    // --- 5. Intersection Observer for Content Node Fade-in Animation ---
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

    // --- 6. SVG Path Drawing & Animation Logic ---
    let pathLength = 0;

    function calculateAndDrawPath() {
        if (!svgPath) return; // Fail gracefully if path is missing
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

    // --- 7. Event Listeners & Optimization ---
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

    // --- 8. Initial Execution ---
    setTimeout(calculateAndDrawPath, 150);
    initializeVillageTicker(); // Initialize the new feature
});
