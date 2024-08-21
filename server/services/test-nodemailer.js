const nodemailer = require('nodemailer');

console.log('Nodemailer version:', nodemailer.version);
console.log('Node.js version:', process.version);

// SMTP configuration (replace with your actual SMTP settings)
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'testimonyatsu99@gmail.com',
    pass: 'ubomqglbllhwoklf' // replace with your actual password or app password
  }
};

async function testNodemailer() {
  try {
    // Create a transporter
    let transporter = nodemailer.createTransport(smtpConfig);

    console.log('Attempting to verify transporter...');
    // Verify the transporter configuration
    await transporter.verify();
    console.log('Transporter verified successfully');

    // Define email options
    let mailOptions = {
      from: '"Test Sender" <testimonyatsu99@gmail.com>',
      to: 't.monywebservices@gmail.com', // replace with a valid email address for testing
      subject: 'Test Email from Nodemailer',
      text: 'If you receive this email, it means your nodemailer configuration is working correctly.',
      html: '<p>If you receive this email, it means your nodemailer configuration is working correctly.</p>'
    };

    console.log('Attempting to send test email...');
    // Send the test email
    let info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error occurred:', error);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
  }
}

testNodemailer();
