# Performance Optimization Guide - RockReach Platform

## Table of Contents
1. [Redis Caching Strategy](#redis-caching-strategy)
2. [Debounced Updates](#debounced-updates)
3. [Optimistic UI Updates](#optimistic-ui-updates)
4. [Smart Re-rendering Prevention](#smart-re-rendering-prevention)
5. [Cache-First HTTP Strategy](#cache-first-http-strategy)
6. [React Performance Patterns](#react-performance-patterns)
7. [Database Query Optimization](#database-query-optimization)
8. [Additional Optimization Techniques](#additional-optimization-techniques)

---

## 🚀 Redis Caching Strategy

### What is Redis?
Redis is an in-memory data store that acts as a cache between your application and database. It's extremely fast (sub-millisecond response times) because data is stored in RAM.

### Implementation in Our Project

**File**: `app/api/assistant/conversations/route.ts`

```typescript
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

// Example: Single conversation caching
const cacheKey = `conversation:${userId}:${conversationId}`;

// Try cache first
let conversation = await cacheGet(cacheKey);

if (!conversation) {
  // Cache MISS - fetch from MongoDB
  conversation = await getConversation(conversationId, userId);
  
  if (conversation) {
    // Store in cache for 10 minutes (600 seconds)
    await cacheSet(cacheKey, conversation, 600);
  }
}

// Example: Conversations list caching
const listCacheKey = `conversations:${userId}`;
let conversations = await cacheGet(listCacheKey);

if (!conversations) {
  conversations = await getConversations(userId, orgId);
  // Cache for 3 minutes (180 seconds)
  await cacheSet(listCacheKey, conversations, 180);
}
```

### Cache Invalidation

**When to invalidate cache:**
- User updates conversation (PATCH)
- User deletes conversation (DELETE)
- User creates new conversation (POST)

```typescript
// Invalidate both single and list caches
await cacheDel(`conversation:${userId}:${id}`);
await cacheDel(`conversations:${userId}`);
```

### Cache TTL Strategy

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Single conversation | 10 min | Content rarely changes |
| Conversations list | 3 min | More frequent updates |
| User session | 1 hour | Security balance |
| Static data | 1 day | Almost never changes |

### Key Learnings

1. **Cache keys must be unique**: Use composite keys like `resource:userId:resourceId`
2. **Set appropriate TTLs**: Balance freshness vs performance
3. **Always invalidate on writes**: Prevent stale data
4. **Handle cache misses gracefully**: Always have DB fallback

---

## ⏱️ Debounced Updates

### What is Debouncing?
Debouncing delays function execution until after a specified time has passed since the last call. Perfect for batching rapid updates.

### Problem We Solved

**Before:**
```typescript
// Every AI response triggered immediate fetch
onFinish: async () => {
  await fetchConversations(); // DB query!
}
// Result: If 3 messages in 5 seconds = 3 DB queries
```

**After:**
```typescript
// Set a flag instead
onFinish: () => {
  setShouldRefreshConversations(true); // Just set flag
}

// Debounced effect watches the flag
useEffect(() => {
  if (shouldRefreshConversations) {
    const timer = setTimeout(() => {
      fetchConversations(false); // Single query after 1.5s
      setShouldRefreshConversations(false);
    }, 1500);
    
    return () => clearTimeout(timer); // Cancel if new update comes
  }
}, [shouldRefreshConversations, fetchConversations]);

// Result: 3 messages in 5 seconds = 1 DB query
```

### Debounce vs Throttle

| Pattern | Behavior | Use Case |
|---------|----------|----------|
| **Debounce** | Waits for pause in events | Search input, window resize |
| **Throttle** | Limits to once per interval | Scroll events, API rate limiting |

### Example: Search Input Debouncing

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 500); // Wait 500ms after user stops typing
  
  return () => clearTimeout(timer);
}, [searchQuery]);

// Use debouncedQuery for API call
useEffect(() => {
  if (debouncedQuery) {
    searchAPI(debouncedQuery);
  }
}, [debouncedQuery]);
```

### Custom Debounce Hook

```typescript
import { useEffect, useState } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const searchQuery = useDebounce(inputValue, 500);
```

---

## 🎨 Optimistic UI Updates

### What is Optimistic UI?
Update the UI immediately as if the operation succeeded, then sync with server in background. If it fails, revert the change.

### Implementation in Chat

**File**: `app/c/chat-client.tsx`

```typescript
onFinish: () => {
  // 1. OPTIMISTIC UPDATE - Update UI immediately
  setConversations((prev) =>
    prev.map((c) => {
      if (c.id === activeConvId) {
        // Extract title from first message
        const shouldUpdateTitle = formattedMessages.length === 2 && c.title === "New chat";
        const newTitle = shouldUpdateTitle 
          ? formattedMessages[0].parts.find(p => p.type === 'text')?.text?.slice(0, 50) || "New chat"
          : c.title;
        
        return { 
          ...c, 
          title: newTitle,
          messages: formattedMessages, // Update messages immediately
          createdAt: c.createdAt || Date.now()
        };
      }
      return c;
    }),
  );

  // 2. BACKGROUND SYNC - Verify with server later
  setShouldRefreshConversations(true);
}
```

### Complete Optimistic Update Pattern

```typescript
const updateItem = async (id: string, newData: any) => {
  // 1. Store original data for rollback
  const originalItem = items.find(item => item.id === id);
  
  // 2. Update UI optimistically
  setItems(prev => prev.map(item => 
    item.id === id ? { ...item, ...newData } : item
  ));
  
  try {
    // 3. Sync with server
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(newData)
    });
  } catch (error) {
    // 4. ROLLBACK on error
    setItems(prev => prev.map(item =>
      item.id === id ? originalItem : item
    ));
    toast.error('Update failed - changes reverted');
  }
};
```

### When to Use Optimistic UI

✅ **Good for:**
- Social interactions (likes, follows)
- Text edits (chat messages, comments)
- Simple CRUD operations
- Non-critical updates

❌ **Bad for:**
- Financial transactions
- Inventory updates
- Authentication changes
- Irreversible actions

---

## 🔄 Smart Re-rendering Prevention

### The Problem
React re-renders components when state changes, even if the actual data is identical.

### Solution: Deep Comparison

**File**: `app/c/chat-client.tsx`

```typescript
const fetchConversations = useCallback(async (showLoading = true) => {
  const res = await fetch("/api/assistant/conversations");
  const data = await res.json();
  
  // Only update if data actually changed
  setConversations((prev) => {
    // Compare only relevant fields
    const hasChanged = JSON.stringify(prev.map(c => ({ id: c.id, title: c.title }))) !== 
                       JSON.stringify(data.map((c: Conversation) => ({ id: c.id, title: c.title })));
    
    return hasChanged ? data : prev; // Same reference = no re-render
  });
}, []);
```

### React.memo for Component Optimization

```typescript
import { memo } from 'react';

// Component re-renders only if props change
export const MessageBubble = memo(function MessageBubble({ message, onCopy }) {
  return (
    <div className="message">
      {message.text}
      <button onClick={onCopy}>Copy</button>
    </div>
  );
});

// Custom comparison function
export const ExpensiveComponent = memo(
  function ExpensiveComponent({ data }) {
    // Heavy computation
    return <div>{/* render */}</div>;
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.data.id === nextProps.data.id;
  }
);
```

### useMemo for Expensive Calculations

```typescript
const expensiveValue = useMemo(() => {
  // This only recalculates when 'data' changes
  return data.map(item => /* heavy computation */).filter(/* ... */);
}, [data]);
```

### useCallback for Function Stability

```typescript
// Without useCallback - new function every render
const handleClick = () => {
  doSomething(value);
};

// With useCallback - same function reference
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]); // Only recreate if 'value' changes
```

---

## 🌐 Cache-First HTTP Strategy

### HTTP Caching Headers

```typescript
fetch("/api/assistant/conversations", {
  headers: {
    // Browser caches for 60 seconds
    'Cache-Control': 'max-age=60',
  },
});
```

### Cache Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Cache-First** | Serve from cache, fallback to network | Static assets |
| **Network-First** | Try network, fallback to cache | Dynamic content |
| **Stale-While-Revalidate** | Serve cache immediately, update in background | Best of both worlds |

### Implementing SWR Pattern

```typescript
const useSWR = (key: string, fetcher: Function) => {
  const [data, setData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // 1. Serve from cache immediately
    const cached = localStorage.getItem(key);
    if (cached) {
      setData(JSON.parse(cached));
    }

    // 2. Revalidate in background
    setIsValidating(true);
    fetcher()
      .then((fresh: any) => {
        setData(fresh);
        localStorage.setItem(key, JSON.stringify(fresh));
      })
      .finally(() => setIsValidating(false));
  }, [key]);

  return { data, isValidating };
};

