import { Toaster } from "react-hot-toast";

import AppRouter from "./router/AppRouter";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading, logout } = useAuth();

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
        }}
      />

      <AppRouter
        user={user}
        loading={loading}
        onLogout={logout}
      />
    </>
  );
}

export default App;