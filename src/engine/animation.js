import { SPEEDS } from "../config/theme.js";
import { calculateTranslate } from "./reels.js";

export class MotionController {
  constructor({ effectsRoot, soundController, metrics }) {
    this.effectsRoot = effectsRoot;
    this.soundController = soundController;
    this.metrics = metrics;
    this.speed = "balanced";
  }

  setSpeed(speed) {
    this.speed = SPEEDS[speed] ? speed : "balanced";
  }

  animateReelStop({ stripElement, reelElement, reelIndex, targetIndex, onCommit, onNormalize }) {
    const timing = SPEEDS[this.speed];

    return new Promise((resolve) => {
      const duration = timing.spinDuration + reelIndex * timing.stopStagger;
      const targetTranslate = calculateTranslate(targetIndex, this.metrics);

      window.setTimeout(() => {
        this.emitSparks(reelIndex, 4 + reelIndex);
      }, Math.max(120, duration - 280));

      requestAnimationFrame(() => {
        stripElement.style.transition = `transform ${duration}ms cubic-bezier(0.16, 0.78, 0.18, 1)`;
        stripElement.style.transform = `translateY(${targetTranslate}rem)`;
      });

      window.setTimeout(() => {
        reelElement.classList.remove("reel--spinning");
        reelElement.classList.add("reel--landed");
        onCommit();
        this.soundController.stop(reelIndex);

        window.setTimeout(() => {
          const normalizedIndex = onNormalize();
          stripElement.style.transition = "none";
          stripElement.style.transform = `translateY(${calculateTranslate(normalizedIndex, this.metrics)}rem)`;
          reelElement.classList.remove("reel--landed");

          requestAnimationFrame(() => {
            stripElement.style.transition = "";
          });
          resolve();
        }, timing.landingBounce);
      }, duration);
    });
  }

  emitSparks(reelIndex, count) {
    const reelCenter = ((reelIndex + 0.5) / 3) * 100;

    for (let index = 0; index < count; index += 1) {
      const spark = document.createElement("span");
      spark.className = "reel-spark";
      spark.style.left = `${reelCenter + (Math.random() * 14 - 7)}%`;
      spark.style.bottom = `${12 + Math.random() * 18}%`;
      spark.style.setProperty("--spark-drift", `${(Math.random() * 2.8 - 1.4).toFixed(2)}rem`);
      spark.style.animationDelay = `${index * 18}ms`;
      this.effectsRoot.appendChild(spark);
      window.setTimeout(() => spark.remove(), 980);
    }
  }

  pulseButton(button) {
    button.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(2px) scale(0.986)" },
        { transform: "translateY(0) scale(1)" }
      ],
      { duration: 240, easing: "ease-out" }
    );
  }
}
