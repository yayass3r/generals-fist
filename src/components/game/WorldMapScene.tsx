// ═══════════════════════════════════════════════════════════
// مشهد خريطة العالم ثلاثي الأبعاد - 3D World Map Scene
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/game-store';
import { SECTOR_CONFIG, THREAT_CONFIG, hexToWorldPosition } from '@/lib/world-map';
import type { WorldSector } from '@/lib/world-map';

// ═══════════════════════════════
// ثوابت
// ═══════════════════════════════

const HEX_RADIUS = 0.46;
const HEX_DEPTH = 0.14;

// مولّد عشوائي ثابت للزخارف
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// حساب ارتفاع القطاع (مع رفع بسيط للمقر)
function getSectorHeight(sector: WorldSector): number {
  if (sector.status === 'occupied') return 0.04;
  return seededRandom(sector.coordinate.q * 13 + sector.coordinate.r * 7) * 0.04 - 0.02;
}

// تحويل إحداثيات القطاع إلى موقع ثلاثي الأبعاد
function sectorWorldPos(sector: WorldSector): [number, number, number] {
  const [wx, wz] = hexToWorldPosition(sector.coordinate.q, sector.coordinate.r);
  return [wx, getSectorHeight(sector), wz];
}

// ═══════════════════════════════
// شكل سداسي (Pointy-Top)
// ═══════════════════════════════

function createHexGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const x = HEX_RADIUS * Math.cos(angle);
    const y = HEX_RADIUS * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: HEX_DEPTH,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

// ═══════════════════════════════
// حساب لون القطاع حسب الحالة
// ═══════════════════════════════

const _colorCache = new THREE.Color();

function getSectorColor(sector: WorldSector, time: number): THREE.Color {
  const config = SECTOR_CONFIG[sector.type];
  const c = _colorCache;

  switch (sector.status) {
    case 'fogged': {
      c.set(config.fogColor);
      const pulse = Math.sin(time * 1.2 + sector.coordinate.q * 0.7 + sector.coordinate.r * 0.5) * 0.025;
      c.r = Math.max(0, c.r + pulse);
      c.g = Math.max(0, c.g + pulse);
      c.b = Math.max(0, c.b + pulse);
      break;
    }
    case 'scouted':
      c.set(config.color);
      break;
    case 'cleared': {
      c.set(config.color);
      c.lerp(new THREE.Color('#4ade80'), 0.3);
      break;
    }
    case 'occupied': {
      c.set('#c9a227');
      const shimmer = Math.sin(time * 2.0) * 0.04;
      c.r = Math.min(1, c.r + shimmer);
      c.g = Math.min(1, c.g + shimmer * 0.5);
      break;
    }
  }

  return c;
}

// ═══════════════════════════════
// شبكة السداسيات (InstancedMesh)
// ═══════════════════════════════

function HexGrid({
  onSectorClick,
  onSectorHover,
}: {
  onSectorClick: (index: number) => void;
  onSectorHover: (index: number | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const sectors = useGameStore((s) => s.worldSectors);

  const hexGeometry = useMemo(() => createHexGeometry(), []);

  // بناء مصفوفات التحويل (ثابتة)
  const matrices = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < sectors.length; i++) {
      const sector = sectors[i];
      const [wx, wy, wz] = sectorWorldPos(sector);
      position.set(wx, wy, wz);
      matrix.compose(position, quaternion, scale);
      mats.push(matrix.clone());
    }

    return mats;
  }, [sectors]);

  // تعيين مصفوفات المثيلات
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < sectors.length; i++) {
      meshRef.current.setMatrixAt(i, matrices[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices, sectors.length]);

  // تحريك الألوان (نبض الضباب + لمعان المقر)
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < sectors.length; i++) {
      meshRef.current.setColorAt(i, getSectorColor(sectors[i], time));
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[hexGeometry, undefined, sectors.length]}
      onClick={(e) => {
        if (e.instanceId !== undefined) {
          e.stopPropagation();
          onSectorClick(e.instanceId);
        }
      }}
      onPointerMove={(e) => {
        if (e.instanceId !== undefined) {
          e.stopPropagation();
          onSectorHover(e.instanceId);
        }
      }}
      onPointerLeave={() => onSectorHover(null)}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.85}
        metalness={0.1}
        flatShading
      />
    </instancedMesh>
  );
}

// ═══════════════════════════════
// حدود السداسيات (Wireframe)
// ═══════════════════════════════

