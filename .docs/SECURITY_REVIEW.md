# Security Vulnerability & Code Quality Analysis Report

**Project:** iv-viewer-ts
**Date:** 2025-11-23
**Total Issues Found:** 25

## Executive Summary

This comprehensive security and code quality review identified **3 critical security vulnerabilities** that require immediate attention, **6 high-priority issues** including memory leaks and type safety problems, and **16 medium-to-low priority improvements**.

### Critical Findings

- **XSS Vulnerability via Image URLs** - Allows arbitrary JavaScript execution
- **XSS Vulnerability via innerHTML** - Direct HTML injection risk
- **Broken URL Encoding** - Incorrect implementation breaks functionality

---

## Critical Issues (P0) - Must Fix Immediately

### P0-1: XSS Vulnerability via innerHTML Injection

**File:** `src/util.ts:67`
**Severity:** 🔴 CRITICAL

**Problem:**

```typescript
if (options.html) elem.innerHTML = options.html;
```

The `createElement` function sets `innerHTML` without sanitization. If user-controlled data flows into this parameter, it enables XSS attacks.

**Impact:** Arbitrary JavaScript execution if user data reaches this code path

**Recommendation:**

```typescript
// Option 1: Remove innerHTML support (recommended)
if (options.html) {
  console.warn('innerHTML is not supported for security reasons');
}

// Option 2: Use textContent for text-only
if (options.text) {
  elem.textContent = options.text;
}

// Option 3: Integrate DOMPurify
if (options.html) {
  elem.innerHTML = DOMPurify.sanitize(options.html);
}
```

---

### P0-2: XSS Vulnerability via Malicious Image URLs

**File:** `src/ImageViewer.ts:751, 759, 826`
**Severity:** 🔴 CRITICAL

**Problem:**

```typescript
(image as HTMLImageElement).src = String(imageSrc);
```

Image sources are set without protocol validation, allowing `javascript:`, `data:text/html`, and other malicious URLs.

**Attack Vector:**

```javascript
const viewer = new ImageViewer(element);
viewer.load('javascript:alert(document.cookie)', null);
// or
viewer.load('data:text/html,<script>alert(1)</script>', null);
```

**Impact:** Complete XSS compromise with arbitrary JavaScript execution

**Recommendation:**

```typescript
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url, window.location.href);
    const allowedProtocols = ['http:', 'https:', 'blob:'];
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Before setting src:
if (!isValidImageUrl(imageSrc)) {
  throw new Error('Invalid image URL protocol');
}
(image as HTMLImageElement).src = imageSrc;
```

---

### P0-3: Incorrect URL Encoding

**File:** `src/util.ts:69-72`
**Severity:** 🔴 HIGH

**Problem:**

```typescript
if (options.src && elem instanceof HTMLImageElement) {
  const escapedSrc = encodeURIComponent(options.src);
  elem.setAttribute('src', escapedSrc);
}
```

Using `encodeURIComponent` on complete URLs breaks valid URLs and doesn't provide XSS protection.

**Impact:**

- Valid URLs like `https://example.com/image.jpg` become `https%3A%2F%2Fexample.com%2Fimage.jpg` (broken)
- Images fail to load
- Still vulnerable to XSS

**Recommendation:**

```typescript
if (options.src && elem instanceof HTMLImageElement) {
  if (!isValidImageUrl(options.src)) {
    throw new Error('Invalid image source URL');
  }
  elem.setAttribute('src', options.src);
}
```

---

## High Priority Issues (P1)

### P1-1: Memory Leak - Uncleaned Event Listener

**File:** `src/ImageViewer.ts:716`
**Severity:** 🟠 HIGH

**Problem:**

```typescript
assignEvent(imageWrap, 'click', onDoubleTap); // Not stored in this._events!
```

Event listener not stored, never removed in `destroy()`.

**Fix:**

```typescript
this._events.doubleTapClick = assignEvent(imageWrap, 'click', onDoubleTap);
```

---

### P1-2: Memory Leak - snapViewTimeout Not Cleared

**File:** `src/ImageViewer.ts:1119`
**Severity:** 🟠 HIGH

