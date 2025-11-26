# 아키텍처 리뷰: 추상화 및 캡슐화 분석

**프로젝트:** iv-viewer-ts
**날짜:** 2025-11-24
**리뷰 유형:** 추상화, 캡슐화, 코드 구조

---

## 📊 전체 요약

| 카테고리     | 심각도 | 발견 이슈 수 | 상태           |
| ------------ | ------ | ------------ | -------------- |
| **Critical** | 🔴     | 3개          | 즉시 조치 필요 |
| **High**     | 🟠     | 5개          | 우선순위 높음  |
| **Medium**   | 🟡     | 3개          | 중간 우선순위  |
| **Low**      | 🟢     | 1개          | 개선 권장      |

---

## 🔴 Critical 이슈

### CRIT-1: God Class 안티패턴 - ImageViewer 1370줄

**파일:** `src/ImageViewer.ts`
**라인:** 37-1351
**심각도:** 🔴 Critical

**문제점:**

ImageViewer 클래스가 너무 많은 책임을 가지고 있습니다 (Single Responsibility Principle 위반):

```typescript
ImageViewer (1370 lines)
├── DOM 초기화 및 관리
├── 이미지 로딩 및 검증
├── 차원 계산 (dimensions)
├── 슬라이더 관리 (3개!)
├── 이벤트 바인딩 및 관리
├── 줌 로직
├── 팬 로직
├── 스냅뷰 로직
└── 정리 및 파괴 로직
```

**영향:**

- 테스트 어려움 (단위 테스트 거의 불가능)
- 유지보수 어려움 (변경 시 영향 범위 파악 곤란)
- 재사용 불가능 (각 기능을 독립적으로 사용 불가)
- 새 기능 추가 시 복잡도 급증

**권장 리팩토링:**

```typescript
// 제안: 책임별로 분리
ImageViewer (오케스트레이터, ~300 lines)
├── ImageLoader (이미지 로딩, 검증)
├── DimensionCalculator (크기 계산)
├── ZoomController (줌 로직)
├── PanController (팬/슬라이드 로직)
├── SnapViewController (스냅뷰 로직)
├── EventManager (이벤트 바인딩)
└── SliderFactory (슬라이더 생성)
```

---

### CRIT-2: Protected 필드로 인한 캡슐화 위반

**파일:** `src/ImageViewer.ts`
**라인:** 41-42
**심각도:** 🔴 Critical

**문제점:**

```typescript
protected _elements: Partial<ViewerElements>;
protected _events: Partial<ViewerEvents>;
```

FullScreen 클래스가 부모의 `protected` 필드에 직접 접근:

```typescript
// FullScreen.ts, line 37
this._elements.fullScreen = fullScreenElem; // 직접 접근

// FullScreen.ts, line 89
css(this._elements.fullScreen, { display: 'none' }); // 내부 구현 노출
```

**영향:**

- 자식 클래스가 부모의 내부 구조에 강하게 결합
- 부모 클래스 변경 시 모든 자식 클래스 영향
- 캡슐화 원칙 위반
- 정보 은닉 실패

**해결 방안:**

```typescript
// Before
protected _elements: Partial<ViewerElements>;

// After
private _elements: Partial<ViewerElements>;

protected getContainer(): HTMLElement {
  if (!this._elements.container) {
    throw new Error('Container not initialized');
  }
  return this._elements.container;
}

protected getSnapView(): HTMLElement {
  if (!this._elements.snapView) {
    throw new Error('SnapView not initialized');
  }
  return this._elements.snapView;
}
```

---

### CRIT-3: 공개 API를 통한 구현 세부사항 노출

**파일:** `src/ImageViewer.ts`
**라인:** 155-176
**심각도:** 🔴 Critical

**문제점:**

```typescript
get _callbackData(): {
  container: HTMLElement;      // ← DOM 요소 직접 노출
  snapView: HTMLElement;        // ← DOM 요소 직접 노출
  zoomValue: number;
  reachedMin: boolean;
  reachedMax: boolean;
  instance: ImageViewer;        // ← 인스턴스 자체 노출
}
```

**영향:**

- 사용자가 내부 DOM 요소를 직접 수정 가능
- 뷰어가 깨질 위험
- 내부 DOM 구조 변경 = Breaking Change
- getter가 `_`로 시작 (private 암시) vs 실제로는 public