function HexBorders() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const sectors = useGameStore((s) => s.worldSectors);
  const hexGeometry = useMemo(() => createHexGeometry(), []);

  const matrices = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < sectors.length; i++) {
      const sector = sectors[i];
      const [wx, wy, wz] = sectorWorldPos(sector);
      position.set(wx, wy + HEX_DEPTH + 0.002, wz);
      matrix.compose(position, quaternion, scale);
      mats.push(matrix.clone());
    }

    return mats;
  }, [sectors]);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < sectors.length; i++) {
      meshRef.current.setMatrixAt(i, matrices[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices, sectors.length]);

  return (
    <instancedMesh ref={meshRef} args={[hexGeometry, undefined, sectors.length]}>
      <meshBasicMaterial color="#1a1a1a" wireframe transparent opacity={0.15} />
    </instancedMesh>
  );
}

// ═══════════════════════════════
// تمييز القطاع المحدد
// ═══════════════════════════════

function SelectedHighlight() {
  const glowRef = useRef<THREE.Mesh>(null);
  const selectedSector = useGameStore((s) => s.selectedSector);
  const hexGeometry = useMemo(() => createHexGeometry(), []);

  const position = useMemo((): [number, number, number] => {
    if (!selectedSector) return [0, -10, 0];
    const [wx, wy, wz] = sectorWorldPos(selectedSector);
    return [wx, wy + HEX_DEPTH + 0.004, wz];
  }, [selectedSector]);

  useFrame((state) => {
    if (!glowRef.current || !selectedSector) return;
    const mat = glowRef.current.material as THREE.MeshBasicMaterial;
    const pulse = 0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
    mat.opacity = pulse * 0.35;
  });

  if (!selectedSector) return null;

  return (
    <group position={position}>
      {/* حدود ذهبية */}
      <mesh geometry={hexGeometry}>
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
          flatShading
        />
      </mesh>
      {/* توهج خارجي نابض */}
      <mesh ref={glowRef} geometry={hexGeometry} position={[0, 0.008, 0]} scale={1.1}>
        <meshBasicMaterial color="#ffd700" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════
// تمييز القطاع عند التمرير
// ═══════════════════════════════

function HoverHighlight({ hoveredIndex }: { hoveredIndex: number | null }) {
  const sectors = useGameStore((s) => s.worldSectors);
  const hexGeometry = useMemo(() => createHexGeometry(), []);

  const position = useMemo((): [number, number, number] => {
    if (hoveredIndex === null || hoveredIndex >= sectors.length) return [0, -10, 0];
    const sector = sectors[hoveredIndex];
    const [wx, wy, wz] = sectorWorldPos(sector);
    return [wx, wy + HEX_DEPTH + 0.006, wz];
  }, [hoveredIndex, sectors]);

  if (hoveredIndex === null) return null;

  return (
    <mesh geometry={hexGeometry} position={position} scale={1.05}>
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.4}
        transparent
        opacity={0.12}
        flatShading
      />
    </mesh>
  );
}

// ═══════════════════════════════
// زخارف القطاعات (مُختصرة)
// ═══════════════════════════════

function SectorDecorations() {
  const sectors = useGameStore((s) => s.worldSectors);

  const decorations = useMemo(() => {
    const items: {
      key: string;
      type: 'tree' | 'cactus' | 'bush' | 'rock' | 'building' | 'flag';
      pos: [number, number, number];
      scale: number;
    }[] = [];

    for (let i = 0; i < sectors.length; i++) {
      const sector = sectors[i];
      if (sector.status === 'fogged') continue;

      const r = seededRandom(sector.coordinate.q * 19 + sector.coordinate.r * 37 + 42);
      if (r > 0.3) continue; // فقط 30%

      const [wx, wy, wz] = sectorWorldPos(sector);
      const ox = (seededRandom(sector.coordinate.q * 31 + sector.coordinate.r * 43) - 0.5) * 0.25;
      const oz = (seededRandom(sector.coordinate.q * 47 + sector.coordinate.r * 29) - 0.5) * 0.25;
      const scale = 0.5 + seededRandom(i * 23) * 0.5;

      let type: 'tree' | 'cactus' | 'bush' | 'rock' | 'building' | 'flag' | null = null;

      if (sector.type === 'forest') type = 'tree';
      else if (sector.type === 'desert') type = 'cactus';
      else if (sector.type === 'plains') type = 'bush';
      else if (sector.type === 'mountains') type = 'rock';
      else if (sector.type === 'urban') type = 'building';
      else if (sector.type === 'hq') type = 'flag';

      if (!type) continue;

      items.push({
        key: `dec-${sector.id}-${i}`,
        type,
        pos: [wx + ox, wy + HEX_DEPTH, wz + oz],
        scale: type === 'rock' ? scale * 1.2 : type === 'building' ? scale * 0.8 : type === 'flag' ? 1 : scale,
      });
    }

    return items;
  }, [sectors]);

  return (
    <group>
      {decorations.map((d) => {
        switch (d.type) {
          case 'tree':
            return (
              <group key={d.key} position={d.pos} scale={d.scale}>
                <mesh position={[0, 0.05, 0]} castShadow>
                  <cylinderGeometry args={[0.015, 0.02, 0.1, 4]} />
                  <meshStandardMaterial color="#6b4c2a" roughness={0.95} flatShading />
                </mesh>
                <mesh position={[0, 0.13, 0]} castShadow>
                  <coneGeometry args={[0.055, 0.1, 5]} />
                  <meshStandardMaterial color="#1e4a12" roughness={0.9} flatShading />
                </mesh>
                <mesh position={[0, 0.18, 0]} castShadow>
                  <coneGeometry args={[0.035, 0.07, 5]} />
                  <meshStandardMaterial color="#2d6a1e" roughness={0.9} flatShading />
                </mesh>
              </group>
            );
          case 'cactus':
            return (
              <group key={d.key} position={d.pos} scale={d.scale}>
                <mesh position={[0, 0.055, 0]} castShadow>
                  <cylinderGeometry args={[0.018, 0.022, 0.12, 5]} />
                  <meshStandardMaterial color="#2d6b2a" roughness={0.9} flatShading />
                </mesh>
                <mesh position={[0.035, 0.07, 0]} rotation={[0, 0, -0.6]} castShadow>
                  <cylinderGeometry args={[0.013, 0.016, 0.05, 4]} />
                  <meshStandardMaterial color="#2d6b2a" roughness={0.9} flatShading />
                </mesh>
              </group>
            );
          case 'bush':
            return (
              <mesh key={d.key} position={[d.pos[0], d.pos[1] + 0.02, d.pos[2]]} scale={d.scale} castShadow>
                <sphereGeometry args={[0.035, 4, 4]} />
                <meshStandardMaterial color="#3d6d32" roughness={0.95} flatShading />
              </mesh>
            );
          case 'rock':
            return (
              <mesh key={d.key} position={[d.pos[0], d.pos[1] + 0.025, d.pos[2]]} scale={d.scale} castShadow>
                <dodecahedronGeometry args={[0.045, 0]} />
                <meshStandardMaterial color="#8b8b8b" roughness={0.95} flatShading />
              </mesh>
            );
          case 'building':
            return (
              <group key={d.key} position={d.pos} scale={d.scale}>
                <mesh position={[0, 0.07, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.14, 0.08]} />
                  <meshStandardMaterial color="#7a7060" roughness={0.9} flatShading />
                </mesh>
                <mesh position={[0, 0.07, 0.041]}>
                  <planeGeometry args={[0.03, 0.03]} />
                  <meshStandardMaterial color="#3a4a5a" roughness={0.3} metalness={0.3} />
                </mesh>
              </group>
            );
          case 'flag':
            return (
              <group key={d.key} position={d.pos}>
                {/* عمود العلم */}
                <mesh position={[0, 0.13, 0]} castShadow>
                  <cylinderGeometry args={[0.008, 0.01, 0.28, 4]} />
                  <meshStandardMaterial color="#555555" roughness={0.7} metalness={0.3} flatShading />
                </mesh>
                {/* العلم */}
                <mesh position={[0.04, 0.24, 0]}>
                  <planeGeometry args={[0.06, 0.04]} />
                  <meshStandardMaterial color="#c9a227" roughness={0.8} side={THREE.DoubleSide} />
                </mesh>
                {/* نجمة ذهبية */}
                <mesh position={[0, 0.27, 0]} castShadow>
                  <octahedronGeometry args={[0.018, 0]} />
                  <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} flatShading />
                </mesh>
              </group>
            );
          default:
            return null;
        }
      })}
    </group>
  );
}

