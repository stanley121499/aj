import { User } from "../context/UserContext";

/**
 * Represents a parsed result line with validated data
 */
export interface ParsedResultLine {
  amount: number;
  username: string;
}

/**
 * Validates and cleans a username string
 * @param username - The username to clean
 * @returns Cleaned username
 * @throws Error if username is invalid
 */
function cleanUsername(username: string): string {
  const cleaned = username.trim();
  if (!cleaned) {
    throw new Error("Username cannot be empty");
  }
  if (cleaned.length > 50) {
    throw new Error("Username is too long (max 50 characters)");
  }
  return cleaned;
}

/**
 * Validates and cleans an amount string
 * @param amountStr - The amount string to clean
 * @returns Cleaned amount number
 * @throws Error if amount is invalid
 */
function cleanAmount(amountStr: string): number {
  // Remove all whitespace
  amountStr = amountStr.trim();
  
  // Handle empty or invalid input
  if (!amountStr) {
    throw new Error("Amount cannot be empty");
  }

  // Handle multiple decimal points
  if ((amountStr.match(/\./g) || []).length > 1) {
    throw new Error(`Invalid amount format: ${amountStr} (multiple decimal points)`);
  }

  // Handle multiple minus signs
  if ((amountStr.match(/-/g) || []).length > 1) {
    throw new Error(`Invalid amount format: ${amountStr} (multiple minus signs)`);
  }

  // Handle minus sign in wrong position
  if (amountStr.includes("-") && !amountStr.startsWith("-")) {
    throw new Error(`Invalid amount format: ${amountStr} (minus sign must be at the start)`);
  }

  // Clean the amount string
  const cleanedAmount = amountStr
    .replace(/,/g, "") // Remove commas
    .replace(/\u2212/g, "-") // Replace non-standard minus
    .replace(/[^\d.-]/g, ""); // Remove non-numeric chars except decimal and minus

  // Parse the amount with decimal precision
  const amount = Number(cleanedAmount);
  
  // Validate the parsed amount
  if (isNaN(amount)) {
    throw new Error(`Invalid amount: ${amountStr} (not a valid number)`);
  }
  if (amount === 0) {
    throw new Error(`Invalid amount: ${amountStr} (amount cannot be zero)`);
  }
  if (amount > 1000000000) {
    throw new Error(`Invalid amount: ${amountStr} (amount too large)`);
  }
  if (amount < -1000000000) {
    throw new Error(`Invalid amount: ${amountStr} (amount too small)`);
  }

  // Ensure we maintain decimal precision
  const decimalPlaces = (cleanedAmount.split(".")[1] || "").length;
  if (decimalPlaces > 2) {
    throw new Error(`Invalid amount: ${amountStr} (maximum 2 decimal places allowed)`);
  }

  return amount;
}

/**
 * Parses a single line from a result input
 * @param line - The line to parse in format "AMOUNT USERNAME"
 * @returns ParsedResultLine with validated data
 * @throws Error if line format is invalid
 */
export function parseResultLine(line: string): ParsedResultLine {
  // Split line into parts and handle multiple spaces
  const parts = line.split(/\s+/).filter(Boolean);
  
  if (parts.length < 2) {
    throw new Error(`Invalid line format: ${line} (missing amount or username)`);
  }

  const amountStr = parts[0];
  const username = parts.slice(1).join(" ");

  try {
    const amount = cleanAmount(amountStr);
    const cleanedUsername = cleanUsername(username);
    return { amount, username: cleanedUsername };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Line "${line}": ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parses multiple lines from a result input
 * @param resultText - The full result text containing multiple lines
 * @returns Array of ParsedResultLine
 * @throws Error if any line fails to parse
 */
export function parseResultLines(resultText: string): ParsedResultLine[] {
  if (!resultText.trim()) {
    throw new Error("Result text cannot be empty");
  }

  const lines = resultText.split("\n");
  const processedLines = new Set<string>();
  const parsedLines: ParsedResultLine[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    try {
      const parsedLine = parseResultLine(line.trim());
      // Create a unique key for the line based on amount and username
      const lineKey = `${parsedLine.amount}-${parsedLine.username}`;
      
      if (processedLines.has(lineKey)) {
        console.warn(`Line ${lineNumber}: Duplicate transaction skipped: ${line.trim()}`);
        continue;
      }

      parsedLines.push(parsedLine);
      processedLines.add(lineKey);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(`Line ${lineNumber}: ${error.message}`);
      }
    }
  }

  // If there were any errors, throw them all at once
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  // If no valid lines were found
  if (parsedLines.length === 0) {
    throw new Error("No valid lines found in result text");
  }

  return parsedLines;
} 