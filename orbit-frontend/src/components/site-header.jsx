import { Link, useLocation } from "react-router-dom"
import { SearchForm } from "@/components/search-form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { PanelLeftIcon } from "lucide-react"

const pageTitles = {
  "/creator/dashboard": "Dashboard",
  "/creator/profile": "My Profile",
  "/creator/settings": "Account Settings",
  "/brand/dashboard": "Dashboard",
  "/brand/profile": "Company Profile",
  "/brand/settings": "Account Settings",
}

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const location = useLocation()

  const isBrand = location.pathname.startsWith("/brand")
  const homeUrl = isBrand ? "/brand/dashboard" : "/creator/dashboard"
  const roleLabel = isBrand ? "Brand" : "Creator"
  const pageTitle = pageTitles[location.pathname] ?? "Dashboard"

  return (
    <header
      className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeftIcon />
        </Button>
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={homeUrl}>Orbit {roleLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
      </div>
    </header>
  );
}
