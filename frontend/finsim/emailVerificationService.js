// Mock implementation of sending an email verification code
export const sendEmailVerification = async (email) => {
  // Replace this with your actual email sending logic
  console.log(`Sending verification code to ${email}`);
  // Simulate a delay
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

// Mock implementation of verifying the email verification code
export const verifyEmailVerificationCode = async (email, code) => {
  // Replace this with your actual verification logic
  console.log(`Verifying code ${code} for ${email}`);
  // Simulate a delay and a successful verification
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (code === "123456") {
        resolve();
      } else {
        reject(new Error("Invalid verification code"));
      }
    }, 1000);
  });
};