// Category labels and dropdown groups from pages 3–9 of the brand PDF.
export const PDF_CATEGORIES = [
  { name: 'Ghee & Oils', items: [
    ['Wood-Pressed Oil (1 & 5 Ltr)', 'Oil'], ['Ghee (1 & 5 Ltr)', 'Ghee'],
  ] },
  { name: 'Sweetners', items: [['Jaggery', 'Jaggery'], ['Honey', 'Honey']] },
  { name: 'Millets & Whole Grains', items: [['Millets (1 & 5 kg)', 'Millet'], ['Whole Grains (1 & 5 kg)', '']] },
  { name: 'Flours & Soji', items: [['Flours (2 & 5 kg)', 'Flour'], ['Soji', 'Suji']] },
  { name: 'Cereals', items: [['Oats', 'Oats'], ['Muesli', 'Muesli'], ['Granola', 'Granola'], ['Peanut Butter', 'Peanut Butter']] },
  { name: 'Snacks', items: [['Makhana', 'Makhana'], ['Edamame', 'Edamame'], ['Matcha', 'Matcha'], ['Chips', 'Chips'], ['Noodles & Pasta', '']] },
  { name: 'Wellness', items: [
    ['Sea Buckthorn', 'Sea Buckthorn'], ['Psyllium Husk (Isabgol)', 'Isabgol'],
    ['Ashwagandha', 'Ashwagandha'], ['Giloy', 'Giloy'], ['Brahmi', 'Brahmi'],
    ['Shilajit', 'Shilajit'], ['Berberine', 'Berberine'], ['Triphala', 'Triphala'],
    ['Harad', 'Harad'], ['Amla', 'Amla'], ['Baheda', 'Baheda'],
  ] },
  { name: 'Dals & Pulses', items: [
    ['Toor Dal (Pigeon Pea)', 'Toor'], ['Moong Dal (Green Gram)', 'Moong'],
    ['Chana Dal (Bengal Gram)', 'Chana'], ['Masoor Dal (Red Lentil)', 'Masoor'], ['Urad Dal (Black Gram)', 'Urad'],
  ] },
  { name: 'Salt & Spices', items: [['Salt', 'Salt'], ['Spices', '']] },
  { name: 'Nuts & Seeds', items: [['Nuts', ''], ['Seeds', 'Seeds']] },
].map(({ name, items }) => ({
  name,
  slug: name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'),
  items: items.map(([label, search]) => ({ label, search })),
}));

export function categoryPath(category, item) {
  const params = new URLSearchParams({ category: category.name });
  if (item) {
    params.set('subcategory', item.label);
    if (item.search) params.set('search', item.search);
  }
  return `/products?${params}`;
}