**해결 방안:**

```typescript
// 읽기 전용 상태만 노출
public getState(): ViewerState {
  return {
    zoomValue: this._state.zoomValue,
    loaded: this._state.loaded,
    zooming: this._state.zooming,
    // 읽기 전용 복사본만 반환
  };
}

// 또는 개별 메서드 제공
public getZoomValue(): number {
  return this._state.zoomValue;
}

public isLoaded(): boolean {
  return this._state.loaded;
}

// DOM 요소는 절대 노출하지 않기
```

---

## 🟠 High Priority 이슈

### HIGH-1: 코드 중복 - 0으로 나누기 체크 4회 반복

**파일:** `src/ImageViewer.ts`
**라인:** 376, 412, 490, 1177
**심각도:** 🟠 High

**문제점:**

같은 패턴이 4군데 이상 반복:

```typescript
// Line 376-380
const dx = imageCurrentDim.w !== 0 ? (-position.dx * snapImageDim.w) / imageCurrentDim.w : 0;
const dy = imageCurrentDim.h !== 0 ? (-position.dy * snapImageDim.h) / imageCurrentDim.h : 0;

// Line 412-415 (동일 패턴)
const dx = imageCurrentDim.w !== 0 ? -((positionX * snapImageDim.w) / imageCurrentDim.w) : 0;

// Line 490-492 (동일 패턴)
const imgLeft = snapImageDim.w !== 0 ? (-left * imageCurrentDim.w) / snapImageDim.w : 0;

// Line 1177-1182 (동일 패턴 x4)
```

**해결 방안:**

```typescript
private safeDivide(
  numerator: number,
  denominator: number,
  defaultValue: number = 0
): number {
  return denominator !== 0 ? numerator / denominator : defaultValue;
}

// 사용
const dx = this.safeDivide(-position.dx * snapImageDim.w, imageCurrentDim.w);
const dy = this.safeDivide(-position.dy * snapImageDim.h, imageCurrentDim.h);
```

**예상 효과:**

- 코드 중복 제거
- 유지보수 용이
- 테스트 가능

---

### HIGH-2: 코드 중복 - 스크롤 위치 계산 3회 반복

**파일:** `src/ImageViewer.ts`
**라인:** 535, 649, 732
**심각도:** 🟠 High

**문제점:**

```typescript
// Line 535-536 (zoom slider)
const scrollX = window.pageXOffset || window.scrollX || 0;

// Line 649-650 (pinch zoom)
const scrollX = window.pageXOffset || window.scrollX || 0;
const scrollY = window.pageYOffset || window.scrollY || 0;

// Line 732-733 (scroll zoom)
const scrollX = window.pageXOffset || window.scrollX || 0;
const scrollY = window.pageYOffset || window.scrollY || 0;
```

**해결 방안:**

```typescript
private getScrollPosition(): { x: number; y: number } {
  return {
    x: window.pageXOffset || window.scrollX || 0,
    y: window.pageYOffset || window.scrollY || 0,
  };
}

// 사용
const { x: scrollX, y: scrollY } = this.getScrollPosition();
```

---

### HIGH-3: 코드 중복 - 줌 스텝 검증 2회 반복

**파일:** `src/ImageViewer.ts`
**라인:** 603-617
**심각도:** 🟠 High

**문제점:**

```typescript
this._events.zoomInClick = assignEvent(zoomIn, ['click'], () => {
  const zoomStep =
    this._options.zoomStep !== undefined && this._options.zoomStep !== null
      ? this._options.zoomStep
      : 50;
  this.zoom(this._state.zoomValue + zoomStep);
});

this._events.zoomOutClick = assignEvent(zoomOut, ['click'], () => {
  const zoomStep =
    this._options.zoomStep !== undefined && this._options.zoomStep !== null
      ? this._options.zoomStep
      : 50;
  this.zoom(this._state.zoomValue - zoomStep);
});
```

**해결 방안:**

```typescript
private getZoomStep(): number {
  return this._options.zoomStep ?? 50;
}

this._events.zoomInClick = assignEvent(zoomIn, ['click'],
  () => this.zoom(this._state.zoomValue + this.getZoomStep())
);

this._events.zoomOutClick = assignEvent(zoomOut, ['click'],
  () => this.zoom(this._state.zoomValue - this.getZoomStep())
);
```

