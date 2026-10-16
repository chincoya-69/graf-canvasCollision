
"use strict";

// =============================================
// ELEMENTOS DE LA INTERFAZ
// =============================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const selectorVersion = document.getElementById("version");
const selectorCantidad = document.getElementById("cantidadEsferas");
const cantidadValor = document.getElementById("cantidadValor");
const cantidadControl = document.getElementById("cantidadControl");

const botonPausa = document.getElementById("botonPausa");
const textoPausa = document.getElementById("textoPausa");
const iconoPausa = document.getElementById("iconoPausa");
const botonReiniciar = document.getElementById("reiniciar");

const estado = document.getElementById("estado");
const estadoGeneral = document.getElementById("estadoGeneral");
const versionLabel = document.getElementById("versionLabel");
const totalEsferas = document.getElementById("totalEsferas");
const totalColisiones = document.getElementById("totalColisiones");
const rangoVelocidad = document.getElementById("rangoVelocidad");
const detalleVelocidad = document.getElementById("detalleVelocidad");
const etiquetaObjetos = document.getElementById("etiquetaObjetos");
const detalleObjetos = document.getElementById("detalleObjetos");
const etiquetaPuntos = document.getElementById("etiquetaPuntos");
const detallePuntos = document.getElementById("detallePuntos");
const ayudaVersion = document.getElementById("ayudaVersion");
const mensajePausa = document.getElementById("mensajePausa");

const tituloProyecto = document.getElementById("tituloProyecto");
const descripcionProyecto = document.getElementById("descripcionProyecto");
const tituloCanvas = document.getElementById("tituloCanvas");
const subtituloCanvas = document.getElementById("subtituloCanvas");
const leyenda = document.getElementById("leyenda");

const COLOR_COLISION = "#0000FF";
const DURACION_DESTELLO = 180;
const TOTAL_ATOMOS = 25;

let window_width = 0;
let window_height = 0;

let circles = [];
let atoms = [];

let version = 5;
let pausada = false;
let cantidadColisionesActuales = 0;
let colisionesAnteriores = new Set();
let objetosDesaparecidos = 0;
let ultimoTiempo = 0;

// =============================================
// CLASE CIRCLE: VERSIONES 1.0 A 4.0
// =============================================

class Circle {
    constructor(x, y, radius, color, text, speed, angle) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.originalColor = color;
        this.text = text;
        this.speed = speed;

        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;

        this.flashUntil = 0;
        this.enColision = false;
    }

    draw(context) {
        const estaAzul =
            (version === 2 && this.enColision) ||
            (version === 3 && performance.now() < this.flashUntil);

        const colorActual = estaAzul
            ? COLOR_COLISION
            : this.originalColor;

        context.beginPath();
        context.arc(
            this.posX, this.posY, this.radius,
            0, Math.PI * 2
        );

        context.strokeStyle = colorActual;
        context.lineWidth = 2;
        context.stroke();

        context.fillStyle = "#FFFFFF";
        context.font = "12px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.text, this.posX, this.posY);

        context.closePath();
    }

    update() {
        this.posX += this.dx;
        this.posY += this.dy;

        if (this.posX + this.radius > window_width) {
            this.posX = window_width - this.radius;
            this.dx = -Math.abs(this.dx);
        } else if (this.posX - this.radius < 0) {
            this.posX = this.radius;
            this.dx = Math.abs(this.dx);
        }

        if (this.posY + this.radius > window_height) {
            this.posY = window_height - this.radius;
            this.dy = -Math.abs(this.dy);
        } else if (this.posY - this.radius < 0) {
            this.posY = this.radius;
            this.dy = Math.abs(this.dy);
        }
    }

    flash() {
        this.flashUntil = performance.now() + DURACION_DESTELLO;
    }
}

// =============================================
// CLASE ATOM: VERSION 5.0
// =============================================

