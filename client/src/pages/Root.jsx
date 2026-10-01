import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
export default function Root() {
    const [cartItems, setCartItems] = useState([]);
    // ADDED (new flow): logged-in user state (null = logged out). Replace with your real auth/API later.
    const [user, setUser] = useState(null);
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
    // ADDED (new flow): login / logout helpers used by the login popup and account page
    function login(u) { setUser(u); }
    function logout() { setUser(null); }
    // ADDED (new flow): user, login, logout are shared to all pages through the outlet context
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
