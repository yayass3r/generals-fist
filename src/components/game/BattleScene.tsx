// ═══════════════════════════════════════════════════════════
// مشهد محاكاة المعركة - 3D Battle Simulation Scene
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/game-store';
import type { BattleUnit, TacticType } from '@/lib/battle-simulation';

// ═══════════════════════════════
// ثوابت المشهد
// ═══════════════════════════════

const FIELD_WIDTH = 16;
const FIELD_DEPTH = 10;
const MAX_VISIBLE_UNITS = 30;
const ATTACK_FLASH_DURATION = 0.4;
const MAX_ATTACK_FLASHES = 15;

interface AttackFlashData {
  x: number;
  z: number;
  time: number;
}

// ═══════════════════════════════
// ألوان الفرق
// ═══════════════════════════════

const PLAYER_COLORS = {
  infantry: { body: '#4a6a3a', head: '#9a8a60', helmet: '#3a4c20', weapon: '#444' },
  armor: { body: '#5a6a4a', turret: '#4a5a3a', cannon: '#444', treads: '#333' },
  aviation: { body: '#7a8a9a', tail: '#6a7a8a', rotor: '#555', cockpit: '#88bbee' },
};

const ENEMY_COLORS = {
  infantry: { body: '#6a3a3a', head: '#8a7060', helmet: '#4a2020', weapon: '#333' },
  armor: { body: '#5a3a3a', turret: '#4a2a2a', cannon: '#333', treads: '#2a2a2a' },
  aviation: { body: '#6a5a6a', tail: '#5a4a5a', rotor: '#444', cockpit: '#8866aa' },
};

const DEAD_COLOR = '#888888';

// ═══════════════════════════════
// الأرضية - Battlefield Ground
// ═══════════════════════════════

