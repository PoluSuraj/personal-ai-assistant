import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { Provider } from 'react-redux'
import Layout from './components/Layout.jsx'
import AdminLayout from './components/AdminLayout.jsx'

import Home from './pages/Home.jsx'
import Features from './pages/Features.jsx'
import About from './pages/About.jsx'
import store from './store/store.js'
import Chat from './pages/Chat.jsx'
import Quiz from './pages/Quiz.jsx'
import Wikipedia from './pages/Wikipedia.jsx'
import Youtube from './pages/Youtube.jsx'
import LoginSignup from './components/LoginSignup.jsx'
import ForgotPassword from './components/ForgotPassword.jsx'
import ResetPassword from './components/ResetPassword.jsx'
import ContactUs from './pages/ContactUs.jsx'
import Terms from './pages/Terms.jsx'
import Dashboard from './pages/Home.jsx'
import UserSettings from './pages/UserSettings.jsx'
import AdminInbox from './pages/AdminInbox.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Notifications from './pages/Notifications.jsx'
import AdminNotifications from './pages/AdminNotifications.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import OtpVerification from './components/OtpVerification.jsx'
import theme from './theme.js'




const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        // Authenticated Layout Routes
        element: <Layout />,
        children: [
          {
            path: '/',
            element: <Home />
          },
          {
            path: '/features',
            element: <Features />
          },
          {
            path: '/about',
            element: <About />
          },
          {
            path: '/chat',
            element: <Chat />
          },
          {
            path: '/youtube-recommendation',
            element: <Youtube />,
          },
          {
            path: '/wikipedia-search',
            element: <Wikipedia />
          }, {
            path: "/quiz",
            element: <Quiz />
          },
          {
            path: '/userSettings',
            element: <UserSettings />,
          },
          {
            path: '/notifications',
            element: <Notifications />,
          }
        ]
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          {
            path: '/admin',
            element: <AdminDashboard />,
          },
          {
            path: '/admin/inbox',
            element: <AdminInbox />,
          },
          {
            path: '/admin/notifications',
            element: <AdminNotifications />,
          },
          {
            path: '/admin/users',
            element: <AdminUsers />,
          }
        ]
      },
      {
        // Public / Full Screen Routes (No Sidebar/Navbar)
        path: "/authentication/:type",
        element: <LoginSignup />
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />
      },
      {
        path: "/reset-password",
        element: <ResetPassword />
      },
      {
        path: "/contact-us",
        element: <ContactUs />
      },
      {
        path: "/terms",
        element: <Terms />
      },
      {
        path: "/otpVerification/:email",
        element: <OtpVerification />
      },
    ]
  }
])


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <RouterProvider router={router} />
      </ChakraProvider>
    </Provider>
  </StrictMode>,
)
