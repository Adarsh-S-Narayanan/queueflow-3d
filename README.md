# QueueFlow 3D: $(M/M/1):(\infty/\text{FIFO})$ Queuing Theory Platform & Calculator

A modern, clean, interactive 3D Queuing Theory Calculator, Simulator, and Analytics Dashboard designed for the **$(M/M/1):(\infty/\text{FIFO})$** queuing model. Built with pure web standards (HTML5, CSS3, JavaScript, Three.js, Chart.js, and KaTeX) and ready to host directly on **GitHub Pages** with zero build configuration.

Based on the **Linear Algebra & Queuing Theory — Study Notes (Page 6)**.

---

## 🌟 Key Features

1. **Complete $(M/M/1):(\infty/\text{FIFO})$ Calculation Suite**:
   - Automatically computes all primary measures:
     - **Utilisation Factor ($\rho = \lambda / \mu$)**
     - **Probability of Empty System ($P_0 = 1 - \rho$)**
     - **Average Customers in System ($L_s = \frac{\lambda}{\mu - \lambda} = \frac{\rho}{1 - \rho}$)**
     - **Average Customers in Queue ($L_q = \frac{\lambda^2}{\mu(\mu - \lambda)} = \frac{\rho^2}{1 - \rho}$)**
     - **Average Customers in Waiting Line ($L_w = \frac{\mu}{\mu - \lambda} = \frac{1}{1 - \rho}$)**
     - **Average Time Spent in System ($W_s = \frac{1}{\mu - \lambda} = \frac{L_s}{\lambda}$)**
     - **Average Waiting Time in Queue ($W_q = \frac{\lambda}{\mu(\mu - \lambda)} = \frac{L_q}{\lambda}$)**
   - Automatic unit conversion (Hours, Minutes, Seconds) with human-readable secondary formatting (e.g., $0.5\text{ hrs} \to 30.0\text{ mins}$).
   - Real-time **Little's Law Verification Badges** ($L_s = \lambda W_s$, $L_q = \lambda W_q$, $W_s = W_q + \frac{1}{\mu}$, $L_s = L_q + \frac{\lambda}{\mu}$) confirming exact mathematical consistency.

2. **Isolated Mathematical Engine Architecture**:
   - As requested, all mathematical equations, probability distributions, stability checks, and Little's formulas are completely isolated into a dedicated folder:
     `engin/Model I: (M/M/1) : (∞/FIFO)/` (with cross-platform safe aliases `engine/` and Unicode / ASCII paths)
   - Contains:
     - `mm1_engine.js`: Pure mathematical engine (UMD module, browser global `window.MM1Engine`, Node.js / ES module compatible)
     - `mm1_engine.py`: Pure Python 3 mathematical engine with typing and verification methods
     - `test_engine.py`: Standalone unit tests executing all equations from Page 6
     - `README.md`: Formal mathematical derivation and engine API reference

3. **Interactive 2D Topology Illustration & 3D WebGL Simulation**:
   - **System Topology Illustration**: Clean SVG diagram mapping Poisson arrivals ($\lambda$), infinite FIFO buffer ($L_q, W_q$), single server station ($\mu, \rho, P_0$), and departure flow ($L_s, W_s$) with live metric updates.
   - **Interactive 3D Stage (Three.js)**: Realistic 3D visualization of a service counter, arrival gate, departure corridor, and physical FIFO queue lane with animated customer entities.
   - Dynamic 3D server light feedback: **Green** (Idle), **Cyan** (Serving), **Red** (Overloaded / Bottlenecked).
   - Orbit controls (rotate, zoom, pan) with 3 camera perspectives (Isometric, Top-Down, Counter Close-up).
   - Play, Pause, Reset, and Simulation Speed toggles ($0.5\times, 1\times, 2\times, 4\times$).

