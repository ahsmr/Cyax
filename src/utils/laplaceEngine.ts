import type { Poly } from "./systemSolver";
import { cleanPoly } from "./systemSolver";

/**
- @property time    | time that the impulse response is evaluated (seconds)
- @property response| value of the impulse response at that time h(t)
 */
export interface ImpulsePoint {
  time: number; // t (seconds)
  response: number; // h(t)
}

/**
- @property latexEquation | LaTeX formatted equation for h(t)
- @property evaluate      | Function to evaluate h(t) numerically
 */
export interface InverseLaplaceResult {
  latexEquation: string; // Formatting h(t) = ...
  evaluate: (t: number) => number; // Numerical function h(t)
}

/**
- @property re | Real part of the complex number  
- @property im | Imaginary part of the complex number
 */
interface Complex {
  re: number;
  im: number;
}

/**
- Adds two complex numbers.
- @param a | First complex number
- @param b | Second complex number
- @returns | Sum of the two complex numbers
 */
function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

/**
- Subtracts two complex numbers.
- @param a | First complex number
- @param b | Second complex number
- @returns | Difference of the two complex numbers
 */
function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

/**
- Multiplies two complex numbers.
- @param a | First complex number
- @param b | Second complex number
- @returns | Product of the two complex numbers
 */
function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/**
- Divides two complex numbers. a / b = (a * conj(b)) / (b * conj(b))
- @param a | First complex number
- @param b | Second complex number
- @returns | Quotient of the two complex numbers
 */
function cDiv(a: Complex, b: Complex): Complex {
  const den = b.re * b.re + b.im * b.im;
  if (den === 0) return { re: 0, im: 0 };
  return {
    re: (a.re * b.re + a.im * b.im) / den,
    im: (a.im * b.re - a.re * b.im) / den,
  };
}

/**
- Evaluates a polynomial at a complex number s using Horner's method.
- @param poly | Coefficients of the polynomial (from lowest degree to highest)
- @param s | Complex number at which to evaluate the polynomial
- @returns | Result of the evaluation
 *
- @example | evalPolyComplexATS([1, 2, 3], { re: 0, im: 1 }) => { re: 0, im: 6 }
- @example | evalPolyComplexATS([1, 0, -1], { re: 1, im: 0 }) => { re: 0, im: 0 }
 */
export function evalPolyComplexATS(poly: Poly, s: Complex): Complex {
  let res: Complex = { re: 0, im: 0 };
  for (let i = poly.length - 1; i >= 0; i--) {
    res = cAdd(cMul(res, s), { re: poly[i], im: 0 });
  }
  return res;
}

/**
- Evaluates a complex-coefficient polynomial at a complex number s.
 */
function evalComplexPoly(poly: Complex[], s: Complex): Complex {
  let res: Complex = { re: 0, im: 0 };
  for (let i = poly.length - 1; i >= 0; i--) {
    res = cAdd(cMul(res, s), poly[i]);
  }
  return res;
}

/**
- Calculates the derivative of a polynomial.
- @param poly | Coefficients of the polynomial (from lowest degree to highest)
- @returns | Coefficients of the derivative polynomial
 */
function polyDerivative(poly: Poly): Poly {
  if (poly.length <= 1) return [0];
  const deriv: Poly = [];
  for (let i = 1; i < poly.length; i++) {
    deriv.push(i * poly[i]); // start from 1 since the derivative of a constant is 0
  }
  const cleaned = cleanPoly(deriv); // remove leading zeros
  return cleaned;
}

/**
- Divides a complex-coefficient polynomial P(s) by (s - r) using synthetic division.
 */
function deflateComplexLinear(poly: Complex[], r: Complex): Complex[] {
  const deg = poly.length - 1;
  if (deg <= 0) return [{ re: 0, im: 0 }];
  const q: Complex[] = new Array(deg);
  q[deg - 1] = poly[deg];
  for (let i = deg - 2; i >= 0; i--) {
    q[i] = cAdd(poly[i + 1], cMul(r, q[i + 1]));
  }
  return q;
}

/**
- Computes partial fraction residues c_1, ..., c_m for a pole p of multiplicity m:
- N(s) / D(s) = sum_{k=1..m} c_k / (s - p)^k + ...
- where c_{m - j} = (1 / j!) * (d^j / ds^j)[ N(s) / Q(s) ]|_{s = p} and Q(s) = D(s) / (s - p)^m.
 */
