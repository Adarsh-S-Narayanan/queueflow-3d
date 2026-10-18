/**
 * Model II: (M/M/s) : (ꝏ/FIFO) Queuing Theory Engine (JavaScript Implementation)
 * =============================================================================
 * Pure isolated mathematical engine for multi-server Markovian queues.
 * Supports UMD (browser window.MMsEngine and CommonJS module.exports).
 *
 * Formulas:
 *   1. Offered Load: r = λ / μ (Erlangs)
 *   2. Server Utilisation: ρ = λ / (s · μ) = r / s
 *   3. Empty System Probability:
 *        P₀ = [ ∑_{n=0}^{s-1} (rⁿ / n!) + (rˢ / (s! · (1 - ρ))) ]⁻¹
 *   4. Prob. Arriving Customer Waits (Erlang's C Formula):
 *        P(Wait) = C(s, r) = [ rˢ / (s! · (1 - ρ)) ] · P₀
 *   5. Average in Queue:
 *        Lq = [ P(Wait) · ρ ] / (1 - ρ)
 *   6. Average in System:
 *        Ls = Lq + (λ / μ) = Lq + r
 *   7. Average Waiting Time in Queue:
 *        Wq = Lq / λ = P(Wait) / (s · μ - λ)
 *   8. Average Time in System:
 *        Ws = Wq + 1 / μ = Ls / λ
 *   9. Average in Waiting Line (Non-empty queue):
 *        Lw = Lq / P(Wait) = ρ / (1 - ρ)
 *  10. State Probabilities:
 *        Pₙ = (rⁿ / n!) · P₀               for 0 ≤ n ≤ s
 *        Pₙ = (rˢ / s!) · ρⁿ⁻ˢ · P₀        for n > s
 *  11. Little's Laws:
 *        Ls = λ · Ws
 *        Lq = λ · Wq
 *        Ws = Wq + 1/μ
 *        Ls = Lq + λ/μ
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MMsEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Validates inputs (λ, μ, s)
   * @param {number} lam - Arrival rate λ
   * @param {number} mu - Service rate per server μ
   * @param {number} s - Number of parallel servers s
   * @returns {{isValid: boolean, isStable: boolean, error: string|null, warning: string|null}}
   */
  function validateInputs(lam, mu, s) {
    if (typeof lam !== 'number' || typeof mu !== 'number' || typeof s !== 'number' ||
        isNaN(lam) || isNaN(mu) || isNaN(s)) {
      return {
        isValid: false,
        isStable: false,
        error: 'Inputs must be valid finite numbers.',
        warning: null
      };
    }

    if (!isFinite(lam) || !isFinite(mu) || !isFinite(s)) {
      return {
        isValid: false,
        isStable: false,
        error: 'Inputs must be finite numbers.',
        warning: null
      };
    }

    if (!Number.isInteger(s) || s < 1) {
      return {
        isValid: false,
        isStable: false,
        error: 'Number of servers (s) must be a positive integer (s ≥ 1).',
        warning: null
      };
    }

    if (lam <= 0 && mu <= 0) {
      return {
        isValid: false,
        isStable: false,
        error: 'Arrival rate (λ) and service rate per server (μ) must both be strictly positive (> 0).',
        warning: null
      };
    }

    if (lam <= 0) {
      return {
        isValid: false,
        isStable: false,
        error: 'Arrival rate (λ) must be strictly greater than zero (> 0).',
        warning: null
      };
    }

    if (mu <= 0) {
      return {
        isValid: false,
        isStable: false,
        error: 'Service rate per server (μ) must be strictly greater than zero (> 0).',
        warning: null
      };
    }

    const totalCapacity = s * mu;
    const rho = lam / totalCapacity;

    if (lam >= totalCapacity) {
      if (Math.abs(lam - totalCapacity) < 1e-9) {
        return {
          isValid: true,
          isStable: false,
          error: null,
          warning: `Critical Boundary Condition (λ = s·μ = ${lam.toFixed(4)}): Utilization ρ = 1.00. In an (M/M/${s}):(ꝏ/FIFO) queue with ${s} server${s > 1 ? 's' : ''}, random fluctuations prevent equilibrium. The queue backlog will grow without bound over time. Steady-state does not exist.`
        };
      } else {
        const excess = lam - totalCapacity;
        return {
          isValid: true,
          isStable: false,
          error: null,
          warning: `Severe Overload Warning (λ = ${lam.toFixed(4)} > s·μ = ${totalCapacity.toFixed(4)}, ρ = ${rho.toFixed(4)}): Arrival rate exceeds total server pool capacity by ${excess.toFixed(4)} cust/time-unit. Backlog explodes infinitely (Lq → ∞, Wq → ∞).`
        };
      }
    }

    return {
      isValid: true,
      isStable: true,
      error: null,
      warning: null
    };
  }

  /**
   * Utilization Factor: ρ = λ / (s · μ)
   */
  function calculateRho(lam, mu, s) {
    return lam / (s * mu);
  }

  /**
   * Offered Load: r = λ / μ (in Erlangs)
   */
  function calculateOfferedLoad(lam, mu) {
    return lam / mu;
  }

  /**
   * Probability that the system is empty: P₀
   *   P₀ = [ ∑_{n=0}^{s-1} (rⁿ / n!) + (rˢ / (s! · (1 - ρ))) ]⁻¹
   */
  function calculateP0(lam, mu, s) {
    const rho = lam / (s * mu);
    if (rho >= 1.0) return 0.0;

    const r = lam / mu;
    let termsSum = 0.0;
    let currentTerm = 1.0; // n = 0: r^0 / 0! = 1

    for (let n = 0; n < s; n++) {
      termsSum += currentTerm;
      currentTerm *= (r / (n + 1));
    }

    // currentTerm is now r^s / s!
    const sTerm = currentTerm;
    const lastTerm = sTerm / (1.0 - rho);
    const denominator = termsSum + lastTerm;

    return 1.0 / denominator;
  }

  /**
   * Probability that an arriving customer has to wait (Erlang's C Formula):
   *   P(Wait) = C(s, r) = [ rˢ / (s! · (1 - ρ)) ] · P₀
   */
  function calculateProbWait(lam, mu, s, p0) {
    const rho = lam / (s * mu);
    if (rho >= 1.0) return 1.0;

    if (p0 === undefined || p0 === null) {
      p0 = calculateP0(lam, mu, s);
    }

    const r = lam / mu;
    let currentTerm = 1.0;
    for (let n = 1; n <= s; n++) {
      currentTerm *= (r / n);
    }

    const probWait = (currentTerm / (1.0 - rho)) * p0;
    return Math.min(1.0, Math.max(0.0, probWait));
  }

  /**
   * Average number of customers in queue (Lq):
   *   Lq = [ P(Wait) · ρ ] / (1 - ρ)
   */
  function calculateLq(lam, mu, s, probWait, p0) {
    const rho = lam / (s * mu);
    if (rho >= 1.0) return Infinity;

    if (probWait === undefined || probWait === null) {
      probWait = calculateProbWait(lam, mu, s, p0);
    }

    return (probWait * rho) / (1.0 - rho);
  }

  /**
   * Average number of customers in system (Ls or L):
   *   Ls = Lq + (λ / μ)
   */
  function calculateLs(lam, mu, s, lq) {
    const rho = lam / (s * mu);
    if (rho >= 1.0) return Infinity;

    if (lq === undefined || lq === null) {
      lq = calculateLq(lam, mu, s);
    }

    return lq + (lam / mu);
  }

  /**
   * Average waiting time in queue (Wq):
   *   Wq = Lq / λ = P(Wait) / (s · μ - λ)
   */
  function calculateWq(lam, mu, s, lq) {
    const rho = lam / (s * mu);
    if (rho >= 1.0) return Infinity;

    if (lq === undefined || lq === null) {
      lq = calculateLq(lam, mu, s);
    }

    return lq / lam;
  }

  /**
   * Average time spent in system (Ws or W):
   *   Ws = Wq + 1 / μ = Ls / λ
   */
  function calculateWs(lam, mu, s, wq) {
    const rho = lam / (s * mu);
    if (rho >= 1.0) return Infinity;

    if (wq === undefined || wq === null) {
      wq = calculateWq(lam, mu, s);
    }

    return wq + (1.0 / mu);
  }

  /**
   * Average queue length when non-empty (Lw):
   *   Lw = Lq / P(Wait) = ρ / (1 - ρ)
   */
  function calculateLw(lam, mu, s) {
    const rho = lam / (s * mu);
    if (rho >= 1.0) return Infinity;
    return rho / (1.0 - rho);
  }

  /**
   * State probability Pn
   */
  function calculatePn(n, lam, mu, s, p0) {
    if (n < 0) return 0.0;
    const rho = lam / (s * mu);
    if (rho >= 1.0) return 0.0;

    if (p0 === undefined || p0 === null) {
      p0 = calculateP0(lam, mu, s);
    }

    const r = lam / mu;
    if (n <= s) {
      let term = 1.0;
      for (let i = 1; i <= n; i++) {
        term *= (r / i);
      }
      return term * p0;
    } else {
      let termS = 1.0;
      for (let i = 1; i <= s; i++) {
        termS *= (r / i);
      }
      return termS * Math.pow(rho, n - s) * p0;
    }
  }

  /**
   * Tail distribution: P(Wq > t)
   */
  function calculateProbWqGtT(t, lam, mu, s, probWait) {
    if (t < 0) return 1.0;
    const rho = lam / (s * mu);
    if (rho >= 1.0) return 1.0;

    if (probWait === undefined || probWait === null) {
      probWait = calculateProbWait(lam, mu, s);
    }

    return probWait * Math.exp(-(s * mu - lam) * t);
  }

  /**
   * Verify Little's 4 Laws
   */
  function verifyLittlesFormulas(lam, mu, s, ls, lq, ws, wq, tol) {
    if (tol === undefined) tol = 1e-6;

    const diff1 = Math.abs(ls - lam * ws);
    const diff2 = Math.abs(lq - lam * wq);
    const diff3 = Math.abs(ws - (wq + 1.0 / mu));
    const diff4 = Math.abs(ls - (lq + lam / mu));

    return {
      law1_Ls_eq_lam_Ws: {
        formula: 'Ls = λ · Ws',
        lhs: ls,
        rhs: lam * ws,
        diff: diff1,
        verified: diff1 < tol
      },
      law2_Lq_eq_lam_Wq: {
        formula: 'Lq = λ · Wq',
        lhs: lq,
        rhs: lam * wq,
        diff: diff2,
        verified: diff2 < tol
      },
      law3_Ws_eq_Wq_plus_inv_mu: {
        formula: 'Ws = Wq + 1/μ',
        lhs: ws,
        rhs: wq + 1.0 / mu,
        diff: diff3,
        verified: diff3 < tol
      },
      law4_Ls_eq_Lq_plus_r: {
        formula: 'Ls = Lq + λ/μ',
        lhs: ls,
        rhs: lq + lam / mu,
        diff: diff4,
        verified: diff4 < tol
      },
      allVerified: diff1 < tol && diff2 < tol && diff3 < tol && diff4 < tol
    };
  }

  /**
   * Compute all metrics
   */
  function computeAllMetrics(lam, mu, s, options) {
    options = options || {};
    const t = options.t !== undefined ? options.t : 0.5;
    const nSample = options.nSample !== undefined ? options.nSample : 3;

    const validation = validateInputs(lam, mu, s);
    if (!validation.isValid) {
      return {
        isValid: false,
        isStable: false,
        lambda: lam,
        mu: mu,
        s: s,
        error: validation.error,
        warning: null
      };
    }

    const totalCapacity = s * mu;
    const r = lam / mu;
    const rho = lam / totalCapacity;

    if (!validation.isStable) {
      return {
        isValid: true,
        isStable: false,
        lambda: lam,
        mu: mu,
        s: s,
        r: r,
        totalCapacity: totalCapacity,
        rho: rho,
        p0: 0.0,
        probWait: 1.0,
        Lq: Infinity,
        Ls: Infinity,
        L: Infinity,
        Wq: Infinity,
        Ws: Infinity,
        W: Infinity,
        Lw: Infinity,
        error: null,
        warning: validation.warning
      };
    }

    const p0 = calculateP0(lam, mu, s);
    const probWait = calculateProbWait(lam, mu, s, p0);
    const lq = calculateLq(lam, mu, s, probWait, p0);
    const ls = calculateLs(lam, mu, s, lq);
    const wq = calculateWq(lam, mu, s, lq);
    const ws = calculateWs(lam, mu, s, wq);
    const lw = calculateLw(lam, mu, s);

    const pnSample = calculatePn(nSample, lam, mu, s, p0);
    const probWqGt = calculateProbWqGtT(t, lam, mu, s, probWait);

    const distMax = Math.max(15, s + 10);
    const distribution = [];
    for (let i = 0; i <= distMax; i++) {
      distribution.push({
        n: i,
        prob: calculatePn(i, lam, mu, s, p0)
      });
    }

    const littles = verifyLittlesFormulas(lam, mu, s, ls, lq, ws, wq);

    return {
      isValid: true,
      isStable: true,
      lambda: lam,
      mu: mu,
      s: s,
      r: r,
      totalCapacity: totalCapacity,
      rho: rho,
      p0: p0,
      probWait: probWait,
      Lq: lq,
      Ls: ls,
      L: ls,
      Wq: wq,
      Ws: ws,
      W: ws,
      Lw: lw,
      avgServiceTime: 1.0 / mu,
      avgInterarrivalTime: 1.0 / lam,
      nSample: nSample,
      pnSample: pnSample,
      t: t,
      probWqGtT: probWqGt,
      distribution: distribution,
      littles: littles,
      error: null,
      warning: null
    };
  }

  return {
    validateInputs: validateInputs,
    calculateRho: calculateRho,
    calculateOfferedLoad: calculateOfferedLoad,
    calculateP0: calculateP0,
    calculateProbWait: calculateProbWait,
    calculateLq: calculateLq,
    calculateLs: calculateLs,
    calculateWq: calculateWq,
    calculateWs: calculateWs,
    calculateLw: calculateLw,
    calculatePn: calculatePn,
    calculateProbWqGtT: calculateProbWqGtT,
    verifyLittlesFormulas: verifyLittlesFormulas,
    computeAllMetrics: computeAllMetrics
  };
}));
