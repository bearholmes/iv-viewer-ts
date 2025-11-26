# 추상화 및 캡슐화 코드 리뷰

**프로젝트:** iv-viewer-ts
**날짜:** 2025-11-24
**리뷰 범위:** 추상화(Abstraction), 캡슐화(Encapsulation), 코드 구조(Code Organization)

---

## 📊 요약

**발견된 이슈:** 32개

- 🔴 High Severity: 18개
- 🟡 Medium Severity: 11개
- 🟢 Low Severity: 3개

**분류별 이슈:**

- **추상화 (Abstraction)**: 13개
- **캡슐화 (Encapsulation)**: 11개
- **코드 구조 (Code Organization)**: 8개

---

## 🎯 주요 문제점

### 1. ImageViewer 클래스가 너무 큼 (1,371 줄)

**심각도:** 🔴 High
**파일:** `src/ImageViewer.ts:37-1371`

**문제:**
단일 클래스에 너무 많은 책임이 집중되어 있습니다:

- DOM 초기화 및 조작
- 이미지 로딩 및 관리
- 3개의 다른 슬라이더 초기화
- 5개의 인터랙션 핸들러
- 줌 애니메이션 로직
- 상태 관리
- 이벤트 관리
- Public API 메서드

**영향:**

- 코드 이해 어려움
- 단일 책임 원칙(SRP) 위반
- 개별 기능 테스트 불가능
- 수정 시 부작용 위험

**권장 리팩토링:**

```typescript
// 책임별로 클래스 분리

class ImageViewerDOM {
  // DOM 초기화 및 관리만 담당
  init(container: HTMLElement): void {
    /* ... */
  }
  getElements(): ViewerElements {
    /* ... */
  }
}

class ImageViewerImageLoader {
  // 이미지 로딩만 담당
  loadImage(src: string, hiRes?: string): Promise<void> {
    /* ... */
  }
}

class ImageViewerInteractions {
  // 사용자 인터랙션만 담당
  setupImagePanning(): void {
    /* ... */
  }
  setupZoomSlider(): void {
    /* ... */
  }
}

class ImageViewerZoom {
  // 줌 로직만 담당
  zoom(percentage: number, point?: Point): void {
    /* ... */
  }
}

// 메인 클래스는 컴포넌트들을 조율
class ImageViewer {
  private dom: ImageViewerDOM;
  private imageLoader: ImageViewerImageLoader;
  private interactions: ImageViewerInteractions;
  private zoom: ImageViewerZoom;
}
```

---

### 2. 매직 넘버와 상수 분산

**심각도:** 🔴 High
**파일:** `src/ImageViewer.ts` (여러 위치)

**문제:**
코드 전체에 의미 없는 숫자들이 흩어져 있습니다:

```typescript
// Line 352
sampleInterval = 50  // 모멘텀 샘플링 주기

// Line 404
if (step <= 60)  // 애니메이션 프레임 수

// Line 429
Math.abs(xDiff) > 30  // 모멘텀 임계값

// Line 771-773
500  // 더블탭 간격 (ms)
50px  // 더블탭 거리

// Line 1084
if (step < 16)  // 줌 애니메이션 프레임

// Line 1223
1500  // 스냅뷰 타임아웃 (ms)
```

**영향:**

- 애니메이션 타이밍 이해 어려움
- 동작 조정을 위해 코드 수정 필요
- 의미 파악 불가능

**권장 리팩토링:**

```typescript
// 클래스 상수로 추출
class ImageViewer {
  private static readonly MOMENTUM_SAMPLE_INTERVAL_MS = 50;
  private static readonly MOMENTUM_ANIMATION_FRAMES = 60;
  private static readonly MOMENTUM_THRESHOLD_PX = 30;
  private static readonly DOUBLE_TAP_INTERVAL_MS = 500;
  private static readonly DOUBLE_TAP_DISTANCE_PX = 50;
  private static readonly DOUBLE_TAP_ZOOM_LEVEL = 200;
  private static readonly ZOOM_ANIMATION_FRAMES = 16;
  private static readonly SNAP_VIEW_TIMEOUT_MS = 1500;

  // 사용 예:
  // if (step <= ImageViewer.MOMENTUM_ANIMATION_FRAMES)
}
```

