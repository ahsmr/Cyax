import type { Poly } from "./systemSolver";
import { cleanPoly } from "./systemSolver";

/**
 * @property time    | time that the impulse response is evaluated (seconds)
 * @property response| value of the impulse response at that time h(t)
 */
export interface ImpulsePoint {
  time: number; // t (seconds)
  response: number; // h(t)
}

/**
 * @property latexEquation | LaTeX formatted equation for h(t)
 * @property evaluate      | Function to evaluate h(t) numerically
 */
export interface InverseLaplaceResult {
  latexEquation: string; // Formatting h(t) = ...
  evaluate: (t: number) => number; // Numerical function h(t)
}

/**
 * @property re | Real part of the complex number  
 * @property im | Imaginary part of the complex number
 */
interface Complex {
  re: number;
  im: number;
}

/**
 * Adds two complex numbers.
 * @param a | First complex number
 * @param b | Second complex number
 * @returns | Sum of the two complex numbers
 */
function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

/**
 * Subtracts two complex numbers.
 * @param a | First complex number
 * @param b | Second complex number
 * @returns | Difference of the two complex numbers
 */
function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

/**
 * Multiplies two complex numbers.
 * @param a | First complex number
 * @param b | Second complex number
 * @returns | Product of the two complex numbers
 */
function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/**
 * Divides two complex numbers.
 * @param a | First complex number
 * @param b | Second complex number
 * @returns | Quotient of the two complex numbers
 */
function cDiv(a: Complex, b: Complex): Complex {
  const den = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / den,
    im: (a.im * b.re - a.re * b.im) / den,
  };
}

/**
 * Evaluates a polynomial at a complex number s.
 * @param poly | Coefficients of the polynomial (from lowest degree to highest)
 * @param s | Complex number at which to evaluate the polynomial
 * @returns | Result of the evaluation
 *
 * @example | evalPolyComplexATS([1, 2, 3], { re: 0, im: 1 }) => { re: 0, im: 6 }
 * @example | evalPolyComplexATS([1, 0, -1], { re: 1, im: 0 }) => { re: 0, im: 0 }
 */
export function evalPolyComplexATS(poly: Poly, s: Complex): Complex {
  let res: Complex = { re: 0, im: 0 };
  let sPow: Complex = { re: 1, im: 0 };

  for (let i = 0; i < poly.length; i++) {
    if (Math.abs(poly[i]) > 1e-9) {
      res = cAdd(res, cMul({ re: poly[i], im: 0 }, sPow));
    }
    sPow = cMul(sPow, s);
  }

  return res;
}

/**
 * Calculates the derivative of a polynomial.
 * @param poly | Coefficients of the polynomial (from lowest degree to highest)
 * @returns | Coefficients of the derivative polynomial
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
 * Finds the roots of a polynomial.
 * @param poly | Coefficients of the polynomial (from lowest degree to highest)
 * @returns | List of complex roots
 */
function findRoots(poly: Poly): Complex[] {
  // Normalize lead coefficient
  const cleanedDen = cleanPoly(poly); // to avoid devision by zero and ensure proper degree

  if (cleanedDen.length === 0) {
    throw new Error("Denominator polynomial cannot be zero.");
  }
  const lead = cleanedDen[cleanedDen.length - 1];
  const p = cleanedDen.map((c) => c / lead);
  const degree = p.length - 1;

  if (degree === 1) {
    // 1st Order: s + a = 0 => s = -a
    return [{ re: -p[0], im: 0 }];
  }

  if (degree === 2) {
    // Because in the beginnig we normalized the polynomial, we can use the quadratic formula directly
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

  if (degree === 3) {
    // Compute Cauchy's bound to dynamically scale initial guesses
    const maxCoeff = Math.max(Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2]));
    const radius = 1 + maxCoeff;

    // Initialize roots evenly distributed on a circle of radius R (Aberth/Durand-Kerner initialization)
    const n = 3;
    let roots: Complex[] = [];
    for (let k = 0; k < n; k++) {
      const angle = (2 * Math.PI * k + 0.5) / n;
      roots.push({
        re: radius * Math.cos(angle),
        im: radius * Math.sin(angle),
      });
    }

    // Iterative refinement
    for (let iter = 0; iter < 100; iter++) {
      const nextRoots: Complex[] = [];

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
        nextRoots.push(cSub(roots[i], step));
      }

      roots = nextRoots; // Synchronous update (Jacobi style) to avoid intermediate state mutation
    }

    // Clean small numerical noise and return
    return roots.map((r) => ({
      re: Math.abs(r.re) < 1e-6 ? 0 : r.re,
      im: Math.abs(r.im) < 1e-6 ? 0 : r.im,
    }));
  }
  throw new Error(`Unsupported polynomial degree: ${degree}`);
}

