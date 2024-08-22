const nodemailer = require('nodemailer');
const template = require('../config/template');
const keys = require('../config/keys');

const { port, user, host, password } = keys.smtp;

class MailService {
  init() {
    try {
      return nodemailer.createTransport({
        host: host,
        port: parseInt(port || '587', 10),
        secure: port === '465', // use SSL
        auth: {
          user: user,
          pass: password
        },
        tls: {
          rejectUnauthorized: false // Add this line to ignore unauthorized SSL/TLS certificates
        }
      });
    } catch (error) {
      console.error('Failed to initialize nodemailer transporter:', error);
      return null;
    }
  }
}

const mailer = new MailService().init();

exports.sendEmail = async (email, type, host, data) => {
  if (!mailer) {
    console.error('Mailer is not initialized. Cannot send email.');
    return new Error('Mailer is not initialized');
  }

  try {
    console.log(`Preparing to send ${type} email to ${email}`);
    const message = prepareTemplate(type, host, data);

    const mailOptions = {
      from: `U-SHOP Store! <${user}>`,
      to: email,
      subject: message.subject,
      text: message.text,
      html: message.html // Added HTML option
    };

    console.log('Attempting to send email...');
    const info = await mailer.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    return error;
  }
};

const prepareTemplate = (type, host, data) => {
  let message;

  switch (type) {
    case 'reset':
      message = template.resetEmail(host, data);
      break;

    case 'reset-confirmation':
      message = template.confirmResetPasswordEmail();
      break;

    case 'signup':
      message = template.signupEmail(data);
      break;

    case 'merchant-signup':
      message = template.merchantSignup(host, data);
      break;

    case 'merchant-welcome':
      message = template.merchantWelcome(data);
      break;

    case 'newsletter-subscription':
      message = template.newsletterSubscriptionEmail();
      break;

    case 'contact':
      message = template.contactEmail();
      break;

    case 'merchant-application':
      message = template.merchantApplicationEmail();
      break;

    case 'merchant-deactivate-account':
      message = template.merchantDeactivateAccount();
      break;

    case 'order-confirmation':
      message = template.orderConfirmationEmail(data);
      break;

    default:
      console.warn(`Unknown email type: ${type}`);
      message = '';
  }

  return message;
};