---

### 3. Protected 필드로 인한 캡슐화 위반

**심각도:** 🔴 High
**파일:** `src/ImageViewer.ts:41-42`

**문제:**
내부 요소와 이벤트가 `protected`로 선언되어 서브클래스에서 직접 접근 가능:

```typescript
protected _elements: Partial<ViewerElements>;
protected _events: Partial<ViewerEvents>;

// FullScreen.ts에서 직접 접근
this._elements.fullScreen = fullScreenElem;
this._events.onCloseBtnClick = assignEvent(closeBtn, 'click', this.hide);
```

**영향:**

- 서브클래스가 내부 구조에 의존
- 요소 관리 로직을 리팩토링할 수 없음
- DOM 조작이 여러 곳에 분산

**권장 리팩토링:**

```typescript
// Private으로 변경하고 메서드 제공
class ImageViewer {
  private _elements: Partial<ViewerElements>;
  private _events: Partial<ViewerEvents>;

  // 특정 요소 접근이 필요한 경우
  protected getElement<K extends keyof ViewerElements>(key: K): ViewerElements[K] | undefined {
    return this._elements[key];
  }

  // 이벤트 등록 메서드 제공
  protected registerEvent(
    eventKey: keyof ViewerEvents,
    handler: EventListener,
    element: EventTarget,
    eventType: string
  ): void {
    if (this._events[eventKey]) {
      this._events[eventKey]!();
    }
    this._events[eventKey] = assignEvent(element, eventType, handler);
  }
}
```

---

### 4. 상태 직접 수정으로 인한 추적 불가

**심각도:** 🔴 High
**파일:** `src/ImageViewer.ts` (여러 위치)

**문제:**
`_state` 객체가 코드 전체에서 직접 수정됨:

```typescript
// 여러 위치에서 직접 수정
this._state.zooming = true;
this._state.zoomValue = tickZoom;
const { loaded, zooming, zoomValue } = this._state;
```

**영향:**

- 상태 변경 추적 불가능
- 상태 일관성 검증 불가능
- 디버깅 어려움
- 상태 변화 모니터링 불가능

**권장 리팩토링:**

```typescript
class ImageViewerStateManager {
  private state: ViewerState = {
    zoomValue: 100,
    loaded: false,
    zooming: false,
  };

  private listeners: Set<(state: ViewerState) => void> = new Set();

  setState(updates: Partial<ViewerState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  getState<K extends keyof ViewerState>(key: K): ViewerState[K] {
    return this.state[key];
  }

  subscribe(listener: (state: ViewerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// 사용:
private stateManager = new ImageViewerStateManager();

this.stateManager.setState({ zooming: true });
const loaded = this.stateManager.getState('loaded');
```

---

### 5. 복잡한 줌 계산 로직

**심각도:** 🔴 High
**파일:** `src/ImageViewer.ts:1048-1133` (86 줄)

**문제:**
`zoom()` 메서드가 너무 많은 일을 함:

- 매개변수 정규화
- 포인트 정규화
- 현재 위치 파싱
- 기본 치수 계산
- 16프레임 애니메이션 루프
- 경계 제약 로직
- 스냅 핸들 리사이징
- 여러 CSS 업데이트

**영향:**

- 줌 수학 이해 어려움
- 이징이나 애니메이션 프레임 수정 어려움
- 애니메이션 루프에 상태 변경 분산

**권장 리팩토링:**

