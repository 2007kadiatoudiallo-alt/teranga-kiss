
/* ============================================================
   TERANGA KISS — script.js (version nettoyée)
   ============================================================ */

/* ---------- Icônes Lucide + animations d'apparition ---------- */
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in-section, .product-card')
    .forEach((el) => observer.observe(el));
});

/* ---------- Fenêtre de détail produit (modal) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const modal = document.getElementById('product-modal');
  const modalPhoto = document.getElementById('modal-photo');
  const modalName = document.getElementById('modal-name');
  const modalPrice = document.getElementById('modal-price');
  const modalSwatches = document.getElementById('modal-swatches');
  const modalAdd = document.getElementById('modal-add');

  if (!modal) return; // pas de modal sur cette page

  let modalQty = 1;
  const modalQtyValue = document.getElementById('modal-qty-value');
  document.getElementById('modal-qty-minus').addEventListener('click', () => {
    modalQty = Math.max(1, modalQty - 1);
    modalQtyValue.textContent = modalQty;
  });
  document.getElementById('modal-qty-plus').addEventListener('click', () => {
    modalQty += 1;
    modalQtyValue.textContent = modalQty;
  });

  const modalFormats = document.getElementById('modal-formats');
  modalFormats.querySelectorAll('.format-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      modalFormats.querySelectorAll('.format-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  let currentName = '';
  let currentPrice = '';

  function openModal(card) {
    const name = card.dataset.name;
    const price = card.dataset.price;
    currentName = name;
    currentPrice = price;
    const colors = card.dataset.colors.split(',');
    const epuise = card.dataset.epuise === 'true';
    const desc = card.dataset.desc || '';
    const stock = card.dataset.stock || '';

    modalName.textContent = name;
    modalPrice.textContent = price;
    modalPhoto.style.background = colors[0];
    document.getElementById('modal-desc').textContent = desc;

    modalQty = 1;
    modalQtyValue.textContent = modalQty;
    modalFormats.querySelectorAll('.format-pill').forEach((p, i) => p.classList.toggle('active', i === 0));

    modalSwatches.innerHTML = '';
    colors.forEach((color, i) => {
      const btn = document.createElement('button');
      btn.className = 'modal-swatch' + (i === 0 ? ' selected' : '');
      btn.style.background = color;
      btn.setAttribute('aria-label', 'Choisir cette teinte');
      btn.addEventListener('click', () => {
        modalPhoto.style.background = color;
        modalSwatches.querySelectorAll('.modal-swatch').forEach(s => s.classList.remove('selected'));
        btn.classList.add('selected');
      });
      modalSwatches.appendChild(btn);
    });

    const modalStock = document.getElementById('modal-stock');
    if (epuise) {
      modalAdd.innerHTML = 'Épuisé';
      modalAdd.disabled = true;
      modalStock.textContent = 'Actuellement en rupture de stock';
      modalStock.style.color = 'var(--brun-doux)';
    } else {
      modalAdd.innerHTML = 'Ajouter au panier <i data-lucide="shopping-bag"></i>';
      modalAdd.disabled = false;
      modalStock.textContent = stock;
      modalStock.style.color = 'var(--or)';
      if (window.lucide) lucide.createIcons();
    }

    modal.classList.remove('hidden');
  }

  document.querySelectorAll('.btn-voir-details').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.closest('.product-card')));
  });

  function closeModal() { modal.classList.add('hidden'); }
  modal.querySelector('.product-modal-close').addEventListener('click', closeModal);
  modal.querySelector('.product-modal-overlay').addEventListener('click', closeModal);

  modalAdd.addEventListener('click', () => {
    if (modalAdd.disabled) return;
    const selectedSwatch = modalSwatches.querySelector('.modal-swatch.selected');
    const color = selectedSwatch ? selectedSwatch.style.background : '';
    const activeFormat = modalFormats.querySelector('.format-pill.active');
    const format = activeFormat ? activeFormat.textContent : '';

    window.TerangaCart.addToCart({
      name: currentName,
      price: currentPrice,
      qty: modalQty,
      color: color,
      format: format
    });

    closeModal();
  });
});

/* ============================================================
   Panier partagé (localStorage) + tiroir panier + badges
   ============================================================ */
