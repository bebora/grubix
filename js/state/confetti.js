import { mathUtils } from "../utils.js";

/**
 * Manage state of confetti in the scene
 * @constructor
 */
export function ConfettiEmitter() {
  // Max number of confetti spawned simultaneously
  const max_confetti = 500;
  const GRAVITY = 0.005;
  this.confetti = [];

  /**
   * Spawn confetti in the scene
   */
  this.spawnConfetti = () => {
    for (let i = 0; i < max_confetti; i++) {
      this.confetti.push(new Confetto());
    }
  };

  /**
   * Update positions and velocity of confetti
   */
  this.updateConfetti = () => {
    const now = Date.now();
    for (let c of this.confetti) {
      c.localPosition = mathUtils.sumVectors3(c.localPosition, c.speed);
      c.speed[1] -= GRAVITY;
    }
    this.confetti = this.confetti.filter((c) => c.expire >= now);
  };

  /**
   * Get flat array of confetti positions
   * @return {number[]}
   */
  this.getPositions = () => {
    const ret = [];
    for (let c of this.confetti) {
      ret.push(...c.localPosition);
    }
    return ret;
  };

  /**
   * Get flat array of confetti colours
   * @return {number[]}
   */
  this.getColours = () => {
    const ret = [];
    for (let c of this.confetti) {
      ret.push(...c.colour);
    }
    return ret;
  };
}

/**
 * Single confetti particle with random colour
 * @constructor
 */
function Confetto() {
  const angle = Math.random() * Math.PI * 2;
  const height = Math.random() * 2 + 15;
  const radius = Math.sqrt(Math.random()) * 6;
  this.expire = Date.now() + 4500 + Math.random() * 4000;
  this.localPosition = [
    radius * Math.cos(angle),
    height,
    radius * Math.sin(angle),
  ];
  this.speed = [Math.random() - 0.5, Math.random() - 0.8, Math.random() - 0.5];
  this.colour = [
    Math.random() * 0.75 + 0.25,
    Math.random() * 0.75 + 0.25,
    Math.random() * 0.75 + 0.25,
  ];
}