function computeRepeatedPoleResidues(
  num: Poly,
  den: Poly,
  p: Complex,
  multiplicity: number,
): Complex[] {
  // Convert den to Complex[] and deflate (s - p)^multiplicity
  let qPoly: Complex[] = den.map((c) => ({ re: c, im: 0 }));
  for (let m = 0; m < multiplicity; m++) {
    qPoly = deflateComplexLinear(qPoly, p);
  }

  // Taylor coefficients of N(s) and Q(s) around s = p:
  // Repeated synthetic division by (s - p) yields a_j = N^{(j)}(p)/j! and b_j = Q^{(j)}(p)/j!
  let nWork: Complex[] = num.map((c) => ({ re: c, im: 0 }));
  let qWork: Complex[] = [...qPoly];

  const a: Complex[] = [];
  const b: Complex[] = [];

  for (let j = 0; j < multiplicity; j++) {
    a.push(evalComplexPoly(nWork, p));
    b.push(evalComplexPoly(qWork, p));
    nWork = deflateComplexLinear(nWork, p);
    qWork = deflateComplexLinear(qWork, p);
  }

  // Series division: (sum_{j=0}^{m-1} a_j u^j) / (sum_{j=0}^{m-1} b_j u^j) = sum_{j=0}^{m-1} d_j u^j
  // where d_j = c_{m - j}
  const d: Complex[] = new Array(multiplicity);
  const b0 = Math.hypot(b[0].re, b[0].im) > 1e-12 ? b[0] : { re: 1e-12, im: 0 };

  for (let j = 0; j < multiplicity; j++) {
    let sum = a[j];
    for (let i = 1; i <= j; i++) {
      sum = cSub(sum, cMul(b[i], d[j - i]));
    }
    d[j] = cDiv(sum, b0);
  }

  // Return c_1 ... c_m where c_k corresponds to 1 / (s - p)^k
  const residues: Complex[] = new Array(multiplicity);
  for (let k = 1; k <= multiplicity; k++) {
    residues[k - 1] = d[multiplicity - k];
  }
  return residues;
}

/**
- Finds the roots of a polynomial.
- @param poly | Coefficients of the polynomial (from lowest degree to highest)
- @returns | List of complex roots
 */
function findRoots(poly: Poly): Complex[] {
  // Normalize lead coefficient
  const cleanedDen = cleanPoly(poly); // to avoid division by zero and ensure proper degree

  // Since cleanPoly([0]) returns [0], check if all coefficients are zero
  if (
    cleanedDen.length === 0 ||
    (cleanedDen.length === 1 && cleanedDen[0] === 0)
  ) {
    throw new Error("Denominator polynomial cannot be zero.");
  }
  const lead = cleanedDen[cleanedDen.length - 1];
  const p = cleanedDen.map((c) => c / lead);
  const degree = p.length - 1;

  if (degree === 0) {
    return [];
  }

  if (degree === 1) {
    // 1st Order: s + a = 0 => s = -a
    return [{ re: -p[0], im: 0 }];
  }

  if (degree === 2) {
    // Because in the beginning we normalized the polynomial, we can use the quadratic formula directly
    // 2nd Order: s^2 + a1*s + a0 = 0
    const a1 = p[1];
    const a0 = p[0];
    const disc = a1 * a1 - 4 * a0; // Discriminant

    if (disc >= 0) {
      return [
        { re: (-a1 + Math.sqrt(disc)) / 2, im: 0 },
        { re: (-a1 - Math.sqrt(disc)) / 2, im: 0 },
      ];
    } else {
      const alpha = -a1 / 2;
      const beta = Math.sqrt(-disc) / 2;
      return [
        { re: alpha, im: beta },
        { re: alpha, im: -beta },
      ];
    }
  }

  // General degree >= 3 using Durand-Kerner method
  // Compute Cauchy's bound to dynamically scale initial guesses
  let maxCoeff = 0;
  for (let i = 0; i < degree; i++) {
    if (Math.abs(p[i]) > maxCoeff) maxCoeff = Math.abs(p[i]);
  }
  const radius = 1 + maxCoeff;

  // Initialize roots evenly distributed on a circle of radius R (Aberth/Durand-Kerner initialization)
  const n = degree;
  let roots: Complex[] = [];
  for (let k = 0; k < n; k++) {
    const angle = (2 * Math.PI * k + 0.5) / n;
    roots.push({
      re: radius * Math.cos(angle),
      im: radius * Math.sin(angle),
    });
  }

  // Iterative refinement
  const maxIter = degree > 3 ? 250 : 100;
  for (let iter = 0; iter < maxIter; iter++) {
    const nextRoots: Complex[] = [];
    let maxStep = 0;

    for (let i = 0; i < n; i++) {
      const val = evalPolyComplexATS(p, roots[i]);

      let denom: Complex = { re: 1, im: 0 };
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const diff = cSub(roots[i], roots[j]);
          denom = cMul(denom, diff);
        }
      }

      const step = cDiv(val, denom);
      const stepMag = Math.hypot(step.re, step.im);
      if (stepMag > maxStep) maxStep = stepMag;
      nextRoots.push(cSub(roots[i], step));
    }

    roots = nextRoots; // Synchronous update (Jacobi style) to avoid intermediate state mutation
    if (maxStep < 1e-13) break;
  }

  // Clean small numerical noise and return
  return roots.map((r) => ({
    re: Math.abs(r.re) < 1e-5 ? 0 : r.re,
    im: Math.abs(r.im) < 1e-5 ? 0 : r.im,
  }));
}

