import React, {type FormEvent, useEffect, useState} from "react";
import {useSignupMutation} from "@/features/signup/api/signup.ts";
import {Link, useNavigate} from "react-router-dom";

export const SignupForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const {
    mutate: submitSignup,
    isPending,
    isSuccess,
    isError,
    error,
    data: createdUser,
  } = useSignupMutation();

  useEffect(() => {
    if (isSuccess) {
      // Optionally show a short delay before redirect:
      // const timeout = setTimeout(() => navigate("/login"), 1000);
      // return () => clearTimeout(timeout);

      navigate("/login");
    }
  }, [isSuccess, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    submitSignup({
      email: email.trim(),
      password,
      fullName: fullName.trim() || null,
    });
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
        Sign up
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
            htmlFor="fullName"
            style={{display: "block", marginBottom: "0.25rem"}}
          >
            Full name (optional)
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
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
          }}
        >
          {isPending ? "Signing up..." : "Sign up"}
        </button>
      </form>

      {isError && (
        <p style={{marginTop: "1rem", color: "red"}}>
          {(error as Error).message}
        </p>
      )}

      {isSuccess && createdUser && (
        <div style={{marginTop: "1.5rem", fontSize: "0.9rem"}}>
          <p>Account created successfully.</p>
          <p>Email: {createdUser.email}</p>
        </div>
      )}
      <span style={{fontSize: "0.9rem"}}>
        Already have an account? <Link to="/login">Log in</Link>
      </span>
    </div>
  );
};

export default SignupForm;