// ═══════════════════════════════
// مؤشرات مستوى التهديد
// ═══════════════════════════════

function ThreatIndicators() {
  const sectors = useGameStore((s) => s.worldSectors);

  const indicators = useMemo(() => {
    return sectors
      .filter((s) => s.status === 'scouted')
      .map((sector) => {
        const [wx, wy, wz] = sectorWorldPos(sector);
        return {
          position: [wx + 0.18, wy + HEX_DEPTH + 0.035, wz - 0.12] as [number, number, number],
          color: THREAT_CONFIG[sector.threatLevel].color,
          sectorId: sector.id,
        };
      });
  }, [sectors]);

  return (
    <group>
      {indicators.map((ind) => (
        <mesh key={ind.sectorId} position={ind.position}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color={ind.color} emissive={ind.color} emissiveIntensity={0.5} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════
// جسيمات الضباب
// ═══════════════════════════════

function FogParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const sectors = useGameStore((s) => s.worldSectors);

  const { positions, count } = useMemo(() => {
    const fogged = sectors.filter((s) => s.status === 'fogged');
    const maxCount = Math.min(fogged.length * 3, 60);
    const pos = new Float32Array(maxCount * 3);

    for (let i = 0; i < maxCount; i++) {
      const sector = fogged[i % fogged.length];
      const [wx, wy, wz] = sectorWorldPos(sector);
      pos[i * 3] = wx + (seededRandom(i * 17 + 3) - 0.5) * 0.6;
      pos[i * 3 + 1] = wy + HEX_DEPTH + 0.08 + seededRandom(i * 31 + 7) * 0.25;
      pos[i * 3 + 2] = wz + (seededRandom(i * 23 + 11) - 0.5) * 0.6;
    }

    return { positions: pos, count: maxCount };
  }, [sectors]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const arr = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.5 + i * 1.3) * 0.0004;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#555555" size={0.03} transparent opacity={0.25} sizeAttenuation />
    </points>
  );
}

// ═══════════════════════════════
// الأرضية / القاعدة
// ═══════════════════════════════

function GroundBase() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <circleGeometry args={[18, 48]} />
      <meshStandardMaterial color="#1e1e30" roughness={1} metalness={0} />
    </mesh>
  );
}

// ═══════════════════════════════
// نظام الإضاءة
// ═══════════════════════════════

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.35} color="#fff5e0" />
      <directionalLight
        position={[10, 16, 8]}
        intensity={0.75}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={40}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-5, 6, -5]} intensity={0.2} color="#aaddff" />
      <hemisphereLight args={['#87ceeb', '#4a5a3a', 0.2]} />
    </>
  );
}

