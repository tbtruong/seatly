import React, {type FormEvent, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useLoginMutation} from "@/features/login/api/login.ts";
import {useAuth} from "@/features/auth/AuthContext";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const {login} = useAuth();

  const {
    mutate: submitLogin,
    isPending,
    isError,
    isSuccess,
    error,
    data: loggedInUser,
  } = useLoginMutation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    submitLogin(
      {
        email: email.trim(),
        password,
      },
      {
        onSuccess: (data) => {
          login({
            user: {
              id: data.id,
              email: data.email,
              fullName: data.fullName
            },
            accessToken: data.token,
          });

          // Redirect somewhere after login:
          navigate("/dashboard", {replace: true});
        },
      },
    );
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "3rem auto",
        padding: "2rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{marginBottom: "1.5rem", fontSize: "1.5rem"}}>
        Log in
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{marginBottom: "1rem"}}>
          <label
            htmlFor="email"
            style={{display: "block", marginBottom: "0.25rem"}}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{width: "100%", padding: "0.5rem", boxSizing: "border-box"}}
          />
        </div>

        <div style={{marginBottom: "1rem"}}>
          <label
            htmlFor="password"
            style={{display: "block", marginBottom: "0.25rem"}}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{width: "100%", padding: "0.5rem", boxSizing: "border-box"}}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "0.5rem 1rem",
            cursor: isPending ? "default" : "pointer",
            marginRight: "0.75rem",
          }}
        >
          {isPending ? "Logging in..." : "Log in"}
        </button>

        <span style={{fontSize: "0.9rem"}}>
                    Need an account?{" "}
          <Link to="/signup">Sign up</Link>
                </span>
      </form>

      {isError && (
        <p style={{marginTop: "1rem", color: "red"}}>
          {(error as Error).message}
        </p>
      )}

      {isSuccess && loggedInUser && (
        <div style={{marginTop: "1.5rem", fontSize: "0.9rem"}}>
          <p>Login successful.</p>
          <p>Email: {loggedInUser.email ?? loggedInUser.email}</p>
        </div>
      )}
    </div>
  );
};

export default LoginForm;