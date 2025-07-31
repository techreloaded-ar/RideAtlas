'use client'

import CookieConsent from "react-cookie-consent"

export default function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accetta tutti i cookie"
      declineButtonText="Rifiuta cookie non essenziali"
      enableDeclineButton
      cookieName="rideatlas-cookie-consent"
      style={{
        background: "rgba(0, 0, 0, 0.9)",
        fontSize: "14px",
        fontFamily: "var(--font-inter), sans-serif",
        zIndex: 9999,
      }}
      buttonStyle={{
        background: "#2563eb",
        color: "white",
        fontSize: "14px",
        borderRadius: "6px",
        padding: "8px 16px",
        border: "none",
        cursor: "pointer",
        fontWeight: "500",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "white",
        fontSize: "14px",
        borderRadius: "6px",
        padding: "8px 16px",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        cursor: "pointer",
        fontWeight: "500",
        marginRight: "10px",
      }}
      expires={365}
      onAccept={() => {
        console.log("Cookie accettati")
      }}
      onDecline={() => {
        console.log("Cookie non essenziali rifiutati")
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <span className="text-white">
          Questo sito utilizza cookie per migliorare la tua esperienza di navigazione. 
          I cookie essenziali sono necessari per il funzionamento del sito.
        </span>
        <a 
          href="/privacy-policy" 
          className="text-blue-300 hover:text-blue-200 underline text-sm whitespace-nowrap"
        >
          Informativa Privacy
        </a>
      </div>
    </CookieConsent>
  )
}