import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router';
import { getCollection, getCollections, toDisplayProduct } from '../api';
import ProductCard from '../components/ProductCard';
import { ContentGridSkeleton, CollectionDetailSkeleton } from '../components/Skeleton';

export function CollectionsListPage() {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        getCollections().then(result => { if (active) setCollections(result); })
            .catch(reason => { if (active) setError(reason.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);
    return <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 bg-[#FAFAF7]"><div className="mx-auto flex max-w-7xl gap-2 px-4 py-3 text-xs text-gray-500 lg:px-8"><Link to="/">Home</Link><span>›</span><span className="font-medium text-[#2C1A0E]">Collections</span></div></div>
      <header className="bg-[#2D5A2E] px-4 py-14 text-center text-white"><h1 className="font-display text-3xl font-bold lg:text-4xl">Shop by Collection</h1><p className="mt-2 text-sm text-white/80">Explore curated collections from Earth Mitra</p></header>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {loading && <ContentGridSkeleton count={6} label="Loading collections…" gridClassName="grid gap-7 sm:grid-cols-2 lg:grid-cols-3" />}
        {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">Unable to load collections: {error}</p>}
        {!loading && !error && collections.length === 0 && <p className="py-12 text-center text-sm text-gray-500">No collections are published yet.</p>}
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{collections.map(collection => <Link key={collection._id} to={`/collections/${collection.slug}`} className="group overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="relative h-56 overflow-hidden bg-[#F5F1EB]">{collection.image && <img src={collection.image} alt={collection.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}<div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"/><div className="absolute bottom-0 p-5"><span className="text-xs font-semibold uppercase tracking-widest text-white/80">{collection.productCount || 0} Products</span><h2 className="mt-1 text-xl font-bold text-white">{collection.name}</h2></div></div>
          <div className="p-5"><p className="line-clamp-3 min-h-12 text-sm leading-relaxed text-gray-600">{collection.description}</p><span className="mt-4 inline-block text-sm font-bold text-[#2D5A2E]">Shop now →</span></div>
        </Link>)}</div>
      </main>
    </div>;
}

export function CollectionDetailPage() {
    const { slug } = useParams();
    const { addToCart } = useOutletContext();
    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        setLoading(true);
        getCollection(slug).then(result => { if (active) setCollection(result); })
            .catch(reason => { if (active) setError(reason.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [slug]);
    if (loading) return <CollectionDetailSkeleton />;
    if (error || !collection) return <div className="grid min-h-[50vh] place-items-center px-5 text-center"><div><p className="mb-4 text-gray-500">{error ? `Unable to load collection: ${error}` : 'Collection not found'}</p><Link to="/collections" className="font-semibold text-[#2D5A2E] underline">Back to collections</Link></div></div>;
    const products = (collection.products || []).map(toDisplayProduct);
    return <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 bg-[#FAFAF7]"><div className="mx-auto flex max-w-7xl gap-2 px-4 py-3 text-xs text-gray-500 lg:px-8"><Link to="/">Home</Link><span>›</span><Link to="/collections">Collections</Link><span>›</span><span className="font-medium text-[#2C1A0E]">{collection.name}</span></div></div>
      <header className="relative overflow-hidden bg-[#F5F1EB] px-4 py-14">{collection.image && <img src={collection.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20"/>}<div className="relative mx-auto max-w-7xl"><h1 className="font-display text-3xl font-bold text-[#2D5A2E] lg:text-4xl">{collection.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-700">{collection.description}</p><span className="mt-3 inline-block text-xs font-semibold uppercase tracking-widest text-gray-500">{products.length} Products</span></div></header>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">{products.length ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map(product => <ProductCard key={product.id} product={product} onAddToCart={addToCart}/>)}</div> : <p className="py-16 text-center text-sm text-gray-500">This collection has no products yet.</p>}</main>
    </div>;
}
