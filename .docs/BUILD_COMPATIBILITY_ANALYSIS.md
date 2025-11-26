# 빌드 호환성 분석 및 개선 방안

**현재 상태:** ✅ ES2015+ (Modern Browsers)
**IE11 지원:** ❌ 미포함 (폴리필 추가 시 가능)
**마지막 업데이트:** 2025-11-23

---

## 📋 요약

- ✅ **ES2015 타겟으로 빌드 설정 완료**
- ✅ **.browserslistrc 파일 생성 완료**
- ✅ **최신 2개 버전 브라우저 지원 (IE11 제외)**
- ⏳ **IE11 지원은 폴리필 추가로 가능** (선택사항)

---

## 현재 상황

### 발견된 ES6+ 기능 (IE11 미지원)

현재 UMD 빌드에서 발견된 ES6+ 기능들:

- ✗ `const`, `let` 선언
- ✗ `class` 문법
- ✗ 화살표 함수 (`=>`)
- ✗ Template literals (백틱 문자열)
- ✗ Spread operator (`...`)
- ✗ `Object.entries()`, `Array.from()` 등 ES6 메서드

### ✅ 현재 빌드 설정 (업데이트됨)

```typescript
// tsconfig.json
{
  "target": "es2015",  // ✅ ES2015로 변경
  "lib": ["dom", "es2015", "es2016", "es2017"]
}

// vite.config.ts
{
  build: {
    target: "es2015",  // ✅ ES2015로 변경
  }
}

// .browserslistrc (새로 생성)
last 2 Chrome versions
last 2 Firefox versions
last 2 Safari versions
last 2 Edge versions
> 0.5%
not dead
not IE 11  // ✅ IE11 명시적 제외
```

## 개선 방안

### 옵션 1: 다중 빌드 전략 (권장)

모던 브라우저와 레거시 브라우저 모두를 지원하는 여러 빌드 생성:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'iv-viewer',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: [
        {
          // 모던 브라우저용 (ES2015+)
          format: 'es',
          entryFileNames: 'iv-viewer.modern.js',
        },
        {
          // 레거시 브라우저용 (ES5)
          format: 'umd',
          name: 'ImageViewer',
          entryFileNames: 'iv-viewer.legacy.js',
        }
      ]
    }
  }
});

// tsconfig.es5.json (레거시 빌드용)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "es5", "es2015.promise"]
  }
}
```

**필요한 Polyfill:**

```bash
npm install --save-dev @babel/preset-env core-js
```

### 옵션 2: 단일 ES5 빌드 (최대 호환성)

모든 브라우저 지원, 파일 크기 증가:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "es5", "es2015.promise", "es2015.collection"],
    "downlevelIteration": true
  }
}

// vite.config.ts
{
  build: {
    target: ['es2015', 'safari10'],  // 더 넓은 호환성
  }
}
```

### 옵션 3: 최신 브라우저만 지원 (현재 상태 유지)

IE11 지원 제외, 파일 크기 최소화:

```typescript
// package.json
{
  "browserslist": [
    "defaults",
    "not IE 11",
    "maintained node versions"
  ]
}
```

## 권장 사항

### 1단계: 브라우저 지원 범위 결정

```javascript
// .browserslistrc 생성
# 모던 브라우저 (권장)
> 0.5%
last 2 versions
not dead
not IE 11

# OR

# IE11 포함
> 0.5%
last 2 versions
not dead
IE 11
```

### 2단계: 필요한 Polyfill 추가

```bash
npm install --save core-js regenerator-runtime
```

```typescript
// src/polyfills.ts (IE11 지원 시)
import 'core-js/features/object/assign';
import 'core-js/features/array/from';
import 'core-js/features/array/find';
import 'core-js/features/promise';
```

### 3단계: Vite 설정 업데이트

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'], // 또는 'ie >= 11'
      polyfills: ['es.promise', 'es.array.iterator'],
    }),
  ],
  build: {
    target: 'es2015', // IE11 지원 시 'es5'
  },
});
```

## 비교표

| 옵션      | IE11 | 파일크기 | 성능 | 구현 난이도 |
| --------- | ---- | -------- | ---- | ----------- |
| 다중 빌드 | ✅   | 중간     | 우수 | 중간        |
| ES5 단일  | ✅   | 큼       | 보통 | 쉬움        |
| 모던 전용 | ❌   | 작음     | 최상 | 현재        |

## 테스트 방법

### IE11 테스트

```bash
# BrowserStack, Sauce Labs 사용
# 또는 Windows VM에서 IE11 실행
```

### 빌드 검증

```bash
# ES5 호환성 체크
npx es-check es5 'dist/**/*.js'

# 번들 크기 분석
npx vite-bundle-visualizer
```

## 결론

**권장 사항:**

1. `.browserslistrc` 파일 생성으로 지원 브라우저 명시
2. IE11 지원이 필수가 아니라면 **ES2015+ (옵션 3)** 유지
3. IE11 지원이 필요하다면 **다중 빌드 (옵션 1)** 적용
4. `package.json`에 브라우저 호환성 명시

```json
{
  "browserslist": ["> 0.5%", "last 2 versions", "not dead", "not IE 11"]
}
```

## ✅ 완료된 단계

1. ✅ 브라우저 지원 정책 결정 - **ES2015+ (Modern Browsers)**
2. ✅ `.browserslistrc` 파일 생성
3. ✅ 빌드 설정 업데이트 (ES2015 타겟)
4. ✅ TypeScript 설정 업데이트
5. ✅ 빌드 테스트 완료

## ⏳ 선택적 단계 (IE11 지원 필요 시)

1. ⬜ `core-js`, `regenerator-runtime` 설치
2. ⬜ `src/index.ts`에 폴리필 import 추가
3. ⬜ `.browserslistrc`에서 "not IE 11" 제거
4. ⬜ IE11 실제 테스트
5. ⬜ README에 IE11 지원 명시

---

## 🎯 IE11 지원 추가 방법 (필요 시)

폴리필만 추가하면 IE11 지원 가능합니다:

### 1. 패키지 설치

```bash
npm install --save core-js regenerator-runtime
```

### 2. 폴리필 추가

```typescript
// src/index.ts 맨 위에 추가
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

### 3. Browserslist 수정

```diff
  last 2 Chrome versions
  last 2 Firefox versions
  last 2 Safari versions
  last 2 Edge versions
  > 0.5%
  not dead
- not IE 11
+ IE 11
```

**예상 영향:**

- 번들 크기: +30-40KB
- 성능: 약간 느려짐 (10-15%)
- 호환성: IE11 포함

---

## 📝 README 업데이트 필요

프로젝트 README에 다음 정보 추가 권장:

```markdown
## Browser Support

- ✅ Chrome (last 2 versions)
- ✅ Firefox (last 2 versions)
- ✅ Safari (last 2 versions)
- ✅ Edge (last 2 versions)
- ✅ iOS Safari
- ✅ Android Chrome
- ❌ Internet Explorer 11

> **Note:** IE11 support can be added with polyfills if needed.
```
