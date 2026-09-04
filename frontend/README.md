# Riskora Frontend

Riskora is a modern, AI-powered payment risk intelligence platform. This is the frontend dashboard built for managing, reviewing, and analyzing transaction risks.

## Technology Stack
- **Framework**: React with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the URL provided by Vite (typically `http://localhost:5173`).

## Project Structure
- `src/components/`: Reusable UI components (Sidebar, TopNav, Cards, Badges).
- `src/pages/`: Main application views (Dashboard, Transactions, Risk Analysis, Alerts, Analytics).
- `src/data/`: Contains `mockData.js` with realistic transaction mock data for UI testing.
- `src/App.jsx`: Main routing configuration.

## Future Enhancements
- Connect to a real FastAPI backend.
- Implement real authentication and authorization.
- Integrate the AI risk scoring model API.
