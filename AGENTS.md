# AGENTS.md

## 🚨 CRITICAL AI BEHAVIOR RULES - READ FIRST

### MOBILE APP DEVELOPMENT RULE (CRITICAL)
**🚨 ALWAYS BUILD AND SYNC AFTER CODE CHANGES**
- iOS apps load from `dist` folder, NOT source files
- After ANY code change: `npm run build && npx cap sync ios`
- After ANY code change: `npm run build && npx cap sync android`
- NEVER assume changes are visible without rebuilding
- If changes aren't showing: BUILD AND SYNC FIRST before debugging

### SCOPE CONTROL (MOST IMPORTANT)
**These rules override everything else. Follow them religiously or face consequences.**

1. **DO EXACTLY WHAT IS ASKED - NOTHING MORE**
   - If asked to "change button color to blue", ONLY change that button's color
   - DO NOT refactor surrounding code
   - DO NOT add "improvements" unless explicitly asked
   - DO NOT touch other components "while you're at it"
   - DO NOT reorganize file structure
   - DO NOT optimize code that's working

2. **SIMPLE UI FIX = SIMPLE CHANGE**
   - UI fixes should typically touch 1-3 lines of code
   - If you think you need to change more, ASK FIRST
   - Tailwind class changes should not require logic changes
   - Style changes should not require state changes
   - Button fixes should not require hook refactoring

3. **ONE FILE AT A TIME (unless explicitly asked)**
   - If the request mentions one component, edit ONE file
   - DO NOT "fix" other files you notice while reading
   - DO NOT update related components for "consistency"
   - DO NOT touch utils/hooks unless the request says to

4. **ASK BEFORE EXPANDING SCOPE**
   - If a "simple fix" requires touching 3+ files, STOP and ASK
   - If you need to change logic + UI, EXPLAIN WHY and ASK
   - If you see something broken, ASK before fixing it
   - If you think refactoring would help, ASK first

5. **NEVER BREAK WORKING CODE**
   - Read the ENTIRE file before making changes
   - Understand the current implementation
   - Test your change mentally before applying
   - If unsure, ASK rather than guess

6. **RED FLAGS - STOP IF YOU'RE DOING THESE:**
   - ❌ Changing imports when not asked
   - ❌ Moving components to new files
   - ❌ Renaming variables/functions
   - ❌ Adding new dependencies
   - ❌ Refactoring logic when asked for UI change
   - ❌ "Modernizing" or "cleaning up" code
   - ❌ Changing multiple components for "consistency"
   - ❌ Adding error handling not in the request
   - ❌ Optimizing performance not in the request

### EXAMPLE OF CORRECT BEHAVIOR

**❌ WRONG:**
```
User: "Change the login button to be purple"
AI: *Changes button color, refactors Auth component to use custom hook, 
     updates 3 other components for consistency, adds loading states, 
     improves error handling, updates tests*
```

**✅ CORRECT:**
```
User: "Change the login button to be purple"
AI: *Changes className="bg-blue-600" to className="bg-violet-600" 
     in ONE line of Auth.tsx*
```

### SCOPE ESCALATION PROTOCOL

If a request seems to require more than a simple fix:

1. **STOP** - Don't start coding
2. **EXPLAIN** - "This change would require modifying X, Y, and Z because..."
3. **ASK** - "Do you want me to proceed with all these changes, or find a simpler approach?"
4. **WAIT** - Get explicit approval before expanding scope

---

## Project Overview

**PocketTeller** - AI-powered personal finance management app
- **Type:** Full-stack SaaS application (Web + Mobile)
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Mobile:** Capacitor (iOS + Android)
- **AI:** Google Gemini API for financial coaching
- **Payments:** Stripe for subscriptions

---

## 📚 Platform-Specific Guides

**For detailed platform documentation, see:**

- **📱 iOS:** `iOS_PRODUCTION_GUIDE.md` - Complete iOS setup, troubleshooting, and best practices
- **🤖 Android:** `ANDROID_PRODUCTION_GUIDE.md` - Complete Android setup, build process, and debugging
- **🌐 Web:** This file (AGENTS.md) - Web development guidelines

**Quick Links:**
- iOS build issues? → See `iOS_PRODUCTION_GUIDE.md`
- Android build issues? → See `ANDROID_PRODUCTION_GUIDE.md`
- General coding standards? → Continue reading below

## 🎨 Design Integration

**Figma MCP (Model Context Protocol):**
- **Setup Guide:** `docs/FIGMA_MCP_SETUP.md` - Complete Figma integration setup
- **Quick Start:** `FIGMA_MCP_QUICK_START.md` - Fast setup instructions
- **Features:** Access Figma designs, extract components, generate code from designs
- **Status:** ✅ Configured (requires personal access token)

