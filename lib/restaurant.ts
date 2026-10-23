export type MenuCategory =
  | "Local Favourites"
  | "Nyama & Grilled"
  | "Rice & Everyday"
  | "Breakfast & Snacks"
  | "Drinks";

export type MenuItem = {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  price: number;
  image: string;
  available?: boolean;
  featured?: boolean;
};

export const restaurant = {
  name: "Sahani Kitchen",
  address: "Restaurant address to be confirmed",
  phone: "0703299865",
  whatsappNumber: "254703299865",
  email: "mwendwambula360@gmail.com",
  hours: [
    { day: "Monday", hours: "Hours to be confirmed" },
    { day: "Tuesday", hours: "Hours to be confirmed" },
    { day: "Wednesday", hours: "Hours to be confirmed" },
    { day: "Thursday", hours: "Hours to be confirmed" },
    { day: "Friday", hours: "Hours to be confirmed" },
    { day: "Saturday", hours: "Hours to be confirmed" },
    { day: "Sunday", hours: "Hours to be confirmed" },
  ],
  socials: {
    instagram: "",
    facebook: "",
    tiktok: "",
  },
  serviceOptions: [
    { name: "Dine in", status: "Ask us" },
    { name: "Takeaway", status: "Ask us" },
    { name: "Delivery", status: "Ask us" },
  ],
};

export const menuCategories = [
  "Local Favourites",
  "Nyama & Grilled",
  "Rice & Everyday",
  "Breakfast & Snacks",
  "Drinks",
] as const satisfies readonly MenuCategory[];

export const menuItems: MenuItem[] = [
  {
    id: "ugali-sukuma",
    name: "Ugali with sukuma wiki",
    category: "Local Favourites",
    description: "A comforting Kenyan classic, served fresh and satisfying.",
    price: 350,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=75",
    featured: true,
  },
  {
    id: "ugali-beef",
    name: "Ugali with beef stew",
    category: "Local Favourites",
    description: "Soft ugali with tender beef in a homestyle stew.",
    price: 650,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=75",
    featured: true,
  },
  {
    id: "githeri",
    name: "Githeri",
    category: "Local Favourites",
    description: "A hearty mix of beans and maize, cooked with care.",
    price: 400,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "mukimo",
    name: "Mukimo",
    category: "Local Favourites",
    description: "A filling traditional mash with greens and potatoes.",
    price: 450,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "matoke-beef",
    name: "Matoke with beef stew",
    category: "Local Favourites",
    description: "Tender matoke paired with rich, slow-simmered beef.",
    price: 600,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "nyama-choma",
    name: "Nyama choma",
    category: "Nyama & Grilled",
    description: "A Kenyan grill favourite, served with a tasty side.",
    price: 950,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=75",
    featured: true,
  },
  {
    id: "grilled-chicken",
    name: "Grilled chicken",
    category: "Nyama & Grilled",
    description: "Golden, flavourful chicken fresh from the grill.",
    price: 850,
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "beef-fry",
    name: "Beef fry",
    category: "Nyama & Grilled",
    description: "Well-seasoned beef fry, cooked until tender.",
    price: 700,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "chicken-stew",
    name: "Chicken stew",
    category: "Nyama & Grilled",
    description: "A warming chicken stew with homestyle seasoning.",
    price: 650,
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "pilau",
    name: "Pilau",
    category: "Rice & Everyday",
    description: "Fragrant spiced rice, a much-loved Kenyan favourite.",
    price: 550,
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=75",
    featured: true,
  },
  {
    id: "beef-biryani",
    name: "Beef biryani",
    category: "Rice & Everyday",
    description: "Aromatic rice layered with warmly spiced beef.",
    price: 700,
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "rice-beans",
    name: "Rice with beans",
    category: "Rice & Everyday",
    description: "A wholesome everyday plate with rice and beans.",
    price: 400,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "chapati-beans",
    name: "Chapati with beans",
    category: "Rice & Everyday",
    description: "Soft chapati alongside a hearty bean stew.",
    price: 350,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "chapati-beef",
    name: "Chapati with beef stew",
    category: "Rice & Everyday",
    description: "Fresh chapati served with tender beef stew.",
    price: 600,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "mandazi",
    name: "Mandazi",
    category: "Breakfast & Snacks",
    description: "A soft, lightly sweet bite for any time of day.",
    price: 60,
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "chapati",
    name: "Chapati",
    category: "Breakfast & Snacks",
    description: "A soft, freshly made Kenyan flatbread.",
    price: 80,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "boiled-eggs",
    name: "Boiled eggs",
    category: "Breakfast & Snacks",
    description: "A simple, nourishing breakfast or snack.",
    price: 80,
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "kenyan-tea",
    name: "Kenyan tea",
    category: "Breakfast & Snacks",
    description: "A warming cup of Kenyan-style tea.",
    price: 100,
    image:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "samosas",
    name: "Samosas",
    category: "Breakfast & Snacks",
    description: "Crisp, golden parcels with a savoury filling.",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "fresh-juice",
    name: "Fresh juice",
    category: "Drinks",
    description: "A refreshing glass of seasonal fruit juice.",
    price: 250,
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "bottled-water",
    name: "Bottled water",
    category: "Drinks",
    description: "Chilled bottled water.",
    price: 100,
    image:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "soda",
    name: "Soda",
    category: "Drinks",
    description: "A chilled soft drink.",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=75",
  },
  {
    id: "african-tea",
    name: "African tea",
    category: "Drinks",
    description: "Rich, comforting tea brewed the local way.",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=75",
  },
];
