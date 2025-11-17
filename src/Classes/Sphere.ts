import * as THREE from "three";

/**
 * Sphere 클래스
 * 구체를 표현하고 이벤트를 처리합니다.
 */
export class Sphere {
  private group: THREE.Group;
  private mesh: THREE.Mesh;
  private isSelected: boolean = false;
  private originalColor: number;
  private selectedColor: number = 0xffff00;
  private radius: number;

  // 이벤트 콜백
  private onClickCallback?: (sphere: Sphere) => void;
  private onHoverCallback?: (sphere: Sphere, isHovering: boolean) => void;

  constructor(
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    radius: number = 0.5,
    color: number = 0x00aaff
  ) {
    this.group = new THREE.Group();
    this.radius = radius;
    this.originalColor = color;

    // Sphere 메시 생성
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.userData = { type: "sphere", instance: this };
    this.group.add(this.mesh);

    // 위치 설정
    this.group.position.copy(position);
  }

  /**
   * 클릭 이벤트 핸들러 등록
   */
  public onClick(callback: (sphere: Sphere) => void): void {
    this.onClickCallback = callback;
  }

  /**
   * 호버 이벤트 핸들러 등록
   */
  public onHover(
    callback: (sphere: Sphere, isHovering: boolean) => void
  ): void {
    this.onHoverCallback = callback;
  }

  /**
   * 클릭 이벤트 트리거
   */
  public triggerClick(): void {
    this.isSelected = !this.isSelected;
    this.updateSelectionState();

    if (this.onClickCallback) {
      this.onClickCallback(this);
    }
  }

  /**
   * 호버 이벤트 트리거
   */
  public triggerHover(isHovering: boolean): void {
    if (this.onHoverCallback) {
      this.onHoverCallback(this, isHovering);
    }

    // 호버 시각 효과
    if (!this.isSelected) {
      const material = this.mesh.material as THREE.MeshStandardMaterial;
      material.opacity = isHovering ? 1.0 : 0.8;
    }
  }

  /**
   * 선택 상태 업데이트
   */
  private updateSelectionState(): void {
    const material = this.mesh.material as THREE.MeshStandardMaterial;
    material.color.setHex(
      this.isSelected ? this.selectedColor : this.originalColor
    );
    material.opacity = this.isSelected ? 1.0 : 0.8;
  }

  /**
   * 선택 상태 설정
   */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.updateSelectionState();
  }

  /**
   * 선택 상태 확인
   */
  public getSelected(): boolean {
    return this.isSelected;
  }

  /**
   * 위치 설정
   */
  public setPosition(position: THREE.Vector3): void {
    this.group.position.copy(position);
  }

  /**
   * 위치 가져오기
   */
  public getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }

  /**
   * 반지름 가져오기
   */
  public getRadius(): number {
    return this.radius;
  }

  /**
   * 크기 조절
   */
  public setScale(scale: number | THREE.Vector3): void {
    if (typeof scale === "number") {
      this.group.scale.set(scale, scale, scale);
    } else {
      this.group.scale.copy(scale);
    }
  }

  /**
   * Three.js Group 객체 반환
   */
  public getObject(): THREE.Group {
    return this.group;
  }

  /**
   * 메시 객체 반환
   */
  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * 리소스 해제
   */
  public dispose(): void {
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
    this.group.clear();
  }
}