4. **Study Notes Page 6 Advanced Formulas Panel**:
   - **State Distribution**: $P(n\text{ customers}) = \rho^n(1 - \rho)$ with interactive $n$ stepper.
   - **Queue Thresholds**: $P(N \ge k) = \rho^k$ and $P(N > k) = \rho^{k+1}$ with interactive $k$ stepper.
   - **Waiting Time Exceedance**: $P(T_s > t) = e^{-(\mu - \lambda)t}$ and $P(T_q > t) = \rho e^{-(\mu - \lambda)t}$ with interactive time $t$ input.
   - **Little's Law Matrix**: Live 4-card matrix displaying LHS, RHS, and verified badges.

5. **Robust Input Validation & Instability Detection**:
   - Validates that arrival rate ($\lambda$) and service rate ($\mu$) are strictly positive real numbers ($> 0$).
   - Flags non-numeric, empty, or negative inputs with clear descriptive error messages.
   - Detects the critical stability boundary ($\lambda = \mu$) and severe overload ($\lambda > \mu$), issuing immediate high-visibility warnings explaining why the queue explodes infinitely ($L \to \infty, W \to \infty$) and steady-state equilibrium fails.

6. **Comprehensive Automated Test Suite (8 Test Cases)**:
   - Exceeds the 5 required cases with **8 comprehensive test cases** covering normal light load, moderate load, heavy peak congestion, fractional rates, critical boundary, severe overload, negative arrival rate, and zero service rate.
   - Includes interactive **"Load & Run"** buttons and a **"Run All Test Cases"** batch execution engine.
   - One-click CSV export of test case records.
   - Python CI test runner (`verify_suite.py`) testing against `test_cases.json` with 100% pass rate.

7. **GitHub Pages Ready & Zero-Config Hosting**:
   - Pure client-side static site; requires no Node.js, no bundler, and no backend. Deploy in 30 seconds.
   - Includes `.nojekyll` to ensure GitHub Pages serves raw files and Unicode paths without Jekyll interception.

---

## 📐 Mathematical Foundations

### 1. Model Definition: $(M/M/1):(\infty/\text{FIFO})$
Following Kendall's notation $(A / B / c) : (K / D)$:
- **$A = M$ (Markovian Arrival)**: Inter-arrival times are independent and identically distributed (i.i.d.) exponential random variables with rate $\lambda$. Arrivals follow a Poisson process:
  $$P(k \text{ arrivals in time } t) = \frac{(\lambda t)^k e^{-\lambda t}}{k!}$$
- **$B = M$ (Markovian Service)**: Service durations are i.i.d. exponential random variables with rate $\mu$ (mean service time $= 1/\mu$).
- **$c = 1$ (Single Server)**: Only one service channel operates.
- **$K = \infty$ (Infinite Capacity)**: The queue buffer has infinite waiting capacity; no customer balks or is blocked.
- **$D = \text{FIFO}$ (First-In, First-Out)**: Customers are served strictly in order of their arrival.

### 2. Governing Equations (Linear Algebra & Queuing Theory Notes, Page 6)

