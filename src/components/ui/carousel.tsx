"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./Button"

type CarouselApi = {
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

type CarouselContextProps = {
  carouselRef: React.RefObject<HTMLDivElement>
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

type CarouselProps = {
  opts?: {
    align?: "start" | "center" | "end"
    loop?: boolean
  }
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
  className?: string
  children: React.ReactNode
}

function Carousel({
  opts = { align: "start", loop: false },
  orientation = "horizontal",
  setApi,
  className,
  children,
  ...props
}: CarouselProps) {
  const carouselRef = React.useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const scrollPrev = React.useCallback(() => {
    if (!carouselRef.current) return
    const scrollAmount = carouselRef.current.clientWidth
    carouselRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" })
  }, [])

  const scrollNext = React.useCallback(() => {
    if (!carouselRef.current) return
    const scrollAmount = carouselRef.current.clientWidth
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }, [])

  const handleScroll = React.useCallback(() => {
    if (!carouselRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setCanScrollPrev(scrollLeft > 0)
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  React.useEffect(() => {
    if (!carouselRef.current) return
    handleScroll()
    const element = carouselRef.current
    element.addEventListener("scroll", handleScroll)
    return () => element.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  React.useEffect(() => {
    if (!setApi) return
    const api: CarouselApi = {
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
    }
    setApi(api)
  }, [scrollPrev, scrollNext, canScrollPrev, canScrollNext, setApi])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { carouselRef } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className={cn(
        "flex overflow-x-auto scroll-smooth",
        "snap-x snap-mandatory",
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CarouselItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full snap-start", className)}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'children'>) {
  const { scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 z-10",
        "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'children'>) {
  const { scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0 z-10",
        "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
