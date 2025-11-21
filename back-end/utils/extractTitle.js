// Get the title depending on the country and gender. no need for adding it to virtual field. this will be calculated once for offer print

/**
 * Chose the title of the person depending on his gender and country. Returns empty string in case not known
 * @param {string} gender
 * @param {string} country
 * @returns {string}
 */
export default function extractTitle(gender, country) {
    const loweredCaseCountry = country?.toLowerCase();
    const loweredCaseGender = gender?.toLowerCase();

    if (loweredCaseCountry === "germany") {
        if (loweredCaseGender === "male") return "Herr";

        if (loweredCaseGender === "female") return "Frau";
    }

    if (loweredCaseCountry === "france") {
        if (loweredCaseGender === "male") return "M.";

        if (loweredCaseGender === "female") return "Mme";
    }

    return "";
}
