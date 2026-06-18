import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import axios from "axios";

function CreatorLayout() {
    const [userData, setUserData] = useState(null)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token")
                const res = await axios.get("http://localhost:5001/api/creator/profile", {
                    headers: { Authorization: token },
                })
                console.log("Sidebar user data:", res.data.creator?.fullName)
                setUserData(res.data.creator)
            } catch (error) {
                console.log("Failed to load user for sidebar", error)
            }
        }
        fetchUser()
    }, [])

    return (
        <div className="dark [--header-height:calc(--spacing(14))]">
            <SidebarProvider className="flex min-h-svh flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar role="creator" user={userData ? { name: userData.fullName || "Creator", email: userData.instagramUsername ? "@" + userData.instagramUsername : "Creator", avatar: "" } : null} />
                    <SidebarInset>
                        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                            <Outlet />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
}

export default CreatorLayout;
