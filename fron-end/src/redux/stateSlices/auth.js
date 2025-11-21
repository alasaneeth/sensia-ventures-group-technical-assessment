import { createSlice } from "@reduxjs/toolkit";
import { setAuthToken } from "../../api/axiosSettings";

const initialState = {
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem("token"),
    loggedInNow: false,
};

// Initialize auth token from localStorage
if (initialState.token) {
    setAuthToken(initialState.token);
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.accessToken;
            state.loggedInNow = true;

            // Save token to localStorage
            localStorage.setItem("token", action.payload.accessToken);

            console.log("action: ", action.payload.accessToken);
            // Set token for API requests
            setAuthToken(action.payload.accessToken);
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            console.log(" I WILL REOMVE OT");

            // Remove token from localStorage
            localStorage.removeItem("token");

            // Remove token from API requests
            setAuthToken(null);
        },
        // {user: {}, accessToken: "sdf"}
        setSession: (state, action) => {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.accessToken;
            console.log("action: ", action.payload.accessToken);

            // Set token for API requests
            setAuthToken(action.payload.accessToken);
        },
    },
});

export const { login, logout, setSession } = authSlice.actions;

export default authSlice.reducer;
