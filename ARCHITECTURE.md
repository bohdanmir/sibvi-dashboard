# Architecture Definition Document

## Project Overview
This document defines the architectural patterns, best practices, and guidelines for the SIBVI dashboard application.

## Technology Stack
- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Charts**: Recharts library
- **State Management**: React Context API
- **TypeScript**: Strict mode enabled

## Core Architectural Principles

### 1. React Component Guidelines

#### Key Prop Management
**Problem**: React requires unique `key` props for elements in lists to properly track and update components during re-renders.

**Solution Pattern**: Always provide unique, stable keys for components rendered in arrays or lists.

**Implementation Examples**:
```tsx
// ✅ Correct: Unique keys for each Line component
<Line key="historical" dataKey="historical" />
{forecasts.map(forecast => (
  <Line key={`forecast-${forecast.id}`} dataKey={`forecast_${forecast.id}`} />
))}

// ❌ Incorrect: Missing or duplicate keys
<Line dataKey="historical" />
{forecasts.map(forecast => (
  <Line key={forecast.id} dataKey={`forecast_${forecast.id}`} />
))}
```

**Key Naming Convention**:
- Use descriptive prefixes: `historical`, `forecast-{id}`, `chart-{type}`
- Ensure uniqueness across the entire component tree
- Avoid using array indices as keys unless the list is static

**Common Pitfalls**:
- Missing keys in map functions
- Using non-unique values as keys
- Changing keys between renders

### 2. Component Structure

#### Chart Components
- Use `"use client"` directive for interactive components
- Implement proper loading states and error boundaries
- Separate data fetching logic from presentation logic
- Use React Context for shared state (dataset selection, theme)

#### UI Components
- Build custom components using Tailwind CSS
- Follow Apple's design guidelines for spacing and typography
- Implement responsive design patterns
- Use semantic HTML elements

### 3. Data Flow Architecture

#### Data Fetching Pattern
```tsx
// 1. Load metadata first (analyses, file info)
// 2. Check data availability
// 3. Load actual data (CSV, forecasts)
// 4. Combine and process data
// 5. Update state once all data is ready
```

#### State Management
- Use React Context for global state (selected dataset, theme)
- Local state for component-specific data
- Avoid prop drilling by using context appropriately

### 4. Performance Considerations

#### Chart Rendering
- Implement proper loading states to prevent layout shifts
- Use `React.memo` for expensive chart components
- Debounce user interactions (time range changes)
- Lazy load chart data when possible

#### Data Processing
- Process data in useEffect to avoid blocking render
- Use proper dependency arrays in useEffect hooks
- Implement error boundaries for data loading failures

### 5. Error Handling

#### Data Loading Errors
- Graceful fallbacks for missing data
- User-friendly error messages
- Retry mechanisms for failed requests
- Logging for debugging purposes

#### Component Errors
- Error boundaries for chart components
- Validation of data structure before rendering
- Fallback UI for broken components

## File Organization

```
/
├── app/                    # Next.js app directory
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── chart-*.tsx       # Chart-specific components
├── lib/                   # Utility functions and context
├── hooks/                 # Custom React hooks
└── public/                # Static assets and data
```

## Development Guidelines

### Code Quality
- Use TypeScript strict mode
- Implement proper error handling
- Add loading states for all async operations
- Use semantic variable names

### Testing Strategy
- Unit tests for utility functions
- Integration tests for chart components
- E2E tests for critical user flows

### Performance Monitoring
- Monitor chart render times
- Track data loading performance
- Optimize bundle size with code splitting

## Common Issues and Solutions

### Issue: React Key Prop Warnings
**Symptoms**: Console errors about missing keys in lists
**Solution**: Ensure all mapped components have unique, stable keys
**Prevention**: Code review checklist includes key prop verification

### Issue: Chart Flickering
**Symptoms**: Charts flash between different states
**Solution**: Load all data before rendering, use proper loading states
**Prevention**: Implement data loading orchestration

### Issue: Memory Leaks
**Symptoms**: Performance degradation over time
**Solution**: Proper cleanup in useEffect hooks
**Prevention**: Use AbortController for fetch requests

## Future Considerations

### Scalability
- Implement virtual scrolling for large datasets
- Add data caching strategies
- Consider Web Workers for heavy data processing

### Accessibility
- Add ARIA labels for chart elements
- Implement keyboard navigation
- Ensure proper color contrast ratios

### Internationalization
- Prepare for multi-language support
- Use proper date formatting functions
- Implement RTL support if needed

---

*This document should be updated as the architecture evolves and new patterns emerge.*
