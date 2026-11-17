
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
  timestamp: string;
}

export interface MathiaInspectionResult {
  success: boolean;
  page?: MathiaPageInfo;
  error?: string;
}
