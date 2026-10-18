"""
Model I: (M/M/1) : (∞/FIFO) Queuing Theory Engine (Python Implementation)
========================================================================
Pure isolated mathematical engine for single-server Markovian queues.
Based on the Linear Algebra & Queuing Theory Study Notes (Page 6).

Formulas:
  1. Utilisation Factor: ρ = λ / μ
  2. Empty System: P₀ = 1 - ρ
  3. P(n customers) = ρⁿ (1 - ρ)
  4. Avg in System: Lₛ = λ / (μ - λ)
  5. Avg in Queue: Lq = λ² / (μ(μ - λ))
  6. Avg in Waiting Line: Lw = μ / (μ - λ)
  7. Avg Time in System: Wₛ = 1 / (μ - λ)
  8. Avg Wait in Queue: Wq = λ / (μ(μ - λ))
  9. P(N ≥ k) = ρᵏ
 10. P(N > k) = ρᵏ⁺¹
 11. P(Tₛ > t) = e^(-(μ - λ)t)
 12. P(Tq > t) = ρ · e^(-(μ - λ)t)
 13. Little's Formulas:
     Lₛ = λ · Wₛ
     Lq = λ · Wq
     Wₛ = Wq + 1/μ
     Lₛ = Lq + λ/μ
"""

import math
from typing import Dict, Any, Tuple, Optional


def validate_inputs(lam: float, mu: float) -> Tuple[bool, bool, Optional[str], Optional[str]]:
    """
    Validates input arrival rate (lambda) and service rate (mu).
    Returns (is_valid, is_stable, error_msg, warning_msg).
    """
    if math.isnan(lam) or math.isnan(mu):
        return False, False, "Inputs must be valid real numbers.", None

    if lam <= 0 and mu <= 0:
        return False, False, "Arrival rate (λ) and service rate (μ) must both be strictly positive (> 0).", None

    if lam <= 0:
        return False, False, "Arrival rate (λ) must be strictly greater than zero (> 0).", None

    if mu <= 0:
        return False, False, "Service rate (μ) must be strictly greater than zero (> 0).", None

    if lam >= mu:
        rho = lam / mu
        if lam == mu:
            warn = (
                f"Critical Boundary (λ = μ = {lam}): Utilisation ρ = 1.00. "
                "In an (M/M/1):(∞/FIFO) queue, random fluctuations cause the queue "
                "to explode infinitely over time. Steady-state does not exist."
            )
        else:
            warn = (
                f"Severe Overload (λ = {lam} ≥ μ = {mu}, ρ = {rho:.4f}): "
                "Incoming arrivals exceed service capacity. The queue backlog grows without "
                "bound (Lq → ∞, Wq → ∞) and equilibrium is impossible."
            )
        return True, False, None, warn

    return True, True, None, None


def calculate_rho(lam: float, mu: float) -> float:
    """Traffic Intensity / Utilisation Factor: ρ = λ / μ"""
    return lam / mu


def calculate_p0(rho: float) -> float:
    """Probability that system is empty: P₀ = 1 - ρ"""
    return 1.0 - rho


def calculate_pn(n: int, rho: float) -> float:
    """Probability of finding n customers in system: Pₙ = ρⁿ(1 - ρ)"""
    if n < 0:
        return 0.0
    return (rho ** n) * (1.0 - rho)


def calculate_ls(lam: float, mu: float) -> float:
    """Average number of customers in system: Lₛ = λ / (μ - λ)"""
    if lam >= mu:
        return float('inf')
    return lam / (mu - lam)


def calculate_lq(lam: float, mu: float) -> float:
    """Average number of customers in queue: Lq = λ² / (μ(μ - λ))"""
    if lam >= mu:
        return float('inf')
    return (lam ** 2) / (mu * (mu - lam))


def calculate_lw(lam: float, mu: float) -> float:
    """Average number of customers in waiting line (non-empty queue): Lw = μ / (μ - λ)"""
    if lam >= mu:
        return float('inf')
    return mu / (mu - lam)


def calculate_ws(lam: float, mu: float) -> float:
    """Average time spent in system: Wₛ = 1 / (μ - λ)"""
    if lam >= mu:
        return float('inf')
    return 1.0 / (mu - lam)


def calculate_wq(lam: float, mu: float) -> float:
    """Average waiting time in queue: Wq = λ / (μ(μ - λ))"""
    if lam >= mu:
        return float('inf')
    return lam / (mu * (mu - lam))


def calculate_prob_n_ge_k(k: int, rho: float) -> float:
    """Probability of at least k customers in system: P(N ≥ k) = ρᵏ"""
    if k <= 0:
        return 1.0
    return rho ** k


