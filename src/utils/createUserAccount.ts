import { supabase } from "./supabaseClient";
import type { Database } from "../../database.types";

/** Default password assigned when CSV import creates a new account. */
export const DEFAULT_NEW_USER_PASSWORD = "FruitCalc1";

type UserRole = Database["public"]["Enums"]["user_role"];

/** Input for creating an auth user plus related app rows. */
export interface CreateUserAccountInput {
  /** Full email (e.g. alice@fruitcalculator.com). */
  email: string;
  /** Auth password. */
  password: string;
  /** App role; defaults to customer. Never escalate via CSV. */
  role?: UserRole;
  /** Optional phone; omitted/null leaves the column null. */
  contactNumber?: string | null;
  /** Optional birthday; omitted/null leaves the column null. */
  birthday?: string | null;
  /** Category ids that get zero account_balances (and bakis). */
  categoryIds: number[];
  /**
   * When true (default), inserts a zero baki row per category.
   * Matches historical addUser behavior; pass false when Baki is off if desired.
   */
  createBakis?: boolean;
}

/** Result of a successful createUserAccount call. */
export interface CreateUserAccountResult {
  id: string;
  email: string;
}

/**
 * Builds the conventional app email from a username local-part.
 * @param username - Username or raw email local-part
 * @returns email like username@fruitcalculator.com
 */
export function buildFruitCalculatorEmail(username: string): string {
  const localPart = username.trim().split("@")[0] ?? "";
  return `${localPart.toLowerCase()}@fruitcalculator.com`;
}

/**
 * Creates an auth user, user_details, and zeroed ledger rows for every category.
 * Throws on failure so callers can abort batch imports cleanly.
 * @param input - Email, password, optional profile, category ids
 * @returns Created auth user id and email
 */
export async function createUserAccount(
  input: CreateUserAccountInput
): Promise<CreateUserAccountResult> {
  const email = input.email.trim().toLowerCase();
  if (email === "" || !email.includes("@")) {
    throw new Error("Valid email is required to create a user");
  }
  if (input.password.trim() === "") {
    throw new Error("Password is required to create a user");
  }

  const role: UserRole = input.role ?? "customer";
  const createBakis = input.createBakis !== false;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Failed to create auth user (${email}): ${error.message}`);
  }

  const userId = data.user?.id;
  if (typeof userId !== "string" || userId === "") {
    throw new Error(`Auth user created without an id (${email})`);
  }

  const detailInsert: Database["public"]["Tables"]["user_details"]["Insert"] = {
    user_id: userId,
    role,
  };
  if (input.contactNumber !== undefined && input.contactNumber !== null) {
    detailInsert.contact_number = input.contactNumber;
  }
  if (input.birthday !== undefined && input.birthday !== null) {
    detailInsert.birthday = input.birthday;
  }

  const { error: userDetailError } = await supabase
    .from("user_details")
    .insert([detailInsert]);

  if (userDetailError) {
    throw new Error(
      `Failed to create user details (${email}): ${userDetailError.message}`
    );
  }

  for (const categoryId of input.categoryIds) {
    const { error: balanceError } = await supabase.from("account_balances").insert({
      user_id: userId,
      category_id: categoryId,
      balance: 0,
    });
    if (balanceError) {
      throw new Error(
        `Failed to create account balance for category ${String(categoryId)} (${email}): ${balanceError.message}`
      );
    }
  }

  if (createBakis) {
    for (const categoryId of input.categoryIds) {
      const { error: bakiError } = await supabase.from("bakis").insert({
        user_id: userId,
        category_id: categoryId,
        balance: 0,
      });
      if (bakiError) {
        throw new Error(
          `Failed to create baki for category ${String(categoryId)} (${email}): ${bakiError.message}`
        );
      }
    }
  }

  return { id: userId, email };
}
