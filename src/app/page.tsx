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

    // Sphere 인스턴스 생성
    const sphere = new Sphere(new THREE.Vector3(0, 0, 0), 0.5, 0x00aaff);

    // TransformGizmo 생성
    const gizmo = new TransformGizmo(camera);
    scene.add(gizmo.getObject());

    // 이벤트 핸들러 등록
    sphere.onClick((s) => {
      console.log("Sphere 클릭됨! 위치:", s.getPosition());
      const isSelected = s.getSelected();
      setSelectedObject(isSelected ? "sphere" : null);

      // Gizmo 표시/숨김
      if (isSelected) {
        gizmo.show(s.getPosition());
      } else {
        gizmo.hide();
      }
    });

    sphere.onHover((s, isHovering) => {
      console.log("Sphere 호버:", isHovering);
    });

    // Scene에 추가
    scene.add(sphere.getObject());

    // Raycaster 및 마우스 설정 (클릭 이벤트 처리)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => {
      // Gizmo 드래그 중이면 클릭 처리하지 않음
      if (gizmo.getIsDragging()) return;

      // 마우스 좌표를 정규화된 디바이스 좌표로 변환 (-1 ~ +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Raycaster 업데이트
      raycaster.setFromCamera(mouse, camera);

      // Gizmo가 보이는 경우, Gizmo 축 클릭 확인
      if (gizmo.getVisible()) {
        const gizmoMeshes = gizmo.getMeshes();
        const gizmoIntersects = raycaster.intersectObjects(gizmoMeshes);

        if (gizmoIntersects.length > 0) {
          const clickedGizmo = gizmoIntersects[0].object;
          const axis = clickedGizmo.userData.axis as "x" | "y" | "z";
          if (axis) {
            gizmo.startDrag(axis, raycaster, sphere.getPosition());
            return; // Gizmo 클릭 시 Sphere 클릭 처리하지 않음
          }
        }
      }

      // 교차 객체 찾기
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // Sphere 클릭 확인
        if (clickedObject.userData.type === "sphere") {
          const sphereInstance = clickedObject.userData.instance as Sphere;
          if (sphereInstance) {
            sphereInstance.triggerClick();
          }
        } else {
          // 다른 객체 클릭 시 Sphere 선택 해제
          sphere.setSelected(false);
          gizmo.hide();
          setSelectedObject(null);
        }
      } else {
        // 빈 공간 클릭 시 선택 해제
        sphere.setSelected(false);
        gizmo.hide();
        setSelectedObject(null);
      }
    };

    // 마우스 무브 이벤트 (호버 효과 및 드래그)
    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // 드래그 중이면 객체 이동
      if (gizmo.getIsDragging()) {
        const newPosition = gizmo.onDrag(raycaster);
        if (newPosition) {
          sphere.setPosition(newPosition);
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

      let isHovering = false;
      if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        if (hoveredObject.userData.type === "sphere") {
          isHovering = true;
        }
      }

      sphere.triggerHover(isHovering);
    };

    // 마우스 업 이벤트 (드래그 종료)
    const onMouseUp = () => {
      if (gizmo.getIsDragging()) {
        gizmo.endDrag();
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

    // OrbitControls 변경 이벤트 (카메라 회전 시 Gizmo 축 방향 업데이트)
    controls.addEventListener("change", () => {
      if (gizmo.getVisible() && sphere.getSelected()) {
        gizmo.updateAxesOrientation(sphere.getPosition());
      }
    });

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
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", onMouseClick);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      planeGeometry.dispose();
      planeMaterial.dispose();
      sphere.dispose();
      gizmo.dispose();
      cleanup();
    };
  }, [initializeThree, getScene, getCamera, getRenderer, cleanup]);

  return (
    <div>
      <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />
      {selectedObject && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
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
    </div>
  );
}
