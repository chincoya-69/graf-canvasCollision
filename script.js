
"use strict";

// =============================================
// CONFIGURACIÓN Y ELEMENTOS DEL DOM
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
const ayudaVersion = document.getElementById("ayudaVersion");
const mensajePausa = document.getElementById("mensajePausa");

const COLOR_COLISION = "#0000FF";
const DURACION_DESTELLO = 180;

let window_width = 0;
let window_height = 0;

let circles = [];
let version = 3;
let pausada = false;
let cantidadActual = 20;

let colisionesAnteriores = new Set();
let cantidadColisionesActuales = 0;

// =============================================
// CLASE CIRCLE
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
            (version === 3 &&
                performance.now() < this.flashUntil);

        const colorActual = estaAzul
            ? COLOR_COLISION
            : this.originalColor;

        context.beginPath();

        context.arc(
            this.posX,
            this.posY,
            this.radius,
            0,
            Math.PI * 2
        );

        context.fillStyle = colorActual;
        context.strokeStyle = colorActual;
        context.lineWidth = 2;

        context.fill();
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

        // Rebote contra los bordes horizontales.
        if (this.posX + this.radius > window_width) {
            this.posX = window_width - this.radius;
            this.dx = -Math.abs(this.dx);
        } else if (this.posX - this.radius < 0) {
            this.posX = this.radius;
            this.dx = Math.abs(this.dx);
        }

        // Rebote contra los bordes verticales.
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
// GENERACIÓN DE COLORES Y ESFERAS
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
        let posicionValida = false;

        // Buscar una posición que no se superponga
        // con los círculos ya creados.
        for (let intento = 0; intento < 100; intento++) {
            x = radius + Math.random() *
                Math.max(1, window_width - radius * 2);

            y = radius + Math.random() *
                Math.max(1, window_height - radius * 2);

            posicionValida = circles.every(circle => {
                const distancia = Math.hypot(
                    x - circle.posX,
                    y - circle.posY
                );

                return distancia >= radius + circle.radius + 3;
            });

            if (posicionValida) {
                break;
            }
        }

        // Versión 1 conserva velocidades de 1 a 3.
        // Versiones 2 y 3 utilizan velocidades de 1 a 5.
        const speed = version === 1
            ? Math.random() * 2 + 1
            : Math.random() * 4 + 1;

        const angle = Math.random() * Math.PI * 2;

        circles.push(
            new Circle(
                x,
                y,
                radius,
                generarColorAleatorio(),
                `C${i + 1}`,
                speed,
                angle
            )
        );
    }

    cantidadActual = cantidad;
    actualizarEstadisticas();
}

// =============================================
// FÓRMULA DE DISTANCIA ENTRE DOS CENTROS
// =============================================

function detectarColision(c1, c2) {
    const diferenciaX = c2.posX - c1.posX;
    const diferenciaY = c2.posY - c1.posY;

    const distancia = Math.sqrt(
        diferenciaX * diferenciaX +
        diferenciaY * diferenciaY
    );

    return distancia <= c1.radius + c2.radius;
}

// =============================================
// REBOTE ENTRE CÍRCULOS
// =============================================

function resolverColision(c1, c2) {
    let diferenciaX = c2.posX - c1.posX;
    let diferenciaY = c2.posY - c1.posY;

    let distancia = Math.hypot(
        diferenciaX,
        diferenciaY
    );

    if (distancia === 0) {
        diferenciaX = 1;
        diferenciaY = 0;
        distancia = 1;
    }

    // Vector normal de la colisión.
    const nx = diferenciaX / distancia;
    const ny = diferenciaY / distancia;

    // Separar los círculos para evitar superposición.
    const solapamiento =
        c1.radius + c2.radius - distancia;

    if (solapamiento > 0) {
        const separacion = solapamiento / 2 + 0.1;

        c1.posX -= nx * separacion;
        c1.posY -= ny * separacion;

        c2.posX += nx * separacion;
        c2.posY += ny * separacion;
    }

    // En versión 2 solo se detecta la colisión.
    if (version < 3) {
        return;
    }

    // Velocidad relativa entre los círculos.
    const velocidadRelativaX = c2.dx - c1.dx;
    const velocidadRelativaY = c2.dy - c1.dy;

    const velocidadNormal =
        velocidadRelativaX * nx +
        velocidadRelativaY * ny;

    // Evitar repetir el impulso si ya se están separando.
    if (velocidadNormal < 0) {
        // Masa proporcional al área: m = r².
        const masa1 = c1.radius * c1.radius;
        const masa2 = c2.radius * c2.radius;

        const impulso =
            (2 * velocidadNormal) /
            (masa1 + masa2);

        c1.dx += impulso * masa2 * nx;
        c1.dy += impulso * masa2 * ny;

        c2.dx -= impulso * masa1 * nx;
        c2.dy -= impulso * masa1 * ny;
    }
}

