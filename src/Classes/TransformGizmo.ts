import * as THREE from "three";

/**
 * TransformGizmo 클래스
 * 선택된 객체에 대한 축 지시자(X, Y, Z)를 표시하고 드래그로 이동 제어
 */
export class TransformGizmo {
  private group: THREE.Group;
  private arrows: {
    x: THREE.Group;
    y: THREE.Group;
    z: THREE.Group;
  };
  private camera: THREE.Camera;
  private isVisible: boolean = false;
  private selectedAxis: "x" | "y" | "z" | null = null;

  // 드래그 상태
  private isDragging: boolean = false;
  private dragPlane: THREE.Plane;
  private dragStartPoint: THREE.Vector3;
  private objectStartPosition: THREE.Vector3;

  // 콜백
  private onDragCallback?: (position: THREE.Vector3) => void;

  constructor(camera: THREE.Camera) {
    this.group = new THREE.Group();
    this.camera = camera;
    this.dragPlane = new THREE.Plane();
    this.dragStartPoint = new THREE.Vector3();
    this.objectStartPosition = new THREE.Vector3();

    // 축 화살표 생성
    this.arrows = {
      x: this.createArrow(0xff0000, "x"), // 빨강
      y: this.createArrow(0x00ff00, "y"), // 초록
      z: this.createArrow(0x0000ff, "z"), // 파랑
    };

    this.group.add(this.arrows.x);
    this.group.add(this.arrows.y);
    this.group.add(this.arrows.z);

    this.group.visible = false;
  }

  /**
   * 화살표 생성
   */
  private createArrow(color: number, axis: string): THREE.Group {
    const arrowGroup = new THREE.Group();

    // 화살표 몸통 (원기둥)
    const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
    const shaftMaterial = new THREE.MeshBasicMaterial({ color });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = 0.4;

    // 화살표 머리 (원뿔)
    const headGeometry = new THREE.ConeGeometry(0.06, 0.2, 8);
    const headMaterial = new THREE.MeshBasicMaterial({ color });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.9;

    arrowGroup.add(shaft);
    arrowGroup.add(head);

    // userData에 축 정보 저장
    shaft.userData = { type: "gizmo", axis };
    head.userData = { type: "gizmo", axis };

    return arrowGroup;
  }

  /**
   * 카메라 기준 좌표계로 축 방향 업데이트
   */
  public updateAxesOrientation(targetPosition: THREE.Vector3): void {
    // 카메라 위치에서 타겟(0,0,0)을 향하는 시선 벡터
    const viewDirection = new THREE.Vector3();
    this.camera.getWorldDirection(viewDirection);

    // 카메라의 up 벡터
    const cameraUp = new THREE.Vector3(0, 1, 0);
    cameraUp.applyQuaternion(this.camera.quaternion);

    // 카메라 기준 오른쪽 방향 (시선 벡터와 up 벡터의 외적)
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraUp, viewDirection).normalize();

    // 카메라 기준 위쪽 방향 재계산 (정확한 직교 좌표계)
    const cameraUpCorrected = new THREE.Vector3();
    cameraUpCorrected.crossVectors(viewDirection, cameraRight).normalize();

