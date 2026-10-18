/**
 * ============================================================================
 * Model I: (M/M/1) : (∞/FIFO) Queuing Theory Engine
 * ============================================================================
 * Pure isolated mathematical engine for single-server Markovian queues.
 * Based on the Linear Algebra & Queuing Theory Study Notes (Page 6).
 *
 * Equations Implemented:
 *  1. Traffic Intensity / Server Utilisation:
 *     ρ = λ / μ
 *
 *  2. Probability of System Empty (Idle Probability):
 *     P(system empty) = P₀ = 1 - ρ
 *
 *  3. Probability of n Customers in the System:
 *     P(n customers) = Pₙ = ρⁿ (1 - ρ)
 *
 *  4. Average Number of Customers in System:
 *     Lₛ = λ / (μ - λ) = ρ / (1 - ρ)
 *
 *  5. Average Number of Customers in Queue:
 *     Lq = λ² / (μ(μ - λ)) = ρ² / (1 - ρ) = Lₛ - ρ
 *
 *  6. Average Number of Customers in Waiting Line (Non-empty queue):
 *     Lw = μ / (μ - λ) = 1 / (1 - ρ)
 *
 *  7. Average Time Spent in System:
 *     Wₛ = 1 / (μ - λ) = Lₛ / λ = Wq + 1/μ
 *
 *  8. Average Waiting Time in Queue:
 *     Wq = λ / (μ(μ - λ)) = Lq / λ = Wₛ - 1/μ
 *
 *  9. Probability of at least k customers in system:
 *     P(N ≥ k) = ρᵏ
 *
 * 10. Probability of strictly more than k customers in system:
 *     P(N > k) = ρᵏ⁺¹
 *
 * 11. Probability of Waiting Time in System Exceeding t:
 *     P(Tₛ > t) = e^(-(μ - λ)t)
 *
 * 12. Probability of Waiting Time in Queue Exceeding t:
 *     P(Tq > t) = ρ · e^(-(μ - λ)t)
 *
 * 13. Little's Formulas Consistency Checks:
 *     (a) Lₛ = λ · Wₛ
 *     (b) Lq = λ · Wq
 *     (c) Wₛ = Wq + 1/μ
 *     (d) Lₛ = Lq + λ/μ
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MM1Engine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Validate arrival rate (lambda) and service rate (mu).
   * @param {number} lambda - Arrival rate
   * @param {number} mu - Service rate
   * @returns {Object} Validation result { isValid, isStable, rho, error, warning }
   */
  function validateInputs(lambda, mu) {
    const lam = parseFloat(lambda);
    const m = parseFloat(mu);

    if (isNaN(lam) || isNaN(m)) {
      return {
        isValid: false,
        isStable: false,
        rho: null,
        error: 'Inputs must be valid numerical real numbers.',
        warning: ''
      };
    }

    if (lam <= 0 && m <= 0) {
      return {
        isValid: false,
        isStable: false,
        rho: null,
        error: 'Arrival rate (λ) and service rate (μ) must both be strictly positive (> 0).',
        warning: ''
      };
    }

    if (lam <= 0) {
      return {
        isValid: false,
        isStable: false,
        rho: null,
        error: 'Arrival rate (λ) must be strictly greater than zero (> 0).',
        warning: ''
      };
    }

    if (m <= 0) {
      return {
        isValid: false,
        isStable: false,
        rho: null,
        error: 'Service rate (μ) must be strictly greater than zero (> 0). Zero service rate produces division by zero.',
        warning: ''
      };
    }

    const rho = lam / m;

    if (lam >= m) {
      let warning = '';
      if (lam === m) {
        warning = `⚠️ Critical Boundary (λ = μ = ${lam}): Utilisation factor ρ = 1.00 (100%). In an (M/M/1):(∞/FIFO) system, stochastic arrival and service fluctuations cause the queue length to grow without bound over time. Steady-state equilibrium does not exist.`;
      } else {
        warning = `🚨 System Unstable (λ ≥ μ, ρ = ${rho.toFixed(4)}): Arrival rate (λ = ${lam}) strictly exceeds service capacity (μ = ${m}). Customers arrive faster than they can be served, leading to infinite queue accumulation (Lq → ∞) and unbounded delay (Wq → ∞).`;
      }

      return {
        isValid: true,
        isStable: false,
        rho: rho,
        error: '',
        warning: warning
      };
    }

    return {
      isValid: true,
      isStable: true,
      rho: rho,
      error: '',
      warning: ''
    };
  }

  /**
   * 1. Traffic Intensity / Server Utilisation Factor
   * ρ = λ / μ
   */
  function calculateRho(lambda, mu) {
    return lambda / mu;
  }

  /**
   * 2. Probability that the system is empty
   * P₀ = 1 - ρ
   */
  function calculateP0(rho) {
    return 1 - rho;
  }

  /**
   * 3. Probability of n customers in the system
   * P(n customers) = ρⁿ (1 - ρ)
   */
  function calculatePn(n, rho) {
    if (n < 0 || !Number.isInteger(n)) return 0;
    return Math.pow(rho, n) * (1 - rho);
  }

  /**
   * 4. Average number of customers in the system
   * Lₛ = λ / (μ - λ)
   */
  function calculateLs(lambda, mu) {
    if (lambda >= mu) return Infinity;
    return lambda / (mu - lambda);
  }

  /**
   * 5. Average number of customers in the queue
   * Lq = λ² / (μ(μ - λ))
   */
  function calculateLq(lambda, mu) {
    if (lambda >= mu) return Infinity;
    return (lambda * lambda) / (mu * (mu - lambda));
  }

  /**
   * 6. Average number of customers in the waiting line (non-empty queue)
   * Lw = μ / (μ - λ)
   */
  function calculateLw(lambda, mu) {
    if (lambda >= mu) return Infinity;
    return mu / (mu - lambda);
  }

  /**
   * 7. Average time spent in the system
   * Wₛ = 1 / (μ - λ)
   */
  function calculateWs(lambda, mu) {
    if (lambda >= mu) return Infinity;
    return 1 / (mu - lambda);
  }

  /**
   * 8. Average waiting time in the queue
   * Wq = λ / (μ(μ - λ))
   */
  function calculateWq(lambda, mu) {
    if (lambda >= mu) return Infinity;
    return lambda / (mu * (mu - lambda));
  }

  /**
   * 9. Probability of at least k customers in system
   * P(N ≥ k) = ρᵏ
   */
  function calculateProbNGeK(k, rho) {
    if (k < 0) return 1.0;
    return Math.pow(rho, k);
  }

  /**
   * 10. Probability of strictly more than k customers in system
   * P(N > k) = ρᵏ⁺¹
   */
  function calculateProbNGtK(k, rho) {
    if (k < 0) return 1.0;
    return Math.pow(rho, k + 1);
  }

  /**
   * 11. Probability of total residence time in system exceeding t
   * P(Tₛ > t) = e^(-(μ - λ)t)
   */
  function calculateProbTsGtT(t, lambda, mu) {
    if (t < 0) return 1.0;
    if (lambda >= mu) return 1.0;
    return Math.exp(-(mu - lambda) * t);
  }

  /**
   * 12. Probability of waiting time in queue exceeding t
   * P(Tq > t) = ρ · e^(-(μ - λ)t)
   */
  function calculateProbTqGtT(t, lambda, mu) {
    if (t < 0) return lambda / mu;
    if (lambda >= mu) return 1.0;
    const rho = lambda / mu;
    return rho * Math.exp(-(mu - lambda) * t);
  }

  /**
   * 13. Verify Little's Formulas for mathematical consistency
   *  (a) Lₛ = λ · Wₛ
   *  (b) Lq = λ · Wq
   *  (c) Wₛ = Wq + 1/μ
   *  (d) Lₛ = Lq + λ/μ
   */
  function verifyLittlesFormulas(lambda, mu, Ls, Lq, Ws, Wq, tol = 1e-6) {
    const diff1 = Math.abs(Ls - lambda * Ws);
    const diff2 = Math.abs(Lq - lambda * Wq);
    const diff3 = Math.abs(Ws - (Wq + 1 / mu));
    const diff4 = Math.abs(Ls - (Lq + lambda / mu));

    return {
      law1: {
        formula: 'Lₛ = λ · Wₛ',
        lhs: Ls,
        rhs: lambda * Ws,
        difference: diff1,
        isVerified: diff1 < tol
      },
      law2: {
        formula: 'Lq = λ · Wq',
        lhs: Lq,
        rhs: lambda * Wq,
        difference: diff2,
        isVerified: diff2 < tol
      },
      law3: {
        formula: 'Wₛ = Wq + 1/μ',
        lhs: Ws,
        rhs: Wq + 1 / mu,
        difference: diff3,
        isVerified: diff3 < tol
      },
      law4: {
        formula: 'Lₛ = Lq + λ/μ',
        lhs: Ls,
        rhs: Lq + lambda / mu,
        difference: diff4,
        isVerified: diff4 < tol
      },
      allVerified: diff1 < tol && diff2 < tol && diff3 < tol && diff4 < tol
    };
  }

  /**
   * Comprehensive performance metric calculation bundle.
   * Computes all steady-state values, probabilities, and validations in one call.
   */
  function computeAllMetrics(lambda, mu, options = {}) {
    const validation = validateInputs(lambda, mu);

    if (!validation.isValid) {
      return {
        isValid: false,
        isStable: false,
        error: validation.error,
        warning: ''
      };
    }

    const lam = parseFloat(lambda);
    const m = parseFloat(mu);
    const rho = lam / m;

    if (!validation.isStable) {
      return {
        isValid: true,
        isStable: false,
        lambda: lam,
        mu: m,
        rho: rho,
        p0: 0,
        Ls: Infinity,
        Lq: Infinity,
        Lw: Infinity,
        Ws: Infinity,
        Wq: Infinity,
        avgServiceTime: 1 / m,
        avgInterArrivalTime: 1 / lam,
        error: '',
        warning: validation.warning
      };
    }

    // Stable Queue Metrics
    const p0 = calculateP0(rho);
    const Ls = calculateLs(lam, m);
    const Lq = calculateLq(lam, m);
    const Lw = calculateLw(lam, m);
    const Ws = calculateWs(lam, m);
    const Wq = calculateWq(lam, m);

    // Dynamic thresholds
    const kParam = options.k !== undefined ? parseInt(options.k, 10) : 3;
    const tParam = options.t !== undefined ? parseFloat(options.t) : 0.5;
    const nParam = options.n !== undefined ? parseInt(options.n, 10) : 2;

    const pn = calculatePn(nParam, rho);
    const probNGeK = calculateProbNGeK(kParam, rho);
    const probNGtK = calculateProbNGtK(kParam, rho);
    const probTsGtT = calculateProbTsGtT(tParam, lam, m);
    const probTqGtT = calculateProbTqGtT(tParam, lam, m);

    // Little's formulas verification
    const littles = verifyLittlesFormulas(lam, m, Ls, Lq, Ws, Wq);

    return {
      isValid: true,
      isStable: true,
      lambda: lam,
      mu: m,
      rho: rho,
      p0: p0,
      Ls: Ls,
      L: Ls, // alias for assignment compatibility
      Lq: Lq,
      Lw: Lw,
      Ws: Ws,
      W: Ws, // alias for assignment compatibility
      Wq: Wq,
      avgServiceTime: 1 / m,
      avgInterArrivalTime: 1 / lam,
      kParam: kParam,
      tParam: tParam,
      nParam: nParam,
      pn: pn,
      probNGeK: probNGeK,
      probNGtK: probNGtK,
      probTsGtT: probTsGtT,
      probTqGtT: probTqGtT,
      littles: littles,
      error: '',
      warning: ''
    };
  }

  // Public API
  return {
    validateInputs: validateInputs,
    calculateRho: calculateRho,
    calculateP0: calculateP0,
    calculatePn: calculatePn,
    calculateLs: calculateLs,
    calculateLq: calculateLq,
    calculateLw: calculateLw,
    calculateWs: calculateWs,
    calculateWq: calculateWq,
    calculateProbNGeK: calculateProbNGeK,
    calculateProbNGtK: calculateProbNGtK,
    calculateProbTsGtT: calculateProbTsGtT,
    calculateProbTqGtT: calculateProbTqGtT,
    verifyLittlesFormulas: verifyLittlesFormulas,
    computeAllMetrics: computeAllMetrics
  };
}));
