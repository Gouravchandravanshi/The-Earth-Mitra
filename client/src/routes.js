import { createBrowserRouter } from 'react-router';
import Root from './pages/Root';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import { BlogsListPage, BlogDetailPage } from './pages/BlogsPage';
import { CollectionsListPage, CollectionDetailPage } from './pages/CollectionsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { PrivacyPolicyPage, RefundPolicyPage, ShippingPolicyPage, TermsPage, CancellationPolicyPage } from './pages/PolicyPages';
// ADDED (new flow): account area (overview / orders / address / profile)
import AccountPage from './pages/AccountPage';
// ADDED (new flow): checkout page
import CheckoutPage from './pages/CheckoutPage';
export const router = createBrowserRouter([
    {
        path: '/',
        Component: Root,
        children: [
            { index: true, Component: HomePage },
            { path: 'products', Component: ProductsPage },
            { path: 'products/:slug', Component: ProductDetailPage },
            { path: 'blogs', Component: BlogsListPage },
            { path: 'blogs/:slug', Component: BlogDetailPage },
            { path: 'recipes/:slug', Component: BlogDetailPage },
            { path: 'collections', Component: CollectionsListPage },
            { path: 'collections/:slug', Component: CollectionDetailPage },
            { path: 'about', Component: AboutPage },
            { path: 'contact', Component: ContactPage },
            { path: 'pages/privacy-policy', Component: PrivacyPolicyPage },
            { path: 'pages/refund-policy', Component: RefundPolicyPage },
            { path: 'pages/shipping-policy', Component: ShippingPolicyPage },
            { path: 'pages/terms-of-service', Component: TermsPage },
            { path: 'pages/cancellation-policy', Component: CancellationPolicyPage },
            // ADDED (new flow): account page after login
            { path: 'pages/account', Component: AccountPage },
            // ADDED (fix): lets the navbar dropdown links (/pages/account/orders, /address, /profile) open the right tab
            { path: 'pages/account/:tab', Component: AccountPage },
            // ADDED (new flow): checkout page (rendered without the main Navbar/Footer, see Root.jsx)
            { path: 'checkout', Component: CheckoutPage },
        ],
    },
]);
