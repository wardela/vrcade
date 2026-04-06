let cachedCompanyWithLogo = null;
let inflightCompanyRequest = null;

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("Failed to read logo blob"));
    reader.readAsDataURL(blob);
  });

const preloadImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      resolve();
      return;
    }

    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to preload company logo"));
    image.src = src;
  });

const loadLogoAsDataUrl = async (logoUrl) => {
  if (!logoUrl) return "";

  const response = await fetch(logoUrl, {
    mode: "cors",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch logo asset (${response.status})`);
  }

  const blob = await response.blob();
  return blobToDataUrl(blob);
};

export const getCompanyLogoSrc = (company) =>
  company?.logo_data_url || company?.logo_src || company?.logo_url || "";

export const prepareCompanyWithLogo = async (company) => {
  if (!company) return null;

  const nextCompany = { ...company };
  let logoSrc = getCompanyLogoSrc(nextCompany);

  if (nextCompany.logo_url && !nextCompany.logo_data_url) {
    try {
      nextCompany.logo_data_url = await loadLogoAsDataUrl(nextCompany.logo_url);
      logoSrc = nextCompany.logo_data_url;
    } catch (error) {
      console.warn("Failed to convert company logo to data URL", error);
      logoSrc = nextCompany.logo_url;
    }
  }

  nextCompany.logo_src = logoSrc;

  if (logoSrc) {
    try {
      await preloadImage(logoSrc);
    } catch (error) {
      console.warn("Failed to preload company logo", error);
    }
  }

  return nextCompany;
};

export const fetchCompanyWithLogo = async (apiClient, { force = false } = {}) => {
  if (!force && cachedCompanyWithLogo) {
    return cachedCompanyWithLogo;
  }

  if (!force && inflightCompanyRequest) {
    return inflightCompanyRequest;
  }

  inflightCompanyRequest = apiClient
    .get("/api/invoices/company")
    .then(async (response) => {
      const preparedCompany = await prepareCompanyWithLogo(response.data || null);
      cachedCompanyWithLogo = preparedCompany;
      return preparedCompany;
    })
    .finally(() => {
      inflightCompanyRequest = null;
    });

  return inflightCompanyRequest;
};