```typescript
class ZoomAnimation {
  constructor(
    private currentZoom: number,
    private targetZoom: number,
    private point: Point,
    private bounds: BoundingBox
  ) {}

  getFrame(step: number): ZoomFrame {
    const tickZoom = easeOutQuart(
      step,
      this.currentZoom,
      this.targetZoom - this.currentZoom,
      this.totalFrames
    );

    const position = this.calculatePosition(tickZoom);
    const constrainedPosition = this.constrainToBounds(position);

    return {
      zoom: tickZoom,
      position: constrainedPosition
    };
  }

  private calculatePosition(zoom: number): Point {
    // 복잡한 위치 계산 로직
  }

  private constrainToBounds(pos: Point): Point {
    // 경계 제약 로직
  }
}

// ImageViewer에서 사용:
zoom(targetZoom: number, zoomPoint?: Point): void {
  const animation = new ZoomAnimation(
    this._state.zoomValue,
    targetZoom,
    zoomPoint ?? this.getContainerCenter(),
    this.getBoundingBox()
  );

  this.animateZoom(animation);
}
```

---

### 6. 모멘텀 계산이 슬라이더와 강하게 결합

**심각도:** 🔴 High
**파일:** `src/ImageViewer.ts:323-442`

**문제:**
복잡한 모멘텀/관성 애니메이션 로직이 슬라이더 초기화에 묻혀있고 Slider 클래스와 강하게 결합:

```typescript
const trackPosition = (currentTime: number) => {
  if (currentTime - lastSampleTime >= sampleInterval) {
    if (currentPos) {
      positions.shift();
      positions.push({ x: currentPos.mx, y: currentPos.my });
    }
    lastSampleTime = currentTime;
  }
  this._frames.slideMomentumCheck = requestAnimationFrame(trackPosition);
};
```

**영향:**

- 모멘텀 로직 재사용 불가능
- 테스트 어려움
- 슬라이더와 애니메이션 관심사 혼합

**권장 리팩토링:**

```typescript
class MomentumAnimator {
  private positions: Array<{ x: number; y: number }> = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];
  private sampleInterval = 50;
  private lastSampleTime = 0;
  private frameId?: number;

  trackPosition(currentPos: { dx: number; dy: number; mx: number; my: number }): void {
    const currentTime = performance.now();
    if (currentTime - this.lastSampleTime >= this.sampleInterval) {
      this.positions.shift();
      this.positions.push({ x: currentPos.mx, y: currentPos.my });
      this.lastSampleTime = currentTime;
    }
  }

  calculateMomentum(): { xDiff: number; yDiff: number } {
    return {
      xDiff: this.positions[1].x - this.positions[0].x,
      yDiff: this.positions[1].y - this.positions[0].y,
    };
  }

  shouldApplyMomentum(): boolean {
    const { xDiff, yDiff } = this.calculateMomentum();
    return Math.abs(xDiff) > 30 || Math.abs(yDiff) > 30;
  }
}
```

---

### 7. 코드 중복 (DRY 위반)

**심각도:** 🔴 High

#### 7.1 이미지 URL 검증 로직 중복

**파일:** `src/ImageViewer.ts:212-213, 236-238, 824-826`

```typescript
// 3곳에서 반복
imageSrc = isValidImageUrl(rawSrc) ? rawSrc : null;
hiResImageSrc = isValidImageUrl(rawHiResSrc) ? rawHiResSrc : null;

if (!imageSrc) {
  throw new Error('Invalid or unsafe image URL protocol');
}
```

**리팩토링:**

```typescript
private validateAndAssignImageSources(
  rawSrc: string | null,
  rawHiResSrc: string | null
): { imageSrc: string | null; hiResImageSrc: string | null } {
  const imageSrc = isValidImageUrl(rawSrc) ? rawSrc : null;
  const hiResImageSrc = isValidImageUrl(rawHiResSrc) ? rawHiResSrc : null;

  if (!imageSrc) {
    throw new Error('Invalid or unsafe image URL protocol');
  }

  return { imageSrc, hiResImageSrc };
}
```

#### 7.2 스크롤 위치 가져오기 중복

