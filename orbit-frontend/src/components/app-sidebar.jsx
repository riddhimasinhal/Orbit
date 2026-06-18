import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { NavUser } from "@/components/nav-user";
import { NavMain } from "@/components/nav-main";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
    LayoutDashboardIcon,
    Settings2Icon,
    UserIcon,
    SparklesIcon,
    Building2Icon,
    SearchIcon,
    InboxIcon,
} from "lucide-react";

const sidebarConfig = {
    creator: {
        label: "Creator",
        homeUrl: "/creator/dashboard",
        user: {
            name: "Creator",
            email: "creator@orbit.com",
            avatar: "",
        },
        navMain: [
            {
                title: "Dashboard",
                url: "/creator/dashboard",
                icon: <LayoutDashboardIcon />,
            },
            {
                title: "My Profile",
                url: "/creator/profile",
                icon: <UserIcon />,
            },
            {
                title: "Browse Brands",
                url: "/creator/browse",
                icon: <SearchIcon />,
            },
            {
                title: "Requests",
                url: "/creator/requests",
                icon: <InboxIcon />,
            },
            {
                title: "Account Settings",
                url: "/creator/settings",
                icon: <Settings2Icon />,
            },
        ],
    },
    brand: {
        label: "Brand",
        homeUrl: "/brand/dashboard",
        user: {
            name: "Brand",
            email: "brand@orbit.com",
            avatar: "",
        },
        navMain: [
            {
                title: "Dashboard",
                url: "/brand/dashboard",
                icon: <LayoutDashboardIcon />,
            },
            {
                title: "Company Profile",
                url: "/brand/profile",
                icon: <Building2Icon />,
            },
            {
                title: "Browse Creators",
                url: "/brand/browse",
                icon: <SearchIcon />,
            },
            {
                title: "Requests",
                url: "/brand/requests",
                icon: <InboxIcon />,
            },
            {
                title: "Account Settings",
                url: "/brand/settings",
                icon: <Settings2Icon />,
            },
        ],
    },
};

export function AppSidebar({ role = "creator", user, ...props }) {
    const config = sidebarConfig[role];
    const displayUser = user || config.user;
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const token = localStorage.getItem("token")
                const res = await axios.get("http://localhost:5001/api/connections/count", {
                    headers: { Authorization: token },
                })
                setPendingCount(res.data.count)
                console.log("Pending requests:", res.data.count)
            } catch (error) {
                console.log("Failed to fetch count")
            }
        }
        fetchCount()

        // refresh count every 30 seconds
        const interval = setInterval(fetchCount, 30000)
        return () => clearInterval(interval)
    }, [])

    // add badge to requests nav item
    const navItems = config.navMain.map((item) => {
        if (item.title === "Requests" && pendingCount > 0) {
            return { ...item, badge: pendingCount }
        }
        return item
    })

    return (
        <Sidebar
            className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to={config.homeUrl}>
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <SparklesIcon className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">Orbit</span>
                                    <span className="truncate text-xs">{config.label}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={displayUser} />
            </SidebarFooter>
        </Sidebar>
    );
}
