//import {evalPolyComplex} from './bodeEngine';
import { evalPolyComplex } from "./bodeEngine";
import type { Poly } from "./systemSolver";

/**
 * Represents a point in the Nyquist plot.
 * @property frequency | Frequency in rad/s
 * @property real      | Real part of the complex number
 * @property imag      | Imaginary part of the complex number
 * @property amplitude | Magnitude of the complex number
 * @property phaseRad  | Phase of the complex number in radians
 * @property phaseDeg  | Phase of the complex number in degrees
 */
export interface NyquistPoint {
  frequency: number; // rad/s
  real: number; // Re{H(j*omega)} = amp * cos(arg)
  imag: number; // Im{H(j*omega)} = amp * sin(arg)
  amplitude: number; // |H(j*omega)|
  phaseRad: number; // Arg(H(j*omega)) in radians
  phaseDeg: number; // Arg(H(j*omega)) in degrees
}

/**
 * Options for customizing the appearance of the Nyquist plot when drawn on a canvas.
 * @property title               | Title of the plot (default: "Nyquist-diagram")
 * @property strokeColor         | Color of the Nyquist curve (default: "#1e40af")  
 * @property gridColor           | Color of the major grid lines (default: "#d1d5db")
 * @property subGridColor        | Color of the minor grid lines (default: "#f3f4f6")
 * @property axisColor           | Color of the axes (default: "#374151")
 * @property criticalPointColor  | Color of the critical point marker (-1, j0) (default: "#dc2626")
 * @property textColor           | Color of the text labels (default: "#374151")
 * @property font                | Font for the text labels (default: "12px sans-serif")
 */
export interface NyquistDrawOptions {
  title?: string;
  strokeColor?: string;
  gridColor?: string;
  subGridColor?: string;
  axisColor?: string;
  criticalPointColor?: string;
  textColor?: string;
  font?: string;
}

/**
 *  Calculates the complex frequency response H(j*omega) of a transfer function defined
 *  by its numerator and denominator polynomials at a specific frequency omega.
 * @param num   | Numerator polynomial coefficients (highest degree first)
 * @param den   | Denominator polynomial coefficients (highest degree first)
 * @param omega | Frequency in rad/s at which to evaluate the transfer function
 * @returns     | An object containing the real and imaginary parts of H(j*omega)
 */
export function calculateH(
  num: Poly,
  den: Poly,
  omega: number,
): { real: number; imag: number } {
  const N = evalPolyComplex(num, omega);
  const D = evalPolyComplex(den, omega);

  const denSq = D.re * D.re + D.im * D.im; //if the denominator is zero
  if (denSq === 0) return { real: 0, imag: 0 };

  return {
    // Otherwise
    real: (N.re * D.re + N.im * D.im) / denSq, // Complex Conjugate Division!!!
    imag: (N.im * D.re - N.re * D.im) / denSq,
  };
}



/**
 * Generates Nyquist plot data for a given transfer function defined by its numerator and denominator polynomials.
 * @param num             | Numerator polynomial coefficients (highest degree first)
 * @param den             | Denominator polynomial coefficients (highest degree first)
 * @param wMin            | Minimum frequency in rad/s (default: 0.01)
 * @param wMax            | Maximum frequency in rad/s (default: 1000)
 * @param pointsPerDecade | Number of points to generate per decade (default: 50)
 * @returns               | Array of NyquistPoint objects representing the Nyquist plot data
 *
 *
 * @example | generateNyquistData([1], [1, 1], 0.01, 1000, 50)
 *                  => [{frequency: 0.01, real: ..., imag: ..., amplitude: ..., phaseRad: ..., phaseDeg: ...}, ...]
 *
 * @example | generateNyquistData([1, 2], [1, 3, 2], 0.01, 1000, 50)
 *                  => [{frequency: 0.01, real: ..., imag: ..., amplitude: ..., phaseRad: ..., phaseDeg: ...}, ...]
 */