class Atom {
    constructor(id) {
        this.id = id;
        this.radius = 19 + Math.random() * 7;
        this.phase = Math.random() * Math.PI * 2;
        this.orbitSpeed = (Math.random() * 0.035 + 0.012) *
            (Math.random() < 0.5 ? -1 : 1);

        this.color = [
            "#36D9F5",
            "#A78BFA",
            "#55E6C1",
            "#7AA8FF",
            "#F0ABFC"
        ][Math.floor(Math.random() * 5)];

        this.respawn(true);
    }

    // Cada átomo comienza arriba y con una posición
    // horizontal y velocidad diferentes.
    respawn(inicial = false) {
        this.x = this.radius + Math.random() *
            Math.max(1, window_width - this.radius * 2);

        this.y = -this.radius - Math.random() * 100;

        this.vy = inicial
            ? 0.8 + Math.random() * 1.5
            : 0.5 + Math.random() * 0.6;

        this.vx = (Math.random() - 0.5) * 0.45;
        this.bounces = 0;
        this.phase = Math.random() * Math.PI * 2;
    }

    // Dibuja el núcleo, las órbitas y los electrones.
    draw(context, tiempo) {
        const r = this.radius;
        const pulso = 1 + Math.sin(tiempo * 0.004 + this.phase) * 0.06;

        context.save();
        context.translate(this.x, this.y);

        // Halo exterior.
        const halo = context.createRadialGradient(
            0, 0, r * 0.2,
            0, 0, r * 2.1
        );

        halo.addColorStop(0, this.color + "35");
        halo.addColorStop(1, this.color + "00");

        context.fillStyle = halo;
        context.beginPath();
        context.arc(0, 0, r * 2.1, 0, Math.PI * 2);
        context.fill();

        // Tres órbitas elípticas.
        for (let i = 0; i < 3; i++) {
            context.save();
            context.rotate(
                this.phase + tiempo * this.orbitSpeed +
                i * Math.PI / 3
            );

            context.beginPath();
            context.ellipse(
                0, 0, r * 1.65, r * 0.68,
                0, 0, Math.PI * 2
            );

            context.strokeStyle = this.color + "B0";
            context.lineWidth = 1.3;
            context.stroke();

            // Electrón orbitando.
            const angulo = tiempo * this.orbitSpeed * 2 + i * 2.1;

            const ex = Math.cos(angulo) * r * 1.65;
            const ey = Math.sin(angulo) * r * 0.68;

            context.beginPath();
            context.arc(ex, ey, 3.5, 0, Math.PI * 2);
            context.fillStyle = "#FFFFFF";
            context.shadowColor = this.color;
            context.shadowBlur = 12;
            context.fill();
            context.shadowBlur = 0;

            context.restore();
        }

        // Núcleo brillante.
        const nucleo = context.createRadialGradient(
            -r * 0.25, -r * 0.3, 1,
            0, 0, r * pulso
        );

        nucleo.addColorStop(0, "#FFFFFF");
        nucleo.addColorStop(0.3, this.color);
        nucleo.addColorStop(1, "#5267C9");

        context.beginPath();
        context.arc(0, 0, r * 0.72 * pulso, 0, Math.PI * 2);
        context.fillStyle = nucleo;
        context.shadowColor = this.color;
        context.shadowBlur = 18;
        context.fill();
        context.shadowBlur = 0;

        // Etiqueta pequeña.
        context.fillStyle = "#FFFFFF";
        context.font = "bold 9px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("ATOM", 0, r + 15);

        context.restore();
    }

    // Física de caída y rebote.
    update(delta) {
        const dificultad = obtenerDificultad();

        // Gravedad y movimiento horizontal.
        const gravedad = dificultad.gravedad;
        const suelo = window_height - this.radius;

        this.vy += gravedad * delta;
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        // Rebote horizontal suave.
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx = Math.abs(this.vx);
        }

