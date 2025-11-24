"use client";

import React, {
  createContext,
  useContext,
  useRef,
  ReactNode,
  useState,
} from "react";
import * as THREE from "three";

interface ThreeContextType {
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  gridHelperRef: React.MutableRefObject<THREE.GridHelper | null>;
  axesHelperRef: React.MutableRefObject<THREE.AxesHelper | null>;
  initializeThree: (container: HTMLDivElement) => void;
  getScene: () => THREE.Scene | null;
  getCamera: () => THREE.PerspectiveCamera | null;
  getRenderer: () => THREE.WebGLRenderer | null;
  getGridHelper: () => THREE.GridHelper | null;
  getAxesHelper: () => THREE.AxesHelper | null;
  cleanup: () => void;
}

const ThreeContext = createContext<ThreeContextType | null>(null);

export const useThree = () => {
  const context = useContext(ThreeContext);
  if (!context) {
    throw new Error("useThree는 ThreeProvider 내에서 사용해야 합니다");
  }
  return context;
};

interface ThreeProviderProps {
  children: ReactNode;
}

export const ThreeProvider: React.FC<ThreeProviderProps> = ({ children }) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);

  const initializeThree = (container: HTMLDivElement) => {
    // Scene 설정
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0xffffff); // 하얀 배경

    // Camera 설정 - 위에서 아래를 내려다보는 각도
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current.position.set(0, 5, 5);
    cameraRef.current.lookAt(0, 0, 0);

    // Renderer 설정
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(rendererRef.current.domElement);

    // GridHelper 추가 (크기: 10, 분할: 10)
    gridHelperRef.current = new THREE.GridHelper(10, 10);
    sceneRef.current.add(gridHelperRef.current);

    // AxesHelper 추가 (축 길이: 5)
    axesHelperRef.current = new THREE.AxesHelper(5);
    sceneRef.current.add(axesHelperRef.current);
  };

  const getScene = () => sceneRef.current;
  const getCamera = () => cameraRef.current;
  const getRenderer = () => rendererRef.current;
  const getGridHelper = () => gridHelperRef.current;
  const getAxesHelper = () => axesHelperRef.current;

  const cleanup = () => {
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    sceneRef.current = null;
    cameraRef.current = null;
    rendererRef.current = null;
    gridHelperRef.current = null;
    axesHelperRef.current = null;
  };

  const value: ThreeContextType = {
    sceneRef,
    cameraRef,
    rendererRef,
    gridHelperRef,
    axesHelperRef,
    initializeThree,
    getScene,
    getCamera,
    getRenderer,
    getGridHelper,
    getAxesHelper,
    cleanup,
  };

  return (
    <ThreeContext.Provider value={value}>{children}</ThreeContext.Provider>
  );
};