export function generateNyquistData(
  num: number[],
  den: number[],
  wMin = 0.001,
  wMax = 1000,
  pointsPerDecade = 100,
): NyquistPoint[] {
  const posPoints: NyquistPoint[] = [];

  const decMin = Math.log10(wMin);
  const decMax = Math.log10(wMax);
  const totalDecades = decMax - decMin;
  const totalPoints = Math.round(totalDecades * pointsPerDecade);

  // 1. Sweep positive frequencies (0 -> +infinity)
  for (let i = 0; i <= totalPoints; i++) {
    const logW = decMin + (i / totalPoints) * totalDecades;
    const omega = Math.pow(10, logW);

    const { real, imag } = calculateH(num, den, omega);
    const amp = Math.hypot(real, imag);
    const argRad = Math.atan2(imag, real);

    posPoints.push({
      frequency: omega,
      real: Number(real.toFixed(6)),
      imag: Number(imag.toFixed(6)),
      amplitude: amp,
      phaseRad: argRad,
      phaseDeg: (argRad * 180) / Math.PI,
    });
  }

  // 2. Mirror across real axis for negative frequencies (-infinity -> 0)
  const negPoints: NyquistPoint[] = posPoints
    .slice()
    .reverse()
    .map((pt) => ({
      ...pt,
      frequency: -pt.frequency,
      imag: -pt.imag,
      phaseRad: -pt.phaseRad,
      phaseDeg: -pt.phaseDeg,
    }));

  return [...negPoints, ...posPoints];
}

/**
 * Draws the Nyquist plot on a given HTML canvas element using the provided Nyquist data points and optional drawing options.
 * @param canvas  | HTMLCanvasElement where the Nyquist plot will be drawn
 * @param data    | Array of NyquistPoint objects representing the Nyquist plot data
 * @param options | Optional drawing options to customize the appearance of the plot
 * @returns       | void
 */
