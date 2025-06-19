/* --- Fromtheriver.org | script.js --- */
/* Logic for "The Unfolding Map" concept - V7 (Integrated Tooltips) */

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
    const initializeVillageTicker = () => {
        if (!villageTicker) {
            console.warn("Praxis Analysis: Village ticker element not found. Feature will not run.");
            return;
        }
        
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
                    villageTicker.textContent = `Remembering ${villages[currentIndex].name}...`;

                    setInterval(() => {
                        villageTicker.style.opacity = '0';
                        setTimeout(() => {
                            currentIndex = (currentIndex + 1) % villages.length;
                            villageTicker.textContent = `Remembering ${villages[currentIndex].name}...`;
                            villageTicker.style.opacity = '1';
                        }, 500);
                    }, 3000);
                }
            })
            .catch(error => {
                console.error("Praxis Analysis: Could not load village data for ticker.", error);
                villageTicker.textContent = "Could not load the historical record.";
            });
    };

    // --- 5. INTERACTIVE TOOLTIP LOGIC (NEW) ---
    const initializeTooltips = () => {
        const triggers = document.querySelectorAll('.tooltip-trigger');
        if (triggers.length === 0) return;

        const definitions = {
            'balfour': {
                title: 'Balfour Declaration (1917)',
                text: "A public statement issued by the British government during WWI announcing support for the establishment of a 'national home for the Jewish people' in Palestine, a land where the indigenous Arab population was the overwhelming majority. It disregarded the political rights of the existing population."
            },
            'settler-colonialism': {
                title: 'Settler Colonialism',
                text: "A distinct type of colonialism that functions through the replacement of indigenous populations with an invasive settler society that, over time, develops a unique identity and sovereignty. Unlike other forms of colonialism, it seeks to eliminate the native population, not just exploit them."
            },
            'zionism': {
                title: 'Zionism',
                text: "A late 19th-century European political movement that sought to establish a Jewish-majority state in the land of Palestine. Its implementation required the systematic dispossession and ethnic cleansing of the indigenous Palestinian people."
            },
            'nakba': {
                title: 'The Nakba (1948)',
                text: "Arabic for 'The Catastrophe.' Refers to the 1948 ethnic cleansing of Palestine, where over 750,000 Palestinians were forcibly expelled from their homes and land by Zionist militias and the new Israeli army. Over 500 villages and cities were depopulated and largely destroyed."
            },
            'sumud': {
                title: 'Sumud (صمود)',
                text: "An Arabic term meaning 'steadfastness' or 'resilience.' In the Palestinian context, it refers to the daily act of resistance and perseverance—remaining on the land, preserving culture, and refusing to be erased in the face of occupation and oppression."
            }
        };

        const tooltipBox = document.createElement('div');
        tooltipBox.id = 'tooltip-box';
        document.body.appendChild(tooltipBox);

        triggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', (event) => {
                const term = trigger.dataset.term;
                const content = definitions[term];
                if (content) {
                    tooltipBox.innerHTML = `<h4>${content.title}</h4><p>${content.text}</p>`;
                    tooltipBox.classList.add('is-visible');
                }
            });

            trigger.addEventListener('mouseleave', () => {
                tooltipBox.classList.remove('is-visible');
            });
            
            trigger.addEventListener('mousemove', (event) => {
                // Position the tooltip near the cursor, with an offset
                tooltipBox.style.left = `${event.pageX + 15}px`;
                tooltipBox.style.top = `${event.pageY + 15}px`;
            });
        });
    };
    
    // --- 6. Intersection Observer for Content Node Fade-in Animation ---
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

    // --- 7. SVG Path Drawing & Animation Logic ---
    let pathLength = 0;

    function calculateAndDrawPath() {
        if (!svgPath) return;
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

    // --- 8. Event Listeners & Optimization ---
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

    // --- 9. Initial Execution ---
    setTimeout(calculateAndDrawPath, 150);
    initializeVillageTicker();
    initializeTooltips(); // Initialize the new tooltip feature
});