| Performance Measure | Symbol | Formula | Notes / Relation |
| :--- | :---: | :---: | :---: |
| **Utilisation Factor** | $\rho$ | $\rho = \frac{\lambda}{\mu}$ | Fraction of time server is busy |
| **Probability System is Empty** | $P_0$ | $P(\text{system empty}) = 1 - \rho$ | Server idle probability |
| **Probability of $n$ Customers** | $P_n$ | $P(n\text{ customers}) = \rho^n(1 - \rho)$ | Geometric state distribution |
| **Average Customers in System** | $L_s$ | $L_s = \frac{\lambda}{\mu - \lambda}$ | $L_s = \frac{\rho}{1 - \rho} = L_q + \rho$ |
| **Average Customers in Queue** | $L_q$ | $L_q = \frac{\lambda^2}{\mu(\mu - \lambda)}$ | $L_q = \frac{\rho^2}{1 - \rho} = L_s - \rho$ |
| **Average Customers in Waiting Line** | $L_w$ | $L_w = \frac{\mu}{\mu - \lambda}$ | Non-empty queue mean: $\frac{1}{1 - \rho}$ |
| **Average Time in System** | $W_s$ | $W_s = \frac{1}{\mu - \lambda}$ | $W_s = \frac{L_s}{\lambda} = W_q + \frac{1}{\mu}$ |
| **Average Waiting Time in Queue** | $W_q$ | $W_q = \frac{\lambda}{\mu(\mu - \lambda)}$ | $W_q = \frac{L_q}{\lambda} = W_s - \frac{1}{\mu}$ |
| **At Least $k$ Customers in System** | $P(N \ge k)$ | $P(N \ge k) = \rho^k$ | Tail queue probability |
| **More Than $k$ Customers in System** | $P(N > k)$ | $P(N > k) = \rho^{k+1}$ | Strict tail threshold |
| **System Time Exceeding $t$** | $P(T_s > t)$ | $P(T_s > t) = e^{-(\mu - \lambda)t}$ | Exponential survival function |
| **Queue Time Exceeding $t$** | $P(T_q > t)$ | $P(T_q > t) = \rho e^{-(\mu - \lambda)t}$ | Wait exceedance probability |

### 3. Little's Formulas
1. $L_s = \lambda W_s$
2. $L_q = \lambda W_q$
3. $W_s = W_q + \frac{1}{\mu}$
4. $L_s = L_q + \frac{\lambda}{\mu} \quad (L_s = L_q + \rho)$

### 4. Stability Condition ($\lambda < \mu$)
For a stationary distribution to exist, the Markov birth-death process must be **positive recurrent**:
$$\sum_{n=0}^{\infty} P_n = 1 \implies P_0 \sum_{n=0}^{\infty} \rho^n = 1$$
The infinite geometric series $\sum_{n=0}^{\infty} \rho^n$ converges if and only if:
$$\rho < 1 \iff \lambda < \mu$$

- **When $\lambda = \mu$ ($\rho = 1$)**: The system is null-recurrent. Variance of queue length grows with time $t$. Steady-state does not exist; average queue size drifts to infinity.
- **When $\lambda > \mu$ ($\rho > 1$)**: The system is transient. Arrivals exceed departures; queue backlog grows deterministically at rate $(\lambda - \mu)$ customers per unit time. $L \to \infty$ and $W \to \infty$.

---

## 🧪 Comprehensive Test Cases Suite

The application includes 8 thoroughly verified test cases (exceeding the required 5). Below is the complete test documentation:

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

## 📖 User Guide

### 1. Launching the Calculator
- **Direct Browser Access**: Simply double-click `index.html` or open it in any modern browser (Chrome, Edge, Firefox, Safari).
- **Local Server (Optional)**:
  ```bash
  python -m http.server 8000
  ```
  Then navigate to `http://localhost:8000`.

### 2. Operating the Calculator
1. **Enter Parameters**:
   - In the **Input Parameters** card, enter values for:
     - **$\lambda$ (Arrival Rate)**: Number of arriving customers per unit time.
     - **$\mu$ (Service Rate)**: Number of customers the server can process per unit time.
   - Alternatively, adjust the fine-tuning sliders or select a preset from the dropdown (e.g. *Bank Teller*, *Web API Server*, *Drive-Thru*).
2. **Select Time Units**:
   - Choose between **Hours**, **Minutes**, or **Seconds**. The calculator dynamically re-labels the rate units and computes time conversions for $W$ and $W_q$.
3. **Inspect Real-Time Results**:
   - The **Performance Measures** grid immediately displays $\rho, P_0, L_s, L_q, L_w, W_s, W_q$.
   - The **Linear Algebra & Queuing Theory Formulas** section displays $P(N = n), P(N \ge k), P(T_s > t), P(T_q > t)$ and the 4-law Little's matrix.