        if (this.x > window_width - this.radius) {
            this.x = window_width - this.radius;
            this.vx = -Math.abs(this.vx);
        }

        // Rebote contra el suelo.
        if (this.y >= suelo) {
            this.y = suelo;
            this.vy = -Math.abs(this.vy) * 0.58;
            this.bounces++;

            // Cuando pierde energía, vuelve a caer
            // hasta que su rebote sea casi imperceptible.
            if (Math.abs(this.vy) < 1.15 || this.bounces >= 6) {
                this.respawn();
            }
        }
    }

    // Detección del clic mediante mouseX y mouseY.
    contienePunto(mouseX, mouseY) {
        const distancia = Math.hypot(
            mouseX - this.x,
            mouseY - this.y
        );

        // Área un poco mayor para facilitar el juego.
        return distancia <= this.radius * 1.8;
    }
}

// =============================================
// COLORES Y GENERACIÓN DE CÍRCULOS
// =============================================

function generarColorAleatorio() {
    return "#" + Math.floor(
        Math.random() * 16777216
    ).toString(16).padStart(6, "0");
}

function generarCirculos(cantidad) {
    circles = [];
    colisionesAnteriores.clear();
    cantidadColisionesActuales = 0;

    for (let i = 0; i < cantidad; i++) {
        const radius = Math.random() * 10 + 15;

        let x = radius;
        let y = radius;

        for (let intento = 0; intento < 100; intento++) {
            x = radius + Math.random() *
                Math.max(1, window_width - radius * 2);

            y = radius + Math.random() *
                Math.max(1, window_height - radius * 2);

            const valido = circles.every(circle =>
                Math.hypot(x - circle.posX, y - circle.posY) >=
                radius + circle.radius + 3
            );

            if (valido) break;
        }

        const speed = version === 1
            ? 1 + Math.random() * 2
            : 1 + Math.random() * 4;

        circles.push(new Circle(
            x, y, radius,
            generarColorAleatorio(),
            `C${i + 1}`,
            speed,
            Math.random() * Math.PI * 2
        ));
    }
}

function generarAtomos() {
    atoms = [];

    for (let i = 0; i < TOTAL_ATOMOS; i++) {
        atoms.push(new Atom(i + 1));
    }
}

// =============================================
// COLISIONES ENTRE CÍRCULOS: VERSIONES 2.0 Y 3.0
// =============================================

function detectarColision(c1, c2) {
    return Math.hypot(
        c2.posX - c1.posX,
        c2.posY - c1.posY
    ) <= c1.radius + c2.radius;
}

function resolverColision(c1, c2) {
    let dx = c2.posX - c1.posX;
    let dy = c2.posY - c1.posY;
    let distancia = Math.hypot(dx, dy);

    if (distancia === 0) {
        dx = 1;
        dy = 0;
        distancia = 1;
    }

    const nx = dx / distancia;
    const ny = dy / distancia;

    const solapamiento =
        c1.radius + c2.radius - distancia;

    if (solapamiento > 0) {
        const separacion = solapamiento / 2 + 0.1;

        c1.posX -= nx * separacion;
        c1.posY -= ny * separacion;
        c2.posX += nx * separacion;
        c2.posY += ny * separacion;
    }

    if (version < 3) return;

    const rvx = c2.dx - c1.dx;
    const rvy = c2.dy - c1.dy;
    const velocidadNormal = rvx * nx + rvy * ny;

    if (velocidadNormal < 0) {
        const m1 = c1.radius * c1.radius;
        const m2 = c2.radius * c2.radius;

        const impulso = 2 * velocidadNormal / (m1 + m2);

        c1.dx += impulso * m2 * nx;
        c1.dy += impulso * m2 * ny;

        c2.dx -= impulso * m1 * nx;
        c2.dy -= impulso * m1 * ny;
    }
}

