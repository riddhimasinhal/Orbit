import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
    const navigate = useNavigate();
    return (
        <div>
            Orbit
            <Button onClick={() => navigate("/signup")} >Get Started</Button>
            <Button onClick={() => navigate("/login")} >Log in</Button>
        </div>
    )
}

export default LandingPage;
