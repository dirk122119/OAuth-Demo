# Product Plan: OAuth 2.1 Interactive Playground ("The OAuth Bible")

## 1. Vision & Real Job
**The Real Job:** Transform abstract security protocols (OAuth 2.1 PKCE) into a tangible, interactive laboratory. Developers shouldn't just read about PKCE; they should touch it, break it, and watch how the defense mechanisms work in real-time.

## 2. Selected Mode: SCOPE EXPANSION (Dream Big)
We are building a comprehensive, visually rich educational tool that not only covers PKCE but contrasts it with legacy flows to highlight *why* PKCE is the modern standard.

**Completeness:** 10/10
**Effort Breakdown:** (Human: ~1 / AI: ~9)

## 3. Core Features (The "Dream Big" Scope)

### A. The PKCE Core Engine (Interactive State Inspector)
*   **Live Cryptography:** Real-time visual generation of a high-entropy `code_verifier`.
*   **Hashing Animation:** Visualizing the SHA-256 hashing and Base64URLEncoding process that turns the verifier into the `code_challenge`.
*   **State Tracking:** A persistent sidebar showing current browser state, URL parameters, and intercepted tokens.

### B. Synced Sequence Diagram
*   An interactive Mermaid.js or SVG sequence diagram.
*   As the user clicks through the flow (e.g., "Redirect to Auth Server", "User Consents", "Exchange Code"), the corresponding arrow in the diagram highlights.

### C. Attacker POV (Vulnerability Simulation)
*   A "Toggle Attacker Mode" switch.
*   Simulates a malicious app intercepting the `authorization_code` via a hijacked redirect URI or OS-level app link.
*   Visually demonstrates the Auth Server rejecting the attacker's token request because they cannot produce the original `code_verifier`.

### D. Multi-Flow Comparison
*   Tabs to switch between:
    *   **Authorization Code with PKCE (OAuth 2.1 Standard)**
    *   *Implicit Flow (Legacy/Deprecated - shows vulnerability)*
    *   *Client Credentials (Machine-to-Machine)*

### E. Network Topology Visualization
*   Animated packet flow between three distinct nodes: **Client (Browser/App)**, **Authorization Server**, and **Resource Server**.

### F. CLI Authentication Flow Visualization
*   **Localhost Loopback Animation:** Visualizing how a CLI starts a local temporary server to receive the `authorization_code` from the browser.
*   **Device Flow (RFC 8628) with Terminal QR Code:** 
    *   A dedicated mode for "Headless" environments (e.g., SSH).
    *   **Visual Simulation:** Rendering a "Terminal QR Code" using Unicode blocks within the UI.
    *   **One-Scan Authorization:** Showing how scanning the QR code embeds the `user_code` for a frictionless login.
*   **Public Client Security:** Explicitly showing how PKCE protects the CLI since it cannot securely store a `client_secret`.

## 4. Technical Stack
*   **Frontend Framework:** Next.js.
*   **Styling:** TailwindCSS.
*   **Animations:** Web Animations API or simple CSS transitions for packet flows and state changes.
*   **Diagrams:** Custom SVG or Mermaid.js for sequence tracking.

## 5. Success Criteria
*   A user can successfully complete a PKCE flow, a CLI loopback flow, and an Attacker simulation without reading external documentation.
*   The UI feels modern, responsive, and highly polished ("10-Star Product").
