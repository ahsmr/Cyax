import type { Node, Edge } from "@xyflow/react";
import { evalPolyComplexATS } from "./laplaceEngine";
/**
 * @todo [X] | 1) Diff equation has to be implemented
 * @todo [ ] | 2) Impulse reponse has to be implemented
 * @todo [ ] | 3) Step response has to be implemented
 * @todo [ ] | 4) minimality and overservabiltiy and readabilty and internally/BIBO stability has to be implemented
 * @todo [ ] | 5) Add support for discrete-time systems (z-domain)
 * @todo [ ] | 6) Add support for MIMO systems (multiple inputs and outputs) (Low priority)
 * @todo [ ] | 7) Add Nyquist diagram too
 * @todo [ ] | 8) Add steady state response/error and transient response analysis (Low priority)
 * @todo [ ] | 9) Add support for compensators and controllers (PID, Lead, Lag, etc.) (Low priority)
 * @todo [ ] | 10) Add support for simplifying so that it actually simplfies the transfer function (Low priority)
 * @todo [X] | 11) Add support for the factorization of polynomials into irreducible factors
 */

// ==========================================
// 1. TYPE DEFINITIONS & INTERFACES
// ==========================================

/**
 * Represents the result of the transfer function derivation process.
 * @property numerator     | Coefficients of the numerator polynomial (null if unsolvable)
 * @property denominator   | Coefficients of the denominator polynomial (null if unsolvable)
 * @property latexEquation | The formatted final LaTeX equation H(s)
 * @property stepByStep    | Step-by-step state-space derivation details
 * @property error?        | Optional error details on calculation failure
 */
export interface SolverResult {
  numerator: Poly | null; // Coefficients of the numerator polynomial (null if unsolvable)
  denominator: Poly | null; // Coefficients of the denominator polynomial (null if unsolvable)
  latexEquation: string; // The formatted final LaTeX equation H(s)
  stepByStep: string[]; // Step-by-step state-space derivation details
  error?: string; // Optional error details on calculation failure
}

/**
 * Polynomial in s, indexed by power.
 * [c0, c1, c2] => c0 + c1*s + c2*s^2
 */
export type Poly = number[];

/**
 * Rational function represented
 * by numerator and denominator polynomials.
 * @property num | The numerator polynomial coefficients.
 * @property den | The denominator polynomial coefficients.
 */
interface Rational {
  num: Poly;
  den: Poly;
}

/**
 * @property re | Real part of the complex number  
 * @property im | Imaginary part of the complex number
 */
interface Complex {
  re: number;
  im: number;
}

const EPSILON = 1e-7;

// ==========================================
// 2. POLYNOMIAL ARITHMETIC & EUCLIDEAN HELPERS
// ==========================================

/**
 * cleans a polynomial by removing leading zeros and rounding near-zero coefficients to zero.
 *
 * @param p | The polynomial to clean.
 * @returns | The cleaned polynomial with no leading zeros and
 *          | coefficients rounded to zero if they are within EPSILON.
 *
 * @example cleanPoly([1, 2, 0, 0]) => [1, 2]
 * @example cleanPoly([0, 0, 0]) => [0]
 * @example cleanPoly([1e-8, 2, 3]) => [0, 2, 3]
 */
export function cleanPoly(p: Poly): Poly {
  const cleaned = p.map((c) => (Math.abs(c) < EPSILON ? 0 : c));
  let len = cleaned.length;
  while (len > 0 && Math.abs(cleaned[len - 1]) < EPSILON) len--;
  return len === 0 ? [0] : cleaned.slice(0, len);
}

/**
 * Adds two polynomials together.
 * @param a | The first polynomial.
 * @param b | The second polynomial.
 * @returns | The resulting polynomial after addition.
 *
 * @example polyAdd([1, 2], [3, 4, 5]) => [4, 6, 5]
 * @example polyAdd([1, 2, 3], [-1, -2]) => [0, 0, 3]
 * @example polyAdd([1, 2, 3], [-1, -2, -3]) => [0]
 */
function polyAdd(a: Poly, b: Poly): Poly {
  const max = Math.max(a.length, b.length);
  const res = new Array(max).fill(0);
  for (let i = 0; i < max; i++) {
    res[i] = (i < a.length ? a[i] : 0) + (i < b.length ? b[i] : 0);
  }
  return cleanPoly(res);
}

/**
 *  Subtracts polynomial b from polynomial a.
 * @param a | The polynomial to subtract from.
 * @param b | The polynomial to subtract.
 * @returns | The resulting polynomial after subtraction.
 *
 * @example polySub([1, 2, 3], [1, 2]) => [0, 0, 3]
 * @example polySub([1, 2, 3], [1, 2, 3]) => [0]
 */
function polySub(a: Poly, b: Poly): Poly {
  const max = Math.max(a.length, b.length);
  const res = new Array(max).fill(0);
  for (let i = 0; i < max; i++) {
    res[i] = (i < a.length ? a[i] : 0) - (i < b.length ? b[i] : 0);
  }
  return cleanPoly(res);
}

