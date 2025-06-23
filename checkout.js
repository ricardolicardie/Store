// Checkout Page JavaScript
class CheckoutManager {
  constructor() {
    this.checkoutData = JSON.parse(localStorage.getItem("checkoutData") || "{}")
    this.currentStep = 1
    this.stripe = null
    this.elements = null
    this.cardNumber = null
    this.cardExpiry = null
    this.cardCvc = null

    this.init()
  }

  init() {
    if (Object.keys(this.checkoutData).length === 0) {
      // Redirect to cart if no checkout data
      window.location.href = "cart.html"
      return
    }

    this.renderOrderSummary()
    this.setupEventListeners()
    this.initializeStripe()
  }

  setupEventListeners() {
    // Step navigation
    document.getElementById("continueToPayment").addEventListener("click", () => {
      this.validateStep1() && this.goToStep(2)
    })

    document.getElementById("backToInfo").addEventListener("click", () => {
      this.goToStep(1)
    })

    document.getElementById("processPayment").addEventListener("click", () => {
      this.processPayment()
    })

    // Payment method selection
    document.querySelectorAll('input[name="payment"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.switchPaymentMethod(e.target.value)
      })
    })

    // Form validation
    document.getElementById("customerForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.validateStep1() && this.goToStep(2)
    })
  }

  initializeStripe() {
    // Initialize Stripe (using test key - replace with your actual key)
    this.stripe = Stripe("pk_test_51234567890abcdef") // Replace with your Stripe publishable key
    this.elements = this.stripe.elements()

    // Create card elements
    const style = {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
    }

    this.cardNumber = this.elements.create("cardNumber", { style })
    this.cardExpiry = this.elements.create("cardExpiry", { style })
    this.cardCvc = this.elements.create("cardCvc", { style })

    // Mount elements
    this.cardNumber.mount("#card-number-element")
    this.cardExpiry.mount("#card-expiry-element")
    this.cardCvc.mount("#card-cvc-element")

    // Handle real-time validation errors
    ;[this.cardNumber, this.cardExpiry, this.cardCvc].forEach((element) => {
      element.on("change", ({ error }) => {
        const displayError = document.getElementById("card-errors")
        if (error) {
          displayError.textContent = error.message
        } else {
          displayError.textContent = ""
        }
      })
    })
  }

  renderOrderSummary() {
    const checkoutItems = document.getElementById("checkoutItems")
    const subtotal = document.getElementById("checkoutSubtotal")
    const discount = document.getElementById("checkoutDiscount")
    const total = document.getElementById("checkoutTotal")

    // Render items
    checkoutItems.innerHTML = ""
    this.checkoutData.items.forEach((item) => {
      const itemElement = document.createElement("div")
      itemElement.className = "checkout-item"
      itemElement.innerHTML = `
                <div class="checkout-item-info">
                    <h4>${item.name}</h4>
                    <p>${this.getCategoryName(item.category)}</p>
                </div>
                <div class="checkout-item-price">$${item.price.toFixed(2)}</div>
            `
      checkoutItems.appendChild(itemElement)
    })

    // Update totals
    subtotal.textContent = `$${this.checkoutData.subtotal.toFixed(2)}`
    const discountAmount = this.checkoutData.subtotal * (this.checkoutData.discount / 100)
    discount.textContent = `-$${discountAmount.toFixed(2)}`
    total.textContent = `$${this.checkoutData.total.toFixed(2)}`
  }

  validateStep1() {
    const firstName = document.getElementById("firstName").value.trim()
    const lastName = document.getElementById("lastName").value.trim()
    const email = document.getElementById("email").value.trim()

    if (!firstName || !lastName || !email) {
      showNotification("Por favor completa todos los campos requeridos", "error")
      return false
    }

    if (!this.isValidEmail(email)) {
      showNotification("Por favor ingresa un email válido", "error")
      return false
    }

    return true
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  goToStep(step) {
    // Update step indicators
    document.querySelectorAll(".step").forEach((stepEl, index) => {
      if (index + 1 <= step) {
        stepEl.classList.add("active")
      } else {
        stepEl.classList.remove("active")
      }
    })

    // Show/hide step content
    document.querySelectorAll(".checkout-step").forEach((stepEl) => {
      stepEl.classList.remove("active")
    })
    document.getElementById(`step${step}`).classList.add("active")

    this.currentStep = step
  }

  switchPaymentMethod(method) {
    document.querySelectorAll(".payment-method").forEach((methodEl) => {
      methodEl.classList.remove("active")
    })
    document.querySelector(`[data-method="${method}"]`).classList.add("active")

    // Show/hide payment forms
    document.getElementById("cardPayment").style.display = method === "card" ? "block" : "none"
    document.getElementById("paypalPayment").style.display = method === "paypal" ? "block" : "none"

    if (method === "paypal") {
      this.initializePayPal()
    }
  }

  initializePayPal() {
    // Initialize PayPal SDK (mock implementation)
    const paypalContainer = document.getElementById("paypal-button-container")
    paypalContainer.innerHTML = `
            <div class="paypal-mock">
                <button class="btn btn-primary" onclick="checkoutManager.processPayPalPayment()">
                    Pagar con PayPal - $${this.checkoutData.total.toFixed(2)}
                </button>
                <p class="paypal-note">Serás redirigido a PayPal para completar el pago</p>
            </div>
        `
  }

  async processPayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value
    const processBtn = document.getElementById("processPayment")

    this.setLoadingState(processBtn, true)

    try {
      if (paymentMethod === "card") {
        await this.processCardPayment()
      } else {
        await this.processPayPalPayment()
      }
    } catch (error) {
      console.error("Payment error:", error)
      showNotification("Error al procesar el pago. Inténtalo de nuevo.", "error")
    } finally {
      this.setLoadingState(processBtn, false)
    }
  }

  async processCardPayment() {
    // Simulate card payment processing
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock successful payment
        const success = Math.random() > 0.1 // 90% success rate for demo

        if (success) {
          this.completeOrder()
          resolve()
        } else {
          reject(new Error("Payment failed"))
        }
      }, 2000)
    })
  }

  async processPayPalPayment() {
    // Simulate PayPal payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        this.completeOrder()
        resolve()
      }, 1500)
    })
  }

  completeOrder() {
    // Generate order number
    const orderNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Store order in localStorage (in a real app, this would be sent to a server)
    const order = {
      orderNumber,
      date: new Date().toISOString(),
      items: this.checkoutData.items,
      customer: {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
      },
      total: this.checkoutData.total,
      status: "completed",
    }

    // Save order to orders history
    const orders = JSON.parse(localStorage.getItem("orders") || "[]")
    orders.unshift(order)
    localStorage.setItem("orders", JSON.stringify(orders))

    // Clear cart and checkout data
    localStorage.removeItem("cart")
    localStorage.removeItem("checkoutData")

    // Update order number in confirmation
    document.getElementById("orderNumber").textContent = orderNumber

    // Render order items in confirmation
    const orderItems = document.getElementById("orderItems")
    orderItems.innerHTML = ""
    order.items.forEach((item) => {
      const itemElement = document.createElement("div")
      itemElement.className = "order-item"
      itemElement.innerHTML = `
                <span>${item.name}</span>
                <span>$${item.price.toFixed(2)}</span>
            `
      orderItems.appendChild(itemElement)
    })

    // Go to confirmation step
    this.goToStep(3)

    showNotification("¡Pago procesado exitosamente!")
  }

  setLoadingState(button, loading) {
    const btnText = button.querySelector(".btn-text")
    const btnLoader = button.querySelector(".btn-loader")

    if (loading) {
      btnText.style.display = "none"
      btnLoader.style.display = "inline-flex"
      button.disabled = true
    } else {
      btnText.style.display = "inline"
      btnLoader.style.display = "none"
      button.disabled = false
    }
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

// Initialize checkout manager
let checkoutManager
document.addEventListener("DOMContentLoaded", () => {
  checkoutManager = new CheckoutManager()
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