    // X축 (카메라 오른쪽 방향)
    const xQuaternion = new THREE.Quaternion();
    xQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cameraRight);
    this.arrows.x.quaternion.copy(xQuaternion);

    // Y축 (카메라 위쪽 방향)
    const yQuaternion = new THREE.Quaternion();
    yQuaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      cameraUpCorrected
    );
    this.arrows.y.quaternion.copy(yQuaternion);

    // Z축 (카메라 시선 방향의 반대, 즉 화면 밖으로 나오는 방향)
    const cameraForward = viewDirection.clone().negate();
    const zQuaternion = new THREE.Quaternion();
    zQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cameraForward);
    this.arrows.z.quaternion.copy(zQuaternion);

    // Gizmo 위치를 타겟 위치로 설정
    this.group.position.copy(targetPosition);
  }

  /**
   * Gizmo 표시
   */
  public show(position: THREE.Vector3): void {
    this.isVisible = true;
    this.group.visible = true;
    this.updateAxesOrientation(position);
  }

  /**
   * Gizmo 숨김
   */
  public hide(): void {
    this.isVisible = false;
    this.group.visible = false;
  }

  /**
   * Gizmo 가시성 확인
   */
  public getVisible(): boolean {
    return this.isVisible;
  }

  /**
   * 축 선택 (raycaster로 감지된 축)
   */
  public selectAxis(axis: "x" | "y" | "z" | null): void {
    this.selectedAxis = axis;

    // 선택된 축 강조 표시
    Object.keys(this.arrows).forEach((key) => {
      const arrowKey = key as "x" | "y" | "z";
      const arrow = this.arrows[arrowKey];
      arrow.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshBasicMaterial;
          material.opacity = axis === arrowKey ? 1.0 : 0.5;
          material.transparent = axis !== arrowKey;
        }
      });
    });
  }

  /**
   * 드래그 시작
   */
  public startDrag(
    axis: "x" | "y" | "z",
    raycaster: THREE.Raycaster,
    objectPosition: THREE.Vector3
  ): void {
    this.isDragging = true;
    this.selectedAxis = axis;
    this.objectStartPosition.copy(objectPosition);

    // 축 방향 벡터 가져오기
    const axisDirection = this.getAxisDirection(axis);

    // 카메라 시선 벡터
    const viewDirection = new THREE.Vector3();
    this.camera.getWorldDirection(viewDirection);

    // 드래그 평면 설정 (축 방향과 시선 방향으로 정의되는 평면)
    const planeNormal = new THREE.Vector3();
    planeNormal.crossVectors(axisDirection, viewDirection).normalize();

    // 평면이 정의되지 않으면 (축과 시선이 평행) 대체 평면 사용
    if (planeNormal.length() < 0.001) {
      planeNormal.set(0, 1, 0); // Y축을 기본 법선으로
    }

    this.dragPlane.setFromNormalAndCoplanarPoint(planeNormal, objectPosition);

    // 드래그 시작점 계산
    raycaster.ray.intersectPlane(this.dragPlane, this.dragStartPoint);
  }

  /**
   * 드래그 중
   */
  public onDrag(raycaster: THREE.Raycaster): THREE.Vector3 | null {
    if (!this.isDragging || !this.selectedAxis) return null;

    const currentPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(this.dragPlane, currentPoint);

    // 이동 벡터 계산
    const moveVector = new THREE.Vector3();
    moveVector.subVectors(currentPoint, this.dragStartPoint);

    // 축 방향으로만 투영
    const axisDirection = this.getAxisDirection(this.selectedAxis);
    const projection = moveVector.dot(axisDirection);
    const constrainedMove = axisDirection.clone().multiplyScalar(projection);

    // 새로운 위치 계산
    const newPosition = new THREE.Vector3();
    newPosition.addVectors(this.objectStartPosition, constrainedMove);

    return newPosition;
  }

  /**
   * 드래그 종료
   */
  public endDrag(): void {
    this.isDragging = false;
    this.selectedAxis = null;
    this.selectAxis(null);
  }

  /**
   * 드래그 중인지 확인
   */
  public getIsDragging(): boolean {
    return this.isDragging;
  }

  /**
   * 축 방향 벡터 가져오기
   */
  private getAxisDirection(axis: "x" | "y" | "z"): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 1, 0);
    direction.applyQuaternion(this.arrows[axis].quaternion);
    return direction.normalize();
  }

  /**
   * Gizmo의 모든 메시 가져오기 (raycasting용)
   */
  public getMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.type === "gizmo") {
        meshes.push(child);
      }
    });
    return meshes;
  }

  /**
   * Three.js Group 객체 반환
   */
  public getObject(): THREE.Group {
    return this.group;
  }

  /**
   * 드래그 콜백 등록
   */
  public onDragMove(callback: (position: THREE.Vector3) => void): void {
    this.onDragCallback = callback;
  }

  /**
   * 리소스 해제
   */
  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    this.group.clear();
  }
}
