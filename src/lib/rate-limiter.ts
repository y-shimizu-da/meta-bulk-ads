const DEFAULT_DELAY_MS = 2000;

export class RateLimiter {
  private lastCallTime = 0;
  private delayMs: number;

  constructor(delayMs: number = DEFAULT_DELAY_MS) {
    this.delayMs = delayMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.delayMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.delayMs - elapsed)
      );
    }
    this.lastCallTime = Date.now();
  }
}
