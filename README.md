# Interactive Carousel / Slider Component

A reusable, fully-featured carousel component built with React and TypeScript. Supports drag and swipe interactions on both desktop and mobile devices, with infinite looping, auto-slide, and smooth animations.

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **Yarn** or **npm**

### Installation

1. **Clone the repository** (or navigate to the project folder):
   ```bash
   cd HomeTestCocCoc
   ```

2. **Install dependencies**:
   ```bash
   # Using Yarn
   yarn install

   # Or using npm
   npm install
   ```

3. **Start the development server**:
   ```bash
   # Using Yarn
   yarn dev

   # Or using npm
   npm run dev
   ```

4. **Open in browser**: Navigate to `http://localhost:5173`

### Build for Production

```bash
# Using Yarn
yarn build

# Or using npm
npm run build
```

The production files will be output to the `dist/` directory.

---

## 📁 Project Structure

```
HomeTestCocCoc/
├── src/
│   ├── components/
│   │   └── Carousel/
│   │       ├── Carousel.tsx      # Main carousel component
│   │       ├── Carousel.css      # Carousel styles & animations
│   │       └── index.ts          # Clean exports
│   ├── App.tsx                   # Demo application
│   ├── App.css                   # App-level styles
│   ├── index.css                 # Global base styles
│   └── main.tsx                  # React entry point
├── public/                       # Static assets
├── index.html                    # HTML template
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
└── README.md                     # This file
```

### Key Files

| File | Purpose |
|------|---------|
| `Carousel.tsx` | Core component logic: infinite loop, drag/swipe handling, auto-slide, click prevention |
| `Carousel.css` | Visual styling, animations, responsive breakpoints, cursor states |
| `App.tsx` | Demo implementation with sample data |

---

## 🎯 Features

- ✅ **300×300px cards** in a **750px viewport** (shows 2.5 cards)
- ✅ **Auto-slide** every 3 seconds (right to left)
- ✅ **Pause on hover**
- ✅ **Mouse drag** (desktop) and **touch swipe** (mobile)
- ✅ **40px minimum drag** to trigger slide
- ✅ **Click to open** landing page
- ✅ **Infinite looping** (seamless, no flicker)
- ✅ **Prevents accidental clicks** while dragging
- ✅ **Fully responsive**
- ✅ **No third-party carousel/gesture libraries**

---

## 🖱️ Drag & Swipe Implementation

### Mouse Drag (Desktop)

The drag interaction is implemented using native mouse events without any external libraries:

```
┌─────────────────────────────────────────────────────────────────┐
│  User Action          →  Event Handler    →  State Update       │
├─────────────────────────────────────────────────────────────────┤
│  mousedown on track   →  handleMouseDown  →  isDragging = true  │
│                                              dragStartX = e.clientX
│                                              dragStartTime = now │
├─────────────────────────────────────────────────────────────────┤
│  mousemove (global)   →  handleMouseMove  →  dragOffset = deltaX│
│                                              hasDragged = true   │
├─────────────────────────────────────────────────────────────────┤
│  mouseup (global)     →  handleMouseUp    →  Calculate velocity │
│                                              Trigger slide if    │
│                                              deltaX >= 40px OR   │
│                                              velocity > 0.5      │
└─────────────────────────────────────────────────────────────────┘
```

**Key Implementation Details:**

1. **Global Event Listeners**: `mousemove` and `mouseup` are attached to `window` (not the carousel element) to ensure drag continues even if the cursor leaves the carousel bounds.

2. **Real-time Visual Feedback**: During drag, `dragOffset` is added to the CSS `transform`, with `transition: none` for instant response.

3. **Velocity Detection**: We track `dragStartTime` and calculate velocity as `|deltaX| / deltaTime`. Fast flicks (velocity > 0.5) trigger slides even if distance < 40px.

```typescript
// From Carousel.tsx - Mouse event handlers
const handleMouseDown = (e: React.MouseEvent) => {
  if (e.button !== 0) return; // Only left click
  e.preventDefault();
  setIsDragging(true);
  setHasDragged(false);
  dragStartX.current = e.clientX;
  dragStartTime.current = Date.now();
};

const handleMouseUp = useCallback((e: MouseEvent) => {
  const deltaX = e.clientX - dragStartX.current;
  const deltaTime = Date.now() - dragStartTime.current;
  const velocity = Math.abs(deltaX) / deltaTime;
  
  // Trigger slide if distance OR velocity threshold met
  const shouldSlide = Math.abs(deltaX) >= minDragDistance || velocity > 0.5;
  
  if (shouldSlide) {
    deltaX > 0 ? slidePrev() : slideNext();
  }
}, [minDragDistance, slideNext, slidePrev]);
```

### Touch Swipe (Mobile)

Touch interactions mirror the mouse implementation but use Touch Events:

| Mouse Event | Touch Event | Notes |
|-------------|-------------|-------|
| `mousedown` | `touchstart` | `e.touches[0].clientX` for position |
| `mousemove` | `touchmove` | Attached globally with `{ passive: false }` |
| `mouseup` | `touchend` | Use `e.changedTouches[0]` for final position |

**Touch-Specific Considerations:**

