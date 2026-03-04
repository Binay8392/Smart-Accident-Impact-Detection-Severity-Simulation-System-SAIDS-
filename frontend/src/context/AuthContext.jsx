import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('saidss_user')) } catch { return null }
    })

    const login = (userData) => {
        setUser(userData)
        localStorage.setItem('saidss_user', JSON.stringify(userData))
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('saidss_user')
    }

    return (
        <AuthCtx.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
            {children}
        </AuthCtx.Provider>
    )
}
