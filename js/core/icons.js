export function initIcons() {
  const root = document.documentElement;
  const markReady = () => root.classList.add('icons-ready');

  if (!document.fonts || !document.fonts.load) {
    markReady();
    return;
  }

  const loads = [
    document.fonts.load('24px "Material Icons Round"'),
    document.fonts.load('24px "Material Symbols Outlined"'),
    document.fonts.load('24px "Material Symbols Rounded"')
  ];

  Promise.race([
    Promise.allSettled(loads),
    new Promise((resolve) => setTimeout(resolve, 1200))
  ]).then(markReady);
}
