/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — STBilling (Google Play Billing via Digital Goods API)
   ═══════════════════════════════════════════════════════════════════
   Gestion des achats intégrés sur Android TWA (Trusted Web Activity)
   Conforme à la norme W3C Digital Goods API v2.1 & Payment Request API.

   Produits déclarés sur Google Play Console :
     - pack_starter    ($1.99)
     - pack_adventurer ($4.99)
     - pack_legendary  ($9.99)
     - pack_ultimate   ($19.99)
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  const PLAY_BILLING_METHOD = "https://play.google.com/billing";
  let serviceInstance = null;
  let initPromise = null;

  const PRODUCT_SKUS = {
    starter: "pack_starter",
    adventurer: "pack_adventurer",
    legendary: "pack_legendary",
    ultimate: "pack_ultimate",
  };

  /**
   * Indique si l'API Digital Goods (Play Billing TWA) est supportée par le navigateur/app.
   */
  function isAvailable() {
    return typeof window !== "undefined" && "getDigitalGoodsService" in window;
  }

  /**
   * Initialise et retourne l'instance du service Digital Goods pour Google Play.
   * Utilise une promesse partagée pour éviter les race conditions.
   */
  async function getService() {
    if (serviceInstance) return serviceInstance;
    if (!isAvailable()) return null;

    // Si une initialisation est déjà en cours, attendre la même promesse
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        serviceInstance = await window.getDigitalGoodsService(PLAY_BILLING_METHOD);
        console.log("[STBilling] Digital Goods Service connecté à Google Play Billing");
      } catch (err) {
        console.warn("[STBilling] Impossible de se connecter à Digital Goods Service:", err);
        serviceInstance = null;
      } finally {
        initPromise = null;
      }
      return serviceInstance;
    })();

    return initPromise;
  }

  /**
   * Récupère les détails des produits (prix localisés, titre, description) depuis le Play Store.
   * @param {string[]} itemIds List of SKU IDs (ex: ['pack_starter', 'pack_adventurer'])
   */
  async function getProductDetails(itemIds) {
    const service = await getService();
    if (!service) return [];

    try {
      const details = await service.getDetails(itemIds);
      return details || [];
    } catch (err) {
      console.error("[STBilling] Erreur lors de la récupération des détails produits:", err);
      return [];
    }
  }

  /**
   * Consomme les achats en attente au démarrage de l'app.
   * Protège contre la perte de produits si le réseau coupe après paiement
   * mais avant la consommation du token.
   */
  async function consumePendingPurchases() {
    const service = await getService();
    if (!service || typeof service.listPurchases !== "function") return;

    try {
      const purchases = await service.listPurchases();
      if (!purchases || purchases.length === 0) return;

      for (const purchase of purchases) {
        if (purchase && purchase.purchaseToken) {
          try {
            await service.consume(purchase.purchaseToken);
            console.log("[STBilling] Achat en attente consommé:", purchase.itemId || "unknown");
          } catch (consumeErr) {
            console.warn("[STBilling] Erreur consommation achat en attente:", consumeErr);
          }
        }
      }
    } catch (err) {
      console.warn("[STBilling] Erreur lors de la récupération des achats en attente:", err);
    }
  }

  /**
   * Déclenche la procédure d'achat d'un pack via Google Pay / Play Store.
   * @param {string} sku L'identifiant SKU du produit (ex: 'pack_starter')
   * @returns {Promise<{ success: boolean, purchaseToken?: string, error?: string }>}
   */
  async function purchase(sku) {
    const service = await getService();
    if (!service) {
      return { success: false, error: "digital_goods_not_supported" };
    }

    try {
      const paymentMethodData = [
        {
          supportedMethods: PLAY_BILLING_METHOD,
          data: { sku: sku },
        },
      ];

      // Fournir un objet details factice pour compatibilité avec tous les Chromium/WebView
      const paymentDetails = {
        total: { label: "Total", amount: { currency: "USD", value: "0" } },
      };

      const request = new PaymentRequest(paymentMethodData, paymentDetails);
      const paymentResponse = await request.show();

      const details = paymentResponse.details || {};
      const purchaseToken = details.purchaseToken;

      if (!purchaseToken) {
        await paymentResponse.complete("fail");
        return { success: false, error: "missing_purchase_token" };
      }

      // Pour les consommables (packs de boosters), consommer le jeton pour ré-autoriser l'achat
      try {
        await service.consume(purchaseToken);
        console.log("[STBilling] Produit consommé avec succès:", sku);
      } catch (consumeErr) {
        console.warn("[STBilling] Erreur lors de la consommation du jeton:", consumeErr);
      }

      await paymentResponse.complete("success");
      return { success: true, sku, purchaseToken };
    } catch (err) {
      console.warn("[STBilling] Achat annulé ou échoué pour SKU:", sku, err);
      return { success: false, error: err && err.message ? err.message : "purchase_failed" };
    }
  }

  // Consomme les achats en attente au chargement
  try { consumePendingPurchases(); } catch (_) {}

  // Export sur window.STBilling
  window.STBilling = {
    isAvailable,
    getService,
    getProductDetails,
    purchase,
    consumePendingPurchases,
    PRODUCT_SKUS,
  };
})();
