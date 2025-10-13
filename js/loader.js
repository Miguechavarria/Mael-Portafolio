// js/loader.js - Versión adaptada para el navegador

// --- FUNCIÓN PARA TERMINAR LA CARGA (La que te di antes) ---
// Esta función ocultará el loader y mostrará el contenido de tu web.
function completeLoading() {
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    
    gsap.to(loader, {
        duration: 1.0,
        opacity: 0,
        ease: "power2.inOut",
        onComplete: () => {
            loader.style.display = 'none';
            mainContent.classList.remove('hidden');
            mainContent.style.display = 'block';
            
            gsap.from(mainContent, { 
                duration: 1.2, 
                opacity: 0,
                y: 20,
                ease: "power2.out"
            });

            // ❗️❗️ ESTA ES LA LÍNEA NUEVA Y CLAVE ❗️❗️
            // Crea y dispara una señal para que los otros scripts sepan que ya pueden ejecutarse
            const pageReadyEvent = new Event('pageReady');
            document.dispatchEvent(pageReadyEvent);
        }
    });
}


// --- INICIA EL CÓDIGO DE LA ANIMACIÓN DE TYMPANUS ---

// Clases base simplificadas para que todo funcione sin 'require'
class ParticleBase {
    constructor(config, system, loader) {
        this.system = system;
        this.loader = loader;
        this.calc = { map: (num, min1, max1, min2, max2) => (num - min1) * (max2 - min2) / (max1 - min1) + min2 };
        this.ease = { inOutExpo: x => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2 };
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(config.size, 16, 16),
            new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: config.opacity })
        );
        config.group.add(this.mesh);
    }
    reset() {}
    update() {}
}

class Osc {
    constructor(a, b, c, d) { this.a = a, this.b = b, this.c = c, this.d = d, this.reset(); }
    reset() { this.val = 0; }
    update(a) { this.val += this.b * a; if (this.val > 1) { this.val = 0; } }
}

// --- TU CÓDIGO ADAPTADO ---

// Lógica de `particle.js`
class Particle extends ParticleBase {
    constructor(config, system, loader) {
        super(config, system, loader);
        this.radius = config.radius;
        this.order = config.order;
        this.alternate = config.alternate;
        this.osc = new Osc(this.order, 0.015, true, false);
        this.reset();
    }

    reset() { super.reset(); this.osc.reset(); }

    update() {
        this.osc.update(this.loader.timescale);
        let angle = this.calc.map(this.order, 0, 1, -Math.cos(this.loader.elapsedMilliseconds * 0.0015) * (Math.PI * 1.5), Math.sin(this.loader.elapsedMilliseconds * 0.0015) * (Math.PI * 1.5));
        angle += this.alternate ? Math.PI : 0;
        let x = Math.cos(angle) * this.radius;
        let y = this.calc.map(this.order, 0, 1, -this.system.height, this.system.height);
        let z = Math.sin(angle) * this.radius;
        this.mesh.position.set(x, y, z);
        const minScale = 0.5; // Qué tan pequeña se hace la esfera (la mitad de su tamaño original)
        const maxScale = 1; // Qué tan grande se hace (50% más grande que su tamaño original)
        const scaleRange = maxScale - minScale;

        let scale;
        if (this.alternate) {
            // Esta es la hélice que hace el movimiento contrario
            scale = minScale + ((1 - this.ease.inOutExpo(this.osc.val)) * scaleRange);
        } else {
            // Esta es la hélice principal
            scale = minScale + (this.ease.inOutExpo(this.osc.val) * scaleRange);
        }
        this.mesh.scale.set(scale, scale, scale);
        }
    }

