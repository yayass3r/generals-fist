// ═══════════════════════════════════════════════════════════
// مشهد المعركة الإيزومتري - Isometric Battlefield Scene
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useWarRoomStore } from '@/store/war-room';
import { TERRAIN_CONFIG, TIME_CONFIG, type TerrainType, type TimeOfDay } from '@/lib/battle-engine';

// ═══════════════════════════════
// ثوابت الشبكة السداسية
// ═══════════════════════════════

const HEX_SIZE = 0.52;
const HEX_HEIGHT = 0.12;
const GRID_COLS = 7;
const GRID_ROWS = 7;

// حساب موضع السداسي
function getHexPosition(col: number, row: number): [number, number, number] {
  const x = HEX_SIZE * 1.5 * col;
  const z = HEX_SIZE * Math.sqrt(3) * (row + 0.5 * (col & 1));
  return [x, 0, z];
}

// إنشاء شكل سداسي
function createHexGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = HEX_SIZE * Math.cos(angle);
    const y = HEX_SIZE * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: HEX_HEIGHT,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

// ═══════════════════════════════
// مكون الشبكة السداسية
// ═══════════════════════════════

function HexGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const terrain = useWarRoomStore((s) => s.terrain);

  const hexGeometry = useMemo(() => createHexGeometry(), []);
  const totalHexes = GRID_COLS * GRID_ROWS;

  // إنشاء حالات السداسيات
  const { matrices, colors } = useMemo(() => {
    const terrainConf = TERRAIN_CONFIG[terrain];
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const color = new THREE.Color();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    // عشوائية ثابتة للتدرجات
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const [x, _, z] = getHexPosition(col, row);
        const heightVariation = seededRandom(col * 13 + row * 7) * 0.06 - 0.03;

        position.set(x, heightVariation, z);
        matrix.compose(position, quaternion, scale);
        mats.push(matrix.clone());

        const variantIndex = Math.floor(seededRandom(col * 17 + row * 23) * terrainConf.variants.length);
        color.set(terrainConf.variants[variantIndex]);
        cols.push(color.clone());
      }
    }

    return { matrices: mats, colors: cols };
  }, [terrain]);

  // تحديث مثيلات الشبكة
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    for (let i = 0; i < totalHexes; i++) {
      mesh.setMatrixAt(i, matrices[i]);
      mesh.setColorAt(i, colors[i]);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [matrices, colors, totalHexes]);

  return (
    <instancedMesh ref={meshRef} args={[hexGeometry, undefined, totalHexes]} castShadow receiveShadow>
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
// مكون الحدود السداسية (Wireframe)
// ═══════════════════════════════

function HexBorders() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hexGeometry = useMemo(() => createHexGeometry(), []);
  const totalHexes = GRID_COLS * GRID_ROWS;

  const matrices = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const [x, _, z] = getHexPosition(col, row);
        const heightVariation = seededRandom(col * 13 + row * 7) * 0.06 - 0.03;

        position.set(x, heightVariation + HEX_HEIGHT + 0.001, z);
        matrix.compose(position, quaternion, scale);
        mats.push(matrix.clone());
      }
    }

    return mats;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    for (let i = 0; i < totalHexes; i++) {
      mesh.setMatrixAt(i, matrices[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices, totalHexes]);

  return (
    <instancedMesh ref={meshRef} args={[hexGeometry, undefined, totalHexes]}>
      <meshBasicMaterial color="#1a1a1a" wireframe transparent opacity={0.25} />
    </instancedMesh>
  );
}

// ═══════════════════════════════
// نماذج القوات Low-Poly
// ═══════════════════════════════

