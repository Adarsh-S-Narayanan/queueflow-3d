"""
Model II: (M/M/s) : (ꝏ/FIFO) Queuing Theory Engine (Python Implementation)
========================================================================
Pure isolated mathematical engine for multi-server Markovian queues.
System: M/M/s / ꝏ / FIFO

Formulas Implemented:
  1. Offered Load: r = λ / μ (traffic load in Erlangs)
  2. Server Utilisation Factor: ρ = λ / (s · μ) = r / s
  3. Stability Condition: λ < s · μ  (ρ < 1)
  4. Empty System Probability:
       P₀ = [ ∑_{n=0}^{s-1} (rⁿ / n!) + (rˢ / (s! · (1 - ρ))) ]⁻¹
  5. Probability of Arriving Customer Having to Wait (Erlang's C Formula):
       P(Wait) = P(N ≥ s) = [ rˢ / (s! · (1 - ρ)) ] · P₀
  6. Average Customers in Queue:
       Lq = [ P(Wait) · ρ ] / (1 - ρ)
          = [ rˢ · ρ / (s! · (1 - ρ)²) ] · P₀
  7. Average Customers in System:
       Lₛ = Lq + (λ / μ) = Lq + r
  8. Average Waiting Time in Queue:
       Wq = Lq / λ = P(Wait) / (s · μ - λ)
  9. Average Time Spent in System:
       Wₛ = Wq + 1 / μ = Lₛ / λ
 10. Average Queue Length when Queue is Non-Empty:
       Lw = Lq / P(Wait) = ρ / (1 - ρ)
 11. State Probabilities Pₙ:
       Pₙ = (rⁿ / n!) · P₀               for 0 ≤ n ≤ s
       Pₙ = (rˢ / s!) · ρⁿ⁻ˢ · P₀        for n > s
 12. Tail Waiting Time Distributions:
       P(Wq > t) = P(Wait) · e^(-(s·μ - λ)·t)
 13. Little's Laws Verification:
       Lₛ = λ · Wₛ
       Lq = λ · Wq
       Wₛ = Wq + 1/μ
       Lₛ = Lq + λ/μ
"""

import math
from typing import Dict, Any, Tuple, Optional, List


def validate_inputs(lam: float, mu: float, s: int) -> Tuple[bool, bool, Optional[str], Optional[str]]:
    """
    Validates input parameters:
      - lam (λ): Arrival rate
      - mu (μ): Service rate per server
      - s: Number of parallel servers

    Returns:
      (is_valid, is_stable, error_msg, warning_msg)
    """
    # 1. Check for NaN or Inf
    if math.isnan(lam) or math.isnan(mu) or (isinstance(s, (int, float)) and math.isnan(s)):
        return False, False, "Inputs must be valid real numbers.", None

    if math.isinf(lam) or math.isinf(mu) or math.isinf(s):
        return False, False, "Inputs must be finite real numbers.", None

    # 2. Server count validation
    if not isinstance(s, int):
        try:
            if float(s).is_integer():
                s = int(s)
            else:
                return False, False, "Number of servers (s) must be an integer.", None
        except (ValueError, TypeError):
            return False, False, "Number of servers (s) must be a valid integer.", None

    if s < 1:
        return False, False, "Number of servers (s) must be a positive integer (s ≥ 1).", None

    # 3. Rate validations
    if lam <= 0 and mu <= 0:
        return False, False, "Arrival rate (λ) and service rate per server (μ) must both be strictly positive (> 0).", None

    if lam <= 0:
        return False, False, "Arrival rate (λ) must be strictly greater than zero (> 0).", None

    if mu <= 0:
        return False, False, "Service rate per server (μ) must be strictly greater than zero (> 0).", None

    # 4. Stability Check: λ < s * μ
    total_capacity = s * mu
    rho = lam / total_capacity

    if lam >= total_capacity:
        if math.isclose(lam, total_capacity, rel_tol=1e-9):
            warn = (
                f"Critical Boundary Condition (λ = s·μ = {lam:.4f}): Utilization ρ = 1.00. "
                f"In an (M/M/{s}):(ꝏ/FIFO) queue with {s} server{'s' if s > 1 else ''}, "
                "stochastic fluctuations prevent the queue from reaching equilibrium. "
                "The queue backlog will grow without bound over time. Steady-state does not exist."
            )
        else:
            excess = lam - total_capacity
            warn = (
                f"Severe Overload Warning (λ = {lam:.4f} > s·μ = {total_capacity:.4f}, ρ = {rho:.4f}): "
                f"Arrival rate exceeds total server pool processing capacity by {excess:.4f} cust/time-unit. "
                f"With {s} server{'s' if s > 1 else ''}, incoming customers arrive faster than all servers "
                "can serve them. Backlog explodes infinitely (Lq → ∞, Wq → ∞)."
            )
        return True, False, None, warn

    return True, True, None, None


def calculate_rho(lam: float, mu: float, s: int) -> float:
    """Server Utilisation Factor / Traffic Intensity: ρ = λ / (s · μ)"""
    return lam / (s * mu)