/**
- Helper to format exponential terms in LaTeX cleanly.
 */
function formatExp(alpha: number): string {
  const alphaStr = Number(alpha.toFixed(3));
  if (alphaStr === 0) return "";
  if (alphaStr === 1) return "e^{t}";
  if (alphaStr === -1) return "e^{-t}";
  return `e^{${alphaStr}t}`;
}

/**
- Formats a scalar coefficient multiplying a non-empty symbolic factor (e.g. e^{-t} or t^2).
 */
function formatCoeffPrefix(coeff: number, hasFactor: boolean): string {
  const val = Number(coeff.toFixed(3));
  if (!hasFactor) return `${val}`;
  if (val === 1) return "";
  if (val === -1) return "-";
  return `${val}`;
}

/**
- Formats A*cos(beta*t) + B*sin(beta*t) cleanly without "1\cos" or "+ -".
 */
function formatTrigSum(A: number, B: number, beta: number): string {
  const betaStr = Number(beta.toFixed(3));
  const ARounded = Number(A.toFixed(3));
  const BRounded = Number(B.toFixed(3));

  const hasA = Math.abs(ARounded) > 1e-5;
  const hasB = Math.abs(BRounded) > 1e-5;

  if (hasA && hasB) {
    const aPrefix = formatCoeffPrefix(ARounded, true);
    const bMag = Math.abs(BRounded);
    const bPrefix = bMag === 1 ? "" : `${bMag}`;
    return `${aPrefix}\\cos(${betaStr}t) ${BRounded >= 0 ? "+" : "-"} ${bPrefix}\\sin(${betaStr}t)`;
  }
  if (hasA) {
    return `${formatCoeffPrefix(ARounded, true)}\\cos(${betaStr}t)`;
  }
  if (hasB) {
    return `${formatCoeffPrefix(BRounded, true)}\\sin(${betaStr}t)`;
  }
  return "";
}

/**
- Calculates Inverse Laplace Transform h(t) = L^-1 { N(s) / D(s) }
- @param num | Coefficients of the numerator polynomial (from lowest degree to highest)
- @param den | Coefficients of the denominator polynomial (from lowest degree to highest)
- @returns | Object containing LaTeX equation and numerical evaluation function
 */
