const STYLE_ID = "hc-home-ticket-card-spacing-final";

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [data-public-ticket-catalog-home="true"] [data-ticket-card-subtitle] {
      margin-top: 1.8rem !important;
      margin-bottom: 0 !important;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] h2 {
      margin-top: 0.7rem !important;
      margin-bottom: 0 !important;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > div:nth-child(2) {
      margin-top: 0.7rem !important;
      margin-bottom: 0.7rem !important;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > p {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      line-height: 1.1;
    }

    [data-public-ticket-catalog-home="true"] article[data-ticket-product-code] > button {
      margin-top: 1rem !important;
    }
  `;

  document.head.appendChild(style);
}

export function installHomeTicketCardSpacingEnhancements(): void {
  if (typeof document === "undefined") return;
  injectStyles();
}
