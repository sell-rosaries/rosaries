/**
 * Device Lock Script
 * Blocks access to non-mobile browsers (Laptops, PCs, or "Request Desktop Site" on mobile).
 * Redirects to locked.html if the condition is met.
 */
(function () {
    // 0. Admin Bypass Check
    // If the Admin has authenticated via the lock screen, allow access regardless of device.
    if (sessionStorage.getItem('valid_admin_access') === 'true') {
        return; // Skip the lock check
    }

    // 1. Basic detection: "Mobi" string is present in mobile user agents.
    //    It is absent in Desktop User Agents and "Request Desktop Site" mode on mobile.
    var isMobile = /Mobi|Android/i.test(navigator.userAgent);

    if (!isMobile) {
        // Attempts to stop further processing of the current page
        try {
            if (window.stop) {
                window.stop();
            }
            document.execCommand("Stop");
        } catch (e) { }

        // Redirect to the locked page
        window.location.replace("locked.html");
    }
})();
