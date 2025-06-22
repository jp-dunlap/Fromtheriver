/* --- Fromtheriver.org | script.js --- */
/* Logic for "The Unfolding Map" concept - V8 (Integrated Codex Protocol) */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GLOBAL & STATE VARIABLES ---
    let allVillagesData = []; // PRAXIS: Stores the entire village dataset for Codex functionality.

    // --- 2. DOM ELEMENT SELECTION ---
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

    // --- 3. DATA FETCHING & INITIALIZATION ---
    // PRAXIS: Fetch the village data once and store it for all features (Ticker and Codex).
    fetch('villages.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(villages => {
            allVillagesData = villages; // Store data globally
            
            // Initialize all features that depend on this data
            setTimeout(calculateAndDrawPath, 150);
            initializeVillageTicker(allVillagesData);
            initializeTooltips();
            initializeCodex(allVillagesData); // PRAXIS: Activate the new Codex protocol.
        })
        .catch(error => {
            console.error("Praxis Analysis: Could not load village data for ticker and codex.", error);
            if(villageTicker) villageTicker.textContent = "Could not load the historical record.";
        });


    // --- 4. MODAL LOGIC (Generalized Function) ---
    const setupModal = (modal, openBtn, closeBtn, overlay) => {
        if (!modal || !openBtn || !closeBtn || !overlay) {
            if(openBtn) {
                console.warn(`Praxis Analysis: Modal elements for '${openBtn.id}' are incomplete. Interactivity will not be initialized.`);
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


    // --- 5. ACCORDION LOGIC ---
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

    // --- 6. DYNAMIC VILLAGE TICKER ---
    const initializeVillageTicker = (villages) => {
        if (!villageTicker) {
            console.warn("Praxis Analysis: Village ticker element not found. Feature will not run.");
            return;
        }
        
        villageTicker.style.transition = 'opacity 0.5s ease-in-out';
        
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
        } else {
             villageTicker.textContent = "Historical record is empty.";
        }
    };

    // --- 7. INTERACTIVE TOOLTIP LOGIC ---
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
                tooltipBox.style.left = `${event.pageX + 15}px`;
                tooltipBox.style.top = `${event.pageY + 15}px`;
            });
        });
    };

    // --- 8. PRAXIS PROTOCOL: CODEX MODAL ---
    // This entire section is new, dedicated to fusing the Atlas with the Narrative.
    const initializeCodex = (villages) => {
        // First, dynamically create the modal structure and append it to the body.
        // This ensures the script is self-contained and doesn't rely on pre-existing HTML.
        const codexModal = document.createElement('div');
        codexModal.id = 'codex-modal';
        codexModal.className = 'fixed inset-0 z-50 hidden items-center justify-center';
        codexModal.innerHTML = `
            <div id="codex-modal-overlay" class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <div class="relative node-card w-full max-w-3xl p-8 m-4 max-h-[80vh] overflow-y-auto">
                <button id="close-codex-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div id="codex-modal-content"></div>
            </div>
        `;
        document.body.appendChild(codexModal);

        // Now select the newly created elements
        const closeCodexModalBtn = document.getElementById('close-codex-modal');
        const codexModalOverlay = document.getElementById('codex-modal-overlay');
        const codexModalContent = document.getElementById('codex-modal-content');
        const villageLinks = document.querySelectorAll('.village-link');

        const openModal = () => {
            codexModal.classList.remove('hidden');
            setTimeout(() => codexModal.classList.add('is-visible'), 10);
        };

        const closeModal = () => {
            codexModal.classList.remove('is-visible');
            codexModal.addEventListener('transitionend', () => {
                codexModal.classList.add('hidden');
            }, { once: true });
        };
        
        // Add event listeners for closing the modal
        closeCodexModalBtn.addEventListener('click', closeModal);
        codexModalOverlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && codexModal.classList.contains('is-visible')) {
                closeModal();
            }
        });

        // Add event listeners to all village links in the text
        villageLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const villageName = link.dataset.village;
                const villageData = villages.find(v => v.name.toLowerCase() === villageName.toLowerCase());

                if (villageData) {
                    // Populate the modal with the specific village's data
                    const settlementInfo = villageData.israeli_settlement ? `<p class="text-sm text-gray-500"><strong class="text-gray-400">Built on its ruins:</strong> ${villageData.israeli_settlement}</p>` : '';
                    const operationInfo = villageData.military_operation ? `<p class="text-sm text-gray-500"><strong class="text-gray-400">Military Operation:</strong> ${villageData.military_operation}</p>` : '';

                    codexModalContent.innerHTML = `
                        <div class="space-y-3">
                            <h3 class="font-serif text-4xl text-white">${villageData.name}</h3>
                            <h4 class="font-sans text-xl text-gray-400 -mt-2">${villageData.name_arabic}</h4>
                            <div class="pt-4 border-t border-gray-600">
                                <p class="text-gray-300 leading-relaxed">${villageData.story}</p>
                            </div>
                            <div class="pt-4 mt-4 border-t border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                <p class="text-sm text-gray-500"><strong class="text-gray-400">District:</strong> ${villageData.district}</p>
                                <p class="text-sm text-gray-500"><strong class="text-gray-400">Destroyed by:</strong> ${villageData.destroyed_by}</p>
                                ${operationInfo}
                                ${settlementInfo}
                            </div>
                             <div class="pt-4 mt-4 border-t border-gray-700">
                                <a href="atlas.html?village=${encodeURIComponent(villageData.name)}" class="resource-link">View on Atlas of Erasure →</a>
                            </div>
                        </div>
                    `;
                    openModal();
                } else {
                    console.warn(`Praxis Analysis: No codex entry found for village: ${villageName}`);
                }
            });
        });
    };
    
    // --- 9. Intersection Observer for Content Node Fade-in Animation ---
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

    // --- 10. SVG Path Drawing & Animation Logic ---
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

    // --- 11. Event Listeners & Optimization ---
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
});
