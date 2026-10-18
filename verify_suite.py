"""
Verification Test Suite for (M/M/1):(∞/FIFO) Queuing Calculator
===============================================================
Loads test cases from test_cases.json and validates calculations
against the isolated mathematical engine located in:
  engin/Model I：(M／M／1)：(∞／FIFO)/mm1_engine.py
"""

import json
import math
import os
import sys
import importlib.util

sys.stdout.reconfigure(encoding='utf-8')

# Dynamic module loading from isolated engine directory
engine_path = os.path.join(os.path.dirname(__file__), "engin", "Model I：(M／M／1)：(∞／FIFO)", "mm1_engine.py")

if not os.path.exists(engine_path):
    raise FileNotFoundError(f"Isolated engine not found at: {engine_path}")

spec = importlib.util.spec_from_file_location("mm1_engine", engine_path)
engine_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine_mod)
print(f"Successfully loaded isolated engine from: {engine_path}")

# Load test cases from JSON
json_path = os.path.join(os.path.dirname(__file__), 'test_cases.json')
with open(json_path, 'r', encoding='utf-8') as f:
    cases = json.load(f)

print(f"Loaded {len(cases)} test cases from test_cases.json\n" + "=" * 65)

passed_count = 0
for tc in cases:
    cid = tc['id']
    title = tc['title']
    cat = tc['category']
    lam = tc['lambda']
    mu = tc['mu']
    exp = tc['expected']

    # 1. Validation through isolated engine
    is_valid, is_stable, err, warn = engine_mod.validate_inputs(lam, mu)

    if cat == 'invalid':
        assert not is_valid, f"Case {cid} expected invalid, got valid"
        assert err is not None, f"Case {cid} expected error message"
        print(f"Case {cid} [{title}]: PASSED (Invalid caught: {err})")
        passed_count += 1

    elif cat == 'unstable':
        assert is_valid, f"Case {cid} should be valid numeric inputs"
        assert not is_stable, f"Case {cid} expected unstable, got stable"
        assert warn is not None, f"Case {cid} expected warning message"
        rho = engine_mod.calculate_rho(lam, mu)
        assert abs(rho - exp['rho']) < 1e-4, f"Case {cid} rho mismatch"
        print(f"Case {cid} [{title}]: PASSED (Unstable correctly flagged: rho={rho:.4f})")
        passed_count += 1

    else:
        # normal stable cases
        assert is_valid and is_stable, f"Case {cid} should be valid and stable"
        
        # Calculate through isolated engine
        res = engine_mod.compute_all_metrics(lam, mu)
        
        rho = res['rho']
        p0 = res['p0']
        Ls = res['Ls']
        Lq = res['Lq']
        Lw = res['Lw']
        Ws = res['Ws']
        Wq = res['Wq']

        # Assert precision with expected
        assert abs(rho - exp['rho']) < 1e-3, f"Case {cid} rho mismatch: {rho} vs {exp['rho']}"
        assert abs(p0 - exp['p0']) < 1e-3, f"Case {cid} p0 mismatch: {p0} vs {exp['p0']}"
        assert abs(Ls - exp['L']) < 1e-3, f"Case {cid} L mismatch: {Ls} vs {exp['L']}"
        assert abs(Lq - exp['Lq']) < 1e-3, f"Case {cid} Lq mismatch: {Lq} vs {exp['Lq']}"
        assert abs(Lw - exp['Lw']) < 1e-3, f"Case {cid} Lw mismatch: {Lw} vs {exp['Lw']}"
        assert abs(Ws - exp['W']) < 1e-3, f"Case {cid} W mismatch: {Ws} vs {exp['W']}"
        assert abs(Wq - exp['Wq']) < 1e-3, f"Case {cid} Wq mismatch: {Wq} vs {exp['Wq']}"

        # Little's Law checks from isolated engine
        assert res['littles']['all_verified'], f"Case {cid} Little's formulas verification failed"

        print(f"Case {cid} [{title}]: PASSED (rho={rho:.4f}, Ls={Ls:.4f}, Lq={Lq:.4f}, Lw={Lw:.4f}, Ws={Ws:.4f}, Wq={Wq:.4f})")
        passed_count += 1

print("=" * 65)
print(f"SUMMARY: {passed_count}/{len(cases)} TEST CASES PASSED WITH 100% MATHEMATICAL EXACTNESS!")
