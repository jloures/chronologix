# Chronologix 🛡️

**Chronologix** is a high-security, local-first personal diary and mood tracker. Designed for absolute privacy, it ensures that your thoughts remain yours alone.

## Key Features

*   **Zero-Knowledge Architecture**: All data is encrypted on your device using **AES-GCM (256-bit)** before it ever touches storage. We cannot see your data.
*   **Local-First**: Your diary resides in your browser's IndexedDB. No servers, no clouds, no leaks.
*   **Auto-Lock**: The vault automatically locks after **10 minutes** of inactivity, clearing encryption keys from memory to prevent unauthorized access.
*   **Mood Tracking**: visual calendar with mood indicators to track your emotional well-being over time.
*   **Rich Text Editor**: Write freely with Markdown support.
*   **Data Sovereignty**: Export your entire vault as an encrypted JSON backup. Restore it anywhere, anytime.

## Security Model

*   **Encryption**: AES-GCM 256-bit.
*   **Key Derivation**: PBKDF2-HMAC-SHA256 with 600,000 iterations.
*   **Storage**: IndexedDB (Browser Local Storage).
*   **Recovery**: **None.** There is no "Forgot Password". If you lose your password, your data is mathematically inaccessible.

## Getting Started

### Prerequisites

*   Node.js 18+
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/jloures/chronologix.git
    cd chronologix
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open `http://localhost:5173` in your browser.

## Tech Stack

*   **Framework**: React 18 + Vite
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Cryptography**: Web Crypto API
*   **Storage**: idb (IndexedDB wrapper)
*   **Editor**: react-markdown

## License

MIT
