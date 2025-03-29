/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Card, Label, TextInput } from "flowbite-react";
import type { FC } from "react";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingPage from "../pages/loading";
import { useAuthContext } from "../../context/AuthContext";

const SignInPage: FC = function () {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuthContext();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  // Handle navigation based on auth state
  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    
    try {
      const email = username + "@fruitcalculator.com";
      const result = await signIn(email, password);

      if (result.error) {
        console.error("Sign in error:", result.error.message);
        setError(result.error.message);
      }
      // No need to navigate here as the useEffect will handle it when user state updates
    } catch (err) {
      console.error("Unexpected error during sign in:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 lg:h-screen lg:gap-y-12">
      <a href="/" className="my-6 flex items-center gap-x-1 lg:my-0">
        <img alt="Logo" src="../../images/logo.svg" className="mr-3 h-10" />
        <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
          Fruit Basket
        </span>
      </a>
      <Card
        horizontal
        imgSrc="/images/authentication/login.jpg"
        imgAlt=""
        className="w-full md:max-w-[1024px] md:[&>*]:w-full md:[&>*]:p-16 [&>img]:hidden md:[&>img]:w-96 md:[&>img]:p-0 lg:[&>img]:block">
        <h1 className="mb-3 text-2xl font-bold dark:text-white md:text-3xl">
          Sign in to platform
        </h1>
        {error && (
          <div className="mb-6 p-3 text-sm text-center text-red-500 bg-red-100 dark:bg-red-500 dark:text-red-100 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="mb-4 flex flex-col gap-y-3">
            <Label htmlFor="email">Your Username</Label>
            <TextInput
              id="email"
              name="email"
              placeholder="username123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6 flex flex-col gap-y-3">
            <Label htmlFor="password">Your password</Label>
            <TextInput
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <Button
              type="submit"
              className="w-full lg:w-auto">
              Login to your account
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SignInPage;
