# Greep Market - Advanced Retail Management System

A modern, feature-rich retail management system built with React, TypeScript, and Tailwind CSS. Designed for small to medium market owners with comprehensive POS, inventory, and analytics capabilities.

## 🚀 Features

### 🏪 Core Business Features

- **📊 Advanced Dashboard** - Real-time metrics, sales trends, inventory alerts, and performance analytics
- **🛍️ Product Management** - Complete product catalog with categories, tags, bulk import, and barcode support
- **💳 Point of Sale (POS)** - Multi-payment method transactions with customer tracking and receipt generation
- **📦 Inventory Management** - Stock tracking, low stock alerts, automated reorder suggestions, and category filtering
- **📈 Sales History & Analytics** - Comprehensive transaction history with filtering, search, and export capabilities
- **💰 Cash Tracking** - Daily cash flow monitoring and reconciliation
- **👥 User Management** - Role-based access control (Admin, Owner, Manager, Cashier)
- **⚙️ Settings & Configuration** - Store settings, user profiles, and system preferences
- **🔍 Audit & Compliance** - Complete audit trail and transaction logging

### 💳 Advanced Payment System

- **Multiple Payment Methods** - Cash, POS/Isbank Transfer, Naira Transfer, Crypto Payment
- **Split Payments** - Support for multiple payment methods in single transaction
- **Payment Analytics** - Real-time payment method breakdown and statistics
- **Transaction Editing** - Edit pending transactions with multiple payment methods
- **Payment History** - Complete payment tracking and reconciliation

### 📱 Modern UI/UX Features

- **Mobile-First Responsive Design** - Optimized for all devices with touch-friendly interface
- **Dark/Light Theme Support** - User preference-based theme switching
- **Glassmorphism Design** - Modern, elegant UI with glass-like effects
- **Interactive Animations** - Smooth transitions and micro-interactions
- **Smart Navigation** - Context-aware navigation with breadcrumbs
- **Intelligent Search** - Advanced search with fuzzy matching and suggestions
- **Real-time Notifications** - Toast notifications and system alerts

### 🔧 Technical Features

- **TypeScript** - Full type safety and enhanced development experience
- **Context API State Management** - Efficient global state management
- **Real-time Updates** - Live data synchronization across components
- **Barcode Scanner Integration** - Camera-based product identification
- **Excel Import/Export** - Bulk data operations with validation
- **Progressive Web App (PWA)** - Offline capabilities and app-like experience
- **Performance Optimization** - Code splitting, lazy loading, and caching

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling and responsive design
- **React Router** for client-side routing
- **Context API** for state management
- **Recharts** for data visualization
- **html5-qrcode** for barcode scanning
- **react-hot-toast** for notifications
- **Lucide React** for icons
- **Framer Motion** for animations

### Backend Integration

- **RESTful API** integration
- **JWT Authentication** with role-based access
- **Real-time data synchronization**
- **Error handling and retry logic**

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API server running

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd FRONTEND_MARKET
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment:**

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your API endpoints
REACT_APP_API_URL=http://localhost:3001/api/v1
```

4. **Start the development server:**

```bash
npm start
```

5. **Open [http://localhost:3000](http://localhost:3000) to view the application**

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx         # Button variants and states
│   │   ├── Card.tsx           # Card layouts and containers
│   │   ├── Input.tsx          # Form inputs with validation
│   │   ├── Modal.tsx          # Modal dialogs and overlays
│   │   ├── SearchBar.tsx      # Search with barcode integration
│   │   ├── ProductCard.tsx    # Product display components
│   │   ├── ShoppingCart.tsx   # Cart management
│   │   ├── BarcodeScanner.tsx # Camera barcode scanning
│   │   ├── PaymentMethodsDisplay.tsx # Payment method visualization
│   │   ├── EditTransactionModal.tsx # Transaction editing
│   │   ├── EnhancedPaymentModal.tsx # Multi-payment processing
│   │   ├── CategoryFilterSidebar.tsx # Category filtering
│   │   ├── AuditAnalytics.tsx # Audit data visualization
│   │   ├── CashTracking.tsx   # Cash flow management
│   │   ├── RiderManagement.tsx # Delivery rider management
│   │   └── ...                # Additional UI components
│   ├── navigation/            # Navigation components
│   │   ├── Header.tsx         # Top navigation bar
│   │   └── MobileNavigation.tsx # Mobile bottom navigation
│   └── withAutoRefresh.tsx    # Auto-refresh wrapper
├── context/                   # Global state management
│   ├── AppContext.tsx         # Main application state
│   ├── AuthContext.tsx        # Authentication state
│   ├── GoalContext.tsx        # Goal tracking state
│   ├── NavigationContext.tsx  # Navigation state
│   ├── NotificationContext.tsx # Notification state
│   ├── RefreshContext.tsx     # Data refresh state
│   ├── RiderContext.tsx       # Rider management state
│   ├── SettingsContext.tsx    # Settings state
│   ├── StoreContext.tsx       # Store configuration state
│   └── ThemeContext.tsx       # Theme management state
├── pages/                     # Main application pages
│   ├── Dashboard.tsx          # Main dashboard with metrics
│   ├── Products.tsx           # Product management
│   ├── POS.tsx                # Point of sale interface
│   ├── Inventory.tsx          # Inventory management
│   ├── SalesHistory.tsx       # Transaction history
│   ├── Reports.tsx            # Analytics and reporting
│   ├── CashTracking.tsx       # Cash flow management
│   ├── RiderManagement.tsx    # Delivery management
│   ├── Settings.tsx           # System settings
│   ├── Audit.tsx              # Audit dashboard
│   ├── AuditDashboard.tsx     # Audit analytics
│   ├── Expenses.tsx           # Expense tracking
│   └── Login.tsx              # Authentication
├── services/                  # API and external services
│   ├── api.ts                 # API service layer
│   └── excelParser.ts         # Excel import/export utilities
├── hooks/                     # Custom React hooks
│   ├── useActionWithRefresh.ts # Action with auto-refresh
│   ├── useIntelligentSearch.ts # Advanced search logic
│   ├── usePageRefresh.ts      # Page refresh management
│   └── useScrollToTop.ts      # Scroll behavior
├── types/                     # TypeScript type definitions
│   ├── index.ts               # Main type definitions
│   └── goals.ts               # Goal-related types
├── utils/                     # Utility functions
│   ├── notificationUtils.ts   # Notification helpers
│   ├── phoneUtils.ts          # Phone number utilities
│   ├── tagUtils.ts            # Tag management utilities
│   └── __tests__/             # Utility tests
├── config/                    # Configuration files
│   ├── environment.ts         # Environment configuration
│   └── README.md              # Configuration documentation
├── App.tsx                    # Main application component
├── index.tsx                  # Application entry point
└── index.css                  # Global styles and Tailwind
```

