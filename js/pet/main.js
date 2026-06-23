import { preloadPetAssets } from "./petAssets.js";
import { renderApp, renderInfoDialog } from "./petRenderer.js";
import {
  bindRenderTargets,
  initializeEngine,
  refreshFromWellnessData,
  startReflection,
  stopReflection,
  showEmotion,
  showMessage
} from "./petEngine.js";

let rootElement = null;

function handleInfoOpen() {
  renderInfoDialog(document.body);
}

export async function initializePet(selector = "#euno-app") {
  rootElement = document.querySelector(selector);
  if (!rootElement) return;

  await preloadPetAssets();

  const { petCard, speechBubble } = renderApp(rootElement, {
    onInfoOpen: handleInfoOpen
  });

  bindRenderTargets({ petCard, speechBubble });
  initializeEngine();
}

export {
  refreshFromWellnessData,
  startReflection,
  stopReflection,
  showEmotion,
  showMessage
};

window.Euno = {
  initializePet,
  refreshFromWellnessData,
  startReflection,
  stopReflection,
  showEmotion,
  showMessage
};
