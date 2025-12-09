import React from "react";
import LoginForm from "@/features/login/components/LoginForm.tsx";
import "@/features/signup/SignupPage.css";

export const LoginPage: React.FC = () => {
    return (
        <div className="signup-page">
            <div className="signup-page__content">
                <LoginForm />
            </div>
        </div>
    );
};

export default LoginPage;