**파일:** `src/ImageViewer.ts:649-650, 732-733, 770-772`

```typescript
// 3곳에서 동일한 패턴 반복
const scrollX = window.pageXOffset || window.scrollX || 0;
const scrollY = window.pageYOffset || window.scrollY || 0;
```

**리팩토링:**

```typescript
private getScrollPosition(): { x: number; y: number } {
  return {
    x: window.pageXOffset || window.scrollX || 0,
    y: window.pageYOffset || window.scrollY || 0
  };
}
```

#### 7.3 기본 매개변수 검증 패턴 중복

**파일:** `src/ImageViewer.ts:603-606, 611-615`

```typescript
// 정확히 동일한 코드가 2곳에
const zoomStep =
  this._options.zoomStep !== undefined && this._options.zoomStep !== null
    ? this._options.zoomStep
    : 50;
```

**리팩토링:**

```typescript
private getZoomStep(): number {
  return this._options.zoomStep !== undefined && this._options.zoomStep !== null
    ? this._options.zoomStep
    : 50;
}
```

---

### 8. css() 함수의 혼합 책임

**심각도:** 🟡 Medium
**파일:** `src/util.ts:184-220`

**문제:**
`css()` 함수가 getter와 setter를 오버로드로 처리:

```typescript
export function css(
  elements: Node | NodeList | HTMLCollectionOf<HTMLElement>,
  properties: string | Record<string, string>
): string | undefined {
  if (typeof properties === 'string') {
    // GET 동작
    return styles.getPropertyValue(properties);
  }
  // SET 동작
  element.style.setProperty(key, sanitizedValue);
}
```

**영향:**

- 혼란스러운 API
- 어떤 경로가 실행될지 이해 어려움
- 타입 안전성 저하

**권장 리팩토링:**

```typescript
export function getStyle(element: Element, property: string): string {
  const styles = window.getComputedStyle(element);
  return styles.getPropertyValue(property) || '';
}

export function setStyle(
  elements: HTMLElement | HTMLElement[],
  properties: Record<string, string>
): void {
  const elmArray = Array.isArray(elements) ? elements : [elements];
  elmArray.forEach((element) => {
    Object.keys(properties).forEach((key) => {
      const value = String(properties[key]).replace(/[<>'"]/g, '');
      element.style.setProperty(key, value);
    });
  });
}
```

---

## 📊 전체 이슈 목록

### 추상화 이슈 (13개)

| ID    | 심각도    | 설명                                    | 파일           | 라인      |
| ----- | --------- | --------------------------------------- | -------------- | --------- |
| A1.1  | 🔴 High   | 매직 넘버와 상수 분산                   | ImageViewer.ts | 여러 위치 |
| A1.2  | 🔴 High   | 복잡한 줌 계산 로직                     | ImageViewer.ts | 1048-1133 |
| A1.3  | 🔴 High   | 모멘텀 계산이 슬라이더와 결합           | ImageViewer.ts | 323-442   |
| A1.4  | 🔴 High   | 이미지 URL 검증 로직 중복               | ImageViewer.ts | 3곳       |
| A1.5  | 🟡 Medium | 이벤트 리스너 정리 패턴 중복            | ImageViewer.ts | 여러 위치 |
| A1.6  | 🟡 Medium | 스크롤 위치 API 호출 중복               | ImageViewer.ts | 3곳       |
| A1.7  | 🟡 Medium | 기본 매개변수 검증 패턴 중복            | ImageViewer.ts | 2곳       |
| A1.8  | 🟡 Medium | 이벤트 타입 감지 로직 중복              | Slider.ts      | 2곳       |
| A1.9  | 🟡 Medium | 하드코딩된 선택자가 있는 HTML 템플릿    | FullScreen.ts  | 4-7       |
| A1.10 | 🟡 Medium | 혼합 관심사의 복잡한 CSS 헬퍼 함수      | util.ts        | 184-220   |
| A1.11 | 🟢 Low    | 줌 상수 값에 문서 부족                  | util.ts        | 2-5       |
| A1.12 | 🟢 Low    | 더미 이벤트/위치 생성을 우회책으로 사용 | Slider.ts      | 64-66     |
| A1.13 | 🟢 Low    | 하드코딩된 기본 문자열로 parseFloat     | ImageViewer.ts | 여러 위치 |