## 🎯 Key Features by Page

### 1. 📊 Dashboard

- **Real-time Metrics**: Sales, products, inventory, and performance KPIs
- **Interactive Charts**: Sales trends, payment method breakdown, and analytics
- **Smart Alerts**: Low stock notifications and inventory warnings
- **Recent Activity**: Latest transactions and system events
- **Performance Indicators**: Goal tracking and achievement metrics

### 2. 🛍️ Products Management

- **Product Catalog**: Complete product database with search and filtering
- **Category Management**: Organized product categories with visual filtering
- **Bulk Operations**: Excel import/export for mass product updates
- **Barcode Integration**: Camera scanning for quick product lookup
- **Stock Management**: Real-time inventory tracking and alerts
- **Advanced Search**: Intelligent search with fuzzy matching

### 3. 💳 Point of Sale (POS)

- **Multi-Payment Support**: Cash, POS, Transfer, and Crypto payments
- **Split Payments**: Multiple payment methods per transaction
- **Customer Tracking**: Customer ID and transaction history
- **Quick Actions**: Barcode scanning and product search
- **Receipt Generation**: Professional receipt printing
- **Transaction Management**: Edit and manage pending transactions

### 4. 📦 Inventory Management

- **Stock Monitoring**: Real-time inventory levels and alerts
- **Category Filtering**: Advanced filtering with visual sidebar
- **Low Stock Alerts**: Automated notifications for restocking
- **Bulk Updates**: Mass inventory adjustments
- **Stock History**: Complete inventory movement tracking
- **Reorder Management**: Automated reorder suggestions

### 5. 📈 Sales History & Analytics

- **Transaction History**: Complete sales record with filtering
- **Payment Analytics**: Multi-payment method breakdown
- **Export Functionality**: CSV export for external analysis
- **Search & Filter**: Advanced filtering by date, product, payment method
- **Transaction Editing**: Modify pending transactions
- **Performance Metrics**: Sales trends and analytics

### 6. 💰 Cash Tracking

- **Daily Cash Flow**: Real-time cash position monitoring
- **Reconciliation**: Cash vs. system balance tracking
- **Transaction History**: Complete cash movement log
- **Reporting**: Cash flow reports and analytics

### 7. 👥 User Management

- **Role-Based Access**: Admin, Owner, Manager, Cashier roles
- **User Profiles**: Complete user management system
- **Permission Control**: Granular access control
- **Activity Tracking**: User action logging

### 8. ⚙️ Settings & Configuration

- **Store Settings**: Business information and configuration
- **User Preferences**: Theme, notifications, and personal settings
- **System Configuration**: Application-wide settings
- **Audit Logs**: System activity and change tracking

## 🎨 UI Components

### Core Components

