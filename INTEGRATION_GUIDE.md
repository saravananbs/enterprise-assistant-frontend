# E-Pilot Frontend - Unified Application Setup

## Project Structure
```
newfrontend/frontend/app/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx       (NEW - Enterprise landing page)
│   │   ├── LoginPage.tsx         (Login form)
│   │   └── ChatPage.tsx          (Chat interface)
│   ├── components/
│   │   ├── LoginModal.tsx        (Login modal - NEW)
│   │   ├── LoadingScreen.tsx     (Loading screen - NEW)
│   │   └── InterruptPanel.tsx    (Email approval panel)
│   ├── App.tsx                   (Updated routing)
│   ├── index.css                 (Updated global styles)
│   └── main.tsx
├── tailwind.config.js            (Updated with color utilities)
├── vite.config.ts
└── package.json
```

## Color Scheme (Unified Across Entire App)
- **Primary Gradient**: Blue (#3b82f6) → Purple (#8b5cf6)
- **Background**: Gradient (Blue 50 → White → Purple 50)
- **Text**: Gray palette (#111827 → #6b7280)
- **Borders**: Light gray (#e5e7eb)
- **Accent**: Green (#10b981)

## User Flow
1. **Landing Page (/)** - Enterprise overview & features
   - Users can click "Login" button
   - Redirects to login modal

2. **Login Modal** - Email verification & OTP
   - Shows on landing page
   - After successful login, shows loading screen
   - Redirects to chat interface

3. **Chat Interface (/chat)** - Main conversation & features
   - Sidebar with chat history
   - Message conversation area
   - Email drafting & interrupt panel

4. **Protected Routes**
   - Unauthenticated users redirected to landing page
   - Authenticated users redirected from landing page to chat

## How to Run

### Development
```bash
cd newfrontend/frontend/app
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port)

### Production Build
```bash
cd newfrontend/frontend/app
npm run build
npm run preview
```

## Color Consistency Updates Made
✅ LoginPage - Blue-purple gradient buttons & inputs with blue focus states
✅ ChatPage - Blue-purple gradient for active items & user messages
✅ LandingPage - Complete enterprise landing with consistent colors
✅ LoadingScreen - Gradient progress bar with animated logo
✅ LoginModal - Color-matched modal with gradient buttons
✅ InterruptPanel - Gray borders with gradient action buttons
✅ Global Styles (index.css) - Gradient background utilities
✅ Tailwind Config - Custom color palettes & gradient definitions

## To Push to Git
```bash
cd c:\FinalYearProject\IEA\newfrontend
git add .
git commit -m "Integrate landing page with unified color scheme"
git push origin main
```

## Notes
- All components now use consistent Tailwind classes
- The old `frontend` folder can be kept as backup or removed
- No external CSS files needed - all styles use Tailwind + inline gradients
- API endpoints configured in components (adjust as needed)
- All authentication handled through the unified LoginModal
