# 🎨 UI & Frontend Documentation

The frontend dashboard is built using **React** with **Pure Vanilla CSS** styling to match the reference design specifications.

---

## Architecture

| Component | File Path | Description |
|-----------|-----------|-------------|
| **Login** | `/src/pages/Login.jsx` | Merchant authentication interface |
| **Dashboard** | `/src/pages/Dashboard.jsx` | Main view showing API keys and statistics |
| **Transactions** | `/src/pages/Transactions.jsx` | Table view of all payment history |

---

## Styling Strategy

The project uses a component-specific **CSS stylesheet** for each page, avoiding framework dependencies like Tailwind or Bootstrap to ensure a clean, custom look.

### 1. Login Page (`Login.css`)
*   **Design:** Clean, centered card layout with shadow elevation.
*   **Color Palette:** White card (`#ffffff`) on a light gray-blue background (`#f4f6fb`).
*   **Primary Action:** Indigo button (`#4f46e5`) with hover states.

### 2. Dashboard (`Dashboard.css`)
*   **Layout:** Responsive grid system.
    *   **Desktop:** 3-column grid for statistics.
    *   **Mobile:** Stacked layout for readability on smaller screens.
*   **Elements:** 
    *   **Credential Cards:** Display API Key/Secret with clear labels.
    *   **Stat Cards:** High-contrast stats for total volume and transactions.

### 3. Transactions Table (`Transactions.css`)
*   **Style:** Minimalist table design.
*   **Readability:** Generous padding and bottom borders for row separation.
*   **Width:** Full-width container scaling.

---

## Responsive Design

All pages implement media queries to ensure compatibility across devices:

```css
/* Example from Dashboard.css */
@media (max-width: 900px) {
    .credentials {
        flex-direction: column;
    }
    .stats {
        grid-template-columns: 1fr;
    }
}
```

This ensures the dashboard is usable on phones, tablets, and desktops.
