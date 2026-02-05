import { Carousel, type CarouselItem } from './components/Carousel';
import './App.css';

const carouselData: CarouselItem[] = [
  {
    id: 1,
    title: 'Mountain Adventure',
    image: 'https://picsum.photos/id/1015/600/600',
    landing_page: 'https://example.com/mountain-adventure',
  },
  {
    id: 2,
    title: 'Ocean Dreams',
    image: 'https://picsum.photos/id/1016/600/600',
    landing_page: 'https://example.com/ocean-dreams',
  },
  {
    id: 3,
    title: 'Forest Escape',
    image: 'https://picsum.photos/id/1018/600/600',
    landing_page: 'https://example.com/forest-escape',
  },
  {
    id: 4,
    title: 'Desert Safari',
    image: 'https://picsum.photos/id/1035/600/600',
    landing_page: 'https://example.com/desert-safari',
  },
  {
    id: 5,
    title: 'City Lights',
    image: 'https://picsum.photos/id/1039/600/600',
    landing_page: 'https://example.com/city-lights',
  },
  {
    id: 6,
    title: 'Sunset Valley',
    image: 'https://picsum.photos/id/1043/600/600',
    landing_page: 'https://example.com/sunset-valley',
  },
];

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Interactive Carousel</h1>
        <p className="app-subtitle">
          Drag, swipe, or use the arrows to navigate • Hover to pause auto-slide
        </p>
      </header>

      <main className="app-main">
        <Carousel
          items={carouselData}
          autoSlideInterval={3000}
          minDragDistance={40}
        />
      </main>

      <footer className="app-footer">
        <p>Click on any card to visit its landing page</p>
      </footer>
    </div>
  );
}

export default App;
