# My Tasks

This is a modern, cross-platform task management application built with React Native and Expo.

## Features

- **Task Management**: Create, edit, and organize tasks with priorities and due dates.
- **Cross-Platform**: Natively runs on Android, iOS, and Web from a single codebase.
- **Modern Stack**: Built with TypeScript, Expo Router, and Zustand for state management.

## Getting Started

### Prerequisites

- Node.js (LTS version)
- pnpm (or npm/yarn)
- Expo CLI

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/raaziak/my-tasks.git
    cd my-tasks
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

## Available Scripts

-   `pnpm dev`: Runs the app in development mode with Expo Go.
-   `pnpm start`: Starts the development server.
-   `pnpm android`: Runs the app on a connected Android device or emulator.
-   `pnpm ios`: Runs the app on an iOS simulator (macOS only).
-   `pnpm web`: Runs the app in a web browser.

## Project Structure

```
.
├── app/              # Application screens and navigation (Expo Router)
├── assets/           # Static assets (icons, fonts, images)
├── components/       # Reusable React components
├── hooks/            # Custom React hooks
├── services/         # Core services (e.g., NotificationService)
├── stores/           # Zustand state management stores
└── types/            # TypeScript type definitions
``` 