import { ReactNode } from "react";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16" tabIndex={-1}>
        {children}
      </main>
      <BottomNav />
    </>
  );
};

export default Layout;

