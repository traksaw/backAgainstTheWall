# Back Against the Wall

[![Live Demo](https://img.shields.io/badge/Live%20Demo-backagainstthewall.vercel.app-blue?style=for-the-badge)](https://backagainstthewall.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

An interactive personality quiz web application that determines your financial archetype through engaging questions and provides personalized insights. Built as a companion experience to the film "Back Against the Wall."

## 📸 Screenshots

### Quiz Results & Personality Analysis
<div align="center">
  <img src="docs/screenshots/quiz-recommendations.png" alt="Quiz Results - Personalized Recommendations" width="45%">
  <img src="docs/screenshots/quiz-personality-chart.png" alt="Personality Analysis Chart" width="45%">
</div>

*Left: Personalized financial recommendations based on your archetype | Right: Interactive personality breakdown with detailed analysis*

### Film Integration & Movie Poster
<div align="center">
  <img src="docs/screenshots/film-player.png" alt="Integrated Film Player" width="45%">
  <img src="docs/screenshots/movie-poster.png" alt="Back Against the Wall Movie Poster" width="45%">
</div>

*Left: Integrated film viewing experience with archetype-based insights | Right: Official movie poster featuring the cast*

## 🎯 Features

### 🧠 Interactive Quiz System
- **Personality Assessment**: Discover your financial archetype (Avoider, Gambler, Realist, or Architect)
- **Advanced Scoring Algorithm**: Enhanced scoring with tie-breaking logic and confidence metrics
- **Progress Tracking**: Visual progress indicators and smooth animations
- **Results Visualization**: Interactive charts and detailed personality breakdowns

### 👤 User Management
- **Secure Authentication**: JWT-based auth with bcrypt password hashing
- **User Profiles**: Personalized accounts with quiz history
- **Results History**: Track and compare multiple quiz attempts
- **Account Management**: Sign up, sign in, and profile management

### 🎬 Film Integration
- **Video Player**: Integrated film viewing experience
- **Archetype-Based Content**: Personalized content based on quiz results
- **Cast & Crew Information**: Interactive cast carousel and detailed profiles

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for all device sizes
- **Touch-Friendly Interface**: Mobile-optimized interactions and gestures
- **Progressive Enhancement**: Desktop features that enhance mobile experience
- **Accessible Design**: WCAG compliant with proper ARIA labels

### 🎨 Modern UI/UX
- **Smooth Animations**: Framer Motion powered transitions
- **Component Library**: Radix UI primitives with custom styling
- **Dark/Light Themes**: Theme switching with next-themes
- **Loading States**: Skeleton loaders and progress indicators

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14.2.15 (App Router)
- **Language**: TypeScript 5.9.2
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion 11.11.17
- **Charts**: Recharts 2.15.0
- **Forms**: React Hook Form with Zod validation

### Backend & Database
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **CMS**: Sanity.io for content management
- **File Storage**: Vercel Blob for video assets

### Development & Deployment
- **Package Manager**: pnpm
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript strict mode
- **Deployment**: Vercel
- **Version Control**: Git with conventional commits

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- MongoDB database
- Sanity.io project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/traksaw/backAgainstTheWall.git
   cd backAgainstTheWall
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   
   # Sanity CMS
   NEXT_PUBLIC_SANITY_PROJECT_ID=u6u93177
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_SANITY_API_VERSION=2025-08-10
   SANITY_API_TOKEN=your_sanity_api_token
   
   # Vercel Blob (optional)
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   
   # Formspree (contact form)
   NEXT_PUBLIC_FORMSPREE_ID=your_formspree_id
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── quiz/          # Quiz-related endpoints
│   ├── privacy/           # Privacy policy page
│   ├── terms/             # Terms of service page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components
│   ├── modals/            # Modal components
│   ├── quiz/              # Quiz-related components
│   ├── results/           # Results display components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── quiz/              # Quiz logic and scoring
│   ├── auth.ts            # Authentication utilities
│   └── sanity.ts          # Sanity CMS client
├── models/                # Database models
├── sanity/                # Sanity CMS configuration
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## 🎮 Quiz System

### Archetypes

The quiz determines one of four financial personality archetypes:

- **🛡️ The Avoider**: Risk-averse, prefers security and stability
- **🎲 The Gambler**: High-risk tolerance, seeks big rewards
- **⚖️ The Realist**: Balanced approach, practical decision-making
- **🏗️ The Architect**: Strategic planner, long-term focused

### Scoring Algorithm

- **Multi-dimensional Analysis**: Questions assess risk tolerance, time horizon, and decision-making style
- **Weighted Responses**: Different question types have varying impact on final results
- **Tie-Breaking Logic**: Advanced algorithms handle close scores
- **Confidence Metrics**: Results include confidence levels for transparency

## 🔐 Authentication & Security

- **JWT Tokens**: Secure, stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Zod schemas for type-safe validation
- **CORS Protection**: Configured for production domains
- **Environment Variables**: Sensitive data properly secured

## 📱 Mobile Optimization

- **Mobile-First CSS**: Responsive design starting from mobile
- **Touch Gestures**: Optimized for touch interactions
- **Performance**: Lazy loading and code splitting
- **Accessibility**: Screen reader support and keyboard navigation

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import project to Vercel
   - Connect your GitHub repository

2. **Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure MongoDB and Sanity credentials are configured

3. **Deploy**
   - Automatic deployments on push to main branch
   - Preview deployments for pull requests

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use conventional commit messages
- Ensure ESLint passes (`pnpm lint`)
- Test on multiple devices and browsers
- Update documentation for new features

## 📄 License

This project is private and proprietary. All rights reserved.

## 🎬 About the Film

"Back Against the Wall" explores financial decision-making under pressure. The quiz companion app helps viewers understand their own financial personality and how they might react in similar situations.

## 📞 Support

For questions or support, please contact the development team or open an issue in the repository.

---

**Live Demo**: [backagainstthewall.vercel.app](https://backagainstthewall.vercel.app/)

Built with ❤️ by the Back Against the Wall team
