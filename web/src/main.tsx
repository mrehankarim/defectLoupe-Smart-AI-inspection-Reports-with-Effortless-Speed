import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