/**
 *  Multiplies two polynomials together.
 * @param a | The first polynomial.
 * @param b | The second polynomial.
 * @returns | The resulting polynomial after multiplication.
 *
 * @example polyMul([1, 2], [3, 4]) => [3, 10, 8]
 * @example polyMul([1, 0, 2], [0, 1]) => [0, 1, 0, 2]
 * @example polyMul([0], [1, 2, 3]) => [0]
 */
function polyMul(a: Poly, b: Poly): Poly {
  if ((a.length === 1 && a[0] === 0) || (b.length === 1 && b[0] === 0))
    return [0];
  const res = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      res[i + j] += a[i] * b[j];
    }
  }
  return cleanPoly(res);
}

/**
 *  Divides polynomial a by polynomial b, returning the quotient and remainder.
 * @param a | The dividend polynomial.
 * @param b | The divisor polynomial.
 * @returns | An object containing the quotient and remainder polynomials.
 *
 * @example
 * // Dividing (s^2 + 3s + 2) by (s + 1)
 * // A = [2, 3, 1], B = [1, 1] => Q = (s + 2) => [2, 1], R = 0 => [0]
 * polyDivMod([2, 3, 1], [1, 1]);
 * // => { q: [2, 1], r: [0] }
 *
 * @example
 * // Dividing (s^2 + 3s + 5) by (s + 1)
 * // A = [5, 3, 1], B = [1, 1] => Q = (s + 2) => [2, 1], R = 3 => [3]
 * polyDivMod([5, 3, 1], [1, 1]);
 * // => { q: [2, 1], r: [3] }
 */
function polyDivMod(a: Poly, b: Poly): { q: Poly; r: Poly } {
  let r = [...a];
  const q = new Array(Math.max(0, a.length - b.length + 1)).fill(0);

  while (r.length >= b.length && !(r.length === 1 && r[0] === 0)) {
    const scale = r[r.length - 1] / b[b.length - 1];
    const degDiff = r.length - b.length;
    q[degDiff] = scale;

    const term = new Array(degDiff + 1).fill(0);
    term[degDiff] = scale;
    r = polySub(r, polyMul(b, term));
  }

  return { q: cleanPoly(q), r: cleanPoly(r) };
}

/**
 * Computes the greatest common divisor (GCD) of two polynomials.
 * @param a | The first polynomial.
 * @param b | The second polynomial.
 * @returns | The GCD polynomial of a and b, normalized to have a leading coefficient of 1.
 *
 * @example
 * // GCD of (s^2 + 3s + 2) and (s^2 + 4s + 3) -> Common factor is (s + 1)
 * polyGcd([2, 3, 1], [3, 4, 1]);
 * // => [1, 1]
 *
 * @example
 * // Coprime polynomials (s^2 + 1) and (s + 2) -> GCD is 1
 * polyGcd([1, 0, 1], [2, 1]);
 * // => [1]
 */
function polyGcd(a: Poly, b: Poly): Poly {
  let x = cleanPoly(a);
  let y = cleanPoly(b);

  while (!(y.length === 1 && y[0] === 0)) {
    const { r } = polyDivMod(x, y);
    x = y;
    y = r;
  }

  if (x.length > 0 && Math.abs(x[x.length - 1]) > EPSILON) {
    const lead = x[x.length - 1];
    x = x.map((c) => c / lead);
  }
  return cleanPoly(x);
}

/**
 * Simplifies a rational function represented by numerator and denominator polynomials.
 * @param num | The numerator polynomial.
 * @param den | The denominator polynomial.
 * @returns   | The simplified rational function with
 *            | the numerator and denominator polynomials reduced by their GCD.
 *
 * Rational Simplification Engine:
 * Cancels common polynomial factors (GCD), cancels trailing powers of 's',
 * and normalizes leading coefficients of denominator polynomials.
 *
 * @example
 * // Cancels common factor (s + 0.25) from numerator and denominator
 * // (s^2 + 1.25s + 0.25) / (s^3 + 1.0s^2 + 0.3125s + 0.03125) => (s + 1) / (s^2 + 0.75s + 0.125)
 * simplifyRational([0.25, 1.25, 1], [0.03125, 0.3125, 1.0, 1]);
 * // => { num: [1, 1], den: [0.125, 0.75, 1] }
 *
 * @example
 * // Zero numerator reduces to 0 / 1
 * simplifyRational([0, 0], [1, 2]);
 * // => { num: [0], den: [1] }
 *
 * @example
 * // Normalizes leading coefficient of denominator to 1
 * // (4s + 2) / (2s^2 + 6s + 4) => (2s + 1) / (s^2 + 3s + 2)
 * simplifyRational([2, 4], [4, 6, 2]);
 * // => { num: [1, 2], den: [2, 3, 1] }
 */