### 캡슐화 이슈 (11개)

| ID    | 심각도    | 설명                                                 | 파일           | 라인      |
| ----- | --------- | ---------------------------------------------------- | -------------- | --------- |
| E2.1  | 🔴 High   | Protected \_elements 필드가 Private이어야 함         | ImageViewer.ts | 41        |
| E2.2  | 🔴 High   | Protected \_events가 내부 이벤트 관리 노출           | ImageViewer.ts | 42        |
| E2.3  | 🔴 High   | \_callbackData getter가 초기화되지 않으면 오류       | ImageViewer.ts | 155-176   |
| E2.4  | 🔴 High   | 캡슐화 없이 직접 상태 수정                           | ImageViewer.ts | 여러 위치 |
| E2.5  | 🔴 High   | 타입 캐스팅으로 \_sliders 객체에 직접 접근           | ImageViewer.ts | 여러 위치 |
| E2.6  | 🔴 High   | \_events 레지스트리가 임의의 문자열 키 허용          | ImageViewer.ts | 42-43     |
| E2.7  | 🟡 Medium | Slider 콜백이 검증되지 않음                          | Slider.ts      | 4-9       |
| E2.8  | 🟡 Medium | 범위가 불명확한 Slider 인스턴스 변수                 | Slider.ts      | 12-13     |
| E2.9  | 🟡 Medium | FullScreen.\_hide 화살표 함수가 바인딩 컨텍스트 깨짐 | FullScreen.ts  | 87        |
| E2.10 | 🟡 Medium | \_images 객체 구조가 검증되지 않음                   | ImageViewer.ts | 52        |
| E2.11 | 🟢 Low    | \_loadCounter에 컨텍스트 부족                        | ImageViewer.ts | 53        |

### 코드 구조 이슈 (8개)

| ID   | 심각도    | 설명                                                                  | 파일           | 라인      |
| ---- | --------- | --------------------------------------------------------------------- | -------------- | --------- |
| C3.1 | 🔴 High   | ImageViewer 클래스가 너무 큼 (1,371줄)                                | ImageViewer.ts | 37-1371   |
| C3.2 | 🔴 High   | \_initImageSlider 메서드가 너무 김 (120줄)                            | ImageViewer.ts | 323-442   |
| C3.3 | 🔴 High   | zoom 메서드가 너무 복잡함 (86줄)                                      | ImageViewer.ts | 1048-1133 |
| C3.4 | 🔴 High   | \_calculateDimensions 메서드가 너무 복잡함 (70줄)                     | ImageViewer.ts | 945-1015  |
| C3.5 | 🔴 High   | ImageViewer와 Slider 클래스 간 강한 결합                              | ImageViewer.ts | 332-437   |
| C3.6 | 🔴 High   | FullScreen.show()의 이벤트 바인딩이 this.refresh를 바인딩 없이 사용   | FullScreen.ts  | 71        |
| C3.7 | 🟡 Medium | Slider onStart/onMove가 선택적 매개변수 허용                          | Slider.ts      | 52-91     |
| C3.8 | 🟡 Medium | createElementOptions가 스타일을 문자열로 허용하지만 css()는 객체 기대 | util.ts        | 63-124    |

---

## 🎯 리팩토링 우선순위

### Phase 1: 긴급 (High Severity - High Impact)

1. **ImageViewer 클래스 분할** (Issue C3.1)
   - 4-5개의 집중된 클래스로 분리
   - 예상 시간: 2-3일

