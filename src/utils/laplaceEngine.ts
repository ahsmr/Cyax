import type { Poly } from "./systemSolver";

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
    deriv.push(i * poly[i]);
  }
  return deriv;
}

/**
 * Finds the poles of a transfer function represented by its denominator coefficients.
 * @param den | Coefficients of the denominator polynomial (from lowest degree to highest)
 * @returns | List of complex poles
 */
function findPoles(den: Poly): Complex[] {
  // Normalize lead coefficient
  const lead = den[den.length - 1];
  const p = den.map((c) => c / lead);
  const degree = p.length - 1;

  if (degree === 1) {
    // 1st Order: s + a = 0 => s = -a
    return [{ re: -p[0], im: 0 }];
  }

  if (degree === 2) {
    // 2nd Order: s^2 + a1*s + a0 = 0
    const a1 = p[1];
    const a0 = p[0];
    const disc = a1 * a1 - 4 * a0;

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
    // 3rd Order (Cardano's Method or Durand-Kerner numerical root finder)
    // Durand-Kerner iterative algorithm for general roots
    const roots: Complex[] = [
      { re: 0.4, im: 0.9 },
      { re: -0.8, im: -0.3 },
      { re: 0.2, im: -0.6 },
    ];

    for (let iter = 0; iter < 100; iter++) {
      for (let i = 0; i < 3; i++) {
        const val = evalPolyComplexATS(p, roots[i]);
        let denom: Complex = { re: 1, im: 0 };
        for (let j = 0; j < 3; j++) {
          if (i !== j) {
            denom = cMul(denom, cSub(roots[i], roots[j]));
          }
        }
        roots[i] = cSub(roots[i], cDiv(val, denom));
      }
    }

    // Clean small numerical noise
    return roots.map((r) => ({
      re: Math.abs(r.re) < 1e-6 ? 0 : r.re,
      im: Math.abs(r.im) < 1e-6 ? 0 : r.im,
    }));
  }

  throw new Error(`Unsupported polynomial degree: ${degree}`);
}

/**
 * Calculates Inverse Laplace Transform h(t) = L^-1 { N(s) / D(s) }
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

  const poles = findPoles(den);
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
