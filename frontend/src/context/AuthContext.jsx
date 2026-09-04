import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../services/api";


const AuthContext = createContext();


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);


    // ==========================================
    // LOAD CURRENT LOGGED-IN USER
    // ==========================================

    const loadUser = async () => {

        const token =
            localStorage.getItem("token");


        if (!token) {

            setUser(null);

            setLoading(false);

            return null;
        }


        try {

            const response =
                await api.get("/auth/me");


            console.log(
                "Logged in user:",
                response.data
            );


            setUser(response.data);


            return response.data;


        } catch (error) {

            console.error(
                "Unable to load user:",
                error
            );


            localStorage.removeItem("token");

            setUser(null);


            return null;


        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // LOAD USER WHEN APPLICATION STARTS
    // ==========================================

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