import { products } from "./data.js";

const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const cartKey = "mc-cart";

const state = {
  sliderIndex: 0,
  sliderSize: 0,
  sliderTrack: null
};

function loadCart() {
  try {
    const stored = localStorage.getItem(cartKey);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.warn("cart read failed", err);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

function updateCartCount() {
  const cart = loadCart();
  const count = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const chip = qs(".cart-count");
  if (chip) chip.textContent = count;
}

function addToCart(productId, quantity = 1) {
  const cart = loadCart();
  const existing = cart.find((c) => c.id === productId);
  if (existing) existing.qty += quantity;
  else cart.push({ id: productId, qty: quantity });
  saveCart(cart);
  updateCartCount();
  window.showToast("🛒 Added to cart!");
}

function removeFromCart(productId) {
  let cart = loadCart();
  cart = cart.filter((c) => c.id !== productId);
  saveCart(cart);
  updateCartCount();
  window.showToast("✓ Removed from cart");
}

function updateCartQty(productId, qty) {
  const cart = loadCart();
  const item = cart.find((c) => c.id === productId);
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
    updateCartCount();
  }
}

function showToast(message, type = "success") {
  let toast = qs(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove("visible", "error");
  if (type === "error") toast.classList.add("error");
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2000);
}

// Export for global use
window.showToast = showToast;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQty = updateCartQty;

function renderFeatured() {
  const grid = qs("#featured-grid");
  if (!grid) return;
  const featured = products.slice(0, 6);
  grid.innerHTML = featured
    .map(
      (p) => `
      <article class="card">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <h3>${p.name}</h3>
        <p class="tiny">${p.description}</p>
        <div class="meta">
          <span>$${p.price}</span>
          <span>${p.rating}★</span>
        </div>
        <div class="tagline">
          ${p.tags
            .slice(0, 3)
            .map((t) => `<span class="tag">${t}</span>`)
            .join("")}
        </div>
        <div class="hero__cta" style="margin-top:12px;">
          <a href="product.html?id=${p.id}" class="pill">View Details</a>
          <button class="pill ghost" data-add="${p.id}">Add to cart</button>
        </div>
      </article>
    `
    )
    .join("");

  grid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });
}

function renderCategoryChips() {
  const chips = qs("#category-chips");
  if (!chips) return;
  const categories = Array.from(new Set(products.map((p) => p.category)));
  chips.innerHTML = categories
    .map((c, idx) => `<button class="${idx === 0 ? "active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");
  chips.addEventListener("click", (e) => {
    if (e.target.matches("button[data-cat]")) {
      chips.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      scrollToSection("collections");
    }
  });
}

function setupSlider() {
  const slider = qs("#best-slider");
  if (!slider) return;
  const best = [...products].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const track = document.createElement("div");
  track.className = "slider__track";
  track.innerHTML = best
    .map(
      (p) => `
        <article class="card">
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
          <h3>${p.name}</h3>
          <div class="meta">
            <strong>$${p.price}</strong>
            <span>${p.rating}★</span>
          </div>
          <p class="tiny">${p.description}</p>
          <div class="tagline">
            ${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
          </div>
          <div class="hero__cta" style="margin-top:12px;">
            <button class="pill" data-add="${p.id}">Add</button>
            <a class="pill ghost" href="collection.html">Shop</a>
          </div>
        </article>
      `
    )
    .join("");
  slider.innerHTML = "";
  slider.appendChild(track);
  state.sliderTrack = track;
  state.sliderSize = best.length;
  qs("#slider-next")?.addEventListener("click", () => shiftSlide(1));
  qs("#slider-prev")?.addEventListener("click", () => shiftSlide(-1));
  slider.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });
}

function shiftSlide(dir) {
  if (!state.sliderTrack) return;
  state.sliderIndex = (state.sliderIndex + dir + state.sliderSize) % state.sliderSize;
  const cardWidth = state.sliderTrack.firstElementChild?.getBoundingClientRect().width || 260;
  state.sliderTrack.style.transform = `translateX(-${state.sliderIndex * (cardWidth + 14)}px)`;
}

function renderCollectionPage() {
  const grid = qs("#collection-grid");
  if (!grid) return;
  const search = qs("#search");
  const price = qs("#price");
  const priceValue = qs("#price-value");
  const sort = qs("#sort");
  const chips = qs("#filter-categories");

  const categories = ["All", ...new Set(products.map((p) => p.category))];
  chips.innerHTML = categories
    .map((c, idx) => `<button class="${idx === 0 ? "active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");

  chips.addEventListener("click", (e) => {
    if (e.target.matches("button[data-cat]")) {
      chips.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      render();
    }
  });

  price?.addEventListener("input", () => {
    priceValue.textContent = price.value;
    render();
  });

  sort?.addEventListener("change", render);
  search?.addEventListener("input", () => {
    render();
  });

  function render() {
    const term = search?.value?.toLowerCase() || "";
    const maxPrice = Number(price?.value || 100);
    const activeCat = chips?.querySelector(".active")?.dataset.cat || "All";
    let list = products.filter((p) => p.price <= maxPrice);
    if (activeCat !== "All") list = list.filter((p) => p.category === activeCat);
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    switch (sort?.value) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    grid.innerHTML = list
      .map(
        (p) => `
        <article class="card">
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
          <h3>${p.name}</h3>
          <p class="tiny">${p.description}</p>
          <div class="meta">
            <span>$${p.price}</span>
            <span>${p.rating}★</span>
          </div>
          <div class="tagline">
            ${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
          </div>
          <div class="hero__cta" style="margin-top:12px;">
            <button class="pill" data-add="${p.id}">Add</button>
            <span class="pill ghost">${p.weight}</span>
          </div>
        </article>
      `
      )
      .join("");

    grid.querySelectorAll("[data-add]").forEach((btn) =>
      btn.addEventListener("click", () => addToCart(btn.dataset.add))
    );
  }

  render();
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleForms() {
  const news = qs("#newsletter-form");
  news?.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("You're on the list");
    news.reset();
  });

  const tasting = qs("#tasting-form");
  tasting?.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Request received");
    tasting.reset();
  });
}

