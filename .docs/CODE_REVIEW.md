# 코드 리뷰 - iv-viewer-ts

**리뷰 날짜**: 2025-11-23
**총 코드 라인 수**: ~1,620 TypeScript 라인
**발견된 이슈**: 38개

---

## 요약

**iv-viewer-ts** 프로젝트는 기능적으로 작동하는 TypeScript 기반 이미지 뷰어 라이브러리이며, 좋은 기초 패턴(엄격한 TypeScript 설정, 프로덕션 의존성 제로)을 가지고 있습니다. 하지만 다음 영역에서 개선이 필요합니다:

- **보안**: XSS 및 프로토타입 오염 취약점
- **타입 안정성**: `any` 타입의 과도한 사용 (20개 이상)
- **성능**: 레이아웃 스래싱, 비효율적인 DOM 쿼리
- **테스트**: 테스트 커버리지 제로
- **메모리**: 화살표 함수 클래스 필드로 인한 메모리 누수

---

## 1. 🔴 치명적 이슈

### 1.1 ESLint로 타입 안정성 비활성화

**파일**: `.eslintrc` (11번 줄)

```json
"@typescript-eslint/no-explicit-any": "off"
```

**영향**: `any` 타입을 20개 이상 사용 가능하게 하여 TypeScript의 목적을 무력화

**해결**: 이 규칙을 제거하여 타입 안정성 강제

---

### 1.2 테스트 커버리지 제로

**상태**: 프로젝트 전체에서 테스트 파일을 찾을 수 없음

**영향**:

- 높은 리그레션 위험
- 엣지 케이스 검증 불가
- 안전한 리팩토링 어려움

**권장사항**: Jest 또는 Vitest로 단위 테스트 추가

---

### 1.3 화살표 함수 클래스 필드 (메모리 누수)

**파일**: `src/ImageViewer.ts` (948, 1045, 1058, 1088, 1113, 1119번 줄)

```typescript
// 현재 (인스턴스마다 새 함수 객체 생성)
zoom = (perc: number, point?: any) => {
  /* ... */
};
```

**문제**:

- 각 인스턴스가 새 함수 객체 생성 (6개 메서드 × N 인스턴스)
- 이벤트 리스너 제거 실패 가능
- 메모리 사용량 배증

**해결**: 프로토타입 메서드 사용

```typescript
zoom(perc: number, point?: any): void { /* ... */ }
```

---

## 2. 🟠 높은 우선순위 보안 이슈

### 2.1 innerHTML을 통한 XSS

**파일**: `src/util.ts` (44번 줄)

```typescript
if (options.html) elem.innerHTML = options.html; // 검증 없음
```

**위험**: 사용자 입력이 이 함수에 도달하면 XSS 공격 가능

**해결**: 입력 검증 추가 또는 DOMPurify 사용

---

### 2.2 assign()을 통한 프로토타입 오염

**파일**: `src/util.ts` (115-123번 줄)

```typescript
export function assign(target: AnyObject, ...rest: AnyObject[]): AnyObject {
  rest.forEach((obj) => {
    Object.keys(obj).forEach((key) => {
      target[key] = obj[key]; // 검증되지 않은 할당
    });
  });
  return target;
}
```

**위험**: 공격자가 객체 속성을 제어하면 프로토타입 오염 가능

**해결**: 키 검증 또는 네이티브 `Object.assign()` 사용

---

### 2.3 DOM 엘리먼트 속성 저장

**파일**: `src/ImageViewer.ts` (125, 189, 1171번 줄)

```typescript
domElement._imageViewer = this; // DOM에 참조 저장
```

**문제**:

- 순환 참조 생성
- 메모리 누수 위험
- DOM 모범 사례 위반

**해결**: `WeakMap<HTMLElement, ImageViewer>` 사용

---

### 2.4 querySelector에 대한 null 체크 누락

**파일**: `src/ImageViewer.ts` (여러 위치)

