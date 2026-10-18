import type { Node, Edge } from "@xyflow/react";

// ==========================================
// 1. TYPE DEFINITIONS & INTERFACES
// ==========================================

export interface SolverResult {
  latexEquation: string; // The formatted final LaTeX equation H(s)
  stepByStep: string[]; // Step-by-step state-space derivation details
  error?: string; // Optional error details on calculation failure
}

/**
 * Polynomial in s, indexed by power.
 * [c0, c1, c2] => c0 + c1*s + c2*s^2
 */
type Poly = number[];

interface Rational {
  num: Poly;
  den: Poly;
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
 */
function cleanPoly(p: Poly): Poly {
  const cleaned = p.map((c) => (Math.abs(c) < EPSILON ? 0 : c));
  let len = cleaned.length;
  while (len > 0 && Math.abs(cleaned[len - 1]) < EPSILON) len--;
  return len === 0 ? [0] : cleaned.slice(0, len);
}

function polyAdd(a: Poly, b: Poly): Poly {
  const max = Math.max(a.length, b.length);
  const res = new Array(max).fill(0);
  for (let i = 0; i < max; i++) {
    res[i] = (i < a.length ? a[i] : 0) + (i < b.length ? b[i] : 0);
  }
  return cleanPoly(res);
}

function polySub(a: Poly, b: Poly): Poly {
  const max = Math.max(a.length, b.length);
  const res = new Array(max).fill(0);
  for (let i = 0; i < max; i++) {
    res[i] = (i < a.length ? a[i] : 0) - (i < b.length ? b[i] : 0);
  }
  return cleanPoly(res);
}

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

// ==========================================
// 3. LATEX FORMATTING HELPERS
// ==========================================

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

function matrixToLaTeX(matrix: number[][]): string {
  const rows = matrix.map((row) =>
    row.map((val) => Number(val.toFixed(4))).join(" & "),
  );
  return `\\begin{bmatrix} ${rows.join(" \\\\ ")} \\end{bmatrix}`;
}

// ==========================================
// 4. SYMBOLIC MATRIX ALGEBRA FOR (sI - A)^(-1)
// ==========================================

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
      const { coeffs_x, coeff_u } = resolveNodeSignal(e.source);
      for (let j = 0; j < numStates; j++) {
        C_mat[0][j] += coeffs_x[j];
      }
      D_val += coeff_u;
    });

    // Format matrix string representations
    const latexA = matrixToLaTeX(A_mat);
    const latexB = matrixToLaTeX(B_mat);
    const latexC = matrixToLaTeX(C_mat);
    const latexD = `[${Number(D_val.toFixed(4))}]`;

    // Step 1: Formulate with numerical state-space system equations
    stepByStep.push(
      `\\text{Step 1: Formulate Continuous-Time State-Space Representation}\\\\` +
        `\\dot{\\mathbf{x}}(t) = ${latexA}\\mathbf{x}(t) + ${latexB}u(t)\\\\` +
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

    stepByStep.push(
      `\\text{Step 3: Unsimplified Expression vs. Simplified Transfer Function}\\\\` +
        `\\text{Unsimplified: } H(s) = ${unsimplifiedLaTeX}\\\\` +
        `\\text{Simplified: } H(s) = ${finalLaTeX}`,
    );

    return {
      latexEquation: `H(s) = ${finalLaTeX}`,
      stepByStep,
    };
  } catch (err: unknown) {
    return {
      latexEquation: "H(s) = \\text{Invalid Topology}",
      stepByStep: ["Continuous State-Space matrix solving failed."],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
