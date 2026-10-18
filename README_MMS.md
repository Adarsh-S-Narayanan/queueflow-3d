# QueueFlow 3D: $(M/M/s):(\infty/\text{FIFO})$ Multi-Server Queuing Calculator & Simulator

## Comprehensive User Guide, Mathematical Derivations & Test Report

A modern, interactive 3D and multi-server Queuing Theory Calculator, Discrete-Event Simulator, and Analytics Dashboard designed specifically for the **$(M/M/s):(\infty/\text{FIFO})$** queuing model. Built with pure web standards (HTML5, CSS3, JavaScript, Three.js, Chart.js, and KaTeX) with zero build steps, fully deployable on **GitHub Pages**.

- **Multi-Server Application**: [`mms.html`](file:///d:/code/class/maths_assingment1/mms.html)
- **Single-Server Application**: [`index.html`](file:///d:/code/class/maths_assingment1/index.html)
- **Isolated Mathematical Engine**: `Engine/(M／M／s)：(ꝏ／FIFO)/`
  - JavaScript Module: `Engine/(M／M／s)：(ꝏ／FIFO)/mms_engine.js`
  - Python 3 Module: `Engine/(M／M／s)：(ꝏ／FIFO)/mms_engine.py`
  - Standalone Unit Tests: `Engine/(M／M／s)：(ꝏ／FIFO)/test_mms_engine.py`

---

## 🌟 Key Features of the M/M/s System

1. **Complete Analytical Calculation Suite**:
   - Computes all primary measures of performance:
     - **Offered Load / Traffic Load ($r = \lambda / \mu$ in Erlangs)**
     - **Server Utilisation Factor ($\rho = \frac{\lambda}{s\mu} = \frac{r}{s}$)**
     - **Probability of an Empty System ($P_0$)** via finite sum and geometric series sum.
     - **Probability of Arriving Customer Having to Wait ($P(\text{wait}) = C(s, r)$ - Erlang's C Formula)**.
     - **Average Number of Customers in Queue ($L_q$)**.
     - **Average Number of Customers in System ($L_s$ or $L$)**.
     - **Average Waiting Time in Queue ($W_q$)**.
     - **Average Time Spent in System ($W_s$ or $W$)**.
     - **Average Number in Waiting Line when Non-Empty ($L_w$)**.

2. **Automated Input Validation & Instability Protection**:
   - Rejects non-positive arrival rates ($\lambda \le 0$) and service rates ($\mu \le 0$).
   - Validates that server count $s$ is an integer with $s \ge 1$.
   - **Critical Boundary Warning ($\lambda = s\mu, \rho = 1.00$)**: Warns that steady-state equilibrium fails and queue variance diverges to infinity.
   - **Severe Overload Warning ($\lambda > s\mu, \rho > 1.00$)**: Explicitly notifies the user of buffer overflow and infinite queue buildup.

3. **Interactive 3D WebGL Multi-Server Stage (Three.js)**:
   - Realistic 3D rendering of $s$ parallel service counter booths with desk computers, oak trim, and animated humanoid clerk avatars.
   - **Dynamic Floor Corridor Architecture**:
     - Central FIFO arrival runner flanked by stainless steel stanchions and blue velvet belts.
     - Circular waiting slot rings ($r = 0.44\text{m}$) for positions 1 through 9.
     - Blue directional arrows guiding customers from entrance arch to dispatch junction.
     - Distribution cross-aisle runner along $X = -0.55$ connecting to each parallel booth.
     - Dedicated, non-intersecting green Exit Corridor along $X = 0.55$ with directional decals leading departing customers through the Exit Arch Portal.
   - 3D status beacons: **Emerald** (Idle), **Amber** (Busy serving), **Rose** (Overloaded).
   - Real-time HUD displaying Active Queue Count, Total in System, Busy Servers ($k/s$), and Completed Customer Count.
   - 3 Camera Perspectives: **Isometric**, **Top-Down Overview**, and **Counter Close-Up**.
   - Simulation controls: Play/Pause, Reset, and Time Accelerator ($0.5\times, 1\times, 2\times, 4\times$).

4. **Multi-Server State & Traffic Analytics (Chart.js)**:
   - **Stationary State Distribution ($P_n$)**: Bar chart showing probabilities from $n = 0$ to $n = s + 10$, color-coded by idle, busy, and waiting regimes.
   - **Server Capacity Scaling Curve**: Interactive sensitivity curve demonstrating how adding extra servers rapidly collapses queue wait times.

5. **Little's Law Mathematical Consistency Matrix**:
   - Real-time 4-card verification matrix proving:
     1. $L_s = \lambda W_s$
     2. $L_q = \lambda W_q$
     3. $W_s = W_q + \frac{1}{\mu}$
     4. $L_s = L_q + \frac{\lambda}{\mu}$
   - Displays exact Left-Hand Side (LHS), Right-Hand Side (RHS), and "Verified" green badges.

6. **Interactive Test Cases Suite & Batch Validator**:
   - Pre-loaded with 8 comprehensive test cases (exceeding the required 5).
   - "Load & Run" one-click button per test.
   - "Run All Test Cases" batch verification runner.
   - One-click CSV export of test execution records.

---

## 📐 Mathematical Foundations: $(M/M/s):(\infty/\text{FIFO})$

Following Kendall's notation $(A / B / c) : (K / D)$:
- **$A = M$ (Markovian / Poisson Arrivals)**: Inter-arrival times are independent and exponentially distributed with parameter $\lambda$.
- **$B = M$ (Markovian / Exponential Service Times)**: Service times at each server are independent and exponentially distributed with rate $\mu$ (mean service time $= 1/\mu$).
- **$c = s$ (Multiple Parallel Servers)**: The system possesses $s$ identical, independent servers arranged in parallel fed by a single shared FIFO queue.
- **$K = \infty$ (Infinite Waiting Capacity)**: There is no upper limit on the waiting buffer; no customer is turned away.
- **$D = \text{FIFO}$ (First-In, First-Out)**: Waiting customers are dispatched to the first available idle server in order of arrival.

### 1. State Transition Rates (Birth-Death Process)
The system is modeled as a continuous-time Markov birth-death process with state $n \in \{0, 1, 2, \dots\}$ representing the total number of customers in the system (waiting + being served):

- **Birth Rates ($\lambda_n$)**: Constant for all states:
  $$\lambda_n = \lambda \quad \forall n \ge 0$$
- **Death Rates ($\mu_n$)**: Dependent on how many servers are currently active:
  $$\mu_n = \begin{cases} n\mu & \text{for } 0 \le n \le s \\ s\mu & \text{for } n \ge s \end{cases}$$

### 2. Offered Load and Traffic Intensity
- **Offered Load ($r$)**: Expected arrivals per mean service duration (measured in Erlangs):
  $$r = \frac{\lambda}{\mu}$$
- **Server Utilisation Factor / Traffic Intensity ($\rho$)**: Average load per individual server:
  $$\rho = \frac{\lambda}{s\mu} = \frac{r}{s}$$

### 3. Stability Condition
The queuing system reaches stationary steady-state equilibrium **if and only if**:
$$\rho = \frac{\lambda}{s\mu} < 1 \iff \lambda < s\mu$$
- **If $\lambda = s\mu$ ($\rho = 1.00$)**: The Markov chain is null-recurrent. Variance of queue length grows with time $t$; steady-state limits do not exist ($L \to \infty$).
- **If $\lambda > s\mu$ ($\rho > 1.00$)**: The system is transient. Arrivals exceed maximum facility processing capability; backlog grows deterministically at rate $(\lambda - s\mu)$ customers per unit time.

### 4. Probability of Empty System ($P_0$)
By setting $\sum_{n=0}^{\infty} P_n = 1$:
$$P_0 = \left[ \sum_{n=0}^{s-1} \frac{r^n}{n!} + \frac{r^s}{s!} \left( \frac{1}{1 - \rho} \right) \right]^{-1} = \left[ \sum_{n=0}^{s-1} \frac{\left(\frac{\lambda}{\mu}\right)^n}{n!} + \frac{\left(\frac{\lambda}{\mu}\right)^s}{s!} \left( \frac{s\mu}{s\mu - \lambda} \right) \right]^{-1}$$

### 5. Probability of Waiting / Erlang's C Formula ($P(\text{wait})$)
By the PASTA property (Poisson Arrivals See Time Averages), an arriving customer finds all $s$ servers busy if and only if the system state is $n \ge s$:
$$P(\text{wait}) = P(W_q > 0) = C(s, r) = \sum_{n=s}^{\infty} P_n = \frac{r^s}{s!(1 - \rho)} P_0 = \frac{\left(\frac{\lambda}{\mu}\right)^s}{s!\left(1 - \frac{\lambda}{s\mu}\right)} P_0$$

*(Note: When $s = 1$, $P(\text{wait}) = \frac{\rho}{1 - \rho} (1 - \rho) = \rho$, perfectly matching the single-server M/M/1 result).*

### 6. Expected Number of Customers in Queue ($L_q$)
$$L_q = \sum_{n=s}^{\infty} (n - s) P_n = \frac{P(\text{wait}) \cdot \rho}{1 - \rho} = \frac{r^s \rho}{s!(1 - \rho)^2} P_0 = \frac{\lambda \mu \left(\frac{\lambda}{\mu}\right)^s}{(s-1)!(s\mu - \lambda)^2} P_0$$

### 7. Expected Number of Customers in System ($L_s$ or $L$)
By adding the expected number of customers in service ($r = \lambda/\mu$) to the queue length:
$$L_s = L_q + \frac{\lambda}{\mu} = L_q + r$$

### 8. Expected Waiting Time in Queue ($W_q$)
By Little's Law ($L_q = \lambda W_q$):
$$W_q = \frac{L_q}{\lambda} = \frac{P(\text{wait})}{s\mu - \lambda}$$

### 9. Expected Time Spent in System ($W_s$ or $W$)
By Little's Law ($L_s = \lambda W_s$) and residence time decomposition ($W_s = W_q + 1/\mu$):
$$W_s = W_q + \frac{1}{\mu} = \frac{L_s}{\lambda}$$

### 10. Average Queue Size when Non-Empty ($L_w$)
$$L_w = E[N - s \mid N > s] = \frac{L_q}{P(\text{wait})} = \frac{\rho}{1 - \rho} = \frac{\lambda}{s\mu - \lambda}$$

### 11. State Probability Distribution ($P_n$)
$$P_n = \begin{cases}
\frac{r^n}{n!} P_0 = \frac{(\lambda/\mu)^n}{n!} P_0 & \text{for } 0 \le n \le s \\
\frac{r^n}{s! s^{n-s}} P_0 = \frac{r^s}{s!} \rho^{n-s} P_0 & \text{for } n > s
\end{cases}$$

---

## 🧪 Comprehensive Test Cases Suite (8 Verified Cases)

The calculator includes 8 thoroughly verified test cases covering normal operation, boundary convergence, heavy enterprise load, boundary instability, severe overload, and input validation:

| ID | Category | Scenario Description | Inputs | Expected Analytical Values | Obtained Live Output | Status |
|:---:|:---:|:---|:---|:---|:---|:---:|
| **1** | Normal | **Standard Balanced 2-Server Queue**<br>$s=2$ counters handling moderate flow | $\lambda = 3.0$<br>$\mu = 2.0$<br>$s = 2$ | $\rho = 0.7500$<br>$P_0 = 0.1429$<br>$P(\text{wait}) = 0.6429$<br>$L_q = 1.9286$<br>$L_s = 3.4286$<br>$W_q = 0.6429\text{ hr}$ ($38.6\text{ min}$)<br>$W_s = 1.1429\text{ hr}$ ($68.6\text{ min}$)<br>$L_w = 3.0000$ | $\rho = 0.7500$<br>$P_0 = 0.1429$<br>$P(\text{wait}) = 0.6429$<br>$L_q = 1.9286$<br>$L_s = 3.4286$<br>$W_q = 0.6429$<br>$W_s = 1.1429$<br>$L_w = 3.0000$ | **PASSED** ✅ |
| **2** | Normal | **High-Efficiency 3-Server Center**<br>$s=3$ servers at 66.7% load | $\lambda = 4.0$<br>$\mu = 2.0$<br>$s = 3$ | $\rho = 0.6667$<br>$P_0 = 0.1111$<br>$P(\text{wait}) = 0.4444$<br>$L_q = 0.8889$<br>$L_s = 2.8889$<br>$W_q = 0.2222\text{ hr}$ ($13.3\text{ min}$)<br>$W_s = 0.7222\text{ hr}$ ($43.3\text{ min}$)<br>$L_w = 2.0000$ | $\rho = 0.6667$<br>$P_0 = 0.1111$<br>$P(\text{wait}) = 0.4444$<br>$L_q = 0.8889$<br>$L_s = 2.8889$<br>$W_q = 0.2222$<br>$W_s = 0.7222$<br>$L_w = 2.0000$ | **PASSED** ✅ |
| **3** | Normal | **Single-Server Equivalence ($s=1$)**<br>Reduces precisely to $M/M/1$ | $\lambda = 2.0$<br>$\mu = 4.0$<br>$s = 1$ | $\rho = 0.5000$<br>$P_0 = 0.5000$<br>$P(\text{wait}) = 0.5000$<br>$L_q = 0.5000$<br>$L_s = 1.0000$<br>$W_q = 0.2500\text{ hr}$ ($15.0\text{ min}$)<br>$W_s = 0.5000\text{ hr}$ ($30.0\text{ min}$)<br>$L_w = 1.0000$ | $\rho = 0.5000$<br>$P_0 = 0.5000$<br>$P(\text{wait}) = 0.5000$<br>$L_q = 0.5000$<br>$L_s = 1.0000$<br>$W_q = 0.2500$<br>$W_s = 0.5000$<br>$L_w = 1.0000$ | **PASSED** ✅ |
| **4** | Normal | **5-Server Enterprise Pool**<br>Large parallel pool under heavy traffic | $\lambda = 16.0$<br>$\mu = 4.0$<br>$s = 5$ | $\rho = 0.8000$<br>$P_0 = 0.0130$<br>$P(\text{wait}) = 0.5541$<br>$L_q = 2.2165$<br>$L_s = 6.2165$<br>$W_q = 0.1385\text{ hr}$ ($8.3\text{ min}$)<br>$W_s = 0.3885\text{ hr}$ ($23.3\text{ min}$)<br>$L_w = 4.0000$ | $\rho = 0.8000$<br>$P_0 = 0.0130$<br>$P(\text{wait}) = 0.5541$<br>$L_q = 2.2165$<br>$L_s = 6.2165$<br>$W_q = 0.1385$<br>$W_s = 0.3885$<br>$L_w = 4.0000$ | **PASSED** ✅ |
| **5** | Unstable | **Critical Boundary ($\lambda = s\mu$)**<br>Arrival rate equals total capacity | $\lambda = 4.0$<br>$\mu = 2.0$<br>$s = 2$ | $\rho = 1.0000$<br>Warning: System unstable ($L_q \to \infty$) | System Unstable: $\rho = 1.0000 \ge 1.00$, Critical boundary detected | **PASSED** ✅ |
| **6** | Unstable | **Severe Overload Surge ($\lambda > s\mu$)**<br>Demand exceeds pool capacity ($20 > 16$) | $\lambda = 20.0$<br>$\mu = 4.0$<br>$s = 4$ | $\rho = 1.2500$<br>Warning: Overloaded ($L_q \to \infty$) | Severe Overload Warning: $\rho = 1.2500 \ge 1.00$, Backlog explodes infinitely | **PASSED** ✅ |
| **7** | Invalid | **Negative Arrival Rate**<br>Non-physical negative frequency | $\lambda = -2.0$<br>$\mu = 3.0$<br>$s = 2$ | Validation Error: $\lambda$ must be $> 0$ | Error: Arrival rate ($\lambda$) must be strictly greater than zero (> 0). | **PASSED** ✅ |
| **8** | Invalid | **Invalid Server Count ($s = 0$)**<br>Zero operational service counters | $\lambda = 4.0$<br>$\mu = 2.0$<br>$s = 0$ | Validation Error: $s$ must be $\ge 1$ | Error: Number of servers ($s$) must be a positive integer ($s \ge 1$). | **PASSED** ✅ |

---

## 📖 Step-by-Step User Guide

### 1. Opening the Calculator
- **Browser**: Open [`mms.html`](file:///d:/code/class/maths_assingment1/mms.html) directly in any modern browser (Chrome, Edge, Firefox, Safari).
- **Local HTTP Server**:
  ```bash
  python -m http.server 8000
  ```
  Open `http://localhost:8000/mms.html`.

### 2. Setting Parameters
1. **Arrival Rate ($\lambda$)**: Enter average customer arrival rate per time unit ($> 0$).
2. **Service Rate per Server ($\mu$)**: Enter average processing capacity per server per time unit ($> 0$).
3. **Number of Parallel Servers ($s$)**: Enter positive integer ($1 \le s \le 20$).
4. **Domain Presets**: Click any preset button to quickly populate realistic enterprise figures:
   - *Bank Branch*: $\lambda = 3.0, \mu = 2.0, s = 2$
   - *Airport Security*: $\lambda = 4.0, \mu = 2.0, s = 3$
   - *Customer Service Center*: $\lambda = 16.0, \mu = 4.0, s = 5$
   - *Single Server Equivalence*: $\lambda = 2.0, \mu = 4.0, s = 1$
5. **Time Unit Selection**: Choose **Hours**, **Minutes**, or **Seconds** to dynamically adjust rates and secondary time displays.

### 3. Operating the 3D Simulation
- **Mouse Controls**:
  - Left click + drag: Rotate camera orbit.
  - Scroll wheel: Zoom in / out.
  - Right click + drag: Pan across stage.
- **Camera Views**: Click **Isometric**, **Top-Down**, or **Counter** to immediately transition to optimal perspectives.
- **Playback Controls**:
  - **Play / Pause**: Start or freeze the discrete-event clock.
  - **Reset**: Re-initialize the simulation to $t = 0$.
  - **Speed**: Select $0.5\times, 1\times, 2\times,$ or $4\times$ to accelerate Poisson arrivals and exponential service events.
- **HUD Monitor**: Track real-time counts for Queue Backlog, Total in System, Busy Counter ratio ($k/s$), and Completed Customers.

### 4. Reading Analytics & Matrices
- **Metrics Cards**: Review computed values for $\rho, P_0, P(\text{wait}), L_q, L_s, W_q, W_s, L_w$.
- **Little's Law Matrix**: Inspect LHS vs RHS values and verified badges.
- **State Distribution Chart**: Check probability $P_n$ of having $n$ customers in the facility.
- **Server Capacity Curve**: Observe how adding servers reduces waiting times.

### 5. Running Automated Tests
- In the **Test Cases Suite** section, click **"Run All Test Cases"** to execute the built-in validator.
- Click **"Load & Run"** on any row to test specific parameter sets.
- Click **"Download CSV"** to export a formal test results spreadsheet.

---

## 🚀 How to Host on GitHub Pages

1. **Repository Setup**:
   Create a new public repository on GitHub (e.g. `queueflow-3d`).
2. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: complete M/M/s 3D queue calculator and simulator"
   git branch -M main
   git remote add origin https://github.com/<USERNAME>/<REPO>.git
   git push -u origin main
   ```
3. **Configure GitHub Pages**:
   - Navigate to **Settings** $\to$ **Pages**.
   - Under **Build and deployment**:
     - Source: `Deploy from a branch`
     - Branch: `main`
     - Folder: `/ (root)`
     - Click **Save**.
4. **Access the Application**:
   - Single Server: `https://<USERNAME>.github.io/<REPO>/`
   - Multi-Server: `https://<USERNAME>.github.io/<REPO>/mms.html`

---

## 💻 Python & JavaScript Engine Verification

To run the automated verification suites locally:

```bash
# Verify Model I (M/M/1) suite (8/8 test cases)
python verify_suite.py

# Verify Model II (M/M/s) suite (8/8 test cases)
python verify_mms_suite.py

# Standalone unit tests inside the Engine folder
python "Engine/(M／M／s)：(ꝏ／FIFO)/test_mms_engine.py"
```

All 8 test cases pass with **100% mathematical accuracy** adhering to Erlang C and Little's Law equations.