(function () {
  const CART_KEY = 'terangaKissCart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  function cartCount(cart) {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }
  function parsePrice(str) {
    return parseInt(String(str).replace(/[^\d]/g, ''), 10) || 0;
  }
  function formatPrice(n) {
    return n.toLocaleString('fr-FR').replace(/,/g, '\u00A0') + ' FCFA';
  }

  function ensureHeaderBadge() {
    document.querySelectorAll('#cart-icon').forEach((el) => {
      if (!el.querySelector('.header-cart-badge')) {
        const badge = document.createElement('span');
        badge.className = 'header-cart-badge hidden';
        el.appendChild(badge);
      }
    });
  }

  function updateBadges() {
    const cart = getCart();
    const count = cartCount(cart);
    ensureHeaderBadge();
    document.querySelectorAll('.header-cart-badge').forEach((b) => {
      b.textContent = count;
      b.classList.toggle('hidden', count === 0);
    });
    document.querySelectorAll('.bottom-nav-badge').forEach((b) => {
      b.textContent = count;
    });
  }

  let drawerBuilt = false;

  function buildDrawer() {
    if (drawerBuilt) return;
    drawerBuilt = true;

    const overlay = document.createElement('div');
    overlay.id = 'cart-drawer-overlay';
    overlay.className = 'cart-drawer-overlay hidden';

    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer';
    drawer.innerHTML = [
      '<div class="cart-drawer-header">',
      '<h3>Votre panier (<span id="cart-drawer-count">0</span>)</h3>',
      '<button id="cart-drawer-close" aria-label="Fermer"><i data-lucide="x"></i></button>',
      '</div>',
      '<div id="cart-drawer-items" class="cart-drawer-items"></div>',
      '<div class="cart-drawer-footer">',
      '<div class="cart-drawer-subtotal-row"><span>Sous-total</span><span id="cart-drawer-subtotal">0 FCFA</span></div>',
      '<p class="cart-drawer-shipping-note">Frais de livraison calculés à l\'étape suivante selon votre pays.</p>',
      '<a href="checkout.html" class="btn-fill-whatsapp cart-drawer-checkout">Passer la commande</a>',
      '<a href="panier.html" class="btn-outline cart-drawer-view">Voir le panier</a>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    overlay.addEventListener('click', closeDrawer);
    drawer.querySelector('#cart-drawer-close').addEventListener('click', closeDrawer);

    if (window.lucide) lucide.createIcons();
  }

  function openDrawer() {
    buildDrawer();
    renderDrawer();
    document.getElementById('cart-drawer-overlay').classList.remove('hidden');
    requestAnimationFrame(() => {
      document.getElementById('cart-drawer').classList.add('open');
    });
  }

  function closeDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
  }

  function renderDrawer() {
    buildDrawer();
    const cart = getCart();
    const itemsEl = document.getElementById('cart-drawer-items');
    const countEl = document.getElementById('cart-drawer-count');
    const subtotalEl = document.getElementById('cart-drawer-subtotal');

    countEl.textContent = cartCount(cart);

    if (cart.length === 0) {
      itemsEl.innerHTML = '<p class="cart-drawer-empty">Votre panier est vide.</p>';
      subtotalEl.textContent = formatPrice(0);
      return;
    }

    itemsEl.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
      subtotal += parsePrice(item.price) * item.qty;

      const row = document.createElement('div');
      row.className = 'cart-drawer-item';
      row.innerHTML = [
        '<div class="cart-drawer-item-photo" style="background:' + (item.color || '#D9A0AC') + '"></div>',
        '<div class="cart-drawer-item-info">',
        '<p class="cart-drawer-item-name">' + item.name + '</p>',
        '<p class="cart-drawer-item-variant">' + (item.format || '') + '</p>',
        '<div class="cart-drawer-item-qty">',
        '<button class="qty-minus" data-index="' + index + '" aria-label="Diminuer">\u2212</button>',
        '<span>' + item.qty + '</span>',
        '<button class="qty-plus" data-index="' + index + '" aria-label="Augmenter">+</button>',
        '</div></div>',
        '<div class="cart-drawer-item-right">',
        '<p class="cart-drawer-item-price">' + item.price + '</p>',
        '<button class="cart-drawer-item-remove" data-index="' + index + '" aria-label="Supprimer"><i data-lucide="trash-2"></i></button>',
        '</div>'
      ].join('');
      itemsEl.appendChild(row);
    });

    subtotalEl.textContent = formatPrice(subtotal);

    itemsEl.querySelectorAll('.qty-minus').forEach((btn) => {
      btn.addEventListener('click', () => changeQty(btn.dataset.index, -1));
    });
    itemsEl.querySelectorAll('.qty-plus').forEach((btn) => {
      btn.addEventListener('click', () => changeQty(btn.dataset.index, 1));
    });
    itemsEl.querySelectorAll('.cart-drawer-item-remove').forEach((btn) => {
      btn.addEventListener('click', () => removeItem(btn.dataset.index));
    });

    if (window.lucide) lucide.createIcons();
  }

  function changeQty(index, delta) {
    const cart = getCart();
    const item = cart[index];
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    saveCart(cart);
    updateBadges();
    renderDrawer();
  }

  function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    updateBadges();
    renderDrawer();
  }

  function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(
      (i) => i.name === item.name && i.color === item.color && i.format === item.format
    );
    if (existing) {
      existing.qty += item.qty;
    } else {
      cart.push(item);
    }
    saveCart(cart);
    updateBadges();
    openDrawer();
  }

  function wireHeaderCartIcons() {
    document.querySelectorAll('#cart-icon').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureHeaderBadge();
    updateBadges();
    wireHeaderCartIcons();
  });

  window.TerangaCart = { addToCart, getCart, updateBadges, changeQty, removeItem };
})();