function simplifyRational(num: Poly, den: Poly): Rational {
  let n = cleanPoly(num);
  let d = cleanPoly(den);

  if (n.length === 1 && n[0] === 0) {
    return { num: [0], den: [1] };
  }

  const gcd = polyGcd(n, d);
  if (gcd.length > 1) {
    n = polyDivMod(n, gcd).q;
    d = polyDivMod(d, gcd).q;
  }

  if (d.length > 0) {
    const leadD = d[d.length - 1];
    if (Math.abs(leadD) > EPSILON && Math.abs(leadD - 1) > EPSILON) {
      n = n.map((c) => c / leadD);
      d = d.map((c) => c / leadD);
    }
  }

  return { num: cleanPoly(n), den: cleanPoly(d) };
}

function solveAllRoots(poly: Poly): Complex[] {
  const cleanP = cleanPoly(poly);
  const n = cleanP.length - 1;
  if (n <= 0) return [];

  const lead = cleanP[n];
  const p = cleanP.map((c) => c / lead);

  if (n === 1) {
    return [{ re: -p[0], im: 0 }];
  }

  if (n === 2) {
    const disc = p[1] * p[1] - 4 * p[0];
    if (disc >= 0) {
      return [
        { re: (-p[1] + Math.sqrt(disc)) / 2, im: 0 },
        { re: (-p[1] - Math.sqrt(disc)) / 2, im: 0 },
      ];
    } else {
      const alpha = -p[1] / 2;
      const beta = Math.sqrt(-disc) / 2;
      return [
        { re: alpha, im: beta },
        { re: alpha, im: -beta },
      ];
    }
  }

  // Initial complex root estimates on the unit circle
  const roots: Complex[] = [];
  const radius = 0.4;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n + 0.1;
    roots.push({
      re: Math.pow(radius, i) * Math.cos(angle),
      im: Math.pow(radius, i) * Math.sin(angle),
    });
  }

  // Durand-Kerner iterative refinement
  const maxIter = 100;
  for (let iter = 0; iter < maxIter; iter++) {
    let maxChange = 0;
    for (let i = 0; i < n; i++) {
      const pVal = evalPolyComplexATS(p, roots[i]);

      let denom: Complex = { re: 1, im: 0 };
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const diffRe = roots[i].re - roots[j].re;
        const diffIm = roots[i].im - roots[j].im;

        const nextRe = denom.re * diffRe - denom.im * diffIm;
        const nextIm = denom.re * diffIm + denom.im * diffRe;
        denom = { re: nextRe, im: nextIm };
      }

      const denomMagSq = denom.re * denom.re + denom.im * denom.im;
      if (denomMagSq < 1e-12) continue;

      const dzRe = (pVal.re * denom.re + pVal.im * denom.im) / denomMagSq;
      const dzIm = (pVal.im * denom.re - pVal.re * denom.im) / denomMagSq;

      roots[i].re -= dzRe;
      roots[i].im -= dzIm;

      const change = Math.sqrt(dzRe * dzRe + dzIm * dzIm);
      if (change > maxChange) maxChange = change;
    }

    if (maxChange < EPSILON) break;
  }

  return roots.map((r) => ({
    re: Math.abs(r.re) < EPSILON ? 0 : r.re,
    im: Math.abs(r.im) < EPSILON ? 0 : r.im,
  }));
}

/**
 * Factors any polynomial P(s) into its list of simplest irreducible
 * real polynomial factors [c0, c1, (c2)].
 *
 * @param poly Coefficients array in ascending order [c0, c1, c2, ...]
 * @returns Array of polynomial factor arrays Poly[] (number[][])
 *
 * @example
 * // Factors (s^2 - 4) => [-4, 0, 1]
 * factorPolynomial([-4, 0, 1]);
 * // => [[-2, 1], [2, 1]]  representing (s - 2)(s + 2)
 *
 * @example
 * // Factors (s^3 + 4s^2 + 10s + 7) => [7, 10, 4, 1]
 * factorPolynomial([7, 10, 4, 1]);
 * // => [[1, 1], [7, 3, 1]]  representing (s + 1)(s^2 + 3s + 7)
 */
export function factorPolynomial(poly: Poly): Poly[] {
  const cleanP = cleanPoly(poly);
  const n = cleanP.length - 1;

  if (n <= 0) {
    return [cleanP];
  }

  const leadingCoeff = cleanP[n];
  const roots = solveAllRoots(cleanP);
  const used = new Array(roots.length).fill(false);
  const result: Poly[] = [];

  for (let i = 0; i < roots.length; i++) {
    if (used[i]) continue;

    if (Math.abs(roots[i].im) < EPSILON) {
      // Real linear factor: (s - r) => [-r, 1]
      const r = Number(roots[i].re.toFixed(4));
      result.push(cleanPoly([-r, 1]));
      used[i] = true;
    } else {
      // Complex conjugate pair: alpha +/- j*beta => s^2 - 2*alpha*s + (alpha^2 + beta^2)
      let pairIdx = -1;
      for (let j = i + 1; j < roots.length; j++) {
        if (
          !used[j] &&
          Math.abs(roots[i].re - roots[j].re) < 1e-3 &&
          Math.abs(roots[i].im + roots[j].im) < 1e-3
        ) {
          pairIdx = j;
          break;
        }
      }

      if (pairIdx !== -1) {
        const alpha = roots[i].re;
        const beta = Math.abs(roots[i].im);

        const a1 = Number((-2 * alpha).toFixed(4));
        const a0 = Number((alpha * alpha + beta * beta).toFixed(4));

        result.push(cleanPoly([a0, a1, 1]));

        used[i] = true;
        used[pairIdx] = true;
      }
    }
  }

  // Include leading coefficient if non-monic (a != 1)
  if (leadingCoeff !== 1) {
    if (result.length > 0) {
      result[0] = result[0].map((c) => c * leadingCoeff);
    } else {
      result.push([leadingCoeff]);
    }
  }

  return result;
}