With Figma MCP, AI can:
- Read Figma design files directly
- Extract design specifications and components
- Generate React/HTML/CSS code from designs
- Access design tokens (colors, typography, spacing)
- Implement designs accurately in code

## Setup Commands

**Install dependencies:**
```bash
npm install
```

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Run tests:**
```bash
npm run test
```

**Mobile app sync:**
```bash
npx cap sync
```

**Build Android:**
```bash
cd android && ./gradlew assembleDebug
```

**Build iOS:**
```bash
cd ios && xcodebuild
```

## Code Style & Standards

### Critical Rules
- **NO LOCALHOST ANYWHERE**: This is production code only. No localhost references in any code files.
- **Production URLs Only**: Use production domains (pocketbanker.app, supabase.co) in all configurations
- **No Development Fallbacks**: No conditional localhost allowances or dev-mode switches

### TypeScript
- Use TypeScript strict mode
- Explicit return types for all functions
- No `any` types - use proper typing
- Prefer interfaces over types for object shapes

### React Patterns
- Functional components only (no class components)
- Use hooks for state and effects
- Custom hooks should start with `use`
- Lazy load route components with React.lazy()

### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.tsx`)
- Utilities: camelCase (`formatCurrency.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Styling
- Tailwind CSS for all styling
- Use `cn()` utility for conditional classes
- Follow existing color scheme (violet primary: #7C3AED)
- Mobile-first responsive design

### File Organization
```
src/
├── components/     # Reusable UI components
├── pages/          # Route pages
├── hooks/          # Custom React hooks
├── utils/          # Pure utility functions
├── types/          # TypeScript type definitions
├── contexts/       # React contexts
└── integrations/   # Third-party integrations
```

## Architecture Principles

### State Management
- React Query for server state
- React Context for global client state
- Local state with useState for component-specific state
- Session storage for temporary data

### Authentication Flow
- Supabase Auth for user management
- Protected routes use `<ProtectedRoute>` wrapper
- Demo mode available via `useDemo()` hook
- Auth state managed by `AuthProvider`

### Routing
- React Router v6 for navigation
- Lazy loaded routes for performance
- Protected routes redirect to `/auth` if not authenticated
- **Mobile apps should land on `/auth` not `/` (hero page)**

### Data Fetching
- React Query for caching and mutations
- Supabase client for database queries
- Edge Functions for complex operations
- Optimistic updates where appropriate

## Testing Instructions

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

### Before Committing
```bash
npm run lint && npm run type-check && npm run test
```

## Environment Variables

**Required for development:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Optional:**
```env
VITE_APP_STORE_URL=https://apps.apple.com/...
VITE_PLAY_STORE_URL=https://play.google.com/...
```

## Supabase Edge Functions

### Deployment
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name
```

### Required Secrets
```bash
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set STRIPE_SECRET_KEY=your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_key
```

### Edge Functions List
- `gemini-chat` - AI financial coaching
- `ai-categorize-transactions` - Auto-categorize transactions
- `ai-spending-insights` - Generate spending insights
- `plaid-link-exchange` - Link bank accounts
- `plaid-sync` - Sync transactions
- `stripe-*` - Payment processing functions

## Security Considerations

### Critical Rules
- **NEVER** commit API keys or secrets
- **NEVER** expose Supabase service role key in client code
- **NEVER** use localhost or local IP addresses in code
- **ALWAYS** validate user input on server side
- **ALWAYS** use Row Level Security (RLS) in database
- **ALWAYS** sanitize user data before display
- **ALWAYS** use production URLs only (pocketbanker.app, supabase.co)

### RLS Policies
- Users can only access their own data
- Check `auth.uid()` in all policies
- No public INSERT/UPDATE/DELETE without auth

### API Keys
- Gemini API: Server-side only (Edge Functions)
- Stripe: Server-side only (Edge Functions)
- Supabase Anon Key: Client-side safe (RLS protected)

## Common Tasks

### Adding a New Page
1. Create component in `src/pages/PageName.tsx`
2. Add lazy import in `src/App.tsx`
3. Add route in `Routes` section
4. Wrap with `<ProtectedRoute>` if auth required

### Adding a New API Endpoint
1. Create function in `supabase/functions/function-name/index.ts`
2. Add to `supabase/config.toml`
3. Deploy: `supabase functions deploy function-name`
4. Set secrets if needed

### Database Migrations
1. Create migration: `supabase migration new migration_name`
2. Write SQL in generated file
3. Test locally: `supabase db reset`
4. Push to production: `supabase db push`

### Adding a UI Component
1. Check if shadcn/ui component exists
2. If not, create in `src/components/ComponentName.tsx`
3. Use Tailwind for styling
4. Export from component directory if reusable

## AI Integration Guidelines

### Gemini Chat (`gemini-chat` function)
- Financial coaching only - deny off-topic requests
- Log persistent off-topic attempts to `ai_incident_reports`
- Use structured prompts with user context
- Include financial data from database

### Transaction Categorization
- Priority: user > plaid > ai > auto
- Never overwrite user-defined categories
- Plaid data is authoritative over AI
- AI only categorizes "Other" transactions

## Mobile App (Capacitor)

### Important Mobile-Specific Rules
1. **Routing:** Mobile apps should land on `/auth` not `/` (marketing page)
2. **No Marketing Pages:** Skip hero/landing pages in mobile
3. **Direct to Auth:** Unauthenticated users → `/auth`
4. **Direct to Dashboard:** Authenticated users → `/home`
5. **Production URLs:** Use `ionic://app.pocketbanker.app` (iOS) and `https://app.pocketbanker.app` (Android)
6. **NO LOCALHOST:** Never use `capacitor://localhost` - always use production domain

### Building Mobile Apps

**Android:**
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

**iOS:**
```bash
npm run build
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios
cd ios/App && open App.xcworkspace
# Then in Xcode: Cmd+R
```

### iOS Production Configuration & Troubleshooting

**📚 DETAILED GUIDE:** See `iOS_PRODUCTION_GUIDE.md` for complete iOS documentation

**CRITICAL iOS FIXES (October 2025):**

1. **✅ Production URLs (NO LOCALHOST)**
   ```typescript
   // capacitor.config.ts
   server: {
     hostname: 'app.pocketbanker.app',  // ✅ PRODUCTION ONLY
     iosScheme: 'ionic',                 // ✅ Results in ionic://app.pocketbanker.app
   }
   ```

2. **✅ Database Column Names**
   - Use `available_balance` NOT `balance_available`
   - Use `current_balance` NOT `balance_current`
   - ALWAYS check database schema for exact column names

3. **✅ Function Definition Order**
   - Define functions BEFORE useEffect that uses them
   - Prevents "Cannot access uninitialized variable" errors

4. **✅ Console Logs on Native**
   ```typescript
   // src/utils/consoleCleanup.ts
   const isNativePlatform = Capacitor.isNativePlatform();
   const shouldDisableConsole = import.meta.env.PROD && !isNativePlatform;
   ```

5. **✅ Auth Flow Timing**
   ```typescript
   // Wait for authLoading complete before redirect
   if (user && !authLoading) {
     setTimeout(() => navigate('/home'), 100);
   }
   ```

**CORRECT iOS Configuration (Capacitor 7 + iOS 13+):**

```xml
<!-- ✅ REQUIRED - UIScene Configuration -->
<key>UIApplicationSceneManifest</key>
<dict>
    <key>UIApplicationSupportsMultipleScenes</key>
    <false/>
    <key>UISceneConfigurations</key>
    <dict>
        <key>UIWindowSceneSessionRoleApplication</key>
        <array>
            <dict>
                <key>UISceneConfigurationName</key>
                <string>Default Configuration</string>
                <key>UISceneDelegateClassName</key>
                <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
            </dict>
        </array>
    </dict>
</dict>

<!-- ✅ REQUIRED - Launch screen -->
<key>UILaunchStoryboardName</key>
<string>LaunchScreen</string>
```

**Common Errors & Quick Fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| Cannot access uninitialized variable | Function used before defined | Move function definition up |
| column does not exist | Wrong column name | Check database schema |
| No console logs visible | Production build suppresses logs | Enable for native in consoleCleanup.ts |
| Error after login | Navigate too fast | Wait for authLoading complete |
| Black screen | JavaScript error or stale assets | Check Safari Web Inspector |

**Standard iOS Build & Test Process:**
```bash
# 1. Clean iOS assets
cd /Users/mr.adams/pockettellerxchanges/PocketTeller
rm -rf ios/App/App/public/*

# 2. Rebuild web app
npm run build

# 3. Sync with proper UTF-8 locale (fixes CocoaPods)
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios

# 4. If CocoaPods fails, reinstall
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..

# 5. Open in Xcode
cd ios/App && open App.xcworkspace
```

**Debug in Safari Web Inspector:**
1. Run app in Xcode (Cmd+R)
2. Safari → Develop → [Your Device] → PocketTeller
3. Check Console for JavaScript errors
4. Verify environment variables loaded
5. Look for Supabase initialization errors

**Debug Tools:**
- Safari Web Inspector (iOS): Safari → Develop → Simulator → PocketTeller
- Chrome DevTools (Android): chrome://inspect
- Xcode Console (iOS): Cmd+Shift+Y
- Android Logcat: `adb logcat | grep PocketTeller`

**Prevention Checklist:**
- [ ] `npm run build` succeeds before sync
- [ ] UTF-8 locale set for iOS (`export LANG=en_US.UTF-8`)
- [ ] Production URLs only (no localhost)
- [ ] Database column names match schema
- [ ] Functions defined before use in components
- [ ] Auth flow waits for loading complete

---

### Android Production Configuration

**📚 DETAILED GUIDE:** See `ANDROID_PRODUCTION_GUIDE.md` for complete Android documentation

**Quick Android Build:**
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Android URLs:** `https://app.pocketbanker.app` (HTTPS scheme)

---

## Troubleshooting

### Common Errors & Solutions

**📚 Full troubleshooting:** See platform-specific guides:
- `iOS_PRODUCTION_GUIDE.md` - Complete iOS documentation
- `ANDROID_PRODUCTION_GUIDE.md` - Complete Android documentation

| Error | Quick Fix |
|-------|-----------|
| Cannot access uninitialized variable | Move function definition before useEffect |
| column does not exist | Check database schema, use correct names |
| Black screen on mobile | Check Safari Web Inspector for JS errors |
| No console logs | Verify consoleCleanup.ts enables logs on native |
| Error after login | Add delay, wait for authLoading complete |
| Build fails | Clean: `rm -rf node_modules && npm install` |

### Supabase Connection Issues
1. Verify environment variables are set
2. Check Supabase project is running
3. Verify RLS policies allow access
4. Check network connectivity
5. Test in Supabase dashboard first

## Commit Guidelines

### Commit Message Format
```
[component] Brief description

Longer description if needed
- Bullet points for changes
- Keep it clear and concise
```

### Examples
```
[android] Fix black screen on mobile app launch

- Change routing to land on /auth for mobile
- Add Material Design 3 theme
- Update documentation

[backend] Add Stripe subscription webhooks

- Handle checkout.session.completed event
- Update subscriptions table
- Log events for debugging
```

### Before Push
```bash
npm run lint
npm run type-check
npm run test
npm run build
```

## PR Instructions

### PR Title Format
```
[Component] Brief description
```

### PR Checklist
- [ ] Code follows style guidelines
- [ ] All tests passing
- [ ] TypeScript errors resolved
- [ ] Linting passing
- [ ] Documentation updated
- [ ] Mobile app tested (if applicable)
- [ ] Database migrations included (if applicable)

### Required Reviews
- At least one approval required
- All CI checks must pass
- No merge conflicts

## Performance Guidelines

### Bundle Size
- Keep initial bundle < 500KB gzipped
- Lazy load routes and heavy components
- Use code splitting for large dependencies
- Tree-shake unused code

### Images
- Use WebP format when possible
- Lazy load images below fold
- Provide proper alt text
- Optimize before committing

### Database Queries
- Use indexes for frequently queried columns
- Limit results with pagination
- Use select() to fetch only needed columns
- Cache with React Query where appropriate

## Documentation Standards

### Code Comments
- Explain "why" not "what"
- Document complex algorithms
- Add JSDoc for public functions
- Keep comments up to date

### README Updates
- Update for new features
- Keep setup instructions current
- Document breaking changes
- Include troubleshooting steps

## Brand Guidelines

### Colors
- Primary: `#7C3AED` (Violet)
- Success: `#22C55E` (Green)
- Warning: `#F59E0B` (Amber)
- Error: `#EF4444` (Red)
- Info: `#3B82F6` (Blue)

### Typography
- Sans-serif system fonts
- Readable font sizes (16px minimum)
- Proper contrast ratios (WCAG AA)

### Tone
- Friendly and encouraging
- Professional but not stuffy
- Focus on financial empowerment
- Avoid jargon when possible

---

## Quick Reference

**Start coding:**
```bash
npm install && npm run dev
```

**Test everything:**
```bash
npm run lint && npm run type-check && npm run test
```

**Deploy backend:**
```bash
supabase functions deploy
```

**Build mobile:**
```bash
npm run build && npx cap sync
```

---

*Last updated: October 12, 2025*  
*For questions, check `/docs` folder or ask the team*

