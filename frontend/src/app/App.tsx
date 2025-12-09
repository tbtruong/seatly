import {Navigate, Route, Routes} from "react-router-dom";
import SignupPage from "@/features/signup/SignupPage.tsx";
import LoginPage from "@/features/login/LoginPage.tsx";
import {RequireAuth} from "@/features/auth/RequireAuth.tsx";
import DeskDashboardPage from "@/features/desks/DeskDashboardPage.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
      <Route path="/signup" element={<SignupPage/>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route element={<RequireAuth/>}>
        <Route path="/dashboard" element={<DeskDashboardPage/>}/>
      </Route>
    </Routes>
  );
}

export default App;