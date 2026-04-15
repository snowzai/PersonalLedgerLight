# PersonalLedgerLight

PersonalLedgerLight is a lightweight personal finance management web application built with Vue 3.

## Features
- User-friendly interface for tracking expenses and income.
- Ability to categorize transactions for better organization.
- Visual charts to analyze spending patterns.
- Secure authentication and user data protection.

## Tech Stack
- **Frontend:** Vue 3, Vuex for state management, Vue Router for routing.
- **Styling:** Tailwind CSS for sleek and responsive designs.
- **Backend:** Node.js and Express for server-side logic.
- **Database:** MongoDB for data storage.

## Project Structure
```
├── src/
│   ├── components/   # Vue components
│   ├── store/        # Vuex store files
│   ├── router/       # Vue Router files
│   ├── assets/       # Images and other static assets
│   └── App.vue       # Main App component
├── public/
│   └── index.html    # Main HTML file
└── server/           # Backend server files
```

## Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/snowzai/PersonalLedgerLight.git
   cd PersonalLedgerLight
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install vite:
   ```bash
   npm install vite
   ```
4. Start the development:
   ```bash
   npm run dev
   ```

## Usage Guide
After starting the application, you can:
- Register a new account or log in if you already have one.
- Start entering your income and expenses to track your financial health.
- Explore your spending through visual representations in the dashboard.

## Security Information
- User passwords are hashed and salted before storage.
- Regular security updates are applied to dependencies.
- Ensure your environment variables are secured, especially those containing sensitive information.

## License
This project is licensed under the MIT License.

---
Last updated: 2026-04-07 03:06:42 (UTC)
