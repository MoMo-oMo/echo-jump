import { ref, onMounted, onUnmounted } from "vue";

// Vendor-prefixed Fullscreen API access. Safari (desktop + iPadOS) still
// needs the webkit-prefixed names; iPhone Safari has neither — it only
// supports fullscreen on <video> elements, not arbitrary containers, so
// isSupported() correctly comes back false there and callers should just
// hide/disable fullscreen UI rather than call enter().
function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}

function requestFullscreen(el) {
  const request =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;
  if (!request) return Promise.reject(new Error("Fullscreen API unsupported"));
  return request.call(el);
}

function exitFullscreenApi() {
  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;
  if (!exit) return Promise.reject(new Error("Fullscreen API unsupported"));
  return exit.call(document);
}

export function isFullscreenSupported() {
  const el = document.documentElement;
  return !!(
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  );
}

// Single shared reactive fullscreen state — App.vue creates one instance and
// provides it, other components inject it, so there's only one set of
// fullscreenchange listeners and everyone reads/drives the same state.
export function useFullscreen() {
  const isFullscreen = ref(!!getFullscreenElement());
  const isSupported = isFullscreenSupported();

  function sync() {
    isFullscreen.value = !!getFullscreenElement();
  }

  // Best-effort: browsers require this to originate from a direct user
  // gesture (click/tap). Called from a trusted click handler it works;
  // called from a resize/orientationchange handler it will often be
  // silently rejected (NotAllowedError) since that isn't a user gesture —
  // that's expected, not a bug, so failures are swallowed rather than
  // surfaced as an error to the player.
  async function enter() {
    if (!isSupported || getFullscreenElement()) return;
    try {
      await requestFullscreen(document.documentElement);
    } catch {
      // Blocked (no active user gesture) or unsupported — ignore.
    }
  }

  async function exit() {
    if (!getFullscreenElement()) return;
    try {
      await exitFullscreenApi();
    } catch {
      // Ignore — nothing meaningful to recover from here.
    }
  }

  async function toggle() {
    if (getFullscreenElement()) await exit();
    else await enter();
  }

  onMounted(() => {
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    document.addEventListener("mozfullscreenchange", sync);
    document.addEventListener("MSFullscreenChange", sync);
  });

  onUnmounted(() => {
    document.removeEventListener("fullscreenchange", sync);
    document.removeEventListener("webkitfullscreenchange", sync);
    document.removeEventListener("mozfullscreenchange", sync);
    document.removeEventListener("MSFullscreenChange", sync);
  });

  return { isFullscreen, isSupported, enter, exit, toggle };
}