4. **Interact with the 3D Stage**:
   - Drag with your mouse or finger to orbit around the 3D queue.
   - Scroll to zoom; right-click to pan.
   - Toggle camera views using the **Isometric**, **Top-Down**, and **Counter** buttons.
   - Use the **Pause / Resume**, **Reset**, and **Speed Multiplier** buttons to control simulation dynamics.
5. **Explore Charts**:
   - Check the **State Probability Distribution** bar chart to see $P_n$ up to $n=12$.
   - Review the **Congestion Explosion Curve** to visualize why queue sizes spike exponentially near $\rho = 1$.
6. **Execute Automated Tests**:
   - Scroll to the **Comprehensive Test Cases Suite**.
   - Click **"Run All Test Cases"** to execute the batch validator.
   - Click **"Load & Run"** on any individual test row to populate the calculator with that test's parameters and observe the behavior.
7. **Export Results**:
   - Click **"Copy Report"** in the top navigation bar to copy a formatted academic summary to your clipboard.
   - Click **"Download CSV"** in the test suite section to download the test case data.

---

## 🚀 How to Host on GitHub Pages (Step-by-Step)

This repository is structured to deploy on GitHub Pages without any extra build configuration:

1. **Create a GitHub Repository**:
   - Go to [github.com/new](https://github.com/new).
   - Name the repository (e.g., `mm1-queue-calculator`).
   - Set visibility to **Public** and click **Create repository**.

2. **Push the Project Files**:
   Open a terminal in this project folder and run:
   ```bash
   git add .
   git commit -m "Complete (M/M/1):(inf/FIFO) 3D Queue Calculator & Simulator"
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

4. **Access the Live Webpage**:
   Within 30–60 seconds, GitHub Pages will deploy your site at:
   ```
   https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/
   ```

---

## 📂 File & Directory Architecture

```
maths_assingment1/
├── engin/                                       # Isolated Mathematical Engine Directory
│   └── Model I：(M／M／1)：(∞／FIFO)/             # Folder isolating all Model I math equations
│       ├── mm1_engine.js                        # Pure JavaScript calculation module (UMD/ES6)
│       ├── mm1_engine.py                        # Pure Python 3 mathematical calculation module
│       ├── test_engine.py                       # Self-contained Python unit tests
│       └── README.md                            # Mathematical derivation & engine documentation
├── .github/
│   └── workflows/
│       └── verify.yml                           # GitHub Actions CI verifying Python test suite
├── .nojekyll                                    # Prevents Jekyll from ignoring special directories
├── index.html                                   # Semantic HTML5 layout, UI controls & KaTeX math
├── style.css                                    # Modern glassmorphism, responsive styles, 3D HUD
├── script.js                                    # UI event handlers, Chart.js & engine integration
├── simulation3d.js                              # Three.js 3D discrete-event queue simulator
├── test_cases.json                              # Structured verified test cases (normal, unstable, invalid)
├── verify_suite.py                              # Python test runner loading from isolated engine
└── README.md                                    # Comprehensive submission manual & user guide
```

---

## 🛠️ Technologies Used

- **HTML5 & Vanilla JavaScript (ES6+)**: High performance, zero compilation needed.
- **Three.js (r128)**: WebGL 3D rendering of the queue platform, server kiosk, and moving customer entities.
- **Chart.js (v4.4)**: Responsive data visualization for state distributions and sensitivity curves.
- **KaTeX (v0.16)**: High-speed LaTeX mathematical typesetting for formulas.
- **Lucide Icons**: Clean, modern iconography.
- **CSS3 Glassmorphism**: Radial backdrop blurs, glowing cyber gradients, and responsive grid layouts.
- **Python 3.11+**: Verification suite and automated CI testing.

---

## 🎓 Academic Submission Details

- **Topic**: $(M/M/1):(\infty/\text{FIFO})$ Queuing System Calculator & Simulator
- **Course**: Mathematics / Operations Research / Queuing Theory
- **Assignment**: Computer Assignment 1 - Single-Server Queuing Model
- **Status**: 100% Complete & Verified