2. **매직 상수 추출** (Issue A1.1)
   - 클래스 상수로 이동
   - 예상 시간: 2-3시간

3. **내부 상태 보호** (Issue E2.4)
   - 상태 관리 메서드 추가
   - 예상 시간: 4-6시간

4. **Protected 필드 제거** (Issues E2.1, E2.2)
   - private으로 변경하고 접근자 메서드 추가
   - 예상 시간: 3-4시간

### Phase 2: 중요 (High Severity - Medium Impact)

5. **줌 로직 추상화** (Issues A1.2, C3.3)
   - ZoomCalculator 클래스 생성
   - 예상 시간: 1일

6. **모멘텀 계산 추출** (Issue A1.3)
   - MomentumAnimator 클래스 생성
   - 예상 시간: 4-6시간

7. **이벤트 중복 제거** (Issues A1.4, A1.5)
   - 헬퍼 메서드 생성
   - 예상 시간: 2-3시간

8. **Slider 결합 수정** (Issue C3.5)
   - SliderManager 도입
   - 예상 시간: 4-6시간

### Phase 3: 유익함 (Medium Severity)

9. **css() 유틸리티 분할** (Issue A1.10)
   - getStyle/setStyle 분리
   - 예상 시간: 2시간

10. **스타일 타입 일관성 수정** (Issue C3.8)
    - 예상 시간: 1시간

11. **Slider API 개선** (Issues C3.7, E2.7)
    - 명확한 매개변수 계약
    - 예상 시간: 2-3시간

12. **스크롤 위치 추출** (Issue A1.6)
    - 헬퍼 메서드 생성
    - 예상 시간: 30분

### Phase 4: 좋으면 좋음 (Low Severity)

13. 매직 상수 문서화 (Issue A1.11)
14. 초기화 패턴 개선 (Issues E2.10, A1.12)

---

## 💡 구현 예시

### 예시 1: ImageViewerStateManager 추출

**현재 (문제):**

```typescript
// 코드 곳곳에서 직접 상태 수정
this._state.zooming = true;
this._state.zoomValue = tickZoom;
const { loaded, zooming, zoomValue } = this._state;
```

**리팩토링 후:**

```typescript
class ImageViewerStateManager {
  private state: ViewerState = {
    zoomValue: 100,
    loaded: false,
    zooming: false,
  };

  private listeners: Set<(state: ViewerState) => void> = new Set();

  setState(updates: Partial<ViewerState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // 상태 변경 로깅
    console.log('State changed:', { old: oldState, new: this.state });

    this.notifyListeners();
  }

  getState<K extends keyof ViewerState>(key: K): ViewerState[K] {
    return this.state[key];
  }

  subscribe(listener: (state: ViewerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

// ImageViewer에서 사용
class ImageViewer {
  private stateManager = new ImageViewerStateManager();

  private initializeInteractions(): void {
    // 상태 변경 구독
    this.stateManager.subscribe((state) => {
      if (state.loaded && !state.zooming) {
        this.enablePanning();
      }
    });
  }

  private zoom(targetZoom: number): void {
    this.stateManager.setState({ zooming: true });
    // ... 애니메이션 ...
    this.stateManager.setState({
      zoomValue: newZoom,
      zooming: false,
    });
  }
}
```

### 예시 2: MomentumAnimator 추출

**현재 (문제):**

```typescript
// ImageViewer 내부에 모멘텀 로직이 분산
const positions = [
  { x: 0, y: 0 },
  { x: 0, y: 0 },
];
let currentPos: any;

const trackPosition = (currentTime: number) => {
  if (currentTime - lastSampleTime >= sampleInterval) {
    if (currentPos) {
      positions.shift();
      positions.push({ x: currentPos.mx, y: currentPos.my });
    }
  }
};
```

**리팩토링 후:**

