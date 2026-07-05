export class Animator {
  private anims: Map<string, number> = new Map();

  animate(
    key: string,
    from: number, to: number, duration: number,
    onFrame: (value: number) => void,
    easing: "ease-out" | "spring" | "linear" = "ease-out"
  ): Promise<void> {
    return new Promise(resolve => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        let v: number;
        switch (easing) {
          case "spring":
            v = from + (to - from) * (1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2));
            break;
          case "linear":
            v = from + (to - from) * t;
            break;
          default:
            v = from + (to - from) * (1 - Math.pow(1 - t, 2));
        }
        onFrame(v);
        if (t >= 1) { this.anims.delete(key); resolve(); }
        else this.anims.set(key, requestAnimationFrame(step));
      };
      this.anims.set(key, requestAnimationFrame(step));
    });
  }

  cancel(key: string) {
    const id = this.anims.get(key);
    if (id !== undefined) { cancelAnimationFrame(id); this.anims.delete(key); }
  }

  cancelAll() {
    this.anims.forEach(id => cancelAnimationFrame(id));
    this.anims.clear();
  }
}