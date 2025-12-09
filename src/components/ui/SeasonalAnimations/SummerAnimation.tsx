import React, { useEffect, useRef } from 'react';

interface SunRay {
  id: number;
  angle: number;
  length: number;
  opacity: number;
  speed: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

interface SummerAnimationProps {
  intensity?: 'low' | 'medium' | 'high';
}

export const SummerAnimation: React.FC<SummerAnimationProps> = ({ 
  intensity = 'medium' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const raysRef = useRef<SunRay[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<number>(0);

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

    const initRays = () => {
      raysRef.current = [];
      const count = 12;
      for (let i = 0; i < count; i++) {
        raysRef.current.push({
          id: i,
          angle: (Math.PI * 2 / count) * i,
          length: 100,
          opacity: 0.1,
          speed: 0.001,
        });
      }
    };

    const initParticles = () => {
      particlesRef.current = [];
      const count = intensity === 'low' ? 10 : intensity === 'high' ? 30 : 20;
      
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.3 + 0.1,
          color: `hsl(${40 + Math.random() * 20}, 100%, ${60 + Math.random() * 20}%)`,
        });
    }
    };

    initRays();
    initParticles();

    const animate = () => {
      timeRef.current += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw sun rays
      ctx.save();
      ctx.translate(centerX, centerY);
      
      raysRef.current.forEach((ray) => {
        ray.opacity = 0.05 + Math.sin(timeRef.current + ray.id) * 0.05;
        ray.angle += ray.speed;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
          Math.cos(ray.angle) * ray.length,
          Math.sin(ray.angle) * ray.length
        );
        ctx.strokeStyle = `rgba(255, 215, 0, ${ray.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      
      ctx.restore();
      
      // Draw floating particles (sunshine specks)
      particlesRef.current.forEach((particle) => {
        particle.y -= particle.speed;
        particle.x += Math.sin(timeRef.current + particle.id) * 0.3;
        particle.opacity = 0.1 + Math.sin(timeRef.current * 2 + particle.id) * 0.2;
        
        if (particle.y < -10) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
        }
        
        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${particle.opacity})`;
        ctx.fill();
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
      initRays();
      initParticles();
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
        style={{ mixBlendMode: 'screen', opacity: 0.3 }}
      />
    </div>
  );
};

