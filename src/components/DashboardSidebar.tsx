import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Star,
  Trash2,
  Clock,
  HardDrive,
  Cloud,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/file-utils";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Files", url: "/dashboard/files", icon: FolderOpen },
  { title: "Upload", url: "/dashboard/upload", icon: Upload },
  { title: "Starred", url: "/dashboard/starred", icon: Star },
  { title: "Recent", url: "/dashboard/recent", icon: Clock },
  { title: "Trash", url: "/dashboard/trash", icon: Trash2 },
];

interface DashboardSidebarProps {
  storageUsed: number;
  storageLimit: number;
}

export function DashboardSidebar({ storageUsed, storageLimit }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const usagePercent = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Cloud className="h-7 w-7 text-primary" />
          {!collapsed && (
            <span className="text-lg font-bold text-foreground">CloudVault</span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url ||
                  (item.url !== "/dashboard" && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {!collapsed && (
        <SidebarFooter className="p-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <HardDrive className="h-3.5 w-3.5" />
              <span>Storage</span>
            </div>
            <Progress value={usagePercent} className="h-1.5 mb-1.5" />
            <p className="text-xs text-muted-foreground">
              {formatFileSize(storageUsed)} of {formatFileSize(storageLimit)} used
            </p>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
