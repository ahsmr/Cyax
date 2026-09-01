import type { Node, Edge } from '@xyflow/react';

export interface SolverResult {
  latexEquation: string;
  stepByStep: string[];
  error?: string;
}

// Polynomial in s: index i represents coefficient of s^i
type Poly = number[];

interface Rational {
  num: Poly;
  den: Poly;
}

function polyAdd(a: Poly, b: Poly): Poly {
  const max = Math.max(a.length, b.length);
  const res = new Array(max).fill(0);
  for (let i = 0; i < max; i++) {
    res[i] = (i < a.length ? a[i] : 0) + (i < b.length ? b[i] : 0);
  }
  return res;
}

function polySub(a: Poly, b: Poly): Poly {
  const max = Math.max(a.length, b.length);
  const res = new Array(max).fill(0);
  for (let i = 0; i < max; i++) {
    res[i] = (i < a.length ? a[i] : 0) - (i < b.length ? b[i] : 0);
  }
  return res;
}

function polyMul(a: Poly, b: Poly): Poly {
  const res = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      res[i + j] += a[i] * b[j];
    }
  }
  return res;
}

function addRat(a: Rational, b: Rational): Rational {
  return {
    num: polyAdd(polyMul(a.num, b.den), polyMul(b.num, a.den)),
    den: polyMul(a.den, b.den),
  };
}

function subRat(a: Rational, b: Rational): Rational {
  return {
    num: polySub(polyMul(a.num, b.den), polyMul(b.num, a.den)),
    den: polyMul(a.den, b.den),
  };
}

function mulRat(a: Rational, b: Rational): Rational {
  return {
    num: polyMul(a.num, b.num),
    den: polyMul(a.den, b.den),
  };
}

function divRat(a: Rational, b: Rational): Rational {
  return {
    num: polyMul(a.num, b.den),
    den: polyMul(a.den, b.num),
  };
}

/**
 * Simplifies a rational expression by cleaning near-zero coefficients,
 * factoring out common powers of s, and normalizing leading coefficients.
 */
function simplifyRational(num: Poly, den: Poly): Rational {
  const cleanPoly = (p: Poly): Poly => {
    const cleaned = p.map((c) => (Math.abs(c) < 1e-9 ? 0 : c));
    let len = cleaned.length;
    while (len > 0 && Math.abs(cleaned[len - 1]) < 1e-9) len--;
    return cleaned.slice(0, len);
  };

  let n = cleanPoly(num);
  let d = cleanPoly(den);

  if (n.length === 0 || n.every((c) => c === 0)) {
    return { num: [0], den: [1] };
  }

  // Find lowest non-zero index (common power of s)
  let minN = 0;
  while (minN < n.length && Math.abs(n[minN]) < 1e-9) minN++;

  let minD = 0;
  while (minD < d.length && Math.abs(d[minD]) < 1e-9) minD++;

  const kCommon = Math.min(minN, minD);
  if (kCommon > 0) {
    n = n.slice(kCommon);
    d = d.slice(kCommon);
  }

  // Normalize denominator leading coefficient to 1
  if (d.length > 0) {
    const leadD = d[d.length - 1];
    if (Math.abs(leadD) > 1e-9 && Math.abs(leadD - 1) > 1e-9) {
      n = n.map((c) => c / leadD);
      d = d.map((c) => c / leadD);
    }
  }

  return {
    num: n.length > 0 ? n : [0],
    den: d.length > 0 ? d : [1],
  };
}

function polyToLaTeX(p: Poly): string {
  let len = p.length;
  while (len > 1 && Math.abs(p[len - 1]) < 1e-9) len--;
  if (len === 0) return '0';

  const terms: string[] = [];
  for (let i = len - 1; i >= 0; i--) {
    const coeff = p[i];
    if (Math.abs(coeff) < 1e-9) continue;

    let termStr = '';
    const absCoeff = Math.abs(coeff);

    if (i === 0) termStr = `${absCoeff}`;
    else if (i === 1) termStr = absCoeff === 1 ? 's' : `${absCoeff}s`;
    else termStr = absCoeff === 1 ? `s^{${i}}` : `${absCoeff}s^{${i}}`;

    if (terms.length === 0) {
      terms.push(coeff < 0 ? `-${termStr}` : termStr);
    } else {
      terms.push(coeff < 0 ? `- ${termStr}` : `+ ${termStr}`);
    }
  }
  return terms.length > 0 ? terms.join(' ') : '0';
}

