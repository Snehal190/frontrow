import { Profile } from "@/components/connections/Profile";

export const metadata = { title: "Connections · FrontRow" };

export default function Page() {
  return <Profile connectionsOnly />;
}
