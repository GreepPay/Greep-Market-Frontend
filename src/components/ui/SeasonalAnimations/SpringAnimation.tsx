import React, { useEffect, useRef } from 'react';

interface Petal {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

interface SpringAnimationProps {
  intensity?: 'low' | 'medium' | 'high';
}

const colors = ['#FFB6C1', '#FFC0CB', '#FFE4E1', '#FF69B4', '#FF1493', '#FFF0F5'];

export const SpringAnimation: React.FC<SpringAnimationProps> = ({ 
  intensity = 'medium' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const petalsRef = useRef<Petal[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPetalCount = () => {
    switch (intensity) {
      case 'low': return 20;
      case 'high': return 60;
      default: return 35;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();

    const initPetals = () => {
      petalsRef.current = [];
      const count = getPetalCount();
      
      for (let i = 0; i < count; i++) {
        petalsRef.current.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 8 + 5,
          speed: Math.random() * 1.5 + 0.5,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          opacity: Math.random() * 0.6 + 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    initPetals();

    const drawPetal = (x: number, y: number, size: number, rotation: number, color: string, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const petals = petalsRef.current;
      
      petals.forEach((petal) => {
        petal.y += petal.speed;
        petal.x += Math.sin(petal.y * 0.02) * 0.5;
        petal.rotation += petal.rotationSpeed;
        
        if (petal.y > canvas.height) {
          petal.y = -20;
          petal.x = Math.random() * canvas.width;
        }
        
        if (petal.x < -10) petal.x = canvas.width + 10;
        if (petal.x > canvas.width + 10) petal.x = -10;
        
        drawPetal(petal.x, petal.y, petal.size, petal.rotation, petal.color, petal.opacity);
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
      initPetals();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ mixBlendMode: 'multiply' }}
      />
    </div>
  );
};

