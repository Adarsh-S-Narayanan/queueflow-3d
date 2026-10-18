"""
Unit tests for the isolated (M/M/1):(∞/FIFO) Queuing Theory Engine.
Validates all formulas from Page 6 of the Study Notes.
"""

import math
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

from mm1_engine import (
    validate_inputs,
    calculate_rho,
    calculate_p0,
    calculate_pn,
    calculate_ls,
    calculate_lq,
    calculate_lw,
    calculate_ws,
    calculate_wq,
    calculate_prob_n_ge_k,
    calculate_prob_n_gt_k,
    calculate_prob_ts_gt_t,
    calculate_prob_tq_gt_t,
    verify_littles_formulas,
    compute_all_metrics
)


def run_tests():
    print("Testing (M/M/1):(∞/FIFO) Mathematical Engine...")

    # Test Case 1: Standard Light Load (lambda=2, mu=4)
    lam, mu = 2.0, 4.0
    valid, stable, err, warn = validate_inputs(lam, mu)
    assert valid and stable, "Validation failed for valid inputs"

    rho = calculate_rho(lam, mu)
    assert abs(rho - 0.5) < 1e-9, f"rho mismatch: {rho}"

    p0 = calculate_p0(rho)
    assert abs(p0 - 0.5) < 1e-9, f"p0 mismatch: {p0}"

    ls = calculate_ls(lam, mu)
    assert abs(ls - 1.0) < 1e-9, f"ls mismatch: {ls}"

    lq = calculate_lq(lam, mu)
    assert abs(lq - 0.5) < 1e-9, f"lq mismatch: {lq}"

    lw = calculate_lw(lam, mu)
    assert abs(lw - 2.0) < 1e-9, f"lw mismatch: {lw}"

    ws = calculate_ws(lam, mu)
    assert abs(ws - 0.5) < 1e-9, f"ws mismatch: {ws}"

    wq = calculate_wq(lam, mu)
    assert abs(wq - 0.25) < 1e-9, f"wq mismatch: {wq}"

    # Little's Laws
    lit = verify_littles_formulas(lam, mu, ls, lq, ws, wq)
    assert lit["all_verified"], "Little's laws check failed"

    # Probabilities
    pn2 = calculate_pn(2, rho)
    assert abs(pn2 - (0.5**2 * 0.5)) < 1e-9, "P(n=2) mismatch"

    p_ge_3 = calculate_prob_n_ge_k(3, rho)
    assert abs(p_ge_3 - (0.5**3)) < 1e-9, "P(N >= 3) mismatch"

    p_gt_3 = calculate_prob_n_gt_k(3, rho)
    assert abs(p_gt_3 - (0.5**4)) < 1e-9, "P(N > 3) mismatch"

    # Tail waiting time
    t = 0.5
    p_ts = calculate_prob_ts_gt_t(t, lam, mu)
    expected_p_ts = math.exp(-(4.0 - 2.0) * 0.5)
    assert abs(p_ts - expected_p_ts) < 1e-9, "P(Ts > t) mismatch"

    p_tq = calculate_prob_tq_gt_t(t, lam, mu)
    expected_p_tq = rho * math.exp(-(4.0 - 2.0) * 0.5)
    assert abs(p_tq - expected_p_tq) < 1e-9, "P(Tq > t) mismatch"

    # Test Case 2: Boundary (lambda == mu)
    val2, stb2, err2, warn2 = validate_inputs(5.0, 5.0)
    assert val2 and not stb2, "Boundary test failed"
    assert "Critical Boundary" in warn2 or "ρ = 1.00" in warn2

    # Test Case 3: Overloaded (lambda > mu)
    val3, stb3, err3, warn3 = validate_inputs(12.0, 8.0)
    assert val3 and not stb3, "Overloaded test failed"

    # Test Case 4: Invalid negative lambda
    val4, stb4, err4, warn4 = validate_inputs(-2.0, 5.0)
    assert not val4, "Negative lambda test failed"

    # Test Case 5: Invalid zero mu
    val5, stb5, err5, warn5 = validate_inputs(3.0, 0.0)
    assert not val5, "Zero mu test failed"

    # Full Metrics Test
    all_res = compute_all_metrics(3.0, 5.0, k=2, t=1.0, n=1)
    assert all_res["is_valid"] and all_res["is_stable"]
    assert abs(all_res["rho"] - 0.6) < 1e-9
    assert abs(all_res["Ls"] - 1.5) < 1e-9
    assert abs(all_res["Lq"] - 0.9) < 1e-9

    print("ALL ENGINE UNIT TESTS PASSED SUCCESSFULLY! (100% Accuracy)")


if __name__ == "__main__":
    run_tests()
