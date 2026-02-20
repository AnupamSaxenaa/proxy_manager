import { useEffect, useRef } from 'react';

const CursorTrail = () => {
    const mousePos = useRef({ x: -100, y: -100 });
    const trailPositions = useRef([]);
    const animRef = useRef(null);

    useEffect(() => {
        if (window.matchMedia('(hover: none)').matches) return;

        const TRAIL_COUNT = 8;

        const mainDot = document.createElement('div');
        mainDot.className = 'cursor-dot cursor-dot-main';
        document.body.appendChild(mainDot);

        const trails = [];
        for (let i = 0; i < TRAIL_COUNT; i++) {
            const dot = document.createElement('div');
            dot.className = 'cursor-dot cursor-dot-trail';
            dot.style.opacity = (0.5 - i * 0.05).toString();
            dot.style.width = `${8 - i * 0.5}px`;
            dot.style.height = `${8 - i * 0.5}px`;
            document.body.appendChild(dot);
            trails.push(dot);
            trailPositions.current.push({ x: -100, y: -100 });
        }

        const handleMouseMove = (e) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const animate = () => {
            const { x, y } = mousePos.current;

            mainDot.style.left = `${x}px`;
            mainDot.style.top = `${y}px`;

            for (let i = 0; i < trails.length; i++) {
                const prev = i === 0 ? { x, y } : trailPositions.current[i - 1];
                const pos = trailPositions.current[i];
                const speed = 0.25 - i * 0.015;

                pos.x += (prev.x - pos.x) * speed;
                pos.y += (prev.y - pos.y) * speed;

                trails[i].style.left = `${pos.x}px`;
                trails[i].style.top = `${pos.y}px`;
            }

            animRef.current = requestAnimationFrame(animate);
        };

        document.addEventListener('mousemove', handleMouseMove);
        animRef.current = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animRef.current);
            mainDot.remove();
            trails.forEach(d => d.remove());
        };
    }, []);

    return null;
};

export default CursorTrail;
