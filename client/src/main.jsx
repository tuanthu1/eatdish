import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
  import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId="365597656150-tfku5o5k3ccs3vif1vlas1dnmiu166rj.apps.googleusercontent.com">
    <App />
</GoogleOAuthProvider>
)