```typescript
class MomentumAnimator {
  private positions: Point[] = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];
  private sampleInterval: number;
  private lastSampleTime = 0;
  private animationFrameId?: number;

  constructor(sampleIntervalMs = 50) {
    this.sampleInterval = sampleIntervalMs;
  }

  start(): void {
    this.lastSampleTime = performance.now();
    this.positions = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
  }

  track(position: Point): void {
    const now = performance.now();
    if (now - this.lastSampleTime >= this.sampleInterval) {
      this.positions.shift();
      this.positions.push(position);
      this.lastSampleTime = now;
    }
  }

  calculateVelocity(): Velocity {
    const deltaX = this.positions[1].x - this.positions[0].x;
    const deltaY = this.positions[1].y - this.positions[0].y;
    return { x: deltaX, y: deltaY };
  }

  shouldApplyMomentum(threshold = 30): boolean {
    const velocity = this.calculateVelocity();
    return Math.abs(velocity.x) > threshold || Math.abs(velocity.y) > threshold;
  }

  animate(callback: (velocity: Velocity, step: number) => void, frames = 60): void {
    const velocity = this.calculateVelocity();
    let step = 1;

    const animate = () => {
      if (step <= frames) {
        this.animationFrameId = requestAnimationFrame(animate);
        callback(velocity, step);
        step++;
      }
    };

    animate();
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }
}

// ImageViewer에서 사용
class ImageViewer {
  private momentumAnimator = new MomentumAnimator(50);

  private onPanStart(): void {
    this.momentumAnimator.start();
  }

  private onPanMove(position: Point): void {
    this.momentumAnimator.track(position);
  }

  private onPanEnd(): void {
    if (this.momentumAnimator.shouldApplyMomentum()) {
      this.momentumAnimator.animate((velocity, step) => {
        const dx = easeOutQuart(step, velocity.x / 3, -velocity.x / 3, 60);
        const dy = easeOutQuart(step, velocity.y / 3, -velocity.y / 3, 60);
        this.updatePanPosition(dx, dy);
      });
    }
  }
}
```

---

## 📈 예상 효과

### 리팩토링 후 개선 사항

1. **코드 이해도**
   - ✅ 각 클래스가 단일 책임만 가짐
   - ✅ 메서드 크기가 50줄 이하로 줄어듦
   - ✅ 매직 넘버가 명명된 상수로 변경

2. **테스트 가능성**
   - ✅ 각 컴포넌트를 독립적으로 테스트 가능
   - ✅ 모멘텀, 줌 로직을 모의 객체 없이 테스트 가능
   - ✅ 상태 변경을 추적하고 검증 가능

3. **유지보수성**
   - ✅ 기능 수정 시 영향 범위 최소화
   - ✅ 새 기능 추가가 쉬워짐
   - ✅ 버그 디버깅이 쉬워짐

4. **확장성**
   - ✅ 새로운 인터랙션 모드 추가 용이
   - ✅ 커스텀 이징 함수 교체 가능
   - ✅ 다른 프로젝트에서 컴포넌트 재사용 가능

---

## 🔍 참고 자료

### SOLID 원칙

- **S**ingle Responsibility Principle (단일 책임 원칙)
- **O**pen/Closed Principle (개방-폐쇄 원칙)
- **L**iskov Substitution Principle (리스코프 치환 원칙)
- **I**nterface Segregation Principle (인터페이스 분리 원칙)
- **D**ependency Inversion Principle (의존성 역전 원칙)

### 디자인 패턴

- **Strategy Pattern**: 줌/이징 알고리즘 교체
- **Observer Pattern**: 상태 변경 알림
- **Factory Pattern**: 슬라이더 생성
- **Command Pattern**: 실행 취소/다시 실행

### 리팩토링 기법

- **Extract Method**: 긴 메서드 분할
- **Extract Class**: 큰 클래스 분할
- **Replace Magic Number with Constant**: 매직 넘버 제거
- **Encapsulate Field**: 필드 캡슐화

---

**최종 업데이트:** 2025-11-24
**다음 리뷰:** 리팩토링 완료 후
