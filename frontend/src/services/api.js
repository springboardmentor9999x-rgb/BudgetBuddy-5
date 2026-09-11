import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
    baseURL: "https://budgetbuddy-5-production.up.railway.app",
    headers: {
        "Content-Type": "application/json",
    },
});


/*
==================================================
ATTACH JWT TOKEN TO EVERY REQUEST
==================================================
*/

api.interceptors.request.use(
    (config) => {

        const token = localStorage.getItem("token");

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;

        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


/*
==================================================
HANDLE UNAUTHORIZED RESPONSE
==================================================
*/

api.interceptors.response.use(

    (response) => {
        return response;
    },

    (error) => {

        if (error.response?.status === 401) {

            console.log(
                "Login session expired"
            );

            // Remove expired token
            localStorage.removeItem("token");

            // Remove stored user information if you have it
            localStorage.removeItem("user");

            // Show notification
            toast.error(
                "Your login session has expired. Please login again."
            );

            // Redirect to login page
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }

);

export default api;