// ==========================================
// 3. LATEX FORMATTING HELPERS
// ==========================================

/**
 * Converts a polynomial to its LaTeX representation.
 * @param p | The polynomial to convert.
 * @returns | The LaTeX string representation of the polynomial.
 */
function polyToLaTeX(p: Poly): string {
  const cleanP = cleanPoly(p);
  const len = cleanP.length;
  if (len === 1 && cleanP[0] === 0) return "0";

  const terms: string[] = [];
  for (let i = len - 1; i >= 0; i--) {
    const coeff = cleanP[i];
    if (Math.abs(coeff) < EPSILON) continue;

    const roundedCoeff = Number(coeff.toFixed(4));
    const absCoeff = Math.abs(roundedCoeff);

    const termStr =
      i === 0
        ? `${absCoeff}`
        : i === 1
          ? absCoeff === 1
            ? "s"
            : `${absCoeff}s`
          : absCoeff === 1
            ? `s^{${i}}`
            : `${absCoeff}s^{${i}}`;

    if (terms.length === 0) {
      terms.push(roundedCoeff < 0 ? `-${termStr}` : termStr);
    } else {
      terms.push(roundedCoeff < 0 ? `- ${termStr}` : `+ ${termStr}`);
    }
  }

  return terms.length > 0 ? terms.join(" ") : "0";
}

/**
 * Converts a matrix of numbers to its LaTeX representation.
 * @param matrix | The matrix to convert.
 * @returns | The LaTeX string representing the matrix.
 */
function matrixToLaTeX(matrix: number[][]): string {
  const rows = matrix.map((row) =>
    row.map((val) => Number(val.toFixed(4))).join(" & "),
  );
  return `\\begin{bmatrix} ${rows.join(" \\\\ ")} \\end{bmatrix}`;
}

// ==========================================
// 4. SYMBOLIC MATRIX ALGEBRA FOR (sI - A)^(-1)
// ==========================================

/**
 * Computes the determinant of a matrix of polynomials.
 * @param matrix | The matrix of polynomials.
 * @returns      | The determinant polynomial of the matrix.
 */
function polyDeterminant(matrix: Poly[][]): Poly {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) {
    return polySub(
      polyMul(matrix[0][0], matrix[1][1]),
      polyMul(matrix[0][1], matrix[1][0]),
    );
  }

  let det: Poly = [0];
  for (let c = 0; c < n; c++) {
    const subMatrix: Poly[][] = [];
    for (let r = 1; r < n; r++) {
      subMatrix.push(matrix[r].filter((_, colIdx) => colIdx !== c));
    }
    const minorDet = polyDeterminant(subMatrix);
    const term = polyMul(matrix[0][c], minorDet);
    if (c % 2 === 0) {
      det = polyAdd(det, term);
    } else {
      det = polySub(det, term);
    }
  }
  return det;
}

/**
 * Computes the adjugate of a matrix of polynomials.
 * @param matrix | The matrix of polynomials.
 * @returns      | The adjugate matrix as a matrix of polynomials.
 */
function polyAdjugate(matrix: Poly[][]): Poly[][] {
  const n = matrix.length;
  const adj: Poly[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => [0]),
  );

  if (n === 1) {
    adj[0][0] = [1];
    return adj;
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const subMatrix: Poly[][] = [];
      for (let i = 0; i < n; i++) {
        if (i === r) continue;
        subMatrix.push(matrix[i].filter((_, colIdx) => colIdx !== c));
      }
      const minorDet = polyDeterminant(subMatrix);
      const sign = (r + c) % 2 === 0 ? 1 : -1;
      adj[c][r] = sign === 1 ? minorDet : polyMul([-1], minorDet);
    }
  }

  return adj;
}

// ==========================================
// 5. MAIN TRANSFER FUNCTION SOLVER (STATE-SPACE METHOD)
// ==========================================