def calculate_offered_load(lam: float, mu: float) -> float:
    """Offered load in Erlangs: r = λ / μ"""
    return lam / mu


def calculate_p0(lam: float, mu: float, s: int) -> float:
    """
    Probability that the system is completely empty (P₀):
      P₀ = [ ∑_{n=0}^{s-1} (rⁿ / n!) + (rˢ / (s! · (1 - ρ))) ]⁻¹
    Uses iterative multiplication to prevent factorial overflow.
    """
    r = lam / mu
    rho = lam / (s * mu)

    if rho >= 1.0:
        return 0.0

    # Iterative calculation of r^n / n!
    terms_sum = 0.0
    current_term = 1.0  # n = 0: r^0 / 0! = 1

    for n in range(s):
        terms_sum += current_term
        # Prepare next term: r^(n+1) / (n+1)!
        current_term *= (r / (n + 1))

    # current_term is now r^s / s!
    s_term = current_term
    last_term = s_term / (1.0 - rho)

    total_denom = terms_sum + last_term
    return 1.0 / total_denom


def calculate_prob_wait(lam: float, mu: float, s: int, p0: Optional[float] = None) -> float:
    """
    Probability that an arriving customer has to wait in the queue (Erlang's C Formula):
      P(Wait) = C(s, r) = [ rˢ / (s! · (1 - ρ)) ] · P₀
    """
    rho = lam / (s * mu)
    if rho >= 1.0:
        return 1.0

    if p0 is None:
        p0 = calculate_p0(lam, mu, s)

    r = lam / mu
    # Calculate r^s / s!
    current_term = 1.0
    for n in range(1, s + 1):
        current_term *= (r / n)

    prob_wait = (current_term / (1.0 - rho)) * p0
    # Guard against slight floating point inaccuracies
    return min(1.0, max(0.0, prob_wait))


def calculate_lq(lam: float, mu: float, s: int, prob_wait: Optional[float] = None, p0: Optional[float] = None) -> float:
    """
    Average number of customers waiting in the queue (Lq):
      Lq = [ P(Wait) · ρ ] / (1 - ρ)
    """
    rho = lam / (s * mu)
    if rho >= 1.0:
        return float('inf')

    if prob_wait is None:
        prob_wait = calculate_prob_wait(lam, mu, s, p0)

    return (prob_wait * rho) / (1.0 - rho)


def calculate_ls(lam: float, mu: float, s: int, lq: Optional[float] = None) -> float:
    """
    Average number of customers in the system (Lₛ or L):
      Lₛ = Lq + (λ / μ) = Lq + r
    """
    rho = lam / (s * mu)
    if rho >= 1.0:
        return float('inf')

    if lq is None:
        lq = calculate_lq(lam, mu, s)

    return lq + (lam / mu)


def calculate_wq(lam: float, mu: float, s: int, lq: Optional[float] = None) -> float:
    """
    Average waiting time in the queue (Wq):
      Wq = Lq / λ = P(Wait) / (s · μ - λ)
    """
    rho = lam / (s * mu)
    if rho >= 1.0:
        return float('inf')

    if lq is None:
        lq = calculate_lq(lam, mu, s)

    return lq / lam


def calculate_ws(lam: float, mu: float, s: int, wq: Optional[float] = None) -> float:
    """
    Average time spent in the system (Wₛ or W):
      Wₛ = Wq + 1 / μ = Lₛ / λ
    """
    rho = lam / (s * mu)
    if rho >= 1.0:
        return float('inf')

    if wq is None:
        wq = calculate_wq(lam, mu, s)

    return wq + (1.0 / mu)


def calculate_lw(lam: float, mu: float, s: int, lq: Optional[float] = None, prob_wait: Optional[float] = None) -> float:
    """
    Average number of customers in waiting line given that the queue is non-empty:
      Lw = Lq / P(Wait) = ρ / (1 - ρ) = λ / (s·μ - λ)
    """
    rho = lam / (s * mu)
    if rho >= 1.0:
        return float('inf')

    return rho / (1.0 - rho)


def calculate_pn(n: int, lam: float, mu: float, s: int, p0: Optional[float] = None) -> float:
    """
    Steady-state probability of having exactly n customers in the system (Pₙ):
      Pₙ = (rⁿ / n!) · P₀                  for 0 ≤ n ≤ s
      Pₙ = (rⁿ / (s! · sⁿ⁻ˢ)) · P₀         for n > s
    """
    if n < 0:
        return 0.0

    rho = lam / (s * mu)
    if rho >= 1.0:
        return 0.0

    if p0 is None:
        p0 = calculate_p0(lam, mu, s)

    r = lam / mu

    if n <= s:
        term = 1.0
        for i in range(1, n + 1):
            term *= (r / i)
        return term * p0
    else:
        term_s = 1.0
        for i in range(1, s + 1):
            term_s *= (r / i)
        return term_s * (rho ** (n - s)) * p0