```css
/* From Carousel.css */
.carousel-container {
  touch-action: pan-y pinch-zoom;  /* Allow vertical scroll, prevent horizontal */
  user-select: none;               /* Prevent text selection during swipe */
}
```

- `touch-action: pan-y pinch-zoom` allows vertical scrolling while the carousel captures horizontal swipes
- Touch events are added with `{ passive: false }` to allow `preventDefault()` if needed

---

## 🔄 Edge Case Handling

### 1. Infinite Loop (Seamless Cycling)

The infinite loop is achieved by **cloning slides** at both ends:

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Clone 5,6] [1] [2] [3] [4] [5] [6] [Clone 1,2]                     │
│       ↑                                    ↑                         │
│   Clone of END                        Clone of START                 │
└──────────────────────────────────────────────────────────────────────┘
```

**How it works:**

1. **Extended Array**: We prepend clones of the last N slides and append clones of the first N slides (where N = viewport width / card width + 1).

2. **Initial Position**: Start at the first "real" slide (index = cloneCount).

3. **Seamless Jump**: When a transition ends at a clone, we instantly (no animation) jump to the corresponding real slide:

```typescript
// From Carousel.tsx - handleTransitionEnd
const handleTransitionEnd = useCallback(() => {
  setIsTransitioning(false);
  
  if (currentIndex < cloneCount) {
    // At cloned END items → jump to real END
    setCurrentIndex(currentIndex + items.length);
  } else if (currentIndex >= cloneCount + items.length) {
    // At cloned START items → jump to real START
    setCurrentIndex(currentIndex - items.length);
  }
}, [currentIndex, cloneCount, items.length]);
```

**Why no flicker?** The jump happens with `transition: none` (since `isTransitioning` is false), and the cloned slides look identical to the originals, making the repositioning invisible.

### 2. Preventing Clicks While Dragging

Users often accidentally click when releasing a drag. We prevent this with a `hasDragged` flag:

```typescript
// Set to true during drag if movement detected
if (Math.abs(deltaX) > 5) {
  setHasDragged(true);
}

// Click handler checks the flag
const handleCardClick = (item: CarouselItem) => {
  if (hasDragged) {
    return; // Block click after drag
  }
  window.open(item.landing_page, '_blank', 'noopener,noreferrer');
};

// Reset flag after short delay (allows CSS transitions to complete)
setTimeout(() => setHasDragged(false), 100);
```

**Threshold**: Movement > 5px sets `hasDragged = true`. This allows intentional clicks with minor hand tremor while blocking drag-releases.

### 3. Pause Auto-Slide on Hover

Auto-sliding is managed with `setInterval`, controlled by hover state:

```typescript
// From Carousel.tsx - Auto-slide effect
useEffect(() => {
  // Stop auto-slide if hovering OR dragging
  if (isHovering || isDragging) {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }
    return;
  }

  // Start auto-slide
  autoSlideTimerRef.current = setInterval(() => {
    slideNext();
  }, autoSlideInterval);

  // Cleanup on unmount or dependency change
  return () => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
    }
  };
}, [isHovering, isDragging, slideNext, autoSlideInterval]);
```

**Hover Detection:**
```tsx
<div
  className="carousel-container"
  onMouseEnter={() => setIsHovering(true)}
  onMouseLeave={() => setIsHovering(false)}
>
```

### 4. Cursor State for Draggable Indication

```css
/* From Carousel.css */
.carousel-container {
  cursor: grab;  /* Indicates draggable */
}

.carousel-container.is-dragging {
  cursor: grabbing;  /* Active drag state */
}

.carousel-container.is-dragging .carousel-card {
  cursor: grabbing;  /* Override card cursor during drag */
}
```

---

## 📱 Responsive Design

The carousel adapts to different screen sizes:

| Breakpoint | Behavior |
|------------|----------|
| > 850px | Full 750px viewport, arrows outside carousel |
| 600-850px | Full-width viewport, arrows inside carousel |
| < 600px | Single card view, compact indicators |

```css
@media (max-width: 850px) {
  .carousel-container {
    max-width: 100%;
    height: auto;
    aspect-ratio: 750 / 300;
  }
  .carousel-nav-prev { left: 10px; }
  .carousel-nav-next { right: 10px; }
}
```

---

## 🎨 Usage Example

```tsx
import { Carousel, CarouselItem } from './components/Carousel';

const items: CarouselItem[] = [
  {
    id: 1,
    title: "Slide 1",
    image: "https://picsum.photos/id/1015/600/600",
    landing_page: "https://example.com/page1"
  },
  // ... more items (minimum 3)
];

function App() {
  return (
    <Carousel
      items={items}
      autoSlideInterval={3000}  // Optional: default 3000ms
      minDragDistance={40}      // Optional: default 40px
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `CarouselItem[]` | required | Array of carousel items |
| `autoSlideInterval` | `number` | `3000` | Auto-slide interval in milliseconds |
| `minDragDistance` | `number` | `40` | Minimum drag distance (px) to trigger slide |

### CarouselItem Interface

```typescript
interface CarouselItem {
  id: number;
  title: string;
  image: string;
  landing_page: string;
}
```

---

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool & dev server
- **Pure CSS** - Styling & animations (no CSS frameworks)
- **No third-party carousel/gesture libraries**

---