```typescript
const sliderElm = snapView.querySelector('.iv-zoom-slider');
const zoomSlider = sliderElm.clientWidth; // null이면 크래시!
```

**위험**: DOM 구조가 변경되면 런타임 오류

**해결**: 모든 querySelector 결과에 null 체크 추가

---

### 2.5 안전하지 않은 타입 캐스팅

**파일**: `src/ImageViewer.ts` (515, 630-631번 줄)

```typescript
assignEvent(window as any as HTMLElement, 'resize', this.refresh);
assignEvent(document as any as HTMLElement, 'touchmove', moveListener);
```

**문제**: 이중 캐스팅(`as any as`)으로 TypeScript 타입 안정성 우회

**해결**: `assignEvent()`를 `EventTarget`을 받도록 수정

---

## 3. ⚡ 성능 이슈

### 3.1 애니메이션 루프 내 querySelector

**파일**: `src/ImageViewer.ts` (931번 줄)

```typescript
const zoom = () => {
  // 줌마다 16번 호출됨
  const zoomSlider = snapView.querySelector('.iv-zoom-slider').clientWidth; // 루프 안에서 쿼리!
};
```

**영향**: 줌 애니메이션마다 DOM 쿼리 16번 실행

**해결**: 루프 밖에서 한 번만 쿼리

---

### 3.2 레이아웃 스래싱

**파일**: `src/ImageViewer.ts` (줌 애니메이션)

```typescript
css(image, {
  /* 스타일 */
}); // 쓰기
const left = parseFloat(css(image, 'left')); // 읽기 (리플로우 강제!)
css(snapHandle, {
  /* 스타일 */
}); // 쓰기
```

**영향**: 프레임당 여러 번의 리플로우를 강제하여 성능 저하

**해결**: 모든 읽기를 쓰기 전에 일괄 처리

---

### 3.3 프레임 레이트 의존적 애니메이션

**파일**: `src/ImageViewer.ts` (981-987번 줄)

```typescript
const zoom = () => {
  step++; // 프레임 카운터, 시간 기반 아님
  if (step < 16) {
    this._frames.zoomFrame = requestAnimationFrame(zoom);
  }
};
```

**문제**: 애니메이션 속도가 60Hz vs 120Hz 디스플레이에서 달라짐

**해결**: 타임스탬프 기반 애니메이션 사용

---

### 3.4 더 이상 사용되지 않는 스크롤 속성

**파일**: `src/ImageViewer.ts` (481, 683-684번 줄)

```typescript
document.body.scrollLeft; // 더 이상 사용되지 않음!
document.body.scrollTop; // 더 이상 사용되지 않음!
```

**해결**: `window.scrollX` 및 `window.scrollY` 사용

---

## 4. 🟡 코드 품질 이슈

### 4.1 `any` 타입의 과도한 사용

**위치**:

- `util.ts`: 6개
- `ImageViewer.ts`: 5개 이상
- `Slider.ts`: 6개

**예시**:

```typescript
static defaults: any;
_ev: any;
protected _elements: any;
export function imageLoaded (img: any): boolean
```

**영향**: 타입 체킹 없음, IDE 자동완성 지원 안 됨

**해결**: 적절한 TypeScript 인터페이스 생성

---

### 4.2 입력 검증 누락

**파일**: `src/ImageViewer.ts` (77번 줄)

```typescript
constructor(element: any, options = {}) {
  // element나 options 검증 없음
}
```

**해결**: 입력 검증 및 명확한 오류 메시지 제공

---

### 4.3 불완전한 에러 처리

**파일**: `src/ImageViewer.ts` (811-816번 줄)

```typescript
const onImageError = (e: any) => {
  css(ivLoader, { display: 'none' });
  if (this._listeners.onImageError) {
    this._listeners.onImageError(e);
  }
  // 리스너가 없으면 기본 동작 없음
};
```

**해결**: 기본 에러 로깅 추가

---

### 4.4 검증 없는 타입 단언

**파일**: `src/ImageViewer.ts` (여러 위치)