---

### HIGH-4: FullScreen이 Liskov Substitution Principle 위반

**파일:** `src/FullScreen.ts`
**라인:** 9-117
**심각도:** 🟠 High

**문제점:**

```typescript
class FullScreenViewer extends ImageViewer {
  show(imageSrc: string, hiResImageSrc: string) {
    css(this._elements.fullScreen, { display: 'block' });
    if (imageSrc) {
      this.load(imageSrc, hiResImageSrc); // 부모 메서드 호출
    }
    // ... 완전히 다른 동작
  }
}
```

`show()` 메서드는 `ImageViewer`의 `load()`와 완전히 다른 인터페이스입니다.
이는 진정한 대체(substitution)가 아닙니다.

**해결 방안 - Composition over Inheritance:**

```typescript
class FullScreenViewer {
  private imageViewer: ImageViewer;
  private fullScreenContainer: HTMLElement;

  constructor(options: ImageViewerOptions) {
    this.fullScreenContainer = this.createFullScreenContainer();
    this.imageViewer = new ImageViewer(this.fullScreenContainer, options);
  }

  show(imageSrc: string, hiResImageSrc?: string): void {
    this.displayFullScreen();
    this.imageViewer.load(imageSrc, hiResImageSrc);
  }

  hide(): void {
    this.hideFullScreen();
    this.imageViewer.destroy();
  }
}
```

---

### HIGH-5: 유틸리티 함수가 여러 관심사 혼합

**파일:** `src/util.ts`
**라인:** 92-124
**심각도:** 🟠 High

**문제점:**

`createElement` 함수가 너무 많은 일을 함:

```typescript
export function createElement(options: CreateElementOptions) {
  const elem = document.createElement(options.tagName);
  if (options.id) elem.id = options.id; // 속성 설정
  if (options.html) elem.innerHTML = options.html; // 보안 처리
  if (options.src && elem instanceof HTMLImageElement) {
    if (!isValidImageUrl(options.src)) {
      // URL 검증
      throw new Error(`Invalid...`);
    }
    elem.setAttribute('src', options.src);
  }
  if (options.style) elem.style.cssText = options.style; // 스타일링
  if (options.child) elem.appendChild(options.child); // DOM 삽입
  if (options.parent) options.parent.appendChild(elem); // 부모에 삽입
  return elem;
}
```

**해결 방안:**

```typescript
// 생성 관심사
function createElement(tag: string, options?: ElementOptions): HTMLElement {
  const elem = document.createElement(tag);
  if (options?.id) elem.id = options.id;
  if (options?.className) elem.className = options.className;
  return elem;
}

// 스타일링 관심사
function applyStyles(elem: HTMLElement, styles: CSSStyles): void {
  Object.assign(elem.style, styles);
}

// 삽입 관심사
function insertElement(elem: HTMLElement, parent: HTMLElement): void {
  parent.appendChild(elem);
}

// 검증 관심사 (별도 모듈)
function createImageElement(src: string, options?: ImageElementOptions): HTMLImageElement {
  if (!isValidImageUrl(src)) {
    throw new Error(`Invalid image URL: ${src}`);
  }
  const img = createElement('img', options) as HTMLImageElement;
  img.src = src;
  return img;
}
```

---

## 🟡 Medium Priority 이슈

### MED-1: 이벤트 바인딩 로직이 분산됨

**파일:** `src/ImageViewer.ts`
**라인:** 여러 곳
**심각도:** 🟡 Medium

**문제점:**

이벤트 관리가 추상화되지 않음. 여러 패턴이 혼재:

1. 직접 assignEvent (line 572):

```typescript
this._events.onWindowResize = assignEvent(window, 'resize', () => this.refresh());
```

2. 슬라이더를 통한 이벤트 (lines 338-343)
3. 복잡한 정리 로직이 있는 이벤트 (lines 684-685)

**해결 방안:**

```typescript
class EventManager {
  private listeners: Map<string, () => void> = new Map();

  on(name: string, element: EventTarget, event: string, handler: Function): void {
    const removeListener = assignEvent(element, event, handler);
    this.listeners.set(name, removeListener);
  }

  off(name: string): void {
    const listener = this.listeners.get(name);
    listener?.();
    this.listeners.delete(name);
  }

  offAll(): void {
    this.listeners.forEach((listener) => listener());
    this.listeners.clear();
  }
}
```

