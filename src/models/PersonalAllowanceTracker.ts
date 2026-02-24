export class PersonalAllowanceTracker {
  private _remaining: number;

  constructor(initialAllowance: number) {
    this._remaining = initialAllowance;
  }

  // Applies as much allowance as possible to the given income, returns the income after allowance
  applyTo(income: number): number {
    const applied = Math.min(this._remaining, income);
    this._remaining -= applied;
    return income - applied;
  }

  get remaining(): number {
    return this._remaining;
  }
}
