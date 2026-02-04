import { useState, useRef, useEffect, useCallback } from 'react';
import './Carousel.css';

export interface CarouselItem {
  id: number;
  title: string;
  image: string;
  landing_page: string;
}

interface CarouselProps {
  items: CarouselItem[];
  autoSlideInterval?: number;
  minDragDistance?: number;
}

const CARD_WIDTH = 300;
const CARD_GAP = 0;
const VIEWPORT_WIDTH = 750;

export function Carousel({
  items,
  autoSlideInterval = 3000,
  minDragDistance = 40,
}: CarouselProps) {
  // For infinite loop, we clone items at the beginning and end
  // Clone last few items at the start and first few items at the end
  const cloneCount = Math.ceil(VIEWPORT_WIDTH / CARD_WIDTH) + 1;
  
  const extendedItems = [
    ...items.slice(-cloneCount).map((item, i) => ({ ...item, _key: `clone-start-${i}` })),
    ...items.map((item, i) => ({ ...item, _key: `original-${i}` })),
    ...items.slice(0, cloneCount).map((item, i) => ({ ...item, _key: `clone-end-${i}` })),
  ];

  // Initial index points to the first "real" item
  const initialIndex = cloneCount;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate the translation for the track
  const getTranslateX = useCallback(() => {
    const baseTranslate = -(currentIndex * (CARD_WIDTH + CARD_GAP));
    return baseTranslate + dragOffset;
  }, [currentIndex, dragOffset]);

  // Handle infinite loop repositioning
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
    
    // If we're at a clone, jump to the real item without animation
    if (currentIndex < cloneCount) {
      // We're at the cloned end items (showing start items)
      const newIndex = currentIndex + items.length;
      setCurrentIndex(newIndex);
    } else if (currentIndex >= cloneCount + items.length) {
      // We're at the cloned start items (showing end items)
      const newIndex = currentIndex - items.length;
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, cloneCount, items.length]);

  // Slide to a specific index
  const slideTo = useCallback((index: number) => {
    setIsTransitioning(true);
    setCurrentIndex(index);
  }, []);

  // Slide to next
  const slideNext = useCallback(() => {
    slideTo(currentIndex + 1);
  }, [currentIndex, slideTo]);

  // Slide to previous
  const slidePrev = useCallback(() => {
    slideTo(currentIndex - 1);
  }, [currentIndex, slideTo]);

  // Auto-slide effect
  useEffect(() => {
    if (isHovering || isDragging) {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
        autoSlideTimerRef.current = null;
      }
      return;
    }

    autoSlideTimerRef.current = setInterval(() => {
      slideNext();
    }, autoSlideInterval);

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, [isHovering, isDragging, slideNext, autoSlideInterval]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    dragStartX.current = e.clientX;
    dragStartTime.current = Date.now();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX.current;
    setDragOffset(deltaX);
    
    if (Math.abs(deltaX) > 5) {
      setHasDragged(true);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX.current;
    const deltaTime = Date.now() - dragStartTime.current;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    setIsDragging(false);
    setDragOffset(0);
    
    // Check if drag distance or velocity is enough to trigger slide
    const shouldSlide = Math.abs(deltaX) >= minDragDistance || velocity > 0.5;
    
    if (shouldSlide) {
      if (deltaX > 0) {
        slidePrev();
      } else {
        slideNext();
      }
    }
    
    // Reset hasDragged after a short delay to prevent click
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  }, [isDragging, minDragDistance, slideNext, slidePrev]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setHasDragged(false);
    dragStartX.current = e.touches[0].clientX;
    dragStartTime.current = Date.now();
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - dragStartX.current;
    setDragOffset(deltaX);
    
    if (Math.abs(deltaX) > 5) {
      setHasDragged(true);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - dragStartX.current;
    const deltaTime = Date.now() - dragStartTime.current;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    setIsDragging(false);
    setDragOffset(0);
    
    const shouldSlide = Math.abs(deltaX) >= minDragDistance || velocity > 0.5;
    
    if (shouldSlide) {
      if (deltaX > 0) {
        slidePrev();
      } else {
        slideNext();
      }
    }
    
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  }, [isDragging, minDragDistance, slideNext, slidePrev]);

  // Add/remove global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Handle card click
  const handleCardClick = (item: CarouselItem) => {
    if (hasDragged) {
      return; // Prevent click if user was dragging
    }
    window.open(item.landing_page, '_blank', 'noopener,noreferrer');
  };

  // Calculate current "real" index for indicators
  const getRealIndex = () => {
    let idx = currentIndex - cloneCount;
    if (idx < 0) idx += items.length;
    if (idx >= items.length) idx -= items.length;
    return idx;
  };

  return (
    <div className="carousel-wrapper">
      <div
        className={`carousel-container ${isDragging ? 'is-dragging' : ''}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          ref={trackRef}
          className="carousel-track"
          style={{
            transform: `translateX(${getTranslateX()}px)`,
            transition: isDragging ? 'none' : isTransitioning ? 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedItems.map((item, index) => (
            <div
              key={item._key}
              className="carousel-card"
              onClick={() => handleCardClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(item);
                }
              }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="carousel-card-image"
                draggable={false}
              />
              <div className="carousel-card-overlay">
                <h3 className="carousel-card-title">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation dots */}
      <div className="carousel-indicators">
        {items.map((_, index) => (
          <button
            key={index}
            className={`carousel-indicator ${getRealIndex() === index ? 'active' : ''}`}
            onClick={() => slideTo(cloneCount + index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Navigation arrows */}
      <button
        className="carousel-nav carousel-nav-prev"
        onClick={slidePrev}
        aria-label="Previous slide"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        className="carousel-nav carousel-nav-next"
        onClick={slideNext}
        aria-label="Next slide"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>
    </div>
  );
}

export default Carousel;