export function deriveTransferFunction(nodes: Node[], edges: Edge[]): SolverResult {
  try {
    const stepByStep: string[] = [];

    const inputNode = nodes.find((n) => n.type === 'input' || n.id === 'u_in');
    const outputNode = nodes.find((n) => n.type === 'output' || n.id === 'y_out');

    if (!inputNode || !outputNode) {
      return {
        latexEquation: 'H(s) = \\text{Invalid Topology}',
        stepByStep: ['Missing input u(t) or output y(t) block.'],
      };
    }

    stepByStep.push("Step 1: Construct system matrix for block diagram variables.");

    const internalNodes = nodes.filter((n) => n.id !== inputNode.id);
    const N = internalNodes.length;

    const nodeIndex = new Map<string, number>();
    internalNodes.forEach((n, idx) => nodeIndex.set(n.id, idx));

    const A: Rational[][] = Array.from({ length: N }, (_, r) =>
      Array.from({ length: N }, (_, c) => ({
        num: r === c ? [1] : [0],
        den: [1],
      }))
    );

    const B: Rational[] = Array.from({ length: N }, () => ({
      num: [0],
      den: [1],
    }));

    internalNodes.forEach((node) => {
      const row = nodeIndex.get(node.id)!;
      const incoming = edges.filter((e) => e.target === node.id);

      let nodeTransfer: Rational = { num: [1], den: [1] };
      if (node.type === 'gain') {
        const K = Number(node.data?.gain ?? 1);
        nodeTransfer = { num: [K], den: [1] };
      } else if (node.type === 'integrator') {
        nodeTransfer = { num: [1], den: [0, 1] }; // 1 / s
      }

      incoming.forEach((edge) => {
        let signGain: Rational = { num: [1], den: [1] };
        if (node.type === 'summing' && edge.targetHandle === 'in-minus') {
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

    stepByStep.push("Step 2: Solve linear system via rational Gaussian elimination.");

    for (let i = 0; i < N; i++) {
      let pivotRow = i;
      while (pivotRow < N && A[pivotRow][i].num.every((c) => c === 0)) {
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
          if (factor.num.some((c) => c !== 0)) {
            for (let c = i; c < N; c++) {
              A[r][c] = subRat(A[r][c], mulRat(factor, A[i][c]));
            }
            B[r] = subRat(B[r], mulRat(factor, B[i]));
          }
        }
      }
    }

    const outputIdx = nodeIndex.get(outputNode.id);
    if (outputIdx === undefined) {
      return {
        latexEquation: 'H(s) = \\text{Invalid Topology}',
        stepByStep: ['Output node missing from matrix formulation.'],
      };
    }

    // Simplify the resulting rational expression to cancel common powers of s
    const simplified = simplifyRational(B[outputIdx].num, B[outputIdx].den);

    let finalNum = simplified.num;
    let finalDen = simplified.den;

    let denLen = finalDen.length;
    while (denLen > 1 && Math.abs(finalDen[denLen - 1]) < 1e-9) denLen--;
    if (denLen > 0 && finalDen[denLen - 1] < 0) {
      finalNum = finalNum.map((c) => -c);
      finalDen = finalDen.map((c) => -c);
    }

    const numStr = polyToLaTeX(finalNum);
    const denStr = polyToLaTeX(finalDen);

    const finalLaTeX = denStr === '1' ? numStr : `\\frac{${numStr}}{${denStr}}`;

    stepByStep.push("Step 3: Simplify and output transfer function H(s).");

    return {
      latexEquation: `H(s) = ${finalLaTeX}`,
      stepByStep,
    };
  } catch (err: any) {
    return {
      latexEquation: 'H(s) = \\text{Invalid Topology}',
      stepByStep: ['System matrix equation solving failed.'],
      error: err.message,
    };
  }
}