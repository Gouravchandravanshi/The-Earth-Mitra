import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getCurrentUser, logoutUser } from '../api';
export default function Root() {
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null);
    const userActionRef = useRef(false);
    useEffect(() => {
        let active = true;
        getCurrentUser().then((currentUser) => {
            if (active && !userActionRef.current) setUser(currentUser);
        }).catch(() => {
            if (active && !userActionRef.current) setUser(null);
        });
        return () => { active = false; };
    }, []);
    function addToCart(product) {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing)
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...product, qty: 1 }];
        });
    }
    function removeFromCart(id) {
        setCartItems(prev => prev.filter(i => i.id !== id));
    }
    function login(currentUser) {
        userActionRef.current = true;
        setUser(currentUser);
    }
    async function logout() {
        userActionRef.current = true;
        setUser(null);
        try { await logoutUser(); } catch { /* A missing/expired session is already logged out locally. */ }
    }
    const ctx = { addToCart, cartItems, user, login, logout };
    const { pathname } = useLocation();
    // ADDED (new flow): checkout page has its own minimal header, so hide the main Navbar/Footer there
    const isCheckout = pathname === '/checkout';
    return (<div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {!isCheckout && <Navbar cartItems={cartItems} onRemoveCart={removeFromCart} user={user} onLogin={login} onLogout={logout}/>}
      <main className="flex-1">
        <Outlet context={ctx}/>
      </main>
      {!isCheckout && <Footer />}
    </div>);
}
