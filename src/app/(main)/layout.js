"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "react-hot-toast";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            // alignContent: "stretch",
            flexDirection: "column",
            overflow: "hidden",
            marginLeft: 0,
            minWidth: 0, // prevent flex blowout
          }}
          className="main-content"
        >
          {/* Navbar */}
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          {/* Page Content */}
          <main
            style={{
              flex: 1,
              overflow: "auto",
              background: "#ffffff",
            }}
          >
            {children}
          </main>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              color: "#111827",
              borderRadius: "0.75rem",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              padding: "1rem",
              fontSize: "0.875rem",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </div>

      {/* <style jsx global>{`
        @media (min-width: 768px) {
          .main-content {
            margin-left: 16rem !important;
          }
        }
      `}</style> */}
    </SessionProvider>
  );
}
