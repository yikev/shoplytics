import "./globals.css";
import Providers from "./providers";
import TopNav from "@/components/TopNav";

export const metadata = { title: "Shoplytics Demo" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Providers>
          <TopNav />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}