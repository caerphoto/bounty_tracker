// This is an example file demonstrating what is in the `secrets.js` file
// actually used by the app. That file should NOT be included in source control,
// unless you want the whole world to know your passwords!

exports.session_secret = "shh don't tell anyone!";
exports.notification_email = "notification@yourdomain.com";
exports.error_email = "error@yourdomain.com";
exports.from_email = "no-reply@tracker-host.com";

exports.smtp_options = {
    port: 587,
    auth: {
        user: "mail_username",
        pass: "mail_password"
    }
};
