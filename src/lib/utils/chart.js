// ============================================================
// UTILIDADES DE GRÁFICOS — Kinetic Labs
// ============================================================
// Funciones puras para generar paths SVG de los mini-gráficos
// (sparklines) de telemetría.
//
// Son funciones "puras": dado el mismo input, siempre dan el
// mismo output, sin efectos secundarios. Fáciles de testear.
// ============================================================

/**
 * Genera el atributo `d` de un elemento `<path>` SVG a partir
 * de un array de valores numéricos. Produce una polilínea que
 * va de izquierda a derecha dentro del área del SVG.
 *
 * @param {number[]} data    - Array de valores a graficar
 * @param {number}   width   - Ancho total del área SVG (px o unidades)
 * @param {number}   height  - Alto total del área SVG (px o unidades)
 * @param {number}   maxVal  - Valor máximo esperado (para normalizar la escala)
 * @returns {string}         - String con el path SVG, listo para usar en d="{...}"
 *
 * @example
 * buildSparkPath([3, 5, 4, 7], 280, 80, 10)
 * // → "M 0.0 56.0 L 93.3 60.0 L 186.7 48.0 L 280.0 24.0"
 */
export function buildSparkPath(data, width, height, maxVal = 10) {
  // Necesitamos al menos 2 puntos para trazar una línea
  if (data.length < 2) return '';

  // Separación horizontal entre cada punto
  const step = width / (data.length - 1);

  return data
    .map((value, index) => {
      // Posición X: distribuida uniformemente de izquierda a derecha
      const x = index * step;

      // Posición Y: invertida porque en SVG Y=0 está arriba.
      // Un valor alto → Y pequeño (cerca del tope del gráfico).
      const y = height - (Math.max(0, value) / maxVal) * height;

      // M = MoveTo (primer punto), L = LineTo (puntos siguientes)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}
