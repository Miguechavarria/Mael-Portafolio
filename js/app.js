// js/app.js (ESPERANDO LA SEÑAL)

// No hagas nada hasta que escuches la señal 'pageReady' del loader
document.addEventListener('pageReady', () => {

    // --- LÓGICA DEL MENÚ CIRCULAR (la que ya teníamos) ---
    const menuBtn = document.querySelector('.menu-btn');
    const circular = document.querySelector('.circular-menu');
    if (!menuBtn || !circular) return;

    const items = Array.from(circular.querySelectorAll('.circular-item'));
    const css = getComputedStyle(document.documentElement);
    const radiusVar = css.getPropertyValue('--c-menu-radius') || '180';
    const radius = Number(radiusVar.replace('px', '')) || 180;

    items.forEach((li, idx) => {
        const angleDeg = Number(li.dataset.angle || 0);
        const finalTransform = `rotate(${angleDeg}deg) translateX(${radius}px) rotate(${-angleDeg}deg)`;
        const entryTransform = `rotate(${angleDeg}deg) translateY(-${radius}px) rotate(${-angleDeg}deg)`;
        const exitTransform  = `rotate(${angleDeg}deg) translateY(${radius}px) rotate(${-angleDeg}deg)`;

        li.dataset._final = finalTransform;
        li.dataset._entry = entryTransform;
        li.dataset._exit  = exitTransform;
        
        li.style.transform = entryTransform;
        li.style.opacity = '0';
        li.style.pointerEvents = 'none';

        const delay = idx * 70;
        li.style.transitionDelay = `${delay}ms`;
    });

    circular.classList.add('closed');
    let isAnimating = false;

    function openMenu() {
        if (isAnimating) return; isAnimating = true;
        circular.classList.remove('closed', 'closing');
        circular.classList.add('open');
        menuBtn.classList.add('open');
        items.forEach(li => {
            li.style.transform = li.dataset._final;
            li.style.opacity = '1';
            li.style.pointerEvents = 'auto';
        });
        setTimeout(() => { isAnimating = false; }, 700 + (items.length * 70));
    }

    function closeMenu() {
        if (isAnimating) return; isAnimating = true;
        circular.classList.remove('open');
        circular.classList.add('closing');
        menuBtn.classList.remove('open');
        items.forEach((li, idx) => {
            const delay = idx * 40;
            setTimeout(() => {
                li.style.transform = li.dataset._exit;
                li.style.opacity = '0';
                li.style.pointerEvents = 'none';
            }, delay);
        });
        const total = 700 + (items.length * 40);
        setTimeout(() => {
            items.forEach(li => { li.style.transform = li.dataset._entry; });
            circular.classList.remove('closing');
            circular.classList.add('closed');
            isAnimating = false;
        }, total);
    }

    menuBtn.addEventListener('click', () => {
        if (menuBtn.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    console.log("El menú está listo y escuchando.");

    // --- LÓGICA PARA LA PÁGINA DE PORTAFOLIO ---
    if (document.querySelector('.portfolio-section')) {
        
        // Lógica de Filtros
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Manejar clase activa del botón
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;

                // Mostrar u ocultar tarjetas
                projectCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.classList.remove('hide');
                    } else {
                        card.classList.add('hide');
                    }
                });
            });
        });

        // Lógica del Modal
        const modal = document.getElementById('project-modal');
        const modalCloseBtn = modal.querySelector('.modal-close');
        
        projectCards.forEach(card => {
            card.addEventListener('click', () => {
                // Poblar el modal con datos de la tarjeta
                document.getElementById('modal-img').src = card.dataset.modalImage;
                document.getElementById('modal-title').innerText = card.dataset.modalTitle;
                document.getElementById('modal-desc').innerText = card.dataset.modalDesc;
                
                const techList = document.getElementById('modal-tech');
                techList.innerHTML = ''; // Limpiar lista
                const techs = card.dataset.modalTech.split(', ');
                techs.forEach(tech => {
                    const li = document.createElement('li');
                    li.innerText = tech;
                    techList.appendChild(li);
                });

                // Mostrar el modal
                modal.classList.add('active');
            });
        });

        function closeModal() {
            modal.classList.remove('active');
        }

        modalCloseBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }


}); // Fin del addEventListener