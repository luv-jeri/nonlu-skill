// Installed before any page script runs. Logs media/audio activity and listener
// registrations so the capture can say WHAT sound exists and WHAT triggers it.
// Kept deliberately light: observation only, no behavior change.
(() => {
  if (window.__scap) return;
  const events = [];
  const push = (type, data) => { if (events.length < 5000) events.push({ t: performance.now(), type, ...data }); };
  window.__scap = { listenerCounts: {}, push };
  window.__scapDrain = () => events.splice(0, events.length);
  window.__scapPeek = () => events.slice();

  // Observe author-created canvas contexts without asking a canvas for a new
  // context during evidence collection (getContext itself can initialize it).
  const canvasContexts = new WeakMap();
  window.__scapCanvasContexts = () => [...document.querySelectorAll('canvas')].map((canvas, index) => ({
    index,
    id: canvas.id?.slice?.(0, 120) || null,
    className: typeof canvas.className === 'string' ? canvas.className.slice(0, 160) : null,
    contextTypes: [...(canvasContexts.get(canvas)?.keys() || [])],
    calls: [...(canvasContexts.get(canvas)?.entries() || [])].map(([contextType, count]) => ({ contextType, count })),
  }));
  try {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext');
    const originalGetContext = descriptor?.value;
    if (typeof originalGetContext === 'function') {
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        ...descriptor,
        value: function (contextType, ...args) {
          const result = originalGetContext.call(this, contextType, ...args);
          if (result) {
            const type = String(contextType || '').toLowerCase();
            let calls = canvasContexts.get(this);
            if (!calls) { calls = new Map(); canvasContexts.set(this, calls); }
            calls.set(type, (calls.get(type) || 0) + 1);
            push('canvas-context-created', { contextType: type, id: this.id?.slice?.(0, 120) || null, className: typeof this.className === 'string' ? this.className.slice(0, 160) : null });
          }
          return result;
        },
      });
    }
  } catch (error) {
    push('canvas-context-observer-unavailable', { reason: String(error).slice(0, 200) });
  }

  // WebGL shader capture. On a canvas site the GLSL is the only readable account of
  // HOW the look is made: the DOM shows nothing, and frames only show the result.
  // shaderSource() hands us the exact source the page compiles, and linkProgram()
  // tells us which vertex/fragment pair belong together plus their active uniforms.
  // Read-only: every hook calls through to the original and returns its value.
  const shaders = new WeakMap();
  const shaderLog = [];
  const programLog = [];
  window.__scapShaders = () => ({ shaders: shaderLog.slice(), programs: programLog.slice() });
  const hookGl = (proto, label) => {
    if (!proto) return;
    const origShaderSource = proto.shaderSource;
    if (typeof origShaderSource === 'function') {
      proto.shaderSource = function (shader, source) {
        try {
          if (shaderLog.length < 200 && typeof source === 'string') {
            const kind = this.getShaderParameter(shader, this.SHADER_TYPE) === this.VERTEX_SHADER ? 'vertex' : 'fragment';
            const entry = { index: shaderLog.length, api: label, kind, length: source.length, source: source.slice(0, 60000) };
            shaders.set(shader, entry);
            shaderLog.push(entry);
            push('shader-source', { api: label, kind, length: source.length });
          }
        } catch (error) { push('shader-capture-error', { reason: String(error).slice(0, 200) }); }
        return origShaderSource.apply(this, arguments);
      };
    }
    const origLink = proto.linkProgram;
    if (typeof origLink === 'function') {
      proto.linkProgram = function (program) {
        const result = origLink.apply(this, arguments);
        try {
          if (programLog.length < 100) {
            const attached = this.getAttachedShaders(program) || [];
            const parts = attached.map((s) => shaders.get(s)).filter(Boolean).map((e) => ({ kind: e.kind, index: e.index }));
            const count = (p) => this.getProgramParameter(program, p) || 0;
            const uniforms = [];
            for (let i = 0; i < Math.min(count(this.ACTIVE_UNIFORMS), 120); i += 1) {
              const info = this.getActiveUniform(program, i);
              if (info) uniforms.push({ name: String(info.name).slice(0, 80), size: info.size });
            }
            const attributes = [];
            for (let i = 0; i < Math.min(count(this.ACTIVE_ATTRIBUTES), 60); i += 1) {
              const info = this.getActiveAttrib(program, i);
              if (info) attributes.push(String(info.name).slice(0, 80));
            }
            programLog.push({ index: programLog.length, api: label, shaders: parts, uniforms, attributes });
            push('shader-program-linked', { api: label, uniforms: uniforms.length, attributes: attributes.length });
          }
        } catch (error) { push('shader-program-error', { reason: String(error).slice(0, 200) }); }
        return result;
      };
    }
  };
  try {
    hookGl(window.WebGLRenderingContext?.prototype, 'webgl');
    hookGl(window.WebGL2RenderingContext?.prototype, 'webgl2');
  } catch (error) { push('shader-hook-unavailable', { reason: String(error).slice(0, 200) }); }

  for (const type of ['transitionrun', 'transitionstart', 'transitionend', 'transitioncancel', 'animationstart', 'animationiteration', 'animationend', 'animationcancel']) {
    document.addEventListener(type, (event) => push(type, {
      tag: event.target?.tagName?.toLowerCase?.() || null,
      id: event.target?.id?.slice?.(0, 120) || null,
      className: typeof event.target?.className === 'string' ? event.target.className.slice(0, 160) : null,
      propertyName: event.propertyName || null,
      animationName: event.animationName || null,
      elapsedTime: event.elapsedTime ?? null,
      pseudoElement: event.pseudoElement || null,
    }), true);
  }

  if (window.CSS && typeof window.CSS.registerProperty === 'function') {
    const originalRegisterProperty = window.CSS.registerProperty.bind(window.CSS);
    window.CSS.registerProperty = function (definition) {
      push('css-register-property', {
        name: typeof definition?.name === 'string' ? definition.name.slice(0, 160) : null,
        syntax: typeof definition?.syntax === 'string' ? definition.syntax.slice(0, 300) : null,
        inherits: typeof definition?.inherits === 'boolean' ? definition.inherits : null,
        initialValue: typeof definition?.initialValue === 'string' ? definition.initialValue.slice(0, 300) : null,
      });
      return originalRegisterProperty(definition);
    };
  }

  if (typeof document.startViewTransition === 'function') {
    const originalStartViewTransition = document.startViewTransition.bind(document);
    document.startViewTransition = function (...args) {
      push('view-transition-start', { callback: typeof args[0] === 'function' ? { kind: 'function', name: args[0].name || null } : null });
      const transition = originalStartViewTransition(...args);
      transition?.ready?.then?.(() => push('view-transition-ready', {}), (error) => push('view-transition-ready-error', { reason: String(error).slice(0, 200) }));
      transition?.finished?.then?.(() => push('view-transition-finished', {}), (error) => push('view-transition-finished-error', { reason: String(error).slice(0, 200) }));
      return transition;
    };
  }

  const mediaProto = HTMLMediaElement.prototype;
  for (const m of ['play', 'pause']) {
    const orig = mediaProto[m];
    mediaProto[m] = function (...a) {
      push('media-' + m, { src: (this.currentSrc || this.src || '').slice(0, 300), muted: this.muted, tag: this.tagName.toLowerCase() });
      return orig.apply(this, a);
    };
  }

  if (window.AudioContext) {
    const OrigAC = window.AudioContext;
    window.AudioContext = function (...a) {
      const ctx = new OrigAC(...a);
      push('audiocontext-created', { state: ctx.state });
      ctx.addEventListener('statechange', () => push('audiocontext-state', { state: ctx.state }));
      return ctx;
    };
    window.AudioContext.prototype = OrigAC.prototype;
  }

  const origAdd = EventTarget.prototype.addEventListener;
  const counted = ['pointerenter', 'pointerover', 'mouseenter', 'mouseover', 'click', 'wheel', 'touchstart', 'keydown', 'scroll'];
  const interactiveListenerTypes = new WeakMap();
  const interactiveListenerTargets = new Set();
  window.__scapHasInteractiveListener = (element) => interactiveListenerTypes.has(element);
  window.__scapListenerTypesFor = (element) => [...(interactiveListenerTypes.get(element) || [])];
  EventTarget.prototype.addEventListener = function (type, ...a) {
    if (counted.includes(type)) window.__scap.listenerCounts[type] = (window.__scap.listenerCounts[type] || 0) + 1;
    if (this?.nodeType === 1 && ['pointerenter', 'pointerover', 'mouseenter', 'mouseover', 'click', 'touchstart', 'keydown'].includes(type) && interactiveListenerTargets.size < 2000) {
      let types = interactiveListenerTypes.get(this);
      if (!types) { types = new Set(); interactiveListenerTypes.set(this, types); interactiveListenerTargets.add(this); }
      types.add(type);
    }
    return origAdd.call(this, type, ...a);
  };
})();
