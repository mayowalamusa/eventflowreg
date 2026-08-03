/**
 * Thin navigation compatibility layer.
 *
 * The design system pages were authored against a plain path-string routing API.
 * This module maps that API onto TanStack Router so the design files stay
 * untouched and reusable, while navigation, links and params are fully typed
 * at the router level.
 */
import { forwardRef, type AnchorHTMLAttributes } from "react";
import {
  Link as RouterLink,
  Outlet,
  useNavigate as useRouterNavigate,
  useParams as useRouterParams,
  useRouterState,
} from "@tanstack/react-router";

export { Outlet };

type ParsedPath = { to: string; search: Record<string, string> };

function parsePath(path: string): ParsedPath {
  const [to, query = ""] = path.split("?");
  const search: Record<string, string> = {};
  new URLSearchParams(query).forEach((value, key) => {
    search[key] = value;
  });
  return { to: to || "/", search };
}

export type NavigateFn = (path: string, options?: { replace?: boolean }) => void;

export function useNavigate(): NavigateFn {
  const navigate = useRouterNavigate();
  return (path, options) => {
    const { to, search } = parsePath(path);
    navigate({ to, search, replace: options?.replace } as never);
  };
}

export function useLocation() {
  return useRouterState({ select: (s) => s.location });
}

export function useParams(): Record<string, string | undefined> {
  return useRouterParams({ strict: false }) as Record<string, string | undefined>;
}

export function useSearchParams(): [URLSearchParams] {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  return [new URLSearchParams(searchStr)];
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string };

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  const parsed = parsePath(to);
  const linkProps = { to: parsed.to, search: parsed.search, ...rest } as never;
  return <RouterLink ref={ref} {...(linkProps as object)} />;
});
