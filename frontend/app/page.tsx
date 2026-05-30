import { redirect } from "next/navigation";

// Root redirects into the app shell; proxy.ts handles auth
export default function RootPage() {
  redirect("/dashboard");
}
