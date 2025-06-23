// Firebase configuration (replace with your actual config)
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID",
//   measurementId: "YOUR_MEASUREMENT_ID"
// };

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

// Mock Firebase and related functions for demonstration purposes
const firebase = {
  auth: () => ({
    currentUser: { uid: "testUser" }, // Mock user
    onAuthStateChanged: (callback) => {
      // Simulate auth state change
      callback({ uid: "testUser" }) // Simulate user being logged in
    },
  }),
}

async function loadCartItems() {
  // Mock implementation to return some cart items
  return [
    {
      id: "1",
      name: "Invitation 1",
      category: "cumpleanos",
      price: 10,
      data: { eventName: "Event 1", date: "2024-01-01", location: "Location 1", primaryColor: "#FF0000" },
    },
    {
      id: "2",
      name: "Invitation 2",
      category: "bodas",
      price: 20,
      data: { eventName: "Event 2", date: "2024-02-02", location: "Location 2", primaryColor: "#00FF00" },
    },
  ]
}

async function validatePromoCode(code) {
  // Mock implementation to validate promo codes
  if (code === "DISCOUNT10") {
    return { valid: true, discount: 10 }
  } else {
    return { valid: false, message: "Código inválido" }
  }
}

async function removeFromCart(itemId) {
  // Mock implementation to remove item from cart
  console.log(`Removing item ${itemId} from cart`)
  return true
}

function showNotification(message, type = "success") {
  // Mock implementation to show notifications
  alert(`${type.toUpperCase()}: ${message}`)
}

class CartManagerFirebase {
  constructor() {
    this.cart = []
    this.promoCode = null
    this.discount = 0
    this.init()
  }

  async init() {
    await this.loadCartFromFirebase()
    this.setupEventListeners()
  }

  async loadCartFromFirebase() {
    const user = firebase.auth().currentUser
    if (!user) {
      window.location.href = "index.html"
      return
    }

    try {
      this.cart = await loadCartItems()
      this.renderCart()
    } catch (error) {
      console.error("Error loading cart:", error)
      showNotification("Error al cargar el carrito", "error")
    }
  }

  setupEventListeners() {
    // Promo code
    document.getElementById("applyPromo").addEventListener("click", () => {
      this.applyPromoCode()
    })

    // Checkout button
    document.getElementById("checkoutBtn").addEventListener("click", () => {
      this.proceedToCheckout()
    })

    // Enter key for promo code
    document.getElementById("promoInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.applyPromoCode()
      }
    })
  }

  renderCart() {
    const cartItems = document.getElementById("cartItems")
    const emptyCart = document.getElementById("emptyCart")
    const cartItemsList = document.getElementById("cartItemsList")
    const cartSummary = document.getElementById("cartSummary")

    if (this.cart.length === 0) {
      emptyCart.style.display = "block"
      cartItemsList.style.display = "none"
      cartSummary.style.display = "none"
    } else {
      emptyCart.style.display = "none"
      cartItemsList.style.display = "block"
      cartSummary.style.display = "block"

      this.renderCartItems()
      this.updateSummary()
    }
  }

  renderCartItems() {
    const cartItemsList = document.getElementById("cartItemsList")
    cartItemsList.innerHTML = ""

    this.cart.forEach((item, index) => {
      const cartItem = document.createElement("div")
      cartItem.className = "cart-item"
      cartItem.innerHTML = `
        <div class="cart-item-image">
          <div class="invitation-thumbnail" style="background: ${item.data.primaryColor};">
            <div class="thumbnail-content">
              <h4>${item.data.title}</h4>
              <p>${item.data.eventName}</p>
            </div>
          </div>
        </div>
        <div class="cart-item-details">
          <h3 class="cart-item-name">${item.name}</h3>
          <p class="cart-item-category">${this.getCategoryName(item.category)}</p>
          <div class="cart-item-customization">
            <span class="customization-label">Personalización:</span>
            <span class="customization-details">
              ${item.data.eventName} • ${item.data.date} • ${item.data.location}
            </span>
          </div>
        </div>
        <div class="cart-item-actions">
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          <div class="cart-item-buttons">
            <button class="btn btn-outline btn-sm" onclick="cartManagerFirebase.editItem('${item.id}')">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Editar
            </button>
            <button class="btn btn-outline btn-sm btn-danger" onclick="cartManagerFirebase.removeItem('${item.id}')">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      `
      cartItemsList.appendChild(cartItem)
    })
  }

  updateSummary() {
    const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0)
    const discountAmount = subtotal * (this.discount / 100)
    const total = subtotal - discountAmount

    document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`
    document.getElementById("discount").textContent = `-$${discountAmount.toFixed(2)}`
    document.getElementById("total").textContent = `$${total.toFixed(2)}`

    // Show/hide discount row
    const discountRow = document.querySelector(".summary-row:has(#discount)")
    if (discountAmount > 0) {
      discountRow.style.display = "flex"
    } else {
      discountRow.style.display = "none"
    }
  }

  async applyPromoCode() {
    const promoInput = document.getElementById("promoInput")
    const code = promoInput.value.trim().toUpperCase()

    if (!code) {
      showNotification("Ingresa un código de descuento", "error")
      return
    }

    try {
      const result = await validatePromoCode(code)

      if (result.valid) {
        this.promoCode = code
        this.discount = result.discount
        this.updateSummary()
        promoInput.value = ""
        showNotification(`¡Código aplicado! ${this.discount}% de descuento`)
      } else {
        showNotification(result.message, "error")
      }
    } catch (error) {
      console.error("Error validating promo code:", error)
      showNotification("Error al validar código", "error")
    }
  }

  editItem(itemId) {
    // Store the item ID for editing
    localStorage.setItem("editingItemId", itemId)
    // Find the item
    const item = this.cart.find((cartItem) => cartItem.id === itemId)
    if (item) {
      window.location.href = `product-detail.html?edit=true&category=${item.category}`
    }
  }

  async removeItem(itemId) {
    if (confirm("¿Estás seguro de que quieres eliminar esta invitación del carrito?")) {
      const success = await removeFromCart(itemId)
      if (success) {
        await this.loadCartFromFirebase()
        showNotification("Invitación eliminada del carrito")
      } else {
        showNotification("Error al eliminar del carrito", "error")
      }
    }
  }

  proceedToCheckout() {
    if (this.cart.length === 0) {
      showNotification("Tu carrito está vacío", "error")
      return
    }

    // Store checkout data in localStorage for the checkout page
    const checkoutData = {
      items: this.cart,
      subtotal: this.cart.reduce((sum, item) => sum + item.price, 0),
      discount: this.discount,
      promoCode: this.promoCode,
      total: this.cart.reduce((sum, item) => sum + item.price, 0) * (1 - this.discount / 100),
    }

    localStorage.setItem("checkoutData", JSON.stringify(checkoutData))
    window.location.href = "checkout.html"
  }

  getCategoryName(category) {
    const categories = {
      cumpleanos: "Cumpleaños",
      bodas: "Bodas",
      "baby-shower": "Baby Shower",
      graduaciones: "Graduaciones",
      empresariales: "Empresariales",
      quinceaneras: "Quinceañeras",
    }
    return categories[category] || "Invitación"
  }
}

// Initialize cart manager
let cartManagerFirebase
document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      cartManagerFirebase = new CartManagerFirebase()
    } else {
      window.location.href = "index.html"
    }
  })
})
