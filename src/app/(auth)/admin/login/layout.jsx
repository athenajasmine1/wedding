// src/app/admin/login/layout.jsx
// This layout applies ONLY to /admin/login and overrides /admin/layout.
// No sidebar—just render the login page content centered on the screen.

export default function LoginLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