/* ============================================================
   Chatbot — Assistante beauté Teranga Kiss
   ============================================================ */
(function () {
  const HISTORY_KEY = 'terangaKissChatHistory';
  const WHATSAPP_LINK = 'https://wa.me/221781907492';

  function getReply(msgRaw) {
    const msg = msgRaw.toLowerCase();

    if (/bonjour|salut|hello|bonsoir/.test(msg)) {
      return { text: "Bonjour ! ✨ Ravie de vous accueillir chez Teranga Kiss. Vous cherchez une teinte en particulier ?" };
    }
    if (/merci/.test(msg)) {
      return { text: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions 💛" };
    }
    if (/discr[eè]t|naturel|teint mat|subtil/.test(msg)) {
      return { text: "Pour un look discret et naturel, je vous recommande Jigéen ou Cocoa Kiss — des teintes douces qui subliment sans en faire trop." };
    }
    if (/briller|brillant|shine|glow|éclat/.test(msg)) {
      return { text: "Pour un maximum d'éclat, Sunu Shine ou Or Sénégal sont parfaits : un fini brillant miroir qui capte la lumière." };
    }
    if (/teinte|couleur|quelle.*(teinte|couleur)|conseil.*teinte/.test(msg)) {
      return { text: "Ça dépend de l'effet recherché : discret → Jigéen, éclatant → Sunu Shine, gourmand → Bissap Glow. Dites-m'en plus sur le look que vous voulez !" };
    }
    if (/prix|co[uû]te|combien|tarif/.test(msg)) {
      return { text: "Nos glosses sont entre 5 000 et 6 000 FCFA selon la teinte. Vous pouvez voir tous les prix sur la page Produits." };
    }
    if (/livraison|d[eé]lai|dakar|recevoir|exp[eé]dition/.test(msg)) {
      return { text: "La livraison se fait rapidement partout à Dakar, avec un suivi de commande dès que votre colis part en préparation." };
    }
    if (/ingr[eé]dient|composition|allerg|sensible/.test(msg)) {
      return { text: "Nos gloss sont formulés sans ingrédients agressifs, adaptés aux lèvres sensibles — douceur et confort avant tout." };
    }
    if (/appliquer|application|comment mettre|utiliser/.test(msg)) {
      return { text: "Appliquez une fine couche au centre des lèvres puis estompez vers les bords avec l'applicateur — la formule est très pigmentée, pas besoin d'en mettre beaucoup !" };
    }
    if (/commande|suivi|statut|o[uù] en est/.test(msg)) {
      return { text: "Vous pouvez suivre votre commande étape par étape (reçue, en préparation, prête, en livraison) directement sur la page Commandes." };
    }
    if (/whatsapp|parler.*(quelqu|humain)|vendeuse|r[eé]clamation/.test(msg)) {
      return { text: "Bien sûr ! Vous pouvez nous écrire directement sur WhatsApp :", whatsapp: true };
    }
    return { text: "Excellente question ! Pour être sûre de bien vous répondre, contactez-nous directement sur WhatsApp :", whatsapp: true };
  }

  function initChat() {
    const chatBubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    if (!chatBubble || !chatWindow || !chatMessages) return;

    chatBubble.addEventListener('click', () => {
      chatWindow.classList.toggle('hidden');
      if (!chatWindow.classList.contains('hidden')) {
        if (chatInput) chatInput.focus();
        scrollToBottom();
      }
    });
    if (chatClose) {
      chatClose.addEventListener('click', () => chatWindow.classList.add('hidden'));
    }

    function scrollToBottom() {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addMessage(text, sender, withWhatsapp) {
      const row = document.createElement('div');
      row.className = 'chat-msg chat-msg-' + sender;
      row.textContent = text;
      chatMessages.appendChild(row);

      if (withWhatsapp) {
        const link = document.createElement('a');
        link.href = WHATSAPP_LINK;
        link.target = '_blank';
        link.rel = 'noopener';
        link.className = 'chat-msg chat-msg-bot chat-msg-whatsapp-link';
        link.textContent = 'Ouvrir WhatsApp →';
        chatMessages.appendChild(link);
      }

      scrollToBottom();
    }

    function addTyping() {
      const row = document.createElement('div');
      row.className = 'chat-msg chat-msg-bot chat-msg-typing';
      row.id = 'chat-typing';
      row.innerHTML = '<span></span><span></span><span></span>';
      chatMessages.appendChild(row);
      scrollToBottom();
    }
    function removeTyping() {
      const el = document.getElementById('chat-typing');
      if (el) el.remove();
    }

    function saveHistory() {
      const msgs = Array.from(chatMessages.querySelectorAll('.chat-msg:not(.chat-msg-typing)')).map((el) => ({
        text: el.textContent,
        sender: el.classList.contains('chat-msg-user') ? 'user' : 'bot',
        whatsapp: el.classList.contains('chat-msg-whatsapp-link')
      }));
      try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(msgs)); } catch (e) {}
    }

    function restoreHistory() {
      let saved = [];
      try { saved = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch (e) {}
      saved.forEach((m) => {
        if (m.whatsapp) return;
        addMessage(m.text, m.sender);
      });
    }

    function handleSend() {
      const text = chatInput.value.trim();
      if (!text) return;
      addMessage(text, 'user');
      chatInput.value = '';
      saveHistory();

      addTyping();
      const delay = 550 + Math.random() * 450;
      setTimeout(() => {
        removeTyping();
        const reply = getReply(text);
        addMessage(reply.text, 'bot', !!reply.whatsapp);
        saveHistory();
      }, delay);
    }

    if (chatSend) chatSend.addEventListener('click', handleSend);
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSend();
        }
      });
    }

    restoreHistory();
  }

  document.addEventListener('DOMContentLoaded', initChat);
})();

