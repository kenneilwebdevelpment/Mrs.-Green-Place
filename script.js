let slideIndex = 0;
let slideTimer;

const USER_STORAGE_KEY = 'users';
const CURRENT_USER_SESSION_KEY = 'currentUser';

const SIZE_MULTIPLIERS = {
    'Small': 0.8,
    'Medium': 1.0,
    'Large': 1.3
};

function calculateProductPrice(basePrice, size) {
    const multiplier = SIZE_MULTIPLIERS[size] || 1.0;
    return basePrice * multiplier;
}

const TAX_RATE = 0.15;
const DISCOUNT_THRESHOLD = 1000;
const DISCOUNT_RATE = 0.10;

const PRODUCTS = [
    { id: 1, name: 'Jerk Chicken', price: 950.00 },
    { id: 2, name: 'Curried Goat', price: 1200.00 },
    { id: 3, name: 'Escovitch Fish', price: 1500.00 },
    { id: 4, name: 'Ackee and Saltfish', price: 800.00 },
];


function showSlides() {
    let slides = document.getElementsByClassName("mySlides");
    if (slides.length === 0) return;

    for (let slide of slides) slide.style.display = "none";

    slideIndex++;
    if (slideIndex > slides.length) slideIndex = 1;

    slides[slideIndex - 1].style.display = "block";

    clearTimeout(slideTimer);
    slideTimer = setTimeout(showSlides, 3000);
}

function plusSlides(n) {
    clearTimeout(slideTimer);

    let slides = document.getElementsByClassName("mySlides");
    slideIndex += n;

    if (slideIndex > slides.length) slideIndex = 1;
    if (slideIndex < 1) slideIndex = slides.length;

    for (let slide of slides) slide.style.display = "none";
    slides[slideIndex - 1].style.display = "block";

    slideTimer = setTimeout(showSlides, 3000);
}


function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

function calculateTotals(cart) {
    let subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let discount = subtotal >= DISCOUNT_THRESHOLD ? subtotal * DISCOUNT_RATE : 0;
    let taxableBase = subtotal - discount;
    let tax = taxableBase * TAX_RATE;
    let total = taxableBase + tax;

    return { subtotal, discount, tax, total };
}

function addToCart(productId, size) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const productBase = PRODUCTS.find(p => p.id === productId);
    if (!productBase) return;

    const calculatedPrice = calculateProductPrice(productBase.price, size);
    const itemNameWithSize = `${productBase.name} (${size})`;

    let cartItem = cart.find(item => item.id === productId && item.size === size);

    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({
            id: productBase.id,
            name: itemNameWithSize,
            size: size,
            price: calculatedPrice,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    alert(`${itemNameWithSize} added to cart! Price: $${calculatedPrice.toFixed(2)}`);
}

function removeFromCart(productId, size) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = cart.filter(item => !(item.id === productId && item.size === size));

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartModal();
}


function updateQuantity(productId, size, change) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    let item = cart.find(i => i.id === productId && i.size === size);

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId, size);
        return;
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartModal();
}


function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = "flex";
        if (id === "cart-modal") renderCartModal();
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
}

