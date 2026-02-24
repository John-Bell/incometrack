export class BrbTracker {
  private _remaining: number;

  constructor(initialBrb: number) {
    this._remaining = initialBrb;
  }

  use(amount: number): number {
    const toUse = Math.min(this._remaining, amount);
    this._remaining -= toUse;
    return toUse;
  }

  get remaining(): number {
    return this._remaining;
  }
}