/* ============================================================
   Bandeau promo défilant
   ============================================================ */
(function () {
  const MESSAGES = [
    "Plus qu'un gloss, une sensation",
    "Livraison rapide à Dakar",
    "-10% sur votre première commande"
  ];
  const AUTO_DELAY = 4000;

  function initPromoBanner() {
    const messageEl = document.getElementById('promo-message');
    const prevBtn = document.getElementById('promo-prev');
    const nextBtn = document.getElementById('promo-next');

    if (!messageEl) return;

    let index = 0;
    let timer = null;

    function show(i, animate) {
      index = ((i % MESSAGES.length) + MESSAGES.length) % MESSAGES.length;
      if (animate) {
        messageEl.classList.add('promo-fade-out');
        setTimeout(() => {
          messageEl.textContent = MESSAGES[index];
          messageEl.classList.remove('promo-fade-out');
        }, 180);
      } else {
        messageEl.textContent = MESSAGES[index];
      }
    }

    function next() { show(index + 1, true); }
    function prev() { show(index - 1, true); }

    function startAuto() {
      stopAuto();
      timer = setInterval(next, AUTO_DELAY);
    }
    function stopAuto() {
      if (timer) clearInterval(timer);
    }

    if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAuto(); });

    show(0, false);
    startAuto();
  }

  document.addEventListener('DOMContentLoaded', initPromoBanner);
})();

