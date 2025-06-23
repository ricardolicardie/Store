// Cart Page JavaScript
class CartManager {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem("cart") || "[]")
    this.promoCode = null
    this.discount = 0
    this.init()
  }

  init() {
    this.renderCart()
    this.setupEventListeners()
    this.updateCartCount()
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
                        <button class="btn btn-outline btn-sm" onclick="cartManager.editItem(${index})">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            Editar
                        </button>
                        <button class="btn btn-outline btn-sm btn-danger" onclick="cartManager.removeItem(${index})">
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

  applyPromoCode() {
    const promoInput = document.getElementById("promoInput")
    const code = promoInput.value.trim().toUpperCase()

    // Mock promo codes
    const promoCodes = {
      WELCOME10: 10,
      SAVE20: 20,
      FIRST15: 15,
      HOLIDAY25: 25,
    }

    if (promoCodes[code]) {
      this.promoCode = code
      this.discount = promoCodes[code]
      this.updateSummary()
      promoInput.value = ""
      showNotification(`¡Código aplicado! ${this.discount}% de descuento`)
    } else {
      showNotification("Código de descuento inválido", "error")
    }
  }

  editItem(index) {
    const item = this.cart[index]
    // Store the item data for editing
    localStorage.setItem("editingItem", JSON.stringify({ index, item }))
    // Redirect to product detail page with the item data
    window.location.href = `product-detail.html?edit=true&category=${item.category}`
  }

  removeItem(index) {
    if (confirm("¿Estás seguro de que quieres eliminar esta invitación del carrito?")) {
      this.cart.splice(index, 1)
      localStorage.setItem("cart", JSON.stringify(this.cart))
      this.renderCart()
      this.updateCartCount()
      showNotification("Invitación eliminada del carrito")
    }
  }

  proceedToCheckout() {
    if (this.cart.length === 0) {
      showNotification("Tu carrito está vacío", "error")
      return
    }

    // Store checkout data
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

  updateCartCount() {
    const cartCount = document.getElementById("cartCount")
    if (cartCount) {
      cartCount.textContent = this.cart.length
    }
  }
}

// Initialize cart manager
let cartManager
document.addEventListener("DOMContentLoaded", () => {
  cartManager = new CartManager()
})

// Utility function for notifications
function showNotification(message, type = "success") {
  const existingNotification = document.querySelector(".notification")
  if (existingNotification) {
    existingNotification.remove()
  }

  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: type === "success" ? "linear-gradient(to right, #ec4899, #a855f7)" : "#ef4444",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: "1000",
    fontSize: "14px",
    fontWeight: "500",
    transform: "translateX(100%)",
    transition: "transform 0.3s ease",
    maxWidth: "300px",
    wordWrap: "break-word",
  })

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 300)
  }, 3000)
}
