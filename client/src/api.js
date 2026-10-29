// Keep frontend and API on the same hostname in local development. Cookies are
// host-scoped, so hard-coding `localhost` breaks sessions when the app is opened
// through `127.0.0.1` (or another local hostname).
const defaultApiOrigin = typeof window === "undefined"
  ? "http://localhost:5000"
  : `${window.location.protocol}//${window.location.hostname}:5000`;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || `${defaultApiOrigin}/api`).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status})`);
  return payload;
}

export function toDisplayProduct(product) {
  const originalPrice = Number(product.price || 0);
  const discountedPrice = Number(product.discountPrice || 0);
  const hasDiscount = discountedPrice > 0 && discountedPrice < originalPrice;
  const imageList = product.gallery?.length ? product.gallery : product.images || [];
  const image = imageList.find((item) => item?.url)?.url || "";
  const price = hasDiscount ? discountedPrice : originalPrice;
  return {
    ...product,
    id: product._id,
    img: image,
    price,
    originalPrice: hasDiscount ? originalPrice : null,
    save: hasDiscount ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : null,
    rating: product.ratingSummary?.average ?? product.avgRating ?? 0,
    reviews: product.ratingSummary?.count ?? product.numReviews ?? 0,
    category: typeof product.category === "object" ? product.category?.name || "" : "",
    weight: product.variants?.[0]?.name || product.variants?.[0]?.attributes?.find((attribute) => /weight/i.test(attribute.name))?.value || "",
  };
}

export async function getProducts({ page = 1, limit = 100, search, category, minPrice, maxPrice, sort } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  for (const [key, value] of Object.entries({ search, category, minPrice, maxPrice, sort })) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const result = await request(`/products?${params}`);
  return { ...result, products: (result.products || []).map(toDisplayProduct) };
}

export async function getProduct(slug) {
  const product = await request(`/products/${encodeURIComponent(slug)}`);
  return toDisplayProduct(product);
}

export async function getProductReviews(productId, { page = 1, limit = 10, rating } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (rating) params.set("rating", String(rating));
  return request(`/products/${encodeURIComponent(productId)}/reviews?${params}`);
}

export async function getCategories() {
  return request("/categories");
}

export async function phoneTestLogin(phone, otp) {
  return request("/auth/phone-test-login", { method: "POST", body: JSON.stringify({ phone, otp }) });
}

export async function requestEmailOtp(email) {
  return request("/auth/email-otp/request", { method: "POST", body: JSON.stringify({ email }) });
}

export async function verifyEmailOtp(email, otp) {
  return request("/auth/email-otp/verify", { method: "POST", body: JSON.stringify({ email, otp }) });
}

export async function passwordLogin(email, password) {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function getCurrentUser() {
  return request("/users/me");
}

export async function logoutUser() {
  return request("/auth/logout", { method: "POST" });
}

