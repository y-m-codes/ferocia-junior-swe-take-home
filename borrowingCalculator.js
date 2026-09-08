// Import module to enable terminal read/write with Promise handling
const readline = require('readline/promises');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Global constant for mortgage simulation
const LOAN_TERM_MONTHS = 360; // 30 Years
const INTEREST_RATE = 7.0; // 7.0% baseline interest rate
const ASSESSMENT_RATE_BUFFER = 3.0; // 3.0% buffer added to interest rates

const REQUEST_TIMEOUT_MS = 5000;

async function callAPI(url) {
  let data;

  try {
    data = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer pat_abcdefghijklmnopqrstuvwxyz0123456789',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error("Error: API is down or unreachable.");
  }

  switch (data.status) {
    case 200:
      return await data.json()
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
}

async function checkAPI() {
  await getTax(0)
}

/**
 * Calculates the total borrowing power amount and the monthly repayment configuration
 */
async function calculateBorrowingPower(income, dependents, expenses, creditLimits, annualAssessmentRate) {
  const noLoan = { maxLoanAmount: 0, monthlyRepayment: 0 };

  if (income < 0 || dependents < 0 || expenses < 0 || creditLimits < 0) {
      return noLoan
  }

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
      return noLoan
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
};

// An array of prompts for user input
// Tests throw error when function returns false
const prompts = [
  {
    name: "income",
    question: "Gross Annual Income: $",
    validators: [
      {test: i => !isNaN(i), message: "Income must be a number."}, // handles empty, string or other non-Number inputs
      {test: i => i >= 0, message: "Negative income is not allowed."}
    ],
  },
  { name: "dependents",
    question: "Number of Dependents: ",
    validators: [
      {test: i => !isNaN(i), message: "Dependents must be a number."},
      {test: i => i >= 0, message: "Negative dependents are not allowed."},
      {test: i => i <= 3, message: "Our models are based off a maximum of 3 dependents."},
      {test: i => Number.isInteger(i), message: "Dependents must be a whole number."}
    ],
  },
  { name: "expenses",
    question: "Declared Monthly Expenses: $",
    validators: [
      {test: i => !isNaN(i), message: "Expenses must be a number."},
      {test: i => i >= 0, message: "Negative expenses are not allowed."}
    ],
  },
  { name: "creditLimits",
    question: "Total Credit Card Limits: $",
    validators: [
      {test: i => !isNaN(i), message: "Credit limits must be a number."},
      {test: i => i >= 0, message: "Negative credit limits are not allowed."}
    ],
  },
];

async function askAndValidate({question, validators}) {
  const raw = await rl.question(question);
  const input = parseFloat(raw);
  for (const v of validators) {
    if (v.test(input) === false) {
      throw new Error(v.message)
    }
  };
  return input
}

async function runConsoleMode() {
  const assessmentRate = INTEREST_RATE + ASSESSMENT_RATE_BUFFER;

  try {
    await checkAPI();

    console.log("Mortgage Borrowing Power Calculator");
    console.log("===================================");

    let answers = {};

    for (const prompt of prompts) {
      answers[prompt.name] = await askAndValidate(prompt)
    }

    const result = await calculateBorrowingPower(
      answers.income,
      answers.dependents,
      answers.expenses,
      answers.creditLimits,
      assessmentRate,
    );

    console.log("\n--- Calculation Summary ---");
    console.log(`Maximum Borrowing Power at ${INTEREST_RATE}%: $${result.maxLoanAmount.toLocaleString()}`);
    console.log(`Assumed Monthly Mortgage Repayment: $${result.monthlyRepayment.toLocaleString()} over 30 years`);
  } catch (e) {
    console.log(e.message);
  } finally {
    rl.close();
  }
};

if (require.main === module) {
  runConsoleMode();
}

module.exports = { calculateBorrowingPower };