// =============================================
// DETECCIÓN DE TODAS LAS COLISIONES
// =============================================

function comprobarColisiones() {
    const colisionesActuales = new Set();

    let cantidad = 0;

    circles.forEach(circle => {
        circle.enColision = false;
    });

    // Comprobar todas las parejas únicas.
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            const c1 = circles[i];
            const c2 = circles[j];

            if (!detectarColision(c1, c2)) {
                continue;
            }

            const idPareja = `${i}-${j}`;

            colisionesActuales.add(idPareja);
            cantidad++;

            c1.enColision = true;
            c2.enColision = true;

            // Responder únicamente al comenzar el contacto.
            if (!colisionesAnteriores.has(idPareja)) {
                if (version === 3) {
                    c1.flash();
                    c2.flash();
                }

                resolverColision(c1, c2);
            }
        }
    }

    colisionesAnteriores = colisionesActuales;
    cantidadColisionesActuales = cantidad;
}

// =============================================
// INTERFAZ: ESTADÍSTICAS Y VERSIÓN
// =============================================

function actualizarEstadisticas() {
    totalEsferas.textContent = circles.length;

    totalColisiones.textContent =
        cantidadColisionesActuales;

    versionLabel.textContent = `${version}.0`;

    rangoVelocidad.textContent = version === 1
        ? "1–3"
        : "1–5";

    cantidadValor.textContent = selectorCantidad.value;

    cantidadControl.style.display =
        version === 3 ? "" : "none";

    if (version === 1) {
        ayudaVersion.textContent =
            "Versión 1.0: movimiento aleatorio y rebote " +
            "contra los bordes del lienzo.";

    } else if (version === 2) {
        ayudaVersion.textContent =
            "Versión 2.0: detecta colisiones y mantiene " +
            "las esferas en azul mientras están en contacto.";

    } else {
        ayudaVersion.textContent =
            "Versión 3.0: las esferas rebotan entre sí y " +
            "destellan en azul al comenzar una colisión.";
    }
}

function actualizarEstadoPausa() {
    botonPausa.setAttribute(
        "aria-pressed",
        String(pausada)
    );

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
        estado.textContent =
            `Versión ${version}.0 · Simulación activa`;
    }
}

// =============================================
// CONFIGURACIÓN DEL CANVAS
// =============================================

function ajustarCanvas() {
    const rect = canvas.getBoundingClientRect();

    window_width = rect.width;
    window_height = rect.height;

    const escala = window.devicePixelRatio || 1;

    canvas.width = Math.round(window_width * escala);
    canvas.height = Math.round(window_height * escala);

    ctx.setTransform(escala, 0, 0, escala, 0, 0);

    // Mantener las esferas dentro del lienzo
    // si la ventana cambia de tamaño.
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
}

// =============================================
// INICIO, REINICIO Y CAMBIO DE CONFIGURACIÓN
// =============================================

function iniciarProyecto(reiniciar = true) {
    version = Number(selectorVersion.value);

    ajustarCanvas();

    let cantidad;

    if (version === 1) {
        cantidad = 5;
    } else if (version === 2) {
        cantidad = 20;
    } else {
        cantidad = Number(selectorCantidad.value);
    }

    generarCirculos(cantidad);

    if (reiniciar) {
        pausada = false;
    }

    actualizarEstadisticas();
    actualizarEstadoPausa();
}

selectorVersion.addEventListener("change", () => {
    iniciarProyecto(true);
});

selectorCantidad.addEventListener("input", () => {
    cantidadValor.textContent = selectorCantidad.value;
});

selectorCantidad.addEventListener("change", () => {
    if (version === 3) {
        // Cambiar la cantidad crea una nueva distribución.
        // No se modifica el estado de pausa.
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

window.addEventListener("resize", () => {
    ajustarCanvas();
});

// =============================================
// BUCLE PRINCIPAL DE ANIMACIÓN
// =============================================

function animar() {
    ctx.clearRect(0, 0, window_width, window_height);

    if (!pausada) {
        // 1. Actualizar posiciones.
        circles.forEach(circle => circle.update());

        // 2. Detectar y resolver colisiones.
        if (version !== 1) {
            comprobarColisiones();
        } else {
            circles.forEach(circle => {
                circle.enColision = false;
            });

            colisionesAnteriores.clear();
            cantidadColisionesActuales = 0;
        }
    }

    // Dibujar incluso cuando está pausada.
    circles.forEach(circle => circle.draw(ctx));

    totalColisiones.textContent =
        cantidadColisionesActuales;

    totalEsferas.textContent = circles.length;

    if (!pausada) {
        estado.textContent =
            `Versión ${version}.0 · ` +
            `${circles.length} esferas · En ejecución`;
    }

    requestAnimationFrame(animar);
}

// =============================================
// EJECUCIÓN INICIAL
// =============================================

iniciarProyecto(true);
animar();