// Usage
const { data: conversations, isValidating } = useSWR(
  'conversations',
  () => fetch('/api/conversations').then(r => r.json())
);
```

---

## ⚛️ React Performance Patterns

### 1. Code Splitting with React.lazy

```typescript
import { lazy, Suspense } from 'react';

// Heavy component loaded only when needed
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

### 2. Virtual Scrolling for Long Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function LongList({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.index}>
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. useTransition for Non-Blocking Updates

```typescript
import { useState, useTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value); // Immediate update
    
    // Mark expensive update as low priority
    startTransition(() => {
      const filtered = hugeDataset.filter(item => 
        item.name.includes(value)
      );
      setResults(filtered);
    });
  };

  return (
    <>
      <input value={query} onChange={e => handleSearch(e.target.value)} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </>
  );
}
```

### 4. Avoid Inline Object/Array Creation

```typescript
// ❌ Bad - Creates new object every render
<Component style={{ margin: 10 }} data={[1, 2, 3]} />

// ✅ Good - Define outside or use useMemo
const style = { margin: 10 };
const data = [1, 2, 3];
<Component style={style} data={data} />

// ✅ Or use useMemo for dynamic values
const style = useMemo(() => ({ margin: someValue }), [someValue]);
```

---

## 🗄️ Database Query Optimization

