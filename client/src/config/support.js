// yahan apni asli support details daal
export const SUPPORT = {
    phone: "+91 123456789",
    whatsapp: "123456789", // country code ke saath, bina + aur space ke
    email: "support@example.com",
    hours: "Mon to Sat, 10 AM to 6 PM",
};

export const phoneHref = `tel:${SUPPORT.phone.replace(/[^\d+]/g, "")}`;

export const whatsappHref = `https://wa.me/${SUPPORT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi, I need help with Farmhouse Rental."
)}`;

export const mailHref = `mailto:${SUPPORT.email}`;