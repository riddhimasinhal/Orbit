import { Navigate, useLocation } from "react-router-dom";

// import React from 'react'

const ProtectedRoutes = ({ children }) => {

    const token = localStorage.getItem("token");
    const location = useLocation()

    if (!token) {
        return <Navigate to="/login" />;
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        const role = payload.role
        console.log("ProtectedRoutes - role:", role, "path:", location.pathname)

        if (location.pathname.startsWith("/creator") && role !== "creator") {
            console.log("not a creator, redirecting")
            return <Navigate to="/brand/dashboard" />
        }
        if (location.pathname.startsWith("/brand") && role !== "brand") {
            console.log("not a brand, redirecting")
            return <Navigate to="/creator/dashboard" />
        }
    } catch (err) {
        console.log("token parse failed", err)
        localStorage.removeItem("token")
        return <Navigate to="/login" />
    }

    return children
}

export default ProtectedRoutes;

