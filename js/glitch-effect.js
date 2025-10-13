// js/glitch-effect.js

// Esperamos a que la página principal esté visible para no ejecutar esto en vano
// Esta función será llamada desde app.js o similar cuando el loader termine.
// Por ahora, asumimos que se carga después del loader.

(function initGlobalGlitch() {
    const glitchWrapper = document.querySelector('.glitch-effect-wrapper');
    const contentToGlitch = document.getElementById('main-content'); // El contenedor que queremos "fotografiar"

    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas no está cargado. Asegúrate de que el CDN esté en tu HTML.');
        return;
    }
    if (!glitchWrapper || !contentToGlitch) {
        console.warn('Elementos para el efecto glitch no encontrados.');
        return;
    }

    let isGlitching = false;
    const glitchDuration = 300; // Duración del efecto en ms
    const glitchFrequency = 5000; // Cada 5 segundos

    function activateGlitch() {
        if (isGlitching) return;
        isGlitching = true;

        // Ocultar temporalmente el propio wrapper del glitch para que no se capture a sí mismo
        glitchWrapper.style.display = 'none';

        html2canvas(contentToGlitch, {
            useCORS: true,
            backgroundColor: '#0A0A0A', // El color de fondo de tu página
            scale: 1,
            // Ignorar elementos que no queremos en la captura
            ignoreElements: (element) => element.classList.contains('glitch-effect-wrapper')
        }).then(canvas => {
            const imageUrl = canvas.toDataURL('image/jpeg', 0.8); // Usar JPEG para mejor rendimiento
            document.documentElement.style.setProperty('--glitch-image-url', `url(${imageUrl})`);
            
            // Mostrar el wrapper y activar la animación
            glitchWrapper.style.display = 'block';
            glitchWrapper.classList.add('active');

            // Desactivar el glitch después de la duración
            setTimeout(() => {
                glitchWrapper.classList.remove('active');
                isGlitching = false;
            }, glitchDuration);
        }).catch(err => {
            console.error("Error con html2canvas:", err);
            glitchWrapper.style.display = 'block'; // Asegurarse de que se muestre de nuevo si falla
            isGlitching = false;
        });
    }

    // Iniciar el ciclo de glitch intermitente
    setInterval(activateGlitch, glitchFrequency);

})();