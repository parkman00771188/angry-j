export type AngerEpisodeRecord = {
  id: string;
  cause: string;
  causes?: string[];
  memo?: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  status: "saved";
  createdAt: string;
  updatedAt: string;
};

export type CauseOption = {
  id: string;
  label: string;
  color: string;
};

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type AppView = "dashboard" | "records" | "settings";
export type RecorderStatus = "idle" | "recording" | "paused";
export type RangeMode = "day" | "week" | "month" | "custom" | "weekday";

export type DateRange = {
  start: string;
  end: string;
};

export type AppSettings = {
  resetMemoAfterSave: boolean;
  confirmBeforeSave: boolean;
  dateTimeFormat: "24h" | "korean";
};
