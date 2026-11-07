import api from "./api";

// photos ko backend pe bhejta hai, unke links wapas deta hai
export async function uploadImages(files) {
    const data = new FormData();
    files.forEach((file) => data.append("images", file));

    const res = await api.post("/uploads", data);
    return res.data.urls;
}