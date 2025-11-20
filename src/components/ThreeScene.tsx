import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeSceneProps {
  className?: string;
}

const ThreeScene = ({ className }: ThreeSceneProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true 
    });
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create floating geometric shapes
    const shapes: THREE.Mesh[] = [];
    const geometryTypes = [
      () => new THREE.BoxGeometry(0.5, 0.5, 0.5),
      () => new THREE.SphereGeometry(0.3, 16, 16),
      () => new THREE.TorusGeometry(0.3, 0.1, 16, 100),
      () => new THREE.ConeGeometry(0.3, 0.6, 8),
    ];

    for (let i = 0; i < 20; i++) {
      const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)]();
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
        metalness: 0.7,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Store original position for animation
      (mesh.userData as any).originalY = mesh.position.y;
      (mesh.userData as any).speed = Math.random() * 0.003 + 0.002; // Muito mais lento
      (mesh.userData as any).rotationSpeed = {
        x: (Math.random() - 0.5) * 0.005, // Muito mais lento
        y: (Math.random() - 0.5) * 0.005,
        z: (Math.random() - 0.5) * 0.005,
      };
      
      scene.add(mesh);
      shapes.push(mesh);
    }

    camera.position.z = 5;

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Animate shapes
      shapes.forEach((shape) => {
        // Floating animation
        shape.position.y = (shape.userData as any).originalY + Math.sin(Date.now() * (shape.userData as any).speed) * 0.5;
        
        // Rotation
        shape.rotation.x += (shape.userData as any).rotationSpeed.x;
        shape.rotation.y += (shape.userData as any).rotationSpeed.y;
        shape.rotation.z += (shape.userData as any).rotationSpeed.z;
      });

      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { scene, camera, renderer, animationId };

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Parallax effect on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      if (!mountRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      camera.position.x = x * 0.5;
      camera.position.y = y * 0.5;
      camera.lookAt(0, 0, 0);
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.renderer.dispose();
        shapes.forEach(shape => {
          shape.geometry.dispose();
          (shape.material as THREE.Material).dispose();
        });
        if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return <div ref={mountRef} className={className} />;
};

export default ThreeScene;

