const getBaseUrl = () => {
    // Check if the user is visiting via the new custom domain
    if (typeof window !== "undefined" && window.location.hostname === "mediquick.no-idea.top") {
        return "https://mediquick.no-idea.top";
    }
    
    // Default to production Vercel link
    return "https://medi-quick-fawn.vercel.app";
    // return "http://localhost:5173";
}

export default getBaseUrl;
