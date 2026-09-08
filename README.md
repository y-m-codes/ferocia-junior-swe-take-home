# Borrowing Power Calculator - Take Home Submission
The original take-home assignment is in ASSIGNMENT.md; this file describes my approach.

## How It Works
This borrowing power calculator receives user input and fetches data from the API defined in `server.js`, then calculates an individual's estimated borrowing power and returns a maximum loan amount and monthly repayment amount.

## Assumptions
* I was not supposed to edit the server;
* The calculator should reject dependents greater than 3 and notify the user; and
* The calculator should reject a decimal value for dependents and notify the user.

## Decisions
* A rejected client-side API call does not display a response status code to the user, as it likely won't mean anything to them;
* Any errors thrown do not show the full stack trace as it would be confusing for a regular user; and
* Any time an invalid input is received, an error is thrown and the program aborts. This design choice was made to prioritise producing a working product in the allocated time.

## What I did
* Implemented API calls: The placeholder calculations in `getTax()` and `getHEM()` were replaced with calls to the correct API endpoints.

* Implemented async/await: Nested callback functions in `runConsoleMode()` were replaced with async/await to improve legibility.

* Reduced code repetition:
  * repeated code from `getTax()` and `getHEM()` was extracted into a `callAPI()` helper function; and
  * User prompts were organised in a `prompts` array that gets looped through to display prompts to and collect responses from the user, to reduce repeating similar code blocks for each prompt.

* Added error handling: Invalid user inputs, rejected API calls, and network errors will abort the program and throw errors, each with a descriptive error message.

* Fixed up and added tests:
  * The assessment rate value used in the test 'should calculate borrowing power for standard values' was changed to match the maths in `calculateBorrowingPower()`; and
  * The test "should return 0 for invalid negative inputs" originally passed all positive values (30000, 3, 4000, 5000, 7.5), so it did not execute the test case. The test was split into one test per input and passed a negative value for the tested input, so it executed the test case.

## Handling Errors and Invalid Inputs
### Network-level API failure
API network errors display an error message and abort the program.

### Client-side API errors
Rejected API calls will abort the program and display an error message, with a different message for each response status code.
They will not display a response status code to the user.

### Invalid user inputs
Invalid user inputs include:
* a value greater than 3 for dependents;
* decimal values for dependents;
* negative values for annual income, dependents, monthly expenses, or credit limits;
* blank/empty inputs for annual income, dependents, monthly expenses, or credit limits; and
* other non-Number inputs (e.g. strings) for annual income, dependents, monthly expenses, or credit limits.

For all of the above, the program is aborted and an error message displayed.

Note: zero is a valid input for annual income, dependents, monthly expenses, or credit limits.

## Limitations
### Aborting instead of reprompting
Aborting the program every time an invalid user input is encountered is not the best user experience. Reprompting for a new input and continuing the program would create a more friendly and frictionless user experience.

### Number.isInteger()
The use of `Number.isInteger()` to validate the input value for dependents has limitations.
For decimal values that are very close in value to integers, ECMAScript may represent them as integers.
An example:
"5.0000000000000001 only differs from 5 by 1e-16, which is too small to be represented. Therefore, 5.0000000000000001 will be represented with the same encoding as 5, thus making Number.isInteger(5.0000000000000001) return true." (Source: [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger))

I decided to use this method anyway as I reasoned it would work for the majority of use cases, with the likelihood of someone entering a dependents value with many decimal values being very low.
An alternative to explore is using `i % 1 === 0` as the validating expression.

## Testing coverage
The test suite currently tests:
* that standard values as `calculateBorrowingPower()` arguments return a positive `maxLoanAmount` and `monthlyRepayment`; and
* that negative values for annual income, dependents, monthly expenses, and credit limits in `calculateBorrowingPower()` return `0` for both `maxLoanAmount` and `monthlyRepayment`.

The code as submitted passes the above tests.

The test suite does not currently test to check:
* that a value greater than 3 for dependents throws an error;
* that decimal numbers for dependents throws an error;
* that empty/blank inputs for annual income, dependents, monthly expenses, and credit limits throw errors;
* that non-Number inputs for annual income, dependents, monthly expenses, and credit limits throw errors;
* that '0' is a valid input for annual income, dependents, monthly expenses, and credit limits, and will not throw an error;
* that rejected API calls throw errors with the specified error messages;
* that successful API calls return response status 200; and
* that when `maxMonthlyRepayment <= 0`, the values of `maxLoanAmount` and `monthlyRepayment` are 0.

## Further Work
* It is recommended to develop further tests addressing areas not covered, outlined in ## Testing above.
* It is recommended to rewrite the program to reprompt and continue rather than throw an error and abort, outlined in ## Limitations above.

## How to use it
### Setup
Make sure you have Node.js installed.

Install dependencies:
```
npm install
```

### Server
You will need to run the development API in its own terminal window.
(The server will be available at http://localhost:3000/).
To start the server run the following command:
```
npm run api
```
Note: You can stop the server with Ctrl+C

### Run the calculator program
In the Terminal, navigate to the project directory, and run 'npm start' to start the program.
You will be prompted for four inputs:
- annual income, in dollars,
- dependents, in whole numbers,
- monthly expenses, in dollars, and
- credit limits, in dollars.

The program will print the calculated maximum home loan amount and monthly repayments over 30 years.

### Testing
Make sure the API server is running before testing.

Run tests and check test suite coverage with:
```
npm test
```
