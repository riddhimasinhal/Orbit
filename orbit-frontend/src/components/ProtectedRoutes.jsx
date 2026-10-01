import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoutes = ({ children }) => {
    const token = localStorage.getItem("token");
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    let payload;
    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            throw new Error("Invalid token format");
        }
        payload = JSON.parse(atob(parts[1]));
    } catch (err) {
        console.log("Token parse failed:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("onBoardingCompleted");
        return <Navigate to="/login" replace />;
    }

    // Check expiration if exp claim is present
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
        console.log("Token expired");
        localStorage.removeItem("token");
        localStorage.removeItem("onBoardingCompleted");
        return <Navigate to="/login" replace />;
    }

    const role = payload.role;
    const onBoardingCompleted = Boolean(
        payload.onBoardingCompleted ||
        localStorage.getItem("onBoardingCompleted") === "true"
    );

    const pathname = location.pathname;
    const isCreatorOnboarding = pathname === "/creator-onboarding";
    const isBrandOnboarding = pathname === "/brand-onboarding";
    const isCreatorAppRoute = pathname === "/creator" || pathname.startsWith("/creator/");
    const isBrandAppRoute = pathname === "/brand" || pathname.startsWith("/brand/");

    // Role validation & onboarding enforcement
    if (role === "creator") {
        if (isBrandOnboarding || isBrandAppRoute) {
            return <Navigate to={onBoardingCompleted ? "/creator/dashboard" : "/creator-onboarding"} replace />;
        }
        if (!onBoardingCompleted && isCreatorAppRoute) {
            return <Navigate to="/creator-onboarding" replace />;
        }
        if (onBoardingCompleted && isCreatorOnboarding) {
            return <Navigate to="/creator/dashboard" replace />;
        }
    } else if (role === "brand") {
        if (isCreatorOnboarding || isCreatorAppRoute) {
            return <Navigate to={onBoardingCompleted ? "/brand/dashboard" : "/brand-onboarding"} replace />;
        }
        if (!onBoardingCompleted && isBrandAppRoute) {
            return <Navigate to="/brand-onboarding" replace />;
        }
        if (onBoardingCompleted && isBrandOnboarding) {
            return <Navigate to="/brand/dashboard" replace />;
        }
    } else {
        localStorage.removeItem("token");
        localStorage.removeItem("onBoardingCompleted");
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoutes;

