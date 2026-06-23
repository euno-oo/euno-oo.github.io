export const PET_EXPRESSIONS = {
  neutral: "images/Final.avif",
  happy: "images/Default.avif",
  stress: "images/Stress.avif",
  anxiety: "images/Anxiety.avif",
  burnout: "images/Burnout.avif",
  overthinking: "images/Overthinking.avif",
  loneliness: "images/Loneliness.avif"
};

export function preloadPetAssets() {
  return Promise.all(
    Object.values(PET_EXPRESSIONS).map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(src);
          img.onerror = () => resolve(src);
          img.src = src;
        })
    )
  );
}
