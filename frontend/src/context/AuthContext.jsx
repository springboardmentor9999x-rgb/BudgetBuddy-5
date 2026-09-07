import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../services/api";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [loading, setLoading] =
        useState(true);


    /*
    ==================================================
    LOAD CURRENT USER
    ==================================================
    */

    const loadUser = async () => {

        const token =
            localStorage.getItem("token");


        if (!token) {

            setUser(null);
            setLoading(false);

            return;
        }


        try {

            console.log(
                "Loading logged-in user..."
            );


            const response =
                await api.get("/auth/me");


            console.log(
                "Logged-in user:",
                response.data
            );


            setUser(response.data);


        } catch (error) {

            console.error(
                "Failed to load user:",
                error
            );


            /*
             * Only remove token if the server
             * actually says authentication failed.
             */

            if (
                error.response?.status === 401
            ) {

                localStorage.removeItem(
                    "token"
                );

                setUser(null);

            }

        } finally {

            setLoading(false);

        }
    };


    /*
    ==================================================
    LOAD USER WHEN APP STARTS
    ==================================================
    */

    useEffect(() => {

        loadUser();

    }, []);


    /*
    ==================================================
    LOGOUT
    ==================================================
    */

    const logout = () => {

        localStorage.removeItem("token");

        setUser(null);

        window.location.href =
            "/login";
    };


    return (

        <AuthContext.Provider
            value={{
                user,
                setUser,
                loadUser,
                logout,
                loading
            }}
        >

            {children}

        </AuthContext.Provider>

    );
}


export function useAuth() {

    return useContext(AuthContext);

}