function toggleTheme() {
  const btn = qs("#toggle-theme");
  if (!btn) return;
  let light = false;
  btn.addEventListener("click", () => {
    light = !light;
    document.body.style.background = light
      ? "radial-gradient(120% 80% at 20% 20%, rgba(255,255,255,0.08), transparent 60%), #f7f1ec"
      : "";
    document.body.style.color = light ? "#1b120f" : "";
    btn.textContent = light ? "Mood" : "Glow";
  });
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".card, .section, .pillar, .press-card").forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });
}

function setupParallax() {
  const parallaxElements = document.querySelectorAll(".floating-card");
  if (parallaxElements.length === 0) return;

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    parallaxElements.forEach((el) => {
      el.style.transform = `translateY(${scrollY * 0.3}px) rotate(-2deg)`;
    });
  });
}

function animateCounters() {
  const counters = document.querySelectorAll(".hero__meta strong");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = "true";
          const text = entry.target.textContent;
          entry.target.textContent = "0";
          let current = 0;
          const target = parseInt(text) || 100;
          const increment = target / 30;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              entry.target.textContent = text;
              clearInterval(timer);
            } else {
              entry.target.textContent = Math.floor(current) + (text.includes("k") ? "k" : "");
            }
          }, 50);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

// Product Detail Page
function loadProductDetail(productId) {
  const product = products.find((p) => p.id == productId);
  if (!product) {
    document.body.innerHTML = "<h1>Product not found</h1>";
    return;
  }

  qs("#productName").textContent = product.name;
  qs("#productPrice").textContent = `$${product.price}`;
  qs("#productImage").src = product.image;
  qs("#productImage").alt = product.name;
  qs("#productDescription").textContent = product.description;
  qs("#productCategory").textContent = product.category;
  qs("#productRating").textContent = "★".repeat(Math.floor(product.rating));
  qs("#productReviewCount").textContent = `(${Math.floor(Math.random() * 200) + 50} reviews)`;
  qs("#productOrigin").textContent = product.tags[0] || "Ecuador";
  qs("#productWeight").textContent = product.weight;
  qs("#productCocoa").textContent = `${Math.floor(Math.random() * 30) + 60}%`;
  qs("#productType").textContent = product.category;
  qs("#productIngredients").textContent = "Cocoa mass, cocoa butter, cane sugar, vanilla extract, sea salt";
  qs("#productTags").innerHTML = product.tags
    .map((t) => `<span class="flavor-tag">${t}</span>`)
    .join("");

  // Related Products
  const related = products
    .filter((p) => p.category === product.category && p.id !== productId)
    .slice(0, 3);
  const relatedGrid = qs("#relatedProducts");
  if (relatedGrid) {
    relatedGrid.innerHTML = related
      .map(
        (p) => `
        <article class="card">
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
          <h3>${p.name}</h3>
          <div class="meta">
            <span>$${p.price}</span>
            <span>${p.rating}★</span>
          </div>
          <a href="product.html?id=${p.id}" class="btn btn--small" style="margin-top:10px;">View</a>
        </article>
      `
      )
      .join("");
  }
}

