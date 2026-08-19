# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→` `↑` `↓` | Propulsar en 8 direcciones |
| `Espacio` | Disparar   |
| `Enter`   | Pausa / confirmar en menús |

## Skins

Antes de iniciar la partida se muestra un **menú de selección** donde puedes elegir la apariencia de la nave. Cada skin define color del fuselaje, forma y color de la llama del propulsor.

- Navega con `←` `→` y confirma con `Enter`.
- La elección se guarda en `localStorage` y se recuerda entre sesiones.

| Skin       | Color    |
| ---------- | -------- |
| Clásica    | Blanco   |
| Carmesí    | Rojo     |
| Esmeralda  | Verde    |
| Safiro     | Azul     |
| Solar      | Ámbar    |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
