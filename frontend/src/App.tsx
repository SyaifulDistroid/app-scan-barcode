import { createContext, useContext, useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useNavigate,
} from "react-router-dom";
import "./App.css";
import AdminPage from "./pages/admin/Admin";
import LoginPage from "./pages/login/Login";
import ScanPage from "./pages/scan/Scan";
import { baseUrlAPI } from "./utils/constant";

export const RoleContext = createContext(null);

function App() {
    const [role, setRole] = useState("");

    const handlePullRole = (role) => {
        setRole(role);
    };

    const checkAuthentication = async () => {
        const username = sessionStorage.getItem("username");
        const password = sessionStorage.getItem("password");

        if(!username && !password) {
            if(window.location.pathname !== "/") {
                if(window.location.pathname == "/admin") {
                    window.location.href = "/";
                }
            }
        }

        try {
            const response = await fetch(`${baseUrlAPI}login`, {
                method: "POST",
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status != 200 && response.status !== 201) {
              if(window.location.pathname !== "/") {
                window.location.href = "/";
              }
            }
            const result = await response.json();

            setRole(result.data.role)

            if (result.data.role != "admin" && result.data.role != "owner") {
              if(window.location.pathname !== "/") {
                if(window.location.pathname == "/admin") {
                  window.location.href = "/";
                }
              }
            }
        } catch (error) {
              if(window.location.pathname !== "/") {
                window.location.href = "/";
              }
        }
    };

    useEffect(() => {
        checkAuthentication();
    }, []);

    return (
        <Router>
            <RoleContext value={role}>
                <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200 px-10 font-sans">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <LoginPage handlePullRole={handlePullRole} />
                            }
                        />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/scan" element={<ScanPage />} />
                    </Routes>
                </div>
            </RoleContext>
        </Router>
    );
}

export default App;