export function drawNyquistPlot(
  canvas: HTMLCanvasElement,
  data: NyquistPoint[],
  options: NyquistDrawOptions = {},
): void {
  if (!data || data.length === 0) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  const {
    title = "Nyquist Diagram",
    strokeColor = "#1e40af",
    gridColor = "#e5e7eb",
    axisColor = "#374151",
    criticalPointColor = "#dc2626",
    textColor = "#374151",
    font = "12px sans-serif",
  } = options;

  ctx.clearRect(0, 0, width, height);
  ctx.font = font;

  // Layout Margins
  const marginLeft = 65;
  const marginRight = 35;
  const marginTop = 35;
  const marginBottom = 45;

  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  // --- 1. FILTER VALID DATA & COMPUTE BOUNDS ---
  const validPoints = data.filter(
    (pt) =>
      !isNaN(pt.real) &&
      !isNaN(pt.imag) &&
      isFinite(pt.real) &&
      isFinite(pt.imag),
  );

  if (validPoints.length === 0) return;

  let minRe = Infinity,
    maxRe = -Infinity;
  let minIm = Infinity,
    maxIm = -Infinity;

  validPoints.forEach((pt) => {
    if (pt.real < minRe) minRe = pt.real;
    if (pt.real > maxRe) maxRe = pt.real;
    if (pt.imag < minIm) minIm = pt.imag;
    if (pt.imag > maxIm) maxIm = pt.imag;
  });

  // Ensure critical point (-1, j0) and origin (0, 0) are always visible inside viewport
  minRe = Math.min(minRe, -1.5);
  maxRe = Math.max(maxRe, 1.5);
  minIm = Math.min(minIm, -1.5);
  maxIm = Math.max(maxIm, 1.5);

  // Preserve 1:1 square aspect ratio
  const spanRe = maxRe - minRe;
  const spanIm = maxIm - minIm;
  const maxSpan = Math.max(spanRe, spanIm);

  const midRe = (minRe + maxRe) / 2;
  const midIm = (minIm + maxIm) / 2;

  const finalMinRe = midRe - maxSpan / 2;
  const finalMaxRe = midRe + maxSpan / 2;
  const finalMinIm = midIm - maxSpan / 2;
  const finalMaxIm = midIm + maxSpan / 2;

  // Coordinate mapping helpers
  const mapX = (re: number) =>
    marginLeft + ((re - finalMinRe) / (finalMaxRe - finalMinRe)) * plotWidth;

  const mapY = (im: number) =>
    marginTop +
    plotHeight -
    ((im - finalMinIm) / (finalMaxIm - finalMinIm)) * plotHeight;

  // --- 2. DYNAMIC GRID STEP CALCULATION ---
  const targetTicks = 6;
  const rawStep = maxSpan / targetTicks;

  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / Math.pow(10, exponent);

  let niceFraction = 1;
  if (fraction > 5) niceFraction = 10;
  else if (fraction > 2) niceFraction = 5;
  else if (fraction > 1) niceFraction = 2;

  const gridStep = niceFraction * Math.pow(10, exponent);

  // --- 3. DRAW TITLE ---
  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  ctx.fillText(title, marginLeft + plotWidth / 2, marginTop - 15);

  // --- 4. DRAW GRID & TICK LABELS ---
  const startRe = Math.ceil(finalMinRe / gridStep) * gridStep;
  const endRe = Math.floor(finalMaxRe / gridStep) * gridStep;
  const startIm = Math.ceil(finalMinIm / gridStep) * gridStep;
  const endIm = Math.floor(finalMaxIm / gridStep) * gridStep;

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  // Vertical Grid Lines & X-Axis Labels
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let r = startRe; r <= endRe + gridStep / 2; r += gridStep) {
    const x = mapX(r);
    if (x >= marginLeft - 1 && x <= marginLeft + plotWidth + 1) {
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, marginTop + plotHeight);
      ctx.stroke();

      ctx.fillStyle = textColor;
      const valStr = Math.abs(r) < 1e-6 ? "0" : Number(r.toFixed(2)).toString();
      ctx.fillText(valStr, x, marginTop + plotHeight + 6);
    }
  }

  // Horizontal Grid Lines & Y-Axis Labels
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let im = startIm; im <= endIm + gridStep / 2; im += gridStep) {
    const y = mapY(im);
    if (y >= marginTop - 1 && y <= marginTop + plotHeight + 1) {
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      const valStr =
        Math.abs(im) < 1e-6 ? "0" : Number(im.toFixed(2)).toString();
      ctx.fillText(valStr, marginLeft - 8, y);
    }
  }

  // --- 5. DRAW ZERO AXES & CRITICAL POINT (-1, j0) ---
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.5;

  const originX = mapX(0);
  const originY = mapY(0);

  // Real axis line (Im = 0)
  if (originY >= marginTop && originY <= marginTop + plotHeight) {
    ctx.beginPath();
    ctx.moveTo(marginLeft, originY);
    ctx.lineTo(marginLeft + plotWidth, originY);
    ctx.stroke();
  }

  // Imaginary axis line (Re = 0)
  if (originX >= marginLeft && originX <= marginLeft + plotWidth) {
    ctx.beginPath();
    ctx.moveTo(originX, marginTop);
    ctx.lineTo(originX, marginTop + plotHeight);
    ctx.stroke();
  }

  // Critical Point (-1, j0) marker
  const critX = mapX(-1);
  const critY = mapY(0);
  if (
    critX >= marginLeft &&
    critX <= marginLeft + plotWidth &&
    critY >= marginTop &&
    critY <= marginTop + plotHeight
  ) {
    ctx.fillStyle = criticalPointColor;
    ctx.beginPath();
    ctx.arc(critX, critY, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("(-1, j0)", critX - 6, critY - 6);
  }

  // --- 6. DRAW PLOT BORDER ---
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.strokeRect(marginLeft, marginTop, plotWidth, plotHeight);

  // --- 7. AXIS TITLES ---
  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  ctx.fillText("Real Axis (Re)", marginLeft + plotWidth / 2, height - 10);

  ctx.save();
  ctx.translate(18, marginTop + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Imaginary Axis (Im)", 0, 0);
  ctx.restore();

  // --- 8. DRAW NYQUIST LOCUS CURVE ---
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();

  validPoints.forEach((pt, idx) => {
    const x = mapX(pt.real);
    const y = mapY(pt.imag);

    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}
