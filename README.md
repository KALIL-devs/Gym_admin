# Gym Membership Management System - Frontend

This is the client-side user interface for the Gym Membership Management System application. It is a modern, responsive Single Page Application (SPA) built using React and Vite, designed to handle gym management, client renewals, and general administration.

## Key Features
- **Modern UI**: Styled efficiently using Tailwind CSS for a clean and responsive design.
- **Fast Build Times**: Utilizes Vite for blazing-fast hot module replacement (HMR) during development and optimized production builds.
- **Client-Side Routing**: Implements `react-router-dom` for seamless navigation between different administrative views.
- **Export Capabilities**: Uses `html2canvas` for potential UI screenshot/export functionalities.

## Technologies Used
- **React** (v19)
- **Vite** (Build Tool & Dev Server)
- **Tailwind CSS** (Utility-first styling framework)
- **React Router DOM** (Navigation)
- **React Icons** (Scalable iconography)

## Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

## Setup Instructions

1. **Clone the repository and navigate to the frontend directory:**
   ```bash
   cd client-side
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will typically be available at `http://localhost:5173`. 
   
   *Note: In development mode, ensure your backend server is also running if you need to fetch real data.*

## Production Build

To build the application for production:

```bash
npm run build
```

This will create a `dist` folder containing the compiled static assets. 

**Deployment Note:** The Gym Membership Management System backend is explicitly configured to serve these static files from the `dist` folder. After running the build command, simply starting the backend server will serve the full-stack application concurrently.

## Backend Repository
You can find the backend service repository here: [Gym Admin Backend](https://github.com/KALIL-devs/Gym_admin_backend)
