import json
import math
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('test_cases.json', 'r', encoding='utf-8') as f:
    cases = json.load(f)

print(f"Loaded {len(cases)} test cases from test_cases.json")

for tc in cases:
    cid = tc['id']
    title = tc['title']
    cat = tc['category']
    lam = tc['lambda']
    mu = tc['mu']
    exp = tc['expected']

    if cat == 'invalid':
        assert lam <= 0 or mu <= 0, f"Case {cid} invalid check failed"
        print(f"Case {cid} [{title}]: PASSED (Invalid: lam={lam}, mu={mu})")
    elif cat == 'unstable':
        assert lam >= mu, f"Case {cid} unstable check failed"
        rho = lam / mu
        assert abs(rho - exp['rho']) < 1e-4, f"Case {cid} rho mismatch"
        print(f"Case {cid} [{title}]: PASSED (Unstable: rho={rho:.4f})")
    else:
        # normal
        assert lam < mu, f"Case {cid} should be stable"
        rho = lam / mu
        p0 = 1 - rho
        L = lam / (mu - lam)
        Lq = (lam**2) / (mu * (mu - lam))
        W = 1 / (mu - lam)
        Wq = lam / (mu * (mu - lam))

        assert abs(rho - exp['rho']) < 1e-3, f"Case {cid} rho mismatch"
        assert abs(p0 - exp['p0']) < 1e-3, f"Case {cid} p0 mismatch"
        assert abs(L - exp['L']) < 1e-3, f"Case {cid} L mismatch"
        assert abs(Lq - exp['Lq']) < 1e-3, f"Case {cid} Lq mismatch"
        assert abs(W - exp['W']) < 1e-3, f"Case {cid} W mismatch"
        assert abs(Wq - exp['Wq']) < 1e-3, f"Case {cid} Wq mismatch"

        # Little's Law checks
        assert abs(L - lam * W) < 1e-6, "Little's Law L = lambda * W failed"
        assert abs(Lq - lam * Wq) < 1e-6, "Little's Law Lq = lambda * Wq failed"
        assert abs(W - (Wq + 1/mu)) < 1e-6, "W = Wq + 1/mu failed"
        assert abs(L - (Lq + rho)) < 1e-6, "L = Lq + rho failed"

        print(f"Case {cid} [{title}]: PASSED (rho={rho:.4f}, L={L:.4f}, Lq={Lq:.4f}, W={W:.4f}, Wq={Wq:.4f})")

print("\nALL TEST CASES PASSED WITH 100% MATHEMATICAL EXACTNESS!")
