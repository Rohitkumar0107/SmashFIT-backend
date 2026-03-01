const nodemailer = require("nodemailer");

async function testFamily() {
    const t1 = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // TLS via STARTTLS
        logger: true,
        debug: true,
        connectionTimeout: 5000,
        family: 4 // Force IPv4
    });

    console.log("Keys before verify:", Object.keys(t1.options));
    try {
        await t1.verify();
        console.log("Verify OK without auth!");
    } catch (e) {
        if (e.code === 'EAUTH' || e.responseCode === 530 || e.message.includes('auth')) {
            console.log("Verify EAUTHed as expected (connection succeeded):", e.message);
        } else {
            console.error("Verify failed:", e.message, e);
        }
    }
}

testFamily();
