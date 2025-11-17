# Room Editor

Next.js + TypeScript + Webpack + Three.js를 사용한 3D 룸 에디터 프로젝트입니다.

## 기술 스택

- **Next.js 15** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Webpack** - 번들러 (Next.js 내장)
- **Three.js** - 3D 그래픽 라이브러리
- **Absolute Path** - `@/*` 경로로 모듈 임포트 가능

## 프로젝트 구조

```
room_editor/
├── src/
│   └── app/
│       ├── globals.css      # 전역 스타일
│       ├── layout.tsx        # 루트 레이아웃
│       └── page.tsx          # 메인 페이지 (Three.js 데모)
├── .eslintrc.json           # ESLint 설정
├── .gitignore               # Git 제외 파일
├── next.config.ts           # Next.js 설정 (Webpack 커스터마이징)
├── package.json             # 의존성 관리
├── tsconfig.json            # TypeScript 설정 (Absolute Path)
└── README.md                # 프로젝트 문서
```

## 시작하기

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 프로덕션 빌드

```bash
npm run build
npm start
```

## 주요 기능

- ✅ Next.js 15 App Router
- ✅ TypeScript 지원
- ✅ Three.js 3D 렌더링
- ✅ Webpack 커스텀 설정
- ✅ Absolute Path (`@/*`) 지원
- ✅ ESLint 설정
- ✅ 반응형 캔버스

## Absolute Path 사용 예시

```typescript
// 상대 경로 대신
import Component from "../../components/Component";

// Absolute Path 사용
import Component from "@/components/Component";
```

## Three.js 사용 예시

현재 `src/app/page.tsx`에 회전하는 녹색 큐브 데모가 구현되어 있습니다.

## 라이선스

MIT
