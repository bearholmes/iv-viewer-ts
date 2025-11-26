/**
 * TypeScript 타입 정의
 * 프로젝트 전반에서 사용되는 타입 인터페이스
 */

/**
 * 이미지 뷰어 옵션
 */
export interface ImageViewerOptions {
  /** 초기 줌 값 (퍼센트) */
  zoomValue?: number;
  /** 최대 줌 값 (퍼센트) */
  maxZoom?: number;
  /** 스냅뷰(미니맵) 표시 여부 */
  snapView?: boolean;
  /** 윈도우 리사이즈 시 자동 새로고침 */
  refreshOnResize?: boolean;
  /** 마우스 휠로 줌 허용 */
  zoomOnMouseWheel?: boolean;
  /** 줌 버튼 표시 여부 */
  hasZoomButtons?: boolean;
  /** 줌 버튼 클릭 시 증가/감소 값 */
  zoomStep?: number;
  /** 이벤트 리스너 콜백 */
  listeners?: ImageViewerListeners;
}

/**
 * 이미지 뷰어 이벤트 리스너
 */
export interface ImageViewerListeners {
  /** 뷰어 초기화 시 호출 */
  onInit?: (data: CallbackData) => void;
  /** 뷰어 파괴 시 호출 */
  onDestroy?: () => void;
  /** 이미지 로드 성공 시 호출 */
  onImageLoaded?: (data: CallbackData) => void;
  /** 이미지 로드 실패 시 호출 */
  onImageError?: (error: Event | ErrorEvent) => void;
  /** 줌 값 변경 시 호출 */
  onZoomChange?: (data: CallbackData) => void;
}

/**
 * 콜백 데이터
 */
export interface CallbackData {
  /** 뷰어 컨테이너 엘리먼트 */
  container: HTMLElement;
  /** 스냅뷰 엘리먼트 */
  snapView: HTMLElement | null;
  /** 현재 줌 값 */
  zoomValue: number;
  /** 최소 줌에 도달했는지 여부 */
  reachedMin: boolean;
  /** 최대 줌에 도달했는지 여부 */
  reachedMax: boolean;
  /** 뷰어 인스턴스 */
  instance: unknown; // ImageViewer 타입 (순환 참조 방지)
}

/**
 * 뷰어 엘리먼트
 */
export interface ViewerElements {
  /** 뷰어 컨테이너 */
  container: HTMLElement;
  /** DOM 엘리먼트 (img 또는 컨테이너) */
  domElement: HTMLElement;
  /** 이미지 래퍼 */
  imageWrap?: HTMLElement;
  /** 스냅뷰 컨테이너 */
  snapView?: HTMLElement;
  /** 스냅 이미지 래퍼 */
  snapImageWrap?: HTMLElement;
  /** 스냅 이미지 엘리먼트 */
  snapImage?: HTMLElement;
  /** 스냅 핸들 */
  snapHandle?: HTMLElement;
  /** 줌 핸들 */
  zoomHandle?: HTMLElement;
  /** 줌 인 버튼 */
  zoomIn?: HTMLElement;
  /** 줌 아웃 버튼 */
  zoomOut?: HTMLElement;
  /** 이미지 엘리먼트 */
  image?: HTMLImageElement;
  /** 풀스크린 컨테이너 (FullScreenViewer용) */
  fullScreen?: HTMLElement;
}

/**
 * 뷰어 상태
 */
export interface ViewerState {
  /** 현재 줌 값 */
  zoomValue: number;
  /** 이미지 로드 완료 여부 */
  loaded: boolean;
  /** 이미지 크기 */
  imageDim: Dimensions;
  /** 컨테이너 크기 */
  containerDim: Dimensions;
  /** 스냅 이미지 크기 */
  snapImageDim: Dimensions;
  /** 줌 중인지 여부 */
  zooming: boolean;
  /** 스냅뷰가 표시 중인지 여부 */
  snapViewVisible: boolean;
  /** 줌 슬라이더 길이 */
  zoomSliderLength: number;
  /** 스냅 핸들 크기 */
  snapHandleDim: Dimensions;
}

/**
 * 크기 (너비, 높이)
 */
export interface Dimensions {
  /** 너비 */
  w: number;
  /** 높이 */
  h: number;
}

/**
 * 위치 (x, y 좌표)
 */
export interface Position {
  /** X 좌표 */
  x: number;
  /** Y 좌표 */
  y: number;
}