/**
 * Calculates Inverse Laplace Transform h(t) = L^-1 { N(s) / D(s) }
 * @param num | Coefficients of the numerator polynomial (from lowest degree to highest)
 * @param den | Coefficients of the denominator polynomial (from lowest degree to highest)
 * @returns | Object containing LaTeX equation and numerical evaluation function
 */
export function inverseLaplace(num: Poly, den: Poly): InverseLaplaceResult {
  const dNum = num.length - 1;
  const dDen = den.length - 1;

  if (dNum > dDen) {
    throw new Error("Improper Transfer Function (Degree Num > Den)");
  }

  // Handle direct feedthrough d * delta(t) if dNum === dDen
  let dFeedthrough = 0;
  const remNum = [...num];

  if (dNum === dDen) {
    dFeedthrough = num[dNum] / den[dDen];
    for (let i = 0; i <= dDen; i++) {
      remNum[i] -= dFeedthrough * den[i];
    }
  }

  const poles = findRoots(den);
  const denDeriv = polyDerivative(den);

  // Group poles into real poles and complex conjugate pairs
  const processed = new Set<number>();
  const terms: {
    evaluate: (t: number) => number;
    latex: string;
  }[] = [];

  for (let i = 0; i < poles.length; i++) {
    if (processed.has(i)) continue;
    const p = poles[i];

    if (Math.abs(p.im) < 1e-5) {
      // Real Pole: r_k * e^(p_k * t)
      const numVal = evalPolyComplexATS(remNum, p);
      const denVal = evalPolyComplexATS(denDeriv, p);
      const residue = cDiv(numVal, denVal).re;

      processed.add(i);

      if (Math.abs(residue) > 1e-5) {
        const rStr = Number(residue.toFixed(3));
        const pStr = Number(p.re.toFixed(3));
        const expStr = pStr === 0 ? "" : pStr === 1 ? "e^{t}" : `e^{${pStr}t}`;

        terms.push({
          evaluate: (t: number) => residue * Math.exp(p.re * t),
          latex: `${rStr}${expStr}`,
        });
      }
    } else {
      // Complex Pair: p = alpha +/- j*beta
      // Res = R_re + j*R_im => Term = 2*e^(alpha*t)*(R_re*cos(beta*t) - R_im*sin(beta*t))
      let pairIdx = -1;
      for (let j = i + 1; j < poles.length; j++) {
        if (
          Math.abs(poles[j].re - p.re) < 1e-4 &&
          Math.abs(poles[j].im + p.im) < 1e-4
        ) {
          pairIdx = j;
          break;
        }
      }

      if (pairIdx !== -1) {
        processed.add(i);
        processed.add(pairIdx);

        const numVal = evalPolyComplexATS(remNum, p);
        const denVal = evalPolyComplexATS(denDeriv, p);
        const res = cDiv(numVal, denVal);

        const alpha = p.re;
        const beta = Math.abs(p.im);
        const A = 2 * res.re;
        const B = -2 * res.im;

        const alphaStr = Number(alpha.toFixed(3));
        const betaStr = Number(beta.toFixed(3));
        const AStr = Number(A.toFixed(3));
        const BStr = Number(B.toFixed(3));

        const expStr =
          alphaStr === 0 ? "" : alphaStr === 1 ? "e^{t}" : `e^{${alphaStr}t}`;

        terms.push({
          evaluate: (t: number) =>
            Math.exp(alpha * t) *
            (A * Math.cos(beta * t) + B * Math.sin(beta * t)),
          latex: `${expStr}(${AStr}\\cos(${betaStr}t) + ${BStr}\\sin(${betaStr}t))`,
        });
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

  // Build LaTeX Equation String
  let latexTerms = terms.map((t) => t.latex).join(" + ");
  if (Math.abs(dFeedthrough) > 1e-5) {
    const dStr = Number(dFeedthrough.toFixed(3));
    latexTerms =
      `${dStr}\\delta(t)` + (latexTerms.length > 0 ? ` + ${latexTerms}` : "");
  }

  return {
    latexEquation: `h(t) = ${latexTerms || "0"}`,
    evaluate,
  };
}

/**
 * Generates numerical impulse response data points for UI time plots.
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
