(function () {
  class PaymentGateway {
    constructor(options) {
      if (!options || !options.key || !options.orderId) {
        throw new Error("key and orderId are required");
      }

      this.key = options.key;
      this.orderId = options.orderId;
      this.onSuccess = options.onSuccess || function () { };
      this.onFailure = options.onFailure || function () { };
      this.onClose = options.onClose || function () { };

      this.modalId = "payment-gateway-modal";
      this.messageHandler = this.handleMessage.bind(this);

      // Checkout service origin (important for security)
      this.checkoutOrigin = "http://localhost:3001";
    }

    open() {
      if (document.getElementById(this.modalId)) return;

      const modal = document.createElement("div");
      modal.id = this.modalId;
      modal.setAttribute("data-testid", "payment-modal");

      const iframeSrc =
        `${this.checkoutOrigin}/checkout?order_id=${encodeURIComponent(
          this.orderId
        )}` +
        `&key=${encodeURIComponent(this.key)}` +
        `&origin=${encodeURIComponent(window.location.origin)}` +
        `&embedded=true`;

      modal.innerHTML = `
        <div class="modal-overlay" style="
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
        ">
          <div class="modal-content" style="
            width: 95%;
            max-width: 480px;
            height: 600px;
            max-height: 90vh;
            background: #fff;
            border-radius: 16px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
          ">
            <button data-testid="close-modal-button" style="
              position: absolute;
              top: 15px;
              right: 15px;
              z-index: 10;
              background: rgba(255,255,255,0.8);
              border: none;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 24px;
              color: #333;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">×</button>

            <iframe
              data-testid="payment-iframe"
              src="${iframeSrc}"
              style="width: 100%; height: 100%; border: none;"
            ></iframe>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const closeBtn = modal.querySelector('[data-testid="close-modal-button"]');
      closeBtn.addEventListener("click", () => this.close());

      window.addEventListener("message", this.messageHandler);
    }

    handleMessage(event) {
      if (!event || !event.data) return;

      // Security: only accept messages from checkout page origin
      if (event.origin !== this.checkoutOrigin) return;

      const { type, data } = event.data;

      if (type === "payment_success") {
        this.onSuccess(data);
        this.close();
        return;
      }

      if (type === "payment_failed") {
        this.onFailure(data);
        return;
      }

      if (type === "close_modal") {
        this.close();
      }
    }

    close() {
      const modal = document.getElementById(this.modalId);
      if (modal) modal.remove();

      window.removeEventListener("message", this.messageHandler);
      this.onClose();
    }
  }

  window.PaymentGateway = PaymentGateway;
})();
