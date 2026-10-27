import type { Poly } from "./systemSolver";
// import { cleanPoly } from "./systemSolver";
/**
 * Represents a single point in a Bode plot,
 * including frequency, magnitude, and phase information.
 *
 * @property frequency   | Frequency in radians per second (rad/s).
 * @property frequencyHz | Frequency in Hertz (Hz), calculated as frequency / (2 * π).
 * @property magnitudeDb | Magnitude in decibels (dB).
 * @property phaseDeg    | Phase angle in degrees (°).
 */
export interface BodePoint {
  frequency: number; // rad/s
  frequencyHz: number; // Hz (omega / 2pi)
  magnitudeDb: number; // dB
  phaseDeg: number; // degrees
}

/**
 * Options for customizing the appearance of the Bode plot when drawn on a canvas.
 *
 * @property title            | Optional title for the Bode plot.
 * @property strokeColorMag   | Color for the magnitude plot line (default: "#1e40af").
 * @property strokeColorPhase | Color for the phase plot line (default: "#1e40af").
 * @property gridColor        | Color for the major grid lines (default: "#d1d5db").
 * @property subGridColor     | Color for the minor grid lines (default: "#f3f4f6").
 * @property textColor        | Color for text labels and titles (default: "#374151").
 * @property font             | Font style for text labels and titles (default: "12px sans-serif").
 */
export interface BodeDrawOptions {
  title?: string;
  strokeColorMag?: string;
  strokeColorPhase?: string;
  gridColor?: string;
  subGridColor?: string;
  textColor?: string;
  font?: string;
}

/**
 * Represents a complex number with real and imaginary parts.
 *
 * @property re | Real part of the complex number.
 * @property im | Imaginary part of the complex number.
 */
interface Complex {
  re: number;
  im: number;
}

/**
 * Evaluate polynomial P(s) = c0 + c1*s + c2*s^2 + ... at s = j*omega
 * @param poly  | Coefficients of the polynomial [c0, c1, c2, ...]
 * @param omega | Frequency in rad/s
 * @returns     | Complex number representing P(j*omega)
 *
 * @example | evalPolyComplex([1, 2, 3], 1) => { re: 6, im: 2 }
 * @example | evalPolyComplex([1, 0, 1], 1) => { re: 0, im: 2 }
 */
function evalPolyComplex(poly: Poly, omega: number): Complex {
  let re = 0;
  let im = 0;

  for (let i = 0; i < poly.length; i++) {
    const coeff = poly[i];
    if (coeff === 0) continue;

    const power = i;
    const wPow = Math.pow(omega, power);
    const mod = power % 4;
    if (mod === 0)
      re += coeff * wPow; // (j*w)^0 = +1
    else if (mod === 1)
      im += coeff * wPow; // (j*w)^1 = +j
    else if (mod === 2)
      re -= coeff * wPow; // (j*w)^2 = -1
    else if (mod === 3) im -= coeff * wPow; // (j*w)^3 = -j
  }

  return { re, im };
}

/**
 *  Calculates the magnitude in decibels (dB) of the transfer function H(jω) = N(jω)/D(jω)
 *  at a specific angular frequency ω (omega).
 * @param num   | Numerator polynomial coefficients [c0, c1, ...]
 * @param den   | Denominator polynomial coefficients [d0, d1, ...]
 * @param omega | Angular frequency in (rad/s)
 * @returns     | Magnitude in dB
 */
export function calculateAmp(num: Poly, den: Poly, omega: number): number {
  const N = evalPolyComplex(num, omega);
  const D = evalPolyComplex(den, omega);

  const numMagSq = Math.max(N.re * N.re + N.im * N.im, 1e-15);
  const denMagSq = Math.max(D.re * D.re + D.im * D.im, 1e-15);

  const logN = 10 * Math.log10(numMagSq);
  const logD = 10 * Math.log10(denMagSq);

  return logN - logD;
}

/**
 *  Calculates the Argument in degrees of the transfer function H(jω) = N(jω)/D(jω)
 *  at a specific angular frequency ω (omega).
 * @param num   | Numerator polynomial coefficients [c0, c1, ...]
 * @param den   | Denominator polynomial coefficients [d0, d1, ...]
 * @param omega | Angular frequency in rad/s
 * @returns     | Phase angle in degrees
 */
export function calculateArg(num: Poly, den: Poly, omega: number): number {
  const N = evalPolyComplex(num, omega);
  const D = evalPolyComplex(den, omega);

  const angleN = Math.atan2(N.im, N.re);
  const angleD = Math.atan2(D.im, D.re);

  return ((angleN - angleD) * 180) / Math.PI;
}

/**
 * Generates Bode plot data points across a logarithmic frequency sweep.
 * @param num             | Numerator polynomial coefficients [c0, c1, ...]
 * @param den             | Denominator polynomial coefficients [d0, d1, ...]
 * @param wMin            | Log start frequency (e.g., 0.01 rad/s)
 * @param wMax            | Log end frequency (e.g., 1000 rad/s)
 * @param pointsPerDecade | Number of sample points per decade (e.g., 50)
 * @returns               | Array of BodePoint objects containing frequency, magnitude, and phase data.
 */
