"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Sphere } from "@/Classes/Sphere";
import { TransformGizmo } from "@/Classes/TransformGizmo";
import { useThree } from "@/contexts/ThreeContext";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [isMultiSphereMode, setIsMultiSphereMode] = useState(false);
  const { initializeThree, getScene, getCamera, getRenderer, cleanup } =
    useThree();

  useEffect(() => {
    if (!containerRef.current) return;

    // Three.js 초기화 (Scene, Camera, Renderer, GridHelper, AxesHelper)
    initializeThree(containerRef.current);

    const scene = getScene();
    const camera = getCamera();
    const renderer = getRenderer();

    if (!scene || !camera || !renderer) return;

    // Sphere 배열 관리
    const spheres: Sphere[] = [];
    const tempSphere = new Sphere(new THREE.Vector3(0, 0, 0), 0.2, 0xff00ff);
    let tempSphereVisible = false;
    let multiSphereMode = false;
    let selectedSphere: Sphere | null = null;
    let clickedSphereForMulti: Sphere | null = null;

    // 초기 Sphere 생성
    const sphere = new Sphere(new THREE.Vector3(0, 0, 0), 0.2, 0x00aaff);
    spheres.push(sphere);

    // TransformGizmo 생성
    const gizmo = new TransformGizmo(camera);
    scene.add(gizmo.getObject());

    // ===== C. 상태 관리 개선 =====
    // Sphere 선택 상태를 React 상태와 동기화하는 헬퍼 함수
    const handleSphereSelection = (
      sphere: Sphere | null,
      isSelected: boolean
    ) => {
      // 모든 Sphere 선택 해제
      spheres.forEach((s) => s.setSelected(false));

      if (sphere && isSelected) {
        sphere.setSelected(true);
        selectedSphere = sphere;
        setSelectedObject(`sphere-${spheres.indexOf(sphere)}`);
        gizmo.show(sphere.getPosition());
      } else {
        selectedSphere = null;
        setSelectedObject(null);
        gizmo.hide();
      }
    };

    // Sphere 이벤트 핸들러 등록 함수
    const setupSphereEvents = (sphere: Sphere) => {
      sphere.onClick((s) => {
        console.log("Sphere 클릭됨! 위치:", s.getPosition());
        const isSelected = s.getSelected();
        handleSphereSelection(s, isSelected);
      });

      // sphere.onHover((s, isHovering) => {});
    };

    // 초기 Sphere 이벤트 등록 및 Scene에 추가
    setupSphereEvents(sphere);
    scene.add(sphere.getObject());

    // Raycaster 및 마우스 설정 (클릭 이벤트 처리)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // ===== D. 이벤트 핸들러 분리 및 명확화 =====
    // Gizmo 클릭 처리
    const handleGizmoClick = (
      gizmoIntersects: THREE.Intersection[],
      mouseY: number
    ): boolean => {
      if (gizmoIntersects.length > 0) {
        const clickedGizmo = gizmoIntersects[0].object;
        const axis = clickedGizmo.userData.axis as "x" | "y" | "z";
        if (axis && selectedSphere) {
          gizmo.startDrag(
            axis,
            raycaster,
            selectedSphere?.getPosition(),
            mouseY
          );
          controls.enabled = false; // OrbitControls 비활성화
          return true; // Gizmo 클릭됨
        }
      }
      return false; // Gizmo 클릭 안됨
    };

    // Sphere 클릭 처리
    const handleSphereClick = (
      intersects: THREE.Intersection[],
      event: MouseEvent
    ): boolean => {
      const isAltOrCmd = event.altKey || event.metaKey;

      for (const intersect of intersects) {
        if (intersect.object.userData.type === "sphere") {
          const sphereInstance = intersect.object.userData.instance as Sphere;
          if (sphereInstance) {
            // Alt/Cmd + 클릭: Multi Sphere 모드 활성화
            if (isAltOrCmd) {
              multiSphereMode = true;
              clickedSphereForMulti = sphereInstance;
              setIsMultiSphereMode(true);

              // 임시 Sphere를 클릭한 Sphere 위치에 배치
              tempSphere.setPosition(sphereInstance.getPosition());
              if (!tempSphereVisible) {
                scene.add(tempSphere.getObject());
                tempSphereVisible = true;
              }

              console.log("Multi Sphere 모드 활성화");
              return true;
            }

            // 일반 클릭
            sphereInstance.triggerClick();
            return true;
          }
        }
      }
      return false;
    };

    // 빈 공간 클릭 처리 (선택 해제)
    const handleEmptySpaceClick = () => {
      handleSphereSelection(null, false);
    };

    const onMouseClick = (event: MouseEvent) => {
      // Gizmo 드래그 중이면 클릭 처리하지 않음
      if (gizmo.getIsDragging()) return;

      // Multi Sphere 모드일 때
      if (multiSphereMode) {
        // 현재 임시 Sphere 위치에 실제 Sphere 생성
        const newSphere = new Sphere(tempSphere.getPosition(), 0.2, 0x00aaff);
        setupSphereEvents(newSphere);
        spheres.push(newSphere);
        scene.add(newSphere.getObject());

        // Multi Sphere 모드 종료
        multiSphereMode = false;
        clickedSphereForMulti = null;
        setIsMultiSphereMode(false);

        // 임시 Sphere 숨기기
        if (tempSphereVisible) {
          scene.remove(tempSphere.getObject());
          tempSphereVisible = false;
        }

        console.log("새 Sphere 생성됨! 위치:", newSphere.getPosition());
        return;
      }

      // 마우스 좌표를 정규화된 디바이스 좌표로 변환 (-1 ~ +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Raycaster 업데이트
      raycaster.setFromCamera(mouse, camera);

      // 1. Gizmo 클릭 확인 (최우선 처리)
      if (gizmo.getVisible()) {
        const gizmoMeshes = gizmo.getMeshes();
        const gizmoIntersects = raycaster.intersectObjects(gizmoMeshes);

        if (handleGizmoClick(gizmoIntersects, event.clientY)) {
          return; // Gizmo 클릭 시 다른 처리 안함
        }
      }

      // 2. Scene 내 객체 클릭 확인
      const intersects = raycaster.intersectObjects(scene.children, true);

      // 3. Sphere 클릭 확인
      if (handleSphereClick(intersects, event)) {
        return; // Sphere 클릭 시 다른 처리 안함
      }

      // 4. 그 외 모든 경우 선택 해제 (빈 공간 또는 다른 객체)
      handleEmptySpaceClick();
    };

    // 마우스 무브 이벤트 (호버 효과 및 드래그)
    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Multi Sphere 모드일 때 임시 Sphere를 마우스 위치로 이동
      if (multiSphereMode && clickedSphereForMulti) {
        // 카메라 방향 벡터 계산
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        // 클릭한 Sphere의 위치를 기준으로 카메라 방향에 수직인 평면 생성
        const spherePosition = clickedSphereForMulti.getPosition();
        const plane = new THREE.Plane();
        plane.setFromNormalAndCoplanarPoint(cameraDirection, spherePosition);

        // 마우스 레이와 평면의 교차점 계산
        const intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectionPoint);

        if (intersectionPoint) {
          tempSphere.setPosition(intersectionPoint);
        }

        return;
      }

      // 드래그 중이면 객체 이동
      if (gizmo.getIsDragging() && selectedSphere) {
        const newPosition = gizmo.onDrag(raycaster, event.clientY);
        if (newPosition) {
          selectedSphere.setPosition(newPosition);
          gizmo.updateAxesOrientation(newPosition);
        }
        return;
      }

      // Gizmo 호버 확인
      if (gizmo.getVisible()) {
        const gizmoMeshes = gizmo.getMeshes();
        const gizmoIntersects = raycaster.intersectObjects(gizmoMeshes);

        if (gizmoIntersects.length > 0) {
          const hoveredGizmo = gizmoIntersects[0].object;
          const axis = hoveredGizmo.userData.axis as "x" | "y" | "z";
          gizmo.selectAxis(axis);
          return; // Gizmo 호버 중이면 Sphere 호버 체크하지 않음
        } else {
          gizmo.selectAxis(null);
        }
      }

      // Sphere 호버 확인
      const intersects = raycaster.intersectObjects(scene.children, true);

      // 모든 Sphere의 호버 상태 업데이트
      spheres.forEach((s) => {
        let isHovering = false;
        if (intersects.length > 0) {
          const hoveredObject = intersects[0].object;
          if (
            hoveredObject.userData.type === "sphere" &&
            hoveredObject.userData.instance === s
          ) {
            isHovering = true;
          }
        }
        s.triggerHover(isHovering);
      });
    };

    // 마우스 업 이벤트 (드래그 종료)
    const onMouseUp = () => {
      if (gizmo.getIsDragging()) {
        gizmo.endDrag();
        controls.enabled = true; // OrbitControls 재활성화
      }
    };

    window.addEventListener("click", onMouseClick);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // OrbitControls 추가
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 부드러운 움직임
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2; // 수평 아래로 내려가지 않도록 제한

    // ===== A. 메모리 누수 방지 =====
    // OrbitControls 변경 이벤트 핸들러를 변수로 저장 (cleanup에서 제거하기 위함)
    const handleControlsChange = () => {
      if (gizmo.getVisible() && selectedSphere) {
        gizmo.updateAxesOrientation(selectedSphere.getPosition());
      }
    };
    controls.addEventListener("change", handleControlsChange);

    // XZ 평면에 Plane 추가
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // XZ 평면으로 회전
    plane.position.y = 0;
    scene.add(plane);

    // 렌더링
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // OrbitControls 업데이트
      renderer.render(scene, camera);
    };

    animate();

    // 리사이즈 핸들러
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // 정리
    return () => {
      // ===== A. 메모리 누수 방지 =====
      // OrbitControls 이벤트 리스너 제거
      controls.removeEventListener("change", handleControlsChange);

      // 윈도우 이벤트 리스너 제거
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", onMouseClick);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      // DOM 정리
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }

      // Three.js 리소스 정리
      controls.dispose();
      planeGeometry.dispose();
      planeMaterial.dispose();

      // 모든 Sphere 정리
      spheres.forEach((s) => s.dispose());
      tempSphere.dispose();

      gizmo.dispose();
      cleanup();
    };
  }, [initializeThree, getScene, getCamera, getRenderer, cleanup]);

  return (
    <div>
      <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {selectedObject && (
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              borderRadius: "5px",
              fontFamily: "monospace",
            }}
          >
            선택된 객체: {selectedObject}
          </div>
        )}
        {isMultiSphereMode && (
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: "rgba(255, 0, 255, 0.7)",
              color: "white",
              borderRadius: "5px",
              fontFamily: "monospace",
            }}
          >
            Multi Sphere 모드 활성화됨! 클릭하여 Sphere 배치
          </div>
        )}
        <div
          style={{
            padding: "10px 20px",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            borderRadius: "5px",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          Alt/Cmd + Sphere 클릭: Multi Sphere 모드
        </div>
      </div>
    </div>
  );
}