function InfantrySoldier({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.015;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* الجسم */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <capsuleGeometry args={[0.04, 0.1, 2, 4]} />
        <meshStandardMaterial color="#3a5c30" roughness={0.9} flatShading />
      </mesh>
      {/* الرأس */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.035, 4, 4]} />
        <meshStandardMaterial color="#8a7a60" roughness={0.9} flatShading />
      </mesh>
      {/* الخوذة */}
      <mesh position={[0, 0.21, 0]}>
        <sphereGeometry args={[0.03, 4, 3, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a3c20" roughness={0.8} flatShading />
      </mesh>
      {/* السلاح */}
      <mesh position={[0.05, 0.1, 0.06]} rotation={[0.3, 0, 0.2]} castShadow>
        <boxGeometry args={[0.01, 0.01, 0.12]} />
        <meshStandardMaterial color="#333" roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

function Tank({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[2]) * 0.01;
  });

  return (
    <group ref={groupRef} position={position} scale={1.3}>
      {/* الجسم الرئيسي */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.28]} />
        <meshStandardMaterial color="#4a5a3a" roughness={0.9} flatShading />
      </mesh>
      {/* البرج */}
      <mesh position={[0, 0.14, -0.02]} castShadow>
        <boxGeometry args={[0.1, 0.06, 0.14]} />
        <meshStandardMaterial color="#3a4a2a" roughness={0.85} flatShading />
      </mesh>
      {/* المدفع */}
      <mesh position={[0, 0.15, 0.14]} rotation={[0.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.015, 0.15, 4]} />
        <meshStandardMaterial color="#333" roughness={0.7} flatShading />
      </mesh>
      {/* الجنزير الأيسر */}
      <mesh position={[-0.11, 0.03, 0]} castShadow>
        <boxGeometry args={[0.035, 0.05, 0.3]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} flatShading />
      </mesh>
      {/* الجنزير الأيمن */}
      <mesh position={[0.11, 0.03, 0]} castShadow>
        <boxGeometry args={[0.035, 0.05, 0.3]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function Helicopter({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const rotorRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.04;
    if (rotorRef.current) {
      rotorRef.current.rotation.y += 0.4;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={1.2}>
      {/* الجسم */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.12, 2, 6]} />
        <meshStandardMaterial color="#6a7a8a" roughness={0.7} metalness={0.3} flatShading />
      </mesh>
      {/* الذيل */}
      <mesh position={[0, 0.06, -0.16]} castShadow>
        <boxGeometry args={[0.03, 0.03, 0.12]} />
        <meshStandardMaterial color="#5a6a7a" roughness={0.7} metalness={0.3} flatShading />
      </mesh>
      {/* الزعنفة الذيلية */}
      <mesh position={[0, 0.1, -0.22]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.005, 0.04]} />
        <meshStandardMaterial color="#5a6a7a" roughness={0.7} metalness={0.3} flatShading />
      </mesh>
      {/* الجناح */}
      <mesh position={[0, 0.03, 0.02]}>
        <boxGeometry args={[0.22, 0.01, 0.06]} />
        <meshStandardMaterial color="#5a6a7a" roughness={0.7} metalness={0.2} flatShading />
      </mesh>
      {/* المروحة */}
      <mesh ref={rotorRef} position={[0, 0.13, 0.02]}>
        <boxGeometry args={[0.35, 0.005, 0.03]} />
        <meshStandardMaterial color="#444" roughness={0.5} metalness={0.4} transparent opacity={0.7} />
      </mesh>
      {/* الزجاج الأمامي */}
      <mesh position={[0, 0.08, 0.08]} rotation={[-0.3, 0, 0]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshStandardMaterial color="#88bbee" roughness={0.1} metalness={0.5} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════
// نشر القوات على الخريطة
// ═══════════════════════════════

function DeployedTroops() {
  const waves = useWarRoomStore((s) => s.waves);

  const troops = useMemo(() => {
    const result: { type: 'infantry' | 'armor' | 'aviation'; position: [number, number, number] }[] = [];

    waves.forEach((wave, waveIndex) => {
      wave.forEach((slot, slotIndex) => {
        if (!slot.troopType || slot.count === 0) return;

        const displayCount = Math.min(slot.count, 4); // أقصى 4 نماذج مرئية
        const baseX = 0.3 + slotIndex * 1.5;
        const baseZ = -1.5 + waveIndex * 1.8;

        for (let i = 0; i < displayCount; i++) {
          const offsetX = (Math.random() - 0.5) * 0.5;
          const offsetZ = (Math.random() - 0.5) * 0.4;
          const yOffset = slot.troopType === 'aviation' ? 0.35 : HEX_HEIGHT;
          result.push({
            type: slot.troopType,
            position: [baseX + offsetX, yOffset, baseZ + offsetZ],
          });
        }
      });
    });

    return result;
  }, [waves]);

  return (
    <group>
      {troops.map((troop, i) => {
        const key = `${troop.type}-${i}`;
        switch (troop.type) {
          case 'infantry':
            return <InfantrySoldier key={key} position={troop.position} />;
          case 'armor':
            return <Tank key={key} position={troop.position} />;
          case 'aviation':
            return <Helicopter key={key} position={troop.position} />;
          default:
            return null;
        }
      })}
    </group>
  );
}

// ═══════════════════════════════
// نظام الإضاءة
// ═══════════════════════════════

function SceneLighting() {
  const timeOfDay = useWarRoomStore((s) => s.timeOfDay);
  const timeConf = TIME_CONFIG[timeOfDay];
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetIntensity = timeConf.lightIntensity;
  const targetColor = new THREE.Color(timeConf.lightColor);
  const targetAmbient = timeConf.ambientIntensity;

  useFrame(() => {
    if (!lightRef.current) return;
    // انتقال سلس بين النهار والليل
    lightRef.current.intensity += (targetIntensity - lightRef.current.intensity) * 0.05;
    lightRef.current.color.lerp(targetColor, 0.05);
  });

  return (
    <>
      <ambientLight intensity={targetAmbient} color={timeOfDay === 'day' ? '#fff5e0' : '#1a2040'} />
      <directionalLight
        ref={lightRef}
        position={[8, 12, 6]}
        intensity={targetIntensity}
        color={timeConf.lightColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* إضاءة ملء */}
      <directionalLight
        position={[-5, 4, -5]}
        intensity={timeOfDay === 'day' ? 0.3 : 0.1}
        color={timeOfDay === 'day' ? '#aaddff' : '#223355'}
      />
      {/* توهج أرضي */}
      <hemisphereLight
        args={[
          timeOfDay === 'day' ? '#87ceeb' : '#0a1628',
          timeOfDay === 'day' ? '#4a7c3f' : '#1a1a2a',
          timeOfDay === 'day' ? 0.3 : 0.1,
        ]}
      />
    </>
  );
}

// ═══════════════════════════════
// العلامات التضاريسية
// ═══════════════════════════════

function TerrainDecorations() {
  const terrain = useWarRoomStore((s) => s.terrain);

  const decorations = useMemo(() => {
    const items: { type: 'rock' | 'tree' | 'cactus' | 'building' | 'bush'; position: [number, number, number]; scale: number }[] = [];
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const r = seededRandom(col * 19 + row * 37);
        if (r > 0.35) continue; // فقط 35% من السداسيات تحصل على زخرفة

        const [x, _, z] = getHexPosition(col, row);
        const hVariation = seededRandom(col * 13 + row * 7) * 0.06 - 0.03;
        const scale = 0.5 + seededRandom(col * 23 + row * 41) * 0.6;

        if (terrain === 'plains') {
          items.push({
            type: r > 0.5 ? 'tree' : 'bush',
            position: [x + (seededRandom(col * 31) - 0.5) * 0.3, hVariation + HEX_HEIGHT, z + (seededRandom(row * 29) - 0.5) * 0.3],
            scale,
          });
        } else if (terrain === 'desert') {
          items.push({
            type: r > 0.7 ? 'rock' : 'cactus',
            position: [x + (seededRandom(col * 31) - 0.5) * 0.3, hVariation + HEX_HEIGHT, z + (seededRandom(row * 29) - 0.5) * 0.3],
            scale,
          });
        } else if (terrain === 'mountains') {
          items.push({
            type: 'rock',
            position: [x + (seededRandom(col * 31) - 0.5) * 0.3, hVariation + HEX_HEIGHT, z + (seededRandom(row * 29) - 0.5) * 0.3],
            scale: scale * 1.2,
          });
        } else if (terrain === 'urban') {
          items.push({
            type: r > 0.4 ? 'building' : 'bush',
            position: [x + (seededRandom(col * 31) - 0.5) * 0.2, hVariation + HEX_HEIGHT, z + (seededRandom(row * 29) - 0.5) * 0.2],
            scale: scale * 0.8,
          });
        }
      }
    }

    return items;
  }, [terrain]);

  return (
    <group>
      {decorations.map((dec, i) => {
        switch (dec.type) {
          case 'tree':
            return (
              <group key={i} position={dec.position} scale={dec.scale}>
                <mesh position={[0, 0.05, 0]} castShadow>
                  <cylinderGeometry args={[0.015, 0.02, 0.12, 4]} />
                  <meshStandardMaterial color="#6b4c2a" roughness={0.95} flatShading />
                </mesh>
                <mesh position={[0, 0.14, 0]} castShadow>
                  <coneGeometry args={[0.06, 0.12, 5]} />
                  <meshStandardMaterial color="#2d5a1e" roughness={0.9} flatShading />
                </mesh>
                <mesh position={[0, 0.19, 0]} castShadow>
                  <coneGeometry args={[0.04, 0.08, 5]} />
                  <meshStandardMaterial color="#357a28" roughness={0.9} flatShading />
                </mesh>
              </group>
            );
          case 'bush':
            return (
              <mesh key={i} position={[dec.position[0], dec.position[1] + 0.025, dec.position[2]]} scale={dec.scale} castShadow>
                <sphereGeometry args={[0.04, 4, 4]} />
                <meshStandardMaterial color="#3d6d32" roughness={0.95} flatShading />
              </mesh>
            );
          case 'rock':
            return (
              <mesh key={i} position={[dec.position[0], dec.position[1] + 0.03, dec.position[2]]} scale={dec.scale} rotation={[0, Math.random() * Math.PI, 0]} castShadow>
                <dodecahedronGeometry args={[0.05, 0]} />
                <meshStandardMaterial color={terrain === 'mountains' ? '#8b8b8b' : '#9a8a7a'} roughness={0.95} flatShading />
              </mesh>
            );
          case 'cactus':
            return (
              <group key={i} position={dec.position} scale={dec.scale}>
                <mesh position={[0, 0.06, 0]} castShadow>
                  <cylinderGeometry args={[0.02, 0.025, 0.14, 5]} />
                  <meshStandardMaterial color="#2d6b2a" roughness={0.9} flatShading />
                </mesh>
                <mesh position={[0.04, 0.08, 0]} rotation={[0, 0, -0.6]} castShadow>
                  <cylinderGeometry args={[0.015, 0.018, 0.06, 4]} />
                  <meshStandardMaterial color="#2d6b2a" roughness={0.9} flatShading />
                </mesh>
              </group>
            );
          case 'building':
            return (
              <group key={i} position={dec.position} scale={dec.scale}>
                <mesh position={[0, 0.08, 0]} castShadow>
                  <boxGeometry args={[0.1, 0.16, 0.1]} />
                  <meshStandardMaterial color="#8a8070" roughness={0.9} flatShading />
                </mesh>
                <mesh position={[0, 0.08, 0.051]}>
                  <planeGeometry args={[0.04, 0.04]} />
                  <meshStandardMaterial color="#3a4a5a" roughness={0.3} metalness={0.3} />
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
// السحابة / الجسيمات الجوية
// ═══════════════════════════════

function AtmosphericParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const timeOfDay = useWarRoomStore((s) => s.timeOfDay);

  const positions = useMemo(() => {
    const pos = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = 1 + Math.random() * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < 60; i++) {
      posArray[i * 3] += 0.003;
      if (posArray[i * 3] > 5) posArray[i * 3] = -5;
      posArray[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={60}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={timeOfDay === 'day' ? '#ffffff' : '#445566'}
        size={0.04}
        transparent
        opacity={timeOfDay === 'day' ? 0.4 : 0.2}
        sizeAttenuation
      />
    </points>
  );
}

// ═══════════════════════════════
// الأرضية / القاعدة
// ═══════════════════════════════

function GroundBase() {
  const terrain = useWarRoomStore((s) => s.terrain);
  const timeConf = TIME_CONFIG[useWarRoomStore((s) => s.timeOfDay)];

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial
        color={terrain === 'desert' ? '#a08830' : terrain === 'mountains' ? '#5a5a5a' : terrain === 'urban' ? '#605848' : '#3a5c2a'}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

// ═══════════════════════════════
// المشهد الرئيسي
// ═══════════════════════════════

function BattleScene() {
  const timeOfDay = useWarRoomStore((s) => s.timeOfDay);
  const timeConf = TIME_CONFIG[timeOfDay];

  return (
    <>
      {/* الإضاءة */}
      <SceneLighting />

      {/* الخلفية */}
      <color attach="background" args={[timeConf.skyColor]} />
      <fog attach="fog" args={[timeConf.fogColor, 8, 16]} />

      {/* الكاميرا */}
      <orthographicCamera
        makeDefault
        position={[6, 8, 6]}
        zoom={48}
        near={0.1}
        far={50}
      />

      {/* التحكم */}
      <OrbitControls
        enablePan={false}
        enableRotate
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={Math.PI / 5}
        maxAzimuthAngle={Math.PI / 6}
        minAzimuthAngle={-Math.PI / 6}
        enableZoom
        minZoom={35}
        maxZoom={65}
        target={[0, 0, 0]}
      />

      {/* المشهد */}
      <GroundBase />
      <HexGrid />
      <HexBorders />
      <TerrainDecorations />
      <DeployedTroops />
      <AtmosphericParticles />
    </>
  );
}

// ═══════════════════════════════
// تصدير المشهد مع Canvas
// ═══════════════════════════════

export default function IsometricScene() {
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
        <BattleScene />
      </Canvas>
    </div>
  );
}