def calculate_prob_wq_gt_t(t: float, lam: float, mu: float, s: int, prob_wait: Optional[float] = None) -> float:
    """
    Tail distribution of waiting time in queue:
      P(Wq > t) = P(Wait) · e^(-(s·μ - λ)·t)
    """
    if t < 0:
        return 1.0

    rho = lam / (s * mu)
    if rho >= 1.0:
        return 1.0

    if prob_wait is None:
        prob_wait = calculate_prob_wait(lam, mu, s)

    return prob_wait * math.exp(-(s * mu - lam) * t)


def verify_littles_formulas(
    lam: float,
    mu: float,
    s: int,
    ls: float,
    lq: float,
    ws: float,
    wq: float,
    tol: float = 1e-6
) -> Dict[str, Any]:
    """
    Verifies Little's conservation laws for the (M/M/s):(ꝏ/FIFO) queue:
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
        "law1_Ls_eq_lam_Ws": {
            "formula": "Ls = λ · Ws",
            "lhs": ls,
            "rhs": lam * ws,
            "diff": diff1,
            "verified": diff1 < tol
        },
        "law2_Lq_eq_lam_Wq": {
            "formula": "Lq = λ · Wq",
            "lhs": lq,
            "rhs": lam * wq,
            "diff": diff2,
            "verified": diff2 < tol
        },
        "law3_Ws_eq_Wq_plus_inv_mu": {
            "formula": "Ws = Wq + 1/μ",
            "lhs": ws,
            "rhs": wq + 1.0 / mu,
            "diff": diff3,
            "verified": diff3 < tol
        },
        "law4_Ls_eq_Lq_plus_r": {
            "formula": "Ls = Lq + λ/μ",
            "lhs": ls,
            "rhs": lq + lam / mu,
            "diff": diff4,
            "verified": diff4 < tol
        },
        "all_verified": diff1 < tol and diff2 < tol and diff3 < tol and diff4 < tol
    }


def compute_all_metrics(
    lam: float,
    mu: float,
    s: int,
    t: float = 0.5,
    n_sample: int = 3
) -> Dict[str, Any]:
    """
    Unified calculation method for (M/M/s):(ꝏ/FIFO) Queues.
    Computes all standard performance measures, probabilities, and Little's Law checks.
    """
    is_valid, is_stable, err, warn = validate_inputs(lam, mu, s)

    if not is_valid:
        return {
            "is_valid": False,
            "is_stable": False,
            "lambda": lam,
            "mu": mu,
            "s": s,
            "error": err,
            "warning": None
        }

    total_capacity = s * mu
    r = lam / mu
    rho = lam / total_capacity

    if not is_stable:
        return {
            "is_valid": True,
            "is_stable": False,
            "lambda": lam,
            "mu": mu,
            "s": s,
            "r": r,
            "total_capacity": total_capacity,
            "rho": rho,
            "p0": 0.0,
            "prob_wait": 1.0,
            "Lq": float('inf'),
            "Ls": float('inf'),
            "L": float('inf'),
            "Wq": float('inf'),
            "Ws": float('inf'),
            "W": float('inf'),
            "Lw": float('inf'),
            "error": None,
            "warning": warn
        }

    # Steady-state stable calculations
    p0 = calculate_p0(lam, mu, s)
    prob_wait = calculate_prob_wait(lam, mu, s, p0)
    lq = calculate_lq(lam, mu, s, prob_wait, p0)
    ls = calculate_ls(lam, mu, s, lq)
    wq = calculate_wq(lam, mu, s, lq)
    ws = calculate_ws(lam, mu, s, wq)
    lw = calculate_lw(lam, mu, s, lq, prob_wait)

    # Probabilities & Distributions
    pn_sample = calculate_pn(n_sample, lam, mu, s, p0)
    prob_wq_gt = calculate_prob_wq_gt_t(t, lam, mu, s, prob_wait)

    # Distribution profile for first max(15, s + 10) states
    dist_max = max(15, s + 10)
    distribution: List[Dict[str, float]] = []
    for i in range(dist_max + 1):
        distribution.append({
            "n": i,
            "prob": calculate_pn(i, lam, mu, s, p0)
        })

    # Little's Law Verifications
    littles = verify_littles_formulas(lam, mu, s, ls, lq, ws, wq)

    return {
        "is_valid": True,
        "is_stable": True,
        "lambda": lam,
        "mu": mu,
        "s": s,
        "r": r,
        "total_capacity": total_capacity,
        "rho": rho,
        "p0": p0,
        "prob_wait": prob_wait,
        "Lq": lq,
        "Ls": ls,
        "L": ls,
        "Wq": wq,
        "Ws": ws,
        "W": ws,
        "Lw": lw,
        "avg_service_time": 1.0 / mu,
        "avg_interarrival_time": 1.0 / lam,
        "n_sample": n_sample,
        "pn_sample": pn_sample,
        "t": t,
        "prob_Wq_gt_t": prob_wq_gt,
        "distribution": distribution,
        "littles": littles,
        "error": None,
        "warning": None
    }
