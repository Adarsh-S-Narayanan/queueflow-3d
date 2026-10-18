# Model I: (M/M/1) : (∞/FIFO) Queuing Theory Engine

This folder isolates all mathematical equations, probability distributions, stability checks, and performance measure calculations for the single-server Markovian queuing model with infinite system capacity and FIFO discipline.

Based on: **Linear Algebra & Queuing Theory — Study Notes (Page 6)**.

---

## 📐 Formulas Implemented

1. **Traffic Intensity / Server Utilisation**:
   $$\rho = \frac{\lambda}{\mu}$$

2. **Probability of System Empty ($P_0$)**:
   $$P(\text{system empty}) = P_0 = 1 - \rho$$

3. **Probability of $n$ Customers in System ($P_n$)**:
   $$P(n\text{ customers}) = P_n = \rho^n(1 - \rho)$$

4. **Average Number of Customers in System ($L_s$ or $L$)**:
   $$L_s = \frac{\lambda}{\mu - \lambda} = \frac{\rho}{1 - \rho}$$

5. **Average Number of Customers in Queue ($L_q$)**:
   $$L_q = \frac{\lambda^2}{\mu(\mu - \lambda)} = \frac{\rho^2}{1 - \rho}$$

6. **Average Number of Customers in Waiting Line ($L_w$)**:
   $$L_w = \frac{\mu}{\mu - \lambda} = \frac{1}{1 - \rho}$$

7. **Average Time Spent in System ($W_s$ or $W$)**:
   $$W_s = \frac{1}{\mu - \lambda} = \frac{L_s}{\lambda} = W_q + \frac{1}{\mu}$$

8. **Average Waiting Time in Queue ($W_q$)**:
   $$W_q = \frac{\lambda}{\mu(\mu - \lambda)} = \frac{L_q}{\lambda} = W_s - \frac{1}{\mu}$$

9. **Tail Distribution of Queue Length**:
   $$P(N \ge k) = \rho^k$$
   $$P(N > k) = \rho^{k+1}$$

10. **Waiting Time Distributions**:
    $$P(T_s > t) = e^{-(\mu - \lambda)t}$$
    $$P(T_q > t) = \rho \, e^{-(\mu - \lambda)t}$$

11. **Little's Formulas (Consistency Checks)**:
    - $L_s = \lambda W_s$
    - $L_q = \lambda W_q$
    - $W_s = W_q + \frac{1}{\mu}$
    - $L_s = L_q + \frac{\lambda}{\mu}$

---

## 📂 Files Included

- `mm1_engine.js`: Pure JavaScript engine with UMD / browser export `window.MM1Engine`.
- `mm1_engine.py`: Pure Python 3 engine with typing and full mathematical tests.
- `test_engine.py`: Self-contained unit tests covering all functions and edge cases.
- `README.md`: This documentation.

---

## 🚀 Usage

### JavaScript
```javascript
// Compute all metrics
const result = MM1Engine.computeAllMetrics(2.0, 4.0, { k: 3, t: 0.5, n: 2 });
console.log(result.rho); // 0.5
console.log(result.Ls);  // 1.0
console.log(result.Lq);  // 0.5
console.log(result.Ws);  // 0.5
console.log(result.Wq);  // 0.25
```

### Python
```python
from mm1_engine import compute_all_metrics

res = compute_all_metrics(lam=2.0, mu=4.0, k=3, t=0.5, n=2)
print(res["rho"])  # 0.5
print(res["Ls"])   # 1.0
print(res["Lq"])   # 0.5
```
