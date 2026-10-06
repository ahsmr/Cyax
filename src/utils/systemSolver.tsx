import type { Node, Edge } from "@xyflow/react";

// ==========================================
// 1. TYPE DEFINITIONS & INTERFACES
// ==========================================

/**
 * Output data structure returned by the system transfer function solver engine.
 */
export interface SolverResult {
  latexEquation: string; // The formatted final LaTeX equation H(s)
  stepByStep: string[]; // Array of LaTeX or textual derivation steps
  error?: string; // Optional error details on calculation failure
}

/**
 * Polynomial representation in Laplace variable 's':
 * An array of coefficients where index `i` corresponds to the coefficient of `s^i`.
 * Example: [2, 3, 1] represents 1*s^2 + 3*s + 2
 */
type Poly = number[];

/**
 * Rational Transfer Function in Laplace Domain:
 * Represents a fraction with polynomial numerator and denominator: N(s) / D(s)
 */
interface Rational {
  num: Poly;
  den: Poly;
}

// Numerical tolerance for clean floating-point comparisons
const EPSILON = 1e-7;

// ==========================================
// 2. POLYNOMIAL ARITHMETIC & EUCLIDEAN HELPERS
// ==========================================

/**
 * Strips trailing zero coefficients and snaps near-zero floating noise to exact 0.
 */
function cleanPoly(p: Poly): Poly {
  const cleaned = p.map((c) => (Math.abs(c) < EPSILON ? 0 : c));
  let len = cleaned.length;
  while (len > 0 && Math.abs(cleaned[len - 1]) < EPSILON) len--;
  return len === 0 ? [0] : cleaned.slice(0, len);
}

/**
 * Performs polynomial addition: A(s) + B(s)
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
 * Performs polynomial subtraction: A(s) - B(s)
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
 * Performs polynomial multiplication: A(s) * B(s)
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
 * Polynomial long division: Returns quotient Q(s) and remainder R(s) such that A(s) = Q(s)*B(s) + R(s)
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
 * Calculates Greatest Common Divisor (GCD) of two polynomials via Euclidean Algorithm.
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

// ==========================================
// 3. RATIONAL EXPRESSION ARITHMETIC
// ==========================================

/**
 * Rational Simplification Engine:
 * Cancels common polynomial factors (GCD), cancels trailing powers of 's',
 * and normalizes leading coefficients of denominator polynomials.
 */
function simplifyRational(num: Poly, den: Poly): Rational {
  let n = cleanPoly(num);
  let d = cleanPoly(den);

  if (n.length === 1 && n[0] === 0) {
    return { num: [0], den: [1] };
  }

  // Cancel polynomial GCD factors (e.g., s + 0.25)
  const gcd = polyGcd(n, d);
  if (gcd.length > 1) {
    n = polyDivMod(n, gcd).q;
    d = polyDivMod(d, gcd).q;
  }

  // Normalize denominator's leading coefficient to 1
  if (d.length > 0) {
    const leadD = d[d.length - 1];
    if (Math.abs(leadD) > EPSILON && Math.abs(leadD - 1) > EPSILON) {
      n = n.map((c) => c / leadD);
      d = d.map((c) => c / leadD);
    }
  }

  return { num: cleanPoly(n), den: cleanPoly(d) };
}

/**
 * Adds two rational expressions: (N1/D1) + (N2/D2) = (N1*D2 + N2*D1) / (D1*D2)
 */
function addRat(a: Rational, b: Rational): Rational {
  return simplifyRational(
    polyAdd(polyMul(a.num, b.den), polyMul(b.num, a.den)),
    polyMul(a.den, b.den),
  );
}

/**
 * Subtracts two rational expressions: (N1/D1) - (N2/D2) = (N1*D2 - N2*D1) / (D1*D2)
 */
function subRat(a: Rational, b: Rational): Rational {
  return simplifyRational(
    polySub(polyMul(a.num, b.den), polyMul(b.num, a.den)),
    polyMul(a.den, b.den),
  );
}

/**
 * Multiplies two rational expressions: (N1/D1) * (N2/D2) = (N1*N2) / (D1*D2)
 */
function mulRat(a: Rational, b: Rational): Rational {
  return simplifyRational(polyMul(a.num, b.num), polyMul(a.den, b.den));
}

/**
 * Divides two rational expressions: (N1/D1) / (N2/D2) = (N1*D2) / (D1*N2)
 */
function divRat(a: Rational, b: Rational): Rational {
  return simplifyRational(polyMul(a.num, b.den), polyMul(a.den, b.num));
}

// ==========================================
// 4. SIMPLIFICATION & LATEX FORMATTING
// ==========================================

/**
 * LaTeX Converter:
 * Converts a polynomial coefficient array into a clean formatted LaTeX string.
 * Example: [3, 0, 1] -> "s^{2} + 3"
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

    // Determine string representation of term
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

// ==========================================
// 5. MAIN TRANSFER FUNCTION SOLVER
// ==========================================

/**
 * Derive Transfer Function Engine:
 * Analyzes graph nodes and edges to build a symbolic block diagram matrix equation
 * and solves for the transfer function H(s) = Y(s) / U(s) via rational Gaussian elimination.
 *
 * @param nodes Array of React Flow canvas nodes
 * @param edges Array of React Flow canvas edges
 * @returns LaTeX equation string and step-by-step derivation details
 */
