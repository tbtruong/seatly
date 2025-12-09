import React from "react";
import SignupForm from "@/features/signup/components/SignupForm.tsx";
import "./SignupPage.css";

export const SignupPage: React.FC = () => {
    return (
        <div className="signup-page">
            <div className="signup-page__content">
                <SignupForm />
            </div>
        </div>
    );
};

export default SignupPage;