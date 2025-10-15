// styles/theme.ts
export interface Theme {
  background: string;
  card: string;
  text: string;
  subText: string;
  border: string;
  accent: string;
}

export const lightTheme: Theme = {
  background: "#F0F0F0",
  card: "#FFFFFF",
  text: "#000000",
  subText: "#666666",
  border: "#E5E5E5",
  accent: "#228B22", // 초록색 포인트
};

export const darkTheme: Theme = {
  background: "#121212",
  card: "#1E1E1E",
  text: "#FFFFFF",
  subText: "#AAAAAA",
  border: "#333333",
  accent: "#32CD32", // 밝은 초록 포인트
};
