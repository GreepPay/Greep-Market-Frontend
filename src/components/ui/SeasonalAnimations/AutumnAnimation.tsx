import React, { useEffect, useRef } from 'react';

interface Leaf {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  sway: number;
  swaySpeed: number;
}

interface AutumnAnimationProps {
  intensity?: 'low' | 'medium' | 'high';
}

const leafColors = [
  '#FF6347', // Tomato
  '#FF8C00', // Dark orange
  '#FFA500', // Orange
  '#CD853F', // Peru
  '#D2691E', // Chocolate
  '#B8860B', // Dark goldenrod
  '#DA70D6', // Orchid
];

export const AutumnAnimation: React.FC<AutumnAnimationProps> = ({ 
  intensity = 'medium' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const leavesRef = useRef<Leaf[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const getLeafCount = () => {
    switch (intensity) {
      case 'low': return 25;
      case 'high': return 70;
      default: return 40;
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

    const initLeaves = () => {
      leavesRef.current = [];
      const count = getLeafCount();
      
      for (let i = 0; i < count; i++) {
        leavesRef.current.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 12 + 8,
          speed: Math.random() * 1.5 + 0.8,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          opacity: Math.random() * 0.7 + 0.3,
          color: leafColors[Math.floor(Math.random() * leafColors.length)],
          sway: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.02 + 0.01,
        });
      }
    };

    initLeaves();

    const drawLeaf = (x: number, y: number, size: number, rotation: number, color: string, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      
      // Draw leaf shape (simple oval)
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.8, size, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Add a simple vein
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.strokeStyle = `rgba(139, 69, 19, ${opacity * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const leaves = leavesRef.current;
      
      leaves.forEach((leaf) => {
        leaf.y += leaf.speed;
        leaf.sway += leaf.swaySpeed;
        leaf.x += Math.sin(leaf.sway) * 1.5 + Math.sin(leaf.y * 0.01) * 0.5;
        leaf.rotation += leaf.rotationSpeed;
        
        if (leaf.y > canvas.height) {
          leaf.y = -20;
          leaf.x = Math.random() * canvas.width;
          leaf.sway = Math.random() * Math.PI * 2;
        }
        
        if (leaf.x < -20) leaf.x = canvas.width + 20;
        if (leaf.x > canvas.width + 20) leaf.x = -20;
        
        drawLeaf(leaf.x, leaf.y, leaf.size, leaf.rotation, leaf.color, leaf.opacity);
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
      initLeaves();
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
        style={{ mixBlendMode: 'multiply', opacity: 0.6 }}
      />
    </div>
  );
};

