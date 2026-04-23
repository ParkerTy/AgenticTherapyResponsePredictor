import "./globals.css";

export const metadata = {
  title: "Agentic Therapy Response Predictor",
  description: "A reusable agentic AI scientist for therapy response prediction and generative lead benchmarking across oncology disease contexts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}