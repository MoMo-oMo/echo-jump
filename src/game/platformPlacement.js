// Shared placement helpers for snapping gameplay entities to platforms.

export function findPlatformAt(platforms, x, y, tolerance = 80) {
  let bestMatch = null;
  let bestDistance = Infinity;

  for (const platform of platforms) {
    const withinXBounds =
      x >= platform.x - tolerance && x <= platform.x + platform.width + tolerance;
    const withinYBounds =
      y >= platform.y - tolerance &&
      y <= platform.y + platform.height + tolerance;

    if (!withinXBounds || !withinYBounds) {
      continue;
    }

    const onSurface =
      y >= platform.y - 50 &&
      y <= platform.y + 20 &&
      x >= platform.x - 20 &&
      x <= platform.x + platform.width + 20;

    if (!onSurface) {
      continue;
    }

    const platformCenterX = platform.x + platform.width / 2;
    const platformCenterY = platform.y;
    const distance = Math.hypot(x - platformCenterX, y - platformCenterY);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = platform;
    }
  }

  return bestMatch;
}

export function snapToPlatformSurface(
  platforms,
  targetX,
  _targetY,
  {
    tolerance = 200,
    minWidth = 100,
    maxHeight = 100,
    offsetAboveSurface = 70,
  } = {}
) {
  let bestPlatform = null;
  let bestDistance = Infinity;

  for (const platform of platforms) {
    if (platform.type === "moving" || platform.width < minWidth) continue;
    if (platform.height > maxHeight) continue;

    const isWithinBounds =
      targetX >= platform.x - tolerance &&
      targetX <= platform.x + platform.width + tolerance;

    if (!isWithinBounds) continue;

    const distance = Math.abs(targetX - (platform.x + platform.width / 2));
    if (distance < bestDistance) {
      bestDistance = distance;
      bestPlatform = platform;
    }
  }

  if (!bestPlatform) return null;

  return {
    platform: bestPlatform,
    x: bestPlatform.x + bestPlatform.width / 2,
    y: bestPlatform.y - offsetAboveSurface,
  };
}