export function inverseLaplace(num: Poly, den: Poly): InverseLaplaceResult {
  const cleanN = cleanPoly(num);
  const cleanD = cleanPoly(den);

  const isZeroPoly = (p: Poly) =>
    p.length === 0 || (p.length === 1 && p[0] === 0);

  if (isZeroPoly(cleanD)) {
    throw new Error("Denominator polynomial cannot be zero.");
  }

  const dNum = isZeroPoly(cleanN) ? -1 : cleanN.length - 1;
  const dDen = cleanD.length - 1;

  if (dNum > dDen) {
    throw new Error("Improper Transfer Function (Degree Num > Den)");
  }

  // Handle direct feedthrough d * delta(t) if dNum === dDen
  let dFeedthrough = 0;
  const remNum = [...cleanN];

  if (dNum === dDen && dDen >= 0) {
    dFeedthrough = cleanN[dNum] / cleanD[dDen];
    for (let i = 0; i <= dDen; i++) {
      remNum[i] -= dFeedthrough * cleanD[i];
    }
  }

  const poles = findRoots(cleanD);
  const denDeriv = polyDerivative(cleanD);

  // Group poles into real poles and complex conjugate pairs
  const processed = new Set<number>();
  const terms: {
    evaluate: (t: number) => number;
    latex: string;
  }[] = [];

  const clusterTol = 1e-2;

  for (let i = 0; i < poles.length; i++) {
    if (processed.has(i)) continue;
    const p = poles[i];

    if (Math.abs(p.im) < clusterTol) {
      // Check for repeated real poles and average cluster centroid
      const duplicates: number[] = [i];
      let sumRe = p.re;
      for (let j = i + 1; j < poles.length; j++) {
        if (
          !processed.has(j) &&
          Math.abs(poles[j].im) < clusterTol &&
          Math.abs(poles[j].re - p.re) < clusterTol
        ) {
          duplicates.push(j);
          sumRe += poles[j].re;
        }
      }

      duplicates.forEach((idx) => processed.add(idx));
      const pAvgRe =
        Math.abs(sumRe / duplicates.length) < 1e-4
          ? 0
          : sumRe / duplicates.length;
      const pAvg: Complex = { re: pAvgRe, im: 0 };

      if (duplicates.length === 1) {
        // Simple Real Pole: r_k * e^(p_k * t)
        const numVal = evalPolyComplexATS(remNum, pAvg);
        const denVal = evalPolyComplexATS(denDeriv, pAvg);
        const residue = cDiv(numVal, denVal).re;

        if (Math.abs(residue) > 1e-5) {
          const expStr = formatExp(pAvg.re);
          const prefix = formatCoeffPrefix(residue, expStr.length > 0);

          terms.push({
            evaluate: (t: number) => residue * Math.exp(pAvg.re * t),
            latex: `${prefix}${expStr}`,
          });
        }
      } else {
        // Repeated Real Pole of any multiplicity m >= 2:
        // sum_{k=1..m} (c_k / (k - 1)!) * t^(k - 1) * e^(p * t)
        const m = duplicates.length;
        const residues = computeRepeatedPoleResidues(remNum, cleanD, pAvg, m);
        const expStr = formatExp(pAvg.re);

        let fact = 1;
        for (let k = 1; k <= m; k++) {
          if (k > 1) fact *= k - 1;
          const timeCoeff = residues[k - 1].re / fact;

          if (Math.abs(timeCoeff) > 1e-5) {
            const power = k - 1;
            const tStr = power === 0 ? "" : power === 1 ? "t" : `t^{${power}}`;
            const factorStr = `${tStr}${expStr}`;
            const prefix = formatCoeffPrefix(timeCoeff, factorStr.length > 0);

            terms.push({
              evaluate: (t: number) =>
                timeCoeff * Math.pow(t, power) * Math.exp(pAvg.re * t),
              latex: `${prefix}${factorStr}`,
            });
          }
        }
      }
    } else {
      // Complex Pair (including repeated complex conjugate pairs): p = alpha +/- j*beta
      const posGroup: number[] = [i];
      const negGroup: number[] = [];
      let sumRe = p.re;
      let sumAbsIm = Math.abs(p.im);

      for (let j = i + 1; j < poles.length; j++) {
        if (processed.has(j)) continue;
        if (
          Math.abs(poles[j].re - p.re) < clusterTol &&
          Math.abs(poles[j].im - p.im) < clusterTol
        ) {
          posGroup.push(j);
          sumRe += poles[j].re;
          sumAbsIm += Math.abs(poles[j].im);
        } else if (
          Math.abs(poles[j].re - p.re) < clusterTol &&
          Math.abs(poles[j].im + p.im) < clusterTol
        ) {
          negGroup.push(j);
          sumRe += poles[j].re;
          sumAbsIm += Math.abs(poles[j].im);
        }
      }

      if (negGroup.length > 0) {
        posGroup.forEach((idx) => processed.add(idx));
        negGroup.forEach((idx) => processed.add(idx));

        const totalCount = posGroup.length + negGroup.length;
        const alphaRaw = sumRe / totalCount;
        const alpha = Math.abs(alphaRaw) < 1e-4 ? 0 : alphaRaw;
        const beta = sumAbsIm / totalCount;
        const m = Math.min(posGroup.length, negGroup.length);
        const pPos: Complex = { re: alpha, im: beta };

        if (m === 1) {
          const numVal = evalPolyComplexATS(remNum, pPos);
          const denVal = evalPolyComplexATS(denDeriv, pPos);
          const res = cDiv(numVal, denVal);

          const A = 2 * res.re;
          const B = -2 * res.im;
          const expStr = formatExp(alpha);
          const trigStr = formatTrigSum(A, B, beta);

          if (trigStr) {
            terms.push({
              evaluate: (t: number) =>
                Math.exp(alpha * t) *
                (A * Math.cos(beta * t) + B * Math.sin(beta * t)),
              latex: expStr ? `${expStr}(${trigStr})` : trigStr,
            });
          }
        } else {
          // Repeated complex conjugate pair of multiplicity m >= 2
          const residues = computeRepeatedPoleResidues(remNum, cleanD, pPos, m);
          const expStr = formatExp(alpha);

          let fact = 1;
          for (let k = 1; k <= m; k++) {
            if (k > 1) fact *= k - 1;
            const power = k - 1;
            const A = (2 * residues[k - 1].re) / fact;
            const B = (-2 * residues[k - 1].im) / fact;
            const trigStr = formatTrigSum(A, B, beta);

            if (trigStr) {
              const tStr =
                power === 0 ? "" : power === 1 ? "t" : `t^{${power}}`;
              const envStr = `${tStr}${expStr}`;
              terms.push({
                evaluate: (t: number) =>
                  Math.pow(t, power) *
                  Math.exp(alpha * t) *
                  (A * Math.cos(beta * t) + B * Math.sin(beta * t)),
                latex: envStr ? `${envStr}(${trigStr})` : trigStr,
              });
            }
          }
        }
      }
    }
  }

  // Combine into unified evaluator
  const evaluate = (t: number) => {
    if (t < 0) return 0;
    let val = 0;
    for (const term of terms) {
      val += term.evaluate(t);
    }
    return val;
  };

  // Build LaTeX Equation String cleanly
  let latexTerms = "";
  for (let idx = 0; idx < terms.length; idx++) {
    const termLatex = terms[idx].latex;
    if (idx === 0) {
      latexTerms += termLatex;
    } else {
      if (termLatex.startsWith("-")) {
        latexTerms += ` - ${termLatex.substring(1)}`;
      } else {
        latexTerms += ` + ${termLatex}`;
      }
    }
  }

  if (Math.abs(dFeedthrough) > 1e-5) {
    const dStr = Number(dFeedthrough.toFixed(3));
    if (latexTerms.length === 0) {
      latexTerms = `${dStr}\\delta(t)`;
    } else if (latexTerms.startsWith("-")) {
      latexTerms = `${dStr}\\delta(t) - ${latexTerms.substring(1)}`;
    } else {
      latexTerms = `${dStr}\\delta(t) + ${latexTerms}`;
    }
  }

  return {
    latexEquation: `h(t) = ${latexTerms || "0"}`,
    evaluate,
  };
}

/**
- Generates impulse response data points for plotting.
- @param num    | Coefficients of the numerator polynomial (from lowest degree to highest)
- @param den    | Coefficients of the denominator polynomial (from lowest degree to highest)
- @param tMax   | Maximum time to evaluate the impulse response (seconds)
- @param points | Number of points to generate between 0 and tMax
- @returns      | Array of ImpulsePoint objects containing time and response values
 */
export function generateImpulseResponseData(
  num: Poly,
  den: Poly,
  tMax = 10,
  points = 200,
): ImpulsePoint[] {
  const { evaluate } = inverseLaplace(num, den);
  const data: ImpulsePoint[] = [];
  const dt = tMax / points;

  for (let i = 0; i <= points; i++) {
    const t = i * dt;
    data.push({
      time: Number(t.toFixed(3)),
      response: Number(evaluate(t).toFixed(4)),
    });
  }

  return data;
}
