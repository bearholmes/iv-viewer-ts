const D = new Function();
function C(i, e, t, s) {
  return i /= s, i -= 1, -t * (i * i * i * i - 1) + e;
}
function b(i) {
  const e = document.createElement(i.tagName);
  if (i.id && (e.id = i.id), i.html && (e.innerHTML = i.html), i.className && (e.className = i.className), i.src && e instanceof HTMLImageElement) {
    const t = encodeURIComponent(i.src);
    e.setAttribute("src", t);
  }
  return i.style && (e.style.cssText = i.style), i.child && e.appendChild(i.child), i.insertBefore ? i.parent.insertBefore(e, i.insertBefore) : i.parent.appendChild(e), e;
}
function Z(i, e) {
  const t = e.split(" ");
  t.length > 1 ? t.forEach((s) => Z(i, s)) : i.classList ? i.classList.add(e) : i.className += ` ${e}`;
}
function F(i, e) {
  const t = e.split(" ");
  t.length > 1 ? t.forEach((s) => F(i, s)) : i.classList ? i.classList.remove(e) : i.className = i.className.replace(
    new RegExp(`(^|\\b)${e.split(" ").join("|")}(\\b|$)`, "gi"),
    " "
  );
}
function A(i) {
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
function R(i, { tag: e = "div", className: t, id: s, style: n }) {
  const r = document.createElement(e);
  t && (r.className = t), s && (r.id = s), n && (n.display && (r.style.display = n.display), n.overflow && (r.style.overflow = n.overflow));
  const o = i.parentNode;
  if (!o)
    throw new Error("element does not have a parent node");
  return o.insertBefore(r, i), o.removeChild(i), r.appendChild(i), r;
}
function B(i) {
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
function O(i) {
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
    isSliderEnabled: r
  }) {
    this.container = e, this.isSliderEnabled = r, this.onStart = t || D, this.onMove = s || D, this.onEnd = n || D;
  }
  startHandler = (e) => {
    if (!this.isSliderEnabled())
      return;
    this.removeListeners(), e.preventDefault();
    const { moveHandler: t, endHandler: s, onStart: n } = this, r = e.type === "touchstart" || e.type === "touchend";
    let o, l;
    if (r) {
      const a = e;
      this.touchMoveEvent = "touchmove", this.touchEndEvent = "touchend", o = a.touches[0].clientX, l = a.touches[0].clientY;
    } else {
      const a = e;
      this.touchMoveEvent = "mousemove", this.touchEndEvent = "mouseup", o = a.clientX, l = a.clientY;
    }
    this.sx = o, this.sy = l, n(e, {
      x: this.sx,
      y: this.sy
    }), document.addEventListener(this.touchMoveEvent, t), document.addEventListener(this.touchEndEvent, s), document.addEventListener("contextmenu", s);
  };
  moveHandler = (e) => {
    if (!this.isSliderEnabled())
      return;
    e.preventDefault();
    const { sx: t, sy: s, onMove: n } = this, r = this.touchMoveEvent === "touchmove";
    let o, l;
    if (r) {
      const a = e;
      o = a.touches[0].clientX, l = a.touches[0].clientY;
    } else {
      const a = e;
      o = a.clientX, l = a.clientY;
    }
    n(e, {
      dx: o - t,
      dy: l - s,
      mx: o,
      my: l
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
class H {
  static defaults;
  static FullScreenViewer;
  _ev;
  _elements;
  _events;
  _options;
  _listeners;
  _state;
  _sliders;
  _frames;
  _images;
  constructor(e, t = {}) {
    const { container: s, domElement: n, imageSrc: r, hiResImageSrc: o } = this._findContainerAndImageSrc(e);
    this._elements = {
      container: s,
      domElement: n
    }, this._options = { ...H.defaults, ...t }, this._events = {}, this._listeners = this._options.listeners || {}, this._frames = {}, this._sliders = {}, this._state = {
      zoomValue: this._options.zoomValue
    }, this._images = {
      imageSrc: r,
      hiResImageSrc: o
    }, this._init(), r && this._loadImages(), n._imageViewer = this;
  }
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
  _findContainerAndImageSrc(e) {
    let t = e, s, n;
    if (typeof e == "string" && (t = document.querySelector(e)), t._imageViewer)
      throw new Error("An image viewer is already being initiated on the element.");
    let r = e;
    return t.tagName === "IMG" ? (s = t.src, n = t.getAttribute("high-res-src") || t.getAttribute("data-high-res-src"), r = R(t, {
      className: "iv-container iv-image-mode",
      style: { display: "inline-block", overflow: "hidden" }
    }), m(t, {
      opacity: 0,
      position: "relative",
      zIndex: -1
    })) : (s = t.getAttribute("src") || t.getAttribute("data-src"), n = t.getAttribute("high-res-src") || t.getAttribute("data-high-res-src")), {
      container: r,
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
    }), Z(e, "iv-container"), m(e, "position") === "static" && m(e, { position: "relative" }), this._elements = {
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
    const r = new T(t, {
      isSliderEnabled: () => {
        const { loaded: o, zooming: l, zoomValue: a } = this._state;
        return o && !l && a > 100;
      },
      onStart: (o, l) => {
        const { snapSlider: a } = this._sliders;
        this._clearFrames(), a.onStart(), s = [l, l], n = void 0, this._frames.slideMomentumCheck = setInterval(() => {
          n && (s.shift(), s.push({
            x: n.mx,
            y: n.my
          }));
        }, 50);
      },
      onMove: (o, l) => {
        const { snapImageDim: a } = this._state, { snapSlider: h } = this._sliders, c = this._getImageCurrentDim();
        n = l, h.onMove(o, {
          dx: -l.dx * a.w / c.w,
          dy: -l.dy * a.h / c.h
        });
      },
      onEnd: () => {
        const { snapImageDim: o } = this._state, { snapSlider: l } = this._sliders, a = this._getImageCurrentDim();
        this._clearFrames();
        let h, c, u;
        const d = s[1].x - s[0].x, g = s[1].y - s[0].y, v = () => {
          h <= 60 && (this._frames.sliderMomentumFrame = requestAnimationFrame(v)), c += C(h, d / 3, -d / 3, 60), u += C(h, g / 3, -g / 3, 60), l.onMove(null, {
            dx: -(c * o.w / a.w),
            dy: -(u * o.h / a.h)
          }), h++;
        };
        (Math.abs(d) > 30 || Math.abs(g) > 30) && (h = 1, c = n.dx, u = n.dy, v());
      }
    });
    r.init(), this._sliders.imageSlider = r;
  }
  _initSnapSlider() {
    const {
      snapHandle: e
    } = this._elements;
    let t, s;
    const n = new T(e, {
      isSliderEnabled: () => this._state.loaded,
      onStart: () => {
        const { slideMomentumCheck: r, sliderMomentumFrame: o } = this._frames;
        t = parseFloat(m(e, "top")), s = parseFloat(m(e, "left")), clearInterval(r), typeof o == "number" && cancelAnimationFrame(o);
      },
      onMove: (r, o) => {
        const { snapHandleDim: l, snapImageDim: a } = this._state, { image: h } = this._elements, c = this._getImageCurrentDim();
        if (!l)
          return;
        const u = Math.max(a.w - l.w, s), d = Math.max(a.h - l.h, t), g = Math.min(0, s), v = Math.min(0, t), p = W(s + o.dx, g, u), f = W(t + o.dy, v, d), w = -p * c.w / a.w, y = -f * c.h / a.h;
        m(e, {
          left: `${p}px`,
          top: `${f}px`
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
    let n, r;
    const o = new T(s, {
      isSliderEnabled: () => this._state.loaded,
      onStart: (l) => {
        const { zoomSlider: a } = this._sliders;
        n = s.getBoundingClientRect().left + document.body.scrollLeft, r = parseInt(m(t, "width"), 10), a.onMove(l);
      },
      onMove: (l) => {
        const { maxZoom: a } = this._options, { zoomSliderLength: h } = this._state, c = l.pageX !== void 0 ? l.pageX : l.touches[0].pageX;
        if (!h)
          return;
        const u = W(c - n - r / 2, 0, h), d = 100 + (a - 100) * u / h;
        this.zoom(d);
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
      const { loaded: r, zoomValue: o } = this._state, { _events: l } = this;
      if (!r)
        return;
      const a = n.touches[0], h = n.touches[1];
      if (!(a && h))
        return;
      this._state.zooming = !0;
      const c = t.getBoundingClientRect(), u = O(n.touches), d = {
        x: (h.pageX + a.pageX) / 2 - (c.left + document.body.scrollLeft),
        y: (h.pageY + a.pageY) / 2 - (c.top + document.body.scrollTop)
      }, g = (p) => {
        const f = O(p.touches), w = o + (f - u) / 2;
        this.zoom(w, d);
      }, v = (p) => {
        l.pinchMove && l.pinchMove(), l.pinchEnd && l.pinchEnd(), this._state.zooming = !1, p.touches.length === 1 && this._sliders.imageSlider.startHandler(p);
      };
      l.pinchMove && l.pinchMove(), l.pinchEnd && l.pinchEnd(), l.pinchMove = _(document, "touchmove", g), l.pinchEnd = _(document, "touchend", v);
    };
    this._events.pinchStart = _(e, "touchstart", s);
  }
  _scrollZoom() {
    const { _options: e } = this, { container: t, imageWrap: s } = this._elements;
    let n = 0;
    const r = (o) => {
      const { loaded: l, zoomValue: a } = this._state;
      if (!e.zoomOnMouseWheel || !l)
        return;
      this._clearFrames();
      const h = Math.max(-1, Math.min(1, o.wheelDelta || -o.detail || -o.deltaY)), c = a * (100 + h * 15) / 100;
      if (c >= 100 && c <= e.maxZoom ? n = 0 : n += Math.abs(h), o.preventDefault(), n > 5)
        return;
      const u = t.getBoundingClientRect(), d = (o.pageX || o.pageX) - (u.left + document.body.scrollLeft), g = (o.pageY || o.pageY) - (u.top + document.body.scrollTop);
      this.zoom(c, {
        x: d,
        y: g
      }), this.showSnapView();
    };
    this._ev = _(s, "wheel", r);
  }
  _doubleTapToZoom() {
    const { imageWrap: e } = this._elements;
    let t = 0, s;
    _(e, "click", (r) => {
      t === 0 ? (t = Date.now(), s = {
        x: r.pageX,
        y: r.pageY
      }) : (Date.now() - t < 500 && Math.abs(r.pageX - s.x) < 50 && Math.abs(r.pageY - s.y) < 50 && (this._state.zoomValue === this._options.zoomValue ? this.zoom(200) : this.resetZoom()), t = 0);
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
    const { _images: e, _elements: t } = this, { imageSrc: s, hiResImageSrc: n } = e, { container: r, snapImageWrap: o, imageWrap: l } = t, a = r.querySelector(".iv-loader");
    L(r.querySelectorAll(".iv-snap-image, .iv-image"));
    const h = b({
      tagName: "img",
      className: "iv-snap-image",
      insertBefore: o.firstChild,
      parent: o
    });
    h.src = String(s);
    const c = b({
      tagName: "img",
      className: "iv-image iv-small-image",
      parent: l
    });
    c.src = String(s), this._state.loaded = !1, this._elements.image = c, this._elements.snapImage = h, m(a, { display: "block" }), m(c, { visibility: "hidden" }), this.hideSnapView();
    const u = () => {
      m(a, { display: "none" }), m(c, { visibility: "visible" }), n && this._loadHighResImage(n), this._state.loaded = !0, this._calculateDimensions(), console.log(this._listeners.onImageLoaded, "this._listeners.onImageLoaded"), this._listeners.onImageLoaded && this._listeners.onImageLoaded(this._callbackData), this.resetZoom();
    }, d = (g) => {
      console.log(g, "error", this._listeners.onImageError), m(a, { display: "none" }), this._listeners.onImageError && this._listeners.onImageError(g);
    };
    A(c) ? u() : (this._events.imageLoad = _(c, "load", u), this._events.imageError = _(c, "error", d));
  }
  _loadHighResImage(e) {
    const { imageWrap: t, container: s } = this._elements, n = this._elements.image, r = b({
      tagName: "img",
      className: "iv-image iv-large-image",
      src: e,
      parent: t,
      style: n.style.cssText
    });
    r.style.cssText = n.style.cssText, this._elements.image = s.querySelectorAll(".iv-image");
    const o = () => {
      L(n), this._elements.image = r;
    };
    A(r) ? o() : this._events.hiResImageLoad = _(r, "load", o);
  }
  _calculateDimensions() {
    const { image: e, container: t, snapView: s, snapImage: n, zoomHandle: r } = this._elements, o = parseInt(m(e, "width"), 10), l = parseInt(m(e, "height"), 10), a = parseInt(m(t, "width"), 10), h = parseInt(m(t, "height"), 10), c = s.clientWidth, u = s.clientHeight;
    this._state.containerDim = {
      w: a,
      h
    };
    const d = e.naturalWidth || o, g = e.naturalHeight || l, v = d / g, p = d > g && h >= a || v * h > a ? a : v * h, f = p / v;
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
    const w = p > f ? c : p * u / f, y = f > p ? u : f * c / p;
    this._state.snapImageDim = {
      w,
      h: y
    }, m(n, {
      width: `${w}px`,
      height: `${y}px`
    });
    const E = s.querySelector(".iv-zoom-slider").clientWidth;
    this._state.zoomSliderLength = E - r.offsetWidth;
  }
  resetZoom(e = !0) {
    const { zoomValue: t } = this._options;
    e || (this._state.zoomValue = t), this.zoom(t);
  }
  zoom = (e, t) => {
    const { _options: s, _elements: n, _state: r } = this, { zoomValue: o, imageDim: l, containerDim: a, zoomSliderLength: h } = r, { image: c, zoomHandle: u } = n, { maxZoom: d } = s;
    e = Math.round(Math.max(100, e)), e = Math.min(d, e), t = t || {
      x: a.w / 2,
      y: a.h / 2
    };
    const g = parseFloat(m(c, "left")), v = parseFloat(m(c, "top"));
    this._clearFrames();
    let p = 0;
    const f = (a.w - l.w) / 2, w = (a.h - l.h) / 2, y = a.w - f, E = a.h - w, V = () => {
      p++, p < 16 && (this._frames.zoomFrame = requestAnimationFrame(V));
      const x = C(p, o, e - o, 16), N = x / o, M = l.w * x / 100, I = l.h * x / 100;
      let S = -((t.x - g) * N - t.x), z = -((t.y - v) * N - t.y);
      S = Math.min(S, f), z = Math.min(z, w), S + M < y && (S = y - M), z + I < E && (z = E - I), m(c, {
        height: `${I}px`,
        width: `${M}px`,
        left: `${S}px`,
        top: `${z}px`
      }), this._state.zoomValue = x, this._resizeSnapHandle(M, I, S, z), m(u, {
        left: `${(x - 100) * (h || 0) / (d - 100)}px`
      }), this._listeners.onZoomChange && this._listeners.onZoomChange(this._callbackData);
    };
    V();
  };
  _clearFrames = () => {
    const { slideMomentumCheck: e, sliderMomentumFrame: t, zoomFrame: s } = this._frames;
    clearInterval(e), typeof t == "number" && cancelAnimationFrame(t), typeof s == "number" && cancelAnimationFrame(s);
  };
  _resizeSnapHandle = (e, t, s, n) => {
    const { _elements: r, _state: o } = this, { snapHandle: l, image: a } = r, { imageDim: h, containerDim: c, zoomValue: u, snapImageDim: d } = o, g = e || h.w * u / 100, v = t || h.h * u / 100, p = s || parseFloat(m(a, "left")), f = n || parseFloat(m(a, "top")), w = -p * d.w / g, y = -f * d.h / v, E = c.w * d.w / g, V = c.h * d.h / v;
    m(l, {
      top: `${y}px`,
      left: `${w}px`,
      width: `${E}px`,
      height: `${V}px`
    }), this._state.snapHandleDim = {
      w: E,
      h: V
    };
  };
  showSnapView = (e) => {
    const { snapViewVisible: t, zoomValue: s, loaded: n } = this._state, { snapView: r } = this._elements;
    this._options.snapView && (t || s <= 100 || !n || (clearTimeout(this._frames.snapViewTimeout), this._state.snapViewVisible = !0, m(r, { opacity: 1, pointerEvents: "inherit" }), e || (this._frames.snapViewTimeout = setTimeout(this.hideSnapView, 1500))));
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
    }), this._clearFrames(), L(e.querySelector(".iv-wrap")), F(e, "iv-container"), q(document.querySelector("html"), "relative"), t !== e && B(t), t._imageViewer = null, this._listeners.onDestroy && this._listeners.onDestroy();
  }
}
H.defaults = {
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
    onZoomChange: null,
    onImageError: null
  }
};
const k = `
  <div class="iv-fullscreen-container"></div>
  <div class="iv-fullscreen-close"></div>
`;
class X extends H {
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
  H as ImageViewer,
  H as default
};
//# sourceMappingURL=iv-viewer-ts.mjs.map
