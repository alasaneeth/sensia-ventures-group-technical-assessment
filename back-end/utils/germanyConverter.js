// In database we store germany as the country, but in the client
// We show Germany/Deutschland

/**
 *
 * @param {string} country
 * @returns {string} - if the country is germany it will return Germany/Deutschland. Otherwise the passed country
 */
export function checkGermany(country) {
    // In case of null, undefined and empty string
    if (!country) return country;

    if (country.toLowerCase() === "germany") {
        return "germany/deutschland";
    }

    return country;
}

/**
 * 
 * @param {string} country 
 * @returns {string} - If the country is Germany/Deutschland it will return germany. otherwise the passed country
 */
export function sendGermany(country) {
    if (!country) return country;

    if (country.toLowerCase().includes("deutschland")) {
        return "germany";
    }

    return country;
}
