export function isFiniteNumber(d) {
  return typeof d === "number" && isFinite(d);
}

export function secondsToFrameIndex(sec, fps, totalFrames) {
  let frame = Math.max(0, Math.floor(sec * fps));
  if (isFiniteNumber(totalFrames)) {
    frame = Math.min(frame, totalFrames - 1);
  }
  return frame;
}

export function secondsToPlayhead(sec, duration) {
  const hasDuration = isFiniteNumber(duration);
  return hasDuration ? currentTime / duration : undefined;
}

export function frameIndexToSeconds(frame, fps) {
  return frame / fps;
}
