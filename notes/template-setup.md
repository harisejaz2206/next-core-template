# Template Setup Guide

This guide helps you set up the Next.js Core Template for a new project.

## 🚀 Initial Setup Steps

### 1. Clone and Rename
```bash
# Clone the template
git clone <template-repo-url> my-new-project
cd my-new-project

# Remove template git history
rm -rf .git
git init
```

### 2. Update Project Information

#### package.json
```json
{
  "name": "my-new-project",
  "version": "0.1.0",
  "description": "Your project description",
  // ... rest of config
}
```

#### README.md
- Update the project title
- Change description
- Update repository URLs
- Add project-specific information

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.local.example .env.local

# Update with your values
NEXT_PUBLIC_BACKEND_APP_URL=https://your-api.com/api/v1/
NEXT_PUBLIC_APP_NAME="Your App Name"
```

### 4. Constants Configuration

Update `src/lib/constants.ts`:
```typescript
export const APP_CONFIG = {
  name: 'Your App Name',
  version: '1.0.0',
  description: 'Your app description',
  author: 'Your Company',
} as const;
```

### 5. Styling Customization

#### Update Tailwind Config
Modify colors, fonts, spacing as needed.

#### Global Styles
Update `src/app/globals.css` with your brand colors and styles.

### 6. Remove Template Components (Optional)

If you don't need the test/demo components:
```bash
# Remove test components
rm src/components/ProfileTestButton.tsx
rm src/components/ReduxCacheExplorer.tsx

# Update src/app/page.tsx to remove imports
```

### 7. Backend Integration

#### Update API Types
Modify `src/types/auth.types.ts` to match your backend user model.

#### Update API Endpoints
Modify `src/@redux/features/api/api.slice.ts` with your actual endpoints.

### 8. Authentication Customization

#### User Model
Update `IUser` interface in `src/types/auth.types.ts` to match your backend.

#### Login Form
Customize `src/components/LoginForm.tsx` with your design and validation rules.

#### Session Logic
Modify `src/lib/session-restore.ts` if you have custom session requirements.

## 🎨 Customization Options

### Branding
1. Replace favicon in `public/`
2. Update meta tags in `src/app/layout.tsx`
3. Customize colors in Tailwind config

### Features
1. Add new Redux slices for your domain
2. Create custom components
3. Add new API endpoints
4. Implement role-based access control

### UI/UX
1. Create component library
2. Add animations and transitions
3. Implement responsive design patterns
4. Add dark mode support

## 📦 Additional Dependencies

Commonly added packages:
```bash
# UI Components
npm install @headlessui/react @heroicons/react

# Forms
npm install react-hook-form @hookform/resolvers yup

# Utilities
npm install clsx date-fns lodash

# Icons
npm install lucide-react

# Animations
npm install framer-motion

# Date handling
npm install date-fns

# Validation
npm install yup zod
```

## 🛠️ Development Workflow

### Daily Development
```bash
npm run dev          # Start development server
npm run type-check   # Check TypeScript
npm run lint         # Check code style
```

### Before Commits
```bash
npm run lint:fix     # Fix linting issues
npm run type-check   # Ensure no type errors
npm run build        # Test production build
```

## 🚀 Deployment Setup

### Vercel
1. Connect repository to Vercel
2. Set environment variables
3. Deploy

### Other Platforms
1. Set `NEXT_PUBLIC_BACKEND_APP_URL`
2. Set other environment variables
3. Run build and deploy

## 📝 Next Steps

1. **Set up your backend** - Ensure API endpoints match expected format
2. **Customize authentication** - Adapt to your user model and flows
3. **Add your features** - Build your specific application logic
4. **Style your app** - Apply your brand and design system
5. **Test thoroughly** - Test all authentication flows
6. **Deploy** - Set up CI/CD and deploy to production

## 🎯 Best Practices

- Keep types updated as you add features
- Use Redux slices for different domains
- Maintain clean component hierarchy
- Follow TypeScript best practices
- Write meaningful component names
- Keep API layer organized
- Use environment variables for configuration
- Document custom additions

## 🆘 Common Issues

### Build Errors
- Check TypeScript errors with `npm run type-check`
- Ensure all imports are correct
- Verify environment variables are set

### Authentication Issues
- Verify backend API endpoints
- Check token format and expiration
- Ensure CORS is configured on backend

### Redux State Issues
- Check reducer registration
- Verify action types
- Use Redux DevTools for debugging

---

**Happy building!** 🎉 