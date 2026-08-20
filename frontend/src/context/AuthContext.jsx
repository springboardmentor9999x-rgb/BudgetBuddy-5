import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {

        const token = localStorage.getItem("token");

        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {

            const response = await api.get("/auth/me");

            setUser(response.data);

        } catch (error) {

            console.log(
                "Unable to load user:",
                error
            );

            localStorage.removeItem("token");
            setUser(null);

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (

        <AuthContext.Provider
            value={{
                user,
                setUser,
                loadUser,
                loading,
            }}
        >

            {children}

        </AuthContext.Provider>

    );
}

export function useAuth() {
    return useContext(AuthContext);
}