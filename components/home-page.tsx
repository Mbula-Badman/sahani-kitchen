"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  menuCategories,
  restaurant,
  type MenuCategory,
  type MenuItem,
} from "@/lib/restaurant";

const money = (amount: number) =>
  `KSh ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(amount)}`;

function Icon({
  name,
  className = "",
}: {
  name: "arrow" | "pin" | "phone" | "search" | "plus" | "minus" | "close" | "menu";
  className?: string;
}) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    phone: (
      <path d="M21 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 9.5a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14m-7-7h14" />,
    minus: <path d="M5 12h14" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  };
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function WhatsAppLink({
  message,
  className,
  children,
  onMissing,
}: {
  message: string;
  className: string;
  children: React.ReactNode;
  onMissing: () => void;
}) {
  const number = restaurant.whatsappNumber.replace(/\D/g, "");
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : undefined;

  return href ? (
    <a
      className={className}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ) : (
    <button className={className} onClick={onMissing} type="button">
      {children}
    </button>
  );
}

function DishCard({
  item,
  quantity,
  onQuantityChange,
}: {
  item: MenuItem;
  quantity: number;
  onQuantityChange: (id: string, value: number) => void;
}) {
  return (
    <article className="dish-card">
      <div className="dish-image">
        <Image
          alt={`Illustrative food photograph for ${item.name}`}
          className="dish-photo"
          fill
          unoptimized
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          src={item.image}
        />
        {item.featured && <span className="dish-tag">Featured dish</span>}
      </div>
      <div className="dish-content">
        <div className="dish-heading">
          <h3>{item.name}</h3>
          <span className="dish-price">{money(item.price)}</span>
        </div>
        <p>{item.description}</p>
        <div className="dish-card-bottom">
          <span className="availability">
            {item.available === false ? "Currently unavailable" : "Ask about availability"}
          </span>
          <div aria-label={`Quantity for ${item.name}`} className="quantity-picker">
            <button
              aria-label={`Remove one ${item.name}`}
              disabled={quantity === 0}
              onClick={() => onQuantityChange(item.id, quantity - 1)}
              type="button"
            >
              <Icon name="minus" />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              aria-label={`Add one ${item.name}`}
              onClick={() => onQuantityChange(item.id, quantity + 1)}
              type="button"
            >
              <Icon name="plus" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Home({
  items,
  publishedRatings,
}: {
  items: MenuItem[];
  publishedRatings: {
    id: string;
    stars: number;
    comment: string | null;
    user: { name: string };
  }[];
}) {
  const [activeCategory, setActiveCategory] = useState<MenuCategory | "All">(
    "All",
  );
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        !query ||
        `${item.name} ${item.description} ${item.category}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, items, search]);

  const selectedItems = items.filter((item) => quantities[item.id] > 0);
  const estimatedTotal = selectedItems.reduce(
    (total, item) => total + item.price * quantities[item.id],
    0,
  );
  const hasConfirmedAddress =
    restaurant.address !== "Restaurant address to be confirmed";
  const directionsUrl = hasConfirmedAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`
    : undefined;
  const orderMessage = [
    "Hello Sahani Kitchen! I would like to enquire about this order:",
    ...selectedItems.map(
      (item) =>
        `- ${item.name} x ${quantities[item.id]} = ${money(item.price * quantities[item.id])}`,
    ),
    `Estimated sample total: ${money(estimatedTotal)} (please confirm availability and actual prices).`,
  ].join("\n");

  function changeQuantity(id: string, value: number) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, value),
    }));
    setNotice("");
  }

  function orderClick() {
    if (selectedItems.length === 0) {
      setNotice("Choose dishes from the menu first to build your order enquiry.");
    } else if (!restaurant.whatsappNumber) {
      setNotice(
        "WhatsApp ordering will be ready once the restaurant's WhatsApp number is added.",
      );
    }
  }

  function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = [
      `Hello Sahani Kitchen, my name is ${formData.get("name")}.`,
      `My phone number is ${formData.get("phone")}.`,
      `Message: ${formData.get("message")}`,
    ].join("\n");
    if (restaurant.email) {
      const subject = encodeURIComponent("Enquiry for Sahani Kitchen");
      window.location.href = `mailto:${restaurant.email}?subject=${subject}&body=${encodeURIComponent(message)}`;
      setNotice(
        "Your email app is opening with the enquiry. Review the message and send it to complete.",
      );
    } else if (restaurant.whatsappNumber) {
      window.open(
        `https://wa.me/${restaurant.whatsappNumber}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      setNotice(
        "Your message is ready, but a contact email or WhatsApp number is needed before it can be sent.",
      );
    }
  }

  const navLinks = [
    { href: "#home", text: "Home" },
    { href: "#menu", text: "Menu" },
    { href: "#about", text: "About us" },
    { href: "#location", text: "Location" },
    { href: "#contact", text: "Contact" },
    { href: "/login", text: "Sign in" },
  ];

  return (
    <main>
      <div className="announcement">
        <span>Freshly made. Proudly Kenyan. Always welcoming.</span>
        <a href="#menu">
          Explore today&apos;s menu <Icon name="arrow" />
        </a>
      </div>
      <header className="site-header" id="home">
        <div className="header-inner">
          <Link
            aria-label="Sahani Kitchen home"
            className="brand"
            href="#home"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <span className="brand-name">
              <strong>Sahani</strong>
              <small>KITCHEN</small>
            </span>
          </Link>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} />
          </button>
          <nav
            aria-label="Main navigation"
            className={`main-nav ${mobileMenuOpen ? "is-open" : ""}`}
          >
            {navLinks.map((link) => (
              <a
                href={link.href}
                key={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.text}
              </a>
            ))}
            <a
              className="nav-order"
              href="#menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              Order a meal <Icon name="arrow" />
            </a>
          </nav>
        </div>
      </header>

      <section aria-labelledby="hero-heading" className="hero">
        <Image
          alt="An illustrative spread of freshly prepared food"
          className="hero-image"
          fill
          priority
          unoptimized
          sizes="100vw"
          src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=2000&q=80"
        />
        <div className="hero-shade" />
        <div className="hero-content page-width">
          <span className="eyebrow light-eyebrow">
            KARIBU · WELCOME TO SAHANI
          </span>
          <h1 id="hero-heading">
            Good food.
            <br />
            Kenyan flavour.
            <br />
            <em>Every single day.</em>
          </h1>
          <p>
            From steaming plates of ugali and nyama choma to delicious
            homemade meals, discover food prepared with care at Sahani Kitchen.
          </p>
          <div className="hero-actions">
            <a className="button button-orange" href="#menu">
              Explore our menu <Icon name="arrow" />
            </a>
            <WhatsAppLink
              className="button button-light"
              message="Hello Sahani Kitchen! I would like to enquire about placing an order."
              onMissing={() =>
                setNotice(
                  "WhatsApp ordering will be ready once the restaurant's WhatsApp number is added.",
                )
              }
            >
              <span className="whatsapp-dot">◉</span> Order on WhatsApp
            </WhatsAppLink>
          </div>
          <a className="hero-find" href="#location">
            <Icon name="pin" /> Find us <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>GOOD FOOD</span>
          <span className="stamp-star">✳</span>
          <span>GOOD PEOPLE</span>
        </div>
      </section>

      <section aria-label="Restaurant values" className="value-strip">
        <div className="page-width value-strip-inner">
          <span>Made with care</span>
          <i />
          <span>Kenyan favourites</span>
          <i />
          <span>A seat at our table</span>
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="featured-section">
        <div className="page-width">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A LITTLE TASTE OF HOME</span>
              <h2 id="featured-heading">Made for your cravings.</h2>
            </div>
            <a className="text-link" href="#menu">
              See the full menu <Icon name="arrow" />
            </a>
          </div>
          <div className="featured-grid">
            {items
              .filter((item) => item.featured)
              .map((item, index) => (
                <a
                  className={`featured-card featured-card-${index + 1}`}
                  href="#menu"
                  key={item.id}
                >
                  <Image
                    alt={`Illustrative photograph for ${item.name}`}
                    className="featured-photo"
                    fill
                    unoptimized
                    sizes="(max-width: 760px) 100vw, 33vw"
                    src={item.image}
                  />
                  <span className="featured-overlay" />
                  <span className="featured-label">
                    <small>{item.category}</small>
                    <strong>{item.name}</strong>
                    <span>
                      From {money(item.price)} <Icon name="arrow" />
                    </span>
                  </span>
                </a>
              ))}
          </div>
          <p className="photo-disclaimer">
            Menu photos are illustrative sample images. We look forward to
            sharing Sahani Kitchen&apos;s own food photography.
          </p>
        </div>
      </section>

      <section aria-labelledby="menu-heading" className="menu-section" id="menu">
        <div className="page-width">
          <div className="menu-intro">
            <div>
              <span className="eyebrow">WHAT&apos;S COOKING</span>
              <h2 id="menu-heading">
                A good meal
                <br />
                <em>starts here.</em>
              </h2>
            </div>
            <div className="menu-intro-note">
              <p>
                Familiar favourites, made with a little extra care. Pick your
                dishes to build a WhatsApp order enquiry.
              </p>
              <span>Every price below is a sample placeholder.</span>
            </div>
          </div>
          <div className="menu-controls">
            <div aria-label="Filter dishes by category" className="category-list">
              <button
                aria-pressed={activeCategory === "All"}
                className={activeCategory === "All" ? "active" : ""}
                onClick={() => setActiveCategory("All")}
                type="button"
              >
                All dishes
              </button>
              {menuCategories.map((category) => (
                <button
                  aria-pressed={activeCategory === category}
                  className={activeCategory === category ? "active" : ""}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
            <label className="search-box">
              <Icon name="search" />
              <span className="sr-only">Search the menu</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a dish..."
                type="search"
                value={search}
              />
            </label>
          </div>
          <p className="price-notice">
            <span aria-hidden="true">i</span> Sample menu and prices only — all
            items, prices and availability need confirmation from the
            restaurant.
          </p>
          {visibleItems.length > 0 ? (
            <div className="menu-grid">
              {visibleItems.map((item) => (
                <DishCard
                  item={item}
                  key={item.id}
                  onQuantityChange={changeQuantity}
                  quantity={quantities[item.id] ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="empty-menu">
              <span>Nothing on the menu matches that search.</span>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All");
                }}
                type="button"
              >
                Clear filters
              </button>
            </div>
          )}
          <div className="order-bar">
            <div>
              <span className="order-overline">YOUR ORDER ENQUIRY</span>
              <strong>
                {selectedItems.length
                  ? `${selectedItems.length} dish${selectedItems.length === 1 ? "" : "es"} · ${money(estimatedTotal)}`
                  : "Choose something delicious"}
              </strong>
              <small>Sample estimate only; final prices to be confirmed.</small>
            </div>
            <WhatsAppLink
              className="button button-green"
              message={orderMessage}
              onMissing={orderClick}
            >
              Send order enquiry <Icon name="arrow" />
            </WhatsAppLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-heading" className="about-section" id="about">
        <div className="about-image-wrap">
          <Image
            alt="Illustrative photograph of a colourful meal made with fresh ingredients"
            className="about-image"
            fill
            unoptimized
            sizes="(max-width: 760px) 100vw, 50vw"
            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80"
          />
          <div className="about-image-note">
            <span>Karibu</span>
            <small>There&apos;s always room at the table.</small>
          </div>
        </div>
        <div className="about-copy">
          <span className="eyebrow">OUR TABLE, YOUR TABLE</span>
          <h2 id="about-heading">
            The heart of
            <br />
            <em>Kenyan hospitality.</em>
          </h2>
          <p>
            At Sahani Kitchen, we believe good food brings people together.
            We&apos;re here for the comforting local favourites, the fresh
            ingredients, and the pleasure of a meal served with warmth.
          </p>
          <p>
            Whether you&apos;re stopping by for a quick bite or gathering over
            a generous plate, we want every visit to feel like you&apos;re
            welcome.
          </p>
          <a className="text-link" href="#contact">
            Come say hello <Icon name="arrow" />
          </a>
          <div className="about-values">
            <span>
              <b>01</b> Fresh ingredients
            </span>
            <span>
              <b>02</b> Generous hospitality
            </span>
            <span>
              <b>03</b> Kenyan flavour
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="service-heading" className="service-section">
        <div className="page-width service-inner">
          <div>
            <span className="eyebrow light-eyebrow">HOW CAN WE SERVE YOU?</span>
            <h2 id="service-heading">
              Good food, <em>your way.</em>
            </h2>
            <p>
              Ask us about dining in, takeaway or delivery. Availability and
              service areas are to be confirmed.
            </p>
          </div>
          <div className="service-options">
            {restaurant.serviceOptions.map((option, index) => (
              <div className="service-option" key={option.name}>
                <span className="service-number">0{index + 1}</span>
                <strong>{option.name}</strong>
                <small>{option.status}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="testimonials-heading" className="kind-words">
        <div className="page-width">
          <span className="eyebrow">YOUR FEEDBACK MATTERS</span>
          <h2 id="testimonials-heading">Good things are shared.</h2>
          <p className="rating-intro">
            Read feedback shared by guests, or create a free customer account
            to leave a star rating.
          </p>
          <div className="public-ratings">
            {publishedRatings.length > 0 ? (
              publishedRatings.map((review) => (
                <article className="public-rating-card" key={review.id}>
                  <span aria-label={`${review.stars} out of 5 stars`}>
                    {"★".repeat(review.stars)}
                    {"☆".repeat(5 - review.stars)}
                  </span>
                  {review.comment && <p>“{review.comment}”</p>}
                  <small>{review.user.name}</small>
                </article>
              ))
            ) : (
              <div className="testimonial-placeholder">
                <span aria-hidden="true" className="quote-mark">
                  “
                </span>
                <p>No customer ratings have been published yet.</p>
                <small>Customer stories · Coming soon</small>
              </div>
            )}
          </div>
          <a className="button button-green rating-dashboard-link" href="/register">
            Create account to leave a rating <Icon name="arrow" />
          </a>
        </div>
      </section>

      <section
        aria-labelledby="visit-heading"
        className="visit-section"
        id="location"
      >
        <div className="page-width visit-layout">
          <div className="visit-copy">
            <span className="eyebrow light-eyebrow">COME ON IN</span>
            <h2 id="visit-heading">
              Find your way
              <br />
              <em>to good food.</em>
            </h2>
            <div className="visit-address">
              <Icon name="pin" />
              <div>
                <strong>Find Sahani Kitchen</strong>
                <span>{restaurant.address}</span>
                <small>Address will be updated once confirmed.</small>
              </div>
            </div>
            <div className="visit-actions">
              {directionsUrl ? (
                <a
                  className="button button-light button-muted"
                  href={directionsUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Get directions <Icon name="arrow" />
                </a>
              ) : (
                <span aria-disabled="true" className="button button-light button-muted">
                  Directions coming soon <Icon name="arrow" />
                </span>
              )}
              {restaurant.phone ? (
                <a
                  className="phone-link"
                  href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`}
                >
                  <Icon name="phone" /> Call {restaurant.phone}
                </a>
              ) : (
                <span className="phone-link">
                  <Icon name="phone" /> Phone number to be confirmed
                </span>
              )}
            </div>
          </div>
          <div className="hours-card">
            <div className="hours-title">
              <span className="eyebrow">PLAN YOUR VISIT</span>
              <h3>Opening hours</h3>
            </div>
            <div className="hours-list">
              {restaurant.hours.map((entry) => (
                <div key={entry.day}>
                  <span>{entry.day}</span>
                  <span>{entry.hours}</span>
                </div>
              ))}
            </div>
            <p>Hours will be added as soon as they are confirmed.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="contact-heading" className="contact-section" id="contact">
        <div className="page-width contact-layout">
          <div className="contact-copy">
            <span className="eyebrow">LET&apos;S TALK FOOD</span>
            <h2 id="contact-heading">
              We&apos;d love to
              <br />
              <em>hear from you.</em>
            </h2>
            <p>
              Have a question about the menu or want to plan a visit? Send us
              an enquiry and we&apos;ll be happy to help.
            </p>
            <div className="contact-socials">
              <span>Follow along</span>
              {(["instagram", "facebook", "tiktok"] as const).map((network) =>
                restaurant.socials[network] ? (
                  <a
                    href={restaurant.socials[network]}
                    key={network}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {network}
                  </a>
                ) : (
                  <span className="social-placeholder" key={network}>
                    {network}
                  </span>
                ),
              )}
              <small>Social links to be added.</small>
            </div>
          </div>
          <form className="contact-form" onSubmit={submitEnquiry}>
            <label>
              Your name
              <input autoComplete="name" name="name" placeholder="e.g. Amina" required />
            </label>
            <label>
              Phone number
              <input
                autoComplete="tel"
                name="phone"
                placeholder="+254 7XX XXX XXX"
                pattern="[+0-9() -]{7,20}"
                required
                type="tel"
                title="Enter a valid phone number."
              />
            </label>
            <label>
              Your message
              <textarea
                name="message"
                placeholder="Tell us what you're looking for..."
                required
                rows={4}
              />
            </label>
            <button className="button button-green" type="submit">
              Email your enquiry <Icon name="arrow" />
            </button>
            <small>
              Your email app will open with the enquiry ready to review and
              send. WhatsApp ordering will be enabled once its number is
              confirmed.
            </small>
          </form>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-width footer-top">
          <Link aria-label="Sahani Kitchen home" className="brand footer-brand" href="#home">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <span className="brand-name">
              <strong>Sahani</strong>
              <small>KITCHEN</small>
            </span>
          </Link>
          <p>Good food. Kenyan flavour. Every single day.</p>
          <a href="#home">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
        <div className="page-width footer-bottom">
          <span>© {new Date().getFullYear()} Sahani Kitchen</span>
          <span>Karibu — everyone is welcome.</span>
          <a href="#menu">Browse the menu</a>
        </div>
      </footer>

      {notice && (
        <div aria-live="polite" className="notice" role="status">
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
            type="button"
          >
            <Icon name="close" />
          </button>
        </div>
      )}
    </main>
  );
}
