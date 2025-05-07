# HealthAxis - Healthcare Management System

A modern healthcare management system built with React, TypeScript, and Docker.

## Features

- Patient Dashboard
- Medical Records Management
- Appointment Scheduling
- Health Metrics Tracking
- Family Member Management
- Insurance Information Management
- AI Health Assistant
- Emergency Services Integration

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Vite
- Docker
- GitHub Actions (CI/CD)

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- Docker
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mounish27/healthaxis.git
cd healthaxis
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Docker Setup

1. Build the Docker image:
```bash
docker-compose build
```

2. Run the application:
```bash
docker-compose up -d
```

The application will be available at http://localhost:3000

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment. The pipeline includes:

1. **Build and Test**
   - Install dependencies
   - Run linting
   - Build the application
   - Build Docker image

2. **Deploy**
   - Push Docker image to Docker Hub
   - Deploy to production (configurable)

### Pipeline Triggers

- Push to main branch
- Pull requests to main branch

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_URL=your_api_url
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 