export function deriveTransferFunction(
  nodes: Node[],
  edges: Edge[],
): SolverResult {
  try {
    const stepByStep: string[] = [];

    // Identify boundary input and output signal nodes
    const inputNode = nodes.find((n) => n.type === "input" || n.id === "u_in");
    const outputNode = nodes.find(
      (n) => n.type === "output" || n.id === "y_out",
    );

    if (!inputNode || !outputNode) {
      return {
        latexEquation: "H(s) = \\text{Invalid Topology}",
        stepByStep: ["Missing input u(t) or output y(t) block."],
      };
    }

    stepByStep.push(
      "Step 1: Construct system matrix for block diagram variables.",
    );

    // Map internal system blocks to index positions for system matrix construction
    const internalNodes = nodes.filter((n) => n.id !== inputNode.id);
    const N = internalNodes.length;

    const nodeIndex = new Map<string, number>();
    internalNodes.forEach((n, idx) => nodeIndex.set(n.id, idx));

    // Initialize System Matrix A (N x N identity) and Input Vector B (N x 1 zeros)
    const A: Rational[][] = Array.from({ length: N }, (_, r) =>
      Array.from({ length: N }, (_, c) => ({
        num: r === c ? [1] : [0],
        den: [1],
      })),
    );

    const B: Rational[] = Array.from({ length: N }, () => ({
      num: [0],
      den: [1],
    }));

    // Populate matrix A and vector B by evaluating block transfer characteristics
    internalNodes.forEach((node) => {
      const row = nodeIndex.get(node.id)!;
      const incoming = edges.filter((e) => e.target === node.id);

      // Determine internal transfer ratio of block node
      let nodeTransfer: Rational = { num: [1], den: [1] };
      if (node.type === "gain") {
        const K = Number(node.data?.gain ?? 1);
        nodeTransfer = { num: [K], den: [1] };
      } else if (node.type === "integrator") {
        nodeTransfer = { num: [1], den: [0, 1] }; // 1 / s
      }

      // Process incoming connections and negative feedback flags
      incoming.forEach((edge) => {
        let signGain: Rational = { num: [1], den: [1] };
        if (node.type === "summing" && edge.targetHandle === "in-minus") {
          signGain = { num: [-1], den: [1] };
        }

        const branchGain = mulRat(signGain, nodeTransfer);

        if (edge.source === inputNode.id) {
          B[row] = addRat(B[row], branchGain);
        } else if (nodeIndex.has(edge.source)) {
          const col = nodeIndex.get(edge.source)!;
          A[row][col] = subRat(A[row][col], branchGain);
        }
      });
    });

    stepByStep.push(
      "Step 2: Solve linear system via rational Gaussian elimination.",
    );

    // Perform Symbolic Rational Gaussian Elimination
    for (let i = 0; i < N; i++) {
      let pivotRow = i;
      while (
        pivotRow < N &&
        (A[pivotRow][i].num.length === 0 ||
          A[pivotRow][i].num.every((c) => Math.abs(c) < EPSILON))
      ) {
        pivotRow++;
      }

      if (pivotRow === N) continue;

      if (pivotRow !== i) {
        [A[i], A[pivotRow]] = [A[pivotRow], A[i]];
        [B[i], B[pivotRow]] = [B[pivotRow], B[i]];
      }

      const pivot = A[i][i];

      for (let j = i; j < N; j++) {
        A[i][j] = divRat(A[i][j], pivot);
      }
      B[i] = divRat(B[i], pivot);

      for (let r = 0; r < N; r++) {
        if (r !== i) {
          const factor = A[r][i];
          if (
            factor.num.length > 0 &&
            factor.num.some((c) => Math.abs(c) >= EPSILON)
          ) {
            for (let c = i; c < N; c++) {
              A[r][c] = subRat(A[r][c], mulRat(factor, A[i][c]));
            }
            B[r] = subRat(B[r], mulRat(factor, B[i]));
          }
        }
      }
    }

    // Retrieve target output node index
    const outputIdx = nodeIndex.get(outputNode.id);
    if (outputIdx === undefined) {
      return {
        latexEquation: "H(s) = \\text{Invalid Topology}",
        stepByStep: ["Output node missing from matrix formulation."],
      };
    }

    // Simplify the resulting rational expression to cancel common factors & powers of s
    const simplified = simplifyRational(B[outputIdx].num, B[outputIdx].den);

    let finalNum = simplified.num;
    let finalDen = simplified.den;

    // Ensure leading coefficient of denominator is positive
    let denLen = finalDen.length;
    while (denLen > 1 && Math.abs(finalDen[denLen - 1]) < EPSILON) denLen--;
    if (denLen > 0 && finalDen[denLen - 1] < 0) {
      finalNum = finalNum.map((c) => -c);
      finalDen = finalDen.map((c) => -c);
    }

    // Convert polynomials to LaTeX strings
    const numStr = polyToLaTeX(finalNum);
    const denStr = polyToLaTeX(finalDen);

    const finalLaTeX = denStr === "1" ? numStr : `\\frac{${numStr}}{${denStr}}`;

    stepByStep.push("Step 3: Simplify and output transfer function H(s).");

    return {
      latexEquation: `H(s) = ${finalLaTeX}`,
      stepByStep,
    };
  } catch (err: unknown) {
    return {
      latexEquation: "H(s) = \\text{Invalid Topology}",
      stepByStep: ["System matrix equation solving failed."],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