**Problem:**
`_clearFrames()` doesn't clear `snapViewTimeout`.

**Fix:**

```typescript
_clearFrames(): void {
  const { slideMomentumCheck, sliderMomentumFrame, zoomFrame, snapViewTimeout } = this._frames;

  if (slideMomentumCheck) clearInterval(slideMomentumCheck);
  if (typeof sliderMomentumFrame === 'number') cancelAnimationFrame(sliderMomentumFrame);
  if (typeof zoomFrame === 'number') cancelAnimationFrame(zoomFrame);
  if (typeof snapViewTimeout === 'number') clearTimeout(snapViewTimeout);
}
```

---

### P1-3: Unsafe Non-null Assertions

**File:** `src/Slider.ts:52, 60`
**Severity:** 🟠 MEDIUM-HIGH

**Problem:**

```typescript
public onStart(event?: Event, position?: { x: number; y: number }) {
  return this._onStart(event!, position!);  // Unsafe!
}
```

**Fix:**

```typescript
public onStart(event?: Event, position?: { x: number; y: number }) {
  if (!event || !position) {
    console.warn('onStart called without required parameters');
    return;
  }
  return this._onStart(event, position);
}
```

---

### P1-4: URL Reading Without Validation ✅ FIXED

**File:** `src/ImageViewer.ts:197-199, 214-216`
**Severity:** 🟠 MEDIUM-HIGH
**Status:** ✅ **COMPLETED**

URLs read from HTML attributes without validation.

**Fix Applied:**

```typescript
const rawSrc =
  imgElement.getAttribute('high-res-src') || imgElement.getAttribute('data-high-res-src');
hiResImageSrc = isValidImageUrl(rawSrc) ? rawSrc : undefined;
```

All URLs from attributes are now validated using `isValidImageUrl()` before use.

---

### P1-5: CSS Injection Risk

**File:** `src/util.ts:174-176`
**Severity:** 🟠 MEDIUM

Unvalidated CSS property values could allow CSS injection attacks.

**Fix:**

```typescript
Object.keys(properties).forEach((key: string) => {
  const value = properties[key];
  const sanitizedValue = String(value).replace(/[<>'"]/g, '');
  element.style.setProperty(key, sanitizedValue);
});
```

---

### P1-6: Race Condition on Image Load

**File:** `src/ImageViewer.ts:731-811`
**Severity:** 🟠 MEDIUM-HIGH

Multiple `load()` calls can create race conditions.

**Fix:**

```typescript
_loadImages() {
  // Cancel previous load operations
  if (this._events.imageLoad) this._events.imageLoad();
  if (this._events.imageError) this._events.imageError();
  if (this._events.hiResImageLoad) this._events.hiResImageLoad();

  const loadId = ++this._loadCounter;

  const onImageLoad = () => {
    if (loadId !== this._loadCounter) return; // Ignore superseded loads
    // ... rest of code
  };
}
```

---

## Medium Priority Issues (P2)

### P2-1: Deprecated API Usage

**File:** `src/ImageViewer.ts:485, 589-590, 664-665`

Replace `document.body.scrollLeft/scrollTop` with `window.pageXOffset/pageYOffset`.

### P2-2: TypeScript @ts-ignore

**File:** `src/ImageViewer.ts:647-648`

Remove `@ts-ignore` and properly type wheel event properties.

### P2-3: Redundant Code

**File:** `src/ImageViewer.ts:664`

Fix redundant OR: `e.pageX || e.pageX` → `e.pageX`

### P2-4: setInterval in Animation

**File:** `src/ImageViewer.ts:328`

Replace `setInterval` with `requestAnimationFrame` for better performance.

### P2-5: Unconditional preventDefault

**File:** `src/Slider.ts:73, 121`

Only call `preventDefault()` on cancelable events.

### P2-6: Potential Division by Zero

**File:** `src/ImageViewer.ts:345-346, 374-377`

Add zero checks before division operations.

### P2-7: Type Casting Without Null Check

**File:** `src/ImageViewer.ts:417-418, 486, 859-863`

Check for undefined before parsing: `parseFloat(value || '0')`

---

