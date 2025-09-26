# MERN Deploy App

This project is a full-stack MERN (MongoDB, Express, React, Node.js) application designed for collaborative code editing with chat and drawing board features.

## Project Structure

```
mern-deploy-app
├── client                # Frontend application
│   ├── src               # Source files for the React app
│   │   ├── components     # React components
│   │   ├── pages          # Page components
│   │   └── main.tsx       # Entry point for the React application
│   ├── package.json       # Client-side dependencies and scripts
│   ├── vite.config.ts     # Vite configuration
│   └── tsconfig.json      # TypeScript configuration for the client
├── server                # Backend application
│   ├── src               # Source files for the Node.js server
│   │   ├── models         # Mongoose models
│   │   ├── routes         # API routes
│   │   └── server.ts      # Entry point for the Node.js server
│   ├── package.json       # Server-side dependencies and scripts
│   └── tsconfig.json      # TypeScript configuration for the server
├── render.yaml            # Deployment configuration for Render
├── package.json           # Overall project dependencies and scripts
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Node.js
- MongoDB (running locally or configured in environment variables)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd mern-deploy-app
   ```

2. Install dependencies for the client:
   ```
   cd client
   npm install
   ```

3. Install dependencies for the server:
   ```
   cd server
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd server
   npm run dev
   ```

2. Start the frontend application:
   ```
   cd client
   npm run dev
   ```

### Deployment

This application can be deployed on Render using the provided `render.yaml` configuration file. Ensure that all environment variables are set correctly in the Render dashboard.

## Features

- Real-time collaborative code editing
- Chat functionality
- Drawing board for visual collaboration
- User authentication and room management

## License

This project is licensed under the MIT License.