---

### MED-2: 슬라이더 콜백이 다른 컴포넌트와 강하게 결합

**파일:** `src/ImageViewer.ts`
**라인:** 323-442
**심각도:** 🟡 Medium

**문제점:**

```typescript
const imageSlider = new Slider(imageWrap, {
  onStart: (_, position) => {
    const { snapSlider } = this._sliders;
    snapSlider.onStart(); // ← 다른 슬라이더 직접 호출
    // ...
  },
  onMove: (e, position) => {
    const { snapSlider } = this._sliders;
    snapSlider.onMove(e, { dx, dy, mx: 0, my: 0 }); // ← 직접 동기화
  },
});
```

**해결 방안:**

좌표 변환기 추상화:

```typescript
class CoordinateTransformer {
  transformToSnapCoordinates(
    pos: Position,
    imageDim: Dimensions,
    snapImageDim: Dimensions
  ): Position {
    return {
      x: this.safeDivide(-pos.x * snapImageDim.w, imageDim.w),
      y: this.safeDivide(-pos.y * snapImageDim.h, imageDim.h),
    };
  }
}

// 사용
const snapCoordinates = this.coordTransformer.transformToSnapCoordinates(
  position,
  this.imageDim,
  this.snapImageDim
);
snapSlider.onMove(e, snapCoordinates);
```

---

### MED-3: 이미지 로딩 로직이 여러 관심사 혼합

**파일:** `src/ImageViewer.ts`
**라인:** 802-905
**심각도:** 🟡 Medium

**문제점:**

`_loadImages()` 메서드가 너무 많은 일을 함:

1. 이전 로드 취소 (상태 관리)
2. DOM 조작
3. 요소 생성
4. 이벤트 바인딩
5. 차원 계산 트리거
6. 콜백 내 상태 변경

**해결 방안:**

```typescript
// 책임 분리
class ImageLoader {
  async load(src: string): Promise<HTMLImageElement> {}
}

class ImageRenderer {
  render(image: HTMLImageElement, container: HTMLElement): void {}
}

class ImageStateManager {
  markAsLoaded(): void {}
  markAsError(): void {}
}

class DimensionCalculator {
  calculate(image: HTMLImageElement): Dimensions {}
}
```

---

## 🟢 Low Priority 이슈

### LOW-1: Slider의 더미 이벤트 생성

**파일:** `src/Slider.ts`
**라인:** 64-66
**심각도:** 🟢 Low

**문제점:**

```typescript
public onStart(event?: Event, position?: { x: number; y: number }) {
  if (event && position) {
    return this._onStart(event, position);
  } else if (!event && !position) {
    const dummyEvent = new Event('dummy');
    const dummyPosition = { x: 0, y: 0 };
    return this._onStart(dummyEvent, dummyPosition);
  }
}
```

더미 객체를 생성하는 것은 진짜 설계 문제를 가립니다.

**해결 방안:**

```typescript
// 명시적 메서드 분리
public onStartFromEvent(event: Event, position: Position): void {
  this._onStart(event, position);
}

public onStartManual(): void {
  // 수동 트리거용 로직
}
```

---

## 📋 우선순위별 권장 조치

### Phase 1: 즉시 수정 (Low Risk)

**목표:** 코드 중복 제거 및 헬퍼 메서드 생성

1. ✅ `getZoomStep()` 메서드 생성
2. ✅ `safeDivide()` 메서드 생성
3. ✅ `getScrollPosition()` 메서드 생성
4. ✅ `protected` → `private` 변경 + getter 메서드 추가

**예상 소요 시간:** 2-3시간
**리스크:** 낮음

### Phase 2: 핵심 책임 추출 (Medium Risk)

**목표:** 주요 기능을 독립 클래스로 분리

1. ⏳ `ImageLoader` 클래스 추출
2. ⏳ `DimensionCalculator` 클래스 추출
3. ⏳ `EventManager` 클래스 추출
4. ⏳ `ZoomController` 클래스 추출

**예상 소요 시간:** 1-2주
**리스크:** 중간

