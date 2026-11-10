//import {evalPolyComplex} from './bodeEngine';
import {calculateAmp, calculateArg} from './bodeEngine';
import type {Poly} from './systemSolver'


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
  real: number;      // Re{H(j*omega)} = amp * cos(arg)
  imag: number;      // Im{H(j*omega)} = amp * sin(arg)
  amplitude: number; // |H(j*omega)|
  phaseRad: number;  // Arg(H(j*omega)) in radians
  phaseDeg: number;  // Arg(H(j*omega)) in degrees
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
  num: Poly,
  den: Poly,
  wMin = 0.01,
  wMax = 1000,
  pointsPerDecade = 50
): NyquistPoint[] {
  const data: NyquistPoint[] = [];

  const decMin = Math.log10(wMin);
  const decMax = Math.log10(wMax);
  const totalDecades = decMax - decMin;
  const totalPoints = Math.round(totalDecades * pointsPerDecade);

  for (let i = 0; i <= totalPoints; i++) {
    const logW = decMin + (i / totalPoints) * (decMax - decMin);
    const omega = Math.pow(10, logW);

    // Calculate magnitude (amplitude) and phase (arg) passing (num, den, omega)
    const amp = calculateAmp(num, den, omega);
    const arg = calculateArg(num, den, omega); // phase in radians

    // Coordinates based on formula: amp * (cos(arg) + j * sin(arg))
    const real = amp * Math.cos(arg);
    const imag = amp * Math.sin(arg);

    data.push({
      frequency: omega,
      real: Number(real.toFixed(6)),
      imag: Number(imag.toFixed(6)),
      amplitude: amp,
      phaseRad: arg,
      phaseDeg: (arg * 180) / Math.PI,
    });
  }

  return data;
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
  options: NyquistDrawOptions = {}
): void {
  if (data.length === 0) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  const {
    title = "Nyquist-diagram",
    strokeColor = "#1e40af",
    gridColor = "#d1d5db",
    subGridColor = "#f3f4f6",
    axisColor = "#374151",
    criticalPointColor = "#dc2626",
    textColor = "#374151",
    font = "12px sans-serif",
  } = options;

  ctx.clearRect(0, 0, width, height);
  ctx.font = font;

  // Margins matching Bode plot layout style
  const marginLeft = 65;
  const marginRight = 25;
  const marginTop = 35;
  const marginBottom = 45;

  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  // --- 1. DETERMINE AXIS BOUNDS & ASPECT RATIO ---
  let minRe = Infinity,
    maxRe = -Infinity;
  let minIm = Infinity,
    maxIm = -Infinity;

  for (const pt of data) {
    if (pt.real < minRe) minRe = pt.real;
    if (pt.real > maxRe) maxRe = pt.real;
    if (pt.imag < minIm) minIm = pt.imag;
    if (pt.imag > maxIm) maxIm = pt.imag;
  }

  // Ensure critical point (-1, j0) is included inside plot range
  minRe = Math.min(minRe, -1.2);
  maxRe = Math.max(maxRe, 0.5);
  minIm = Math.min(minIm, -1.0);
  maxIm = Math.max(maxIm, 1.0);

  // Preserve 1:1 aspect ratio mapping across Cartesian viewport
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
    marginTop + plotHeight - ((im - finalMinIm) / (finalMaxIm - finalMinIm)) * plotHeight;

  // --- 2. DRAW TITLE ---
  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  ctx.fillText(title, marginLeft + plotWidth / 2, marginTop - 15);

  // --- 3. DYNAMIC GRID CALCULATIONS & SUB-GRID LINES ---
  const rawStep = maxSpan / 6;
  const gridStep =
    rawStep > 2
      ? 5
      : rawStep > 1
        ? 2
        : rawStep > 0.4
          ? 0.5
          : rawStep > 0.15
            ? 0.2
            : 0.1;

  const startRe = Math.floor(finalMinRe / gridStep) * gridStep;
  const endRe = Math.ceil(finalMaxRe / gridStep) * gridStep;
  const startIm = Math.floor(finalMinIm / gridStep) * gridStep;
  const endIm = Math.ceil(finalMaxIm / gridStep) * gridStep;

  // Draw minor sub-grid lines
  ctx.strokeStyle = subGridColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);

  const subStep = gridStep / 2;
  for (let r = startRe; r <= endRe; r += subStep) {
    const x = mapX(r);
    if (x >= marginLeft && x <= marginLeft + plotWidth) {
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, marginTop + plotHeight);
      ctx.stroke();
    }
  }
  for (let im = startIm; im <= endIm; im += subStep) {
    const y = mapY(im);
    if (y >= marginTop && y <= marginTop + plotHeight) {
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + plotWidth, y);
      ctx.stroke();
    }
  }

  // Draw major grid lines & X-axis tick labels
  ctx.setLineDash([]);
  ctx.strokeStyle = gridColor;
  ctx.textAlign = "center";

  for (let r = startRe; r <= endRe; r += gridStep) {
    const x = mapX(r);
    if (x >= marginLeft && x <= marginLeft + plotWidth) {
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, marginTop + plotHeight);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(Number(r.toFixed(2)).toString(), x, marginTop + plotHeight + 18);
    }
  }

  // Draw Y-axis tick labels
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let im = startIm; im <= endIm; im += gridStep) {
    const y = mapY(im);
    if (y >= marginTop && y <= marginTop + plotHeight) {
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(Number(im.toFixed(2)).toString(), marginLeft - 8, y);
    }
  }

  // --- 4. DRAW ZERO AXES & CRITICAL POINT (-1, j0) ---
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1;

  const originX = mapX(0);
  const originY = mapY(0);

  // Re-axis line (Im = 0)
  if (originY >= marginTop && originY <= marginTop + plotHeight) {
    ctx.beginPath();
    ctx.moveTo(marginLeft, originY);
    ctx.lineTo(marginLeft + plotWidth, originY);
    ctx.stroke();
  }

  // Im-axis line (Re = 0)
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
    ctx.fillText("(-1, j0)", critX - 6, critY - 8);
  }

  // --- 5. DRAW PLOT BORDER ---
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.strokeRect(marginLeft, marginTop, plotWidth, plotHeight);

  // --- 6. DRAW AXIS TITLES ---
  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  ctx.fillText("Real Axis (Re)", marginLeft + plotWidth / 2, height - 10);

  ctx.save();
  ctx.translate(18, marginTop + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Imaginary Axis (Im)", 0, 0);
  ctx.restore();

  // --- 7. DRAW NYQUIST CURVE ---
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  data.forEach((pt, idx) => {
    const x = mapX(pt.real);
    const y = mapY(pt.imag);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}