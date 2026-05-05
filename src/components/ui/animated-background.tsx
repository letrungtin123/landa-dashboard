import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function AnimatedBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [mounted, setMounted] = useState(false);

  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const parallaxX = useTransform(springX, [-1, 1], [-90, 90]);
  const parallaxY = useTransform(springY, [-1, 1], [-90, 90]);
  const parallaxForegroundX = useTransform(springX, [-1, 1], [60, -60]);
  const parallaxForegroundY = useTransform(springY, [-1, 1], [60, -60]);
  const gridRotateX = useTransform(springY, [-1, 1], ['15deg', '-15deg']);
  const gridRotateY = useTransform(springX, [-1, 1], ['-15deg', '15deg']);

  if (!mounted) return <div className="fixed inset-0 pointer-events-none -z-10 bg-[#080b16] dark:bg-[#080b16]" />;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#080b16]" style={{ perspective: '800px' }}>
      
      {/* 3D Deep Space Grid */}
      <motion.div 
        style={{ rotateX: gridRotateX, rotateY: gridRotateY, z: -250 }}
        className="absolute inset-[-50%] bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_10%,transparent_100%)] transform-gpu opacity-80"
      />

      {/* Noise Texture (optimized: removed mix-blend-overlay) */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Backdrop Layer: Orange + Cyan gradient orbs (optimized: replaced blur with radial gradient) */}
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="absolute inset-0 z-[-2]">
        {/* Vivid Orange Aurora — top-left */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, 120, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[15%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] transform-gpu"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--gradient-from) 25%, transparent) 0%, transparent 60%)' }}
        />
        {/* Electric Cyan Aurora — bottom-right */}
        <motion.div
          animate={{ scale: [1.2, 0.8, 1.2], rotate: [0, -150, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -right-[15%] w-[65vw] h-[65vw] max-w-[850px] max-h-[850px] transform-gpu"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 60%)' }}
        />
      </motion.div>

      {/* Foreground Layer: Vivid accent blobs (optimized: replaced blur with radial gradient) */}
      <motion.div style={{ x: parallaxForegroundX, y: parallaxForegroundY }} className="absolute inset-0 z-[-1]">
        {/* Hot Orange blob — center-right */}
        <motion.div
          animate={{
            y: ["0%", "-35%", "0%"],
            x: ["0%", "25%", "0%"],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[25%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] transform-gpu"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--gradient-from) 35%, transparent) 0%, transparent 60%)' }}
        />

        {/* Cyan blob — bottom-left */}
        <motion.div
          animate={{
            y: ["0%", "35%", "0%"],
            x: ["0%", "-25%", "0%"],
            scale: [1.1, 0.85, 1.1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[25%] left-[15%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] transform-gpu"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 60%)' }}
        />

        {/* Small magenta accent — center */}
        <motion.div
          animate={{
            y: ["0%", "50%", "0%"],
            x: ["-15%", "15%", "-15%"],
            rotate: [0, 360]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-[45%] left-[40%] w-[18vw] h-[18vw] max-w-[220px] max-h-[220px] transform-gpu"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 60%)' }}
        />

        {/* Teal tiny accent — top-right */}
        <motion.div
          animate={{
            y: ["0%", "-45%", "0%"],
            x: ["15%", "-15%", "15%"],
            rotate: [0, -360]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute bottom-[15%] right-[15%] w-[20vw] h-[20vw] max-w-[250px] max-h-[250px] transform-gpu"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 60%)' }}
        />
      </motion.div>
      
    </div>
  );
}