export function generateBodeData(
  num: Poly,
  den: Poly,
  wMin = 0.01,
  wMax = 1000,
  pointsPerDecade = 50,
): BodePoint[] {
  const data: BodePoint[] = [];

  const decMin = Math.log10(wMin);
  const decMax = Math.log10(wMax);
  const totalDecades = decMax - decMin;
  const totalPoints = Math.round(totalDecades * pointsPerDecade);

  let lastPhaseUnwrapped = 0;
  let hasInitialPhase = false;

  for (let i = 0; i <= totalPoints; i++) {
    const logW = decMin + (i / totalPoints) * (decMax - decMin);
    const omega = Math.pow(10, logW);

    // Magnitude (dB)
    const magnitudeDb = calculateAmp(num, den, omega);

    // Raw Phase (-180 to +180)
    let rawPhase = calculateArg(num, den, omega);
    // Basic Phase Unwrapping
    if (!hasInitialPhase) {
      lastPhaseUnwrapped = rawPhase;
      hasInitialPhase = true;
    } else {
      while (rawPhase - lastPhaseUnwrapped > 180) rawPhase -= 360;
      while (rawPhase - lastPhaseUnwrapped < -180) rawPhase += 360;
      lastPhaseUnwrapped = rawPhase;
    }

    data.push({
      frequency: omega,
      frequencyHz: omega / (2 * Math.PI),
      magnitudeDb,
      phaseDeg: rawPhase,
    });
  }

  return data;
}

/**
 * Draws the Bode plot on an HTML5 canvas element with dual subplots,
 * labeled axes, and logarithmic decade grids.
 * @param canvas | The HTMLCanvasElement to draw on.
 * @param data   | Array of BodePoint objects containing frequency, magnitude, and phase data.
 * @param options| Optional drawing customization options (colors, fonts, title).
 */
