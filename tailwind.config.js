/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./*.{js,ts,jsx,tsx}"
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#1791cf",
                "background-light": "#f6f7f8",
                "background-dark": "#0a0a0a",
                "border-muted": "#262626",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"]
            }
        },
    },
    plugins: [],
}