def calculate_prob_n_gt_k(k: int, rho: float) -> float:
    """Probability of strictly more than k customers in system: P(N > k) = ρᵏ⁺¹"""
    if k < 0:
        return 1.0
    return rho ** (k + 1)


def calculate_prob_ts_gt_t(t: float, lam: float, mu: float) -> float:
    """Probability of system residence time exceeding t: P(Tₛ > t) = e^(-(μ - λ)t)"""
    if t < 0:
        return 1.0
    if lam >= mu:
        return 1.0
    return math.exp(-(mu - lam) * t)


def calculate_prob_tq_gt_t(t: float, lam: float, mu: float) -> float:
    """Probability of queue waiting time exceeding t: P(Tq > t) = ρ · e^(-(μ - λ)t)"""
    if t < 0:
        return lam / mu
    if lam >= mu:
        return 1.0
    rho = lam / mu
    return rho * math.exp(-(mu - lam) * t)


def verify_littles_formulas(lam: float, mu: float, ls: float, lq: float, ws: float, wq: float, tol: float = 1e-6) -> Dict[str, Any]:
    """
    Verifies Little's formulas:
      1. Lₛ = λ · Wₛ
      2. Lq = λ · Wq
      3. Wₛ = Wq + 1/μ
      4. Lₛ = Lq + λ/μ
    """
    diff1 = abs(ls - lam * ws)
    diff2 = abs(lq - lam * wq)
    diff3 = abs(ws - (wq + 1.0 / mu))
    diff4 = abs(ls - (lq + lam / mu))

    return {
        "law1_Ls_eq_lam_Ws": {"lhs": ls, "rhs": lam * ws, "diff": diff1, "verified": diff1 < tol},
        "law2_Lq_eq_lam_Wq": {"lhs": lq, "rhs": lam * wq, "diff": diff2, "verified": diff2 < tol},
        "law3_Ws_eq_Wq_plus_inv_mu": {"lhs": ws, "rhs": wq + 1.0 / mu, "diff": diff3, "verified": diff3 < tol},
        "law4_Ls_eq_Lq_plus_rho": {"lhs": ls, "rhs": lq + lam / mu, "diff": diff4, "verified": diff4 < tol},
        "all_verified": diff1 < tol and diff2 < tol and diff3 < tol and diff4 < tol
    }


def compute_all_metrics(lam: float, mu: float, k: int = 3, t: float = 0.5, n: int = 2) -> Dict[str, Any]:
    """
    Unified evaluation function computing all performance measures, tail probabilities,
    and Little's Law verifications.
    """
    is_valid, is_stable, err, warn = validate_inputs(lam, mu)

    if not is_valid:
        return {
            "is_valid": False,
            "is_stable": False,
            "error": err,
            "warning": None
        }

    rho = lam / mu

    if not is_stable:
        return {
            "is_valid": True,
            "is_stable": False,
            "lambda": lam,
            "mu": mu,
            "rho": rho,
            "p0": 0.0,
            "Ls": float('inf'),
            "L": float('inf'),
            "Lq": float('inf'),
            "Lw": float('inf'),
            "Ws": float('inf'),
            "W": float('inf'),
            "Wq": float('inf'),
            "error": None,
            "warning": warn
        }

    p0 = calculate_p0(rho)
    ls = calculate_ls(lam, mu)
    lq = calculate_lq(lam, mu)
    lw = calculate_lw(lam, mu)
    ws = calculate_ws(lam, mu)
    wq = calculate_wq(lam, mu)

    pn = calculate_pn(n, rho)
    prob_ge_k = calculate_prob_n_ge_k(k, rho)
    prob_gt_k = calculate_prob_n_gt_k(k, rho)
    prob_ts = calculate_prob_ts_gt_t(t, lam, mu)
    prob_tq = calculate_prob_tq_gt_t(t, lam, mu)

    littles = verify_littles_formulas(lam, mu, ls, lq, ws, wq)

    return {
        "is_valid": True,
        "is_stable": True,
        "lambda": lam,
        "mu": mu,
        "rho": rho,
        "p0": p0,
        "Ls": ls,
        "L": ls,
        "Lq": lq,
        "Lw": lw,
        "Ws": ws,
        "W": ws,
        "Wq": wq,
        "avg_service_time": 1.0 / mu,
        "avg_interarrival_time": 1.0 / lam,
        "n": n,
        "pn": pn,
        "k": k,
        "prob_N_ge_k": prob_ge_k,
        "prob_N_gt_k": prob_gt_k,
        "t": t,
        "prob_Ts_gt_t": prob_ts,
        "prob_Tq_gt_t": prob_tq,
        "littles": littles,
        "error": None,
        "warning": None
    }
