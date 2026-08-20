export const metadata = {
  title: "Scraper Tool",
  description: "Generic web scraper",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, background: "#0a0a0f", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
