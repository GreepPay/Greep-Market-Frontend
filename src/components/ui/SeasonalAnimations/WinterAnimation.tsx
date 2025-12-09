import React, { useEffect, useRef } from 'react';

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  drift: number;
}

interface WinterAnimationProps {
  intensity?: 'low' | 'medium' | 'high';
  isChristmas?: boolean;
}

export const WinterAnimation: React.FC<WinterAnimationProps> = ({ 
  intensity = 'medium',
  isChristmas = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const snowflakesRef = useRef<Snowflake[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSnowflakeCount = () => {
    switch (intensity) {
      case 'low': return 30;
      case 'high': return 100;
      default: return 50;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();

    // Initialize snowflakes
    const initSnowflakes = () => {
      snowflakesRef.current = [];
      const count = getSnowflakeCount();
      
      for (let i = 0; i < count; i++) {
        snowflakesRef.current.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 4 + 2,
          speed: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.7 + 0.3,
          drift: (Math.random() - 0.5) * 0.5,
        });
      }
    };

    initSnowflakes();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const snowflakes = snowflakesRef.current;
      
      snowflakes.forEach((flake) => {
        // Update position
        flake.y += flake.speed;
        flake.x += flake.drift + Math.sin(flake.y * 0.01) * 0.3;
        
        // Reset if off screen
        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }
        
        // Wrap horizontally
        if (flake.x < 0) flake.x = canvas.width;
        if (flake.x > canvas.width) flake.x = 0;
        
        // Draw snowflake
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.fill();
        
        // Add sparkle effect for Christmas
        if (isChristmas && Math.random() > 0.95) {
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffffff';
          ctx.fill();
          ctx.restore();
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      resizeCanvas();
      initSnowflakes();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity, isChristmas]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
      style={{ background: 'transparent' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
};

