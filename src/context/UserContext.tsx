import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { useCategoryContext } from "./CategoryContext";
import { Baki } from "./BakiContext";
import { AccountBalance } from "./AccountBalanceContext";

export type User = {
  id: string;
  email: string;
  password?: string;
  user_detail: Database["public"]["Tables"]["user_details"]["Row"];
  baki: Baki[];
  account_balance: AccountBalance[];
};
export type Users = { users: User[] };

interface UserContextProps {
  users: User[];
  loading: boolean;
  addUser: (user: User) => Promise<void>;
  deleteUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const UserContext = createContext<UserContextProps>(undefined!);

export function UserProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { categories } = useCategoryContext();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // First get all users from auth
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000
        });

        if (authError) {
          console.error("Error fetching auth users:", authError);
          showAlert("Error fetching users", "error");
          return;
        }

        if (!authUsers?.users?.length) {
          console.error("No users found in auth");
          showAlert("No users found", "error");
          return;
        }

        // Then get all user details
        const { data: userDetails, error: detailsError } = await supabase
          .from("user_details")
          .select("*");

        if (detailsError) {
          console.error("Error fetching user details:", detailsError);
          showAlert("Error fetching user details", "error");
          return;
        }

        // Combine auth users with their details
        const usersWithDetails = authUsers.users.map(authUser => {
          if (!authUser.email) {
            console.error("User found without email:", authUser.id);
            return null;
          }
          const userDetail = userDetails?.find(detail => detail.user_id === authUser.id);
          return {
            ...authUser,
            email: authUser.email,
            user_detail: userDetail || null,
            account_balance: [],
            baki: []
          };
        }).filter((user): user is NonNullable<typeof user> => user !== null);

        // Fetch account balances
        const { data: accountBalances, error: balanceError } = await supabase
          .from("account_balances")
          .select("*");

        if (balanceError) {
          console.error("Error fetching account balances:", balanceError);
          showAlert("Error fetching account balances", "error");
          return;
        }

        // Add account balances to users
        const usersWithBalances = usersWithDetails.map(user => ({
          ...user,
          account_balance: accountBalances?.filter(balance => balance.user_id === user.id) || []
        }));

        // Fetch bakis
        const { data: bakis, error: bakiError } = await supabase
          .from("bakis")
          .select("*");

        if (bakiError) {
          console.error("Error fetching bakis:", bakiError);
          showAlert("Error fetching bakis", "error");
          return;
        }

        // Add bakis to users
        const finalUsers = usersWithBalances.map(user => ({
          ...user,
          baki: bakis?.filter(baki => baki.user_id === user.id) || []
        }));

        setUsers(finalUsers);
      } catch (error) {
        console.error("Error in fetchUsers:", error);
        showAlert("Error fetching users", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setUsers((prev) => [payload.new, ...prev]);
      } else if (payload.eventType === "UPDATE") {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === payload.new.id ? payload.new : user
          )
        );
      } else if (payload.eventType === "DELETE") {
        setUsers((prev) => prev.filter((user) => user.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel("auth.users")
      .on(
        "postgres_changes",
        { event: "*", schema: "auth", table: "users" },
        handleChanges
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const addUser = async (user: User) => {
    setLoading(true);
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (error) {
      console.error("Error adding user:", error);
      showAlert("Error adding user", "error");
      setLoading(false);
      return;
    }

    // Create User Details
    const { error: userDetailError } = await supabase
      .from("user_details")
      .insert([{ ...user.user_detail, user_id: data.user.id }]);

    if (userDetailError) {
      console.error("Error adding user details:", userDetailError);
      showAlert("Error adding user details", "error");
      setLoading(false);
      return;
    }

    // Create Account Balance
    categories.forEach(async (category) => {
      await supabase.from("account_balances").insert({
        user_id: data.user.id,
        category_id: category.id,
        balance: 0,
      });
    });

    // Create Baki
    categories.forEach(async (category) => {
      await supabase.from("bakis").insert({
        user_id: data.user.id,
        category_id: category.id,
        balance: 0,
      });
    });

    showAlert("User added successfully", "success");
    setLoading(false);
  };

  const deleteUser = async (user: User) => {
    setLoading(true);

    // Delete User Details
    const { error: userDetailError } = await supabase
      .from("user_details")
      .delete()
      .eq("user_id", user.id);

    if (userDetailError) {
      console.error("Error deleting user details:", userDetailError);
      showAlert("Error deleting user details", "error");
    }

    // Delete Account Balance
    const { error: userError } = await supabase
      .from("account_balances")
      .delete()
      .eq("user_id", user.id);

    if (userError) {
      console.error("Error deleting account balance:", userError);
      showAlert("Error deleting account balance", "error");
    }

    // Delete Baki
    const { error: bakiError } = await supabase
      .from("bakis")
      .delete()
      .eq("user_id", user.id);

    if (bakiError) {
      console.error("Error deleting baki:", bakiError);
      showAlert("Error deleting baki", "error");
    }

    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("Error deleting user:", error);
      showAlert("Error deleting user", "error");
    }

    showAlert("User deleted successfully", "success"); // "User deleted successfully
    setLoading(false);
  };

  const updateUser = async (user: User) => {
    setLoading(true);
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: user.password,
    });

    if (error) {
      console.error("Error updating user:", error);
      showAlert("Error updating user", "error");
      setLoading(false);
      return;
    }

    // Update User Details
    const { error: userDetailError } = await supabase
      .from("user_details")
      .update(user.user_detail)
      .eq("user_id", user.id);

    if (userDetailError) {
      console.error("Error updating user details:", userDetailError);
      showAlert("Error updating user details", "error");
      setLoading(false);
      return;
    }

    showAlert("User updated successfully", "success");
    setLoading(false);
  };

  return (
    <UserContext.Provider
      value={{ users, loading, addUser, deleteUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }

  return context;
}