function comprobarColisiones() {
    const actuales = new Set();
    let cantidad = 0;

    circles.forEach(circle => {
        circle.enColision = false;
    });

    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            const c1 = circles[i];
            const c2 = circles[j];

            if (!detectarColision(c1, c2)) continue;

            const id = `${i}-${j}`;

            actuales.add(id);
            cantidad++;

            c1.enColision = true;
            c2.enColision = true;

            if (!colisionesAnteriores.has(id)) {
                if (version === 3) {
                    c1.flash();
                    c2.flash();
                }

                resolverColision(c1, c2);
            }
        }
    }

    colisionesAnteriores = actuales;
    cantidadColisionesActuales = cantidad;
}

// =============================================
// VERSION 4.0: DETECTAR MOUSE Y ELIMINAR CÍRCULO
// =============================================

function detectarClic(mouseX, mouseY) {
    // Revisar desde el último círculo dibujado.
    for (let i = circles.length - 1; i >= 0; i--) {
        const circle = circles[i];

        const distancia = Math.hypot(
            mouseX - circle.posX,
            mouseY - circle.posY
        );

        if (distancia <= circle.radius) {
            circles.splice(i, 1);
            objetosDesaparecidos++;

            actualizarEstadisticas();
            estado.textContent =
                `¡Círculo eliminado! Total: ${objetosDesaparecidos}`;

            return true;
        }
    }

    return false;
}

// =============================================
// VERSION 5.0: DIFICULTAD PROGRESIVA
// =============================================

function obtenerDificultad() {
    if (objetosDesaparecidos > 20) {
        return {
            nombre: "Alta",
            gravedad: 0.34
        };
    }

    if (objetosDesaparecidos > 10) {
        return {
            nombre: "Media",
            gravedad: 0.23
        };
    }

    return {
        nombre: "Inicial",
        gravedad: 0.15
    };
}

// =============================================
// COORDENADAS DEL MOUSE EN EL CANVAS
// =============================================

canvas.addEventListener("click", event => {
    if (pausada) return;

    const rect = canvas.getBoundingClientRect();

    // Coordenadas locales del puntero.
    const mouseX =
        (event.clientX - rect.left) *
        (window_width / rect.width);

    const mouseY =
        (event.clientY - rect.top) *
        (window_height / rect.height);

    if (version === 4) {
        detectarClic(mouseX, mouseY);
    } else if (version === 5) {
        // Comprobar si se seleccionó un átomo.
        for (let i = atoms.length - 1; i >= 0; i--) {
            if (atoms[i].contienePunto(mouseX, mouseY)) {
                objetosDesaparecidos++;

                // Reaparece el mismo átomo arriba.
                // La cantidad total se mantiene en 25.
                atoms[i].respawn();

                actualizarEstadisticas();

                estado.textContent =
                    `¡Átomo capturado! Puntuación: ${objetosDesaparecidos}`;

                break;
            }
        }
    }
});

// =============================================
// ESTADÍSTICAS E INTERFAZ
// =============================================