## Low Priority Issues (P3)

### P3-1: Non-null Assertions in Callbacks

Add proper null checking in `_callbackData` getter.

### P3-2: Complex Regex

Simplify className manipulation in `removeClass()`.

### P3-3: Style Property Removal

Fix incorrect `removeCss()` usage with 'relative'.

### P3-4: Missing Error Handling

Add try-catch blocks around critical operations.

### P3-5: Inconsistent Null Checking

Establish consistent null checking patterns.

---

## Logic Bugs

### BUG-1: Snap Handle Boundary Logic

**File:** `src/ImageViewer.ts:434-437`

Questionable min/max logic for snap handle positioning.

### BUG-2: Duplicate Style Assignment

**File:** `src/ImageViewer.ts:828, 832-834`

High-res image styles set twice unnecessarily.

---

## Summary Statistics

| Priority      | Count  | Category                            |
| ------------- | ------ | ----------------------------------- |
| P0 (Critical) | 3      | Security Vulnerabilities            |
| P1 (High)     | 6      | Memory Leaks, Type Safety, Security |
| P2 (Medium)   | 7      | Code Quality, Performance           |
| P3 (Low)      | 5      | Optional Improvements               |
| Bugs          | 2      | Logic Errors                        |
| **Total**     | **23** | **All Issues**                      |

---

## Immediate Action Plan

1. ✅ **Fix P0-2**: Add URL protocol validation - **COMPLETED**
2. ✅ **Fix P0-1**: Remove/sanitize innerHTML usage - **COMPLETED**
3. ✅ **Fix P0-3**: Remove incorrect URL encoding - **COMPLETED**
4. ✅ **Fix P1-1 & P1-2**: Memory leak fixes - **COMPLETED**
5. ✅ **Fix P1-3**: Remove unsafe assertions - **COMPLETED**
6. ✅ **Fix P1-4**: Validate attribute URLs - **COMPLETED**
7. ✅ **Fix P1-5**: CSS Injection Risk - **COMPLETED**
8. ✅ **Fix P1-6**: Race Condition on Image Load - **COMPLETED**
9. ✅ **Fix P2-1**: Replace deprecated APIs - **COMPLETED**
10. ✅ **Fix P2-2**: Remove @ts-ignore - **COMPLETED**
11. ✅ **Fix P2-3**: Remove duplicate code - **COMPLETED**
12. ✅ **Fix P2-4**: Use requestAnimationFrame - **COMPLETED**
13. ✅ **Fix P2-5**: Conditional preventDefault - **COMPLETED**
14. ✅ **Fix P2-6**: Division by zero prevention - **COMPLETED**
15. ✅ **Fix P2-7**: Add null checks - **COMPLETED**
16. ✅ **Fix BUG-2**: Remove duplicate style assignment - **COMPLETED**
17. ✅ **Fix P3-1**: Non-null assertions in callbacks - **COMPLETED**
18. ✅ **Fix P3-2**: Simplify complex regex - **COMPLETED**
19. ✅ **Fix P3-3**: Fix style property removal - **COMPLETED**
20. ✅ **Fix P3-4**: Add error handling - **COMPLETED**
21. ✅ **Fix P3-5**: Consistent null checking - **COMPLETED**
22. ✅ **Fix BUG-1**: Snap handle boundary logic - **COMPLETED**

**Status: 23/23 issues resolved (100% complete) 🎉**
**Remaining: None - All issues fixed!**

---

## Security Recommendations

1. **Content Security Policy**: Implement CSP headers to block inline scripts
2. **URL Allowlist**: Add option to restrict image sources to specific domains
3. **Input Validation**: Validate all user inputs at API boundaries
4. **Sanitization Library**: Consider DOMPurify for HTML sanitization
5. **Security Testing**: Add automated security tests
6. **Documentation**: Add security best practices to README

---

## Testing Recommendations

1. Add unit tests for URL validation
2. Add XSS attack vector tests
3. Add memory leak detection tests
4. Add race condition tests
5. Add fuzzing tests for edge cases

---

**Report Generated:** 2025-11-23
**Reviewed By:** Automated Security Analysis
