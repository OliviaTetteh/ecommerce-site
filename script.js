const productCards = Array.from(document.querySelectorAll(".product"));
const products = productCards.map((card, index) => {
  const name = card.querySelector("h3").innerText.trim();
  const priceText = card.querySelector("p").innerText.replace(/[^\d.]/g, "");
  const button = card.querySelector("button");

  return {
    id: index + 1,
    name,
    price: parseFloat(priceText),
    button,
  };
});

let cart = [];
let user = {
  name: "",
  email: "",
  phone: "",
};

function getProduct(id) {
  return products.find(product => product.id === id);
}

function getCartItem(id) {
  return cart.find(item => item.id === id);
}

function setButtonState(product, isInCart) {
  product.button.innerText = isInCart ? "Remove from Cart" : "Add to Cart";
  product.button.classList.toggle("in-cart", isInCart);
}

function syncAllButtons() {
  products.forEach(product => {
    setButtonState(product, Boolean(getCartItem(product.id)));
  });
}

function toggleCartItem(productId) {
  const product = getProduct(productId);

  if (!product) {
    return;
  }

  if (getCartItem(productId)) {
    cart = cart.filter(item => item.id !== productId);
    setButtonState(product, false);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    setButtonState(product, true);
  }

  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);

  const product = getProduct(id);
  if (product) {
    setButtonState(product, false);
  }

  updateCart();
}

function increaseQuantity(id) {
  const item = getCartItem(id);
  if (!item) {
    return;
  }

  item.quantity += 1;
  updateCart();
}

function decreaseQuantity(id) {
  const item = getCartItem(id);
  if (!item) {
    return;
  }

  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    removeFromCart(id);
    return;
  }

  updateCart();
}

function updateCart() {
  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    cartItems.innerHTML += `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <span>GHC ${item.price.toFixed(2)} each</span>
          <span>Quantity: ${item.quantity}</span>
          <span>Item Total: GHC ${itemTotal.toFixed(2)}</span>
        </div>
        <div class="cart-item-actions">
          <button type="button" onclick="increaseQuantity(${item.id})">+</button>
          <button type="button" onclick="decreaseQuantity(${item.id})">-</button>
          <button type="button" class="remove-btn" onclick="removeFromCart(${item.id})">Remove from Cart</button>
        </div>
      </div>
    `;
  });

  document.getElementById("cart-total").innerText = total.toFixed(2);
  document.getElementById("cart-count").innerText = cart.length;
}

function getFieldValue(fieldId) {
  const field = document.getElementById(fieldId);
  return field ? field.value.trim() : "";
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.querySelector(`[data-error-for="${fieldId}"]`);

  if (field) {
    field.classList.toggle("invalid", Boolean(message));
  }

  if (error) {
    error.innerText = message;
  }
}

function validateName() {
  const value = getFieldValue("name");
  if (!value) {
    setFieldError("name", "Name is required.");
    return false;
  }

  setFieldError("name", "");
  return true;
}

function validateEmail() {
  const value = getFieldValue("email");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!value) {
    setFieldError("email", "Email is required.");
    return false;
  }

  if (!emailPattern.test(value)) {
    setFieldError("email", "Enter a valid email address.");
    return false;
  }

  setFieldError("email", "");
  return true;
}

function validatePhone() {
  const value = getFieldValue("phone");
  const phonePattern = /^[0-9]+$/;

  if (!value) {
    setFieldError("phone", "Phone number is required.");
    return false;
  }

  if (!phonePattern.test(value)) {
    setFieldError("phone", "Phone number must contain digits only.");
    return false;
  }

  if (value.length < 10) {
    setFieldError("phone", "Phone number must be at least 10 digits.");
    return false;
  }

  setFieldError("phone", "");
  return true;
}

function syncUserObject() {
  user = {
    name: getFieldValue("name"),
    email: getFieldValue("email"),
    phone: getFieldValue("phone"),
  };
}

function validateCartForm() {
  const nameValid = validateName();
  const emailValid = validateEmail();
  const phoneValid = validatePhone();

  syncUserObject();

  return nameValid && emailValid && phoneValid;
}

// Cart modal toggle
document.getElementById("cart-btn").addEventListener("click", () => {
  document.getElementById("cart-modal").classList.remove("hidden");
});

document.getElementById("shop-now-btn").addEventListener("click", () => {
  document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("cart-modal").addEventListener("click", event => {
  if (event.target === document.getElementById("cart-modal")) {
    closeCart();
  }
});

products.forEach(product => {
  product.button.addEventListener("click", () => toggleCartItem(product.id));
});

syncAllButtons();

["name", "email", "phone"].forEach(fieldId => {
  const field = document.getElementById(fieldId);
  if (field) {
    field.addEventListener("blur", () => {
      if (fieldId === "name") {
        validateName();
      }
      if (fieldId === "email") {
        validateEmail();
      }
      if (fieldId === "phone") {
        validatePhone();
      }
      syncUserObject();
    });
  }
});

function closeCart(showMessage = true) {
  document.getElementById("cart-modal").classList.add("hidden");

  if (showMessage) {
    alert("Cart Window Closed. Continue shopping.");
  }
}

function startPaystackCheckout(event) {
  if (event) {
    event.preventDefault();
  }

  if (!validateCartForm()) {
    return;
  }

  const total = parseFloat(document.getElementById("cart-total").innerText);
  const checkoutSnapshot = {
    user: { ...user },
    items: cart.map(item => ({ ...item })),
  };

  closeCart(false);

  var handler = PaystackPop.setup({
    key: 'pk_test_75deac58b274e52f5c306a652e71b790db119e3b',
    email: checkoutSnapshot.user.email,
    amount: Math.round(total * 100),
    currency: 'GHS',
    callback: function(response) {
      showSummary(checkoutSnapshot.user, checkoutSnapshot.items);
      cart = [];
      user = {
        name: "",
        email: "",
        phone: "",
      };
      document.getElementById("user-form").reset();
      ["name", "email", "phone"].forEach(fieldId => setFieldError(fieldId, ""));
      updateCart();
      syncAllButtons();
    },
    onClose: function() {
      alert('Transaction was not completed.');
    }
  });
  handler.openIframe();
}

// Paystack Checkout (Test Mode)
document.getElementById("user-form").addEventListener("submit", startPaystackCheckout);

const checkoutButton = document.getElementById("checkout-btn");
if (checkoutButton) {
  checkoutButton.addEventListener("click", startPaystackCheckout);
}

// Summary Modal
function showSummary(customer, items) {
  const summaryModal = document.getElementById("summary-modal");
  const summaryContent = document.getElementById("summary-content");

  let summaryHTML = `<p>Thank you, ${customer.name}! Your purchase was successful.</p>`;
  summaryHTML += `<p>Email: ${customer.email}</p>`;
  summaryHTML += `<p>Phone: ${customer.phone}</p>`;
  summaryHTML += "<h3>Order Summary:</h3><ul>";
  items.forEach(item => {
    summaryHTML += `<li>${item.name} - Quantity: ${item.quantity} - GHC ${(item.price * item.quantity).toFixed(2)}</li>`;
  });
  summaryHTML += "</ul>";

  summaryContent.innerHTML = summaryHTML;
  summaryModal.classList.remove("hidden");
}

function closeSummary() {
  document.getElementById("summary-modal").classList.add("hidden");
  window.location.reload();
}