### 1. Indexes

```typescript
// MongoDB indexes for faster queries
await collection.createIndex({ userId: 1, createdAt: -1 });
await collection.createIndex({ orgId: 1, "messages.id": 1 });
```

### 2. Projection (Select Only Needed Fields)

```typescript
// ❌ Bad - Fetches entire documents
const conversations = await db.collection('conversations')
  .find({ userId })
  .toArray();

// ✅ Good - Only fetch needed fields
const conversations = await db.collection('conversations')
  .find({ userId })
  .project({ title: 1, createdAt: 1, id: 1 }) // Exclude messages array
  .toArray();
```

### 3. Aggregation Pipeline

```typescript
// Efficient stats query
const stats = await db.collection('conversations').aggregate([
  { $match: { userId } },
  { $group: {
    _id: null,
    total: { $sum: 1 },
    totalMessages: { $sum: { $size: "$messages" } }
  }}
]).toArray();
```

### 4. Batch Operations

```typescript
// ❌ Bad - Multiple DB calls
for (const lead of leads) {
  await db.collection('leads').insertOne(lead);
}

// ✅ Good - Single bulk operation
await db.collection('leads').insertMany(leads);
```

---

## 🎯 Additional Optimization Techniques

### 1. Request Batching (GraphQL-style)

```typescript
// Batch multiple API requests into one
const batchFetch = async (requests: string[]) => {
  const response = await fetch('/api/batch', {
    method: 'POST',
    body: JSON.stringify({ requests })
  });
  return response.json();
};

// Usage
const [users, posts, comments] = await batchFetch([
  '/api/users',
  '/api/posts',
  '/api/comments'
]);
```

### 2. Streaming Responses

```typescript
// Server-Side Events for real-time updates
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send data progressively
      controller.enqueue(encoder.encode('data: chunk1\n\n'));
      setTimeout(() => {
        controller.enqueue(encoder.encode('data: chunk2\n\n'));
        controller.close();
      }, 1000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  });
}
```

