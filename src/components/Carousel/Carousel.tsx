import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../assets/icons';
import { ANIMATION_DURATION, CARD_GAP, CARD_WIDTH, VISIBLE_CARDS } from './Carousel.constants';
import './Carousel.css';
import { type CarouselItem, type CarouselProps } from './Carousel.model';

export function Carousel({
  items,
  autoSlideInterval = 3000,
  minDragDistance = 40,
}: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Card width is responsive: always try to keep VISIBLE_CARDS cards in viewport
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH);

  const recalcCardWidth = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    if (!containerWidth) return;

    const idealCardWidth = containerWidth / VISIBLE_CARDS;
    // Don't exceed design card width to keep look consistent on very large screens
    const nextWidth = Math.min(idealCardWidth, CARD_WIDTH);
    setCardWidth(nextWidth);
  }, []);

  // Recalculate on mount and on window resize
  useEffect(() => {
    recalcCardWidth();
    window.addEventListener('resize', recalcCardWidth);
    return () => window.removeEventListener('resize', recalcCardWidth);
  }, [recalcCardWidth]);

  // For infinite loop, we clone items at the beginning and end.
  // We only need a few clones: visible cards (2.5) rounded up, plus one buffer.
  const cloneCount = Math.ceil(VISIBLE_CARDS) + 1;

  const extendedItems = [
    // --- Clone cloneCount items at the start ---
    ...items.slice(-cloneCount).map((item, i) => ({ ...item, _key: `clone-start-${i}` })),
    // --- Original items ---
    ...items.map((item, i) => ({ ...item, _key: `original-${i}` })),
    // --- Clone cloneCount items at the end ---
    ...items.slice(0, cloneCount).map((item, i) => ({ ...item, _key: `clone-end-${i}` })),
  ];

  // Initial index points to the first "real" item
  const initialIndex = cloneCount;

  // --- State ---
  // currentIndex: The index of the current item in the extendedItems array
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  // isTransitioning: Whether the carousel is currently transitioning between items
  const [isTransitioning, setIsTransitioning] = useState(false);
  // isDragging: Whether the user is currently dragging the carousel
  const [isDragging, setIsDragging] = useState(false);
  // dragOffset: The offset of the drag in pixels
  const [dragOffset, setDragOffset] = useState(0);
  // isHovering: Whether the user is currently hovering over the carousel
  const [isHovering, setIsHovering] = useState(false);
  // hasDragged: Whether the user has dragged the carousel
  const [hasDragged, setHasDragged] = useState(false);
  // isTabVisible: Whether the tab is currently visible
  const [isTabVisible, setIsTabVisible] = useState(true);

  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Normalize index to valid range (used when tab becomes visible)
  const normalizeIndex = useCallback((index: number): number => {
    // Ensure index is within the valid range (including clones for smooth operation)
    const minValidIndex = 0;
    const maxValidIndex = extendedItems.length - 1;

    if (index < minValidIndex || index > maxValidIndex) {
      // Reset to first real item
      return cloneCount;
    }

    // If we're too far into clones, reset to corresponding real item
    if (index < cloneCount - 1) {
      return cloneCount + (index % items.length);
    }
    if (index > cloneCount + items.length) {
      return cloneCount + ((index - cloneCount) % items.length);
    }

    return index;
  }, [cloneCount, items.length, extendedItems.length]);

  // Handle page visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause everything
        setIsTabVisible(false);
        if (autoSlideTimerRef.current) {
          clearInterval(autoSlideTimerRef.current);
          autoSlideTimerRef.current = null;
        }
      } else {
        // Tab is visible again - normalize index and resume
        setIsTabVisible(true);
        setIsTransitioning(false);
        setCurrentIndex(prev => normalizeIndex(prev));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [normalizeIndex]);

  // Calculate the translation for the track
  const translateX = useMemo(() => {
    const baseTranslate = -(currentIndex * (cardWidth + CARD_GAP));
    return baseTranslate + dragOffset;
  }, [currentIndex, dragOffset, cardWidth]);


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

  // Safety timeout: if transition doesn't end within expected time, reset transitioning state
  // This prevents the carousel from getting stuck if transitionEnd doesn't fire (e.g., tab was hidden)
  useEffect(() => {
    if (!isTransitioning) return;

    const safetyTimeout = setTimeout(() => {
      setIsTransitioning(false);
      // Normalize index if it's out of bounds
      setCurrentIndex(prev => normalizeIndex(prev));
    }, 500); // Slightly longer than the 400ms transition

    return () => clearTimeout(safetyTimeout);
  }, [isTransitioning, normalizeIndex]);

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
    // Don't auto-slide if hovering, dragging, or tab is hidden
    if (isHovering || isDragging || !isTabVisible) {
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
  }, [isHovering, isDragging, isTabVisible, slideNext, autoSlideInterval]);

  // Shared drag handlers
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

    if (Math.abs(deltaX) > 5) {
      setHasDragged(true);
    }
  }, [isDragging]);

  const endDrag = useCallback((clientX: number) => {
    if (!isDragging) return;

    const deltaX = clientX - dragStartX.current;
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

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    startDrag(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    moveDrag(e.clientX);
  }, [moveDrag]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    endDrag(e.clientX);
  }, [endDrag]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e.touches[0].clientX);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    moveDrag(e.touches[0].clientX);
  }, [moveDrag]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    endDrag(e.changedTouches[0].clientX);
  }, [endDrag]);

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
        ref={containerRef}
        className={`carousel-container ${isDragging ? 'is-dragging' : ''}`}
        style={{ height: `${cardWidth}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          className="carousel-track"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isTransitioning && !isDragging
              ? `transform ${ANIMATION_DURATION}s cubic-bezier(0.25, 0.1, 0.25, 1)`
              : 'none',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedItems.map((item) => (
            <div
              key={item._key}
              className="carousel-card"
              style={{ width: `${cardWidth}px`, height: `${cardWidth}px` }}
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
                style={{ transition: `transform ${ANIMATION_DURATION}s ease` }}
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
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`carousel-indicator ${getRealIndex() === index ? 'active' : ''}`}
            onClick={() => slideTo(cloneCount + index)}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      {/* Navigation arrows: Previous slide */}
      <button
        className="carousel-nav carousel-nav-prev"
        onClick={slidePrev}
      >
        <ChevronLeftIcon />
      </button>
      {/* Navigation arrows: Next slide */}
      <button
        className="carousel-nav carousel-nav-next"
        onClick={slideNext}
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}

export default Carousel;
