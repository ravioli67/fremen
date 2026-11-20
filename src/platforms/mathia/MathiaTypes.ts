import type { NavigationResult } from "../../core/Platform.js";

export interface DashboardInfo {
  userGreeting: string;
  activeCourseId?: string;
  activeLessonId?: string;
  currentActivityTitle: string;
  lessonsCompleted: number;
  lessonsRemaining: number;
  dailyGoals: Goal[];
}

export interface Goal {
  taskName: string;
  completed: boolean;
  dueDate?: string;
}

export interface ActivityInfo {
  activityId: string;
  title: string;
  type: "math" | "activity" | "assessment";
  difficulty: string;
  estimatedTimeMinutes: number;
  isCompleted: boolean;
  startTime?: string;
  endTime?: string;
}

export interface ProblemInfo {
  problemId: string;
  questionText: string;
  options: (string | null)[];
  difficulty: string;
  hintsAvailable: boolean;
  timeLimitSeconds?: number;
}

export interface NavigationDestination {
  label: string;
  route: string;
  urlPattern?: string;
  category: "course" | "dashboard" | "settings" | "activity" | "other";
}

/** Mathia navigation result: the shared result plus how navigation completed. */
export interface MathiaNavigationResult extends NavigationResult {
  navigationType: "direct" | "redirected" | "error";
  verificationStatus: "success" | "partial" | "failed";
}

export interface InspectionError {
  type: "element_not_found" | "network_error" | "parse_error" | "timeout";
  detail: string;
  timestamp: Date;
}

export interface MathiaPageInfo {
  url: string;
  title: string;
  headings: string[];
  buttons: string[];
  links: {
    text: string;
    href: string | null;
  }[];
  forms: {
    label: string;
    type: string;
  }[];
  loading: boolean;
  dashboard?: DashboardInfo;
  activities?: ActivityInfo[];
  problems?: ProblemInfo[];
  navigationDestinations?: NavigationDestination[];
  timestamp: string;
}

export interface MathiaInspectionResult {
  success: boolean;
  page?: MathiaPageInfo;
  errors: InspectionError[];
  dashboard?: DashboardInfo;
  activities?: ActivityInfo[];
  problems?: ProblemInfo[];
}
