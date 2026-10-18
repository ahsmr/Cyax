export interface BodePoint {
  frequency: number; // rad/s
  frequencyHz: number; // Hz (omega / 2pi)
  magnitudeDb: number; // dB
  phaseDeg: number; // degrees
}

interface Complex {
  re: number;
  im: number;
}

// Evaluate polynomial P(s) = c0 + c1*s + c2*s^2 + ... at s = j*omega
function evalPolyComplex(poly: number[], omega: number): Complex {
  let re = 0;
  let im = 0;

  for (let i = 0; i < poly.length; i++) {
    const coeff = poly[i];
    if (coeff === 0) continue;

    // (j*omega)^i
    // i % 4 == 0 -> +1
    // i % 4 == 1 -> +j
    // i % 4 == 2 -> -1
    // i % 4 == 3 -> -j
    const wPow = Math.pow(omega, i);
    const mod = i % 4;

    if (mod === 0) re += coeff * wPow;
    else if (mod === 1) im += coeff * wPow;
    else if (mod === 2) re -= coeff * wPow;
    else if (mod === 3) im -= coeff * wPow;
  }

  return { re, im };
}

/**
 * Generates Bode plot data points across a logarithmic frequency sweep.
 * @param num Numerator polynomial coefficients [c0, c1, ...]
 * @param den Denominator polynomial coefficients [d0, d1, ...]
 * @param wMin Log start frequency (e.g., 0.01 rad/s)
 * @param wMax Log end frequency (e.g., 1000 rad/s)
 * @param pointsPerDecade Number of sample points per decade (e.g., 50)
 */
export function generateBodeData(
  num: number[],
  den: number[],
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

  for (let i = 0; i <= totalPoints; i++) {
    const logW = decMin + (i / totalPoints) * (decMax - decMin);
    const omega = Math.pow(10, logW);

    // Evaluate Numerator N(j*omega) and Denominator D(j*omega)
    const N = evalPolyComplex(num, omega);
    const D = evalPolyComplex(den, omega);

    // H(j*omega) = N / D = (N * D*) / |D|^2
    const denMagSq = D.re * D.re + D.im * D.im;
    if (denMagSq < 1e-12) continue; // Avoid division by zero at poles

    const H_re = (N.re * D.re + N.im * D.im) / denMagSq;
    const H_im = (N.im * D.re - N.re * D.im) / denMagSq;

    // Magnitude (dB)
    const mag = Math.sqrt(H_re * H_re + H_im * H_im);
    const magnitudeDb = 20 * Math.log10(Math.max(mag, 1e-12));

    // Raw Phase (-180 to +180)
    let rawPhase = (Math.atan2(H_im, H_re) * 180) / Math.PI;

    // Basic Phase Unwrapping
    if (i > 0) {
      while (rawPhase - lastPhaseUnwrapped > 180) rawPhase -= 360;
      while (rawPhase - lastPhaseUnwrapped < -180) rawPhase += 360;
    }
    lastPhaseUnwrapped = rawPhase;

    data.push({
      frequency: omega,
      frequencyHz: omega / (2 * Math.PI),
      magnitudeDb,
      phaseDeg: rawPhase,
    });
  }

  return data;
}