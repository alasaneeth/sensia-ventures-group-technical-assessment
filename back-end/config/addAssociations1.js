async function addAssociations1() {
    // Company and Brand associations
    const { default: Company } = await import(
        "../modules/companies/models/company.js"
    );
    const { default: Brand } = await import(
        "../modules/companies/models/brand.js"
    );
    // Lazy import models to avoid circular dependencies
    const { default: Campaign } = await import(
        "../modules/campaigns/models/campaign.js"
    );
    const { default: Client } = await import(
        "../modules/clients/models/client.js"
    );
    const { default: ClientOffer } = await import(
        "../modules/offers/models/clientOffer.js"
    );
    const { default: OfferSequence } = await import(
        "../modules/offers/models/offerSequence.js"
    );
    const { default: Chain } = await import(
        "../modules/offers/models/chain.js"
    );
    const { default: Order } = await import(
        "../modules/orders/models/order.js"
    );
    const { default: Address } = await import(
        "../modules/campaigns/models/address.js"
    );
    const { default: Comment } = await import(
        "../modules/clients/models/comments.js"
    );

    const { default: KeyCodeDetails } = await import(
        "../modules/campaigns/models/keyCodeDetails.js"
    );
    const { default: KeyCode } = await import(
        "../modules/campaigns/models/keyCode.js"
    );
    const { default: PayeeName } = await import(
        "../modules/settings/models/payeeName.js"
    );
    const { default: Payment } = await import(
        "../modules/accounting/models/payment.js"
    );
    const { default: User } = await import("../modules/auth/models/user.js");
    const { default: Shipment } = await import(
        "../modules/campaigns/models/shipment.js"
    );
    const { default: DevComment } = await import(
        "../modules/settings/models/devComment.js"
    );
    const { default: PrintHistory } = await import(
        "../modules/offers/models/printHistory.js"
    );
    const { default: ClientsImportHistory } = await import(
        "../modules/clients/models/clientsImportHistory.js"
    );

    const { default: CampaignOffer } = await import(
        "../modules/campaigns/models/campaignOffer.js"
    );

    const { default: ChainOffer } = await import(
        "../modules/offers/models/chainOffer.js"
    );

    // Import Offer and OfferPrint early to avoid initialization errors
    const { default: Offer } = await import(
        "../modules/offers/models/offer.js"
    );
    const { default: OfferPrint } = await import(
        "../modules/offers/models/offerPrint.js"
    );

    DevComment.belongsTo(User, { foreignKey: "userId", as: "user" });

    // Campaign associations
    Campaign.belongsTo(Chain, { foreignKey: "chainId", as: "chain" });
    Chain.hasMany(Campaign, { foreignKey: "chainId", as: "campaigns" });

    // The chain contains offers - many-to-many relationship through ChainOffer
    Chain.belongsToMany(Offer, {
        foreignKey: "chainId",
        otherKey: "offerId",
        through: ChainOffer,
        as: "offers",
    });

    Offer.belongsToMany(Chain, {
        foreignKey: "offerId",
        otherKey: "chainId",
        through: ChainOffer,
        as: "chains",
    });

    ChainOffer.belongsTo(Offer, {
        foreignKey: "offerId",
        as: "offer",
    });

    // Many to many relation between campaign and offers
    Campaign.belongsToMany(Offer, {
        foreignKey: "campaignId",
        through: CampaignOffer,
        as: "offers",
    });

    // Reverse many-to-many relationship so offers can access their campaigns
    Offer.belongsToMany(Campaign, {
        foreignKey: "offerId",
        through: CampaignOffer,
        as: "campaigns",
    });

    // Direct access to the junction table from both sides
    Campaign.hasMany(CampaignOffer, {
        foreignKey: "campaignId",
        as: "campaignOffers",
    });

    // Offer can access the more information for return address and other like printer
    Offer.hasMany(CampaignOffer, {
        foreignKey: "offerId",
        as: "offerCampaigns",
    });

    // Junction table access to parent models
    CampaignOffer.belongsTo(Campaign, {
        foreignKey: "campaignId",
    });

    CampaignOffer.belongsTo(Offer, {
        foreignKey: "offerId",
    });

    // Campaign to Address association for mainPoBox
    // Address.hasMany(Campaign, { foreignKey: "mainPoBoxId", as: "campaigns" });
    // Campaign.hasMany(OfferSequence, { foreignKey: "campaignId", as: "offerSequences" });
    // OfferSequence.belongsTo(Campaign, { foreignKey: "campaignId", as: "campaign" });

    // Many-to-many relationship between Campaign and Client through KeyCode
    Campaign.belongsToMany(Client, {
        through: KeyCode,
        foreignKey: "campaignId",
        as: "clients",
        otherKey: "clientId",
        uniqueKey: false, // Prevent automatic unique constraint
    });
    Client.belongsToMany(Campaign, {
        through: KeyCode,
        foreignKey: "clientId",
        as: "campaigns",
        otherKey: "campaignId",
        uniqueKey: false, // Prevent automatic unique constraint
    });

    Campaign.hasMany(KeyCode, {
        foreignKey: "campaignId",
        as: "keyCodes",
    });

    Client.hasMany(ClientOffer, { foreignKey: "clientId", as: "clientOffers" });
    // Campaign.belongsTo(Address, {
    //     foreignKey: "mainPoBoxId",
    //     as: "mainPoBox",
    // });

    // Campaign.belongsTo(Address, {
    //     foreignKey: "chainPoBoxId",
    //     as: "chainPoBox",
    // });
    // Chain.belongsTo(Address, {
    //     foreignKey: "returnAddressId",
    //     as: "returnAddress",
    // });

    // OfferSequence associations - connecting offers through sequences
    OfferSequence.belongsTo(Offer, {
        as: "currentOffer",
        foreignKey: "currentOfferId",
    });
    OfferSequence.belongsTo(Offer, {
        as: "nextOffer",
        foreignKey: "nextOfferId",
    });

    OfferSequence.belongsTo(Chain, { foreignKey: "chainId", as: "chain" });

    // Offers can have many sequences as current offer and as next offer
    Offer.hasMany(OfferSequence, {
        as: "currentOfferSequences",
        foreignKey: "currentOfferId",
        unique: false,
    });
    Offer.hasMany(OfferSequence, {
        as: "nextOfferSequences",
        foreignKey: "nextOfferId",
        unique: false,
    });

    // PayeeName association with CampaignOffer
    CampaignOffer.belongsTo(PayeeName, {
        foreignKey: "payeeNameId",
        as: "payeeName",
    });

    PayeeName.hasMany(CampaignOffer, {
        foreignKey: "payeeNameId",
        as: "campaignOffers",
    });

    // Address association with CampaignOffer
    CampaignOffer.belongsTo(Address, {
        foreignKey: "returnAddressId",
        as: "returnAddress",
    });

    Address.hasMany(CampaignOffer, {
        foreignKey: "returnAddressId",
        as: "campaignOffers",
    });

    // OfferSequence.belongsTo(Address, {
    //     foreignKey: "returnAddressId",
    //     as: "address",
    // });
    // Address.hasMany(OfferSequence, {
    //     foreignKey: "returnAddressId",
    //     as: "offerSequences",
    // });

    // Chain associations
    Chain.belongsTo(OfferSequence, {
        foreignKey: "offerSequenceId",
        as: "offerSequence",
    });
    OfferSequence.hasMany(Chain, {
        foreignKey: "offerSequenceId",
        as: "chains",
    });
    Chain.hasMany(OfferSequence, {
        foreignKey: "chainId",
        as: "offerSequences",
    });

    // ClientOffer associations
    ClientOffer.belongsTo(ClientOffer, {
        foreignKey: "originalOfferId",
        as: "originalOffer",
    });
    ClientOffer.belongsTo(Client, { foreignKey: "clientId", as: "client" });
    ClientOffer.belongsTo(Chain, {
        foreignKey: "chainId",
        as: "chain",
    });
    Chain.hasMany(ClientOffer, {
        foreignKey: "chainId",
        as: "clientOffers",
    });
    ClientOffer.belongsTo(Campaign, {
        foreignKey: "campaignId",
        as: "campaign",
    });
    Campaign.hasMany(ClientOffer, {
        foreignKey: "campaignId",
        as: "clientOffers",
    });
    ClientOffer.belongsTo(OfferSequence, {
        foreignKey: "currentSequenceId",
        as: "currentSequence",
    });
    ClientOffer.hasMany(Order, {
        foreignKey: "clientOfferId",
        onDelete: "SET NULL",
    });

    // A self relation from segment to segment
    KeyCodeDetails.belongsTo(KeyCodeDetails, {
        foreignKey: "fromSegmentId",
        as: "fromSegment",
    });

    // This will let us know to which segmentation we made the order
    ClientOffer.belongsTo(KeyCodeDetails, {
        foreignKey: "keyCodeId",
        as: "keyCode",
    });
    KeyCodeDetails.hasMany(ClientOffer, {
        foreignKey: "keyCodeId",
        as: "clientOffers",
    });

    // Order associations
    Order.belongsTo(ClientOffer, {
        foreignKey: "clientOfferId",
        as: "clientOffer",
        onDelete: "SET NULL",
    });
    Order.belongsTo(Client, {
        foreignKey: "clientId",
        as: "client",
        onDelete: "SET NULL",
    });
    Client.hasMany(Order, {
        foreignKey: "clientId",
        as: "orders",
        onDelete: "SET NULL",
    });

    // The order will know what is the key code it inserted from


    Order.belongsTo(KeyCodeDetails, {
        foreignKey: "keyCodeId",
        as: "keyCode",
    });
    KeyCodeDetails.hasMany(Order, {
        foreignKey: "keyCodeId",
        as: "orders",
    });

    // Comments
    Client.hasMany(Comment, { foreignKey: "clientId", as: "comments" });
    Comment.belongsTo(Client, { foreignKey: "clientId", as: "client" });

    // KeyCode and KeyCodeDetails associations
    // KeyCodeDetails has one-to-many relationship with KeyCode via the 'key' field
    // Note: No foreign key constraint since we're linking via non-primary key
    KeyCodeDetails.hasMany(KeyCode, {
        foreignKey: "keyId",
        as: "keyCodes",
        constraints: false, // Don't create foreign key constraint
    });
    KeyCode.belongsTo(KeyCodeDetails, {
        foreignKey: "keyId",
        as: "key",
        constraints: false, // Don't create foreign key constraint
    });

    // KeyCodeDetails belongs to Campaign
    KeyCodeDetails.belongsTo(Campaign, {
        foreignKey: "campaignId",
        as: "campaign",
    });
    Campaign.hasMany(KeyCodeDetails, {
        foreignKey: "campaignId",
        as: "keyCodeDetails",
    });

    // KeyCodeDetails belongs to Brand (moved below after Brand import)

    // Key code details also belongs to offers
    KeyCodeDetails.belongsTo(Offer, {
        foreignKey: "offerId",
        as: "offer",
    });
    KeyCode.belongsTo(Offer, {
        foreignKey: "offerId",
        as: "offer",
        unique: false, // Prevent automatic unique constraint
    });

    // OfferPrint associations
    OfferPrint.belongsTo(Client, {
        foreignKey: "clientId",
        as: "client",
    });
    OfferPrint.belongsTo(Campaign, {
        foreignKey: "campaignId",
        as: "campaign",
    });

    OfferPrint.belongsTo(KeyCodeDetails, {
        foreignKey: "keyCodeId",
        as: "keyCode",
    });
    KeyCodeDetails.hasMany(OfferPrint, {
        foreignKey: "keyCodeId",
        as: "offerPrints",
    });

    OfferPrint.belongsTo(ClientOffer, {
        foreignKey: "offerCode",
        as: "clientOffer",
    });
    ClientOffer.hasMany(OfferPrint, {
        foreignKey: "offerCode",
        as: "offerPrints",
    });

    Campaign.hasMany(OfferPrint, {
        foreignKey: "campaignId",
        as: "offerPrints",
    });
    Client.hasMany(OfferPrint, {
        foreignKey: "clientId",
        as: "offerPrints",
    });

    OfferPrint.belongsTo(Offer, {
        foreignKey: "offerId",
        as: "offer",
    });
    Offer.hasMany(OfferPrint, {
        foreignKey: "offerId",
        as: "offerPrints",
    });

    OfferPrint.belongsTo(Address, {
        foreignKey: "returnAddressId",
        as: "returnAddress",
        onDelete: "SET NULL",
    });

    Payment.belongsTo(User, {
        foreignKey: "confirmedById",
        as: "confirmedBy",
        onDelete: "SET NULL",
    });

    Shipment.belongsTo(Address, {
        foreignKey: "poBoxId",
        as: "poBox",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });

    // ExportationHistory associations
    const { default: ExportationHistory } = await import(
        "../modules/offers/models/exportationHistory.js"
    );

    // This association is now handled through CampaignOffer model

    ExportationHistory.belongsTo(Offer, {
        foreignKey: "offerId",
        as: "offerDetails",
    });
    Offer.hasMany(ExportationHistory, {
        foreignKey: "offerId",
        as: "exportationHistory",
    });

    // Relation between offer exportation history and print history
    ExportationHistory.hasMany(PrintHistory, {
        foreignKey: "historyId",
        as: "printHistoryRecords",
    });
    PrintHistory.belongsTo(ExportationHistory, {
        foreignKey: "historyId",
        as: "groupHistory",
    });

    Order.belongsTo(Offer, {
        foreignKey: "offerId",
        as: "offer",
    });

    Order.belongsTo(Chain, {
        foreignKey: "chainId",
        as: "chain",
    });

    // Order associations with Brand only (company derived via brand)
    Order.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Brand.hasMany(Order, { foreignKey: "brandId", as: "orders" });

    Company.hasMany(Brand, {
        foreignKey: "companyId",
        as: "brands",
        onDelete: "SET NULL",
    });
    Brand.belongsTo(Company, {
        foreignKey: "companyId",
        as: "company",
        onDelete: "SET NULL",
    });

    // KeyCodeDetails belongs to Brand (company derived via brand)
    KeyCodeDetails.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });
    Brand.hasMany(KeyCodeDetails, {
        foreignKey: "brandId",
        as: "keyCodeDetails",
    });

    // Address belongs to Brand; company is available via Brand.company
    Address.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });
    Brand.hasMany(Address, {
        foreignKey: "brandId",
        as: "addresses",
    });

    // Campaign associations with Brand only (company is derived through brand)
    Campaign.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });
    Brand.hasMany(Campaign, {
        foreignKey: "brandId",
        as: "campaigns",
    });

    // Chain associations with Brand only (company derived through brand)
    Chain.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Brand.hasMany(Chain, { foreignKey: "brandId", as: "chains" });

    // ClientOffer associations with Brand only (company derived via brand)
    ClientOffer.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Brand.hasMany(ClientOffer, { foreignKey: "brandId", as: "clientOffers" });

    // Client associations with Brand only (company is derived through brand)
    Client.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Brand.hasMany(Client, { foreignKey: "brandId", as: "clients" });

    // ExportationHistory associations with Company and Brand
    // ExportationHistory associations with Brand only (company derived via brand)
    ExportationHistory.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Brand.hasMany(ExportationHistory, {
        foreignKey: "brandId",
        as: "exportationHistory",
    });

    // Invoice associations with Brand (company derived via brand)
    const { default: Invoice } = await import(
        "../modules/accounting/models/invoice.js"
    );
    Invoice.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Brand.hasMany(Invoice, { foreignKey: "brandId", as: "invoices" });

    // Payment associations with Brand (company derived via brand) (Payment is already imported at the top)
    Payment.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Brand.hasMany(Payment, { foreignKey: "brandId", as: "payments" });

    // Offer associations with Brand only (company derived via brand)
    Offer.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Brand.hasMany(Offer, { foreignKey: "brandId", as: "offers" });

    // OfferPrint associations with Brand only (company derived via brand)
    OfferPrint.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });
    Brand.hasMany(OfferPrint, { foreignKey: "brandId", as: "offerPrints" });

    // Country associations with Company
    const { default: Country } = await import(
        "../modules/settings/models/country.js"
    );

    // Country associations with Brand only (company derived via brand)
    Country.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });
    Brand.hasMany(Country, {
        foreignKey: "brandId",
        as: "countries",
    });

    // PayeeName associations with Brand (company derived via brand)
    PayeeName.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });
    Brand.hasMany(PayeeName, {
        foreignKey: "brandId",
        as: "payeeNames",
    });

    // PaymentMethod associations with Brand (company derived via brand)
    const { default: PaymentMethod } = await import(
        "../modules/settings/models/paymentMethod.js"
    );
    PaymentMethod.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });
    Brand.hasMany(PaymentMethod, {
        foreignKey: "brandId",
        as: "paymentMethods",
    });

    // Shipment associations with Brand (company derived via brand)
    Shipment.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });
    Brand.hasMany(Shipment, {
        foreignKey: "brandId",
        as: "shipments",
    });

    // ClientsImportHistory associations with Brand
    ClientsImportHistory.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });
    Brand.hasMany(ClientsImportHistory, {
        foreignKey: "brandId",
        as: "importHistory",
    });
}

export default addAssociations1;
