export const generateRandomUserId = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  let result = "";
  for (let i = 0; i < 3; i++)
    result += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i++)
    result += numbers[Math.floor(Math.random() * numbers.length)];
  return result;
};

export const generateUserIdFromAddress = (address) => {
  if (!address || typeof address !== "string") return generateRandomUserId();
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  let result = "";
  for (let i = 0; i < 3; i++) {
    const charCode = address.charCodeAt(i + 2) || 0;
    result += letters[charCode % letters.length];
  }
  for (let i = 0; i < 3; i++) {
    const charCode = address.charCodeAt(i + 5) || 0;
    result += numbers[charCode % numbers.length];
  }
  return result;
};

export default generateUserIdFromAddress;
