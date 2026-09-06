/**
 * Borrowing Power Calculator Test Suite
 */


const assert = require('assert');
const {calculateBorrowingPower} = require('./borrowingCalculator');

describe('Borrowing Power Calculator Tests', () => {

   it('should calculate borrowing power for standard values', async () => {
    const result = await calculateBorrowingPower(120000, 2, 3000, 10000, 10);
    assert.ok(result.maxLoanAmount > 0, 'Should yield a positive borrowing power amount');
    assert.strictEqual(result.monthlyRepayment, 4600);
  });

  it('should return 0 for invalid negative income', async () => {
    const result = await calculateBorrowingPower(-100000, 3, 4000, 5000, 7.5);
    assert.strictEqual(result.maxLoanAmount, 0);
    assert.strictEqual(result.monthlyRepayment, 0);
  });

  it('should return 0 for invalid negative dependents', async () => {
    const result = await calculateBorrowingPower(100000, -3, 4000, 5000, 7.5);
    assert.strictEqual(result.maxLoanAmount, 0);
    assert.strictEqual(result.monthlyRepayment, 0);
  });

  it('should return 0 for invalid negative expenses', async () => {
    const result = await calculateBorrowingPower(100000, 3, -4000, 5000, 7.5);
    assert.strictEqual(result.maxLoanAmount, 0);
    assert.strictEqual(result.monthlyRepayment, 0);
  });

  it('should return 0 for invalid negative credit limits', async () => {
    const result = await calculateBorrowingPower(100000, 3, 4000, -5000, 7.5);
    assert.strictEqual(result.maxLoanAmount, 0);
    assert.strictEqual(result.monthlyRepayment, 0);
  });

});
