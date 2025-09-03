import { StepHandler, StepRegistry } from '../types/engine.js';

class InMemoryRegistry implements StepRegistry {
  private map = new Map<string, StepHandler>();
  has(ref: string): boolean { return this.map.has(ref); }
  get(ref: string): StepHandler {
    const h = this.map.get(ref);
    if (!h) throw new Error(`Handler not found for ref: ${ref}`);
    return h;
  }
  register(ref: string, handler: StepHandler): void {
    if (this.map.has(ref)) throw new Error(`Ref already registered: ${ref}`);
    this.map.set(ref, handler);
  }
}

export const Registry = new InMemoryRegistry();
