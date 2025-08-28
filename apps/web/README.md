# Interview Platform Web App

A modern, customizable interview platform built with Next.js 14, Tailwind CSS, and Supabase.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Database**: Supabase
- **State Management**: Zustand
- **Type Safety**: TypeScript
- **Form Validation**: Zod

## Project Structure

```
apps/web/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/         # Reusable UI components
│   ├── config/            # Site configuration
│   ├── lib/              # Utility functions and hooks
│   └── styles/           # Global styles
```

## Customization Guide

### Editing Pages

Pages are located in `apps/web/src/app/` following Next.js App Router conventions:

- `page.tsx` - Landing page
- `candidate/page.tsx` - Candidate interview page
- `employer/page.tsx` - Employer dashboard
- `hr/page.tsx` - HR review dashboard

Each page is a React component that can be edited like any standard React component.

### Adjusting Styles

The project uses Tailwind CSS for styling:

1. **Global Styles**: Edit `src/app/globals.css`
2. **Tailwind Config**: Customize `tailwind.config.js` for:
   - Colors
   - Fonts
   - Breakpoints
   - Custom utilities

Example of adding a custom color:
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'custom-blue': '#1234ff',
      },
    },
  },
}
```

### Customizing Components

UI components are located in `apps/web/src/components/`:

1. **Base Components**: `src/components/ui/` contains shadcn/ui components
2. **Feature Components**: `src/components/` contains app-specific components

To modify a component:
1. Find the component file
2. Edit the JSX/TSX code
3. Adjust Tailwind classes for styling
4. Components use CSS variables for theming

### Changing Content

Site content is managed through a configuration file:

1. Open `src/config/site.ts`
2. Edit the `siteContent` object:
   ```typescript
   export const siteContent = {
     site: {
       name: 'Your Platform Name',
       description: 'Your description',
     },
     landing: {
       hero: {
         title: 'Your headline',
         subtitle: 'Your subheadline',
       },
       // ... more content
     },
   }
   ```

The configuration is type-safe and validated at runtime.

### Tenant Theming

Each tenant can have their own theme:

1. **Default Theme**: Set in `src/config/site.ts`
   ```typescript
   theme: {
     colors: {
       primary: '#2563eb',
       background: '#ffffff',
       text: '#111827',
     }
   }
   ```

2. **Per-Tenant Override**: In Supabase database:
   ```sql
   update tenants
   set theme = jsonb_set(theme, '{colors}', '{"primary": "#0000ff"}')
   where id = 'tenant-id';
   ```

3. **Theme Variables**: CSS variables are automatically updated:
   ```css
   :root {
     --color-primary: #2563eb;
     --color-background: #ffffff;
     --color-text: #111827;
   }
   ```

4. **Using Theme Colors**:
   ```tsx
   // In components
   <div className="bg-primary text-primary-foreground">
     Themed content
   </div>
   ```

### Adding Images

1. Place images in `public/images/`
2. Reference in content config:
   ```typescript
   hero: {
     image: {
       src: '/images/your-image.svg',
       alt: 'Description',
     }
   }
   ```

### Development Workflow

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Make changes to files
3. Changes are reflected immediately in development
4. Run type checking:
   ```bash
   npm run type-check
   ```

5. Run linting:
   ```bash
   npm run lint
   ```

### Environment Variables

Required environment variables:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## License

MIT
