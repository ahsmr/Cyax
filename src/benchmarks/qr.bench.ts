import { describe, test, afterAll } from "vitest";
import {
  householderQR as _householderQR,
  Hessenberg_householder as _Hessenberg_householder,
  hessenberg_givensRotation_qr as _hessenberg_givensRotation_qr,
} from "../utils/systemSolver";

// Bind to local constants to avoid Vitest ESM export getter overhead inside hot loops
const householderQR = _householderQR;
const Hessenberg_householder = _Hessenberg_householder;
const hessenberg_givensRotation_qr = _hessenberg_givensRotation_qr;

// Prevent V8 TurboFan dead-code elimination while satisfying ESLint no-unused-vars
let sink = 0;
afterAll(() => {
  if (Number.isNaN(sink)) {
    throw new Error("NaN encountered during QR benchmark");
  }
});

/**
 * Builds 3 distinct n x n test matrices for each dimension n:
 * 1. Dense coupled matrix (no zeros -> worst-case flop count)
 * 2. State-space companion/feedback matrix (sparse integrator chain + feedback)
 * 3. Asymmetric oscillatory matrix (tridiagonal-dominant + cross-coupling)
 */
function buildTestMatrices(n: number): { label: string; A: number[][] }[] {
  const dense = Array.from({ length: n }, (_, r) =>
    Array.from(
      { length: n },
      (_, c) => Math.sin(r * 7 + c * 13) * 4 + (r === c ? -(r + 3) : 0.35),
    ),
  );

  const stateSpace = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => {
      if (c === r + 1) return 1;
      if (r === n - 1) return -(c + 1) * 0.4;
      if (r === 0 && c === n - 1) return -0.75;
      return 0;
    }),
  );

  const oscillatory = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => {
      if (r === c) return -0.5 * (r + 1);
      if (Math.abs(r - c) === 1) return r < c ? 2.5 : -2.5;
      return 0.1 / (Math.abs(r - c) + 1);
    }),
  );

  return [
    { label: "dense", A: dense },
    { label: "stateSpace", A: stateSpace },
    { label: "oscillatory", A: oscillatory },
  ];
}

// Sweep n = 3..20 across 3 matrix topologies
const CASES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 50].flatMap((n) =>
  buildTestMatrices(n).map(({ label, A }) => ({ n, label, A })),
);

// Simulates K QR iteration steps (1x Hessenberg setup + K Givens steps vs. K Householder steps)
const QR_STEPS = 200;

describe.each(CASES)("QR Factorization (n=$n, $label)", ({ n, label, A }) => {
  test(`performance n=${n} (${label})`, async ({ bench }) => {
    await bench.compare(
      bench(`householderQR alone (n=${n}, ${label})`, () => {
        let Ak = A;
        for (let step = 0; step < QR_STEPS; step++) {
          const { Q, R } = householderQR(Ak);
          const next: number[][] = Array.from({ length: n }, () =>
            new Array(n).fill(0),
          );
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              let sum = 0;
              for (let k = i; k < n; k++) {
                sum += R[i][k] * Q[k][j];
              }
              next[i][j] = sum;
            }
          }
          Ak = next;
        }
        sink += Ak[0][0];
      }),

      bench(`hessenberg + givensQR (n=${n}, ${label})`, () => {
        let Ak = Hessenberg_householder(A);
        for (let step = 0; step < QR_STEPS; step++) {
          const { Q, R } = hessenberg_givensRotation_qr(Ak);
          const next: number[][] = Array.from({ length: n }, () =>
            new Array(n).fill(0),
          );
          for (let i = 0; i < n; i++) {
            const jStart = Math.max(0, i - 1);
            for (let j = jStart; j < n; j++) {
              let sum = 0;
              const kEnd = Math.min(n - 1, j + 1);
              for (let k = i; k <= kEnd; k++) {
                sum += R[i][k] * Q[k][j];
              }
              next[i][j] = sum;
            }
          }
          Ak = next;
        }
        sink += Ak[0][0];
      }),
    );
  });
});