/* ============================================================
   Menu burger
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const fullscreenMenu = document.getElementById('fullscreen-menu');

  if (!menuToggle || !fullscreenMenu) return;

  function openMenu() {
    fullscreenMenu.classList.remove('hidden');
    menuToggle.innerHTML = '<i data-lucide="x"></i>';
    if (window.lucide) lucide.createIcons();
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    fullscreenMenu.classList.add('hidden');
    menuToggle.innerHTML = '<i data-lucide="menu"></i>';
    if (window.lucide) lucide.createIcons();
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    const isOpen = !fullscreenMenu.classList.contains('hidden');
    isOpen ? closeMenu() : openMenu();
  }

  menuToggle.addEventListener('click', toggleMenu);

  fullscreenMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
});

/* ============================================================
   Rendu dynamique de la page panier.html
   ============================================================ */
(function () {
  function parsePrice(str) {
    return parseInt(String(str).replace(/[^\d]/g, ''), 10) || 0;
  }
  function formatPrice(n) {
    return n.toLocaleString('fr-FR').replace(/,/g, '\u00A0') + ' FCFA';
  }

  function initPanierPage() {
    const listeSection = document.getElementById('panier-liste');
    if (!listeSection || !window.TerangaCart) return;

    const videEl = listeSection.querySelector('.panier-vide');
    let itemsEl = listeSection.querySelector('.panier-items');
    if (!itemsEl) {
      itemsEl = document.createElement('ul');
      itemsEl.className = 'panier-items';
      listeSection.appendChild(itemsEl);
    }

    const totalValueEl = document.querySelector('.panier-total-valeur');
    const commanderBtn = document.getElementById('panier-commander');

    function render() {
      const cart = window.TerangaCart.getCart();

      if (cart.length === 0) {
        if (videEl) videEl.classList.remove('hidden');
        itemsEl.innerHTML = '';
        itemsEl.classList.add('hidden');
        if (totalValueEl) totalValueEl.textContent = formatPrice(0);
        if (commanderBtn) commanderBtn.setAttribute('aria-disabled', 'true');
        return;
      }

      if (videEl) videEl.classList.add('hidden');
      itemsEl.classList.remove('hidden');
      itemsEl.innerHTML = '';

      let total = 0;
      cart.forEach((item, index) => {
        total += parsePrice(item.price) * item.qty;

        const li = document.createElement('li');
        li.className = 'panier-item';
        li.innerHTML = [
          '<div class="product-photo" style="background:' + (item.color || '#D9A0AC') + '"></div>',
          '<div class="panier-item-info">',
          '<h3 class="panier-item-nom">' + item.name + '</h3>',
          '<p class="panier-item-prix">' + (item.format ? item.format + ' — ' : '') + item.price + '</p>',
          '<div class="panier-item-qte">',
          '<button class="qte-moins" data-index="' + index + '" aria-label="Diminuer">\u2212</button>',
          '<span class="qte-valeur">' + item.qty + '</span>',
          '<button class="qte-plus" data-index="' + index + '" aria-label="Augmenter">+</button>',
          '</div></div>',
          '<button class="panier-item-supprimer" data-index="' + index + '">Supprimer</button>'
        ].join('');
        itemsEl.appendChild(li);
      });

      if (totalValueEl) totalValueEl.textContent = formatPrice(total);
      if (commanderBtn) commanderBtn.removeAttribute('aria-disabled');

      itemsEl.querySelectorAll('.qte-moins').forEach((btn) => {
        btn.addEventListener('click', () => changeQty(btn.dataset.index, -1));
      });
      itemsEl.querySelectorAll('.qte-plus').forEach((btn) => {
        btn.addEventListener('click', () => changeQty(btn.dataset.index, 1));
      });
      itemsEl.querySelectorAll('.panier-item-supprimer').forEach((btn) => {
        btn.addEventListener('click', () => removeItem(btn.dataset.index));
      });
    }

    function changeQty(index, delta) {
      window.TerangaCart.changeQty(Number(index), delta);
      render();
    }
    function removeItem(index) {
      window.TerangaCart.removeItem(Number(index));
      render();
    }

    render();
  }

  document.addEventListener('DOMContentLoaded', initPanierPage);
})();

