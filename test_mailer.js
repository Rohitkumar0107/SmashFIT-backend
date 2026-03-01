const nodemailer = require("nodemailer");
const dns = require("dns");

async function testConfig() {
    const SMTP_HOST = "smtp.gmail.com";
    let hostToUse = SMTP_HOST;
    const lookup = await dns.promises.lookup(SMTP_HOST, { family: 4 });
    hostToUse = lookup.address;
    console.log("IPv4 resolved:", hostToUse);

    const t1 = nodemailer.createTransport({
        host: hostToUse,
        port: 587,
        secure: false, // TLS via STARTTLS
        name: SMTP_HOST,
        tls: {
            servername: SMTP_HOST
        }
    });

    console.log("Keys before verify:", Object.keys(t1.options));
    try {
        // Nodemailer's verify just tests the connection, HELO, and STARTTLS
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

testConfig();
