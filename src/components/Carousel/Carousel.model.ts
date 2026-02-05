export interface CarouselItem {
  id: number;
  title: string;
  image: string;
  landing_page: string;
}

export interface CarouselProps {
  items: CarouselItem[];
  autoSlideInterval?: number;
  minDragDistance?: number;
}

