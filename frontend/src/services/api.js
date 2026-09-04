import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

// ==================================================
// ADD CURRENT TOKEN TO EVERY REQUEST
// ==================================================

api.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem("token");

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;

        } else {

            delete config.headers.Authorization;

        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


// ==================================================
// HANDLE UNAUTHORIZED REQUESTS
// ==================================================

api.interceptors.response.use(

    (response) => {
        return response;
    },

    (error) => {

        if (
            error.response?.status === 401
        ) {

            localStorage.removeItem("token");

            // Don't redirect automatically here.
            // Login.jsx will handle the login flow.
        }

        return Promise.reject(error);
    }
);


export default api;