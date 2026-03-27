import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CharacterProvider } from './contexts/CharacterContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <CharacterProvider>
      <App />
    </CharacterProvider>
  </AuthProvider>
);