/**
 * Derives the Transfer Function H(s) = C(sI - A)^(-1)B + D
 * by constructing continuous-time state-space matrices A, B, C, D directly from the diagram.
 * @param nodes | The array of nodes representing the system diagram.
 * @param edges | The array of edges representing the connections between nodes.
 * @returns     | The SolverResult containing the LaTeX equation and step-by-step derivation.
 *
 * @example
 * // Given a system with nodes and edges representing a state-space system,
 * // derive the transfer function H(s).
 * const result = deriveTransferFunction(nodes, edges);
 */
export function deriveTransferFunction(
  nodes: Node[],
  edges: Edge[],
): SolverResult {
  try {
    const stepByStep: string[] = [];

    const inputNode = nodes.find((n) => n.type === "input" || n.id === "u_in");
    const outputNode = nodes.find(
      (n) => n.type === "output" || n.id === "y_out",
    );

    if (!inputNode || !outputNode) {
      return {
        denominator: null,
        numerator: null,
        latexEquation: "H(s) = \\text{Invalid Topology}",
        stepByStep: ["Missing input u(t) or output y(t) block."],
      };
    }

    // Identify state variables (outputs of integrator blocks)
    const integratorNodes = nodes.filter((n) => n.type === "integrator");
    const numStates = integratorNodes.length;

    const internalNodes = nodes.filter(
      (n) => n.id !== inputNode.id && n.id !== outputNode.id,
    );

    // Map internal non-integrator node signals algebraically
    const nonIntegrators = internalNodes.filter((n) => n.type !== "integrator");
    const nodeIndexMap = new Map<string, number>();
    nonIntegrators.forEach((n, idx) => nodeIndexMap.set(n.id, idx));

    // Solve for signal path gain matrix M mapping inputs [u, x1..xn] to internal nodes & integrators
    const K = nonIntegrators.length;
    const M_node = Array.from({ length: K }, () => Array(K).fill(0));
    const M_u = Array(K).fill(0);
    const M_x = Array.from({ length: K }, () => Array(numStates).fill(0));

    nonIntegrators.forEach((node, i) => {
      const incoming = edges.filter((e) => e.target === node.id);
      incoming.forEach((e) => {
        const branchGain =
          node.type === "gain"
            ? Number(node.data?.gain ?? 1)
            : node.type === "summing" && e.targetHandle === "in-minus"
              ? -1
              : 1;

        if (e.source === inputNode.id) {
          M_u[i] += branchGain;
        } else {
          const stateIdx = integratorNodes.findIndex((x) => x.id === e.source);
          if (stateIdx !== -1) {
            M_x[i][stateIdx] += branchGain;
          } else if (nodeIndexMap.has(e.source)) {
            const srcIdx = nodeIndexMap.get(e.source)!;
            M_node[i][srcIdx] += branchGain;
          }
        }
      });
    });

    // Gaussian Elimination for Non-Integrator Block Relationships: (I - M_node) * V = M_u * u + M_x * x
    const I_minus_M = Array.from({ length: K }, (_, r) =>
      Array.from({ length: K }, (_, c) => (r === c ? 1 : 0) - M_node[r][c]),
    );

    const sol_u = [...M_u];
    const sol_x = M_x.map((row) => [...row]);

    for (let i = 0; i < K; i++) {
      const pivot = I_minus_M[i][i];
      if (Math.abs(pivot) < EPSILON) continue;

      for (let j = 0; j < K; j++) I_minus_M[i][j] /= pivot;
      sol_u[i] /= pivot;
      for (let s = 0; s < numStates; s++) sol_x[i][s] /= pivot;

      for (let r = 0; r < K; r++) {
        if (r !== i) {
          const factor = I_minus_M[r][i];
          for (let j = 0; j < K; j++)
            I_minus_M[r][j] -= factor * I_minus_M[i][j];
          sol_u[r] -= factor * sol_u[i];
          for (let s = 0; s < numStates; s++)
            sol_x[r][s] -= factor * sol_x[i][s];
        }
      }
    }

    // Helper function to solve signal value at any node as a linear combination of (x, u)
    const resolveNodeSignal = (targetId: string) => {
      const coeffs_x = Array(numStates).fill(0);
      let coeff_u = 0;

      if (targetId === inputNode.id) {
        coeff_u = 1;
        return { coeffs_x, coeff_u };
      }

      const stateIdx = integratorNodes.findIndex((x) => x.id === targetId);
      if (stateIdx !== -1) {
        coeffs_x[stateIdx] = 1;
        return { coeffs_x, coeff_u };
      }

      const nodeIdx = nodeIndexMap.get(targetId);
      if (nodeIdx !== undefined) {
        coeff_u = sol_u[nodeIdx];
        for (let s = 0; s < numStates; s++) coeffs_x[s] = sol_x[nodeIdx][s];
      }

      return { coeffs_x, coeff_u };
    };

    // Construct Continuous State-Space Matrices A, B, C, D
    const A_mat: number[][] = Array.from({ length: numStates }, () =>
      Array(numStates).fill(0),
    );
    const B_mat: number[][] = Array.from({ length: numStates }, () => [0]);
    const C_mat: number[][] = [Array(numStates).fill(0)];
    let D_val = 0;

    // Populate A and B from integrator inputs (x_dot)
    integratorNodes.forEach((intNode, i) => {
      const incomingEdges = edges.filter((e) => e.target === intNode.id);
      incomingEdges.forEach((e) => {
        const { coeffs_x, coeff_u } = resolveNodeSignal(e.source);
        for (let j = 0; j < numStates; j++) {
          A_mat[i][j] += coeffs_x[j];
        }
        B_mat[i][0] += coeff_u;
      });
    });

    // Populate C and D from output node inputs (y)
    const outEdges = edges.filter((e) => e.target === outputNode.id);
    outEdges.forEach((e) => {
      // Determine if the incoming branch to the output carries a gain or sign inversion
      const branchGain =
        outputNode.type === "summing" && e.targetHandle === "in-minus" ? -1 : 1;

      const { coeffs_x, coeff_u } = resolveNodeSignal(e.source);
      for (let j = 0; j < numStates; j++) {
        C_mat[0][j] += branchGain * coeffs_x[j];
      }
      D_val += branchGain * coeff_u;
    });

    // Format matrix string representations
    const latexA = matrixToLaTeX(A_mat);
    const latexB = matrixToLaTeX(B_mat);
    const latexC = matrixToLaTeX(C_mat);
    const latexD = `[${Number(D_val.toFixed(4))}]`;

    // Step 1: Formulate with numerical state-space system equations
    stepByStep.push(
      `\\text{Step 1: Formulate Continuous-Time State-Space Representation}\\\\[0.5em]` +
        `\\dot{\\mathbf{x}}(t) = ${latexA}\\mathbf{x}(t) + ${latexB}u(t)\\\\[1em]` +
        `y(t) = ${latexC}\\mathbf{x}(t) + ${latexD}u(t)`,
    );

    // Step 2: Clean KaTeX transfer function formula string
    stepByStep.push(
      "\\text{Step 2: Calculate Transfer Function } H(s) = \\mathbf{C}(s\\mathbf{I} - \\mathbf{A})^{-1}\\mathbf{B} + D",
    );

    let finalNum: Poly = [0];
    let finalDen: Poly = [1];
    let unsimplifiedNum: Poly = [0];
    let unsimplifiedDen: Poly = [1];

    if (numStates === 0) {
      // 0th Order / Pure Algebraic System
      finalNum = [D_val];
      finalDen = [1];
      unsimplifiedNum = [D_val];
      unsimplifiedDen = [1];
    } else {
      // Construct (sI - A)
      const sI_minus_A: Poly[][] = Array.from({ length: numStates }, (_, r) =>
        Array.from({ length: numStates }, (_, c) => {
          if (r === c) {
            return [-A_mat[r][c], 1]; // s - A[r][c]
          }
          return [-A_mat[r][c]]; // -A[r][c]
        }),
      );

      // Compute det(sI - A) and adj(sI - A)
      const detPoly = polyDeterminant(sI_minus_A);
      const adjMatrix = polyAdjugate(sI_minus_A);

      // Compute C * adj(sI - A) * B
      let numPoly: Poly = [0];
      for (let r = 0; r < numStates; r++) {
        for (let c = 0; c < numStates; c++) {
          const factor = C_mat[0][r] * B_mat[c][0];
          if (Math.abs(factor) > EPSILON) {
            const term = polyMul([factor], adjMatrix[r][c]);
            numPoly = polyAdd(numPoly, term);
          }
        }
      }

      // Add Direct Feedthrough D * det(sI - A)
      if (Math.abs(D_val) > EPSILON) {
        numPoly = polyAdd(numPoly, polyMul([D_val], detPoly));
      }

      unsimplifiedNum = cleanPoly(numPoly);
      unsimplifiedDen = cleanPoly(detPoly);

      const simplified = simplifyRational(numPoly, detPoly);
      finalNum = simplified.num;
      finalDen = simplified.den;
    }

    // Ensure leading coefficient of denominator is positive
    let denLen = finalDen.length;
    while (denLen > 1 && Math.abs(finalDen[denLen - 1]) < EPSILON) denLen--;
    if (denLen > 0 && finalDen[denLen - 1] < 0) {
      finalNum = finalNum.map((c) => -c);
      finalDen = finalDen.map((c) => -c);
    }

    // Convert polynomials to LaTeX strings
    const rawNumStr = polyToLaTeX(unsimplifiedNum);
    const rawDenStr = polyToLaTeX(unsimplifiedDen);
    const unsimplifiedLaTeX =
      rawDenStr === "1" ? rawNumStr : `\\frac{${rawNumStr}}{${rawDenStr}}`;

    const numStr = polyToLaTeX(finalNum);
    const denStr = polyToLaTeX(finalDen);
    const finalLaTeX = denStr === "1" ? numStr : `\\frac{${numStr}}{${denStr}}`;

    // Apply factorPolynomial to factor the numerator and denominator into products of prime factors
    const numFactors = factorPolynomial(finalNum);
    const denFactors = factorPolynomial(finalDen);

    const formatFactorList = (factors: Poly[]): string => {
      if (factors.length === 0) return "0";
      return factors
        .map((f) => {
          const str = polyToLaTeX(f);
          return f.length > 2 || (f.length === 2 && f[0] !== 0)
            ? `(${str})`
            : str;
        })
        .join("");
    };

    const factoredNumStr = formatFactorList(numFactors);
    const factoredDenStr = formatFactorList(denFactors);
    const factoredLaTeX =
      factoredDenStr === "1"
        ? factoredNumStr
        : `\\frac{${factoredNumStr}}{${factoredDenStr}}`;

    stepByStep.push(
      `\\text{Step 3: Unsimplified, Simplified, and Factored Transfer Function}\\\\[0.5em]` +
        `\\text{Unsimplified: } \\frac{N(s)}{D(s)} = H(s) = ${unsimplifiedLaTeX}\\\\[1em]` +
        `\\text{Simplified: } \\frac{N(s)}{D(s)} = H(s) = ${finalLaTeX}\\\\[1em]` +
        `\\text{Factored: } \\frac{N(s)}{D(s)} = H(s) = ${factoredLaTeX}`,
    );

    // Step 4: Convert Transfer Function to Differential Equation
    // Helper to format polynomial coefficients into differential terms (e.g., d^k y / dt^k)
    const polyToDiffOp = (poly: Poly, varName: string): string => {
      const terms: string[] = [];
      const degree = poly.length - 1;

      for (let i = degree; i >= 0; i--) {
        const coef = poly[i];
        if (Math.abs(coef) < EPSILON) continue;

        const absCoef = Math.abs(coef);
        let coefStr: string;

        // Handle coefficient string representation
        if (i === degree) {
          coefStr = coef < 0 ? "-" : "";
          if (absCoef !== 1 || i === 0) coefStr += Number(absCoef.toFixed(4));
        } else {
          coefStr = coef < 0 ? " - " : " + ";
          if (absCoef !== 1 || i === 0) coefStr += Number(absCoef.toFixed(4));
        }

        // Handle derivative operator string
        let diffStr: string;
        if (i === 0) {
          diffStr = `${varName}(t)`;
        } else if (i === 1) {
          diffStr = `\\frac{d${varName}(t)}{dt}`;
        } else {
          diffStr = `\\frac{d^{${i}}${varName}(t)}{dt^{${i}}}`;
        }

        terms.push(`${coefStr}${diffStr}`);
      }

      return terms.length > 0 ? terms.join("") : `0${varName}(t)`;
    };

    const lhsDiff = polyToDiffOp(finalDen, "y");
    const rhsDiff = polyToDiffOp(finalNum, "u");

    stepByStep.push(
      `\\text{Step 4: Differential Equation Form}\\\\[0.25em]` +
        `\\text{From } N(s)U(s) = D(s)Y(s) \\text{ in time-domain:}\\\\[1em]` +
        `${lhsDiff} = ${rhsDiff}`,
    );

    return {
      numerator: finalNum,
      denominator: finalDen,
      latexEquation: `H(s) = ${finalLaTeX}`,
      stepByStep,
    };
  } catch (err: unknown) {
    return {
      numerator: null,
      denominator: null,
      latexEquation: "H(s) = \\text{Invalid Topology}",
      stepByStep: ["Continuous State-Space matrix solving failed."],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ==========================================
// 6. Helper Classes
// ==========================================

export function getMatrixRank(
  matrix: number[][],
  epsilon: number = 1e-10,
): number {
  if (matrix.length === 0 || matrix[0].length === 0) return 0;

  const mat = matrix.map((row) => [...row]);
  const rows = mat.length;
  const cols = mat[0].length;

  let rank = 0;
  let pivotRow = 0;

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    // 1. Find pivot in current column at or below pivotRow
    let maxRow = pivotRow;
    for (let r = pivotRow + 1; r < rows; r++) {
      if (Math.abs(mat[r][col]) > Math.abs(mat[maxRow][col])) {
        maxRow = r;
      }
    }

    // 2. Skip column if no pivot exists above threshold
    if (Math.abs(mat[maxRow][col]) <= epsilon) {
      continue;
    }

    // 3. Swap current pivot row to top available slot
    if (maxRow !== pivotRow) {
      const temp = mat[pivotRow];
      mat[pivotRow] = mat[maxRow];
      mat[maxRow] = temp;
    }

    // 4. Eliminate entries in current column
    for (let r = 0; r < rows; r++) {
      if (r !== pivotRow) {
        const factor = mat[r][col] / mat[pivotRow][col];
        for (let c = col; c < cols; c++) {
          mat[r][c] -= factor * mat[pivotRow][c];
        }
      }
    }

    pivotRow++;
    rank++;
  }

  return rank;
}

export function householderQR(A: number[][]): { Q: number[][]; R: number[][] } {
  const m = A.length;
  const n = A[0].length;

  // Line 1: R = A
  const R: number[][] = A.map((row) => [...row]);
  const vStore: number[][] = [];

  // Line 2: for j = 1 to n do (0-indexed: 0 to n - 1)
  for (let j = 0; j < n; j++) {
    // Line 3: x = R_{j:m, j}
    const x: number[] = [];
    for (let r = j; r < m; r++) {
      x.push(R[r][j]);
    }

    const normX = Math.hypot(...x);
    if (normX === 0) {
      const vZero = new Array(m - j).fill(0);
      vZero[0] = 1;
      vStore.push(vZero);
      continue;
    }

    // Line 4: v_j = x + sign(x_1)*||x||_2 * e_1
    const signX1 = x[0] >= 0 ? 1 : -1;
    const v_j = [...x];
    v_j[0] += signX1 * normX;

    // Line 5: v_j = v_j / ||v_j||_2
    const normV = Math.hypot(...v_j);
    for (let i = 0; i < v_j.length; i++) {
      v_j[i] /= normV;
    }
    vStore.push(v_j);

    // Line 6: R_{j,j} = -sign(x_1)*||x||_2, R_{j+1:m, j} = 0
    R[j][j] = -signX1 * normX;
    for (let r = j + 1; r < m; r++) {
      R[r][j] = 0;
    }

    // Line 7: for k = j + 1 to n do
    for (let k = j + 1; k < n; k++) {
      // Line 8: R_{j:m, k} = R_{j:m, k} - 2*(v_j^* * R_{j:m, k})*v_j
      let dot = 0;
      for (let r = 0; r < v_j.length; r++) {
        dot += v_j[r] * R[j + r][k];
      }

      for (let r = 0; r < v_j.length; r++) {
        R[j + r][k] -= 2 * dot * v_j[r];
      }
    }
  } // Line 10: end for

  // Construct Q matrix
  const Q: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  // Line 11: for i = 1 to m do
  for (let i = 0; i < n; i++) {
    // Line 12: w = e_i
    const w: number[] = new Array(m).fill(0);
    w[i] = 1;

    // Line 13: for k = n downto 1 do (0-indexed: n - 1 downto 0)
    for (let k = n - 1; k >= 0; k--) {
      const vk = vStore[k];

      // Line 14: w_{k:m} = w_{k:m} - 2*(v_k^* * w_{k:m})*v_k
      let dot = 0;
      for (let r = 0; r < vk.length; r++) {
        dot += vk[r] * w[k + r];
      }

      for (let r = 0; r < vk.length; r++) {
        w[k + r] -= 2 * dot * vk[r];
      }
    } // Line 15: end for

    // Line 16: Q_{1:m, i} = w
    for (let r = 0; r < m; r++) {
      Q[r][i] = w[r];
    }
  } // Line 17: end for

  return { Q, R };
}

export class MatrixAnalysis {
  A: number[][];
  B: number[][];
  C: number[][];
  d: number;

  constructor(
    A_mat: number[][],
    B_mat: number[][],
    C_mat: number[][],
    d: number,
  ) {
    this.A = A_mat;
    this.B = B_mat;
    this.C = C_mat;
    this.d = d;
  }

  get isControllable(): boolean {
    const n = this.A.length;
    if (n === 0 || this.A[0].length !== n) return false;
    if (this.B.length !== n || this.B[0].length === 0) return false;

    const C_m: number[][] = Array.from({ length: n }, () => []);
    let current = this.B.map((row) => row[0]); // B (n x 1)

    // 1. First column of C_m
    for (let r = 0; r < n; r++) {
      C_m[r].push(current[r]);
    }

    // 2. Compute AB, A^2B, ..., A^(n-1)B
    for (let k = 1; k < n; k++) {
      const next = new Array<number>(n).fill(0);
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          next[r] += this.A[r][c] * current[c];
        }
      }
      for (let r = 0; r < n; r++) {
        C_m[r].push(next[r]);
      }
      current = next;
    }

    return getMatrixRank(C_m) === n;
  }

  get isObservable(): boolean {
    const n = this.A.length;
    if (n === 0 || this.A[0].length !== n) return false;
    if (this.C.length === 0 || this.C[0].length !== n) return false;

    const O: number[][] = [];
    let current = [...this.C[0]]; // C (1 x n)

    // 1. First row of O
    O.push([...current]);

    // 2. Compute CA, CA^2, ..., CA^(n-1)
    for (let i = 1; i < n; i++) {
      const next = new Array<number>(n).fill(0);
      for (let c = 0; c < n; c++) {
        for (let r = 0; r < n; r++) {
          next[c] += current[r] * this.A[r][c];
        }
      }
      O.push([...next]);
      current = next;
    }

    return getMatrixRank(O) === n;
  }

  get isMinimal(): boolean {
    return this.isControllable && this.isObservable;
  }

  get isInternallyStable(): boolean {
    return false; //TODO
  }

  get isIOStable(): boolean {
    return false; // TODO
  }
}