// Lógica de `system.js`
// js/loader.js - Clase System ACTUALIZADA para el zoom final
class System {
    constructor(scene, loader) {
        this.scene = scene;
        this.loader = loader;
        this.particleGroup = new THREE.Group();
        this.scene.add(this.particleGroup);
        this.particles = [];
        this.lines = [];
        this.ease = { 
            inExpo: x => x === 0 ? 0 : Math.pow(2, 10 * x - 10),
            inOutExpo: x => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2
        };

        // ==========================================================
        // === ZONA DE PERSONALIZACIÓN ===
        // ==========================================================
        this.duration = 5500;
        this.count = 24;
        this.height = 15;
        this.radius = 4;
        
        const particleColor = 0xd9bead;
        const lineColor = 0xd9bead;
        
        // --- TAMAÑO DE LAS ESFERAS CON COMPENSACIÓN ---
        // La hélice frontal tendrá este tamaño
        const sphereSizeFront = 0.3; 
        // La hélice de atrás la hacemos un poco más grande para que se vea igual
        const sphereSizeBack = 0.35; // <-- Prueba aumentando este valor un poco (ej. 0.35, 0.4)
        // ==========================================================
        
        this.exiting = false;
        this.exitProgress = 0;
        this.exitStartTime = 0;
        this.exitDuration = 1000;

        for (let i = 0; i < this.count; i++) {
            // Partículas FRONTALES (alternate: false) usan 'sphereSizeFront'
            this.particles.push(new Particle({ group: this.particleGroup, order: i / (this.count - 1), alternate: false, color: particleColor, opacity: 1, size: sphereSizeFront, radius: this.radius }, this, this.loader));
            
            // Partículas TRASERAS (alternate: true) usan 'sphereSizeBack'
            this.particles.push(new Particle({ group: this.particleGroup, order: i / (this.count - 1), alternate: true, color: particleColor, opacity: 1, size: sphereSizeBack, radius: this.radius }, this, this.loader));
        }

        let lineMaterial = new THREE.LineBasicMaterial({ color: lineColor, opacity: 0.5, transparent: true });
        for (let i = 0; i < this.count; i++) {
            let lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
            let lineMesh = new THREE.Line(lineGeometry, lineMaterial);
            this.particleGroup.add(lineMesh);
            this.lines.push(lineMesh);
        }
    }

    // ... (El resto de la clase System: update(), startExit() se queda igual) ...
    update() {
        this.particles.forEach(p => p.update());
        for (let j = 0; j < this.lines.length; j++) {
            const p1 = this.particles[j * 2].mesh.position;
            const p2 = this.particles[j * 2 + 1].mesh.position;
            const positions = this.lines[j].geometry.attributes.position.array;
            positions[0] = p1.x; positions[1] = p1.y; positions[2] = p1.z;
            positions[3] = p2.x; positions[4] = p2.y; positions[5] = p2.z;
            this.lines[j].geometry.attributes.position.needsUpdate = true;
        }
        this.particleGroup.rotation.z = Math.sin(this.loader.elapsedMilliseconds * 0.0015) * Math.PI * 0.15;
        if (this.exiting) {
            this.exitProgress = Math.min(1, (this.loader.elapsedMilliseconds - this.exitStartTime) / this.exitDuration);
        }
    }

    startExit() {
        this.exiting = true;
        this.exitStartTime = this.loader.elapsedMilliseconds;
    }
}

// Lógica principal que corre todo (de `index.js` y otros archivos base)
document.addEventListener('DOMContentLoaded', () => {
    const loaderContainer = document.getElementById('loader');
    if (!loaderContainer) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    loaderContainer.appendChild(renderer.domElement);

    

    const loaderState = {
        elapsedMilliseconds: 0,
        timescale: 1,
        // Agregamos estas propiedades para el control de la cámara
        camera: camera, // Pasamos la cámara al loaderState
        cameraBaseZ: 50 // Distancia inicial de la cámara
    };

    const system = new System(scene, loaderState);
    camera.position.z = loaderState.cameraBaseZ; // Usamos la base para la posición inicial

    let startTime = Date.now();
    function animate() {
        requestAnimationFrame(animate);
        loaderState.elapsedMilliseconds = Date.now() - startTime;
        system.update();

        // Lógica para el efecto de zoom final:
        if (system.exiting) {
            // `system.exitProgress` va de 0 a 1
            // `system.ease.inExpo` suaviza la transición
            camera.position.z = loaderState.cameraBaseZ - system.ease.inExpo(system.exitProgress) * loaderState.cameraBaseZ;
        }

        renderer.render(scene, camera);
    }

    animate();

   // ==========================================================
// === ❗️ ¡AQUÍ OCURRE LA MAGIA! (VERSIÓN CORREGIDA) ❗️ ===
// ==========================================================
// Esperamos a que la duración principal casi termine...
    setTimeout(() => {
    // Iniciamos la animación de salida (el zoom).
    system.startExit();
    
    // Y EXACTAMENTE cuando la animación de salida termina,
    // llamamos a completeLoading. UNA SOLA VEZ.
    setTimeout(completeLoading, system.exitDuration);

    }, system.duration - system.exitDuration);
// ==========================================================


    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});

