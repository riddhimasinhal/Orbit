import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";
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
  MessageSquareIcon,
  MegaphoneIcon,
  FileTextIcon,
  HandshakeIcon,
  FolderOpenIcon,
  ShieldCheckIcon,
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
        title: "Portfolio",
        url: "/creator/portfolio",
        icon: <FolderOpenIcon />,
      },
      {
        title: "Browse Brands",
        url: "/creator/browse",
        icon: <SearchIcon />,
      },
      {
        title: "Campaigns",
        url: "/creator/campaigns",
        icon: <MegaphoneIcon />,
      },
      {
        title: "My Applications",
        url: "/creator/applications",
        icon: <FileTextIcon />,
      },
      {
        title: "Collaborations",
        url: "/creator/collaborations",
        icon: <HandshakeIcon />,
      },
      {
        title: "Requests",
        url: "/creator/requests",
        icon: <InboxIcon />,
      },
      {
        title: "Messages",
        url: "/creator/messages",
        icon: <MessageSquareIcon />,
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
        title: "Campaigns",
        url: "/brand/campaigns",
        icon: <MegaphoneIcon />,
      },
      {
        title: "Collaborations",
        url: "/brand/collaborations",
        icon: <HandshakeIcon />,
      },
      {
        title: "Requests",
        url: "/brand/requests",
        icon: <InboxIcon />,
      },
      {
        title: "Messages",
        url: "/brand/messages",
        icon: <MessageSquareIcon />,
      },
      {
        title: "Account Settings",
        url: "/brand/settings",
        icon: <Settings2Icon />,
      },
    ],
  },
  admin: {
    label: "Admin",
    homeUrl: "/admin/verifications",
    user: {
      name: "Orbit Admin",
      email: "admin@orbit.com",
      avatar: "",
    },
    navMain: [
      {
        title: "Verification Requests",
        url: "/admin/verifications",
        icon: <ShieldCheckIcon />,
      },
    ],
  },
};

export function AppSidebar({ role = "creator", user, ...props }) {
  const config = sidebarConfig[role] || sidebarConfig.creator;
  const displayUser = user || config.user;
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (role === "admin") {
      const fetchAdminCount = async () => {
        try {
          const res = await api.get("/admin/verifications?limit=1");
          setPendingCount(res.data?.pagination?.total || 0);
        } catch {
          // ignore
        }
      };
      fetchAdminCount();

      const interval = setInterval(fetchAdminCount, 30000);
      return () => clearInterval(interval);
    }

    const fetchCount = async () => {
      try {
        const res = await api.get("/connections/count");
        setPendingCount(res.data.count);
        console.log("Pending requests:", res.data.count);
      } catch {
        console.log("Failed to fetch count");
      }
    };
    fetchCount();

    // refresh count every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [role]);

  // add badge to requests nav item
  const navItems = config.navMain.map((item) => {
    if ((item.title === "Requests" || item.title === "Verification Requests") && pendingCount > 0) {
      return { ...item, badge: pendingCount };
    }
    return item;
  });

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