### Phase 3: 상속 문제 수정 (High Risk)

**목표:** FullScreenViewer를 composition으로 변경

1. ⏳ FullScreenViewer를 composition으로 리팩토링
2. ⏳ 명시적 인터페이스 계약 추출

**예상 소요 시간:** 3-5일
**리스크:** 높음 (Breaking Change)

### Phase 4: 완전한 리팩토링 (Breaking Change)

**목표:** ImageViewer를 작은 조율 클래스들로 분해

1. ⏳ ImageViewer를 여러 조율 클래스로 분해
2. ⏳ 타입과 함께 명시적 공개 API 계약 생성
3. ⏳ 접근자 뒤에 내부 DOM 구조 숨기기

**예상 소요 시간:** 2-3주
**리스크:** 매우 높음 (Major Version)

---

## 💡 빠른 수정 예시

### 예시 1: safeDivide 유틸리티 추출

```typescript
// Before (4군데 반복)
const dx = imageCurrentDim.w !== 0
  ? (-position.dx * snapImageDim.w) / imageCurrentDim.w
  : 0;

// After
private safeDivide(
  numerator: number,
  denominator: number,
  defaultValue: number = 0
): number {
  return denominator !== 0 ? numerator / denominator : defaultValue;
}

const dx = this.safeDivide(-position.dx * snapImageDim.w, imageCurrentDim.w);
```

**영향:**

- 코드 라인 4줄 → 1줄
- 중복 제거
- 테스트 가능
- 유지보수 용이

---

### 예시 2: protected 필드 캡슐화

```typescript
// Before
protected _elements: Partial<ViewerElements>;

// FullScreen에서
this._elements.fullScreen = fullScreenElem;  // 직접 접근

// After
private _elements: Partial<ViewerElements>;

protected getContainer(): HTMLElement {
  if (!this._elements.container) {
    throw new Error('Container not initialized');
  }
  return this._elements.container;
}

// FullScreen에서
const container = this.getContainer();  // 제어된 접근
```

**영향:**

- 캡슐화 복원
- 타입 안전성 증가
- 자식 클래스 결합도 감소

---

### 예시 3: getZoomStep 추출

```typescript
// Before (2군데 반복)
const zoomStep =
  this._options.zoomStep !== undefined && this._options.zoomStep !== null
    ? this._options.zoomStep
    : 50;

// After
private getZoomStep(): number {
  return this._options.zoomStep ?? 50;
}

// 사용
this.zoom(this._state.zoomValue + this.getZoomStep());
```

**영향:**

- 6줄 → 1줄
- null 병합 연산자 활용
- 읽기 쉬운 코드

---

## 📊 메트릭 요약

### 현재 상태

| 메트릭                | 값   | 목표   |
| --------------------- | ---- | ------ |
| ImageViewer 라인 수   | 1370 | < 500  |
| 메서드당 평균 라인 수 | ~50  | < 20   |
| 순환 복잡도           | 높음 | 중간   |
| 코드 중복률           | ~15% | < 5%   |
| Protected 필드 수     | 2    | 0      |
| Public API 표면적     | 높음 | 최소화 |

### 개선 후 예상

| 메트릭              | Phase 1 | Phase 2 | Phase 4 |
| ------------------- | ------- | ------- | ------- |
| ImageViewer 라인 수 | 1200    | 800     | 300     |
| 코드 중복률         | 10%     | 5%      | <3%     |
| 테스트 가능성       | 낮음    | 중간    | 높음    |
| 유지보수성          | 낮음    | 중간    | 높음    |

---

## 🎯 결론

이 코드베이스는 **관심사 분리 부족**과 **과도한 캡슐화 위반**을 겪고 있습니다.
주요 문제는 모든 것을 처리하는 **1370줄의 ImageViewer 클래스**입니다.

**단기 조치:**

- ✅ 헬퍼 메서드 추출
- ✅ `protected` → `private` 변경
- ✅ 코드 중복 제거

**장기 목표:**

- ⏳ ImageViewer를 단일 책임을 가진 집중된 클래스들로 분해
- ⏳ 명확한 인터페이스와 계약
- ⏳ 테스트 가능한 아키텍처

---

**최종 업데이트:** 2025-11-24
**다음 검토:** 2026-01-24
