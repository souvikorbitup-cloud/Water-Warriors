"use client";

import React, { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import Logo from "@/components/icons/Logo";
import { LayoutDashboard, UserCircle, ChevronDown, Mail } from "lucide-react";
import {
  canAccess,
  PERMISSIONS,
  type Permission,
} from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/roles";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permission?: Permission;
  children?: NavItem[];
};

type MenuSection = {
  title: string;
  items: NavItem[];
};

const menuSections: MenuSection[] = [
  {
    title: "Menu",
    items: [
      {
        icon: <LayoutDashboard />,
        name: "Dashboard",
        path: "/admin",
        permission: PERMISSIONS.dashboardView,
      },
      {
        icon: <UserCircle />,
        name: "Profile",
        path: "/admin/profile",
        permission: PERMISSIONS.profileView,
      },
    ],
  },

  {
    title: "Submissions",
    items: [
      {
        name: "Contact Us Submissions",
        icon: <Mail />,
        path: "/admin/submissions/contact-us",
        permission: PERMISSIONS.AllContactUsSubmissionsView,
      },
    ],
  },

  {
    title: "Content",
    items: [],
  },
];

export default function AppSidebar({ role }: { role: Role }) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();

  const pathname = usePathname();

  const [openItems, setOpenItems] = useState<string[]>([]);

  const showMenuLabels = isExpanded || isHovered || isMobileOpen;

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  const isActive = useCallback(
    (path?: string) => path === pathname,
    [pathname],
  );

  const toggleItem = (name: string) => {
    setOpenItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name],
    );
  };

  /**
   * Checks whether an item itself or any of its children
   * can be accessed by the current role.
   */
  const hasAccessibleItems = useCallback(
    (item: NavItem): boolean => {
      const hasOwnPermission =
        item.permission !== undefined && canAccess(role, item.permission);

      const hasAccessibleChildren =
        item.children?.some((child) => hasAccessibleItems(child)) ?? false;

      return hasOwnPermission || hasAccessibleChildren;
    },
    [role],
  );

  /**
   * Checks whether an item or any of its children
   * matches the current pathname.
   */
  const hasActiveChild = useCallback(
    (item: NavItem): boolean => {
      if (item.path && isActive(item.path)) {
        return true;
      }

      return item.children?.some((child) => hasActiveChild(child)) ?? false;
    },
    [isActive],
  );

  /**
   * Automatically open parent menus when one of their
   * children matches the current route.
   */
  useEffect(() => {
    const activeParents: string[] = [];

    const collectActiveParents = (items: NavItem[]) => {
      items.forEach((item) => {
        if (item.children?.length) {
          const childIsActive = item.children.some((child) =>
            hasActiveChild(child),
          );

          if (childIsActive) {
            activeParents.push(item.name);
          }

          collectActiveParents(item.children);
        }
      });
    };

    menuSections.forEach((section) => collectActiveParents(section.items));

    setOpenItems((prev) => [...new Set([...prev, ...activeParents])]);
  }, [pathname, hasActiveChild]);

  const renderMenuItems = (items: NavItem[], level = 0) => (
    <ul className={`flex flex-col gap-1 ${level > 0 ? "ml-4 mt-1" : ""}`}>
      {items.map((nav) => {
        // Hide items that have neither accessible permission
        // nor accessible children.
        if (!hasAccessibleItems(nav)) {
          return null;
        }

        const accessibleChildren =
          nav.children?.filter((child) => hasAccessibleItems(child)) ?? [];

        const hasChildren = accessibleChildren.length > 0;
        const isOpen = openItems.includes(nav.name);
        const isItemActive = hasActiveChild(nav);

        return (
          <li key={nav.name}>
            <div className="flex flex-col">
              <div className="flex items-center">
                {nav.path ? (
                  <Link
                    href={nav.path}
                    className={`menu-item group flex-1 ${
                      isItemActive ? "menu-item-active" : "menu-item-inactive"
                    }`}
                  >
                    <span
                      className={`${
                        isItemActive
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {nav.icon}
                    </span>

                    {showMenuLabels && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleItem(nav.name)}
                    className={`menu-item group flex justify-between cursor-pointer ${
                      isItemActive ? "menu-item-active" : "menu-item-inactive"
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      <span
                        className={`${
                          isItemActive
                            ? "menu-item-icon-active"
                            : "menu-item-icon-inactive"
                        }`}
                      >
                        {nav.icon}
                      </span>

                      {showMenuLabels && (
                        <span className="menu-item-text">{nav.name}</span>
                      )}
                    </div>
                    {hasChildren && showMenuLabels && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>
                )}
              </div>

              {hasChildren && isOpen && showMenuLabels && (
                <div className="ml-1">
                  {renderMenuItems(accessibleChildren, level + 1)}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-72.5"
            : isHovered
              ? "w-72.5"
              : "w-22.5"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="py-8 flex lg:justify-center">
        <Link href="/">
          {showMenuLabels ? (
            <Logo className="hidden h-15 w-auto max-w-37.5 lg:block" />
          ) : (
            <Logo className="h-10 w-10" />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {menuSections.map((section) => {
              const accessibleItems = section.items.filter((item) =>
                hasAccessibleItems(item),
              );

              if (accessibleItems.length === 0) {
                return null;
              }

              return (
                <div key={section.title}>
                  <h2
                    className={`mb-2 text-xs uppercase flex leading-5 text-gray-400 ${
                      !isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "justify-start"
                    }`}
                  >
                    {showMenuLabels ? section.title : null}
                  </h2>

                  {renderMenuItems(accessibleItems)}
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