### 3. Service Workers for Offline Support

```typescript
// public/sw.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      // Cache miss - fetch from network
      return fetch(event.request);
    })
  );
});
```

### 4. Image Optimization

```typescript
// Next.js Image component (auto-optimizes)
import Image from 'next/image';

<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  loading="lazy" // Lazy load below fold
  quality={75} // Reduce quality slightly
/>
```

### 5. Bundle Size Optimization

```typescript
// Dynamic imports
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <Spinner />,
  ssr: false // Don't include in server bundle
});

// Tree shaking - import only what you need
import { debounce } from 'lodash'; // ❌ Imports entire lodash
import debounce from 'lodash/debounce'; // ✅ Only debounce function
```

### 6. Web Workers for Heavy Computation

```typescript
// worker.ts
self.addEventListener('message', (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
});

// main.ts
const worker = new Worker('/worker.js');
worker.postMessage(largeDataset);
worker.onmessage = (e) => {
  console.log('Result:', e.data);
};
```

### 7. Intersection Observer for Lazy Loading

```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadMoreData();
      observer.unobserve(entry.target);
    }
  });
});

// Observe bottom of list
const sentinel = document.querySelector('#list-bottom');
observer.observe(sentinel);
```

### 8. Prefetching Critical Resources

```typescript
// Next.js Link prefetch
<Link href="/dashboard" prefetch={true}>
  Dashboard
</Link>

// Manual prefetch
useEffect(() => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = '/api/user-data';
  document.head.appendChild(link);
}, []);
```

---

## 📊 Performance Metrics to Track

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4s | > 4s |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

### Monitoring Performance

```typescript
// Performance Observer API
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});

observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });

// React Profiler
import { Profiler } from 'react';

<Profiler id="ChatClient" onRender={(id, phase, actualDuration) => {
  console.log(`${id} took ${actualDuration}ms to ${phase}`);
}}>
  <ChatClient />
</Profiler>
```

---

## 🎓 Learning Resources

### Books
- **"Web Performance in Action"** by Jeremy Wagner
- **"High Performance Browser Networking"** by Ilya Grigorik
- **"React Performance Optimization"** by Kent C. Dodds

### Courses
- **web.dev/fast** - Google's web performance course
- **React Performance** on Frontend Masters
- **Database Indexing for Performance** on Udemy

### Tools
- **Chrome DevTools Performance Tab**
- **Lighthouse** for audits
- **React DevTools Profiler**
- **Bundle Analyzer** for Next.js/Webpack

### Practice Projects
1. Build a Twitter clone with infinite scroll
2. Create a real-time dashboard with WebSockets
3. Implement a full-text search with debouncing
4. Build a file upload with progress tracking

---

## 🚀 Performance Checklist

### Before Deployment

- [ ] Enable Redis caching for frequently accessed data
- [ ] Add database indexes for common queries
- [ ] Implement debouncing for user inputs
- [ ] Use optimistic UI for instant feedback
- [ ] Add React.memo to expensive components
- [ ] Enable gzip/brotli compression
- [ ] Optimize images (WebP, lazy loading)
- [ ] Code split large bundles
- [ ] Add error boundaries for graceful failures
- [ ] Monitor Core Web Vitals
- [ ] Set up performance budgets
- [ ] Test on slow 3G network

---

## 🎯 Summary

**Key Takeaways:**

1. **Cache aggressively** - Use Redis, browser cache, and memoization
2. **Update optimistically** - Don't wait for server responses
3. **Debounce everything** - Batch rapid events into single operations
4. **Prevent re-renders** - Use React.memo, useMemo, useCallback
5. **Measure everything** - You can't improve what you don't measure

**Golden Rule:**
> "Premature optimization is the root of all evil, but measured optimization is the path to excellence."

Profile first, optimize second. Focus on the 20% of code that causes 80% of performance issues.

---

*Last Updated: November 19, 2025*
*Project: RockReach Platform*
