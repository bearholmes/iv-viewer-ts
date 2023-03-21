const H = new Function();
function C(i, e, t, s) {
  return i /= s, i -= 1, -t * (i * i * i * i - 1) + e;
}
function b(i) {
  const e = document.createElement(i.tagName);
  return i.id && (e.id = i.id), i.html && (e.innerHTML = i.html), i.className && (e.className = i.className), i.src && e instanceof HTMLImageElement && (e.src = i.src), i.style && (e.style.cssText = i.style), i.child && e.appendChild(i.child), i.insertBefore ? i.parent.insertBefore(e, i.insertBefore) : i.parent.appendChild(e), e;
}
function O(i, e) {
  const t = e.split(" ");
  t.length > 1 ? t.forEach((s) => O(i, s)) : i.classList ? i.classList.add(e) : i.className += ` ${e}`;
}
function F(i, e) {
  const t = e.split(" ");
  t.length > 1 ? t.forEach((s) => F(i, s)) : i.classList ? i.classList.remove(e) : i.className = i.className.replace(
    new RegExp(`(^|\\b)${e.split(" ").join("|")}(\\b|$)`, "gi"),
    " "
  );
}
function Z(i) {
  return i.complete && (typeof i.naturalWidth > "u" || i.naturalWidth !== 0);
}
function $(i) {
  return i instanceof HTMLElement ? [i] : i instanceof NodeList || i instanceof HTMLCollection ? Array.prototype.slice.call(i) : [];
}
function m(i, e) {
  const t = $(i);
  if (typeof e == "string")
    return window.getComputedStyle(t[0])[e];
  t.forEach((s) => {
    Object.keys(e).forEach((n) => {
      s.style[n] = e[n];
    });
  });
}
function q(i, e) {
  i.style.removeProperty(e);
}
function B(i, { tag: e = "div", className: t, id: s, style: n }) {
  const l = document.createElement(e);
  t && (l.className = t), s && (l.id = s), n && (n.display && (l.style.display = n.display), n.overflow && (l.style.overflow = n.overflow));
  const o = i.parentNode;
  if (!o)
    throw new Error("element does not have a parent node");
  return o.insertBefore(l, i), o.removeChild(i), l.appendChild(i), l;
}
function R(i) {
  const e = i.parentNode;
  e && e !== document.body && (e.parentNode?.insertBefore(i, e), e.parentNode?.removeChild(e));
}
function L(i) {
  $(i).forEach((t) => {
    t.parentNode && t.parentNode.removeChild(t);
  });
}
function W(i, e, t) {
  return Math.min(Math.max(i, e), t);
}
function _(i, e, t) {
  const s = Array.isArray(e) ? e : [e];
  return s.forEach((n) => i.addEventListener(n, t)), () => {
    s.forEach((n) => i.removeEventListener(n, t));
  };
}
function A(i) {
  const e = i[0], t = i[1];
  return Math.sqrt(
    Math.pow(t.pageX - e.pageX, 2) + Math.pow(t.pageY - e.pageY, 2)
  );
}
class T {
  onStart;
  onMove;
  onEnd;
  isSliderEnabled;
  container;
  touchMoveEvent;
  touchEndEvent;
  sx;
  sy;
  constructor(e, {
    onStart: t,
    onMove: s,
    onEnd: n,
    isSliderEnabled: l
  }) {
    this.container = e, this.isSliderEnabled = l, this.onStart = t || H, this.onMove = s || H, this.onEnd = n || H;
  }
  startHandler = (e) => {
    if (!this.isSliderEnabled())
      return;
    this.removeListeners(), e.preventDefault();
    const { moveHandler: t, endHandler: s, onStart: n } = this, l = e.type === "touchstart" || e.type === "touchend";
    let o, r;
    if (l) {
      const a = e;
      this.touchMoveEvent = "touchmove", this.touchEndEvent = "touchend", o = a.touches[0].clientX, r = a.touches[0].clientY;
    } else {
      const a = e;
      this.touchMoveEvent = "mousemove", this.touchEndEvent = "mouseup", o = a.clientX, r = a.clientY;
    }
    this.sx = o, this.sy = r, n(e, {
      x: this.sx,
      y: this.sy
    }), document.addEventListener(this.touchMoveEvent, t), document.addEventListener(this.touchEndEvent, s), document.addEventListener("contextmenu", s);
  };
  moveHandler = (e) => {
    if (!this.isSliderEnabled())
      return;
    e.preventDefault();
    const { sx: t, sy: s, onMove: n } = this, l = this.touchMoveEvent === "touchmove";
    let o, r;
    if (l) {
      const a = e;
      o = a.touches[0].clientX, r = a.touches[0].clientY;
    } else {
      const a = e;
      o = a.clientX, r = a.clientY;
    }
    n(e, {
      dx: o - t,
      dy: r - s,
      mx: o,
      my: r
    });
  };
  endHandler = () => {
    this.isSliderEnabled() && (this.removeListeners(), this.onEnd());
  };
  // remove previous events if it's not removed
  // - Case when while sliding mouse moved out of document and released there
  removeListeners() {
    this.touchMoveEvent && document.removeEventListener(this.touchMoveEvent, this.moveHandler), this.touchEndEvent && document.removeEventListener(this.touchEndEvent, this.endHandler), document.removeEventListener("contextmenu", this.endHandler);
  }
  init() {
    ["touchstart", "mousedown"].forEach((e) => {
      this.container.addEventListener(e, this.startHandler);
    });
  }
  destroy() {
    ["touchstart", "mousedown"].forEach((e) => {
      this.container.removeEventListener(e, this.startHandler);
    }), this.removeListeners();
  }
}
class D {
  _elements;
  _options;
  _listeners;
  _events;
  _state;
  _sliders;
  _frames;
  _images;
  static defaults;
  static FullScreenViewer;
  _ev;
  get zoomInButton() {
    return this._options.hasZoomButtons ? '<div class="iv-button-zoom--in" role="button"></div>' : "";
  }
  get zoomOutButton() {
    return this._options.hasZoomButtons ? '<div class="iv-button-zoom--out" role="button"></div>' : "";
  }
  get imageViewHtml() {
    return `
    <div class="iv-loader"></div>
    <div class="iv-snap-view">
      <div class="iv-snap-image-wrap">
        <div class="iv-snap-handle"></div>
      </div>
      <div class="iv-zoom-actions ${this._options.hasZoomButtons ? "iv-zoom-actions--has-buttons" : ""}">
        ${this.zoomInButton}
        <div class="iv-zoom-slider">
          <div class="iv-zoom-handle"></div>
        </div>
        ${this.zoomOutButton}
      </div>
    </div>
    <div class="iv-image-view" >
      <div class="iv-image-wrap" ></div>
    </div>
  `;
  }
  constructor(e, t = {}) {
    const { container: s, domElement: n, imageSrc: l, hiResImageSrc: o } = this._findContainerAndImageSrc(e);
    this._elements = {
      container: s,
      domElement: n
    }, this._options = { ...D.defaults, ...t }, this._events = {}, this._listeners = this._options.listeners || {}, this._frames = {}, this._sliders = {}, this._state = {
      zoomValue: this._options.zoomValue
    }, this._images = {
      imageSrc: l,
      hiResImageSrc: o
    }, this._init(), l && this._loadImages(), n._imageViewer = this;
  }
  _findContainerAndImageSrc(e) {
    let t = e, s, n;
    if (typeof e == "string" && (t = document.querySelector(e)), t._imageViewer)
      throw new Error("An image viewer is already being initiated on the element.");
    let l = e;
    return t.tagName === "IMG" ? (s = t.src, n = t.getAttribute("high-res-src") || t.getAttribute("data-high-res-src"), l = B(t, { className: "iv-container iv-image-mode", style: { display: "inline-block", overflow: "hidden" } }), m(t, {
      opacity: 0,
      position: "relative",
      zIndex: -1
    })) : (s = t.getAttribute("src") || t.getAttribute("data-src"), n = t.getAttribute("high-res-src") || t.getAttribute("data-high-res-src")), {
      container: l,
      domElement: t,
      imageSrc: s,
      hiResImageSrc: n
    };
  }
  _init() {
    this._initDom(), this._initImageSlider(), this._initSnapSlider(), this._initZoomSlider(), this._pinchAndZoom(), this._scrollZoom(), this._doubleTapToZoom(), this._initEvents();
  }
  _initDom() {
    const { container: e } = this._elements;
    b({
      tagName: "div",
      className: "iv-wrap",
      html: this.imageViewHtml,
      parent: e
    }), O(e, "iv-container"), m(e, "position") === "static" && m(e, { position: "relative" }), this._elements = {
      ...this._elements,
      snapView: e.querySelector(".iv-snap-view"),
      snapImageWrap: e.querySelector(".iv-snap-image-wrap"),
      imageWrap: e.querySelector(".iv-image-wrap"),
      snapHandle: e.querySelector(".iv-snap-handle"),
      zoomHandle: e.querySelector(".iv-zoom-handle"),
      zoomIn: e.querySelector(".iv-button-zoom--in"),
      zoomOut: e.querySelector(".iv-button-zoom--out")
    }, this._listeners.onInit && this._listeners.onInit(this._callbackData);
  }
  _initImageSlider() {
    const {
      _elements: e
    } = this, { imageWrap: t } = e;
    let s, n;
    const l = new T(t, {
      isSliderEnabled: () => {
        const { loaded: o, zooming: r, zoomValue: a } = this._state;
        return o && !r && a > 100;
      },
      onStart: (o, r) => {
        const { snapSlider: a } = this._sliders;
        this._clearFrames(), a.onStart(), s = [r, r], n = void 0, this._frames.slideMomentumCheck = setInterval(() => {
          n && (s.shift(), s.push({
            x: n.mx,
            y: n.my
          }));
        }, 50);
      },
      onMove: (o, r) => {
        const { snapImageDim: a } = this._state, { snapSlider: h } = this._sliders, c = this._getImageCurrentDim();
        n = r, h.onMove(o, {
          dx: -r.dx * a.w / c.w,
          dy: -r.dy * a.h / c.h
        });
      },
      onEnd: () => {
        const { snapImageDim: o } = this._state, { snapSlider: r } = this._sliders, a = this._getImageCurrentDim();
        this._clearFrames();
        let h, c, d;
        const u = s[1].x - s[0].x, p = s[1].y - s[0].y, f = () => {
          h <= 60 && (this._frames.sliderMomentumFrame = requestAnimationFrame(f)), c += C(h, u / 3, -u / 3, 60), d += C(h, p / 3, -p / 3, 60), r.onMove(null, {
            dx: -(c * o.w / a.w),
            dy: -(d * o.h / a.h)
          }), h++;
        };
        (Math.abs(u) > 30 || Math.abs(p) > 30) && (h = 1, c = n.dx, d = n.dy, f());
      }
    });
    l.init(), this._sliders.imageSlider = l;
  }
  _initSnapSlider() {
    const {
      snapHandle: e
    } = this._elements;
    let t, s;
    const n = new T(e, {
      isSliderEnabled: () => this._state.loaded,
      onStart: () => {
        const { slideMomentumCheck: l, sliderMomentumFrame: o } = this._frames;
        t = parseFloat(m(e, "top")), s = parseFloat(m(e, "left")), clearInterval(l), typeof o == "number" && cancelAnimationFrame(o);
      },
      onMove: (l, o) => {
        const { snapHandleDim: r, snapImageDim: a } = this._state, { image: h } = this._elements, c = this._getImageCurrentDim();
        if (!r)
          return;
        const d = Math.max(a.w - r.w, s), u = Math.max(a.h - r.h, t), p = Math.min(0, s), f = Math.min(0, t), v = W(s + o.dx, p, d), g = W(t + o.dy, f, u), w = -v * c.w / a.w, y = -g * c.h / a.h;
        m(e, {
          left: `${v}px`,
          top: `${g}px`
        }), m(h, {
          left: `${w}px`,
          top: `${y}px`
        });
      }
    });
    n.init(), this._sliders.snapSlider = n;
  }
  _initZoomSlider() {
    const { snapView: e, zoomHandle: t } = this._elements, s = e.querySelector(".iv-zoom-slider");
    let n, l;
    const o = new T(s, {
      isSliderEnabled: () => this._state.loaded,
      onStart: (r) => {
        const { zoomSlider: a } = this._sliders;
        n = s.getBoundingClientRect().left + document.body.scrollLeft, l = parseInt(m(t, "width"), 10), a.onMove(r);
      },
      onMove: (r) => {
        const { maxZoom: a } = this._options, { zoomSliderLength: h } = this._state, c = r.pageX !== void 0 ? r.pageX : r.touches[0].pageX;
        if (!h)
          return;
        const d = W(c - n - l / 2, 0, h), u = 100 + (a - 100) * d / h;
        this.zoom(u);
      }
    });
    o.init(), this._sliders.zoomSlider = o;
  }
  _initEvents() {
    this._snapViewEvents(), this._options.refreshOnResize && (this._events.onWindowResize = _(window, "resize", this.refresh));
  }
  _snapViewEvents() {
    const { imageWrap: e, snapView: t } = this._elements;
    if (this._events.snapViewOnMouseMove = _(e, ["touchmove", "mousemove"], () => {
      this.showSnapView();
    }), this._events.mouseEnterSnapView = _(t, ["mouseenter", "touchstart"], () => {
      this._state.snapViewVisible = !1, this.showSnapView(!0);
    }), this._events.mouseLeaveSnapView = _(t, ["mouseleave", "touchend"], () => {
      this._state.snapViewVisible = !1, this.showSnapView();
    }), !this._options.hasZoomButtons)
      return;
    const { zoomOut: s, zoomIn: n } = this._elements;
    this._events.zoomInClick = _(n, ["click"], () => {
      this.zoom(this._state.zoomValue + (this._options.zoomStep || 50));
    }), this._events.zoomOutClick = _(s, ["click"], () => {
      this.zoom(this._state.zoomValue - (this._options.zoomStep || 50));
    });
  }
  _pinchAndZoom() {
    const { imageWrap: e, container: t } = this._elements, s = (n) => {
      const { loaded: l, zoomValue: o } = this._state, { _events: r } = this;
      if (!l)
        return;
      const a = n.touches[0], h = n.touches[1];
      if (!(a && h))
        return;
      this._state.zooming = !0;
      const c = t.getBoundingClientRect(), d = A(n.touches), u = {
        x: (h.pageX + a.pageX) / 2 - (c.left + document.body.scrollLeft),
        y: (h.pageY + a.pageY) / 2 - (c.top + document.body.scrollTop)
      }, p = (v) => {
        const g = A(v.touches), w = o + (g - d) / 2;
        this.zoom(w, u);
      }, f = (v) => {
        r.pinchMove && r.pinchMove(), r.pinchEnd && r.pinchEnd(), this._state.zooming = !1, v.touches.length === 1 && this._sliders.imageSlider.startHandler(v);
      };
      r.pinchMove && r.pinchMove(), r.pinchEnd && r.pinchEnd(), r.pinchMove = _(document, "touchmove", p), r.pinchEnd = _(document, "touchend", f);
    };
    this._events.pinchStart = _(e, "touchstart", s);
  }
  _scrollZoom() {
    const { _options: e } = this, { container: t, imageWrap: s } = this._elements;
    let n = 0;
    const l = (o) => {
      const { loaded: r, zoomValue: a } = this._state;
      if (!e.zoomOnMouseWheel || !r)
        return;
      this._clearFrames();
      const h = Math.max(-1, Math.min(1, o.wheelDelta || -o.detail || -o.deltaY)), c = a * (100 + h * 15) / 100;
      if (c >= 100 && c <= e.maxZoom ? n = 0 : n += Math.abs(h), o.preventDefault(), n > 5)
        return;
      const d = t.getBoundingClientRect(), u = (o.pageX || o.pageX) - (d.left + document.body.scrollLeft), p = (o.pageY || o.pageY) - (d.top + document.body.scrollTop);
      this.zoom(c, {
        x: u,
        y: p
      }), this.showSnapView();
    };
    this._ev = _(s, "wheel", l);
  }
  _doubleTapToZoom() {
    const { imageWrap: e } = this._elements;
    let t = 0, s;
    _(e, "click", (l) => {
      t === 0 ? (t = Date.now(), s = {
        x: l.pageX,
        y: l.pageY
      }) : (Date.now() - t < 500 && Math.abs(l.pageX - s.x) < 50 && Math.abs(l.pageY - s.y) < 50 && (this._state.zoomValue === this._options.zoomValue ? this.zoom(200) : this.resetZoom()), t = 0);
    });
  }
  _getImageCurrentDim() {
    const { zoomValue: e, imageDim: t } = this._state;
    return {
      w: t.w * (e / 100),
      h: t.h * (e / 100)
    };
  }
  _loadImages() {
    const { _images: e, _elements: t } = this, { imageSrc: s, hiResImageSrc: n } = e, { container: l, snapImageWrap: o, imageWrap: r } = t, a = l.querySelector(".iv-loader");
    L(l.querySelectorAll(".iv-snap-image, .iv-image"));
    const h = b({
      tagName: "img",
      className: "iv-snap-image",
      src: s,
      insertBefore: o.firstChild,
      parent: o
    }), c = b({
      tagName: "img",
      className: "iv-image iv-small-image",
      src: s,
      parent: r
    });
    this._state.loaded = !1, this._elements.image = c, this._elements.snapImage = h, m(a, { display: "block" }), m(c, { visibility: "hidden" }), this.hideSnapView();
    const d = () => {
      m(a, { display: "none" }), m(c, { visibility: "visible" }), n && this._loadHighResImage(n), this._state.loaded = !0, this._calculateDimensions(), this._listeners.onImageLoad && this._listeners.onImageLoaded(this._callbackData), this.resetZoom();
    };
    Z(c) ? d() : this._events.imageLoad = _(c, "load", d);
  }
  _loadHighResImage(e) {
    const { imageWrap: t, container: s } = this._elements, n = this._elements.image, l = b({
      tagName: "img",
      className: "iv-image iv-large-image",
      src: e,
      parent: t,
      style: n.style.cssText
    });
    l.style.cssText = n.style.cssText, this._elements.image = s.querySelectorAll(".iv-image");
    const o = () => {
      L(n), this._elements.image = l;
    };
    Z(l) ? o() : this._events.hiResImageLoad = _(l, "load", o);
  }
  _calculateDimensions() {
    const { image: e, container: t, snapView: s, snapImage: n, zoomHandle: l } = this._elements, o = parseInt(m(e, "width"), 10), r = parseInt(m(e, "height"), 10), a = parseInt(m(t, "width"), 10), h = parseInt(m(t, "height"), 10), c = s.clientWidth, d = s.clientHeight;
    this._state.containerDim = {
      w: a,
      h
    };
    const u = o / r, p = o > r && h >= a || u * h > a ? a : u * h, f = p / u;
    this._state.imageDim = {
      w: p,
      h: f
    }, m(e, {
      width: `${p}px`,
      height: `${f}px`,
      left: `${(a - p) / 2}px`,
      top: `${(h - f) / 2}px`,
      maxWidth: "none",
      maxHeight: "none"
    });
    const v = p > f ? c : p * d / f, g = f > p ? d : f * c / p;
    this._state.snapImageDim = {
      w: v,
      h: g
    }, m(n, {
      width: `${v}px`,
      height: `${g}px`
    });
    const w = s.querySelector(".iv-zoom-slider").clientWidth;
    this._state.zoomSliderLength = w - l.offsetWidth;
  }
  resetZoom(e = !0) {
    const { zoomValue: t } = this._options;
    e || (this._state.zoomValue = t), this.zoom(t);
  }
  zoom = (e, t) => {
    const { _options: s, _elements: n, _state: l } = this, { zoomValue: o, imageDim: r, containerDim: a, zoomSliderLength: h } = l, { image: c, zoomHandle: d } = n, { maxZoom: u } = s;
    e = Math.round(Math.max(100, e)), e = Math.min(u, e), t = t || {
      x: a.w / 2,
      y: a.h / 2
    };
    const p = parseFloat(m(c, "left")), f = parseFloat(m(c, "top"));
    this._clearFrames();
    let v = 0;
    const g = (a.w - r.w) / 2, w = (a.h - r.h) / 2, y = a.w - g, z = a.h - w, V = () => {
      v++, v < 16 && (this._frames.zoomFrame = requestAnimationFrame(V));
      const x = C(v, o, e - o, 16), N = x / o, M = r.w * x / 100, I = r.h * x / 100;
      let E = -((t.x - p) * N - t.x), S = -((t.y - f) * N - t.y);
      E = Math.min(E, g), S = Math.min(S, w), E + M < y && (E = y - M), S + I < z && (S = z - I), m(c, {
        height: `${I}px`,
        width: `${M}px`,
        left: `${E}px`,
        top: `${S}px`
      }), this._state.zoomValue = x, this._resizeSnapHandle(M, I, E, S), m(d, {
        left: `${(x - 100) * (h || 0) / (u - 100)}px`
      }), this._listeners.onZoomChange && this._listeners.onZoomChange(this._callbackData);
    };
    V();
  };
  _clearFrames = () => {
    const { slideMomentumCheck: e, sliderMomentumFrame: t, zoomFrame: s } = this._frames;
    clearInterval(e), typeof t == "number" && cancelAnimationFrame(t), typeof s == "number" && cancelAnimationFrame(s);
  };
  _resizeSnapHandle = (e, t, s, n) => {
    const { _elements: l, _state: o } = this, { snapHandle: r, image: a } = l, { imageDim: h, containerDim: c, zoomValue: d, snapImageDim: u } = o, p = e || h.w * d / 100, f = t || h.h * d / 100, v = s || parseFloat(m(a, "left")), g = n || parseFloat(m(a, "top")), w = -v * u.w / p, y = -g * u.h / f, z = c.w * u.w / p, V = c.h * u.h / f;
    m(r, {
      top: `${y}px`,
      left: `${w}px`,
      width: `${z}px`,
      height: `${V}px`
    }), this._state.snapHandleDim = {
      w: z,
      h: V
    };
  };
  showSnapView = (e) => {
    const { snapViewVisible: t, zoomValue: s, loaded: n } = this._state, { snapView: l } = this._elements;
    this._options.snapView && (t || s <= 100 || !n || (clearTimeout(this._frames.snapViewTimeout), this._state.snapViewVisible = !0, m(l, { opacity: 1, pointerEvents: "inherit" }), e || (this._frames.snapViewTimeout = setTimeout(this.hideSnapView, 1500))));
  };
  hideSnapView = () => {
    const { snapView: e } = this._elements;
    m(e, { opacity: 0, pointerEvents: "none" }), this._state.snapViewVisible = !1;
  };
  refresh = () => {
    this._calculateDimensions(), this.resetZoom();
  };
  load(e, t) {
    this._images = {
      imageSrc: e,
      hiResImageSrc: t
    }, this._loadImages();
  }
  destroy() {
    const { container: e, domElement: t } = this._elements;
    Object.entries(this._sliders).forEach(([, s]) => {
      s.destroy();
    }), Object.entries(this._events).forEach(([, s]) => {
      s();
    }), this._clearFrames(), L(e.querySelector(".iv-wrap")), F(e, "iv-container"), q(document.querySelector("html"), "relative"), t !== e && R(t), t._imageViewer = null, this._listeners.onDestroy && this._listeners.onDestroy();
  }
  /**
   * Data will be passed to the callback registered with each new instance
   */
  get _callbackData() {
    return {
      container: this._elements.container,
      snapView: this._elements.snapView,
      zoomValue: this._state.zoomValue,
      reachedMin: Math.round(this._state.zoomValue) === this._options.zoomValue,
      reachedMax: Math.round(this._state.zoomValue) === this._options.maxZoom,
      instance: this
    };
  }
}
D.defaults = {
  zoomValue: 100,
  snapView: !0,
  maxZoom: 500,
  refreshOnResize: !0,
  zoomOnMouseWheel: !0,
  hasZoomButtons: !1,
  zoomStep: 50,
  listeners: {
    onInit: null,
    onDestroy: null,
    onImageLoaded: null,
    onZoomChange: null
  }
};
const k = `
  <div class="iv-fullscreen-container"></div>
  <div class="iv-fullscreen-close"></div>
`;
class X extends D {
  constructor(e = {}) {
    const t = b({
      tagName: "div",
      className: "iv-fullscreen",
      html: k,
      parent: document.body
    }), s = t.querySelector(".iv-fullscreen-container");
    super(s, { ...e, refreshOnResize: !1 }), this._elements.fullScreen = t, this._initFullScreenEvents();
  }
  _initFullScreenEvents() {
    const { fullScreen: e } = this._elements, t = e.querySelector(".iv-fullscreen-close");
    this._events.onCloseBtnClick = _(t, "click", this.hide);
  }
  show(e, t) {
    m(this._elements.fullScreen, { display: "block" }), e && this.load(e, t), this._events.onWindowResize = _(window, "resize", this.refresh), m(document.querySelector("html"), { overflow: "hidden" });
  }
  hide = () => {
    m(this._elements.fullScreen, { display: "none" }), q(document.querySelector("html"), "overflow"), this._events.onWindowResize && this._events.onWindowResize();
  };
  destroy() {
    const { fullScreen: e } = this._elements;
    super.destroy(), L(e);
  }
}
export {
  X as FullScreenViewer,
  D as ImageViewer,
  D as default
};
//# sourceMappingURL=iv-viewer-ts.mjs.map
