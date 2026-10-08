export type Activity = {
  id: number;
  time: string;
  text: string;
  level: "info" | "success" | "error" | "warning";
};