export function drawBodePlot(
  canvas: HTMLCanvasElement,
  data: BodePoint[],
  options: BodeDrawOptions = {},
): void {
  if (data.length === 0) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  const {
    title = "Bode-diagram",
    strokeColorMag = "#1e40af",
    strokeColorPhase = "#1e40af",
    gridColor = "#d1d5db",
    subGridColor = "#f3f4f6",
    textColor = "#374151",
    font = "12px sans-serif",
  } = options;

  ctx.clearRect(0, 0, width, height);
  ctx.font = font;

  // Margins for titles and axis labels
  const marginLeft = 65;
  const marginRight = 25;
  const marginTop = 35;
  const marginBottom = 45;
  const plotGap = 20;

  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = (height - marginTop - marginBottom - plotGap) / 2;

  // Horizontal boundaries
  const yMagTop = marginTop;
  const yMagBottom = marginTop + plotHeight;
  const yPhaseTop = yMagBottom + plotGap;
  const yPhaseBottom = yPhaseTop + plotHeight;

  // Frequency range (log scale)
  const logWMin = Math.log10(data[0].frequency);
  const logWMax = Math.log10(data[data.length - 1].frequency);

  // Auto-scale Y-axis limits
  let minMag = Infinity,
    maxMag = -Infinity;
  let minPhase = Infinity,
    maxPhase = -Infinity;

  for (const pt of data) {
    if (pt.magnitudeDb < minMag) minMag = pt.magnitudeDb;
    if (pt.magnitudeDb > maxMag) maxMag = pt.magnitudeDb;
    if (pt.phaseDeg < minPhase) minPhase = pt.phaseDeg;
    if (pt.phaseDeg > maxPhase) maxPhase = pt.phaseDeg;
  }

  minMag = Math.floor((minMag - 2) / 10) * 10;
  maxMag = Math.ceil((maxMag + 2) / 10) * 10;
  minPhase = Math.floor((minPhase - 5) / 30) * 30;
  maxPhase = Math.ceil((maxPhase + 5) / 30) * 30;

  // Mapping helpers
  const mapX = (w: number) =>
    marginLeft + ((Math.log10(w) - logWMin) / (logWMax - logWMin)) * plotWidth;

  const mapYMag = (mag: number) =>
    yMagBottom - ((mag - minMag) / (maxMag - minMag)) * plotHeight;

  const mapYPhase = (phase: number) =>
    yPhaseBottom - ((phase - minPhase) / (maxPhase - minPhase)) * plotHeight;

  // --- DRAW TITLE ---
  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  ctx.fillText(title, marginLeft + plotWidth / 2, marginTop - 15);

  // --- DRAW SUB-GRID & MAJOR LOGARITHMIC GRID (X-AXIS) ---
  const startDec = Math.floor(logWMin);
  const endDec = Math.ceil(logWMax);

  for (let dec = startDec; dec < endDec; dec++) {
    // Minor sub-ticks (2 to 9)
    ctx.strokeStyle = subGridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    for (let sub = 2; sub <= 9; sub++) {
      const wSub = sub * Math.pow(10, dec);
      if (wSub < data[0].frequency || wSub > data[data.length - 1].frequency)
        continue;
      const xSub = mapX(wSub);

      ctx.beginPath();
      ctx.moveTo(xSub, yMagTop);
      ctx.lineTo(xSub, yMagBottom);
      ctx.moveTo(xSub, yPhaseTop);
      ctx.lineTo(xSub, yPhaseBottom);
      ctx.stroke();
    }

    // Major decade grid
    const wMajor = Math.pow(10, dec);
    if (
      wMajor >= data[0].frequency &&
      wMajor <= data[data.length - 1].frequency
    ) {
      const xMajor = mapX(wMajor);
      ctx.strokeStyle = gridColor;
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(xMajor, yMagTop);
      ctx.lineTo(xMajor, yMagBottom);
      ctx.moveTo(xMajor, yPhaseTop);
      ctx.lineTo(xMajor, yPhaseBottom);
      ctx.stroke();

      // Frequency label on bottom plot
      ctx.textAlign = "center";
      ctx.fillText(`10${toSuperscript(dec)}`, xMajor, yPhaseBottom + 18);
    }
  }
  ctx.setLineDash([]);

  // --- DRAW Y-AXIS HORIZONTAL GRIDS & LABELS ---
  // Magnitude Y-Grid
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  // Dynamically calculate magnitude step size to prevent label overlap
  const magRange = maxMag - minMag;
  const rawStep = magRange / 6;

  const magStep =
    rawStep > 40
      ? 50
      : rawStep > 20
        ? 25
        : rawStep > 10
          ? 10
          : rawStep > 5
            ? 5
            : 2;

  const alignedMinMag = Math.floor(minMag / magStep) * magStep;
  const alignedMaxMag = Math.ceil(maxMag / magStep) * magStep;

  for (let m = alignedMinMag; m <= alignedMaxMag; m += magStep) {
    const y = mapYMag(m);

    // Skip drawing if point falls outside subplot bounds
    if (y < yMagTop - 1 || y > yMagBottom + 1) continue;

    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.moveTo(marginLeft, y);
    ctx.lineTo(marginLeft + plotWidth, y);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.fillText(`${m}`, marginLeft - 8, y);
  }

  // Phase Y-Grid
  // Dynamically calculate phase step size
  const phaseRange = maxPhase - minPhase;
  const rawPhaseStep = phaseRange / 6;

  const phaseStep =
    rawPhaseStep > 180
      ? 360
      : rawPhaseStep > 90
        ? 180
        : rawPhaseStep > 45
          ? 90
          : rawPhaseStep > 15
            ? 45
            : 30;

  const alignedMinPhase = Math.floor(minPhase / phaseStep) * phaseStep;
  const alignedMaxPhase = Math.ceil(maxPhase / phaseStep) * phaseStep;

  for (let p = alignedMinPhase; p <= alignedMaxPhase; p += phaseStep) {
    const y = mapYPhase(p);

    if (y < yPhaseTop - 1 || y > yPhaseBottom + 1) continue;

    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.moveTo(marginLeft, y);
    ctx.lineTo(marginLeft + plotWidth, y);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.fillText(`${p}`, marginLeft - 8, y);
  }

  // --- DRAW PLOT BORDERS ---
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.strokeRect(marginLeft, yMagTop, plotWidth, plotHeight);
  ctx.strokeRect(marginLeft, yPhaseTop, plotWidth, plotHeight);

  // --- DRAW AXIS TITLES ---
  // Frequency Label (X-Axis)
  ctx.textAlign = "center";
  ctx.fillText("Frequency (rad/s)", marginLeft + plotWidth / 2, height - 10);

  // Magnitude Label (Left Y-Axis, Top)
  ctx.save();
  ctx.translate(18, yMagTop + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Magnitude (dB)", 0, 0);
  ctx.restore();

  // Phase Label (Left Y-Axis, Bottom)
  ctx.save();
  ctx.translate(18, yPhaseTop + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Phase (deg)", 0, 0);
  ctx.restore();

  // --- DRAW MAGNITUDE CURVE ---
  ctx.strokeStyle = strokeColorMag;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  data.forEach((pt, idx) => {
    const x = mapX(pt.frequency);
    const y = mapYMag(pt.magnitudeDb);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // --- DRAW PHASE CURVE ---
  ctx.strokeStyle = strokeColorPhase;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  data.forEach((pt, idx) => {
    const x = mapX(pt.frequency);
    const y = mapYPhase(pt.phaseDeg);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

/**
 * Converts integer numbers to Unicode superscript string (e.g. 8 -> ⁸).
 */
function toSuperscript(num: number): string {
  const superscripts: Record<string, string> = {
    "-": "⁻",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };
  return num
    .toString()
    .split("")
    .map((c) => superscripts[c] || c)
    .join("");
}
