import { useState, useEffect, useMemo } from "react";
import { Select } from "antd";
import countryCurrencies from "../../util/currencyMap";
/**
 * Expanded & corrected currencyNames:
 * - Added missing symbols used by countryCurrencies (e.g., ؋, ֏, ৳, ៛, etc.)
 * - Fixed Madagascar "Ar" -> "Malagasy Ariary"
 * - Included Arabic-script variants (د.ب, د.ا, ع.د, ل.د)
 * - Added FC (Congolese Franc), Fr (Swiss Franc, alt), etc.
 * NOTE: Some symbols are shared by multiple countries/currencies (e.g., L, Br, K),
 * so names mention both or are generic to avoid being misleading.
 */
const currencyNames = {
    $: "Dollar",
    "€": "Euro",
    "£": "Pound",
    "¥": "Yen/Yuan",
    "₹": "Indian Rupee",
    "₽": "Russian Ruble",
    CHF: "Swiss Franc",
    "₣": "Swiss Franc (alt)",
    "₺": "Turkish Lira",
    "₴": "Ukrainian Hryvnia",
    "₩": "South/North Korean Won",
    kr: "Krone/Krona",
    R: "South African Rand",
    R$: "Brazilian Real",
    "₱": "Philippine Peso",
    RM: "Malaysian Ringgit",
    "₨": "Rupee",
    "฿": "Thai Baht",
    zł: "Polish Złoty",
    Ft: "Hungarian Forint",
    Kč: "Czech Koruna",
    "₪": "Israeli New Shekel",
    "₦": "Nigerian Naira",
    "₲": "Paraguayan Guaraní",
    "₡": "Costa Rican Colón",
    "₫": "Vietnamese Dong",
    "₭": "Lao Kip",
    "₮": "Mongolian Tögrög",
    "₸": "Kazakhstani Tenge",
    "₼": "Azerbaijani Manat",
    "₾": "Georgian Lari",
    CFA: "CFA Franc",
    "﷼": "Riyal",
    "د.إ": "UAE Dirham",
    "د.ك": "Kuwaiti Dinar",
    "د.ب": "Bahraini Dinar",
    "ل.ل": "Lebanese Pound",
    دج: "Algerian Dinar",
    "د.ت": "Tunisian Dinar",
    "د.م.": "Moroccan Dirham",
    L: "Lek/Lempira/Loti/Leu (L)",
    P: "Botswana Pula",
    Q: "Guatemalan Quetzal",
    "S/": "Peruvian Sol",
    "Bs.": "Bolivian Boliviano",
    "B/.": "Panamanian Balboa",
    C$: "Nicaraguan Córdoba",
    lei: "Romanian Leu",
    Ar: "Malagasy Ariary",
    Sh: "Shilling",
    "؋": "Afghan Afghani",
    "֏": "Armenian Dram",
    KM: "Bosnia & Herzegovina Convertible Mark",
    FBu: "Burundian Franc",
    Kz: "Angolan Kwanza",
    Br: "Belarusian Ruble / Ethiopian Birr",
    CF: "Comorian Franc",
    Fdj: "Djiboutian Franc",
    Fr: "Swiss Franc (alt)",
    G: "Haitian Gourde",
    Nfk: "Eritrean Nakfa",
    E: "Eswatini Lilangeni",
    D: "Gambian Dalasi",
    FG: "Guinean Franc",
    "₵": "Ghanaian Cedi",
    MK: "Malawian Kwacha",
    RM: "Malaysian Ringgit",
    UM: "Mauritanian Ouguiya",
    MT: "Mozambican Metical",
    K: "Kina/Kyat (K)",
    ден: "Macedonian Denar",
    kr: "Krone/Krona",
    "₩": "Korean Won",
    Le: "Sierra Leonean Leone",
    "₺": "Turkish Lira",
    m: "Turkmen Manat",
    "so'm": "Uzbekistani Soʻm",
    Vt: "Vanuatu Vatu",
    ZK: "Zambian Kwacha",
    T: "Samoan Tālā",
    T$: "Tongan Paʻanga",
    Db: "São Tomé and Príncipe Dobra",
    "₸": "Kazakhstani Tenge",
    ЅМ: "Tajikistani Somoni",
    "₴": "Ukrainian Hryvnia",
    "د.ا": "Jordanian Dinar",
    "ع.د": "Iraqi Dinar",
    "ل.د": "Libyan Dinar",
    "ރ.": "Maldivian Rufiyaa",
    "৳": "Bangladeshi Taka",
    "៛": "Cambodian Riel",
    "₦": "Nigerian Naira",
    "₮": "Mongolian Tögrög",
    "₾": "Georgian Lari",
    "₼": "Azerbaijani Manat",
    "₥": "—",
    FC: "Congolese Franc",
};
/**
 * Get unique currencies from the currency map
 */
function getUniqueCurrencies() {
    const unique = new Set();
    Object.values(countryCurrencies).forEach((sym) => unique.add(sym));
    return Array.from(unique).sort();
}

/**
 * CurrencyDropdown
 */
function CurrencyDropdown({ value, onChange, disabled = false }) {
    const [selectedCurrency, setSelectedCurrency] = useState(value || "$");

    const currencies = useMemo(() => getUniqueCurrencies(), []);

    const handleChange = (newValue) => {
        setSelectedCurrency(newValue);
        onChange?.(newValue);
    };

    useEffect(() => {
        if (value && value !== selectedCurrency) setSelectedCurrency(value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
        <Select
            showSearch
            placeholder="Select a currency"
            optionFilterProp="children"
            value={selectedCurrency}
            onChange={handleChange}
            disabled={disabled}
            style={{ width: "100%" }}
            filterOption={(input, option) =>
                String(option?.children ?? "")
                    .toLowerCase()
                    .includes((input || "").toLowerCase())
            }
        >
            {currencies.map((sym) => {
                const name = currencyNames[sym] || "Unknown currency";
                return (
                    <Select.Option key={sym} value={sym}>
                        {sym} — {name}
                    </Select.Option>
                );
            })}
        </Select>
    );
}

export default CurrencyDropdown;
