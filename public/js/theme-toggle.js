(function () {
    const themeToggle = document.getElementById("themeToggle");

    if (!themeToggle) {
        return;
    }

    const icon = themeToggle.querySelector("i");

    function setTheme(theme) {
        const isDark = theme === "dark";

        document.documentElement.setAttribute("data-bs-theme", theme);
        try {
            localStorage.setItem("nestify-theme", theme);
        } catch (error) {
            // Theme still changes for the current page if browser storage is unavailable.
        }

        if (icon) {
            icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
        }

        const label = isDark ? "Switch to light mode" : "Switch to dark mode";
        themeToggle.setAttribute("aria-label", label);
        themeToggle.setAttribute("title", label);
    }

    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem("nestify-theme") === "dark" ? "dark" : "light";
    } catch (error) {
        savedTheme = "light";
    }

    setTheme(savedTheme);

    themeToggle.addEventListener("click", function () {
        const currentTheme = document.documentElement.getAttribute("data-bs-theme") || "light";
        setTheme(currentTheme === "dark" ? "light" : "dark");
    });
})();
