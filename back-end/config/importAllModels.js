export default async function importAllModels() {
    const { default: m999 } = await import(
        "../modules/companies/models/company.js"
    );

    const { default: m998 } = await import(
        "../modules/companies/models/brand.js"
    );
    // Temp import to be able to register them in sequelize
    const { default: m1 } = await import("../modules/auth/models/user.js"); // T
    const { default: m1C } = await import(
        "../modules/settings/models/devComment.js"
    ); // T

    const { default: m2 } = await import("../modules/offers/models/offer.js"); // T
    const { default: m3 } = await import("../modules/products/models/sku.js"); //
    const { default: m4 } = await import(
        "../modules/offers/models/skuOffer.js"
    ); //
    const { default: m5 } = await import(
        "../modules/offers/models/offerSequence.js"
    ); //
    const { default: m234 } = await import(
        "../modules/campaigns/models/shipment.js"
    ); //
    const { default: m6 } = await import("../modules/offers/models/chain.js"); //
    const { default: m7 } = await import(
        "../modules/campaigns/models/campaign.js" //
    );
    const { default: m8 } = await import(
        "../modules/campaigns/models/address.js"
    ); //
    const { default: m10 } = await import(
        "../modules/clients/models/client.js" //
    );
    const { default: m11 } = await import(
        "../modules/offers/models/clientOffer.js" //
    );
    const { default: m12 } = await import("../modules/orders/models/order.js"); //
    const { default: m235354 } = await import(
        "../modules/orders/models/skuOrder.js" //
    ); //
    const { default: m13 } = await import(
        "../modules/offers/models/exportationHistory.js" //
    );
    const { default: m14 } = await import(
        "../modules/settings/models/payeeName.js" //
    );
    const { default: m15 } = await import(
        "../modules/clients/models/clientsImportHistory.js" //
    );
    const { default: m16 } = await import(
        "../modules/clients/models/comments.js" //
    );
    const { default: m17 } = await import(
        "../modules/campaigns/models/keyCodeDetails.js" //
    );
    const { default: m18 } = await import(
        "../modules/campaigns/models/keyCode.js" //
    );
    const { default: m19 } = await import(
        "../modules/offers/models/offerPrint.js" //
    );
    const { default: m20 } = await import(
        "../modules/settings/models/paymentMethod.js" //
    );
    const { default: m21 } = await import(
        "../modules/accounting/models/invoice.js" //
    );
    const { default: m22 } = await import(
        "../modules/accounting/models/payment.js" //
    );
    const { default: m28 } = await import(
        "../modules/offers/models/printHistory.js"
    );

    const { default: m102 } = await import(
        "../modules/campaigns/models/campaignOffer.js" //
    );
    const { default: m3333 } = await import(
        "../modules/settings/models/country.js"
    );

    const { default: m6342 } = await import(
        "../modules/offers/models/chainOffer.js"
    );

    const {default: m55} = await import("../modules/products/models/prouctCategory.js")
    const {default: m56} = await import("../modules/products/models/category.js")
    const {default: m57} = await import("../modules/products/models/product.js")
}