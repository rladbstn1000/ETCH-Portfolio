type category = "field" | "stack" | "sort";

interface Sidebar {
  list: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean, value: string) => void;
}

export interface ProjectSidebar extends Sidebar {
  type: category;
}
