# ORYGIN Eval

A comprehensive evaluation platform for Large Language Models (LLMs) that enables researchers and developers to systematically test, analyze, and compare AI model performance across various datasets and parameters.

## Features

### Core Functionality
- **Project Management**: Organize LLM evaluations into projects with dedicated API configurations
- **Dataset Management**: 
  - Upload custom datasets
  - Synthesize datasets from sample conversations
  - Manage multiple datasets per project
- **Experiment Configuration**: Create and configure evaluation parameters
- **Real-time Evaluation**: Run experiments and monitor results in real-time
- **Results Analysis**: Comprehensive reporting and visualization of experiment outcomes

### User Interface
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Component Library**: Utilizes shadcn/ui for consistent, accessible components

### Authentication & Storage
- **Supabase Integration**: Secure authentication and data storage
- **Google OAuth**: Easy sign-in with Google accounts
- **Data Persistence**: All projects, datasets, and experiments are securely stored

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React Context, TanStack Query
- **Routing**: React Router DOM
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Form Handling**: React Hook Form with Zod validation
- **Development**: ESLint, TypeScript, Hot Module Replacement

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Main application pages
│   ├── datasets/       # Dataset management pages
│   └── evaluation/     # Experiment and evaluation pages
└── services/           # API services and external integrations
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/oryginai/OryginEval-web.git
   cd OryginEval-web
   ```

2. **Install dependencies**
   ```bash
   npm i
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:8080`


## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the ORYGIN evaluation suite. Please refer to the license file for usage terms.

## 🆘 Support

For questions, issues, or feature requests, please open an issue on the GitHub repository or contact the development team.

---

**Built with ❤️ for the AI research community**
