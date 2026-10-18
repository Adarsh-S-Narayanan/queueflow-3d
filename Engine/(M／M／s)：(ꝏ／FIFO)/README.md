# Model II: (M/M/s) : (ꝏ/FIFO) Queuing Theory Engine

This folder isolates all mathematical equations, probability distributions, stability checks, and performance measure calculations for the multi-server Markovian queuing model with infinite system capacity and FIFO discipline: **(M/M/s) : (ꝏ/FIFO)**.

---

## 📐 Formulas Implemented

### 1. Offered Load (Traffic Load in Erlangs)
$$r = \frac{\lambda}{\mu}$$

### 2. Server Utilisation Factor / Traffic Intensity
$$\rho = \frac{\lambda}{s\mu} = \frac{r}{s}$$

### 3. Stability Condition
The queuing system reaches steady-state equilibrium **if and only if**:
$$\rho = \frac{\lambda}{s\mu} < 1 \iff \lambda < s\mu$$
- If $\lambda = s\mu$ ($\rho = 1.00$): The system is at the critical boundary. Stochastic variations cause the queue backlog to grow infinitely without bound.
- If $\lambda > s\mu$ ($\rho > 1.00$): The system is severely overloaded. Incoming customers arrive faster than the combined server capacity. $L_q \to \infty$ and $W_q \to \infty$.

---

### 4. Probability of Empty System ($P_0$)
$$P_0 = \left[ \sum_{n=0}^{s-1} \frac{r^n}{n!} + \frac{r^s}{s!} \frac{1}{1 - \rho} \right]^{-1} = \left[ \sum_{n=0}^{s-1} \frac{(\lambda/\mu)^n}{n!} + \frac{(\lambda/\mu)^s}{s!} \frac{s\mu}{s\mu - \lambda} \right]^{-1}$$

---

### 5. Probability of an Arriving Customer Having to Wait ($P(\text{wait})$ or Erlang's C Formula)
By PASTA (Poisson Arrivals See Time Averages), an arriving customer has to wait if and only if all $s$ servers are already occupied ($N \ge s$):
$$P(\text{wait}) = P(W_q > 0) = C(s, r) = \sum_{n=s}^{\infty} P_n = \frac{r^s}{s!(1 - \rho)} P_0 = \frac{\left(\frac{\lambda}{\mu}\right)^s}{s!\left(1 - \frac{\lambda}{s\mu}\right)} P_0$$

*(Note: When $s = 1$, $P(\text{wait}) = \frac{\rho}{1-\rho}(1-\rho) = \rho$, identical to $M/M/1$.)*

---

### 6. Average Number of Customers in Queue ($L_q$)
$$L_q = \sum_{n=s}^{\infty} (n - s) P_n = \frac{P(\text{wait}) \cdot \rho}{1 - \rho} = \frac{r^s \rho}{s!(1 - \rho)^2} P_0 = \frac{\lambda \mu \left(\frac{\lambda}{\mu}\right)^s}{(s-1)!(s\mu - \lambda)^2} P_0$$

---

### 7. Average Number of Customers in System ($L_s$ or $L$)
By conservation of customers (queue backlog + expected customers actively receiving service):
$$L_s = L_q + \frac{\lambda}{\mu} = L_q + r$$

---

### 8. Average Waiting Time in Queue ($W_q$)
By Little's Law ($L_q = \lambda W_q$):
$$W_q = \frac{L_q}{\lambda} = \frac{P(\text{wait})}{s\mu - \lambda} = \frac{r^s}{s!(s\mu)(1 - \rho)^2} P_0$$

---

### 9. Average Time Spent in System ($W_s$ or $W$)
By Little's Law ($L_s = \lambda W_s$) and total residence time decomposition ($W_s = W_q + 1/\mu$):
$$W_s = W_q + \frac{1}{\mu} = \frac{L_s}{\lambda}$$

---

### 10. Average Number in Waiting Line when Non-Empty ($L_w$)
$$L_w = E[N - s \mid N > s] = \frac{L_q}{P(\text{wait})} = \frac{\rho}{1 - \rho} = \frac{\lambda}{s\mu - \lambda}$$

---

### 11. Steady-State Distribution ($P_n$)
$$P_n = \begin{cases}
\frac{r^n}{n!} P_0 & \text{for } 0 \le n \le s \\
\frac{r^n}{s! s^{n-s}} P_0 = \frac{r^s}{s!} \rho^{n-s} P_0 & \text{for } n > s
\end{cases}$$

---

### 12. Tail Waiting Time Distribution
$$P(W_q > t) = P(\text{wait}) e^{-(s\mu - \lambda)t} = C(s, r) e^{-s\mu(1-\rho)t}$$

---

### 13. Little's Laws Consistency Checks
1. $L_s = \lambda W_s$
2. $L_q = \lambda W_q$
3. $W_s = W_q + \frac{1}{\mu}$
4. $L_s = L_q + \frac{\lambda}{\mu}$

---

## 📂 Files Included

- `mms_engine.py`: Pure Python 3 engine with typing and full mathematical tests.
- `mms_engine.js`: Pure JavaScript engine with UMD / browser export `window.MMsEngine`.
- `test_mms_engine.py`: Self-contained unit tests covering normal, boundary, overloaded, and invalid cases.
- `__init__.py`: Python package marker.
- `README.md`: This documentation.

---

## 🚀 Quick Usage

### Python
```python
from mms_engine import compute_all_metrics

# Calculate 3-server queue with arrival rate 4.0 and service rate 2.0
result = compute_all_metrics(lam=4.0, mu=2.0, s=3)
print(f"Utilization (rho): {result['rho']:.4f}")       # 0.6667
print(f"Empty prob (P0):   {result['p0']:.4f}")        # 0.1111
print(f"Wait prob (Pwait): {result['prob_wait']:.4f}") # 0.4444
print(f"Queue count (Lq):  {result['Lq']:.4f}")        # 0.8889
print(f"System count (Ls): {result['Ls']:.4f}")        # 2.8889
print(f"Queue wait (Wq):   {result['Wq']:.4f}")        # 0.2222
print(f"System time (Ws):  {result['Ws']:.4f}")        # 0.7222
```

### JavaScript
```javascript
const result = MMsEngine.computeAllMetrics(4.0, 2.0, 3);
console.log(result.rho);      // 0.666667
console.log(result.p0);       // 0.111111
console.log(result.probWait); // 0.444444
console.log(result.Lq);       // 0.888889
console.log(result.Ls);       // 2.888889
console.log(result.Wq);       // 0.222222
console.log(result.Ws);       // 0.722222
```
