import { Navigate } from "react-router-dom";

// import React from 'react'

const ProtectedRoutes = ({ children }) => {

    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/login" />;
    }
    return children
}

export default ProtectedRoutes;

