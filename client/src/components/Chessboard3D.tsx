import { Chess, type PieceSymbol, type Square } from 'chess.js';
import { RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface LegalTarget {
  square: Square;
  isCapture: boolean;
}

interface Chessboard3DProps {
  fen: string;
  boardOrientation: 'white' | 'black';
  boardWidth: number;
  lightSquare: string;
  darkSquare: string;
  boardBorder: string;
  arenaBg: string;
  selectedSquare: Square | null;
  legalTargets: LegalTarget[];
  onSquareClick: (square: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function squareToCoords(square: string): { fileIdx: number; rankIdx: number } {
  const fileIdx = FILES.indexOf(square[0]);
  const rankIdx = Number(square[1]) - 1;
  return { fileIdx, rankIdx };
}

function coordsToPosition(fileIdx: number, rankIdx: number): [number, number] {
  return [fileIdx - 3.5, 3.5 - rankIdx];
}

function createPieceMesh(
  type: PieceSymbol,
  color: 'w' | 'b',
  whiteMat: THREE.Material,
  blackMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const mat = color === 'w' ? whiteMat : blackMat;

  // Base pedestal shared by all pieces
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.12, 20), mat);
  base.position.y = 0.06;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  if (type === 'p') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 0.42, 18), mat);
    body.position.y = 0.33;
    body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 16), mat);
    head.position.y = 0.6;
    head.castShadow = true;
    group.add(body, head);
  } else if (type === 'r') {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.27, 0.56, 18), mat);
    tower.position.y = 0.4;
    tower.castShadow = true;
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.23, 0.14, 18), mat);
    crown.position.y = 0.72;
    crown.castShadow = true;
    group.add(tower, crown);
    for (let i = 0; i < 4; i++) {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
      const angle = (i * Math.PI) / 2;
      merlon.position.set(Math.cos(angle) * 0.17, 0.83, Math.sin(angle) * 0.17);
      merlon.castShadow = true;
      group.add(merlon);
    }
  } else if (type === 'n') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.27, 0.44, 18), mat);
    stem.position.y = 0.34;
    stem.castShadow = true;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.3), mat);
    neck.position.set(0, 0.62, 0.02);
    neck.rotation.x = -0.2;
    neck.castShadow = true;
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.26), mat);
    snout.position.set(0, 0.72, color === 'w' ? -0.14 : 0.14);
    snout.rotation.x = color === 'w' ? 0.3 : -0.3;
    snout.castShadow = true;
    group.add(stem, neck, snout);
  } else if (type === 'b') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.27, 0.58, 18), mat);
    stem.position.y = 0.41;
    stem.castShadow = true;
    const mitre = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 16), mat);
    mitre.scale.set(0.9, 1.35, 0.9);
    mitre.position.y = 0.78;
    mitre.castShadow = true;
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat);
    finial.position.y = 1.04;
    finial.castShadow = true;
    group.add(stem, mitre, finial);
  } else if (type === 'q') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.29, 0.72, 20), mat);
    stem.position.y = 0.48;
    stem.castShadow = true;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.1, 20), mat);
    collar.position.y = 0.86;
    collar.castShadow = true;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 16), mat);
    orb.position.y = 1.0;
    orb.castShadow = true;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat);
    tip.position.y = 1.18;
    tip.castShadow = true;
    group.add(stem, collar, orb, tip);
  } else if (type === 'k') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 0.8, 20), mat);
    stem.position.y = 0.52;
    stem.castShadow = true;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.19, 0.12, 20), mat);
    collar.position.y = 0.94;
    collar.castShadow = true;
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.08), mat);
    vBar.position.y = 1.14;
    vBar.castShadow = true;
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), mat);
    hBar.position.y = 1.17;
    hBar.castShadow = true;
    group.add(stem, collar, vBar, hBar);
  }

  return group;
}

