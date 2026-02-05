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
   cd Interactive_Carousel_TaiNA
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
Interactive_Carousel_TaiNA/
├── src/
│   ├── components/
│   │   └── Carousel/
│   │       ├── Carousel.tsx          # Main carousel component
│   │       ├── Carousel.css          # Carousel styles & animations
│   │       ├── Carousel.constants.ts # Shared layout / timing constants
│   │       ├── Carousel.model.ts     # Shared interfaces & types
│   │       └── index.ts              # Clean exports
│   ├── App.tsx                       # Demo application
│   ├── App.css                       # App-level styles
│   ├── index.css                     # Global base styles
│   └── main.tsx                      # React entry point
├── public/                           # Static assets
├── index.html                        # HTML template
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite configuration
└── README.md                         # This file
```

### Key Files

| File | Purpose |
|------|---------|
| `Carousel.tsx` | Core component logic: infinite loop, drag/swipe handling, auto-slide, click prevention |
| `Carousel.css` | Visual styling, animations, responsive helpers, cursor states |
| `Carousel.constants.ts` | Centralized layout & animation constants (card size, design viewport, timing) |
| `Carousel.model.ts` | Shared TypeScript interfaces (`CarouselItem`, `CarouselProps`) |
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

Drag được cài đặt thuần bằng native events, với một bộ handler dùng chung cho cả mouse và touch:

```
┌─────────────────────────────────────────────────────────────────┐
│  User Action          →  Shared handler       →  State Update   │
├─────────────────────────────────────────────────────────────────┤
│  mousedown on track   →  startDrag(clientX)   → isDragging=true │
│  mousemove (window)   →  moveDrag(clientX)    → dragOffset=ΔX   │
│  mouseup   (window)   →  endDrag(clientX)     → slide logic     │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// Shared drag handlers (used by both mouse & touch)
const startDrag = useCallback((clientX: number) => {
  setIsDragging(true);
  setHasDragged(false);
  dragStartX.current = clientX;
  dragStartTime.current = Date.now();
}, []);

const moveDrag = useCallback((clientX: number) => {
  if (!isDragging) return;
  const deltaX = clientX - dragStartX.current;
  setDragOffset(deltaX);
  if (Math.abs(deltaX) > 5) setHasDragged(true);
}, [isDragging]);

const endDrag = useCallback((clientX: number) => {
  if (!isDragging) return;
  const deltaX = clientX - dragStartX.current;
  const deltaTime = Date.now() - dragStartTime.current;
  const velocity = Math.abs(deltaX) / deltaTime;

  setIsDragging(false);
  setDragOffset(0);

  const shouldSlide = Math.abs(deltaX) >= minDragDistance || velocity > 0.5;
  if (shouldSlide) {
    deltaX > 0 ? slidePrev() : slideNext();
  }

  setTimeout(() => setHasDragged(false), 100);
}, [isDragging, minDragDistance, slideNext, slidePrev]);

// Mouse events chỉ việc chuyển e.clientX vào handler dùng chung
const handleMouseDown = (e: React.MouseEvent) => {
  if (e.button !== 0) return;
  e.preventDefault();
  startDrag(e.clientX);
};
```

**Key Implementation Details:**

1. **Global Event Listeners**: `mousemove` và `mouseup` được attach lên `window` nên drag không bị ngắt khi trượt ra ngoài vùng carousel.
2. **Real-time Feedback**: Trong khi drag, `dragOffset` được cộng thẳng vào `transform`, `transition` bị tắt để phản hồi ngay lập tức.
3. **Velocity Detection**: Dùng `dragStartTime` để tính `|deltaX| / deltaTime`; flick nhanh vẫn trượt dù chưa đủ 40px.

### Touch Swipe (Mobile)

Touch sử dụng cùng bộ handler phía trên, chỉ khác nguồn toạ độ và event:

| Mouse Event | Touch Event | Handler dùng chung | Ghi chú |
|-------------|-------------|--------------------|--------|
| `mousedown` | `touchstart` | `startDrag(clientX)` | `e.touches[0].clientX` |
| `mousemove` | `touchmove`  | `moveDrag(clientX)`  | global listener với `{ passive: false }` |
| `mouseup`   | `touchend`   | `endDrag(clientX)`   | `e.changedTouches[0].clientX` |

```tsx
const handleTouchStart = (e: React.TouchEvent) => {
  startDrag(e.touches[0].clientX);
};
```

```css
.carousel-container {
  touch-action: pan-y pinch-zoom;  /* Cho phép scroll dọc, chặn swipe ngang mặc định */
  user-select: none;               /* Tránh select text khi vuốt */
}
```

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

1. **Extended Array**: We prepend clones of the last N slides and append clones of the first N slides (where N ≈ number of visible cards + buffer).

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

## Responsive Design

The carousel keeps the **2.5-card layout** consistent while still adapting to any screen width:

- The design-time viewport is 750px wide with 300px cards → \(750 / 300 = 2.5\) cards.
- At runtime we measure the actual container width and compute:
  \[ \text{cardWidth} = \min\left(\frac{\text{containerWidth}}{\text{VISIBLE\_CARDS}}, \text{CARD\_WIDTH}\right) \]
- The track translation and card styles all use this `cardWidth`, so we always see ~2.5 cards, even on mobile.

```typescript
// From Carousel.tsx - responsive card sizing
const containerRef = useRef<HTMLDivElement>(null);
const [cardWidth, setCardWidth] = useState(CARD_WIDTH);

const recalcCardWidth = useCallback(() => {
  const container = containerRef.current;
  if (!container) return;

  const containerWidth = container.clientWidth;
  const ideal = containerWidth / VISIBLE_CARDS; // VISIBLE_CARDS = 2.5
  setCardWidth(Math.min(ideal, CARD_WIDTH));
}, []);

useEffect(() => {
  recalcCardWidth();
  window.addEventListener('resize', recalcCardWidth);
  return () => window.removeEventListener('resize', recalcCardWidth);
}, [recalcCardWidth]);

// Usage in JSX
<div
  ref={containerRef}
  className="carousel-container"
  style={{ height: `${cardWidth}px` }}
>
  <div
    className="carousel-track"
    style={{ transform: `translateX(${translateX}px)` }}
  >
    {extendedItems.map((item) => (
      <div
        key={item._key}
        className="carousel-card"
        style={{ width: `${cardWidth}px`, height: `${cardWidth}px` }}
      >
        ...
      </div>
    ))}
  </div>
</div>
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