```typescript
startHandleTop = parseFloat(<string>css(snapHandle, 'top'));
// css()는 undefined를 반환할 수 있음, parseFloat는 NaN 반환
```

**해결**: 파싱 결과 검증

---

### 4.5 중복된 조건 로직

**파일**: `src/ImageViewer.ts` (683-684번 줄)

```typescript
const x = (e.pageX || e.pageX) - (contOffset.left + document.body.scrollLeft);
```

**문제**: `e.pageX || e.pageX`는 중복. 아마도:

```typescript
const x = (e.pageX ?? e.clientX) - (contOffset.left + window.scrollX);
```

---

## 5. 📚 모범 사례

### 5.1 대규모 모놀리식 클래스

**파일**: `src/ImageViewer.ts` (1,195줄)

**문제**: 클래스가 너무 많은 책임을 가짐

- DOM 관리
- 이벤트 처리
- 이미지 로딩
- 애니메이션
- 상태 관리

**권장사항**: 더 작은 클래스로 분할

---

### 5.2 JSDoc 문서 누락

**문제**: 공개 메서드에 JSDoc 주석 없음

**예시**:

```typescript
// 문서 없음!
zoom = (perc: number, point?: any) => {

// 다음과 같아야 함:
/**
 * 지정된 퍼센트로 이미지 줌
 * @param perc - 줌 퍼센트 (100-500)
 * @param point - 줌 중심점 {x, y}
 */
zoom(perc: number, point?: { x: number; y: number }): void {
```

---

### 5.3 접근성 이슈

**누락**:

- 버튼에 대한 ARIA 레이블
- 키보드 네비게이션
- 포커스 관리
- 스크린 리더 지원

**해결**: `aria-label`, `tabindex`, 키보드 핸들러 추가

---

### 5.4 이벤트 위임 없음

**파일**: `src/ImageViewer.ts` (549-556번 줄)

```typescript
assignEvent(zoomIn, ['click'], () => this.zoom(...));
assignEvent(zoomOut, ['click'], () => this.zoom(...));
```

**문제**: 위임 대신 개별 리스너

**개선**: 부모에 단일 리스너로 위임

---

### 5.5 변수 명명 문제

**예시**:

```typescript
private sx!: number;  // startX로 해야 함
private sy!: number;  // startY로 해야 함
this._ev = ...;       // _wheelEventListener로 해야 함
perc: number          // zoomPercentage로 해야 함
```

---

## 6. 🔧 의존성 이슈

### 6.1 더 이상 사용되지 않는 Rollup 플러그인

**파일**: `package.json`

```json
"rollup-plugin-commonjs": "^10.1.0",      // 더 이상 사용되지 않음
"rollup-plugin-node-resolve": "^5.2.0",   // 더 이상 사용되지 않음
```

**해결**: 최신 `@rollup/plugin-*` 버전 사용

---

### 6.2 사용하지 않는 의존성

```json
"unique-temp-dir": "^1.0.0"  // 어디에도 사용되지 않음
```

**해결**: package.json에서 제거

---

### 6.3 느슨한 버전 고정

```json
"vite": "^5",          // 5.99.99 설치 가능
"typescript": "^5.0.2" // 5.9.x에서 깨질 수 있음
```

**권장사항**: 정확한 버전 사용 또는 더 안전한 패치를 위해 틸드 사용

---

## 7. ⚙️ 빌드 설정

### 7.1 여러 빌드 시스템

**문제**: Vite와 Rollup 모두 사용

```json
"build": "vite build && tsc",
"build-cjs": "rollup -c",
```

**권장사항**: 단일 빌드 시스템으로 통합

---

### 7.2 프로덕션의 소스맵

**파일**: `vite.config.ts` (24번 줄)

```typescript
sourcemap: true,  // 소스 코드 노출
```

**권장사항**: 프로덕션에서 비활성화 또는 환경 변수 사용

---

### 7.3 축소 설정 누락

**문제**: Vite 설정에 축소 전략 지정 없음

