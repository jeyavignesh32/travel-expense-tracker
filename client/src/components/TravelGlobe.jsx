import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';

// ─── High-res NASA texture URLs ───
const TEXTURES = {
  earth: 'https://unpkg.com/three-globe@2.38.0/example/img/earth-blue-marble.jpg',
  bump: 'https://unpkg.com/three-globe@2.38.0/example/img/earth-topology.png',
  clouds: 'https://unpkg.com/three-globe@2.38.0/example/img/earth-water.png',
  night: 'https://unpkg.com/three-globe@2.38.0/example/img/earth-night.jpg',
  specular: 'https://unpkg.com/three-globe@2.38.0/example/img/earth-water.png',
};

const MARKER_COLORS = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];

const TravelGlobe = ({ trips = [] }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef({});
  const [hovered, setHovered] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const userMarkers = useMemo(() =>
    trips.filter(t => t.lat && t.lon).map((t, i) => ({
      id: t.id,
      name: t.destination,
      lat: t.lat,
      lng: t.lon,
      color: MARKER_COLORS[i % MARKER_COLORS.length]
    })), [trips]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // ─── Scene Setup ───
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();

    // ─── Earth Sphere ───
    const earthGeometry = new THREE.SphereGeometry(1, 128, 128);
    const earthMaterial = new THREE.MeshPhongMaterial({
      shininess: 25,
      specular: new THREE.Color(0x333333),
    });

    // Load textures
    let texturesLoaded = 0;
    const onTextureLoad = () => {
      texturesLoaded++;
      if (texturesLoaded >= 2) setLoaded(true);
    };

    loader.load(TEXTURES.earth, (tex) => {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      earthMaterial.map = tex;
      earthMaterial.needsUpdate = true;
      onTextureLoad();
    });

    loader.load(TEXTURES.bump, (tex) => {
      earthMaterial.bumpMap = tex;
      earthMaterial.bumpScale = 0.04;
      earthMaterial.needsUpdate = true;
      onTextureLoad();
    });

    loader.load(TEXTURES.specular, (tex) => {
      earthMaterial.specularMap = tex;
      earthMaterial.needsUpdate = true;
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // ─── Cloud Layer ───
    const cloudGeometry = new THREE.SphereGeometry(1.008, 128, 128);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    loader.load(TEXTURES.clouds, (tex) => {
      cloudMaterial.map = tex;
      cloudMaterial.alphaMap = tex;
      cloudMaterial.needsUpdate = true;
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    // ─── Atmosphere Glow (outer) ───
    const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
          gl_FragColor = vec4(atmosphereColor, intensity * 0.65);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // ─── Inner atmospheric rim ───
    const innerGlowGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const innerGlowMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          vec3 color = vec3(0.35, 0.65, 1.0);
          gl_FragColor = vec4(color, intensity * 0.4);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    scene.add(innerGlow);

    // ─── Trip markers (3D pins on globe) ───
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    userMarkers.forEach(m => {
      const phi = (90 - m.lat) * (Math.PI / 180);
      const theta = (m.lng + 180) * (Math.PI / 180);
      const x = -1.02 * Math.sin(phi) * Math.cos(theta);
      const y = 1.02 * Math.cos(phi);
      const z = 1.02 * Math.sin(phi) * Math.sin(theta);

      // Marker pin
      const pinGeometry = new THREE.SphereGeometry(0.018, 16, 16);
      const pinMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(m.color) });
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      pin.position.set(x, y, z);
      pin.userData = { marker: m };
      markerGroup.add(pin);

      // Glow ring
      const ringGeometry = new THREE.RingGeometry(0.025, 0.035, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(m.color),
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(x, y, z);
      ring.lookAt(0, 0, 0);
      markerGroup.add(ring);

      // Stalk
      const stalkEnd = new THREE.Vector3(x, y, z).multiplyScalar(1.06);
      const stalkGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, z), stalkEnd
      ]);
      const stalkMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(m.color), transparent: true, opacity: 0.7 });
      const stalk = new THREE.Line(stalkGeometry, stalkMaterial);
      markerGroup.add(stalk);
    });

    // ─── Lighting ───
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // ─── Starfield background ───
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const r = 50 + Math.random() * 150;
      const theta2 = Math.random() * Math.PI * 2;
      const phi2 = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi2) * Math.cos(theta2);
      starPositions[i * 3 + 1] = r * Math.sin(phi2) * Math.sin(theta2);
      starPositions[i * 3 + 2] = r * Math.cos(phi2);
      starSizes[i] = 0.3 + Math.random() * 1.5;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      sizeAttenuation: true,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ─── Interaction ───
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    let autoRotate = true;

    const handlePointerDown = (e) => {
      isDragging = true;
      autoRotate = false;
      previousMouse = { x: e.clientX, y: e.clientY };
      rotationVelocity = { x: 0, y: 0 };
    };

    const handlePointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - previousMouse.x;
      const dy = e.clientY - previousMouse.y;
      rotationVelocity = { x: dy * 0.002, y: dx * 0.002 };
      earth.rotation.y += dx * 0.005;
      earth.rotation.x += dy * 0.005;
      earth.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, earth.rotation.x));
      clouds.rotation.y = earth.rotation.y;
      clouds.rotation.x = earth.rotation.x;
      markerGroup.rotation.y = earth.rotation.y;
      markerGroup.rotation.x = earth.rotation.x;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
      setTimeout(() => { autoRotate = true; }, 3000);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.002;
      camera.position.z = Math.max(1.6, Math.min(5, camera.position.z));
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointerleave', handlePointerUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // ─── Raycaster for hover ───
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markerGroup.children.filter(c => c.userData.marker));
      if (intersects.length > 0) {
        setHovered(intersects[0].object.userData.marker);
        container.style.cursor = 'pointer';
      } else {
        setHovered(null);
        container.style.cursor = 'grab';
      }
    });

    // ─── Animation Loop ───
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (autoRotate) {
        earth.rotation.y += 0.0015;
        clouds.rotation.y += 0.0018;
        markerGroup.rotation.y = earth.rotation.y;
      } else {
        clouds.rotation.y = earth.rotation.y + 0.0003;
      }

      // Inertia
      if (!isDragging && (Math.abs(rotationVelocity.x) > 0.0001 || Math.abs(rotationVelocity.y) > 0.0001)) {
        earth.rotation.y += rotationVelocity.y;
        earth.rotation.x += rotationVelocity.x;
        earth.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, earth.rotation.x));
        clouds.rotation.y = earth.rotation.y;
        clouds.rotation.x = earth.rotation.x;
        markerGroup.rotation.y = earth.rotation.y;
        markerGroup.rotation.x = earth.rotation.x;
        rotationVelocity.x *= 0.95;
        rotationVelocity.y *= 0.95;
      }

      // Pulse rings
      markerGroup.children.forEach(child => {
        if (child.geometry?.type === 'RingGeometry') {
          const t = clock.getElapsedTime();
          child.material.opacity = 0.3 + Math.sin(t * 3) * 0.2;
          const s = 1 + Math.sin(t * 2) * 0.15;
          child.scale.set(s, s, s);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // ─── Resize Handler ───
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    sceneRef.current = { scene, renderer, camera, earth, clouds, markerGroup };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointerleave', handlePointerUp);
      container.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [userMarkers]);

  return (
    <div style={{
      width: '100%', minHeight: '450px', height: '100%',
      borderRadius: '20px', overflow: 'hidden',
      background: 'radial-gradient(ellipse at center, #070d1a 0%, #000205 100%)',
      position: 'relative',
      boxShadow: '0 25px 80px -12px rgba(0,0,0,0.6), 0 0 60px rgba(30,100,255,0.08)',
      border: '1px solid rgba(59, 130, 246, 0.15)',
    }}>

      {/* Loading overlay */}
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, #070d1a 0%, #000205 100%)',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              border: '3px solid rgba(59,130,246,0.2)',
              borderTopColor: '#3b82f6',
              animation: 'globe-spin 1s linear infinite',
            }} />
            <span style={{
              color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500,
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              letterSpacing: '1px',
            }}>Loading Earth...</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes globe-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Badge — top left */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px', zIndex: 10,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(15,23,42,0.8))',
        backdropFilter: 'blur(16px)',
        padding: '8px 18px', borderRadius: '9999px',
        border: '1px solid rgba(59,130,246,0.35)',
        color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '8px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: '#60a5fa', boxShadow: '0 0 8px #60a5fa, 0 0 16px #60a5fa44',
        }}></span>
        🌍 3D Earth Globe
      </div>

      {/* Trip count badge — top right */}
      {userMarkers.length > 0 && (
        <div style={{
          position: 'absolute', top: '16px', right: '16px', zIndex: 10,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(236,72,153,0.85))',
          backdropFilter: 'blur(12px)',
          padding: '8px 16px', borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white', fontSize: '13px', fontWeight: 700,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
        }}>
          📍 {userMarkers.length} Destination{userMarkers.length > 1 ? 's' : ''} Pinned
        </div>
      )}

      {/* Hovered marker tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: '56px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 15, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          padding: '10px 20px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'white', fontSize: '14px', fontWeight: 600,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          transition: 'all 0.3s ease',
        }}>
          📍 {hovered.name} &nbsp;•&nbsp; {hovered.lat.toFixed(2)}°N, {hovered.lng.toFixed(2)}°E
        </div>
      )}

      {/* Instruction badge — bottom */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
        padding: '6px 18px', borderRadius: '9999px',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        🖱️ Drag to rotate • Scroll to zoom • Hover pins for details
      </div>

      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative', zIndex: 3, cursor: 'grab' }}
      />
    </div>
  );
};

export default TravelGlobe;
