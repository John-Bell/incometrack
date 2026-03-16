# IncomeTrack

IncomeTrack is a fast, local-first personal finance and budgeting web application. It is designed to help you track your income, manage your accounts and budgets, and plan exactly where your money goes without needing to rely on a traditional server for your sensitive financial data.

## Key Features

- **Local-First Architecture:** All of your financial data is stored locally in your browser using IndexedDB (via Dexie.js), ensuring complete privacy and offline functionality.
- **Account & Budget Management:** Keep track of your balances and organize your recurring bills and spending through flexible budgeting.
- **Transactions & Income Tracking:** Record income and expenses effortlessly.
- **Scenario Planning:** Test out different financial situations to forecast your future balances.
- **Responsive & Modern UI:** Built with React and styled with Tailwind CSS for a seamless experience on both desktop and mobile devices.
- **PWA Support:** Installable as a Progressive Web App for a native-like experience.

## Tech Stack

This project is built with a modern frontend stack:

- **Framework:** [React 19](https://react.dev/) via [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) for global state overrides.
- **Database:** [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Testing:** [Playwright](https://playwright.dev/) for E2E tests, [Vitest](https://vitest.dev/) for unit testing.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd incometrack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Scripts

- `npm run dev` - Starts the Vite development server.
- `npm run build` - Compiles TypeScript and builds the app for production.
- `npm run preview` - Boots up a local server to preview the production build.
- `npm run lint` - Runs ESLint.
- `npm test` - Runs unit tests via Vitest.
- `npx playwright test` - Runs E2E tests via Playwright (ensure dependencies are installed with `npx playwright install --with-deps` first).

## License

This project is licensed under the [MIT License](LICENSE).
