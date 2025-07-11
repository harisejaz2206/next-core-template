# Next.js 14 Core Template

A production-ready Next.js 14 template with enterprise-grade authentication, state management, and TypeScript support.

## 🚀 Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Redux Toolkit** with RTK Query
- **Redux Persist** for session management
- **Tailwind CSS v4.0** for styling
- **JWT Authentication** with auto-refresh
- **Session Restoration** across browser sessions
- **Comprehensive Error Handling**
- **Production-ready Architecture**

## 📋 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd next-core-template
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.local.example .env.local

# Edit with your backend URL
NEXT_PUBLIC_BACKEND_APP_URL=http://localhost:3001/api/v1/
```

### 3. Start Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── types/              # TypeScript type definitions
├── lib/                # Utilities and configurations
│   ├── auth.ts         # JWT token management
│   ├── session-restore.ts # Session restoration logic
│   ├── redux/          # Redux store configuration
│   └── api/            # API layer with auto-refresh
├── @redux/features/    # Redux slices and API endpoints
├── components/         # Reusable React components
└── app/                # Next.js App Router pages
```

## 🔐 Authentication System

### Features
- **JWT token management** with localStorage storage
- **Automatic token refresh** on API calls
- **Session restoration** across browser sessions
- **Smart error handling** with user feedback
- **Type-safe API integration**

### Usage
```typescript
// Login
const [login] = useLoginMutation();
await login({ email, password });

// Get user profile
const { data: profile } = useGetUserProfileQuery();

// Check auth status
const isAuthenticated = useSelector(selectIsAuthenticated);
const user = useSelector(selectUser);

// Logout
dispatch(logout());
removeAccessToken();
removeRefreshToken();
```

## 🛠️ Configuration

### Environment Variables
```bash
# Required
NEXT_PUBLIC_BACKEND_APP_URL=your-backend-url

# Optional
NEXT_PUBLIC_APP_NAME="Your App Name"
NEXT_PUBLIC_ENABLE_REDUX_DEVTOOLS=true
```

### Backend Integration
This template expects a backend with these endpoints:
- `POST /auth/login` - User login
- `POST /auth/refresh-token` - Token refresh
- `GET /users/profile` - User profile

Response format should match the `IApiResponse<T>` interface.

## 📚 Documentation

Detailed documentation is available in:
- [`notes/auth-frontend-guide.md`](./notes/auth-frontend-guide.md) - Complete auth system guide

## 🧪 Testing

The template includes test components:
- **LoginForm** - Complete authentication flow
- **ProfileTestButton** - API testing scenarios
- **ReduxCacheExplorer** - Redux state inspection

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables
Set these in your deployment platform:
- `NEXT_PUBLIC_BACKEND_APP_URL`
- Any other environment variables from `.env.local.example`

## 📦 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🔧 Customization

### Adding New API Endpoints
1. Add types to `src/types/`
2. Add endpoint to `src/@redux/features/api/api.slice.ts`
3. Use the hook in your components

### Adding New Redux Slices
1. Create slice in `src/@redux/features/`
2. Add to `src/lib/redux/root-reducer.ts`
3. Create selectors as needed

### Styling
- Tailwind CSS classes throughout
- Modify `src/app/globals.css` for global styles
- Component-specific styles use Tailwind

## 🎯 Best Practices

- **Type Safety**: Use TypeScript interfaces throughout
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance**: RTK Query caching and conditional rendering
- **Security**: Tokens in localStorage, proper validation
- **Maintainability**: Modular architecture with clear separation

## 📖 Backend Template

This frontend template pairs with a NestJS backend template with:
- JWT authentication
- Role-based access control
- Global response formatting
- Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

[MIT License](LICENSE) - feel free to use this template for your projects.

## 🆘 Support

- Check the [documentation](./notes/auth-frontend-guide.md)
- Review the test components for usage examples
- Open an issue for bugs or feature requests

---

**Happy coding!** 🎉