function renderCartModal() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const list = document.getElementById('cart-items-container');
    const totals = document.getElementById('cart-totals-container');

    if (!list || !totals) return;

    if (cart.length === 0) {
        list.innerHTML = "<p>Your cart is empty.</p>";
        totals.innerHTML = "";
        return;
    }

    let html = '<div class="cart-items-list">';

    cart.forEach(item => {
        html += `
            <div class="cart-item">
                <div style="flex:1;"><strong>${item.name}</strong></div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button onclick="updateQuantity(${item.id}, '${item.size}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, '${item.size}', 1)">+</button>
                    <span><strong>$${(item.price * item.quantity).toFixed(2)}</strong></span>
                    <button style="color:white;background:red;" onclick="removeFromCart(${item.id}, '${item.size}')">X</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    list.innerHTML = html;

    const totalsData = calculateTotals(cart);

    totals.innerHTML = `
        <div class="cart-totals">
            <div><span>Subtotal:</span><span>$${totalsData.subtotal.toFixed(2)}</span></div>
            <div><span>Discount:</span><span>-$${totalsData.discount.toFixed(2)}</span></div>
            <div><span>Tax:</span><span>+$${totalsData.tax.toFixed(2)}</span></div>
            <div class="total"><span>Total:</span><span>$${totalsData.total.toFixed(2)}</span></div>
        </div>
        <button class="btn" style="width:100%;margin-top:1rem;"
            onclick="window.location.href='checkout.html'; closeModal('cart-modal');">Proceed to Checkout</button>
    `;
}


function renderCheckoutSummary() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const summary = document.getElementById('checkout-cart-summary');
    const totals = document.getElementById('checkout-totals');
    const form = document.getElementById('checkout-form');

    if (cart.length === 0) {
        summary.innerHTML = '<p>Your cart is empty. <a href="menu.html">Go to Menu</a></p>';
        totals.innerHTML = '';
        if (form) form.style.display = 'none';
        return;
    }

    if (form) form.style.display = 'block';

    let html = '<ul>';
    cart.forEach(i => {
        html += `<li>${i.name} x <strong>${i.quantity}</strong> @ $${i.price.toFixed(2)}</li>`;
    });
    html += '</ul>';

    summary.innerHTML = html;

    const totalsData = calculateTotals(cart);

    totals.innerHTML = `
        <div class="cart-totals">
            <div><span>Subtotal:</span><span>$${totalsData.subtotal.toFixed(2)}</span></div>
            <div><span>Discount:</span><span>-$${totalsData.discount.toFixed(2)}</span></div>
            <div><span>Tax:</span><span>+$${totalsData.tax.toFixed(2)}</span></div>
            <div class="total"><span>Total:</span><span id="grand-total-amount">$${totalsData.total.toFixed(2)}</span></div>
        </div>
    `;
}

function handleCheckout(e) {
    e.preventDefault();
    const form = e.target;

    const total = parseFloat(document.getElementById('grand-total-amount').textContent.replace('$', ''));
    const payment = parseFloat(form.paymentAmount.value);

    if (payment < total) {
        alert("Payment must be equal to or greater than total.");
        return;
    }

    const change = payment - total;

    localStorage.removeItem('cart');
    updateCartCount();

    const modalContent = document.querySelector('#cart-modal .modal-content');

    modalContent.innerHTML = `
        <span class="close-btn" onclick="closeModal('cart-modal')">&times;</span>
        <h2>Order Confirmation</h2>
        <p>Thank you, <strong>${form.shippingName.value}</strong>!</p>
        <p>Delivery Address: <strong>${form.shippingAddress.value}</strong></p>
        <hr>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p><strong>Paid:</strong> $${payment.toFixed(2)}</p>
        <p style="color:green;font-size:1.2rem;"><strong>Change:</strong> $${change.toFixed(2)}</p>
        <button onclick="window.location.href='index.html'" class="btn" style="width:100%; margin-top:1rem;">Return Home</button>
    `;

    openModal('cart-modal');
}


function getUsers() {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || '[]');
}

function getCurrentUser() {
    const user = sessionStorage.getItem(CURRENT_USER_SESSION_KEY);
    return user ? JSON.parse(user) : null;
}

function handleSignup(e) {
    e.preventDefault();
    const f = e.target;

    const fullname = f.fullname.value.trim();
    const dob = f.dob.value;
    const email = f.email.value.trim();
    const password = f.password.value;
    const confirm = f.confirmPassword.value;

    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    if (password.length < 6) {
        document.getElementById('password-error').textContent = "Password must be at least 6 characters.";
        return;
    }
    if (password !== confirm) {
        document.getElementById('confirmPassword-error').textContent = "Passwords do not match.";
        return;
    }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
        document.getElementById('email-error').textContent = "Email already registered.";
        return;
    }

    users.push({ fullname, dob, email, password });
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));

    alert("Sign up successful!");
    f.reset();

    closeModal('signup-modal');
    openModal('login-modal');
}

function handleLogin(e) {
    e.preventDefault();
    const f = e.target;

    const email = f.loginEmail.value.trim();
    const password = f.loginPassword.value;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        alert("Incorrect email or password.");
        return;
    }

    sessionStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify({
        fullname: user.fullname,
        email: user.email
    }));

    alert(`Welcome back, ${user.fullname.split(' ')[0]}!`);
    f.reset();
    closeModal('login-modal');
    updateNavControls();
}

function handleLogout() {
    sessionStorage.removeItem(CURRENT_USER_SESSION_KEY);
    alert("Logged out.");
    updateNavControls();
}

function updateNavControls() {
    const container = document.getElementById('nav-controls');
    const user = getCurrentUser();

    const cartBtn = container.querySelector('.btn-cart').outerHTML;

    container.innerHTML = "";

    if (user) {
        container.innerHTML = `
            <span style="color:white;font-weight:bold;margin-right:1rem;">Hello, ${user.fullname.split(' ')[0]}!</span>
            <button class="btn" style="background:#f44336;" onclick="handleLogout()">Logout</button>
            ${cartBtn}
        `;
    } else {
        container.innerHTML = `
            <button class="btn" onclick="openModal('login-modal')">Login</button>
            <button class="btn" onclick="openModal('signup-modal')">Sign Up</button>
            ${cartBtn}
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    if (document.querySelector('.slideshow-container')) showSlides();

    updateCartCount();
    updateNavControls();

    document.querySelectorAll('.add-to-cart-form').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();

            const card = form.closest('.product-card');
            const productId = parseInt(card.dataset.productId);
            const size = form.querySelector('select[name="product-size"]').value;

            addToCart(productId, size);
        });
    });

    if (document.getElementById('signup-form'))
        document.getElementById('signup-form').addEventListener('submit', handleSignup);

    if (document.getElementById('login-form'))
        document.getElementById('login-form').addEventListener('submit', handleLogin);

    if (document.getElementById('checkout-form')) {
        renderCheckoutSummary();
        document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    }

    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            closeModal(e.target.closest('.modal').id);
        });
    });

});
