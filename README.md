# 🐧 Penguin Pool: Decentralized Lending Platform

![Penguin Pool Logo](src/assets/penguin-pool.svg)

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Chia Network](https://img.shields.io/badge/Chia_Network-Proof_of_Space-4CAF50?style=for-the-badge&logo=chia&logoColor=white)](https://www.chia.net/)

> **A revolutionary Progressive Web App (PWA) that democratizes access to decentralized lending and borrowing on the Chia Network**

## 🚀 Overview

Penguin-pool is a modern, privacy-focused decentralized lending platform that combines the security of blockchain technology with the convenience of web applications. Built with Vue.js 3, Vite, and Kurrent DB, it provides users with complete control over their financial data while enabling sophisticated DeFi operations.

### ✨ Key Features

- **🔐 Privacy-First**: Local data storage with optional blockchain synchronization
- **📱 Offline-First**: Full PWA functionality without internet connectivity
- **🌱 Energy-Efficient**: Built on Chia Network's Proof of Space and Time
- **🎯 User-Friendly**: Modern UI/UX with progressive disclosure of complexity
- **🪙 Piggy Bank System**: Unique coin-based loan settlement mechanism
- **📊 Option Contracts**: Advanced financial derivatives and risk management

## 📚 Documentation

### 📋 Core Documentation

- **[Design Document](docs/DESIGN.md)** - Comprehensive technical specifications and architecture
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Feature Sliced Design implementation guide
- **[Technical Stack](docs/TECHNICAL_STACK.md)** - Complete technology overview and dependencies
- **[Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)** - 14-week development plan with tickets
- **[White Paper](docs/WHITE_PAPER.md)** - Complete project overview and business case
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete REST API reference with Swagger/OpenAPI

### 🎯 Quick Start Guide

1. **Review Documentation**: Start with the [Design Document](docs/DESIGN.md)
2. **Understand Architecture**: Study the [Project Structure](docs/PROJECT_STRUCTURE.md)
3. **Plan Implementation**: Follow the [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)
4. **Begin Development**: Start with Phase 1 tickets

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Vue.js 3 + Composition API + TypeScript
- **Backend**: NestJS + TypeScript + KurrentDB integration
- **Build Tool**: Vite 5.x with optimized builds
- **UI Components**: PrimeVue component library
- **Styling**: Tailwind CSS with custom design system
- **API Documentation**: Swagger/OpenAPI 3.0 with interactive UI
- **State Management**: TanStack Query + Pinia
- **Database**: Kurrent DB for local stream storage
- **Blockchain**: Chia Network integration
- **Wallets**: Wallet Connect + Sage Wallet

### Architecture Principles

- **Feature Sliced Design**: Modular, scalable architecture
- **Offline-First**: Local data storage with blockchain sync
- **Progressive Enhancement**: Core functionality without JavaScript
- **Type Safety**: Full TypeScript integration
- **PWA Ready**: Service workers and offline capabilities

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Git
- Modern browser with PWA support
- WalletConnect Project ID (optional, for wallet features)
- KurrentDB API keys (optional, for database features)

### Environment Setup

1. **Copy environment template**:

   ```bash
   cp env.example .env
   ```

2. **Configure required environment variables**:
   - `VITE_WALLET_CONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - `VITE_KURRENT_DB_DEV_API_KEY` & `VITE_KURRENT_DB_DEV_SECRET_KEY`: Get from KurrentDB dashboard

3. **Optional configurations**:
   - Update API endpoints if using custom backend
   - Configure blockchain network settings
   - Set feature flags as needed

### Troubleshooting

If you see warnings about missing configuration:

- **WalletConnect warnings**: Set `VITE_WALLET_CONNECT_PROJECT_ID` in your `.env` file
- **KurrentDB warnings**: Set the appropriate API keys for your environment
- **Lit development mode**: This is automatically suppressed in production builds

### Backend API

The backend provides a comprehensive REST API with full Swagger/OpenAPI documentation:

- **API Base URL**: `http://localhost:3002`
- **Interactive Documentation**: `http://localhost:3002/api/docs`
- **OpenAPI Specification**: `http://localhost:3002/api/docs-json`

#### Available API Modules:

- **Health Monitoring** - System health checks and status
- **Stream Management** - Event stream CRUD operations
- **Uptime Tracking** - Service uptime monitoring and statistics
- **KurrentDB Integration** - Direct database operations and proxy
- **Status Endpoints** - API status and information

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/penguin-pool.git
cd penguin-pool

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

### Project Structure

```
penguin-pool/
├── docs/                          # 📚 Documentation
├── src/                           # 💻 Source code
│   ├── app/                      # ⚙️ Application configuration
│   ├── pages/                    # 📄 Page components
│   ├── widgets/                  # 🧩 Complex UI combinations
│   ├── features/                 # ⚡ Business logic features
│   ├── entities/                 # 🏗️ Business entities
│   └── shared/                   # 🔗 Shared resources
├── tests/                         # 🧪 Test files
└── public/                        # 🌐 Static assets
```

## 📋 Development Roadmap

### Phase 1: Foundation (Weeks 1-2) 🏗️

- [ ] Project initialization and setup
- [ ] Core architecture implementation
- [ ] Development environment configuration

### Phase 2: Infrastructure (Weeks 3-4) 🔧

- [ ] Database integration and setup
- [ ] Wallet connection implementation
- [ ] Basic data models and types

### Phase 3: Core Features (Weeks 5-8) ⚡

- [ ] User authentication system
- [ ] Option contracts functionality
- [ ] Loan offers and management

### Phase 4: Advanced Features (Weeks 9-12) 🚀

- [ ] Piggy Bank system implementation
- [ ] Notification and alert systems
- [ ] PWA features and offline support

### Phase 5: Testing & Deployment (Weeks 13-14) 🎯

- [ ] Comprehensive testing and QA
- [ ] Performance optimization
- [ ] Production deployment

## 🎨 UI/UX Features

### Design System

- **Dark/Light Themes**: Multiple theme options
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance
- **Component Library**: 80+ PrimeVue components

### User Experience

- **Progressive Disclosure**: Complexity revealed gradually
- **Intuitive Navigation**: Clear information architecture
- **Quick Actions**: Fast access to common functions
- **Real-time Updates**: Live data synchronization

## 🔒 Security & Privacy

### Security Features

- **Multi-Layer Security**: Application, data, blockchain, and network layers
- **Authentication**: Chia DID + wallet signature verification
- **Authorization**: Role-based access control
- **Smart Contract Auditing**: Security-focused contract development

### Privacy Protection

- **Local Data Storage**: User data never leaves device without consent
- **Optional Sync**: Blockchain synchronization only with explicit permission
- **Data Minimization**: Collection of only essential information
- **GDPR/CCPA Compliance**: Full regulatory compliance

## 🌐 Blockchain Integration

### Chia Network

- **Proof of Space and Time**: Energy-efficient consensus mechanism
- **Smart Contracts**: Programmable financial instruments
- **DID Support**: Decentralized identity verification
- **Wallet Integration**: Native wallet support

### External APIs

- **Dexie.space**: Centralized fallback for offer indexing
- **Spacescan.io**: Chia blockchain explorer integration
- **Wallet Connect**: Multi-wallet protocol support

## 🧪 Testing Strategy

### Testing Framework

- **Unit Testing**: Vitest + Vue Test Utils
- **Integration Testing**: API and database testing
- **E2E Testing**: Playwright for user workflows
- **Performance Testing**: Core Web Vitals optimization

### Quality Assurance

- **Code Quality**: ESLint + Prettier
- **Git Hooks**: Husky for pre-commit validation
- **Type Safety**: Full TypeScript coverage
- **Documentation**: Comprehensive API documentation

## 📱 PWA Features

### Progressive Web App

- **Service Workers**: Offline functionality and caching
- **Web App Manifest**: Native app experience
- **Background Sync**: Seamless data synchronization
- **Push Notifications**: Real-time alerts and updates

### Offline Capabilities

- **Local Data Access**: Full functionality without internet
- **Background Sync**: Automatic synchronization when online
- **Conflict Resolution**: Data consistency management
- **Cache Strategies**: Optimized offline experience

## 🤝 Contributing

### Development Guidelines

- Follow Feature Sliced Design architecture
- Use TypeScript for all new code
- Write comprehensive tests
- Follow established coding standards
- Update documentation for new features

### Getting Involved

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Write/update tests**
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- **Technical Issues**: Check the [Design Document](docs/DESIGN.md)
- **Architecture Questions**: Review [Project Structure](docs/PROJECT_STRUCTURE.md)
- **Implementation Help**: Follow the [Roadmap](docs/IMPLEMENTATION_ROADMAP.md)

### Community

- **Discussions**: GitHub Discussions
- **Issues**: GitHub Issues
- **Contributions**: Pull Requests welcome

## 🌟 Acknowledgments

- **Chia Network** for the energy-efficient blockchain platform
- **Vue.js Team** for the excellent frontend framework
- **PrimeVue** for the comprehensive component library
- **Tailwind CSS** for the utility-first styling approach

---

**Built with ❤️ for the DeFi community**

_Penguin-pool: Democratizing access to decentralized finance through privacy, usability, and innovation._
