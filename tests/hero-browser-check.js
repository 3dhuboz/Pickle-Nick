(async () => {
  const video = document.querySelector('.home-hero__video');
  if (!video) return JSON.stringify({ pass: false, reason: 'Hero video missing', url: location.href });
  let wraps = 0;
  let visiblePlaySamples = 0;
  let previous = video.currentTime;
  const samples = [];
  const started = performance.now();
  while (performance.now() - started < 13500) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const current = video.currentTime;
    if (!video.paused && Number(getComputedStyle(video).opacity) > 0.95) visiblePlaySamples++;
    if (previous - current > 0.5) wraps++;
    previous = current;
    if (samples.length === 0 || performance.now() - samples.at(-1).at > 1000) {
      samples.push({ at: Math.round(performance.now()), time: current, paused: video.paused, ended: video.ended, rate: video.playbackRate, opacity: getComputedStyle(video).opacity });
    }
  }
  const poster = document.querySelector('.home-hero__poster');
  return JSON.stringify({ pass: wraps >= 3 && visiblePlaySamples > 20 && poster?.naturalWidth > 0 && !video.error && video.playbackRate > 1, wraps, visiblePlaySamples, duration: video.duration, error: video.error?.message ?? null, visibility: document.visibilityState, url: location.href, samples });
})()