// ═══════════════════════════════
// المشهد الرئيسي
// ═══════════════════════════════

function MapScene() {
  const selectWorldSector = useGameStore((s) => s.selectWorldSector);
  const sectors = useGameStore((s) => s.worldSectors);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSectorClick = useCallback(
    (index: number) => {
      if (index >= 0 && index < sectors.length) {
        selectWorldSector(sectors[index]);
      }
    },
    [sectors, selectWorldSector],
  );

  return (
    <>
      <SceneLighting />

      {/* الخلفية + ضباب المسافة */}
      <color attach="background" args={['#12121f']} />
      <fog attach="fog" args={['#12121f', 20, 30]} />

      {/* كاميرا إيزومترية */}
      <orthographicCamera makeDefault position={[0, 20, 14]} zoom={20} near={0.1} far={50} />

      {/* تحكم بالتحريك والتكبير */}
      <OrbitControls
        enablePan
        enableRotate={false}
        enableZoom
        minZoom={12}
        maxZoom={40}
        panSpeed={0.8}
        zoomSpeed={0.8}
        target={[0, 0, 0]}
      />

      {/* مكونات الخريطة */}
      <GroundBase />
      <HexGrid onSectorClick={handleSectorClick} onSectorHover={setHoveredIndex} />
      <HexBorders />
      <SelectedHighlight />
      <HoverHighlight hoveredIndex={hoveredIndex} />
      <SectorDecorations />
      <ThreatIndicators />
      <FogParticles />
    </>
  );
}

// ═══════════════════════════════
// تصدير المشهد مع Canvas
// ═══════════════════════════════

export default function WorldMapScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'low-power',
        }}
        style={{ touchAction: 'none' }}
      >
        <MapScene />
      </Canvas>
    </div>
  );
}
