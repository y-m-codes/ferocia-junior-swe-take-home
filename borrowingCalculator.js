/**
 * Borrowing Power Calculator
 *
 * Gen's incomplete prototype.
 * This currently calculates what a user can borrow over 30 years.
 * Currently this code uses placeholder methods for Tax and HEM values.
 *
 * TODO: Refactor the code to pull Tax and HEM values from an API call.
 * A server.js has been provided to supply these values.
 */

// Import module to enable terminal read/write with Promise handling
const readline = require('readline/promises');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Global constant for mortgage simulation
const LOAN_TERM_MONTHS = 360; // 30 Years
const INTEREST_RATE = 7.0; // 7.0% baseline interest rate
const ASSESSMENT_RATE_BUFFER = 3.0; // 3.0% buffer added to interest rates

async function callAPI(url) {
  const data = await fetch(url, {
    method: 'GET',
    headers: {
    'Authorization': 'Bearer pat_abcdefghijklmnopqrstuvwxyz0123456789',
    }
  });

  switch (data.status) {
    case 200:
      const json = await data.json()
      return json
    case 401:
      throw new Error("Error: You are not authorised to access this data")
    case 400:
      throw new Error("Error: Missing, malformed, or invalid inputs")
    case 404:
      throw new Error("Error: Request is not valid")
    case 405:
      throw new Error("Error: Request type is not permitted")
    default:
      throw new Error("Error: Unknown type - please try again")
  }
};

async function getTax(income) {
  const url = `http://localhost:3000/api/tax?income=${income}`;
  const json = await callAPI(url);
  const tax = Math.round(json.tax);
  return tax;
};

async function getHEM(income, dependents) {
  const url = `http://localhost:3000/api/hem?income=${income}&dependents=${dependents}`;
  const json = await callAPI(url);
  const hem = json.hem;
  return hem;
};

/**
 * Calculates the total borrowing power amount and the monthly repayment configuration
 */
async function calculateBorrowingPower(income, dependents, expenses, creditLimits, annualAssessmentRate) {
  // 1. Calculate Net Monthly Income after tax deductions
  const annualTax = await getTax(income);
  const netMonthlyIncome = (income - annualTax) / 12;

  // 2. Determine living expenses (User declared expenses vs HEM baseline, whichever is higher)
  const baselineHEM = await getHEM(income, dependents);
  const totalLivingExpenses = Math.max(expenses, baselineHEM);

  // 3. Calculate credit card liability (~3% of total limits)
  const creditCardLiability = creditLimits * 0.03;

  // 4. Calculate monthly repayment capacity
  const maxMonthlyRepayment = netMonthlyIncome - totalLivingExpenses - creditCardLiability;

  // Return early if user cannot afford a loan at all
  if (maxMonthlyRepayment <= 0) {
      return { maxLoanAmount: 0, monthlyRepayment: 0 };
  }

  // 5. Calculate the monthly interest rate
  const monthlyRate = (annualAssessmentRate / 100) / 12;

  // 6. Calculate maximum borrowing power using the following formula:
  // P = M * (1 - (1 + R)^-N) / R
  const maxLoanAmount = maxMonthlyRepayment * ((1 - Math.pow(1 + monthlyRate, - LOAN_TERM_MONTHS)) / monthlyRate);

  return {
    maxLoanAmount: Number(maxLoanAmount.toFixed(2)),
    monthlyRepayment: Number(maxMonthlyRepayment.toFixed(2))
  };
}

async function getIncome() {
  const income = await rl.question("Gross Annual Income: $");
  if (income < 0) {
    throw new Error("Negative income is not allowed.")
  } else {
    return income
  }
};

async function getDependents() {
  const dependents = await rl.question("Number of Dependents: ");
  if (dependents < 0) {
    throw new Error("Negative dependents are not allowed.")
  } else if (dependents > 3) {
    throw new Error("Our models are based off a maximum of 3 dependents.")
  } else {
    return dependents
  }
};

async function getExpenses() {
  const expenses = await rl.question("Declared Monthly Expenses: $");
  if (expenses < 0) {
    throw new Error("Negative expenses are not allowed.")
  } else {
    return expenses
  }
};

async function getCreditLimits() {
  const creditLimits = await rl.question("Total Credit Card Limits: $");
  if (creditLimits < 0) {
    throw new Error("Negative credit limits are not allowed.")
  } else {
    return creditLimits
  }
};

async function runConsoleMode() {
  console.log("Mortgage Borrowing Power Calculator");
  console.log("===================================");

  const assessmentRate = INTEREST_RATE + ASSESSMENT_RATE_BUFFER;

  let income = 0;
  let dependents = 0;
  let expenses = 0;
  let creditLimits = 0;
  let result = 0;

  try {
    income = await getIncome();

    dependents = await getDependents();

    expenses = await getExpenses();

    creditLimits = await getCreditLimits();

    result = await calculateBorrowingPower(
      parseFloat(income),
      parseInt(dependents),
      parseFloat(expenses),
      parseFloat(creditLimits),
      assessmentRate,
    );

    console.log("\n--- Calculation Summary ---");
    console.log(`Maximum Borrowing Power at ${INTEREST_RATE}%: $${result.maxLoanAmount.toLocaleString()}`);
    console.log(`Assumed Monthly Mortgage Repayment: $${result.monthlyRepayment.toLocaleString()} over 30 years`);
  } catch (e) {
    console.log(e.message);
    return
  } finally {
    rl.close();
  }
};

if (require.main === module) {
  runConsoleMode();
}

module.exports = { calculateBorrowingPower };
