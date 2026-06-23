export function createSpeechBubble() {
  const bubble = document.createElement("div");
  bubble.className = "speech-bubble";
  bubble.setAttribute("role", "status");
  bubble.setAttribute("aria-live", "polite");

  const eyebrow = document.createElement("p");
  eyebrow.className = "speech-bubble__eyebrow";

  const title = document.createElement("h2");
  title.className = "speech-bubble__title";

  const body = document.createElement("p");
  body.className = "speech-bubble__body";

  bubble.append(eyebrow, title, body);

  let typingTimer = null;
  let currentBodyText = "";

  function typeBody(text) {
    window.clearInterval(typingTimer);
    body.textContent = "";
    bubble.classList.add("is-typing");

    let index = 0;
    typingTimer = window.setInterval(() => {
      if (index < text.length) {
        body.textContent += text.charAt(index);
        index += 1;
      } else {
        window.clearInterval(typingTimer);
        typingTimer = null;
        bubble.classList.remove("is-typing");
      }
    }, 35);
  }

  function update({ eyebrowText, titleText, bodyText }) {
    const nextBodyText = bodyText || "";
    eyebrow.textContent = eyebrowText || "";
    title.textContent = titleText || "";
    if (nextBodyText === currentBodyText) {
      window.clearInterval(typingTimer);
      typingTimer = null;
      bubble.classList.remove("is-typing");
      body.textContent = nextBodyText;
      return;
    }
    currentBodyText = nextBodyText;
    typeBody(nextBodyText);
  }

  return { element: bubble, update };
}