window.loadProductDetail = loadProductDetail;

// Shopping Cart Page
function renderCartPage() {
  const cart = loadCart();
  const cartItems = qs("#cartItems");
  const emptyCart = qs("#emptyCart");
  const cartContent = qs("#cartContent");

  if (cart.length === 0) {
    if (emptyCart) emptyCart.style.display = "block";
    if (cartContent) cartContent.style.display = "none";
    return;
  }

  if (emptyCart) emptyCart.style.display = "none";
  if (cartContent) cartContent.style.display = "grid";

  let total = 0;
  cartItems.innerHTML = cart
    .map((item) => {
      const product = products.find((p) => p.id == item.id);
      if (!product) return "";
      const itemTotal = product.price * item.qty;
      total += itemTotal;
      return `
        <div class="cart-item">
          <img src="${product.image}" alt="${product.name}" />
          <div class="cart-item__info">
            <h3>${product.name}</h3>
            <p class="tiny">${product.weight}</p>
            <p class="price">$${product.price}</p>
          </div>
          <div class="cart-item__qty">
            <button class="qty-btn-small" onclick="window.updateCartQty('${item.id}', ${item.qty - 1})">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn-small" onclick="window.updateCartQty('${item.id}', ${item.qty + 1})">+</button>
          </div>
          <div class="cart-item__total">$${itemTotal.toFixed(2)}</div>
          <button class="btn-remove" onclick="window.removeFromCart('${item.id}')">✕</button>
        </div>
      `;
    })
    .join("");

  const tax = (total * 0.08).toFixed(2);
  const shipping = total > 50 ? 0 : 0;
  const grandTotal = (parseFloat(total) + parseFloat(tax) + shipping).toFixed(2);

  qs("#subtotal").textContent = `$${total.toFixed(2)}`;
  qs("#tax").textContent = `$${tax}`;
  qs("#shipping").textContent = shipping === 0 ? "Free" : `$${shipping}`;
  qs("#total").textContent = `$${grandTotal}`;
  qs("#checkoutBtn").textContent = `💳 Proceed to Checkout ($${grandTotal})`;
}

window.renderCartPage = renderCartPage;

// Checkout Page
function renderCheckoutPage() {
  const cart = loadCart();
  const checkoutSummary = qs("#checkoutSummary");
  let total = 0;

  checkoutSummary.innerHTML = cart
    .map((item) => {
      const product = products.find((p) => p.id == item.id);
      if (!product) return "";
      const itemTotal = product.price * item.qty;
      total += itemTotal;
      return `
        <div class="summary-item-checkout">
          <span>${product.name} × ${item.qty}</span>
          <span>$${itemTotal.toFixed(2)}</span>
        </div>
      `;
    })
    .join("");

  const tax = (total * 0.08).toFixed(2);
  const grandTotal = (parseFloat(total) + parseFloat(tax)).toFixed(2);
  qs("#checkoutTotal").textContent = `$${grandTotal}`;
  qs("#submitCheckout").textContent = `💳 Complete Purchase ($${grandTotal})`;
}

window.renderCheckoutPage = renderCheckoutPage;

function processCheckout() {
  const fullName = qs("#fullName")?.value;
  const email = qs("#email")?.value;
  const address = qs("#address")?.value;
  const city = qs("#city")?.value;

  if (!fullName || !email || !address || !city) {
    window.showToast("❌ Please fill all required fields", "error");
    return;
  }

  // Show processing animation
  const btn = qs("#submitCheckout");
  const originalText = btn.textContent;
  btn.textContent = "⏳ Processing...";
  btn.disabled = true;

  // Simulate payment processing
  setTimeout(() => {
    // Clear cart
    saveCart([]);
    updateCartCount();

    // Show confirmation
    qs("#checkoutForm").style.display = "none";
    qs("#confirmationScreen").style.display = "block";

    // Generate order number
    const orderNum = `#MC-${Date.now()}`;
    const deliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString();

    qs("#orderNumber").textContent = orderNum;
    qs("#confirmEmail").textContent = email;
    qs("#deliveryDate").textContent = deliveryDate;
    qs("#orderTotal").textContent = qs("#checkoutTotal").textContent;

    window.showToast("✅ Order placed successfully!");
  }, 2000);
}

window.processCheckout = processCheckout;

function mount() {
  renderFeatured();
  renderCategoryChips();
  setupSlider();
  renderCollectionPage();
  handleForms();
  toggleTheme();
  updateCartCount();
  setupScrollAnimations();
  setupParallax();
  animateCounters();
}

document.addEventListener("DOMContentLoaded", mount);
