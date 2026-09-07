import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
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

        const token =
            localStorage.getItem("token");

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
                "Unauthorized request"
            );

            localStorage.removeItem("token");
        }

        return Promise.reject(error);
    }

);

export default api;