/**
 * 이동 거리 (delta x, delta y)
 */
export interface Movement {
  /** X축 이동 거리 */
  dx: number;
  /** Y축 이동 거리 */
  dy: number;
}

/**
 * 이미지 정보
 */
export interface ImageInfo {
  /** 일반 해상도 이미지 src */
  imageSrc: string;
  /** 고해상도 이미지 src */
  hiResImageSrc?: string;
}

/**
 * 슬라이더 이벤트 콜백
 */
export interface SliderCallbacks {
  /** 슬라이더 시작 시 호출 */
  onStart?: (event: MouseEvent | TouchEvent, position: Position) => void;
  /** 슬라이더 이동 시 호출 */
  onMove?: (event: MouseEvent | TouchEvent, position: Movement) => void;
  /** 슬라이더 종료 시 호출 */
  onEnd?: (event: MouseEvent | TouchEvent) => void;
}

/**
 * 뷰어 이벤트 핸들러
 */
export interface ViewerEvents {
  /** 윈도우 리사이즈 이벤트 */
  onWindowResize?: () => void;
  /** 핀치 시작 이벤트 */
  pinchStart?: () => void;
  /** 핀치 이동 이벤트 */
  pinchMove?: () => void;
  /** 핀치 종료 이벤트 */
  pinchEnd?: () => void;
  /** 줌 인 클릭 이벤트 */
  zoomInClick?: () => void;
  /** 줌 아웃 클릭 이벤트 */
  zoomOutClick?: () => void;
  /** 이미지 로드 이벤트 */
  imageLoad?: () => void;
  /** 고해상도 이미지 로드 이벤트 */
  hiResImageLoad?: () => void;
  /** 이미지 에러 이벤트 */
  imageError?: () => void;
  /** 스냅뷰 마우스 진입 이벤트 */
  mouseEnterSnapView?: () => void;
  /** 스냅뷰 마우스 이탈 이벤트 */
  mouseLeaveSnapView?: () => void;
  /** 스냅뷰 마우스 이동 이벤트 */
  snapViewOnMouseMove?: () => void;
  /** 닫기 버튼 클릭 이벤트 */
  onCloseBtnClick?: () => void;
  /** 더블탭 줌 클릭 이벤트 */
  doubleTapClick?: () => void;
}

/**
 * 애니메이션 프레임/타임아웃 저장소
 */
export interface AnimationFrames {
  /** 슬라이드 모멘텀 체크 애니메이션 프레임 (P2-4: changed from setInterval to requestAnimationFrame) */
  slideMomentumCheck?: number;
  /** 줌 애니메이션 프레임 */
  zoomFrame?: number;
  /** 스냅뷰 숨김 타임아웃 */
  snapViewTimeout?: ReturnType<typeof setTimeout>;
  /** 슬라이더 모멘텀 애니메이션 프레임 */
  sliderMomentumFrame?: number;
}

/**
 * 슬라이더 인스턴스
 */
export interface SliderInstances {
  /** 스냅 슬라이더 */
  snapSlider?: unknown; // Slider 타입
  /** 이미지 슬라이더 */
  imageSlider?: unknown; // Slider 타입
  /** 줌 슬라이더 */
  zoomSlider?: unknown; // Slider 타입
}

/**
 * 엘리먼트 생성 옵션
 */
export interface CreateElementOptions {
  /** 태그 이름 */
  tagName: string;
  /** 엘리먼트 ID */
  id?: string;
  /** 클래스 이름 */
  className?: string;
  /** innerHTML */
  html?: string;
  /** src 속성 (img 태그용) */
  src?: string;
  /** 부모 엘리먼트 */
  parent?: HTMLElement;
  /** 자식 엘리먼트 */
  child?: HTMLElement;
}

/**
 * CSS 스타일 객체
 */
export interface CSSStyles {
  [key: string]: string | number;
}

/**
 * 컨테이너 찾기 결과
 */
export interface ContainerResult {
  /** 컨테이너 엘리먼트 */
  container: HTMLElement;
  /** DOM 엘리먼트 */
  domElement: HTMLElement;
  /** 이미지 src */
  imageSrc?: string;
  /** 고해상도 이미지 src */
  hiResImageSrc?: string;
}

/**
 * 이벤트 리스너 제거 함수
 */
export type EventRemover = () => void;
