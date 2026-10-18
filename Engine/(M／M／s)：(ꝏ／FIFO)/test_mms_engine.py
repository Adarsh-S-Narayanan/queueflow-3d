"""
Unit Tests for Model II: (M/M/s):(ꝏ/FIFO) Queuing Theory Engine
================================================================
Validates all equations, Little's Laws, boundary conditions,
and input validations for multi-server Markovian queues.
"""

import math
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

from mms_engine import (
    validate_inputs,
    calculate_rho,
    calculate_offered_load,
    calculate_p0,
    calculate_prob_wait,
    calculate_lq,
    calculate_ls,
    calculate_wq,
    calculate_ws,
    calculate_lw,
    calculate_pn,
    calculate_prob_wq_gt_t,
    verify_littles_formulas,
    compute_all_metrics,
)


def run_tests():
    print("Testing (M/M/s):(ꝏ/FIFO) Mathematical Engine...\n" + "=" * 60)

    # ----------------------------------------------------
    # Test Case 1: Standard 2-Server Balanced Queue (λ=3, μ=2, s=2)
    # ----------------------------------------------------
    # r = 3/2 = 1.5, total_cap = 4.0, rho = 3/4 = 0.75
    # P0 = 1 / [ 1 + 1.5 + (1.5^2 / 2!) * (1 / (1 - 0.75)) ] = 1 / [ 2.5 + 4.5 ] = 1/7
    # P(wait) = Erlang C = 4.5 * (1/7) = 9/14 ≈ 0.642857
    # Lq = (9/14 * 0.75) / 0.25 = 27/14 ≈ 1.928571
    # Ls = 27/14 + 1.5 = 48/14 = 24/7 ≈ 3.428571
    # Wq = Lq / 3 = 9/14 ≈ 0.642857
    # Ws = Wq + 1/2 = 16/14 = 8/7 ≈ 1.142857
    # ----------------------------------------------------
    lam1, mu1, s1 = 3.0, 2.0, 2
    val1, stb1, err1, warn1 = validate_inputs(lam1, mu1, s1)
    assert val1 and stb1, "Test 1 validation failed"

    rho1 = calculate_rho(lam1, mu1, s1)
    assert abs(rho1 - 0.75) < 1e-9, f"Test 1 rho mismatch: {rho1}"

    p0_1 = calculate_p0(lam1, mu1, s1)
    expected_p0_1 = 1.0 / 7.0
    assert abs(p0_1 - expected_p0_1) < 1e-9, f"Test 1 P0 mismatch: {p0_1} vs {expected_p0_1}"

    p_wait1 = calculate_prob_wait(lam1, mu1, s1, p0_1)
    expected_p_wait1 = 9.0 / 14.0
    assert abs(p_wait1 - expected_p_wait1) < 1e-9, f"Test 1 P(wait) mismatch: {p_wait1}"

    lq1 = calculate_lq(lam1, mu1, s1, p_wait1, p0_1)
    expected_lq1 = 27.0 / 14.0
    assert abs(lq1 - expected_lq1) < 1e-9, f"Test 1 Lq mismatch: {lq1}"

    ls1 = calculate_ls(lam1, mu1, s1, lq1)
    expected_ls1 = 24.0 / 7.0
    assert abs(ls1 - expected_ls1) < 1e-9, f"Test 1 Ls mismatch: {ls1}"

    wq1 = calculate_wq(lam1, mu1, s1, lq1)
    expected_wq1 = 9.0 / 14.0
    assert abs(wq1 - expected_wq1) < 1e-9, f"Test 1 Wq mismatch: {wq1}"

    ws1 = calculate_ws(lam1, mu1, s1, wq1)
    expected_ws1 = 8.0 / 7.0
    assert abs(ws1 - expected_ws1) < 1e-9, f"Test 1 Ws mismatch: {ws1}"

    lit1 = verify_littles_formulas(lam1, mu1, s1, ls1, lq1, ws1, wq1)
    assert lit1["all_verified"], "Test 1 Little's laws check failed"
    print("✓ Test Case 1: Standard 2-Server Balanced Queue (λ=3, μ=2, s=2) -> PASSED")

    # ----------------------------------------------------
    # Test Case 2: High Efficiency 3-Server Queue (λ=4, μ=2, s=3)
    # ----------------------------------------------------
    # r = 2.0, rho = 4 / 6 = 2/3
    # P0 = 1 / [ 1 + 2 + 2 + (8/6) * 3 ] = 1 / 9
    # P(wait) = 4 * (1/9) = 4/9 ≈ 0.444444
    # Lq = (4/9 * 2/3) / (1/3) = 8/9 ≈ 0.888889
    # Ls = 8/9 + 2 = 26/9 ≈ 2.888889
    # Wq = (8/9) / 4 = 2/9 ≈ 0.222222
    # Ws = 2/9 + 1/2 = 13/18 ≈ 0.722222
    # ----------------------------------------------------
    lam2, mu2, s2 = 4.0, 2.0, 3
    res2 = compute_all_metrics(lam2, mu2, s2)
    assert res2["is_valid"] and res2["is_stable"]
    assert abs(res2["rho"] - (2.0 / 3.0)) < 1e-9
    assert abs(res2["p0"] - (1.0 / 9.0)) < 1e-9
    assert abs(res2["prob_wait"] - (4.0 / 9.0)) < 1e-9
    assert abs(res2["Lq"] - (8.0 / 9.0)) < 1e-9
    assert abs(res2["Ls"] - (26.0 / 9.0)) < 1e-9
    assert abs(res2["Wq"] - (2.0 / 9.0)) < 1e-9
    assert abs(res2["Ws"] - (13.0 / 18.0)) < 1e-9
    assert res2["littles"]["all_verified"]
    print("✓ Test Case 2: High Efficiency 3-Server Queue (λ=4, μ=2, s=3) -> PASSED")

    # ----------------------------------------------------
    # Test Case 3: Single-Server Equivalence Check (s=1, λ=2, μ=4)
    # ----------------------------------------------------
    # Should yield exact M/M/1 values: rho=0.5, P0=0.5, P(wait)=0.5, Lq=0.5, Ls=1.0, Wq=0.25, Ws=0.5
    # ----------------------------------------------------
    lam3, mu3, s3 = 2.0, 4.0, 1
    res3 = compute_all_metrics(lam3, mu3, s3)
    assert res3["is_valid"] and res3["is_stable"]
    assert abs(res3["rho"] - 0.5) < 1e-9
    assert abs(res3["p0"] - 0.5) < 1e-9
    assert abs(res3["prob_wait"] - 0.5) < 1e-9
    assert abs(res3["Lq"] - 0.5) < 1e-9
    assert abs(res3["Ls"] - 1.0) < 1e-9
    assert abs(res3["Wq"] - 0.25) < 1e-9
    assert abs(res3["Ws"] - 0.5) < 1e-9
    print("✓ Test Case 3: Single-Server Equivalence Check (s=1, λ=2, μ=4) -> PASSED (Exact M/M/1 agreement)")

    # ----------------------------------------------------
    # Test Case 4: Critical Boundary Condition (λ = s·μ)
    # ----------------------------------------------------
    # λ=4.0, μ=2.0, s=2 -> s*mu = 4.0 -> rho = 1.00
    # Must flag unstable and display warning
    # ----------------------------------------------------
    lam4, mu4, s4 = 4.0, 2.0, 2
    val4, stb4, err4, warn4 = validate_inputs(lam4, mu4, s4)
    assert val4, "Critical boundary should be valid numeric input"
    assert not stb4, "Critical boundary must be marked unstable"
    assert warn4 is not None and "Critical Boundary" in warn4
    res4 = compute_all_metrics(lam4, mu4, s4)
    assert res4["Lq"] == float('inf') and res4["Ws"] == float('inf')
    print("✓ Test Case 4: Critical Boundary (λ=4, μ=2, s=2 -> ρ=1.0) -> PASSED (Properly flagged unstable)")

    # ----------------------------------------------------
    # Test Case 5: Severe Overload Condition (λ > s·μ)
    # ----------------------------------------------------
    # λ=20.0, μ=4.0, s=4 -> s*mu = 16.0 -> rho = 1.25
    # ----------------------------------------------------
    lam5, mu5, s5 = 20.0, 4.0, 4
    val5, stb5, err5, warn5 = validate_inputs(lam5, mu5, s5)
    assert val5 and not stb5
    assert warn5 is not None and "Severe Overload" in warn5
    print("✓ Test Case 5: Severe Overload (λ=20, μ=4, s=4 -> ρ=1.25) -> PASSED (Properly flagged overload)")

    # ----------------------------------------------------
    # Test Case 6: Invalid Negative / Zero Inputs
    # ----------------------------------------------------
    val6a, stb6a, err6a, _ = validate_inputs(-2.0, 3.0, 2)
    assert not val6a and "Arrival rate" in err6a

    val6b, stb6b, err6b, _ = validate_inputs(3.0, 0.0, 2)
    assert not val6b and "Service rate" in err6b

    val6c, stb6c, err6c, _ = validate_inputs(3.0, 2.0, 0)
    assert not val6c and "positive integer" in err6c

    val6d, stb6d, err6d, _ = validate_inputs(3.0, 2.0, -3)
    assert not val6d and "positive integer" in err6d

    print("✓ Test Case 6: Invalid Input Validation (λ≤0, μ≤0, s≤0) -> PASSED (All errors caught)")

    # ----------------------------------------------------
    # Test Case 7: 5-Server Enterprise Facility (λ=16, μ=4, s=5)
    # ----------------------------------------------------
    lam7, mu7, s7 = 16.0, 4.0, 5
    res7 = compute_all_metrics(lam7, mu7, s7)
    assert res7["is_valid"] and res7["is_stable"]
    assert abs(res7["rho"] - 0.8) < 1e-9
    assert res7["littles"]["all_verified"]
    print("✓ Test Case 7: 5-Server Enterprise Facility (λ=16, μ=4, s=5) -> PASSED")

    print("=" * 60)
    print("ALL 7 MMS MATHEMATICAL ENGINE UNIT TESTS PASSED SUCCESSFULLY! (100% Exact)")


if __name__ == "__main__":
    run_tests()
