const API_KEY = "AIzaSyAFVfB8J_cGYs4X8yvXgkM6YQiiDlKB3wg";

async function listAllModels() {
    try {
        console.log("--- LISTING MODELS ---");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

        console.log("Fetching models from REST API using native fetch...");
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available models for this Key:");
            data.models.forEach(m => {
                const shortName = m.name.split('/').pop();
                console.log(`- ${m.name} (${m.displayName}) -> Use '${shortName}'`);
            });
        } else {
            console.log("No models returned. Response:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("FAILED to list models:", error.message);
    }
}

listAllModels();
