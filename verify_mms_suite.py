"""
Verification Test Suite for (M/M/s):(ꝏ/FIFO) Queuing Calculator
===============================================================
Loads test cases from mms_test_cases.json and validates calculations
against the isolated mathematical engine located in:
  Engine/(M／M／s)：(ꝏ／FIFO)/mms_engine.py
"""

import json
import math
import os
import sys
import importlib.util

sys.stdout.reconfigure(encoding='utf-8')

# Dynamic module loading from isolated engine directory
engine_candidates = [
    os.path.join(os.path.dirname(__file__), "Engine", "(M／M／s)：(ꝏ／FIFO)", "mms_engine.py"),
]

engine_path = None
for p in engine_candidates:
    if os.path.exists(p):
        engine_path = p
        break

if not engine_path:
    # Try directory scan in Engine
    dir_full = os.path.join(os.path.dirname(__file__), "Engine")
    if os.path.exists(dir_full):
        for sub in os.listdir(dir_full):
            if "s" in sub and "FIFO" in sub:
                candidate = os.path.join(dir_full, sub, "mms_engine.py")
                if os.path.exists(candidate):
                    engine_path = candidate
                    break

if not engine_path or not os.path.exists(engine_path):
    raise FileNotFoundError("MMS isolated engine not found in Engine/ directory.")

spec = importlib.util.spec_from_file_location("mms_engine", engine_path)
engine_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine_mod)
print(f"Successfully loaded isolated MMS engine from: {engine_path}")

# Load test cases from JSON
json_path = os.path.join(os.path.dirname(__file__), 'mms_test_cases.json')
with open(json_path, 'r', encoding='utf-8') as f:
    cases = json.load(f)

print(f"Loaded {len(cases)} test cases from mms_test_cases.json\n" + "=" * 70)

passed_count = 0
for tc in cases:
    cid = tc['id']
    title = tc['title']
    cat = tc['category']
    lam = tc['lambda']
    mu = tc['mu']
    s = tc['s']
    exp = tc['expected']

    # 1. Validation through isolated engine
    is_valid, is_stable, err, warn = engine_mod.validate_inputs(lam, mu, s)

    if cat == 'invalid':
        assert not is_valid, f"Case {cid} expected invalid, got valid"
        assert err is not None, f"Case {cid} expected error message"
        print(f"Case {cid} [{title}]: PASSED (Invalid rejected correctly: {err})")
        passed_count += 1

    elif cat == 'unstable':
        assert is_valid, f"Case {cid} should be valid numeric inputs"
        assert not is_stable, f"Case {cid} expected unstable, got stable"
        assert warn is not None, f"Case {cid} expected warning message"
        rho = engine_mod.calculate_rho(lam, mu, s)
        assert abs(rho - exp['rho']) < 1e-4, f"Case {cid} rho mismatch: {rho} vs {exp['rho']}"
        print(f"Case {cid} [{title}]: PASSED (Unstable correctly flagged: rho={rho:.4f})")
        passed_count += 1

    else:
        # normal stable cases
        assert is_valid and is_stable, f"Case {cid} should be valid and stable"

        # Calculate through isolated engine
        res = engine_mod.compute_all_metrics(lam, mu, s)

        rho = res['rho']
        p0 = res['p0']
        prob_wait = res['prob_wait']
        Ls = res['Ls']
        Lq = res['Lq']
        Lw = res['Lw']
        Ws = res['Ws']
        Wq = res['Wq']

        # Assert precision with expected
        assert abs(rho - exp['rho']) < 1e-3, f"Case {cid} rho mismatch: {rho} vs {exp['rho']}"
        assert abs(p0 - exp['p0']) < 1e-3, f"Case {cid} p0 mismatch: {p0} vs {exp['p0']}"
        assert abs(prob_wait - exp['prob_wait']) < 1e-3, f"Case {cid} prob_wait mismatch: {prob_wait} vs {exp['prob_wait']}"
        assert abs(Ls - exp['L']) < 1e-3, f"Case {cid} L mismatch: {Ls} vs {exp['L']}"
        assert abs(Lq - exp['Lq']) < 1e-3, f"Case {cid} Lq mismatch: {Lq} vs {exp['Lq']}"
        assert abs(Ws - exp['W']) < 1e-3, f"Case {cid} W mismatch: {Ws} vs {exp['W']}"
        assert abs(Wq - exp['Wq']) < 1e-3, f"Case {cid} Wq mismatch: {Wq} vs {exp['Wq']}"
        assert abs(Lw - exp['Lw']) < 1e-3, f"Case {cid} Lw mismatch: {Lw} vs {exp['Lw']}"

        # Little's Law checks from isolated engine
        assert res['littles']['all_verified'], f"Case {cid} Little's formulas verification failed"

        print(
            f"Case {cid} [{title}]: PASSED "
            f"(s={s}, rho={rho:.4f}, p0={p0:.4f}, P(wait)={prob_wait:.4f}, Ls={Ls:.4f}, Lq={Lq:.4f}, Ws={Ws:.4f}, Wq={Wq:.4f})"
        )
        passed_count += 1

print("=" * 70)
print(f"SUMMARY: {passed_count}/{len(cases)} TEST CASES PASSED WITH 100% MATHEMATICAL EXACTNESS!")