export function Chessboard3D({
  fen,
  boardOrientation,
  boardWidth,
  lightSquare,
  darkSquare,
  boardBorder,
  arenaBg,
  selectedSquare,
  legalTargets,
  onSquareClick,
}: Chessboard3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onSquareClickRef = useRef(onSquareClick);
  onSquareClickRef.current = onSquareClick;

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    squareMeshes: Map<string, THREE.Mesh>;
    squareMaterials: { light: THREE.MeshStandardMaterial; dark: THREE.MeshStandardMaterial };
    borderMesh: THREE.Mesh;
    piecesGroup: THREE.Group;
    highlightsGroup: THREE.Group;
  } | null>(null);

  const resetCamera = () => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    const zPos = boardOrientation === 'white' ? 7.6 : -7.6;
    ctx.camera.position.set(0, 7.8, zPos);
    ctx.controls.target.set(0, 0, 0);
    ctx.controls.update();
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(arenaBg);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const zPos = boardOrientation === 'white' ? 7.6 : -7.6;
    camera.position.set(0, 7.8, zPos);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(boardWidth, boardWidth);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5.5;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minPolarAngle = 0.2;
    controls.target.set(0, 0, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.05);
    dirLight.position.set(5, 11, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xeef4ff, 0.35);
    fillLight.position.set(-6, 6, -5);
    scene.add(fillLight);

    // Board Frame
    const borderMat = new THREE.MeshStandardMaterial({
      color: boardBorder,
      roughness: 0.65,
      metalness: 0.08,
    });
    const borderMesh = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.36, 8.7), borderMat);
    borderMesh.position.y = -0.19;
    borderMesh.receiveShadow = true;
    scene.add(borderMesh);

    // 64 Squares
    const lightMat = new THREE.MeshStandardMaterial({ color: lightSquare, roughness: 0.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: darkSquare, roughness: 0.7 });
    const squareGeo = new THREE.BoxGeometry(1, 0.08, 1);
    const squareMeshes = new Map<string, THREE.Mesh>();

    for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
      for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
        const isLight = (fileIdx + rankIdx) % 2 === 1;
        const sqName = `${FILES[fileIdx]}${rankIdx + 1}`;
        const sqMesh = new THREE.Mesh(squareGeo, isLight ? lightMat : darkMat);
        const [x, z] = coordsToPosition(fileIdx, rankIdx);
        sqMesh.position.set(x, -0.04, z);
        sqMesh.receiveShadow = true;
        sqMesh.userData = { square: sqName };
        scene.add(sqMesh);
        squareMeshes.set(sqName, sqMesh);
      }
    }

    const piecesGroup = new THREE.Group();
    const highlightsGroup = new THREE.Group();
    scene.add(highlightsGroup, piecesGroup);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      squareMeshes,
      squareMaterials: { light: lightMat, dark: darkMat },
      borderMesh,
      piecesGroup,
      highlightsGroup,
    };

    // Raycasting click handler (ignores drags)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const targets = [...squareMeshes.values(), ...piecesGroup.children];
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length === 0) return;

      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !obj.userData?.square) {
        obj = obj.parent;
      }
      if (obj?.userData?.square) {
        onSquareClickRef.current(obj.userData.square as Square);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Resize renderer
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.renderer.setSize(boardWidth, boardWidth);
    ctx.camera.aspect = 1;
    ctx.camera.updateProjectionMatrix();
  }, [boardWidth]);

  // Update camera side when orientation changes
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    const zPos = boardOrientation === 'white' ? 7.6 : -7.6;
    ctx.camera.position.set(0, 7.8, zPos);
    ctx.controls.target.set(0, 0, 0);
    ctx.controls.update();
  }, [boardOrientation]);

  // Sync theme colors
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.scene.background = new THREE.Color(arenaBg);
    ctx.squareMaterials.light.color.set(lightSquare);
    ctx.squareMaterials.dark.color.set(darkSquare);
    (ctx.borderMesh.material as THREE.MeshStandardMaterial).color.set(boardBorder);
  }, [lightSquare, darkSquare, boardBorder, arenaBg]);

  // Sync pieces from FEN
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.piecesGroup.clear();

    const chess = new Chess();
    try {
      chess.load(fen);
    } catch {
      return;
    }

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf7f3e9,
      roughness: 0.35,
      metalness: 0.05,
    });
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x262321,
      roughness: 0.35,
      metalness: 0.12,
    });

    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (!piece) continue;
        const rankIdx = 7 - r;
        const sqName = `${FILES[f]}${rankIdx + 1}`;
        const mesh = createPieceMesh(piece.type, piece.color, whiteMat, blackMat);
        const [x, z] = coordsToPosition(f, rankIdx);
        mesh.position.set(x, 0, z);
        mesh.userData = { square: sqName };
        ctx.piecesGroup.add(mesh);
      }
    }
  }, [fen]);

  // Sync selected & legal move highlights
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.highlightsGroup.clear();

    if (selectedSquare) {
      const { fileIdx, rankIdx } = squareToCoords(selectedSquare);
      const [x, z] = coordsToPosition(fileIdx, rankIdx);
      const selMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.94, 0.94),
        new THREE.MeshBasicMaterial({
          color: 0x1b5e3a,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        })
      );
      selMesh.rotation.x = -Math.PI / 2;
      selMesh.position.set(x, 0.008, z);
      ctx.highlightsGroup.add(selMesh);
    }

    for (const target of legalTargets) {
      const { fileIdx, rankIdx } = squareToCoords(target.square);
      const [x, z] = coordsToPosition(fileIdx, rankIdx);
      const geo = target.isCapture
        ? new THREE.RingGeometry(0.32, 0.44, 24)
        : new THREE.CircleGeometry(0.16, 20);
      const mat = new THREE.MeshBasicMaterial({
        color: target.isCapture ? 0xb91c1c : 0x1b5e3a,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      });
      const marker = new THREE.Mesh(geo, mat);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(x, 0.012, z);
      ctx.highlightsGroup.add(marker);
    }
  }, [selectedSquare, legalTargets]);

  return (
    <div className="relative overflow-hidden" style={{ width: boardWidth, height: boardWidth }}>
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      <button
        type="button"
        onClick={resetCamera}
        className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded border border-[#D6CEC0] bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1C1917] shadow-sm backdrop-blur transition hover:bg-white"
        title="Reset 3D camera angle"
      >
        <RotateCcw className="h-3 w-3 text-[#1B5E3A]" />
        Reset View
      </button>
    </div>
  );
}