**권장사항**: console.log 제거를 위한 terser 설정 추가

---

## 8. 심각도별 요약

| 심각도    | 개수 | 예시                                           |
| --------- | ---- | ---------------------------------------------- |
| 🔴 치명적 | 3    | 테스트 없음, 메모리 누수, 타입 안정성 비활성화 |
| 🟠 높음   | 5    | XSS, 프로토타입 오염, null 체크                |
| ⚡ 성능   | 4    | 레이아웃 스래싱, 루프 내 DOM 쿼리              |
| 🟡 중간   | 15   | 변수명, 문서 누락, 대형 클래스                 |
| 🟢 낮음   | 11   | 사용하지 않는 의존성, 설정 개선                |

**총 38개 이슈**

---

## 9. 권장 실행 계획

### 1단계: 치명적 수정 (1-2일)

1. ✅ `@typescript-eslint/no-explicit-any` 규칙 활성화
2. ✅ 화살표 함수 클래스 필드 → 프로토타입 메서드로 변경
3. ✅ 모든 querySelector 호출에 null 체크 추가
4. ✅ DOM 엘리먼트 저장을 WeakMap으로 교체

### 2단계: 보안 및 성능 (3-5일)

5. ✅ createElement의 html에 입력 검증 추가
6. ✅ assign()의 프로토타입 오염 수정
7. ✅ DOM 쿼리 최적화 (루프 밖으로 이동)
8. ✅ 레이아웃 스래싱 수정 (읽기/쓰기 일괄 처리)
9. ✅ 타임스탬프 기반 애니메이션 사용

### 3단계: 타입 안정성 (1-2주)

10. ✅ 모든 `any` 타입에 대한 TypeScript 인터페이스 생성
11. ✅ 모든 명시적 `any` 타입 제거
12. ✅ 적절한 타입 가드 및 검증 추가

### 4단계: 테스트 및 문서 (1-2주)

13. ✅ Jest/Vitest 테스트 스위트 추가
14. ✅ 핵심 기능에 대한 단위 테스트 작성
15. ✅ JSDoc 주석 추가
16. ✅ 인라인 문서 개선

### 5단계: 마무리 (1-2일)

17. ✅ 더 이상 사용되지 않는 의존성 업데이트
18. ✅ 사용하지 않는 의존성 제거
19. ✅ 변수 명명 개선
20. ✅ 접근성 기능 추가

---

## 10. 코드 예시

### 수정 1: DOM 속성 대신 WeakMap

**이전**:

```typescript
domElement._imageViewer = this;
```

**이후**:

```typescript
const viewerMap = new WeakMap<HTMLElement, ImageViewer>();
viewerMap.set(domElement, this);
```

---

### 수정 2: null 안전 querySelector

**이전**:

```typescript
const sliderElm = snapView.querySelector('.iv-zoom-slider');
const width = sliderElm.clientWidth;
```

**이후**:

```typescript
const sliderElm = snapView.querySelector('.iv-zoom-slider');
if (!sliderElm) {
  console.error('필수 엘리먼트를 찾을 수 없습니다');
  return;
}
const width = sliderElm.clientWidth;
```

---

### 수정 3: 타임스탬프 기반 애니메이션

**이전**:

```typescript
let step = 0;
const zoom = () => {
  step++;
  if (step < 16) requestAnimationFrame(zoom);
};
```

**이후**:

```typescript
let startTime: number | null = null;
const zoom = (currentTime: DOMHighResTimeStamp) => {
  if (!startTime) startTime = currentTime;
  const progress = Math.min((currentTime - startTime) / 250, 1);
  if (progress < 1) requestAnimationFrame(zoom);
};
```

---

## 결론

코드베이스는 기능적이지만 현대화가 필요합니다. 우선순위:

1. 타입 안정성 활성화
2. 메모리 누수 수정
3. 테스트 커버리지 추가
4. 성능 개선

이러한 개선을 통해 라이브러리는 프로덕션 준비 및 유지보수가 가능해질 것입니다.
