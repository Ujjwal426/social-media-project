import nodemailer from "nodemailer";

export const sendEmail = async (options) => {
  var transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "01e2eb58af6a3b",
      pass: "215708a73b117a",
    },
  });

  const mailOptions = {
    from: "01e2eb58af6a3b",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};
