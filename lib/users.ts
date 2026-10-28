export type DemoUser = {
  id: string;
  email: string;
  name: string;
  teamName: string;
  plan: "free" | "pro" | "enterprise";
};

export const USERS: DemoUser[] = [
  { id: "u-1", email: "ann@example.com", name: "Ann", teamName: "Growth", plan: "free" },
  { id: "u-2", email: "bob@example.com", name: "Bob", teamName: "Platform", plan: "pro" },
  { id: "u-3", email: "cy@example.com", name: "Cy", teamName: "Platform", plan: "enterprise" },
];