- **Button**: Primary, secondary, danger, outline, and ghost variants
- **Card**: Consistent card layouts with hover effects and animations
- **Input**: Form inputs with validation, error states, and icons
- **Modal**: Responsive modal dialogs with backdrop and animations
- **SearchBar**: Advanced search with barcode integration and suggestions
- **ProductCard**: Product display with stock alerts and quick actions
- **ShoppingCart**: Cart management with quantity controls and totals

### Specialized Components

- **PaymentMethodsDisplay**: Visual payment method representation
- **EditTransactionModal**: Transaction editing with multi-payment support
- **EnhancedPaymentModal**: Advanced payment processing interface
- **CategoryFilterSidebar**: Interactive category filtering
- **BarcodeScanner**: Camera-based product identification
- **AuditAnalytics**: Audit data visualization and reporting
- **CashTracking**: Cash flow management interface

### Navigation Components

- **Header**: Top navigation with notifications and user menu
- **MobileNavigation**: Bottom navigation optimized for mobile
- **Breadcrumb**: Context-aware navigation breadcrumbs
- **SmartNavButton**: Intelligent navigation with state awareness

## 🔐 Authentication & Authorization

### User Roles

- **Admin**: Full system access and user management
- **Owner**: Business management and configuration
- **Manager**: Operational management and reporting
- **Cashier**: POS operations and basic functions

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Session Management**: Secure session handling
- **Audit Logging**: Complete activity tracking

## 📱 Responsive Design

### Mobile-First Approach

- **Touch-Friendly Interface**: Large buttons and touch targets
- **Adaptive Layout**: Responsive grid system for all screen sizes
- **Bottom Navigation**: Easy thumb navigation on mobile devices
- **Gesture Support**: Swipe and touch gesture integration

### Cross-Platform Compatibility

- **Progressive Web App**: App-like experience on mobile devices
- **Offline Support**: Basic functionality without internet connection
- **Performance Optimization**: Fast loading and smooth animations

## 🔧 Advanced Features

### Barcode Scanning

- **Multi-Format Support**: EAN-13, EAN-8, CODE-128, QR codes
- **Camera Integration**: Real-time barcode detection
- **Error Handling**: Graceful fallback for unsupported devices
- **Product Lookup**: Instant product identification

### Excel Integration

- **Bulk Import**: Mass product and inventory updates
- **Data Validation**: Import validation and error reporting
- **Export Functionality**: Data export for external analysis
- **Template Support**: Predefined import templates

### Real-time Updates

- **Live Data Sync**: Real-time data synchronization
- **Auto-refresh**: Automatic data updates
- **Conflict Resolution**: Data conflict handling
- **Offline Queue**: Offline action queuing

## 🌐 Internationalization

### Currency Support

- **Turkish Lira (₺)**: Primary currency with proper formatting
- **Localized Formatting**: Region-specific number and date formatting
- **Multi-currency Ready**: Architecture supports multiple currencies

### Localization Features

- **Date Formatting**: Localized date and time display
- **Number Formatting**: Proper decimal and thousand separators
- **Text Direction**: RTL support ready

## 🚀 Performance & Optimization

### Code Optimization

- **Code Splitting**: Lazy loading for better performance
- **Bundle Optimization**: Minimized bundle size
- **Tree Shaking**: Unused code elimination
- **Memoization**: React optimization techniques

### User Experience

- **Loading States**: Skeleton screens and loading indicators
- **Error Boundaries**: Graceful error handling
- **Progressive Enhancement**: Core functionality without JavaScript
- **Accessibility**: WCAG compliance and screen reader support

## 🔮 Future Enhancements

### Planned Features

- **Multi-location Support**: Multiple store management
- **Advanced Analytics**: AI-powered insights and predictions
- **Inventory Forecasting**: Automated demand prediction
- **Customer Loyalty**: Loyalty programs and customer management
- **Integration APIs**: Third-party service integrations
- **Mobile App**: Native mobile applications
- **Offline Mode**: Complete offline functionality
- **Multi-language Support**: Internationalization

### Technical Improvements

- **Microservices Architecture**: Scalable backend services
- **Real-time Collaboration**: Multi-user real-time editing
- **Advanced Caching**: Intelligent data caching strategies
- **Performance Monitoring**: Application performance tracking

## 🧪 Testing

### Test Coverage

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end user journey testing
- **Performance Tests**: Load and stress testing

### Quality Assurance

- **TypeScript**: Compile-time error prevention
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting standards
- **Husky**: Pre-commit hooks for quality gates

## 📚 Documentation

### Additional Documentation

- **API Documentation**: Complete API reference
- **Component Library**: UI component documentation
- **Deployment Guide**: Production deployment instructions
- **Contributing Guide**: Development contribution guidelines

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow established linting rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check the comprehensive documentation
- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Contact**: Reach out to the development team

### Reporting Issues

When reporting issues, please include:

- **Environment**: OS, Node.js version, browser
- **Steps to Reproduce**: Detailed reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: Visual evidence if applicable

---

**Built with ❤️ for modern retail management**