function actualizarEstadisticas() {
    versionLabel.textContent = `${version}.0`;

    if (version === 5) {
        totalEsferas.textContent = atoms.length;
        totalColisiones.textContent = objetosDesaparecidos;
        etiquetaObjetos.textContent = "Átomos activos";
        detalleObjetos.textContent = "Siempre hay 25 átomos";
        etiquetaPuntos.textContent = "Átomos capturados";
        detallePuntos.textContent = "Total de aciertos";

        const dificultad = obtenerDificultad();

        rangoVelocidad.textContent = dificultad.nombre;
        detalleVelocidad.textContent =
            `${objetosDesaparecidos} puntos conseguidos`;

        cantidadControl.style.display = "none";

        tituloProyecto.textContent = "Atom Catcher";
        descripcionProyecto.textContent =
            "Captura átomos luminosos, domina los rebotes " +
            "y supera los niveles de velocidad.";

        tituloCanvas.textContent = "Zona de captura";
        subtituloCanvas.textContent =
            "Haz clic en los átomos para atraparlos";

        ayudaVersion.textContent =
            "25 átomos activos. Cada captura aumenta tu puntuación. " +
            "Más de 10 puntos: velocidad media. Más de 20: velocidad alta.";

        leyenda.innerHTML =
            '<span><i class="legend-dot normal"></i>Átomos activos</span>' +
            '<span><i class="legend-dot collision"></i>Objetivo: capturar</span>';

    } else if (version === 4) {
        totalEsferas.textContent = circles.length;
        totalColisiones.textContent = objetosDesaparecidos;

        etiquetaObjetos.textContent = "Círculos restantes";
        detalleObjetos.textContent = "Objetos en el canvas";
        etiquetaPuntos.textContent = "Objetos desaparecidos";
        detallePuntos.textContent = "Clics acertados";

        rangoVelocidad.textContent = "1–5";
        detalleVelocidad.textContent = "Unidades por fotograma";

        cantidadControl.style.display = "none";

        tituloProyecto.textContent = "Selección con mouse";
        descripcionProyecto.textContent =
            "Selecciona los círculos con el botón izquierdo del mouse.";

        tituloCanvas.textContent = "Área interactiva";
        subtituloCanvas.textContent =
            "Haz clic directamente sobre un círculo para eliminarlo";

        ayudaVersion.textContent =
            "Las coordenadas mouseX y mouseY se calculan con respecto " +
            "al canvas. Cada clic acertado elimina un círculo.";

        leyenda.innerHTML =
            '<span><i class="legend-dot normal"></i>Círculos activos</span>' +
            '<span>🖱 Clic para eliminar</span>';

    } else {
        totalEsferas.textContent = circles.length;
        totalColisiones.textContent = cantidadColisionesActuales;

        etiquetaObjetos.textContent = "Esferas activas";
        detalleObjetos.textContent = "Objetos en el canvas";
        etiquetaPuntos.textContent = "Parejas en colisión";
        detallePuntos.textContent = "Contactos actuales";

        rangoVelocidad.textContent = version === 1 ? "1–3" : "1–5";
        detalleVelocidad.textContent = "Unidades por fotograma";

        cantidadControl.style.display =
            version === 3 ? "" : "none";

        tituloProyecto.textContent = "Simulación de esferas";
        descripcionProyecto.textContent =
            "Explora el movimiento, las colisiones y los rebotes en 2D.";

        tituloCanvas.textContent = "Área de simulación";
        subtituloCanvas.textContent =
            "Entorno de renderizado Canvas 2D";

        ayudaVersion.textContent = version === 1
            ? "Versión 1.0: movimiento y rebote en los bordes."
            : version === 2
            ? "Versión 2.0: las esferas cambian a azul mientras colisionan."
            : "Versión 3.0: las esferas rebotan y destellan en azul.";

        leyenda.innerHTML =
            '<span><i class="legend-dot normal"></i>Movimiento</span>' +
            '<span><i class="legend-dot collision"></i>Colisión</span>';
    }

    cantidadValor.textContent = selectorCantidad.value;
}

// =============================================
// CANVAS RESPONSIVO
// =============================================

function ajustarCanvas() {
    const rect = canvas.getBoundingClientRect();

    window_width = rect.width;
    window_height = rect.height;

    const escala = window.devicePixelRatio || 1;

    canvas.width = Math.round(window_width * escala);
    canvas.height = Math.round(window_height * escala);

    ctx.setTransform(escala, 0, 0, escala, 0, 0);

    circles.forEach(circle => {
        circle.posX = Math.max(
            circle.radius,
            Math.min(window_width - circle.radius, circle.posX)
        );

        circle.posY = Math.max(
            circle.radius,
            Math.min(window_height - circle.radius, circle.posY)
        );
    });

    atoms.forEach(atom => {
        atom.x = Math.max(
            atom.radius,
            Math.min(window_width - atom.radius, atom.x)
        );
    });
}

