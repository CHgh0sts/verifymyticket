import SiteHeaderClient from "@/components/SiteHeaderClient";
import SiteFooterClient from "@/components/SiteFooterClient";

export function SiteHeader({ showAuth = true }) {
  return <SiteHeaderClient showAuth={showAuth} />;
}

export function SiteFooter() {
  return <SiteFooterClient />;
}
