import { Link } from "react-router-dom";
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
                title: "Account Settings",
                url: "/brand/settings",
                icon: <Settings2Icon />,
            },
        ],
    },
};

export function AppSidebar({ role = "creator", ...props }) {
    const config = sidebarConfig[role];

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
                <NavMain items={config.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={config.user} />
            </SidebarFooter>
        </Sidebar>
    );
}
