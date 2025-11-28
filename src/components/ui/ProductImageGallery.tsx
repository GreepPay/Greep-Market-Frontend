import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from './carousel';
import { Badge } from './badge';
import { ImageModal } from './ImageModal';
import { cn } from '../../lib/utils';

interface ProductImageGalleryProps {
  product: Product;
  className?: string;
  showIndicators?: boolean;
  showNavigation?: boolean;
  onImageClick?: (imageIndex: number) => void;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  product,
  className,
  showIndicators = true,
  showNavigation = true,
  onImageClick,
}) => {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const images = product.images || [];
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (!api || !hasMultipleImages) return;
    
    const handleSelect = () => {
      // Calculate current index based on scroll position
      const carouselElement = document.querySelector('[role="region"][aria-roledescription="carousel"]');
      if (carouselElement) {
        const content = carouselElement.querySelector('div[class*="overflow-x-auto"]') as HTMLElement;
        if (content) {
          const scrollLeft = content.scrollLeft;
          const itemWidth = content.clientWidth;
          const index = Math.round(scrollLeft / itemWidth);
          setCurrentIndex(Math.min(index, images.length - 1));
        }
      }
    };

    // Listen to scroll events
    const carouselElement = document.querySelector('[role="region"][aria-roledescription="carousel"]');
    if (carouselElement) {
      const content = carouselElement.querySelector('div[class*="overflow-x-auto"]');
      if (content) {
        content.addEventListener('scroll', handleSelect);
        return () => content.removeEventListener('scroll', handleSelect);
      }
    }
  }, [api, hasMultipleImages, images.length]);

  // Auto-play carousel - advance every 4 seconds
  useEffect(() => {
    if (!api || !hasMultipleImages || isHovered || isModalOpen) return;

    const interval = setInterval(() => {
      if (api.canScrollNext) {
        api.scrollNext();
      } else {
        // Loop back to start if at the end
        const carouselElement = document.querySelector('[role="region"][aria-roledescription="carousel"]');
        if (carouselElement) {
          const content = carouselElement.querySelector('div[class*="overflow-x-auto"]') as HTMLElement;
          if (content) {
            content.scrollTo({ left: 0, behavior: 'smooth' });
          }
        }
      }
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, [api, hasMultipleImages, isHovered, isModalOpen]);

  const handleImageClick = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
    onImageClick?.(index);
  };

  const handleModalPrevious = () => {
    if (modalImageIndex > 0) {
      setModalImageIndex(modalImageIndex - 1);
    }
  };

  const handleModalNext = () => {
    if (modalImageIndex < images.length - 1) {
      setModalImageIndex(modalImageIndex + 1);
    }
  };

  if (images.length === 0) {
    return (
      <div className={cn(
        "relative h-48 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 overflow-hidden flex items-center justify-center",
        className
      )}>
        <Package className="h-16 w-16 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <div 
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasMultipleImages ? (
        <Carousel
          className="w-full"
          opts={{ align: "start", loop: true }}
          setApi={setApi}
        >
          <CarouselContent className="h-48">
            {images.map((image, index) => (
              <CarouselItem key={image.public_id || index} className="relative">
                <div
                  className="relative h-48 w-full cursor-pointer overflow-hidden"
                  onClick={() => handleImageClick(index)}
                >
                  <img
                    src={image.url}
                    alt={`${product.name} - Image ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {showNavigation && hasMultipleImages && (
            <>
              <CarouselPrevious className="left-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CarouselNext className="right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </Carousel>
      ) : (
        <div
          className="relative h-48 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 overflow-hidden cursor-pointer"
          onClick={() => handleImageClick(0)}
        >
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}

      {/* Image Count Badge */}
      {hasMultipleImages && showIndicators && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </Badge>
        </div>
      )}

      {/* Image Indicators (Dots) */}
      {hasMultipleImages && showIndicators && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                // Scroll to the selected image
                const carouselElement = document.querySelector('[role="region"][aria-roledescription="carousel"]');
                if (carouselElement && api) {
                  const content = carouselElement.querySelector('div[class*="overflow-x-auto"]') as HTMLElement;
                  if (content) {
                    const itemWidth = content.clientWidth;
                    content.scrollTo({ left: index * itemWidth, behavior: 'smooth' });
                  }
                }
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={images}
        currentIndex={modalImageIndex}
        productName={product.name}
        onPrevious={handleModalPrevious}
        onNext={handleModalNext}
        canGoPrevious={modalImageIndex > 0}
        canGoNext={modalImageIndex < images.length - 1}
      />
    </div>
  );
};