/* ============================================================
   Page checkout.html — récapitulatif de commande
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const confirmBtn = document.getElementById('checkout-confirm');
  if (!confirmBtn) return; // pas sur checkout.html

  function parsePrice(str) {
    return parseInt(String(str).replace(/[^\d]/g, ''), 10) || 0;
  }
  function formatPrice(n) {
    return n.toLocaleString('fr-FR').replace(/,/g, '\u00A0') + ' FCFA';
  }

  function renderSummary() {
    const cart = window.TerangaCart ? window.TerangaCart.getCart() : [];
    const itemsEl = document.getElementById('checkout-summary-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');

    if (cart.length === 0) {
      itemsEl.innerHTML = '<p class="checkout-empty">Votre panier est vide.</p>';
      subtotalEl.textContent = formatPrice(0);
      totalEl.textContent = formatPrice(0);
      return;
    }

    itemsEl.innerHTML = '';
    let subtotal = 0;
    cart.forEach((item) => {
      subtotal += parsePrice(item.price) * item.qty;
      const row = document.createElement('div');
      row.className = 'checkout-item';
      row.innerHTML = [
        '<div class="checkout-item-photo" style="background:' + (item.color || '#D9A0AC') + '">',
        '<span class="checkout-item-qty-badge">' + item.qty + '</span>',
        '</div>',
        '<div class="checkout-item-info">',
        '<p class="checkout-item-name">' + item.name + '</p>',
        '<p class="checkout-item-variant">' + (item.format || '') + '</p>',
        '</div>',
        '<p class="checkout-item-price">' + item.price + '</p>'
      ].join('');
      itemsEl.appendChild(row);
    });

    subtotalEl.textContent = formatPrice(subtotal);
    totalEl.textContent = formatPrice(subtotal);
  }

  renderSummary();

  confirmBtn.addEventListener('click', () => {
    const cart = window.TerangaCart ? window.TerangaCart.getCart() : [];
    if (cart.length === 0) {
      alert('Votre panier est vide.');
      return;
    }
    localStorage.removeItem('terangaKissCart');
    if (window.TerangaCart) window.TerangaCart.updateBadges();
    window.location.href = 'commande.html';
  });
});

/* ============================================================
   TERANGA KISS — search.js
   Icône recherche → suggestions de produits → ouverture fiche
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const closeBtn = document.getElementById('search-close');
  const suggestionsEl = document.getElementById('search-suggestions');

  if (!overlay || !input || !suggestionsEl) return;

  function getAllProducts() {
    return Array.from(document.querySelectorAll('.product-card')).map((card) => ({
      name: card.dataset.name || '',
      price: card.dataset.price || '',
      color: (card.dataset.colors || '').split(',')[0] || '#D9A0AC',
      epuise: card.dataset.epuise === 'true',
      card: card
    }));
  }

  function normalize(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function renderSuggestions(query) {
    const products = getAllProducts();
    const q = normalize(query.trim());

    const matches = q
      ? products.filter((p) => normalize(p.name).includes(q))
      : products;

    suggestionsEl.innerHTML = '';

    if (matches.length === 0) {
      suggestionsEl.innerHTML = '<p class="search-no-results">Aucun produit trouvé pour « ' + query + ' ».</p>';
      return;
    }

    const label = document.createElement('p');
    label.className = 'search-suggestion-label';
    label.textContent = q ? 'Résultats' : 'Nos teintes';
    suggestionsEl.appendChild(label);

    matches.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'search-suggestion-item';
      btn.innerHTML =
        '<div class="search-suggestion-photo" style="background:' + p.color + '"></div>' +
        '<div class="search-suggestion-info">' +
          '<p class="search-suggestion-name">' + p.name + (p.epuise ? ' (Épuisé)' : '') + '</p>' +
          '<p class="search-suggestion-price">' + p.price + '</p>' +
        '</div>';
      btn.addEventListener('click', () => selectProduct(p));
      suggestionsEl.appendChild(btn);
    });
  }

  function selectProduct(p) {
    closeSearch();
    const detailsBtn = p.card.querySelector('.btn-voir-details');
    if (detailsBtn) detailsBtn.click();
  }

  function openSearch() {
    overlay.classList.remove('hidden');
    renderSuggestions('');
    input.value = '';
    setTimeout(() => input.focus(), 50);
  }

  function closeSearch() {
    overlay.classList.add('hidden');
  }

  input.addEventListener('input', () => renderSuggestions(input.value));
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  document.querySelectorAll('#search-icon, .bottom-nav-item[aria-label="Recherche"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeSearch();
  });
});