// =============================================
// INICIO Y CAMBIO DE VERSIONES
// =============================================

function iniciarProyecto(reiniciar = true) {
    version = Number(selectorVersion.value);

    ajustarCanvas();

    pausada = reiniciar ? false : pausada;
    cantidadColisionesActuales = 0;
    colisionesAnteriores.clear();
    objetosDesaparecidos = 0;

    if (version === 1) {
        generarCirculos(5);
        atoms = [];
    } else if (version === 2) {
        generarCirculos(20);
        atoms = [];
    } else if (version === 3) {
        generarCirculos(Number(selectorCantidad.value));
        atoms = [];
    } else if (version === 4) {
        generarCirculos(20);
        atoms = [];
    } else {
        circles = [];
        generarAtomos();
    }

    actualizarEstadisticas();
    actualizarEstadoPausa();
}

function actualizarEstadoPausa() {
    botonPausa.setAttribute("aria-pressed", String(pausada));

    if (pausada) {
        textoPausa.textContent = "Reanudar";
        iconoPausa.textContent = "▶";
        mensajePausa.hidden = false;
        estadoGeneral.textContent = "Sistema pausado";
        estado.textContent = "Simulación detenida";
    } else {
        textoPausa.textContent = "Pausar";
        iconoPausa.textContent = "Ⅱ";
        mensajePausa.hidden = true;
        estadoGeneral.textContent = "Sistema activo";
        estado.textContent = `Versión ${version}.0 · En ejecución`;
    }
}

selectorVersion.addEventListener("change", () => {
    iniciarProyecto(true);
});

selectorCantidad.addEventListener("input", () => {
    cantidadValor.textContent = selectorCantidad.value;
});

selectorCantidad.addEventListener("change", () => {
    if (version === 3) {
        iniciarProyecto(false);
    }
});

botonPausa.addEventListener("click", () => {
    pausada = !pausada;
    actualizarEstadoPausa();
});

botonReiniciar.addEventListener("click", () => {
    iniciarProyecto(true);
});

window.addEventListener("resize", ajustarCanvas);

// =============================================
// BUCLE PRINCIPAL DE ANIMACIÓN
// =============================================

function animar(tiempo = 0) {
    ctx.clearRect(0, 0, window_width, window_height);

    // Delta temporal limitado para evitar saltos grandes.
    const delta = ultimoTiempo === 0
        ? 1
        : Math.min((tiempo - ultimoTiempo) / 16.667, 2);

    ultimoTiempo = tiempo;

    if (!pausada) {
        if (version === 5) {
            // Siempre mantener exactamente 25 átomos.
            atoms.forEach(atom => atom.update(delta));
        } else {
            circles.forEach(circle => circle.update());

            if (version === 2 || version === 3) {
                comprobarColisiones();
            } else {
                cantidadColisionesActuales = 0;
            }
        }
    }

    if (version === 5) {
        atoms.forEach(atom => atom.draw(ctx, tiempo));
    } else {
        circles.forEach(circle => circle.draw(ctx));
    }

    totalEsferas.textContent =
        version === 5 ? atoms.length : circles.length;

    if (version === 2 || version === 3) {
        totalColisiones.textContent = cantidadColisionesActuales;
    } else if (version === 4 || version === 5) {
        totalColisiones.textContent = objetosDesaparecidos;
    } else {
        totalColisiones.textContent = 0;
    }

    if (!pausada) {
        estado.textContent = version === 5
            ? `Atom Catcher · ${atoms.length} átomos · ${obtenerDificultad().nombre}`
            : `Versión ${version}.0 · ${circles.length} objetos`;
    }

    requestAnimationFrame(animar);
}

// =============================================
// EJECUCIÓN
// =============================================

iniciarProyecto(true);
requestAnimationFrame(animar);