function BattlefieldGround() {
  return (
    <group>
      {/* الأرضية الرئيسية */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[FIELD_WIDTH, FIELD_DEPTH]} />
        <meshStandardMaterial color="#3a3528" roughness={1} metalness={0} />
      </mesh>
      {/* خطوط الحفر / العلامات */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
        <planeGeometry args={[FIELD_WIDTH - 0.5, FIELD_DEPTH - 0.5]} />
        <meshStandardMaterial color="#332e22" roughness={1} metalness={0} />
      </mesh>
      {/* مناطق متضررة */}
      <BattlefieldCraters />
    </group>
  );
}

function BattlefieldCraters() {
  const craters = useMemo(() => {
    const result: { position: [number, number, number]; scale: number }[] = [];
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 12; i++) {
      result.push({
        position: [
          (seededRandom(i * 13 + 7) - 0.5) * (FIELD_WIDTH - 2),
          -0.01,
          (seededRandom(i * 23 + 11) - 0.5) * (FIELD_DEPTH - 2),
        ],
        scale: 0.3 + seededRandom(i * 37 + 5) * 0.6,
      });
    }
    return result;
  }, []);

  return (
    <group>
      {craters.map((c, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={c.position}
          scale={c.scale}
        >
          <circleGeometry args={[1, 6]} />
          <meshStandardMaterial color="#2a2518" roughness={1} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════
// زخارف المعركة
// ═══════════════════════════════

function BattlefieldDecorations() {
  const decorations = useMemo(() => {
    const items: { type: 'rock' | 'sandbag' | 'wreck'; position: [number, number, number]; scale: number; rotation: number }[] = [];
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 20; i++) {
      const r = seededRandom(i * 17 + 3);
      const type = r > 0.6 ? 'wreck' : r > 0.3 ? 'sandbag' : 'rock';
      items.push({
        type,
        position: [
          (seededRandom(i * 13 + 7) - 0.5) * (FIELD_WIDTH - 1),
          0,
          (seededRandom(i * 23 + 11) - 0.5) * (FIELD_DEPTH - 1),
        ],
        scale: 0.4 + seededRandom(i * 31 + 19) * 0.5,
        rotation: seededRandom(i * 41 + 2) * Math.PI,
      });
    }
    return items;
  }, []);

  return (
    <group>
      {decorations.map((dec, i) => {
        switch (dec.type) {
          case 'rock':
            return (
              <mesh
                key={i}
                position={[dec.position[0], dec.position[1] + 0.02, dec.position[2]]}
                scale={dec.scale}
                rotation={[0, dec.rotation, 0]}
                castShadow
              >
                <dodecahedronGeometry args={[0.06, 0]} />
                <meshStandardMaterial color="#5a5248" roughness={0.95} flatShading />
              </mesh>
            );
          case 'sandbag':
            return (
              <group key={i} position={dec.position} scale={dec.scale} rotation={[0, dec.rotation, 0]}>
                <mesh position={[0, 0.02, 0]} castShadow>
                  <boxGeometry args={[0.12, 0.04, 0.05]} />
                  <meshStandardMaterial color="#8a7a5a" roughness={0.95} flatShading />
                </mesh>
                <mesh position={[0, 0.06, 0]} castShadow>
                  <boxGeometry args={[0.11, 0.04, 0.05]} />
                  <meshStandardMaterial color="#7a6a4a" roughness={0.95} flatShading />
                </mesh>
              </group>
            );
          case 'wreck':
            return (
              <group key={i} position={dec.position} scale={dec.scale} rotation={[0, dec.rotation, 0.15]}>
                <mesh position={[0, 0.04, 0]} castShadow>
                  <boxGeometry args={[0.14, 0.06, 0.22]} />
                  <meshStandardMaterial color="#4a4a4a" roughness={0.95} flatShading />
                </mesh>
                <mesh position={[0.03, 0.08, -0.05]} rotation={[0, 0, 0.3]} castShadow>
                  <boxGeometry args={[0.04, 0.03, 0.08]} />
                  <meshStandardMaterial color="#3a3a3a" roughness={0.95} flatShading />
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
// نموذج المشاة
// ═══════════════════════════════

function InfantryUnit({
  unit,
  colors,
}: {
  unit: BattleUnit;
  colors: typeof PLAYER_COLORS.infantry;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isDead = !unit.isAlive;
  const hpRatio = unit.currentHp / unit.maxHp;

  useFrame((state) => {
    if (!groupRef.current) return;
    if (isDead) return;

    const baseY = unit.type === 'aviation' ? 0.35 : 0.0;
    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isMoving = dist > 0.3;
    const bobAmount = isMoving ? 0.02 : 0.005;

    groupRef.current.position.set(unit.x, baseY + Math.sin(state.clock.elapsedTime * 3 + unit.x * 2) * bobAmount, unit.y);

    // Face movement direction
    if (isMoving) {
      const angle = Math.atan2(dx, dy);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.05);
    }
  });

  if (isDead) {
    return (
      <group position={[unit.x, 0, unit.y]} rotation={[0, 0, Math.PI / 2]}>
        <mesh position={[0, 0.02, 0]}>
          <capsuleGeometry args={[0.04, 0.1, 2, 4]} />
          <meshStandardMaterial color={DEAD_COLOR} roughness={0.95} flatShading transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.06, 0.02, 0]}>
          <sphereGeometry args={[0.035, 4, 4]} />
          <meshStandardMaterial color={DEAD_COLOR} roughness={0.95} flatShading transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {/* الجسم */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <capsuleGeometry args={[0.04, 0.1, 2, 4]} />
        <meshStandardMaterial color={colors.body} roughness={0.9} flatShading />
      </mesh>
      {/* الرأس */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.035, 4, 4]} />
        <meshStandardMaterial color={colors.head} roughness={0.9} flatShading />
      </mesh>
      {/* الخوذة */}
      <mesh position={[0, 0.21, 0]}>
        <sphereGeometry args={[0.03, 4, 3, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={colors.helmet} roughness={0.8} flatShading />
      </mesh>
      {/* السلاح */}
      <mesh position={[0.05, 0.1, 0.06]} rotation={[0.3, 0, 0.2]} castShadow>
        <boxGeometry args={[0.01, 0.01, 0.12]} />
        <meshStandardMaterial color={colors.weapon} roughness={0.7} flatShading />
      </mesh>
      {/* شريط الصحة */}
      <HealthBar hpRatio={hpRatio} yOffset={0.28} />
    </group>
  );
}

// ═══════════════════════════════
// نموذج المدرعات / الدبابة
// ═══════════════════════════════

function ArmorUnit({
  unit,
  colors,
}: {
  unit: BattleUnit;
  colors: typeof PLAYER_COLORS.armor;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isDead = !unit.isAlive;
  const hpRatio = unit.currentHp / unit.maxHp;

  useFrame((state) => {
    if (!groupRef.current) return;
    if (isDead) return;

    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isMoving = dist > 0.3;
    const bobAmount = isMoving ? 0.012 : 0.003;

    groupRef.current.position.set(unit.x, Math.sin(state.clock.elapsedTime * 1.5 + unit.y * 2) * bobAmount, unit.y);

    if (isMoving) {
      const angle = Math.atan2(dx, dy);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.03);
    }
  });

  if (isDead) {
    return (
      <group position={[unit.x, 0, unit.y]} rotation={[0.1, 0, 0]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.18, 0.06, 0.26]} />
          <meshStandardMaterial color={DEAD_COLOR} roughness={0.95} flatShading transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.04, 0.07, -0.06]}>
          <boxGeometry args={[0.08, 0.04, 0.1]} />
          <meshStandardMaterial color={DEAD_COLOR} roughness={0.95} flatShading transparent opacity={0.4} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} scale={1.3}>
      {/* الجسم الرئيسي */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.28]} />
        <meshStandardMaterial color={colors.body} roughness={0.9} flatShading />
      </mesh>
      {/* البرج */}
      <mesh position={[0, 0.14, -0.02]} castShadow>
        <boxGeometry args={[0.1, 0.06, 0.14]} />
        <meshStandardMaterial color={colors.turret} roughness={0.85} flatShading />
      </mesh>
      {/* المدفع */}
      <mesh position={[0, 0.15, 0.14]} rotation={[0.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.015, 0.15, 4]} />
        <meshStandardMaterial color={colors.cannon} roughness={0.7} flatShading />
      </mesh>
      {/* الجنزير الأيسر */}
      <mesh position={[-0.11, 0.03, 0]} castShadow>
        <boxGeometry args={[0.035, 0.05, 0.3]} />
        <meshStandardMaterial color={colors.treads} roughness={0.95} flatShading />
      </mesh>
      {/* الجنزير الأيمن */}
      <mesh position={[0.11, 0.03, 0]} castShadow>
        <boxGeometry args={[0.035, 0.05, 0.3]} />
        <meshStandardMaterial color={colors.treads} roughness={0.95} flatShading />
      </mesh>
      {/* شريط الصحة */}
      <HealthBar hpRatio={hpRatio} yOffset={0.22} />
    </group>
  );
}

// ═══════════════════════════════
// نموذج الطيران / المروحية
// ═══════════════════════════════

function AviationUnit({
  unit,
  colors,
}: {
  unit: BattleUnit;
  colors: typeof PLAYER_COLORS.aviation;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const rotorRef = useRef<THREE.Mesh>(null);
  const tailRotorRef = useRef<THREE.Mesh>(null);
  const isDead = !unit.isAlive;
  const hpRatio = unit.currentHp / unit.maxHp;

  useFrame((state) => {
    if (!groupRef.current) return;

    if (isDead) {
      groupRef.current.position.y = Math.max(0, groupRef.current.position.y - 0.01);
      groupRef.current.rotation.z = Math.min(Math.PI / 4, groupRef.current.rotation.z + 0.01);
      return;
    }

    groupRef.current.position.set(
      unit.x,
      0.35 + Math.sin(state.clock.elapsedTime * 1.2 + unit.x) * 0.04,
      unit.y
    );

    // Face movement direction
    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0.3) {
      const angle = Math.atan2(dx, dy);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.04);
    }

    // Spin rotors
    if (rotorRef.current) {
      rotorRef.current.rotation.y += 0.4;
    }
    if (tailRotorRef.current) {
      tailRotorRef.current.rotation.x += 0.6;
    }
  });

  if (isDead) {
    return (
      <group position={[unit.x, 0.1, unit.y]} rotation={[0.2, 0, 0.3]}>
        <mesh position={[0, 0.06, 0]}>
          <capsuleGeometry args={[0.06, 0.12, 2, 6]} />
          <meshStandardMaterial color={DEAD_COLOR} roughness={0.95} flatShading transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} scale={1.2}>
      {/* الجسم */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.12, 2, 6]} />
        <meshStandardMaterial color={colors.body} roughness={0.7} metalness={0.3} flatShading />
      </mesh>
      {/* الذيل */}
      <mesh position={[0, 0.06, -0.16]} castShadow>
        <boxGeometry args={[0.03, 0.03, 0.12]} />
        <meshStandardMaterial color={colors.tail} roughness={0.7} metalness={0.3} flatShading />
      </mesh>
      {/* الزعنفة الذيلية */}
      <mesh position={[0, 0.1, -0.22]}>
        <boxGeometry args={[0.1, 0.005, 0.04]} />
        <meshStandardMaterial color={colors.tail} roughness={0.7} metalness={0.3} flatShading />
      </mesh>
      {/* الجناح */}
      <mesh position={[0, 0.03, 0.02]}>
        <boxGeometry args={[0.22, 0.01, 0.06]} />
        <meshStandardMaterial color={colors.tail} roughness={0.7} metalness={0.2} flatShading />
      </mesh>
      {/* المروحة الرئيسية */}
      <mesh ref={rotorRef} position={[0, 0.13, 0.02]}>
        <boxGeometry args={[0.35, 0.005, 0.03]} />
        <meshStandardMaterial color={colors.rotor} roughness={0.5} metalness={0.4} transparent opacity={0.7} />
      </mesh>
      {/* مروحة الذيل */}
      <mesh ref={tailRotorRef} position={[0, 0.1, -0.22]}>
        <boxGeometry args={[0.005, 0.04, 0.01]} />
        <meshStandardMaterial color={colors.rotor} roughness={0.5} metalness={0.4} transparent opacity={0.6} />
      </mesh>
      {/* الزجاج الأمامي */}
      <mesh position={[0, 0.08, 0.08]} rotation={[-0.3, 0, 0]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshStandardMaterial color={colors.cockpit} roughness={0.1} metalness={0.5} transparent opacity={0.6} />
      </mesh>
      {/* شريط الصحة */}
      <HealthBar hpRatio={hpRatio} yOffset={0.22} />
    </group>
  );
}

// ═══════════════════════════════
// شريط الصحة
// ═══════════════════════════════

function HealthBar({ hpRatio, yOffset }: { hpRatio: number; yOffset: number }) {
  const color = useMemo(() => {
    if (hpRatio > 0.6) return '#4caf50';
    if (hpRatio > 0.3) return '#ff9800';
    return '#f44336';
  }, [hpRatio]);

  const bgRef = useRef<THREE.Mesh>(null);
  const fillRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!bgRef.current || !fillRef.current) return;
    // Billboard - face camera
    const camera = bgRef.current.parent?.parent;
    if (camera) return; // we'll use lookAt via the group
  });

  return (
    <group position={[0, yOffset, 0]}>
      {/* خلفية */}
      <mesh ref={bgRef}>
        <planeGeometry args={[0.14, 0.02]} />
        <meshBasicMaterial color="#222222" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* ملء */}
      <mesh ref={fillRef} position={[(hpRatio - 1) * 0.07, 0, 0.001]}>
        <planeGeometry args={[0.14 * hpRatio, 0.016]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════
// تأثير وميض الهجوم
// ═══════════════════════════════

function AttackFlashes({ flashes }: { flashes: AttackFlashData[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const now = state.clock.elapsedTime;

    for (let i = 0; i < MAX_ATTACK_FLASHES; i++) {
      if (i < flashes.length) {
        const flash = flashes[i];
        const age = now - flash.time;
        if (age > ATTACK_FLASH_DURATION) {
          tempScale.set(0, 0, 0);
        } else {
          const progress = age / ATTACK_FLASH_DURATION;
          const s = 0.1 + progress * 0.15;
          tempScale.set(s, s, s);
          tempPos.set(flash.x, 0.15 + age * 0.5, flash.z);
          const r = 1.0;
          const g = 0.8 - progress * 0.6;
          const b = 0.2 - progress * 0.2;
          tempColor.setRGB(r, g, b);
          meshRef.current.setColorAt(i, tempColor);
        }
      } else {
        tempScale.set(0, 0, 0);
        tempPos.set(0, -10, 0);
      }
      tempQuat.identity();
      tempMatrix.compose(tempPos, tempQuat, tempScale);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 4, 4), []);

  return (
    <instancedMesh ref={meshRef} args={[sphereGeo, undefined, MAX_ATTACK_FLASHES]}>
      <meshBasicMaterial transparent opacity={0.8} />
    </instancedMesh>
  );
}

// ═══════════════════════════════
// تأثير الساتر الدخاني
// ═══════════════════════════════

function SmokeScreenEffect({ isActive }: { isActive: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = 0.3 + Math.random() * 1.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current || !isActive) return;
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < 50; i++) {
      posArray[i * 3] += Math.sin(t * 0.5 + i * 0.3) * 0.005;
      posArray[i * 3 + 1] += Math.sin(t * 0.3 + i * 0.7) * 0.003;
      posArray[i * 3 + 2] += Math.cos(t * 0.4 + i * 0.5) * 0.004;

      // Keep within bounds
      if (posArray[i * 3] > 2) posArray[i * 3] = -2;
      if (posArray[i * 3] < -2) posArray[i * 3] = 2;
      if (posArray[i * 3 + 1] > 1.5) posArray[i * 3 + 1] = 0.3;
      if (posArray[i * 3 + 2] > 1.5) posArray[i * 3 + 2] = -1.5;
      if (posArray[i * 3 + 2] < -1.5) posArray[i * 3 + 2] = 1.5;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    (particlesRef.current.material as THREE.PointsMaterial).opacity = 0.3 + Math.sin(t * 2) * 0.1;
  });

  if (!isActive) return null;

  return (
    <group position={[0, 0, 0]}>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={50}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#aaaaaa"
          size={0.15}
          transparent
          opacity={0.35}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      {/* ضباب سميك */}
      <mesh position={[0, 0.5, 0]} scale={[4, 1.5, 3]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color="#999999"
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════
// تأثير الدعم الجوي
// ═══════════════════════════════

function AirSupportEffect({ isActive }: { isActive: boolean }) {
  const planeRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!planeRef.current || !isActive) return;
    const t = state.clock.elapsedTime;

    // Plane flies across the battlefield
    const cycleTime = 6; // seconds for one pass
    const progress = (t % cycleTime) / cycleTime;
    const x = -10 + progress * 20;
    const z = Math.sin(t * 0.5) * 2;
    const y = 3 + Math.sin(t * 0.8) * 0.3;

    planeRef.current.position.set(x, y, z);
    planeRef.current.rotation.z = Math.sin(t * 0.3) * 0.1;
  });

  if (!isActive) return null;

  return (
    <group ref={planeRef}>
      {/* جسم الطائرة */}
      <mesh castShadow>
        <boxGeometry args={[0.15, 0.04, 0.4]} />
        <meshStandardMaterial color="#556677" roughness={0.6} metalness={0.3} flatShading />
      </mesh>
      {/* الجناحان */}
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[0.7, 0.01, 0.12]} />
        <meshStandardMaterial color="#4a5a6a" roughness={0.6} metalness={0.3} flatShading />
      </mesh>
      {/* الذيل */}
      <mesh position={[0, 0.02, -0.22]} castShadow>
        <boxGeometry args={[0.2, 0.06, 0.03]} />
        <meshStandardMaterial color="#4a5a6a" roughness={0.6} metalness={0.3} flatShading />
      </mesh>
      {/* مؤثر الظل على الأرض */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <circleGeometry args={[0.3, 4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════
// تأثير القصف المدفعي
// ═══════════════════════════════

function ArtilleryEffect({ isActive }: { isActive: boolean }) {
  const explosionsRef = useRef<THREE.InstancedMesh>(null);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);

  const explosionCenters = useMemo(() => {
    const centers: { x: number; z: number; phase: number }[] = [];
    for (let i = 0; i < 8; i++) {
      centers.push({
        x: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 6,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return centers;
  }, []);

  useFrame((state) => {
    if (!explosionsRef.current || !isActive) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < 8; i++) {
      const center = explosionCenters[i];
      const cycle = 2.0; // seconds per explosion
      const phase = (t + center.phase) % cycle;
      const intensity = Math.max(0, Math.sin((phase / cycle) * Math.PI));

      if (intensity > 0.1) {
        const s = intensity * 0.25;
        tempScale.set(s, s * 1.5, s);
        tempPos.set(
          center.x + Math.sin(t + i) * 0.3,
          0.1 + intensity * 0.4,
          center.z + Math.cos(t + i) * 0.3
        );
        tempColor.setRGB(1.0, 0.5 * intensity, 0.1 * intensity);
        explosionsRef.current.setColorAt(i, tempColor);
      } else {
        tempScale.set(0.001, 0.001, 0.001);
        tempPos.set(0, -10, 0);
      }

      tempQuat.identity();
      tempMatrix.compose(tempPos, tempQuat, tempScale);
      explosionsRef.current.setMatrixAt(i, tempMatrix);
    }

    explosionsRef.current.instanceMatrix.needsUpdate = true;
    if (explosionsRef.current.instanceColor) explosionsRef.current.instanceColor.needsUpdate = true;
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 4, 4), []);

  if (!isActive) return null;

  return (
    <instancedMesh ref={explosionsRef} args={[sphereGeo, undefined, 8]}>
      <meshBasicMaterial transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ═══════════════════════════════
// مكون كل الوحدات في المعركة
// ═══════════════════════════════

function BattlefieldUnits({ onAttack }: { onAttack: (position: { x: number; y: number }) => void }) {
  const battleState = useGameStore((s) => s.battleState);
  const lastAttackTimeRef = useRef<Record<string, number>>({});
  const prevHpRef = useRef<Record<string, number>>({});

  // Track HP changes to detect attacks
  useEffect(() => {
    if (!battleState) return;
    const allUnits = [...battleState.playerUnits, ...battleState.enemyUnits];

    for (const unit of allUnits) {
      const prevHp = prevHpRef.current[unit.id];
      if (prevHp !== undefined && unit.currentHp < prevHp && unit.isAlive) {
        onAttack({ x: unit.x, y: unit.y });
      }
      prevHpRef.current[unit.id] = unit.currentHp;
    }
  }, [battleState?.playerUnits, battleState?.enemyUnits, onAttack]);

  if (!battleState) return null;

  // Limit visible units for performance
  const visiblePlayerUnits = battleState.playerUnits.slice(0, MAX_VISIBLE_UNITS);
  const visibleEnemyUnits = battleState.enemyUnits.slice(0, MAX_VISIBLE_UNITS);

  return (
    <group>
      {/* وحدات اللاعب */}
      {visiblePlayerUnits.map((unit) => {
        const colors =
          unit.type === 'armor'
            ? PLAYER_COLORS.armor
            : unit.type === 'aviation'
              ? PLAYER_COLORS.aviation
              : PLAYER_COLORS.infantry;

        switch (unit.type) {
          case 'armor':
            return <ArmorUnit key={unit.id} unit={unit} colors={colors} />;
          case 'aviation':
            return <AviationUnit key={unit.id} unit={unit} colors={colors} />;
          default:
            return <InfantryUnit key={unit.id} unit={unit} colors={colors} />;
        }
      })}

      {/* وحدات العدو */}
      {visibleEnemyUnits.map((unit) => {
        const colors =
          unit.type === 'armor'
            ? ENEMY_COLORS.armor
            : unit.type === 'aviation'
              ? ENEMY_COLORS.aviation
              : ENEMY_COLORS.infantry;

        switch (unit.type) {
          case 'armor':
            return <ArmorUnit key={unit.id} unit={unit} colors={colors} />;
          case 'aviation':
            return <AviationUnit key={unit.id} unit={unit} colors={colors} />;
          default:
            return <InfantryUnit key={unit.id} unit={unit} colors={colors} />;
        }
      })}
    </group>
  );
}

// ═══════════════════════════════
// إدارة وميض الهجوم
// ═══════════════════════════════

function AttackFlashManager() {
  const [flashes, setFlashes] = useState<AttackFlashData[]>([]);
  const flashesRef = useRef<AttackFlashData[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Cleanup old flashes periodically
    timerRef.current = setInterval(() => {
      const now = performance.now() / 1000;
      flashesRef.current = flashesRef.current.filter(
        (f) => now - f.time < ATTACK_FLASH_DURATION
      );
      setFlashes([...flashesRef.current]);
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAttack = useCallback((position: { x: number; y: number }) => {
    // Rate limit: max 5 flashes per 200ms
    if (flashesRef.current.length >= MAX_ATTACK_FLASHES) {
      flashesRef.current.shift();
    }
    flashesRef.current.push({
      x: position.x,
      z: position.y,
      time: performance.now() / 1000,
    });
    setFlashes([...flashesRef.current]);
  }, []);

  return (
    <>
      <BattlefieldUnits onAttack={handleAttack} />
      <AttackFlashes flashes={flashes} />
    </>
  );
}

// ═══════════════════════════════
// التكتيكات النشطة
// ═══════════════════════════════

function ActiveTacticEffects() {
  const battleState = useGameStore((s) => s.battleState);

  if (!battleState) return null;

  const isSmokeActive = battleState.activeTactics.find(
    (t) => t.tactic === 'smoke_screen'
  )?.isActive;

  const isAirSupportActive = battleState.activeTactics.find(
    (t) => t.tactic === 'air_support'
  )?.isActive;

  const isArtilleryActive = battleState.activeTactics.find(
    (t) => t.tactic === 'artillery_barrage'
  )?.isActive;

  return (
    <>
      <SmokeScreenEffect isActive={!!isSmokeActive} />
      <AirSupportEffect isActive={!!isAirSupportActive} />
      <ArtilleryEffect isActive={!!isArtilleryActive} />
    </>
  );
}

// ═══════════════════════════════
// الإضاءة
// ═══════════════════════════════

function BattleLighting() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    // Subtle intensity variation for war atmosphere
    lightRef.current.intensity = 1.2 + Math.sin(performance.now() * 0.001) * 0.1;
  });

  return (
    <>
      <ambientLight intensity={0.35} color="#ffe8c0" />
      <directionalLight
        ref={lightRef}
        position={[8, 12, 6]}
        intensity={1.2}
        color="#ffe0a0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* إضاءة ملء */}
      <directionalLight
        position={[-5, 4, -5]}
        intensity={0.25}
        color="#ccaa88"
      />
      <hemisphereLight
        args={['#aa8866', '#2a2520', 0.25]}
      />
    </>
  );
}

// ═══════════════════════════════
// جسيمات الغبار / الدخان
// ═══════════════════════════════

function DustParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(40 * 3);
    for (let i = 0; i < 40; i++) {
      pos[i * 3] = (Math.random() - 0.5) * FIELD_WIDTH;
      pos[i * 3 + 1] = 0.1 + Math.random() * 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * FIELD_DEPTH;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < 40; i++) {
      posArray[i * 3] += 0.005 + Math.sin(t * 0.5 + i) * 0.002;
      posArray[i * 3 + 1] += Math.sin(t * 0.3 + i * 0.7) * 0.001;
      posArray[i * 3 + 2] += Math.cos(t * 0.4 + i * 0.5) * 0.002;

      // Wrap around
      if (posArray[i * 3] > FIELD_WIDTH / 2) posArray[i * 3] = -FIELD_WIDTH / 2;
      if (posArray[i * 3] < -FIELD_WIDTH / 2) posArray[i * 3] = FIELD_WIDTH / 2;
      if (posArray[i * 3 + 2] > FIELD_DEPTH / 2) posArray[i * 3 + 2] = -FIELD_DEPTH / 2;
      if (posArray[i * 3 + 2] < -FIELD_DEPTH / 2) posArray[i * 3 + 2] = FIELD_DEPTH / 2;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={40}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#bbaa88"
        size={0.04}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ═══════════════════════════════
// المشهد الداخلي
// ═══════════════════════════════

function BattleSceneContent() {
  return (
    <>
      {/* الخلفية */}
      <color attach="background" args={['#2a2520']} />
      <fog attach="fog" args={['#2a2520', 10, 20]} />

      {/* الكاميرا */}
      <orthographicCamera
        makeDefault
        position={[8, 10, 8]}
        zoom={42}
        near={0.1}
        far={50}
      />

      {/* التحكم */}
      <OrbitControls
        enablePan
        enableRotate={false}
        enableZoom
        minZoom={30}
        maxZoom={60}
        panSpeed={0.5}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 4}
        target={[0, 0, 0]}
      />

      {/* الإضاءة */}
      <BattleLighting />

      {/* الأرضية */}
      <BattlefieldGround />
      <BattlefieldDecorations />

      {/* الوحدات + الوميض */}
      <AttackFlashManager />

      {/* التكتيكات النشطة */}
      <ActiveTacticEffects />

      {/* جسيمات الغبار */}
      <DustParticles />
    </>
  );
}

// ═══════════════════════════════
// التصدير الرئيسي مع Canvas
// ═══════════════════════════════

export default function BattleScene() {
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
        <BattleSceneContent />
      </Canvas>
    </div>
  );
}
