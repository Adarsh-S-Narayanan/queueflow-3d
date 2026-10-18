# QueueFlow 3D: Queuing Theory Platform & Calculators
## Model I: $(M/M/1):(\infty/\text{FIFO})$ & Model II: $(M/M/s):(\infty/\text{FIFO})$

A modern, interactive 3D and multi-server Queuing Theory Platform, Calculator, Simulator, and Analytics Dashboard designed for both the single-server **$(M/M/1):(\infty/\text{FIFO})$** and multi-server **$(M/M/s):(\infty/\text{FIFO})$** queuing models. Built with pure web standards (HTML5, CSS3, JavaScript, Three.js, Chart.js, and KaTeX) and ready to host directly on **GitHub Pages** with zero build configuration.

- **Single-Server Page**: [`index.html`](file:///d:/code/class/maths_assingment1/index.html)
- **Multi-Server Page**: [`mms.html`](file:///d:/code/class/maths_assingment1/mms.html)
- **Dedicated M/M/s User Guide & Documentation**: [`README_MMS.md`](file:///d:/code/class/maths_assingment1/README_MMS.md)
- **Model I Engine**: `Engine/Model I：(M／M／1)：(∞／FIFO)/`
- **Model II Engine**: `Engine/(M／M／s)：(ꝏ／FIFO)/`

---

## 🌟 Key Features

### 1. Complete $(M/M/1):(\infty/\text{FIFO})$ Calculation Suite
- Automatically computes all primary measures:
  - **Utilisation Factor ($\rho = \lambda / \mu$)**
  - **Probability of Empty System ($P_0 = 1 - \rho$)**
  - **Average Customers in System ($L_s = \frac{\lambda}{\mu - \lambda} = \frac{\rho}{1 - \rho}$)**
  - **Average Customers in Queue ($L_q = \frac{\lambda^2}{\mu(\mu - \lambda)} = \frac{\rho^2}{1 - \rho}$)**
  - **Average Customers in Waiting Line ($L_w = \frac{\mu}{\mu - \lambda} = \frac{1}{1 - \rho}$)**
  - **Average Time Spent in System ($W_s = \frac{1}{\mu - \lambda} = \frac{L_s}{\lambda}$)**
  - **Average Waiting Time in Queue ($W_q = \frac{\lambda}{\mu(\mu - \lambda)} = \frac{L_q}{\lambda}$)**
- Dynamic unit conversions (Hours, Minutes, Seconds) with human-readable secondary formatting.
- Real-time **Little's Law Verification Badges** ($L_s = \lambda W_s$, $L_q = \lambda W_q$, $W_s = W_q + \frac{1}{\mu}$, $L_s = L_q + \frac{\lambda}{\mu}$).
- Interactive 3D single-server stage with animated customers, server beacon, and orbit controls.

### 2. Complete $(M/M/s):(\infty/\text{FIFO})$ Multi-Server Calculation Suite
- Automatically computes all multi-server metrics:
  - **Offered Load ($r = \lambda / \mu$ in Erlangs)**
  - **Server Utilisation Factor ($\rho = \frac{\lambda}{s\mu} = \frac{r}{s}$)**
  - **Probability of Empty System ($P_0$)** via finite sum + geometric tail.
  - **Probability of Waiting ($P(\text{wait}) = C(s, r)$ - Erlang's C Formula)**.
  - **Average Number in Queue ($L_q$)** and **Average Number in System ($L_s = L_q + r$)**.
  - **Average Waiting Time in Queue ($W_q = L_q / \lambda$)** and **Average Time in System ($W_s = W_q + 1/\mu$)**.
  - **Average Non-Empty Queue Length ($L_w = \frac{\rho}{1 - \rho}$)**.
- **Dynamic 3D Multi-Server Stage**:
  - Automatically arranges $s$ parallel server counter booths with interactive screens and receptionist clerk avatars.
  - **Floor Line Architecture**: Stanchion arrival line, 9 waiting slot rings, transfer cross-aisle runner ($X = -0.55$), and dedicated green departure corridor ($X = 0.55$) with directional decals leading to the Exit Arch Portal.
  - Dynamic status beacons: **Emerald** (Idle), **Amber** (Busy), **Rose** (Overloaded).
- Parallel Server Booth Status Grid: Real-time cards showing each counter's operational state, cumulative served count, and live service progress bar.

### 3. Isolated Mathematical Engine Architecture
- As required, all mathematical equations, probability distributions, stability checks, and Little's formulas are completely isolated into dedicated folders:
  - `Engine/Model I：(M／M／1)：(∞／FIFO)/`
  - `Engine/(M／M／s)：(ꝏ／FIFO)/`
- Each directory contains:
  - Pure JavaScript Engine (UMD module, browser global, Node.js compatible)
  - Pure Python 3 Engine with typing and mathematical docstrings
  - Self-contained Python unit tests executing all equations
  - Mathematical derivation and API reference README

### 4. Robust Input Validation & Instability Detection
- Validates strictly positive arrival rate ($\lambda > 0$) and service rate ($\mu > 0$).
- Validates integer server count ($s \ge 1$).
- **Critical Boundary Warning ($\lambda = \mu$ for M/M/1, $\lambda = s\mu$ for M/M/s)**: Alerts the user that steady-state equilibrium fails and queue variance diverges to infinity.
- **Severe Overload Warning ($\lambda > \mu$ for M/M/1, $\lambda > s\mu$ for M/M/s)**: Issues immediate warnings explaining continuous backlog accumulation and buffer explosion.

### 5. Automated Batch Verification Suites
- Includes two automated Python verification suites testing against JSON benchmark specifications:
  - `verify_suite.py` testing `test_cases.json` (8/8 M/M/1 cases passing)
  - `verify_mms_suite.py` testing `mms_test_cases.json` (8/8 M/M/s cases passing)
- In-browser interactive test suite runners with "Load & Run", "Run All Test Cases", and CSV download.

---

## 📐 Mathematical Foundations

### Model I: $(M/M/1):(\infty/\text{FIFO})$

Following Kendall's notation $(A / B / c) : (K / D)$:
- $A = M$ (Poisson arrivals at rate $\lambda$), $B = M$ (exponential service at rate $\mu$), $c = 1$ (single server), $K = \infty$ (infinite buffer), $D = \text{FIFO}$.

| Performance Measure | Symbol | Formula | Notes / Relation |
| :--- | :---: | :---: | :---: |
| **Utilisation Factor** | $\rho$ | $\rho = \frac{\lambda}{\mu}$ | Fraction of time server is busy |
| **Probability System is Empty** | $P_0$ | $P_0 = 1 - \rho$ | Server idle probability |
| **Probability of $n$ Customers** | $P_n$ | $P_n = \rho^n(1 - \rho)$ | Geometric state distribution |
| **Average Customers in System** | $L_s$ | $L_s = \frac{\lambda}{\mu - \lambda} = \frac{\rho}{1 - \rho}$ | $L_s = L_q + \rho$ |
| **Average Customers in Queue** | $L_q$ | $L_q = \frac{\lambda^2}{\mu(\mu - \lambda)} = \frac{\rho^2}{1 - \rho}$ | $L_q = L_s - \rho$ |
| **Average in Waiting Line (Non-empty)** | $L_w$ | $L_w = \frac{\mu}{\mu - \lambda} = \frac{1}{1 - \rho}$ | Conditional queue mean |
| **Average Time in System** | $W_s$ | $W_s = \frac{1}{\mu - \lambda} = \frac{L_s}{\lambda}$ | $W_s = W_q + \frac{1}{\mu}$ |
| **Average Waiting Time in Queue** | $W_q$ | $W_q = \frac{\lambda}{\mu(\mu - \lambda)} = \frac{L_q}{\lambda}$ | $W_q = W_s - \frac{1}{\mu}$ |

- **Stability Condition**: $\lambda < \mu$ ($\rho < 1.0$). If $\lambda \ge \mu$, the queue explodes infinitely ($L \to \infty, W \to \infty$).

---

### Model II: $(M/M/s):(\infty/\text{FIFO})$

Following Kendall's notation:
- $c = s$ parallel identical servers fed by a single shared FIFO queue.
- Total processing capacity of the server pool is $s\mu$.

| Performance Measure | Symbol | Formula | Notes / Relation |
| :--- | :---: | :---: | :---: |
| **Offered Load** | $r$ | $r = \frac{\lambda}{\mu}$ | Traffic load in Erlangs |
| **Server Utilisation Factor** | $\rho$ | $\rho = \frac{\lambda}{s\mu} = \frac{r}{s}$ | Mean load per server |
| **Probability System is Empty** | $P_0$ | $P_0 = \left[ \sum_{n=0}^{s-1} \frac{r^n}{n!} + \frac{r^s}{s!(1 - \rho)} \right]^{-1}$ | Normalization condition |
| **Probability of Waiting (Erlang C)** | $P(\text{wait})$ | $C(s, r) = \frac{r^s}{s!(1 - \rho)} P_0$ | PASTA: Probability all $s$ servers busy |
| **Average Customers in Queue** | $L_q$ | $L_q = \frac{P(\text{wait}) \cdot \rho}{1 - \rho} = \frac{r^s \rho}{s!(1 - \rho)^2} P_0$ | Expected waiting backlog |
| **Average Customers in System** | $L_s$ | $L_s = L_q + \frac{\lambda}{\mu} = L_q + r$ | Total customers in facility |
| **Average Waiting Time in Queue** | $W_q$ | $W_q = \frac{L_q}{\lambda} = \frac{P(\text{wait})}{s\mu - \lambda}$ | By Little's Law ($L_q = \lambda W_q$) |
| **Average Time in System** | $W_s$ | $W_s = W_q + \frac{1}{\mu} = \frac{L_s}{\lambda}$ | By Little's Law ($L_s = \lambda W_s$) |
| **Average in Line (Non-empty)** | $L_w$ | $L_w = \frac{L_q}{P(\text{wait})} = \frac{\rho}{1 - \rho}$ | Conditional queue mean |

- **State Distribution ($P_n$)**:
  $$P_n = \begin{cases}
  \frac{r^n}{n!} P_0 & \text{for } 0 \le n \le s \\
  \frac{r^s}{s!} \rho^{n-s} P_0 & \text{for } n > s
  \end{cases}$$
- **Stability Condition**: $\lambda < s\mu$ ($\rho < 1.0$). If $\lambda \ge s\mu$, arrivals outpace or saturate the combined capacity of all $s$ servers, causing infinite backlog accumulation.

---

## 🧪 Comprehensive Test Cases Suite

### 1. Model I: $(M/M/1):(\infty/\text{FIFO})$ Test Cases

| ID | Category | Scenario Description | Inputs | Expected Output | Live Calculated Output | Status |
|:---:|:---:|:---|:---|:---|:---|:---:|
| **1** | Normal | **Light Load**<br>Server comfortably handles arrival stream | $\lambda = 2$<br>$\mu = 4$ | $\rho = 0.50$<br>$P_0 = 0.50$<br>$L_s = 1.00$<br>$L_q = 0.50$<br>$L_w = 2.00$<br>$W_s = 0.50\text{ hr}$ ($30\text{ min}$)<br>$W_q = 0.25\text{ hr}$ ($15\text{ min}$) | $\rho = 0.5000$<br>$P_0 = 0.5000$<br>$L_s = 1.0000$<br>$L_q = 0.5000$<br>$L_w = 2.0000$<br>$W_s = 0.5000$<br>$W_q = 0.2500$ | **PASSED** ✅ |
| **2** | Normal | **Moderate Load**<br>Standard everyday queue operations | $\lambda = 3$<br>$\mu = 5$ | $\rho = 0.60$<br>$P_0 = 0.40$<br>$L_s = 1.50$<br>$L_q = 0.90$<br>$L_w = 2.50$<br>$W_s = 0.50\text{ hr}$ ($30\text{ min}$)<br>$W_q = 0.30\text{ hr}$ ($18\text{ min}$) | $\rho = 0.6000$<br>$P_0 = 0.4000$<br>$L_s = 1.5000$<br>$L_q = 0.9000$<br>$L_w = 2.5000$<br>$W_s = 0.5000$<br>$W_q = 0.3000$ | **PASSED** ✅ |
| **3** | Normal | **High Congestion (Near Peak)**<br>Demonstrates non-linear queue buildup | $\lambda = 8$<br>$\mu = 10$ | $\rho = 0.80$<br>$P_0 = 0.20$<br>$L_s = 4.00$<br>$L_q = 3.20$<br>$L_w = 5.00$<br>$W_s = 0.50\text{ hr}$ ($30\text{ min}$)<br>$W_q = 0.40\text{ hr}$ ($24\text{ min}$) | $\rho = 0.8000$<br>$P_0 = 0.2000$<br>$L_s = 4.0000$<br>$L_q = 3.2000$<br>$L_w = 5.0000$<br>$W_s = 0.5000$<br>$W_q = 0.4000$ | **PASSED** ✅ |
| **4** | Normal | **Fractional / Decimal Rates**<br>Low frequency arrival and service rates | $\lambda = 0.5$<br>$\mu = 1.5$ | $\rho = 0.3333$<br>$P_0 = 0.6667$<br>$L_s = 0.5000$<br>$L_q = 0.1667$<br>$L_w = 1.5000$<br>$W_s = 1.0000\text{ hr}$<br>$W_q = 0.3333\text{ hr}$ | $\rho = 0.3333$<br>$P_0 = 0.6667$<br>$L_s = 0.5000$<br>$L_q = 0.1667$<br>$L_w = 1.5000$<br>$W_s = 1.0000$<br>$W_q = 0.3333$ | **PASSED** ✅ |
| **5** | Unstable | **Critical Boundary ($\lambda = \mu$)**<br>Arrival rate equals service capacity | $\lambda = 5$<br>$\mu = 5$ | $\rho = 1.00$<br>Warning: System unstable ($L \to \infty, W \to \infty$) | System Unstable Warning: $\rho = 1.0000 \ge 1.00$, Steady-state undefined | **PASSED** ✅ |
| **6** | Unstable | **Severe Overload ($\lambda > \mu$)**<br>Permanent bottleneck overflow | $\lambda = 12$<br>$\mu = 8$ | $\rho = 1.50$<br>Warning: Overloaded ($L \to \infty$) | Severe Instability Warning: $\rho = 1.5000 \ge 1.00$, Buffer overflows | **PASSED** ✅ |
| **7** | Invalid | **Negative Arrival Rate**<br>Non-physical arrival frequency | $\lambda = -2$<br>$\mu = 5$ | Validation Error: $\lambda$ must be $> 0$ | Error: Arrival rate must be strictly positive (> 0) | **PASSED** ✅ |
| **8** | Invalid | **Zero Service Rate**<br>Dead service counter / division by zero | $\lambda = 3$<br>$\mu = 0$ | Validation Error: $\mu$ must be $> 0$ | Error: Service rate must be strictly positive (> 0) | **PASSED** ✅ |

---

### 2. Model II: $(M/M/s):(\infty/\text{FIFO})$ Test Cases

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

## 📖 User Guide

### 1. Launching the Platform
- **Single-Server $(M/M/1)$**: Open [`index.html`](file:///d:/code/class/maths_assingment1/index.html) in your browser.
- **Multi-Server $(M/M/s)$**: Open [`mms.html`](file:///d:/code/class/maths_assingment1/mms.html) in your browser.
- Both pages feature a top **Model Switcher** (`(M/M/1)` $\leftrightarrow$ `(M/M/s)`) allowing seamless navigation.
- Or start a local server:
  ```bash
  python -m http.server 8000
  ```
  Then navigate to `http://localhost:8000`.

### 2. Operating the Calculators
1. **Enter Parameters**:
   - For $M/M/1$: Input Arrival Rate ($\lambda$) and Service Rate ($\mu$).
   - For $M/M/s$: Input Arrival Rate ($\lambda$), Service Rate per Server ($\mu$), and Number of Parallel Servers ($s$).
   - You can also click domain presets (e.g. *Bank Teller*, *Airport Security*, *Call Center*).
2. **Select Time Units**:
   - Choose between **Hours**, **Minutes**, or **Seconds**. All rates and time metrics ($W, W_q$) dynamically update.
3. **Inspect Real-Time Performance Measures**:
   - Check $\rho, P_0, P(\text{wait}), L_s, L_q, W_s, W_q, L_w$.
   - Review the **Little's Law Matrix** confirming mathematical conservation.
4. **Interact with the 3D Simulation**:
   - Drag to rotate camera; scroll to zoom; right-click to pan.
   - Switch camera views (**Isometric**, **Top-Down**, **Counter Close-Up**).
   - Use **Play / Pause**, **Reset**, and **Speed Multiplier** ($0.5\times, 1\times, 2\times, 4\times$) buttons.
   - On $M/M/s$: Watch customers arrive through the stanchion line, transfer across the cross-aisle to their assigned counter, receive service, and walk down the green exit corridor out the Exit Arch.
5. **Execute Automated Tests**:
   - Scroll to the Test Cases section.
   - Click **"Run All Test Cases"** to batch-validate all 8 cases against theoretical benchmarks.
   - Click **"Load & Run"** on any row to populate and calculate that specific scenario.
   - Click **"Download CSV"** to export the verification report.
6. **Export Summary Report**:
   - Click **"Copy Report"** in the top navigation bar to copy a formatted academic text report to your clipboard.

---

## 🚀 How to Host on GitHub Pages (Step-by-Step)

This repository is structured to deploy on GitHub Pages without any extra build configuration:

1. **Create a GitHub Repository**:
   - Go to [github.com/new](https://github.com/new).
   - Name the repository (e.g., `queueflow-3d`).
   - Set visibility to **Public** and click **Create repository**.

2. **Push the Project Files**:
   ```bash
   git add .
   git commit -m "Complete M/M/1 and M/M/s 3D Queuing Platform & Calculators"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - In your GitHub repository, click on **Settings** (top navigation tab).
   - In the left sidebar, click on **Pages**.
   - Under **Build and deployment**:
     - **Source**: `Deploy from a branch`
     - **Branch**: select `main`
     - **Folder**: select `/ (root)`
     - Click **Save**.

4. **Access the Live Webpages**:
   Within 30–60 seconds, GitHub Pages will deploy your site:
   - **Single Server ($M/M/1$)**: `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`
   - **Multi Server ($M/M/s$)**: `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/mms.html`

---

## 📂 File & Directory Architecture

```
maths_assingment1/
├── Engine/                                      # Unified Mathematical Engine Directory
│   ├── Model I：(M／M／1)：(∞／FIFO)/             # Folder isolating Model I math equations
│   │   ├── mm1_engine.js                        # Pure JavaScript calculation module (UMD/ES6)
│   │   ├── mm1_engine.py                        # Pure Python 3 mathematical calculation module
│   │   ├── test_engine.py                       # Self-contained Python unit tests
│   │   ├── README.md                            # Mathematical derivation & engine documentation
│   │   └── __init__.py                          # Python package marker
│   └── (M／M／s)：(ꝏ／FIFO)/                     # Folder isolating (M/M/s):(ꝏ/FIFO) equations
│       ├── mms_engine.js                        # Pure JavaScript calculation module (UMD/window.MMsEngine)
│       ├── mms_engine.py                        # Pure Python 3 mathematical calculation module
│       ├── test_mms_engine.py                   # Self-contained Python unit tests
│       ├── README.md                            # Mathematical derivation & Erlang C documentation
│       └── __init__.py                          # Python package marker
├── .github/
│   └── workflows/
│       └── verify.yml                           # GitHub Actions CI verifying both test suites
├── .nojekyll                                    # Prevents Jekyll from ignoring special directories
├── index.html                                   # Single-Server (M/M/1) 3D Calculator & Simulator
├── mms.html                                     # Multi-Server (M/M/s) 3D Calculator & Stage
├── style.css                                    # Modern glassmorphism, responsive styles, 3D HUD & booth grid
├── script.js                                    # UI event handlers, Chart.js & M/M/1 integration
├── mms_script.js                                # UI event handlers, Chart.js & M/M/s integration
├── simulation3d.js                              # Three.js 3D discrete-event queue simulator (M/M/1)
├── mms_simulation3d.js                          # Three.js 3D parallel multi-server queue simulator (M/M/s)
├── test_cases.json                              # Verified M/M/1 test cases
├── mms_test_cases.json                          # Verified M/M/s test cases (normal, boundary, overloaded, invalid)
├── verify_suite.py                              # Python test runner verifying M/M/1 against test_cases.json
├── verify_mms_suite.py                          # Python test runner verifying M/M/s against mms_test_cases.json
├── README.md                                    # Comprehensive platform manual & user guide
└── README_MMS.md                                # Dedicated (M/M/s):(ꝏ/FIFO) multi-server documentation
```

---

## 🛠️ Technologies Used

- **HTML5 & Vanilla JavaScript (ES6+)**: High performance, zero compilation needed.
- **Three.js (r128)**: WebGL 3D rendering of parallel service platforms, articulated humanoid avatars, and dynamic floor runners.
- **Chart.js (v4.4)**: Responsive data visualization for state distributions and multi-server capacity curves.
- **KaTeX (v0.16)**: High-speed LaTeX mathematical typesetting for formulas.
- **Lucide Icons**: Clean, modern iconography.
- **CSS3 Glassmorphism**: Radial backdrop blurs, glowing cyber gradients, and responsive grid layouts.
- **Python 3.11+**: Verification suites and automated CI testing.

---

## 🎓 Academic Submission Details

- **Topic**: Single-Server $(M/M/1):(\infty/\text{FIFO})$ & Multi-Server $(M/M/s):(\infty/\text{FIFO})$ Queuing System Calculators & Simulators
- **Course**: Mathematics / Operations Research / Queuing Theory
- **Status**: 100% Complete & Verified across all test cases (both M/M/1 and M/M/s)
